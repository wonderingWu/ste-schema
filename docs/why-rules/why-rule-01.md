# Why Rule 01: Calendar Validity

## The rule

`ohm_date` accepts `YYYY` / `YYYY-MM` / `YYYY-MM-DD` with a regex
(`^-?\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$`). **The
regex already rejects an out-of-range month** (e.g. `0000-13-01`
is rejected because `(0[1-9]|1[0-2])` does not match `13`).
What the regex **does** pass is **out-of-range day-of-month**
— e.g. `2024-02-30` (February never has 30 days),
`2023-02-29` (non-leap year, February 29 does not exist),
`2024-04-31` (April has only 30 days). The application must
reject these. (The earlier-draft "0000-13-01" example was a
citation error caught in review — that string IS rejected by
the regex, not passed by it.)

## Why JSON Schema can't say this

JSON Schema draft-07 has no built-in "real calendar date" check.
`format: "date"` only validates RFC 3339 `YYYY-MM-DD` strings of
*correct* form; it would catch `2024-13-01` but **not**
`2024-02-30`. There's no `format: "real-calendar-date"` in any
draft.

You could try to enumerate all valid day counts per month with a
`oneOf`, but the list is 366 cases (including leap-year Feb 29),
and the BCE astronomical year adds another axis. Infeasible.

## Why it matters

A 1950-02-30 start_date on a school snapshot silently breaks the
timeline's ordering and interval logic. Worse: the data could be
displayed in a UI that just shows the string verbatim, hiding the
error. A historical-geography project where a "1 CE" date can
silently mean "1 CE, March 1st" is one where the timeline is
useless for chronological queries.

## How to implement

1. Parse the ohm_date into year / month / day.
2. For day > 0, look up the days-in-month array, with February
   29 allowed only on `(y % 4 === 0 && y % 100 !== 0) || y % 400 === 0`.
3. For BCE years, the astronomical convention means
   `-0001 = 2 BCE, -0220 = 221 BCE`; the calendar logic still
   applies to the absolute value of the year. (Most
   historical-geography data won't hit BCE dates, but the
   rule must be correct when it does.)
4. The reference validator does this in
   `validator/ste-validator.js` (`calendarValid` and
   `calendarValidDT` functions). Re-implementations must match
   byte-equivalent pass/fail behavior on the canonical fixture
   set.

## Common failure modes

- Forgetting to check the year component when computing Feb 29
  (use the absolute year; astronomical BCE math).
- Treating "00" as a valid day (it isn't; the regex already
  excludes it, but a hand-rolled parser might not).
- Looking up days-in-month in a library that uses proleptic
  Gregorian, which is the right call here, but double-check the
  BCE handling — most libraries don't go that far back.
- The "Y" vs "YY" trap: `^\d{4}$` allows `0000`, which in
  astronomical convention is 1 BCE. That's intentional; the
  validator accepts it.

## Reference

- ISO 8601-1:2019 (calendar rules)
- EDTF (Extended Date/Time Format, BNF in §3.2)
- [`validator/ste-validator.js:51-71`](../../validator/ste-validator.js)
  — `calendarValid` (lines 61-71) and `calendarValidDT`
  (lines 51-58, used by `checkDateTime` for the
  `format: "date-time"` assertion).
- [`v0.2/schema.json` `ohm_date` definition](../../v0.2/schema.json)
