# Why Rule 08: Longitude Normalization

## The rule

`lon = -180` and `lon = +180` denote the same meridian. Comparisons
and aggregations MUST normalize one to the other before any
operation. The choice of which side to canonicalize is a platform
convention; the schema allows both.

## Why JSON Schema can't say this

JSON Schema can declare a range (`minimum: -180, maximum: 180`)
and stop there. It can't say "treat `-180` and `+180` as equal" —
that's a semantic equivalence, not a structural one. A range with
`minimum: -180, maximum: 180` actually **accepts both** `-180`
and `+180` because both satisfy the inclusive bounds.

## Why it matters

- "Find all entities within 1 km of (179.999, 0)" and
  "(−180.001, 0)" return different results if the
  consumer doesn't normalize. They're the same point.
- A timeline that relocates from `(179.999, 0)` to
  `(-180.001, 0)` looks like a 359° eastward leap instead of a
  1 m westward hop. The map renders a long red arrow across the
  world; the user is confused.
- Sorting / grouping / "find the centroid of these 100 points"
  operations break. The antimeridian-crossing entities cluster
  on one side of a histogram when they should be at the edge.

## How to implement

1. **Canonical choice** (project convention): normalize
   `lon === -180` to `lon === +180` on ingest. Document this
   choice. Other choices (canonicalize to `[-180, 180)` and
   reject `+180`; canonicalize to `(-180, 180]` and reject
   `-180`) are equally valid; pick one and document.
   **v1.0 enforcement** (planned, tracked under the
   `validator-equivalence-gate` follow-up): add a
   `normalizeLon` helper in `validator/ste-validator.js`
   and a `lon = (lon === -180 ? 180 : lon)` rewrite in
   `scripts/import-osm-overpass.mjs` on import.
2. **In the validator** (`validator/ste-validator.js` and the
   app code), a `normalizeLon(lon)` helper returns
   `lon === -180 ? 180 : lon`.
3. **In the demo's map rendering** (Leaflet / MapLibre), the
   map's `wrap` function takes care of this on the client side
   for display, but the **data** in the document must be
   canonical for the round-trip invariants (Rule 03, default
   values; Rule 06, future v1.0 JSON-FG profile) to hold.
4. **In the schema description** (already in v0.2 `wgs84_point`),
   the description calls this out: "lon -180 and +180 denote
   the same meridian; applications should normalize before
   comparison." The validator does NOT enforce (range accepts
   both), so the application is responsible.

## Edge cases

- **GeoJSON order**: GeoJSON's `coordinates: [lon, lat]` is the
  long-standing convention. STE's internal `coordinates: {lat,
  lon}` is more readable but breaks symmetry with GeoJSON
  consumers. The JSON-FG profile (see `docs/profile/json-fg-mapping.md`)
  uses `[lon, lat]` for the `place` field; the internal
  `properties.ste.coordinates` keeps `{lat, lon}`. Round-trip
  must be stable.
- **Antimeridian-crossing polygons** (out of scope for v0.2
  geometry, which is point-only; planned for v1.x).
- **Three-digit precision** vs **six-digit precision** in
  serialized coordinates. The validator doesn't care about
  precision; the application should use a consistent precision
  (recommendation: 7 decimal places, ~1 cm at the equator).

## Common failure modes

- Using a string comparison (`"-180" < "180"`) instead of
  numeric (`-180 < 180`). The string sort is
  backwards (the minus sign sorts before the digit).
- A library that does its own internal normalization
  inconsistently (e.g. normalizes on display but not on
  distance calculation).
- A search index that keys on the raw value. Two documents
  with `lon: -180` and `lon: 180` are the same point and
  should hit the same index entry; if the index keys on the
  raw value, it doesn't.

## Reference

- [`v0.2/schema.json` `wgs84_point` description](../../v0.2/schema.json)
  — "lon -180 and +180 denote the same meridian"
- RFC 7946 §3.1.9 (antimeridian handling, applies to polygons
  when STE adds geometry in v1.x)
- [`docs/profile/json-fg-mapping.md`](../profile/json-fg-mapping.md)
  — coordinate order convention
