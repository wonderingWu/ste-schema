# STE Schema (SpatioTemporal Entity)

Add a time layer to the map. Every entity (school, building, street, park…) is not just "what it is now", but **what it used to be, when it changed, and why**.

A STE (SpatioTemporal Entity) is a set of spatiotemporal snapshots for a place: coordinates + a timeline ordered by time. Compatible with OSM/OHM tag naming conventions; time is a first-class citizen.

- **Schema v0.1 (canonical)**：`v0.1/schema.json` — the single source of truth
- **Chinese translation**：`v0.1/schema.zh.json` — must be structurally identical; only `description` / `title` / `examples` may differ
- [中文文档](README-zh.md)

## Directory Structure

```
ste-schema/
├── v0.1/
│   ├── schema.json          # English canonical
│   └── schema.zh.json       # Chinese translation
├── examples/
│   ├── valid/               # Samples that MUST pass validation
│   │   └── old-school.json
│   └── invalid/             # Samples that MUST fail validation (negative tests)
│       └── bad-uuid.json
├── scripts/
│   ├── check-parity.mjs     # En/zh structural parity check
│   └── local-validate.mjs   # Pre-push local validation
└── .github/
    └── workflows/
        └── validate.yml     # CI: schema compile + example validation + parity check
```

## Design Principles

1. **KISS**：Keep only fields that 80% of entities will use. Start small, expand later.
2. **Compatibility first, extension second**：Tag names reuse OSM/OHM (`start_date`, `amenity`). STE-specific fields get a `ste_` prefix.
3. **Time is a first-class citizen**：Values that change over time go into `timeline[]`. Invariant values stay at the top level.
4. **Evidence and confidence are mandatory for AI-generated data**：Must include `sources` + `confidence` + `evidence`.
5. **Human-readable over machine-readable**：No cryptic abbreviations. A history professor should be able to read it.

## Core Structure（v0.1）

| Field | Type | Description |
|-------|------|-------------|
| `ste_id` | string | Globally unique ID, UUID v4 (lowercase) |
| `ste_version` | string | Schema version. Required — enables future migrations（`^\\d+\\.\\d+(\\.\\d+)?$`） |
| `name` | object | Current name. ⚠️ A **denormalized cache** of the active timeline snapshot (for search/display). Source of truth is the timeline; on conflict, the timeline wins. |
| `coordinates` | object | WGS84 coordinates (lat: -90~90, lon: -180~180) |
| `tags` | object | Free-form OSM-compatible tags (both keys and values are strings) |
| `timeline` | array | **The core**. Array of time snapshots, each representing one period |

### Timeline Snapshot

| Field | Required | Description |
|-------|----------|-------------|
| `start_date` | ✅ | OHM-style date: `YYYY` / `YYYY-MM` / `YYYY-MM-DD`. Leading `-` = BCE（e.g. `-0221` = 221 BCE） |
| `end_date` | — | Omit = "until now"（only allowed on the last snapshot, and its status must not be `demolished`） |
| `name` | ✅ | Name during this period |
| `type` | ✅ | Entity type during this period, reusing OSM values（school/building/street/park…） |
| `status` | — | `active` / `demolished` / `under_construction` / `proposed`. Note: a **rename is an event, not a status** — the new snapshot after a rename keeps status `active`. |
| `description` | — | Narrative description of this period（natural language, not a Wikipedia entry） |
| `confidence` | — | Confidence score 0–1 |
| `sources` | — | Source list（URL / literature / oral history） |
| `evidence` | — | Evidence chain（v0.1 stores URLs; structured evidence coming in v1）. `type` ∈ photo/satellite/map/document/oral/ai_generated |

### Inline Conditional Constraints（if/then in schema）

- `status = demolished` → `end_date` is required
- Evidence includes `ai_generated` → `confidence` + `sources` are required

## Application-Level Validation

Rules that JSON Schema cannot express. **Passing schema validation ≠ clean data.**

1. `end_date >= start_date`（within the same snapshot）
2. Timeline ordered by `start_date` ascending
3. No overlapping periods between adjacent snapshots
4. At most one snapshot omits `end_date`, and it must be the last one
5. Calendar validity：`2021-02-30`, non-leap-year `02-29`, etc.
6. Top-level `name` must match the currently active timeline snapshot（should be derived from the timeline, not hand-written）
7. `lat=0, lon=0`（Null Island）flagged as suspicious data

## Compatibility with OSM / OHM

- `type`, `tags`, `amenity`, `start_date`, `end_date` directly reuse OSM/OHM naming
- STE-specific fields（narrative, evidence）use a `ste_` prefix for clear separation（none yet in v0.1; introduced from v1 onward）
- Goal：any existing OHM tool（Overpass API, JOSM）can partially recognize STE data
- STE is a **superset** of OSM/OHM, not a parallel universe

## Local Validation

```bash
npm install
node scripts/local-validate.mjs   # Valid samples must PASS; invalid samples must FAIL
node scripts/check-parity.mjs v0.1/schema.json v0.1/schema.zh.json
```

CI（`.github/workflows/validate.yml`）runs the same four steps on push/PR：schema compile → valid example validation → invalid negative test → en/zh parity check.

## Version Plan

- **v0.1**：Base schema + single-entity timeline. Evidence chain stores URLs only.
- **v1**：Structured evidence chain（multi-source cross-validation）, entity relationships（`linked_events`）, event model.
