# Compatibility Report: OSM/Overpass → STE v0.2 (2026-08-27)

> First **third-party data** validation of the STE schema. All prior data
> (77 schools) was produced by the project itself; this corpus is produced by
> the OSM community and imported unchanged-in-substance.

## Corpus

- Source: OpenStreetMap via Overpass API (`overpass-api.de`), query:
  nodes/ways with `historic` + `name` + `start_date` tags inside the Beijing
  bbox (39.80,116.20 – 40.05,116.55). Retrieved 2026-08-27.
- 14 elements returned: 7 nodes, 7 ways — boundary stone, memorial, heritage
  parks, palace buildings, a city gate, and ancient trees.

## Method

Importer: `scripts/import-osm-overpass.mjs`. Policy: **no invention** —
fields map 1:1 from OSM tags; anything unmappable is quarantined with a
stated reason, never silently "fixed". Each converted entity is validated
twice: ajv against `v0.2/schema.json`, then the reference validator
(`validator/ste-validator.js`, 103 application-level checks).

## Result

- **6/14 converted, all PASS both validators** (dual validation):
  通县界碑 (1928), 天坛公园 (1420), 颐和园 (1873), 祈年殿 (1420),
  寿皇殿 (1749), 新华门 (1758).
  Output: `docs/compatibility/osm-bj-historic-8.json` (filename predates the
  final count; 6 entities inside).
- **8/14 quarantined** (`docs/compatibility/osm-bj-quarantine.json`):
  - 1× wild `start_date` format: `世界语林` has `start_date=2004.7`, which
    fails the ohm_date pattern. STE rejected it rather than guessing
    "2004-07" — correct behavior.
  - 7× `historic=yes` (ancient trees, two palace halls): the tag carries no
    usable type value; STE `type` requires a meaningful OSM value, so these
    are held, not imported.

## Findings

1. **Field mapping coverage is 100% for mappable data.** Coordinates,
   name, start_date, type, external_ids.osm (`way/24824550` format) all had
   a natural home; no schema gap found for this corpus.
2. **The "no source, no entry" rule (R1) is easy to satisfy for imports**:
   the OSM element URL serves as the per-snapshot source.
3. **STE's stricter typing exposed upstream data-quality issues**
   (`historic=yes`, wild date formats). This is a feature: the schema acts
   as a data-quality filter on import, and quarantine-with-reason preserves
   the evidence trail.
4. **Single open-ended snapshot ("until now") fits surviving heritage
   naturally** — no `end_date` invention needed.
5. **Coordinate caveat**: for ways, Overpass `center` is a centroid, not a
   curated representative point. Imported entities should carry
   `ste:coord_confidence` or be refined — same lesson as the project's own
   geocoding incident (2026-08-26).
6. **Gap noted for v0.3**: natural heritage (ancient trees) has no good
   `type` value when OSM only says `historic=yes`; consider reusing
   `natural=*` / `denotation=*` as type fallback in the importer guidance.

## Conclusion

The "STE is a superset of OSM/OHM, partially readable by OHM tools" claim is
**empirically supported at small scale**: a community-produced dataset
converted losslessly for all semantically complete records. Scale limit:
14 elements, one city, heritage-type features only. Next candidates:
OHM-native entities (temporal tags), Wikidata-sourced items (needs
reachable SPARQL endpoint), and a non-Beijing corpus.
