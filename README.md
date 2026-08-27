# STE Schema (SpatioTemporal Entity)

*Schema repository of the **时迹 · TimeTrace** project — a memory map over time. Every place carries its history.*

Add a time layer to the map. Every entity (school, building, street, park…) is not just "what it is now", but **what it used to be, when it changed, and why**.

A STE (SpatioTemporal Entity) is a set of spatiotemporal snapshots for a place: coordinates + a timeline ordered by time. Compatible with OSM/OHM tag naming conventions; time is a first-class citizen.

- **Schema v0.2 (current)**: `v0.2/schema.json` — external_ids, snapshot-level coordinates, provenance, narratives, evidence chain, mandatory sources (Ethics Charter R1)
- **Schema v0.1 (legacy)**: `v0.1/schema.json` — base schema; kept for compatibility with existing data
- **Chinese translations**: each version has a `schema.zh.json` that must be structurally identical (only `description` / `title` / `examples` may differ)
- **Ethics Charter**: [ETHICS.md](ETHICS.md) (Chinese original) / [ETHICS.en.md](ETHICS.en.md) (English) — the normative document that v0.2 schema rules reference (R1–R9, committee mechanism, platform commitments)
- [中文文档](README-zh.md)

## Directory Structure

```
ste-schema/
├── v0.1/
│   ├── schema.json          # English canonical (legacy)
│   └── schema.zh.json       # Chinese translation
├── v0.2/
│   ├── schema.json          # English canonical (current)
│   └── schema.zh.json       # Chinese translation
├── examples/
│   ├── valid/               # v0.1 samples that MUST pass validation
│   └── invalid/             # v0.1 samples that MUST fail (negative tests)
├── test/
│   ├── valid/               # v0.2 samples that MUST pass validation
│   └── invalid/             # v0.2 negative tests (25 fixtures, one per rule)
├── validator/
│   └── ste-validator.js       # Canonical reference validator (zero-dep UMD, 103 checks)
├── ETHICS.md                # Ethics Charter v0.2 (Chinese original)
├── ETHICS.en.md             # Ethics Charter v0.2 (English)
├── docs/
│   ├── schema-v0.2-notes.md # v0.2 change log & design notes
│   └── proposals/           # Draft proposals (v0.3 lifecycle, challenge profile)
├── scripts/
│   ├── check-parity.mjs     # En/zh structural parity check
│   ├── check-validator-sync.mjs # validator/ vs demo/ copy drift guard
│   └── local-validate.mjs   # Pre-push local validation (both versions)
├── LICENSE                  # MIT (code) + licensing map
├── LICENSE-CC0-1.0          # Schema text / profiles / Ethics Charter
├── LICENSE-ODbL-1.0         # Curated datasets
├── GOVERNANCE.md            # Project governance (draft v0.1): roles, licensing, quality gates
└── .github/
    └── workflows/
        └── validate.yml     # CI: strict compile + valid/invalid fixtures + parity + validator sync
```

## Design Principles

1. **KISS**: Keep only fields that 80% of entities will use. Start small, expand later.
2. **Compatibility first, extension second**: Tag names reuse OSM/OHM (`start_date`, `amenity`). STE-specific fields get a `ste_` prefix.
3. **Time is a first-class citizen**: Values that change over time go into `timeline[]`. Invariant values stay at the top level.
4. **Evidence and confidence are mandatory for AI-generated data**: Must include `sources` + `confidence` + `evidence`.
5. **Human-readable over machine-readable**: No cryptic abbreviations. A history professor should be able to read it.

## Core Structure (v0.2)

| Field | Type | Description |
|-------|------|-------------|
| `ste_id` | string | Globally unique ID, UUID v4 (lowercase) |
| `ste_version` | string | Schema version, `const: "0.2"` — version-locked so documents claiming another version cannot pass v0.2 validation |
| `name` | object | Current name (denormalized cache). `localized` keyed by BCP 47 tags; derived from the LAST timeline snapshot |
| `coordinates` | object | Default WGS84 representative point (lat -90~90, lon -180~180); per-snapshot overrides for relocation |
| `external_ids` | object | Cross-references: wikidata (Q-number), osm/ohm (`type/id`), wikipedia (`langwiki:Title`), baidu_baike (reference-only) |
| `tags` | object | Free-form OSM-compatible tags; community keys use `ste:` prefix |
| `narratives` | array | Multi-perspective narratives — NOT factual claims. Three axes: `source_of_knowledge` / `author_identity` / `style`; retraction leaves tombstones (R6) |
| `timeline` | array | **The core**. Array of time snapshots, each representing one period |

### Timeline Snapshot (v0.2)

| Field | Required | Description |
|-------|----------|-------------|
| `start_date` | ✅ | OHM-style date: `YYYY` / `YYYY-MM` / `YYYY-MM-DD`; BCE uses ISO 8601 astronomical numbering (`0000` = 1 BCE) |
| `end_date` | — | **Inclusive** at stated granularity; omit = "until now" (only on the last snapshot) |
| `name` | ✅ | Name during this period |
| `type` | ✅ | Entity type during this period, reusing OSM values |
| `status` | — | `active` / `demolished` / `under_construction` / `proposed` / `relocated`. A **rename is an event, not a status** |
| `coordinates` | — | Snapshot-level override; REQUIRED when `status=relocated` |
| `description` | — | Shortest NEUTRAL factual summary; interpretation goes to `narratives[]` |
| `description_provenance` | — | Provenance of description (`manual` / `ai_generated` / `community_consensus` / `imported`); REQUIRED when description present |
| `confidence` | — | Self-reported confidence 0–1 for this snapshot |
| `sources` | ✅ | REQUIRED per R1 — no source, no formal dataset entry (30-day draft grace) |
| `contributed_by` | — | Provenance metadata (actor namespaced `user:`/`anon:`/`agent:`/`system:`/`community`) |
| `evidence` | — | Evidence chain: external URL / platform asset / offline item; `ai_generated` flag orthogonal to medium |

### Inline Conditional Constraints (if/then in schema)

- `status = demolished` → `end_date` required
- `status = relocated` → snapshot `coordinates` required
- `description` present → `description_provenance` required; `ai_generated` → snapshot `confidence` required
- `retracted=true` (narrative) → `text` must be empty + `retracted_at` required (tombstone)
- `retracted=true` (evidence) → `url`/`ste_asset_id` forbidden + `retracted_at` required
- `source_of_knowledge=ai_generated` (narrative) → `confidence` + `ai_model` required
- `author_identity=escrowed_anonymous` → `author` must be `anon:` (and must NOT be `anon:` otherwise)
- `created_via=ai_extraction` → `ai_model` required; forbidden otherwise
- `verified_at` present → `verified` must be `true`

## Application-Level Validation

Rules that JSON Schema cannot express. **Passing schema validation ≠ clean data.** (v0.2 checklist; v0.1 used a 7-item subset)

1. **Calendar validity**: `02-30`, non-leap-year `02-29` etc. pass the schema pattern but must be rejected by applications.
2. **Timeline ordering**: sorted by `start_date` ascending; periods non-overlapping (per the inclusive convention); at most one snapshot without `end_date` and it must be the last; a snapshot without `end_date` must not be `demolished`.
3. **`format` keyword** (`date-time` / `uri`) is an annotation in draft-07 — validators must enable format assertion explicitly, or applications must check.
4. **`default` values** are not filled by validators — readers must apply defaults themselves.
5. **name/aliases derivation**: recompute from the timeline and compare; on conflict the timeline wins (name is a cache, not a source of truth).
6. **tags key prefix**: non-OSM-convention keys must carry the `ste:` prefix (schema cannot tell which keys are OSM conventions).
7. **anon: token unlinkability**: the same user's anon tokens must not be reused across contributions or be reverse-linkable — a cryptographic/platform-level guarantee; schema only constrains format.
8. **Longitude normalization**: normalize -180 to +180 (or vice versa) before comparison.
9. **external_ids liveness**: patterns only guarantee format; periodic checks are needed for whether Q95 still exists, whether an OSM way was deleted (pair with the `note` field).
10. **Draft lifecycle**: 30-day grace, expiry handling, and draft → formal promotion (re-validated at promotion time) all live platform-side.
11. **Retraction tombstone rendering**: `retracted=true` renders as a tombstone in the frontend; schema guarantees the data shape, not the display behavior.
12. **baidu_baike content must not be ingested**: store the link only; scraping content violates its license.

## Ethics Charter

[ETHICS.md](ETHICS.md) (Chinese original) / [ETHICS.en.md](ETHICS.en.md) (English) — v0.2. Four parts: beliefs, data rules (R1–R9), dispute mechanism (three-tier, committee as last resort), platform commitments (C1–C3). Schema rules reference charter clauses (R1 sources, R2 perspective/identity, R3 AI labeling, R6 retraction tombstones, R7 time-anchored territorial claims, C2 export boundary).

## Compatibility with OSM / OHM

- `type`, `tags`, `amenity`, `start_date`, `end_date` directly reuse OSM/OHM naming
- STE's own top-level fields use a `ste_` prefix for clear separation (already in use: `ste_id`, `ste_version`, `ste_asset_id`); non-OSM-convention **tag keys** use a `ste:` prefix (see Application-Level Validation rule 06)
- Goal: any existing OHM tool (Overpass API, JOSM) can partially recognize STE data
- STE is a **superset** of OSM/OHM, not a parallel universe

## Live Demo

[**曾经的母校 · Former Alma Maters**](https://wonderingWu.github.io/ste-schema/demo/) — a working map demo powered by STE data (the demo page also hosts the migrated old demo: 中山装年代记忆):

- **77 real entities** built from curated CSV data of disappeared/renamed/relocated schools in Beijing & Shanghai (1950s–2026)
- Each school is a STE entity: stable UUID, WGS84 coordinates (OSM geocoded), full `timeline[]` snapshots (opened → renamed/moved/demolished → resumed)
- All data passes `v0.1/schema.json` (see `demo/data/schools.json`; 6 representative samples in `examples/valid/`)
- Regenerate anytime: `node scripts/build-schools.mjs` (CSV → STE) then `node scripts/build-demo.mjs` (inject into demo page)

## Local Validation

```bash
npm install
node scripts/local-validate.mjs   # both versions: valid must PASS, invalid must FAIL, strict compile + parity
```

CI (`.github/workflows/validate.yml`) runs the same gates on push/PR: strict schema compile (en + zh, v0.1 + v0.2) → valid fixture validation → invalid negative tests → en/zh parity → validator sync check.

## Reference Validator

[`validator/ste-validator.js`](validator/) is the **canonical reference validator** for STE v0.2: a zero-dependency UMD single file (browser + Node) covering the schema rules plus the application-level rules JSON Schema cannot express (calendar validity, timeline ordering/overlap, single open-ended last snapshot, …). Passing ajv validation alone does NOT guarantee clean data — run this validator too. `demo/ste-validator.js` is a bundled copy kept byte-identical by CI.

## Compatibility

- [`docs/compatibility/2026-08-27-osm-overpass-report.md`](docs/compatibility/2026-08-27-osm-overpass-report.md) — first third-party data validation: 14 OSM/Overpass historic features (Beijing) imported by `scripts/import-osm-overpass.mjs`; 6/6 mappable records PASS both ajv and the reference validator, 8 quarantined with stated reasons (no-invention policy).
- [`docs/repo-layout.md`](docs/repo-layout.md) — repository zone discipline and split triggers (why schema/demo/charter share one repo for now).

## License

Layered licensing (per [GOVERNANCE.md](GOVERNANCE.md) §2, implements Ethics Charter rule R8):

- **Code** (`scripts/`, `validator/`, demo source, CI): [MIT](LICENSE)
- **Schema text** (`v0.1/`, `v0.2/`, `docs/`, official profiles) and the **Ethics Charter** (`ETHICS.md`, `ETHICS.en.md`): [CC0 1.0](LICENSE-CC0-1.0) — standards text reusable with zero friction
- **Curated datasets** (`demo/data/*.json`): [ODbL 1.0](LICENSE-ODbL-1.0) — attribution + share-alike, OSM-ecosystem compatible

## Version Plan

- **v0.1**: Base schema + single-entity timeline. Evidence chain stores URLs only.
- **v0.2**: external_ids (Wikidata/OSM/OHM/Wikipedia/Baidu Baike), snapshot-level coordinates (relocation), `contributed_by` provenance with namespaced actors, multi-perspective `narratives[]` (R2 three axes), evidence chain (URL / platform asset / offline item, retraction tombstones), mandatory `sources` (R1), `name.localized` (BCP 47), evidence `date` in ohm_date convention, version-locked `const: "0.2"`.
- **v1**: Structured evidence cross-validation, entity relationships (`linked_events`), event model, structured source objects (v0.3 plan).
