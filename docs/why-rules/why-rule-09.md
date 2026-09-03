# Why Rule 09: `external_ids` Liveness

## The rule

`external_ids` stores cross-references to Wikidata, OSM, OHM,
Wikipedia, and Baidu Baike. Each `external_id_ref.id` is a
**format-valid** pointer (e.g. `Q5727329` for Wikidata,
`way/123456` for OSM/OHM, `zhwiki:北京大学` for Wikipedia).
The schema does **NOT** check whether the pointer is still
**alive** — whether the Q-item still exists, whether the OSM
way hasn't been deleted, whether the Wikipedia article hasn't
been merged into another title.

Liveness is a platform-side, periodic, out-of-band check.

## Why JSON Schema can't say this

Liveness requires a network call to the external system.
JSON Schema is an offline validator. Even if JSON Schema could
express a network check, doing so would couple validation to
network availability (a recipe for non-deterministic
validation, which the project's CI explicitly forbids).

## Why it matters

- A dataset citing `Q5727329` (which was merged into `Q12345`
  in Wikidata in 2024) gives a downstream consumer a 404. The
  consumer's tool can't distinguish "the data is wrong" from
  "the link is stale". The platform's job is to surface
  this.
- OSM ways and relations are regularly deleted (a contributor
  merges two ways, and the old one becomes "deleted" in OSM).
  An OHM-derived entity that points at a deleted OHM way is
  the canonical "stale pointer" case; the
  `docs/compatibility/2026-08-27-osm-overpass-report.md`
  documents the import's policy on this.
- Wikipedia title renames are silent from the schema's
  perspective. The sitelink convention `zhwiki:北京大学` is
  stable; the article title it points to may have moved to a
  disambiguation page. The `note` field on the
  `external_id_ref` is the platform's way to record the
  change.

## How to implement

1. **At ingest** (e.g. `scripts/import-osm-overpass.mjs`),
   check liveness once and stamp `verified: true` +
   `verified_at: <now>`. This is a **schema-level
   concern**: `scripts/local-validate.mjs` runs in CI
   (offline) and asserts that any `verified: true` is
   paired with a `verified_at` (and that the
   `verified_at` is a valid date-time format). The
   *liveness check itself* — hitting the external system
   to confirm the pointer still resolves — is a
   **platform-level concern** (Step 2 below) and is NOT
   run in CI; the project's CI explicitly forbids
   network-coupled validation.
2. **Periodically** (e.g. quarterly), the platform runs a
   liveness sweep: for every `external_id_ref.verified: true`,
   hit the external system to confirm. On failure, mark
   `verified: false` and set `note: "stale: <reason>"`. The
   data shape doesn't change; the provenance changes.
3. **At export** (C2), the platform includes both the
   `verified` status and the `note`. Consumers can decide
   whether to ignore stale pointers, render them with a
   warning, or filter them out.
4. **In the validator**, the liveness check is not enforced.
   The validator checks the format (Rule 03) and the
   `verified_at ⇒ verified=true` if/then; that's the data
   shape. Liveness is platform work.

## What's NOT in this rule

- The `verified: true` flag is **not** a "this is correct"
  flag. It's a "this was checked at `verified_at`" flag.
  Wikidata may have changed the data since.
- A pointer that's `verified: false` (or absent) is not
  invalid. It's just unverified; the consumer may still use
  it. The `note` field is the way to record "we tried and
  this is wrong" vs. "we never tried".

## Common failure modes

- Marking `verified: true` once at ingest and never
  re-checking. The point of liveness is *liveness* — a
  once-only check is no better than no check.
- Coupling validation to liveness. The CI must not
  network-call; the project has explicitly rejected this
  pattern. A network failure on Wikidata's side shouldn't
  break the demo's CI.
- A liveness sweep that doesn't record what it found. The
  `note` field is the audit trail; an undocumented "we
  checked it" is indistinguishable from "we didn't".

## Reference

- [`v0.2/schema.json` `external_id_ref` definition](../../v0.2/schema.json)
- [`docs/compatibility/2026-08-27-osm-overpass-report.md`](../compatibility/2026-08-27-osm-overpass-report.md)
  — the project's policy on stale pointers
- [`validator/ste-validator.js`](../../validator/ste-validator.js)
  — `external_ids` format check
