# Why Rule 02: Timeline Ordering and Overlap

## The rule

The `timeline` array MUST be:

1. **Sorted by `start_date` ascending** (using ohm_date's three-level
   granularity).
2. **Non-overlapping** at the inclusive convention: if snapshot A has
   `end_date = 1937`, snapshot B can start at `1938`; equal end/start
   is an overlap.
3. **At most one snapshot without `end_date`**, and that snapshot MUST
   be the last one.
4. **A snapshot without `end_date` MUST NOT be `status: "demolished"`**
   (a demolished entity has a known end date; an open-ended snapshot
   means "still here" or "ending at the time of last edit").

## Why JSON Schema can't say this

JSON Schema can express per-element constraints (`items`) but not
ordering relations or windowed aggregation across the array. There's
no "no two adjacent elements may overlap" or "the last element
without end_date is unique" in the standard.

## Why it matters

A timeline with two overlapping snapshots is semantically undefined:
"what was the status of the school between 1937 and 1938?" The
answer should be derivable from the timeline; if it isn't, every
downstream consumer re-derives it differently. The "single
open-ended last" rule is similar: without it, the platform can't
ask "is this entity still extant?" without a custom rule per
consumer.

## How to implement

1. Walk the timeline; for each pair (i, i+1):
   - If both have `end_date` and `end_date[i] >= start_date[i+1]`
     (at the same granularity), report overlap.
2. Count snapshots with `end_date` absent. If > 1, error.
3. If the snapshot with absent `end_date` is not the last, error.
4. If the snapshot with absent `end_date` has
   `status == "demolished"`, error.
5. The reference validator does this in `validator/ste-validator.js`
   (the timeline-walking loop at lines 333-348; the
   `normStart` / `normEnd` / `cmp` helpers at lines 73-75).
   Re-implementations must match on the canonical fixture
   set.

## Edge cases the rule must handle

- **Granularity mixing**: snapshot A ends `1941-12` (December 1941),
  snapshot B starts `1942` (year granularity). Inclusive semantics
  treat this as adjacent (A ends within 1941, B starts at the
  beginning of 1942). Confirm the application normalizes both
  edges to the same granularity before comparison.
- **Same-day boundary**: snapshot A ends `1937-08-15`,
  snapshot B starts `1937-08-15`. Inclusive convention says
  this IS an overlap. This is the rule; the application should
  error and let the author decide whether to back-date B by
  one day.
- **One snapshot**: timeline with exactly one snapshot, no
  `end_date`. This is the canonical "the entity still exists"
  case. Must pass.

## Common failure modes

- Comparing dates as strings (`"1941" < "1937"` is false in
  string sort). Use numeric tuple comparison, or a proper date
  library.
- Treating missing `end_date` as a sentinel "infinity" without
  checking it's the last snapshot.
- Allowing `status: "demolished"` + missing `end_date` (this is
  the canonical "the author meant the entity is still here but
  typed the wrong status" trap).

## Reference

- [`validator/ste-validator.js`](../../validator/ste-validator.js)
  — `normStart` / `normEnd` / `cmp` helpers
- [`v0.2/schema.json` `timeline` description](../../v0.2/schema.json)
  — inclusive convention statement
