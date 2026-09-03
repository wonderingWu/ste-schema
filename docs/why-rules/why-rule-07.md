# Why Rule 07: `anon:` Token Unlinkability

## The rule

When a narrative's `author_identity` is `escrowed_anonymous` (ETHICS
Charter R2 three-tier system), the `author` field MUST be an
`anon:<token>` actor. The token:

- MUST NOT be the same across two contributions from the same
  underlying user.
- MUST NOT be linkable to the user's real identity or to any
  other `anon:` token from the same user.
- MUST be issued by the platform via a process that the platform
  documents but does not expose to the public.

## Why JSON Schema can't say this

The schema constrains the **format** via the `actor_id`
definition (`v0.2/schema.json:28`): the pattern
`^(user:[A-Za-z0-9._-]+|anon:[A-Za-z0-9._-]+|agent:[A-Za-z0-9._-]+|system:[A-Za-z0-9._-]+|community)$` and the **conditional linkage**
(`author_identity=escrowed_anonymous ⇒ author starts with anon:`,
and the converse). It cannot constrain the **cryptographic /
platform-level guarantee** that the tokens are unlinkable.

## Why it matters

- If two escrowed-anonymous narratives by the same user share an
  `anon:` token, anyone comparing the dataset can identify that
  the same person wrote both. R2's promise — that the user can
  contribute without their identity being linkable across
  contributions — is broken.
- If an `anon:` token can be reverse-linked to the real
  identity (e.g. by a platform-side table that maps the token to
  the user), the data export (C2) becomes a privacy breach. The
  export MUST contain only the token, not the mapping.
- The platform's data export and the platform's escrow record
  must be separable: the export contains the token, the escrow
  record contains the mapping, and the two are joined only at
  escrow-unsealing time (per ETHICS Charter §3.2, only by
  committee).

## How to implement

1. **Token issuance**: at contribution time, the platform
   generates a fresh, opaque token
   (`crypto.randomBytes(16).toString('base64url')`-style). Never
   reuse. Never expose the issuance log to the public dataset.
2. **Storage**: the exportable STE document stores the token in
   `narrative.author`. The mapping (token → user) lives in a
   separate, encrypted, platform-side store.
3. **Rotation**: the platform MAY rotate tokens at any time (e.g.
   on a user request to "reset my anonymity footprint" — a
   feature that should exist but is not yet in the validator).
   Rotation re-issues all of a user's tokens and re-exports the
   dataset. The CHANGELOG must record the rotation.
4. **No timestamps in tokens**: tokens are pure random bytes. If
   the token has structure (e.g. includes the user ID, the
   issue time, or a deterministic seed), the unlinkability
   guarantee fails.
5. **Escrow unsealing**: only triggers per ETHICS §3.2. The
   validator doesn't know about the unsealing — that's a
   platform operation, not a data-shape one.

## What's NOT in this rule

- The token is not a "public key" — escrowed anonymity in
  ETHICS R2 is about platform-mediated privacy, not
  self-sovereign identity. (Self-sovereign identity is a
  separate profile, `ste-attribution`, with `pgp:` and `did:`
  fingerprints.)
- The token is not a "claim token" (the `ste-attribution`
  profile adds `claim_commitment` for the
  prove-later-without-unmasking case; that's a different
  cryptographic mechanism).
- The token is not a "rate-limit key" — the platform may use a
  separate session identifier for rate limiting; that ID MUST
  NOT appear in the export.

## Common failure modes

- Logging the issuance with the user ID and storing the log in
  a public place (e.g. the demo's console). The token then
  leaks via the log; the application must scrub before log.
- Using a deterministic hash of the user ID + a per-user salt
  ("so the platform can recompute if the user loses their
  token"). This makes the token linkable to the user; the
  trade-off is explicit: the platform can either *find the
  user's tokens* (deterministic) or *unlink the tokens*
  (random). R2 requires the latter.
- Including the issue timestamp in the token (so the
  application can sort by it). Sort by the contribution's
  `created_at` instead; the token stays pure random.

## Reference

- ETHICS Charter R2 — three-tier identity system
  (real name / persistent pseudonym / escrowed anonymous)
- ETHICS Charter §3.2 — escrow unsealing procedure
- `PATENT-PLEDGE.md` §6.1 (CLA question) — separate concern
- `docs/proposals/ste-attribution-profile.md` — sibling profile
  for self-sovereign identity (PGP / DID), distinct from
  R2 escrow
