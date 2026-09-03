# STE v1.0 Profile of OGC Features & Geometries JSON (JSON-FG)

> Status: **draft profile** — 2026-09-02. Targets STE v1.0 + OGC JSON-FG 1.0 (**OGC 21-045r1, published 2026-04-30, **VERIFIED 2026-09-02 from the OGC announcement page and JSON-FG spec cover via the user's supplied link**). The "OGC 21-006" reference in an earlier draft of this document was a citation error caught in review and corrected here.
> This document is a mapping spec, not a schema. The generated JSON Schema
> for this profile lives in `profiles/ste-jsonfg-1.0/schema.json` (to be added
> when v1.0 ships); the rules here define the *intent* and the *gaps* the
> schema needs to encode.

## 0. Why JSON-FG, in one paragraph

STE's v0.2 was written as a "schema-as-code first" project — JSON Schema
draft-07, no dependence on any external feature format. That made it cheap
to ship, but it left STE outside the GeoJSON / OGC API Features ecosystem
(QGIS, MapLibre, GeoTools, GeoServer, stac, ogcapi-pyfeatures, etc. all
expect GeoJSON-flavored inputs). For v1.0 to become a real standard, not a
niche schema, **it has to be a profile of something a million tools already
parse**. OGC's [Features & Geometries JSON
(FG-JSON, OGC 21-045r1)](https://docs.ogc.org/is/21-045r1/21-045r1.html) is the
smallest such base that natively supports time, multiple coordinate
reference systems, and feature typing — exactly STE's three non-negotiables.
GeoJSON is too thin (no time, no CRS, no featureType); JSON-LD/Schema.org
is too far from the geospatial toolchain; ISO 19109 is too heavy for the
1.0 timeframe. JSON-FG is the right size.

## 1. Conformance class

> **Pre-1.0 status** (added 2026-09-02 in response to review): this
> Conformance Class is **forward-looking**. As of 2026-09-02:
>
> - The validator's JSON-FG mode (§8.1 action item) is **not yet
>   implemented**.
> - The JSON Schema for the profile
>   (`profiles/ste-jsonfg-1.0/schema.json`) does **not** exist yet.
> - The conformance class URL
>   `wonderingWu.github.io/ste-schema/profiles/ste-jsonfg-1.0/conf/core`
>   is a **placeholder URI**; it will be replaced by an
>   `opengis.net`-issued conformance URI when the OGC Innovation
>   Program activity ratifies it.
>
> A document claiming STE v1.0 Conformance Class 1 BEFORE these
> artifacts exist is non-conformant. The class becomes
> enforceable when the v1.0 release ships. Until then, the
> "MUST" requirements below are aspirational, not testable.

A document claiming **STE v1.0 Conformance Class 1** MUST:

1. Be a valid JSON-FG 1.0 document (i.e. also valid GeoJSON — JSON-FG is a
   strict superset).
2. Carry a top-level `conformsTo` array (NOT under `properties`;
   the OGC JSON-FG 1.0 placement is at the top of the
   feature object, per spec §7.3.1 *Metadata* and §8.2.1
   *Conformance declaration*, **VERIFIED 2026-09-02 from
   OGC 21-045r1 spec body**) containing at least:
   - `http://www.opengis.net/spec/json-fg-1/1.0/conf/core`
     (the JSON-FG core conformance class, defined in
     spec Annex A.1 *Conformance Class "Core"*; **note
     that "geometry" and "time" are NOT separate
     conformance classes** — they are *members* of the
     core conformance class. The earlier-draft
     `conf/geometry` and `conf/time` references were
     citation errors caught in review; **the JSON-FG 1.0
     conformance classes are: `core` + the 6 building
     blocks** `polyhedra`, `prisms`, `circular-arcs`,
     `measures`, `feature_types_schemas`, and
     `geojson_profiles` (the 7th building block
     `web-api` is normative for OGC API servers but not
     for data files))
   - `https://wonderingWu.github.io/ste-schema/profiles/ste-jsonfg-1.0/conf/core`
     (this profile — **placeholder URI; will be replaced by an
     opengis.net-issued conformance URI when OGC IP ratifies
     the profile**)
3. **STE namespace convention — no JSON-FG "namespace"
   mechanism exists** (correction 2026-09-02 from the
   full spec body): the earlier-draft
   "per JSON-FG §6.2 'namespaces'" was a **fabricated
   reference** caught in review. **Correction (caught
   in the v2 audit 2026-09-02)**: §6.2 **does exist**
   in the OGC 21-045r1 spec — but it is **"Scenarios"**
   (§6.2.1 "Using a GeoJSON client" + §6.2.2
   "Using a JSON-FG client"). The earlier "§6.2 does
   not exist" claim was wrong on the section-existence
   axis; the **search** `6.2 Namespace` / `6.2 namespaces`
   still returns no matches. The conclusion stands:
   JSON-FG 1.0 has **no namespace mechanism**; the
   "namespace" discussion must be replaced with the
   GeoJSON foreign-members model. JSON-FG 1.0 inherits
   the GeoJSON "foreign members" pattern (RFC 7946
   §6.1) and does **not** define a namespace mechanism
   of its own. STE's `properties.ste.*` convention is a
   **project-level** choice, made possible by the
   foreign-member allowance, not spec-mandated. STE
   uses **two patterns** in v1.0:

   - **Nested under `properties.ste.*`** — for STE's
     *official* fields. **v0.2 fields that exist today**:
     `timeline`, `narratives`, `external_ids`,
     `ste_version`, `name` (the denormalized cache),
     `coordinates` (the legacy `{lat, lon}` shape), and
     `tags`. **v0.3 / v1.0 fields proposed in RFC 0001**:
     `coord_provenance` (per-snapshot coordinate
     provenance per `v0.3-core-upgrade.md` §5), plus
     v0.3's `sources` structured object, `about_period`,
     `ai_assisted` provenance tier, `ste_status`
     lifecycle, and the `contribution_meta` slot fields
     (`contribution_type`, `identity`, `rights`). The
     nested `properties.ste.*` pattern is one definition
     covering all of them.
   - **Flat prefix `properties["ste:…"]`** — for *tag
     keys* inside `properties.ste.tags` (the `tags`
     field carries OSM-style tag keys; community-invented
     tag keys must use the `ste:` prefix per app-level
     rule 06; the flat prefix is required because `tags`
     is an open key-value object, and a flat prefix lets
     authors extend the tag system without schema
     changes).
   - **OSM standard tags** stay at the `properties` root
     without any prefix (e.g. `properties.name`,
     `properties.amenity`).

   GeoJSON-flavoured fields stay at the `properties` root
   per RFC 7946; JSON-FG 1.0 is a strict superset of
   GeoJSON and uses the same "foreign members in
   `properties`" pattern that GeoJSON allows for
   vendor-specific extensions.
4. Carry a top-level `ste_version: "1.0"` in `properties.ste` (analogous to
   the v0.2 const).
5. Validate against the STE reference validator's JSON-FG mode, in
   addition to the v0.2 application-level rules listed in the project
   README (calendar validity, timeline ordering, single open-ended last
   snapshot, …).

## 2. Field-by-field mapping (STE v0.2 → STE v1.0 / JSON-FG)

| STE v0.2 field | JSON-FG / STE v1.0 location | Type | Notes |
|---|---|---|---|
| `ste_id` (UUID v4) | `id` | string | JSON-FG reuses GeoJSON's `id`; same UUID v4 pattern. |
| `ste_version: "0.2"` | `properties.ste.ste_version: "1.0"` | string | Bumped; const-locked. |
| `name.primary` | `properties.name` | string | Standard GeoJSON convention. |
| `name.localized` | `properties.ste.name.localized` | object<BCP47, string> | JSON-FG has no multi-language; keep STE structure. |
| `name.aliases` | `properties.ste.name.aliases` | array<string> | Cache, derived from earlier snapshots. |
| `coordinates: {lat, lon}` (WGS84) | `geometry: {type: "Point", coordinates: [lon, lat]}` | object | **JSON-FG 1.0 spec §7.3.3 (Place, informational) + §8.4 (Geometry, normative) + §8.4.7 (Fallback geometry)**: WGS84 GeoJSON-compatible geometries go in the `geometry` member; the `place` member is **null or omitted** in that case. **VERIFIED 2026-09-02 from OGC 21-045r1 spec body**: "If the geometry is a valid GeoJSON geometry (that is, one of the GeoJSON geometry types, in WGS 84), the geometry is encoded as the value of the 'geometry' member. The 'place' member then has the value null or is omitted." Coordinate order follows the JSON-FG/GeoJSON convention — `[lon, lat]`, not `[lat, lon]`. The lat/lon object is preserved inside `properties.ste.coordinates` for v0.2-internal symmetry. |
| `external_ids.wikidata` | `properties.ste.external_ids.wikidata` | object | Verbatim from v0.2; JSON-FG has no `external_ids` concept. |
| `external_ids.osm` | `properties.ste.external_ids.osm` | object | as above |
| `external_ids.ohm` | `properties.ste.external_ids.ohm` | object | as above |
| `external_ids.baidu_baike` | `properties.ste.external_ids.baidu_baike` | object | as above; licensing warning preserved (R1/R8) |
| `external_ids.wikipedia` | `properties.ste.external_ids.wikipedia` | object | as above |
| `tags: {amenity: "school", …}` | `properties.amenity`, `properties.operator`, etc. | mixed | OSM-convention keys flatten to `properties` (GeoJSON's natural style); STE-invented keys MUST keep the `ste:` prefix per **the STE convention** (this is a project-level rule, not JSON-FG-spec-mandated — JSON-FG 1.0 has no namespace mechanism; the rule is enforced by v0.2's `tags` description and v1.0's `properties.ste.tags` convention), e.g. `properties["ste:disappearance"]: "停办"`. |
| `narratives[]` | `properties.ste.narratives` | array | Verbatim; JSON-FG has no multi-perspective model. |
| `timeline[]` | `properties.ste.timeline` (full) **+** `time` (effective closed interval) **+** `properties.ste.timeline[i].geometry` (per-snapshot override, only for `status: relocated` etc.) | array + object | See §3 — the array stays; JSON-FG's `time` carries a single effective **closed** interval (both endpoints inclusive, per spec §7.3.2 *Time* (informational) + §8.3.2 *Intervals* (normative)); per-snapshot `geometry` overrides (only when a snapshot has its own `coordinates`, e.g. `status: relocated`) are preserved verbatim in `properties.ste.timeline[i].geometry` because the top-level `geometry` is the entity-wide representative point. |
| `contributed_by` (per-snapshot, per-narrative, per-evidence) | `properties.ste.contributed_by` (per scope) | object | Verbatim. |

## 3. The `time` question (the only non-trivial mapping)

JSON-FG's `time` is **single-valued** — a date, a timestamp, or a single
`interval`. STE's `timeline` is an **array** of snapshots. The profile's
strategy:

- **Authoritative data**: stays in `properties.ste.timeline[]` (full v0.2
  structure preserved).
- **JSON-FG `time`**: an **effective closed interval**
  computed mechanically as
  `[first_snapshot.start_date_normalized, last_snapshot.end_date_normalized ?? ".."]`,
  with both endpoints being RFC 3339 date or date-time
  and the interval being **closed** (both endpoints
  inclusive) per **VERIFIED 2026-09-02 from OGC 21-045r1
  spec §7.3.2 *Time* (informational) + §8.3.2
  *Intervals* (normative)**: "Both start and end
  instants are included in the interval, i.e., the
  interval is closed. The unbounded end of an interval
  is represented by a double-dot string ('..')".
  **STE's `end_date: "1946"` means "existed through
  1946" (per app-level rule 02); this maps **directly**
  to JSON-FG `interval: ["…", "1946"]` as a closed end
  — no `+1 month` / `+1 year` / `+1 粒度` conversion
  is needed**. The earlier-draft `+ 1 month` rule (and
  the accompanying `1947-01-01` example) was a
  misreading of the inclusive convention; the spec's
  closed-interval semantics make it unnecessary. For
  open-ended last snapshots, use `".."` as the end of
  the interval (not `generated_at`, which would
  misleadingly imply the entity ended on the
  document-generation date). This lets JSON-FG consumers
  (MapLibre time sliders, OGC API Features temporal
  filters) index the feature without needing to know
  STE's internal timeline structure.
- **Snapshot-level coordinates for `status=relocated`**: a single `place`
  is insufficient. Two profile options, both compatible with JSON-FG 1.0:

  - **Option A (preferred)**: the entity has one `place`; the relocated
    snapshot stores its own coordinates in `properties.ste.timeline[i].coordinates`
    exactly as v0.2. Consumers needing per-time geometry read the timeline
    array. This is the minimum-surprise choice for GeoJSON toolchains.

  - **Option B (future)**: when the v1.0 event model lands, a *trajectory*
    of geometries replaces `place`; v1.0 keeps `place` as a representative
    point and points consumers at `properties.ste.timeline[i].place` for
    per-snapshot geometry. Tracked in `v0.3-core-upgrade.md` and
    `v0.3-entity-lifecycle.md`.

For 1.0, **Option A** ships. Document the choice; don't force a
non-JSON-FG feature on the world.

## 4. `ohm_date` ↔ RFC 3339

`ohm_date` (`YYYY` / `YYYY-MM` / `YYYY-MM-DD`, ISO 8601 astronomical
year numbering for BCE) is STE's compact historical date. JSON-FG
requires RFC 3339 (full date or date-time). Mapping rules for the
`time` field only — `properties.ste.*` keeps `ohm_date` verbatim:

| ohm_date | JSON-FG `time.date` / `time.timestamp` |
|---|---|
| `1879` | `"1879-01-01"` (lower bound) |
| `1879-05` | `"1879-05-01"` (lower bound) |
| `1879-05-20` | `"1879-05-20"` |
| `0000` (1 BCE) | `"0000-01-01"` |
| `-0220` (221 BCE) | `"-0220-01-01"` (ISO 8601 astronomical) |
| absent (open-ended last) | use the document's `generated_at` (best effort) **or** omit `time` and rely on `properties.ste.timeline[-1]` having no `end_date` |

The reverse mapping (RFC 3339 → ohm_date) MUST be lossy-safe: the
round-tripped `properties.ste.timeline` must re-derive the same
`ohm_date` granularity (`YYYY` / `YYYY-MM` / `YYYY-MM-DD`). Generators
that can't guarantee this should refuse to write `time`.

## 5. Example: v0.2 → JSON-FG 1.0

A condensed v0.2 entity (familiar from the demo's Beijing-school data):

```json
{
  "ste_id": "8c2f1d3a-4b5e-4f7a-9d0c-1e2f3a4b5c6d",
  "ste_version": "0.2",
  "name": {
    "primary": "汇文中学",
    "localized": { "zh-Hans": "汇文中学", "en": "Huiwen Middle School" },
    "aliases": ["崇实中学", "崇实馆", "第29中学"]
  },
  "coordinates": { "lat": 39.9075, "lon": 116.4283 },
  "external_ids": { "wikidata": { "id": "Q5727329", "verified": true } },
  "tags": { "amenity": "school", "ste:disappearance": "1952-年更名" },
  "timeline": [
    {
      "start_date": "1879",
      "end_date": "1941",
      "name": "崇实馆",
      "type": "school",
      "status": "active",
      "sources": ["https://zh.wikipedia.org/wiki/汇文中学"]
    },
    {
      "start_date": "1941-12",
      "end_date": "1946",
      "name": "汇文中学(战时迁建)",
      "type": "school",
      "status": "relocated",
      "coordinates": { "lat": 30.5728, "lon": 104.0668 },
      "sources": ["https://www.ohm.org/way/987654"]
    }
  ]
}
```

Rendered as JSON-FG 1.0 / STE v1.0:

```json
{
  "type": "Feature",
  "id": "8c2f1d3a-4b5e-4f7a-9d0c-1e2f3a4b5c6d",
  "featureType": "ste.SpatioTemporalEntity",
  "conformsTo": [
    "http://www.opengis.net/spec/json-fg-1/1.0/conf/core",
    "https://wonderingWu.github.io/ste-schema/profiles/ste-jsonfg-1.0/conf/core"
  ],
  "time": {
    "interval": ["1879-01-01", "1946"]
  },
  "place": {
    "type": "Point",
    "coordinates": [116.4283, 39.9075]
  },
  "properties": {
    "name": "汇文中学",
    "amenity": "school",
    "ste:disappearance": "1952-年更名",
    "ste": {
      "ste_version": "1.0",
      "name": {
        "localized": { "zh-Hans": "汇文中学", "en": "Huiwen Middle School" },
        "aliases": ["崇实中学", "崇实馆", "第29中学"]
      },
      "coordinates": { "lat": 39.9075, "lon": 116.4283 },
      "external_ids": {
        "wikidata": { "id": "Q5727329", "verified": true, "verified_at": "2026-08-25T10:30:00Z" }
      },
      "timeline": [
        {
          "start_date": "1879", "end_date": "1941",
          "name": "崇实馆", "type": "school", "status": "active",
          "sources": ["https://zh.wikipedia.org/wiki/汇文中学"]
        },
        {
          "start_date": "1941-12", "end_date": "1946",
          "name": "汇文中学(战时迁建)", "type": "school", "status": "relocated",
          "coordinates": { "lat": 30.5728, "lon": 104.0668 },
          "sources": ["https://www.ohm.org/way/987654"]
        }
      ]
    }
  }
}
```

## 6. Round-trip safety (loss matrix)

Round-trip STE v0.2 → JSON-FG 1.0 → STE v1.0 MUST preserve the following
**without information loss** (checked by the reference validator in
JSON-FG mode):

- All top-level fields except `coordinates` (re-derivable from
  `place.coordinates`).
- `name.primary` ↔ `properties.name` (round-trip stable; same string).
- `name.localized` ↔ `properties.ste.name.localized` (verbatim).
- `tags` non-OSM keys with `ste:` prefix (verbatim; preserved by the STE convention — see §1 #3 above; JSON-FG 1.0 has no namespace mechanism).
- `timeline[]` (verbatim in `properties.ste.timeline`).
- `external_ids`, `narratives[]`, all evidence, all contributed_by
  (verbatim in `properties.ste.*`).
- `ohm_date` granularity in timeline start_date / end_date (verbatim).

**Lossy by design** (document, don't fix):

- The `featureType` namespace (`ste.SpatioTemporalEntity`) is a JSON-FG
  add — reverse mapping strips it (it's already encoded in
  `properties.ste.ste_version`).
- The `time.interval` is derived, not stored — reverse mapping recomputes
  it from the timeline (deterministic).

## 7. Known gaps (fields JSON-FG cannot model; declared in profile, not in JSON-FG)

These STE concepts live in `properties.ste.*` because JSON-FG 1.0 has
no equivalent; this is the limit of a profile, not a bug. v1.0 ships
as-is and works toward eventual OGC extensions if/when they materialize.

| Concept | Where it lives in the profile | Why JSON-FG can't host it |
|---|---|---|
| Multi-snapshot timeline | `properties.ste.timeline` | JSON-FG `time` is single-valued |
| Snapshot-level geometry overrides | `properties.ste.timeline[i].coordinates` | JSON-FG `place` is single-valued |
| Multi-perspective narratives | `properties.ste.narratives` | JSON-FG `properties` is untyped flat |
| Evidence chain (R1) | `properties.ste.timeline[i].evidence` | no PROV model in JSON-FG |
| Retraction tombstones (R6) | `properties.ste.*.retracted/retracted_at` | no lifecycle model in JSON-FG |
| Actor namespace (user:/anon:/…) | `properties.ste.*.contributed_by.created_by` | no actor/provenance model |
| AI labeling (R3) | `properties.ste.*.ai_generated/confidence/ai_model` | no AI-disclosure concept |
| `ohm_date` historical dates | `properties.ste.*.*` | JSON-FG only does RFC 3339 |
| External-id verification status | `properties.ste.external_ids.*` | no provenance model |
| Escrowed-anonymous constraints | `properties.ste.narratives[i].author` | no identity model |

**Targeted lift path**: the gaps are not random — they line up neatly
with [W3C PROV-O](https://www.w3.org/TR/prov-o/) (evidence + actor +
retraction), [W3C SHACL](https://www.w3.org/TR/shacl/) (timeline
ordering), and [JSON-LD](https://json-ld.org/) framing (typed `properties.ste.*`).
A future v1.x could *additionally* ship a JSON-LD context that maps
`properties.ste.*` to PROV/SHACL terms, gaining dual conformance with
JSON-FG (geospatial) and PROV-O (provenance). The profile name stays
"STE JSON-FG 1.0"; the JSON-LD context is a sibling artefact, not a
replacement.

## 8. Action items (precondition for v1.0 release)

1. Add `profiles/ste-jsonfg-1.0/schema.json` (a JSON Schema for the
   profile, distinct from the core `v0.2/schema.json`).
2. Extend `validator/ste-validator.js` with a JSON-FG mode that round-trips
   v0.2 ↔ v1.0 and asserts the no-loss invariants in §6.
3. Add 3 positive + 5 negative fixtures in `profiles/ste-jsonfg-1.0/fixtures/`
   (per GOVERNANCE.md §3 admission rules: profile must ship with ≥3 valid
   and ≥5 invalid fixtures and a documented real use case).
4. Add `docs/profile/featureType-catalog.md` enumerating the canonical
   `ste.*` featureType values (`ste.SpatioTemporalEntity` for v1.0; future
   values like `ste.MovingEntity` for v1.x when trajectory lands).
5. Open a tracking issue titled "JSON-FG profile admission" that links
   the above four artefacts and is the place to coordinate the v1.0
   release.
6. The example in §5 should become a CI-tested fixture (both directions
   of the round-trip).

## 9. Out of scope (intentionally not in this profile)

- **OGC API Features conformance class**. A server-side STE feature
  collection will need OGC API Features Part 1+2, but that's a server
  concern, not a profile concern. Tracked separately; v1.0 ships
  profile-first, server later.
- **JSON-LD / PROV-O lifting** (the sibling context mentioned in §7).
  Tracked as v1.1.
- **OGC Moving Features (JSON/SQL)**. STE's timeline is closer to
  Moving Features' trajectory than to JSON-FG's snapshot. v1.0 picks
  JSON-FG because it preserves STE's snapshot semantics; Moving
  Features can be a v1.x profile, not a replacement.
- **GeoJSON-only fallback**. JSON-FG requires `type: "Feature"` and
  `place` — GeoJSON-only tooling that refuses anything outside the
  GeoJSON RFC 7946 surface will NOT consume v1.0 directly. v1.0
  documents this; a v1.x may ship a `ste-geojson-subset` profile that
  drops the timeline (only the last snapshot is exposed), explicitly
  marked as a lossy view.

## 10. References

- OGC 21-045r1 *Features & Geometries JSON — Part 1: Core*
- OGC 18-058r2 *OGC API Features — Part 1: Core*
- RFC 7946 *The GeoJSON Format* (the subset JSON-FG builds on)
- RFC 3339 *Date and Time on the Internet: Timestamps* (JSON-FG time format)
- W3C PROV-O (provenance, for the sibling JSON-LD context work)
- ISO 8601-1:2019 / EDTF (BCE astronomical year numbering, for `ohm_date`)

---

**Authors**: STE project (@wonderingWu)
**License**: CC0 1.0 (per GOVERNANCE.md §2 — standards text is public domain)
**Change process**: via `docs/governance/RFC-process.md` once that lands
