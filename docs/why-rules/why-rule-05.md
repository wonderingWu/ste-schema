# Why Rule 05: name/aliases Derivation

## The rule

`name.primary` is a **denormalized cache** derived from the timeline
(per the v0.2 schema description). On conflict, the timeline wins.
The exact rule:

- **`name.primary` = name of the LAST snapshot** (by start_date
  ascending), **regardless of status**. A demolished entity keeps
  its final name; a "proposed" entity that's never been built is
  named by its proposing snapshot.
- **`name.aliases` = union of all EARLIER snapshots' names**, in
  chronological order, deduplicated, excluding the primary.
- **`name.localized` is hand-maintained** and not derived; it's
  the author's curated set of language-specific names per the
  current primary name. **When the primary name changes
  between snapshots** (e.g. 崇实馆 → 汇文中学 → 第29中学),
  `name.localized` SHOULD reflect the most recent (or
  most commonly used) translation; a future v0.3
  `per_snapshot_localized` field is proposed to carry the
  per-snapshot name in each language. v0.2 ships with
  the single most-recent `name.localized` (soft convention,
  not enforced).

## Why JSON Schema can't say this

A cross-field derivation that depends on the array's content
ordering and set semantics is not expressible in JSON Schema. The
closest is `if/then/else` with `additionalProperties: false`, but
the rule needs set operations (union, dedup) and ordering
comparisons that JSON Schema's core doesn't have.

## Why it matters

- A `name.primary` that disagrees with the timeline is
  ambiguous. The frontend should display the timeline's name; the
  cache is for search indexing and display pre-render. A
  hand-written `name.primary` that disagrees with the timeline
  is a bug.
- Search is the most common use case for the cache. An alias
  that the user expects to find by is missing from `aliases` →
  the search returns nothing. Aliases MUST be the full set of
  historical names.
- "Demolished" entities still need a primary name; otherwise
  the search index loses them.

## How to implement

1. Sort the timeline by `start_date` (using Rule 02's normalized
   comparison).
2. Take the last snapshot's `name` → `name.primary`.
3. Take the union of all earlier snapshots' `name` (deduplicated,
   excluding the primary) → `name.aliases`.
4. If the document's hand-written `name.primary` or `name.aliases`
   disagrees with the derived value, the application logs a
   warning (or, in strict mode, fails the validation).
5. The demo's `scripts/local-validate.mjs` enforces this on the
   curated demo datasets.

## Edge cases

- **One snapshot, no end_date**: the single snapshot is also the
  last. `name.primary` = its name; `name.aliases` is empty.
- **Same name in two snapshots** (rename not recorded as a
  rename): the union dedup leaves it once. The `name.aliases`
  documentation should be updated to acknowledge the
  non-rename case.
- **`name.localized`** is a curated mapping, not derived. It
  SHOULD correspond to the current `name.primary`'s translations
  (e.g. if primary is in Chinese, the `zh-Hans` entry should
  be the primary); this is a soft convention, not enforced.

## Common failure modes

- Authoring tools that set `name.primary` to the *current*
  entity's first known name, not the last. This is the "first
  name" trap.
- Aliases containing the current primary by mistake (then the
  union dedup strips it; not a bug, but the author should know).
- Treating `name.localized` as the source of truth and ignoring
  `name.primary`. They're parallel: `primary` is canonical, the
  `localized` map is its translations.

## Reference

- [`v0.2/schema.json` `name` description](../../v0.2/schema.json)
  — "denormalized cache" + "on conflict the timeline wins"
  statement.
- ETHICS Charter R7: territorial claims are anchored to a
  snapshot; the name of a snapshot is its anchor.
