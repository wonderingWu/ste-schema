# Why Rule 06: `tags` Key Prefix (`ste:`)

## The rule

`tags` is a free-form key-value object that reuses OSM conventions
for compatibility. OSM tag keys are an open registry
(`amenity`, `highway`, `building`, …). STE adds its own community
keys; those MUST use the `ste:` namespace prefix to avoid collision
with future OSM conventions.

```json
{
  "tags": {
    "amenity": "school",        // OSM convention — unprefixed OK
    "operator": "Board of Education",  // OSM convention — unprefixed OK
    "ste:disappearance": "1952 年更名"  // STE convention — must be prefixed
  }
}
```

## Why JSON Schema can't say this

`tags` is intentionally `additionalProperties: { type: "string" }`.
A `propertyNames` with a pattern could try to enforce
"either no prefix, or `ste:` prefix", but a "no prefix"
pattern is the empty string (which the schema's
`propertyNames: { minLength: 1 }` already excludes for other
reasons). The "either / or" rule is two patterns OR'd — JSON
Schema `propertyNames` accepts only a single subschema.

The v0.1 attempt used a single `^ste:` pattern, which broke OSM
compatibility. v0.2 (correctly) leaves it open. The application
fills the gap. **v0.1 documents using only `ste:`-prefixed tag
keys require the v0.1→v0.2 migration script
(`scripts/migrate-v0.1-to-v0.2.mjs`); v0.2 accepts both
OSM-convention and `ste:`-prefixed keys.** A v0.1 document
passes schema-v0.2 validation only after migration; this is
a one-time cost for the historical data.

## Why it matters

- A user adding `disappearance: "1952 更名"` looks fine until
  OSM eventually defines a `disappearance` key with a different
  meaning. Then the same key means two things in the same
  dataset, with no easy way to disambiguate.
- Tools that auto-import OSM tags into STE expect unprefixed
  keys. STE-invented keys are a community-side addition, and
  the prefix marks them as "read these via the STE spec, not
  via OSM".
- A "STE Profile" of a future OGC standard may want to drop the
  unprefixed OSM tags entirely (e.g. a privacy-focused profile).
  The prefix is what lets us say "OSM tags are out of scope" cleanly.

## How to implement

1. For each key in `tags`:
   - If the key starts with `ste:`, accept (it's an STE-invented
     key).
   - If the key starts with another namespace prefix (e.g.
     `osm:`, `ohm:`, `private:`), warn (cross-namespace; likely
     an authoring mistake).
   - Otherwise, accept (assume OSM convention; warn if the
     value contains unusual characters).
2. Maintain a registry of known STE-invented keys
   (`docs/tags-registry.md`, to be added in v1.0) so authors
   can look up "is there already a `ste:disappearance` key?".
3. The reference validator's tag-check (in
   `validator/ste-validator.js:152-156`) is **strict on
   emptiness, permissive on prefix**: it enforces
   `key.length > 0` and `value` non-empty + non-blank (the
   `nonBlank` helper at `validator/ste-validator.js:41`
   rejects pure whitespace / full-width-space strings), but
   it does **not** enforce the `ste:` prefix — the schema
   cannot tell which keys are OSM conventions; the
   platform-side check on prefix presence is separate and
   lives in the demo frontend. The demo frontend shows a
   yellow warning for non-`ste:`-prefixed unrecognized keys.

## Edge cases

- A key like `ste:disappearance_1952` (with a number) — fine;
  the prefix is the marker, the rest is the conventional name.
- A key like `Ste:foo` (capital S) — treat as different from
  `ste:foo`; the prefix is case-sensitive in this rule.
- A user migrating from v0.1's pre-`ste:` world — the migration
  script (`scripts/migrate-v0.1-to-v0.2.mjs`) renames
  `disappearance` → `ste:disappearance` etc.

## Reference

- OSM Map Features: <https://wiki.openstreetmap.org/wiki/Map_Features>
- [`v0.2/schema.json` `tags` description](../../v0.2/schema.json)
  — "non-OSM-convention tag keys use a `ste:` prefix" statement.
