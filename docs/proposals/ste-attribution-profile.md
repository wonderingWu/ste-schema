# Proposal: Satellite Profile `ste-attribution` v0.1 (draft)

> Status: **draft profile** — 2026-08-28. Satellite of the STE core; does NOT
> itself change `ste_version`, but **requires core ≥ 0.3**: the field slots it
> uses (`contribution_type`, `identity`, `rights` on `contribution_meta`) are
> provided by `v0.3-core-upgrade.md` §5A — the core owns the slots, this
> profile owns the semantics. Builds further on core §1 (structured sources)
> and on `v0.3-challenge-annotation.md` (`corroboration` kind).
>
> Premise (owner directive): the schema's ultimate value is the data, and the
> data's value belongs to its providers. A schema cannot guarantee *payout* —
> but it can guarantee **attributability**: every datum permanently carries
> who contributed it, in a form no export can strip. Attribution is the
> technical precondition of every value mechanism (reputation, licensing,
> revenue share) built later on top.

## 0. Design red lines

1. **No economics in the protocol.** No tokens, no pricing formulas, no
   royalty splits. The ledger is data; the economics are platform/community
   policy built on the ledger.
2. **Value mechanisms must never force real-name disclosure.** Contributors
   protected by R2 (escrowed anonymity) and R5 (living persons) keep full
   ability to claim their contributions without revealing identity (§2.2).
3. **Additive only.** Every field here is optional; a v0.3 document without
   any ste-attribution fields remains fully valid.

## 1. Contribution typing (raw material for any ledger)

Uses the core-provided slot `contribution_type` (core §5A) on
`contribution_meta`:

```jsonc
"contribution_type": "create"   // enum fixed by core §5A:
                                // create | edit | corroborate | geolocate |
                                // oral_history | translate | review
```

- Semantics defined HERE: WHAT the contribution did, not how much it is
  worth. Weighting formulas are out of scope (red line 1).
- `corroborate` cross-references the challenge profile: a resolved
  `corroboration` record counts as sourced reputation input — reputation is
  computed from verifiable corroboration chains, never from votes/likes.

## 2. Contributor identity

### 2.1 Self-sovereign identity (optional)

v0.2 actors are platform-namespaced strings (`user:foo`) — if the platform
dies, the attribution chain breaks. Uses the core-provided slot `identity`
(core §5A) on `contribution_meta`:

```jsonc
"identity": {
  "key_fingerprint": "pgp:9F3C…"     // or "did:example:…" — ONE of the two
}
```

- Holder of the private key can prove authorship of any contribution on any
  platform, forever. Schema stores only the public fingerprint.
- An actor string is still REQUIRED (human-readable); `identity` upgrades
  it, never replaces it.

### 2.2 Anonymous claim token (solves the anonymity paradox)

How does an escrowed-anonymous contributor later prove "this oral history
was mine" without unmasking? Commitment scheme:

```jsonc
"identity": {
  "claim_commitment": "sha256:4b8f…"   // hash of a secret only the
                                       // contributor holds
}
```

- At contribution time the platform stores only the hash. To claim later,
  the contributor reveals the secret; anyone can verify hash(secret) ==
  `claim_commitment`. Identity stays hidden throughout.
- Orthogonal to application rule 07 (anon token unlinkability): the
  commitment must NOT be reused across contributions in linkable ways;
  platform-side rotation rules apply.

## 3. Per-contribution rights signals (narrow scope)

v0.2/R8–R9 set platform-wide defaults (ODbL 1.0; AI training excluded
unless opt-in). The profile defines ONE per-contribution signal, using the
core-provided slot (core §5A):

```jsonc
"rights": { "ai_training": "inherit" }   // enum: inherit | opt_in
```

- `inherit` = platform default (R9: not used for training). `opt_in` =
  this contribution may be used for training, revocable per R9. There is no
  `opt_out` value — under R9 the default is already "no", so an explicit
  refusal would be redundant (caught in review).
- `contribution_type=oral_history` ⇒ `opt_in` FORBIDDEN (core-enforced
  if/then, R9's absolute exclusion for oral history).
- No `commercial_use` signal: ODbL already permits commercial use, so such
  a field would be vacuous — removed per KISS (caught in review). Anything
  beyond ODbL defaults belongs to platform policy, not this profile.

## 4. The attribution manifest (the ledger, G2 — the key piece)

Normative spec for a **generated** file `attribution.json` accompanying any
dataset export (C2's teeth):

```jsonc
// illustrative values only
{
  "manifest_version": "0.1",
  "generated_at": "2026-08-28T09:00:00Z",
  "dataset": { "entity_count": 89, "snapshot_count": 190 },
  "contributors": [
    {
      "actor": "user:lihua",
      "identity": { "key_fingerprint": "pgp:9F3C…" },
      "contributions": { "create": 40, "geolocate": 12, "oral_history": 3 },
      "first_contribution_at": "2026-08-10T…",
      "last_contribution_at": "2026-08-27T…",
      "license": "ODbL-1.0"
    }
  ]
}
```

Generation rules:
- Derived **mechanically** from entity documents (every snapshot/narrative/
  evidence's `contributed_by` + `contribution_type`); never hand-edited.
  Regeneration from the same dataset must be byte-stable except
  `generated_at` (deterministic ordering: actor asc).
- ODbL 4.2 (Notices): any public conveyance of the database or a derivative
  must keep the required notices — this manifest IS the machine-readable
  form of that obligation, and any public use of the data must keep or
  reproduce it. The reference validator gains a check: an export bundle
  claiming STE conformance without `attribution.json` triggers a warning
  (anti-stripping).
- Escrowed-anonymous contributors appear as their `anon:` tokens — present
  in the ledger, unlinked to real identity, claimable via §2.2.

## 5. Explicit non-goals

- Reputation scores, ranking, or any "value formula" (inputs only).
- Payment, royalty, token mechanics of any kind.
- Replacing platform auth/accounts (§2 fields are proofs, not logins).
- Mandatory identity: pseudonymous contribution with zero `identity` block
  remains fully valid and fully attributable within its platform namespace.

## 6. Open questions for review

1. `key_fingerprint` schemes: allow-list (`pgp:`, `did:`) vs. open prefix
   registry? Leaning allow-list for v0.1 (KISS).
2. Should the manifest aggregate `corroborate` counts from challenge
   records (reputation input) or stick to entity-document contributions
   only? Leaning: include, flagged `reputation_input: true`.
3. Manifest placement: inside export bundle vs. well-known URL
   (`/.well-known/ste-attribution.json`)? Bundle-first for v0.1.

## 7. Relationship to core v0.3

| Needs from core | Provided by |
|---|---|
| Field slots on `contribution_meta` (type/identity/rights) | core §5A |
| Machine-readable sources in the ledger | core §1 structured sources |
| Status-change attribution (merges/splits) | core §4 top-level contributed_by |
| Corroboration records | ste-challenge profile |

Admission path (GOVERNANCE §3.4): this profile ships with schema + README +
≥3 valid / ≥5 invalid fixtures + one real use case (demo dataset manifest).
