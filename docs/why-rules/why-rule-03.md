# Why Rule 03: `format` Keyword Is an Annotation in Draft-07

## The rule

The `format` keyword in JSON Schema draft-07 is **NOT validated by
default**. A field declared `"format": "uri"` or
`"format": "date-time"` will pass validation for *any* string
unless the validator explicitly enables format assertion.

The reference validator's `checkDateTime` (and ajv-formats for the
schema compile path) is what actually checks these.

## Why JSON Schema can't say this

It can — by enabling `validateFormats` on the validator
instance — but it can't **enforce** that the validator is
configured this way. The same schema compiled with two different
validator setups can give two different pass/fail verdicts. This
is documented in the spec but routinely missed by implementers.

## Why it matters

- A `verified_at: "yesterday"` string passes draft-07 validation
  if the validator doesn't assert date-time format. The
  if/then invariant `verified_at ⇒ verified=true` is a
  **schema-level structural check** (it asserts
  "verified_at is present ⇒ verified is true", not
  "verified_at is a real date-time"). The structural
  check passes on garbage data; the format check is
  separate (validator's `checkDateTime` at
  `validator/ste-validator.js:42-50`). For full
  protection, **both** the structural if/then and the
  format check are needed; a CI that only runs ajv
  with `ajv-formats` installed catches both; a CI
  that only runs ajv without `ajv-formats` catches
  neither.
- A `url: "not a url"` evidence item passes schema validation.
  Downstream tools that try to fetch the URL fail; users blame
  the schema.
- The ajv CLI behavior differs from the ajv programmatic
  default. The reference validator's `checkDateTime` is
  authoritative, but the ajv compile path needs
  `ajv-formats` installed to match.

## How to implement

1. **Always** instantiate the validator with format assertion
   enabled. With ajv: `new Ajv({ allErrors: true, strict: true });
   addFormats(ajv);`
2. **Always** run the reference validator (`validator/ste-validator.js`)
   in addition to ajv. The reference validator includes the
   calendar-validity check (Rule 01) that ajv-formats doesn't.
3. CI parity check (per GOVERNANCE.md §3.5): the two paths must
   give the same verdict on every canonical fixture. The
   `scripts/check-validator-sync.mjs` script enforces this.

## Common failure modes

- Using `JSON.stringify` + `JSON.parse` for "validation" in a
  test harness and missing the format assertion entirely.
- Running ajv without `ajv-formats` (the project lists it in
  `package.json` dependencies; this is a guard, not a guarantee).
- A test that constructs the validator inline and forgets
  `addFormats`. The CI parity test catches this; local
  pre-commit hooks may not.

## Reference

- JSON Schema draft-07 §7.3 ("format"): "Implementations MAY
  validate these formats. The behavior of implementations that
  do validate formats is undefined."
- [`validator/ste-validator.js:42-50`](../../validator/ste-validator.js)
  — `checkDateTime` is the authoritative format check.
- [`package.json` `ajv-formats` dependency](../../package.json)
