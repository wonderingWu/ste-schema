# Why Rule 04: `default` Values Are Not Filled by Validators

## The rule

JSON Schema's `default` keyword is a **schema-author hint**, not a
mutation directive. A document that omits a field with a `default`
is **valid as-is**; the validator does not insert the default.
Readers must apply defaults themselves.

Examples in the STE schema:

- `external_id_ref.verified` has `default: false`
- `evidence_item.ai_generated` has `default: false`
- `narrative_entry.language` has `default: "en"`
- `narrative_entry.retracted` has `default: false`
- `evidence_item.offline` has `default: false`

## Why JSON Schema can't say this

The spec explicitly leaves the semantics of `default` undefined for
validation. The closest you can get is "if the field is absent, treat
the document as if it were present with the default value" — but
that's a reader-side convention, not a schema rule. Some validators
provide it as an option (`useDefaults` in ajv); turning it on
*changes the document* during validation, which surprises
implementers.

## Why it matters

- Two consumers can read the same document and disagree on the
  value of a defaulted field. If `external_id_ref.verified` is
  absent, one consumer reads it as `false`, another as
  "unverified" / "unknown" / `null`. The schema can't
  disambiguate. **v1.0 mitigation** (planned): a separate
  companion doc (`docs/strict-vs-defaults.md`, to be drafted)
  will enumerate which defaults are "explicit false-claim"
  semantics (where "not present" must be visually
  distinguished from "present and false") vs "convenience
  fill" semantics. The v0.2 schema's `default: false` on
  `external_id_ref.verified` and `evidence_item.ai_generated`
  is **convenience fill**, not "explicit false-claim" — v1.0
  may remove these defaults to force consumers to declare.
- A "missing field" vs. "explicit field" round-trip is not
  preserved. A consumer that fills in defaults and serializes
  back produces a different document than the one it received.
- CI's parity check (validator vs. ajv) fails if one path fills
  defaults and the other doesn't.

## How to implement

1. Choose one policy, document it, and apply it consistently.
   The project's policy is **readers fill defaults, validators
   do not**.
2. Readers (validator, import scripts, demo frontend) MUST
   apply the same default-fill logic, in the same order, on the
   same fields. The `validator/ste-validator.js` `nonObj` /
   defaults path is the reference; the demo's parse step
   matches.
3. Round-trip tests in CI assert that a document serialized
   after default-fill equals the document serialized from the
   same data with the defaults explicit. (This is a v1.0
   CI addition; tracked.)

## Common failure modes

- ajv with `useDefaults: true` enabled, producing a document
  the validator later complains about because the validator
  sees the filled value and a different code path expects the
  absent form.
- Frontend code that does `obj.verified ?? false` and silently
  treats the missing field as a meaningful "false" claim. In
  R3 / R6 contexts (AI disclosure, retraction), "not present"
  is a different signal from "present and false".

## Reference

- JSON Schema draft-07 **§10.2 ("default")**: explicit
  non-normative statement. **VERIFIED 2026-09-02 by the
  verifier task: §6.4 in draft-07 covers array-validation
  keywords (`items`, `additionalItems`, `maxItems`, `minItems`,
  `uniqueItems`, `contains`); `default` is at §10.2.** The
  earlier-draft reference to §6.4 was a citation error caught
  in review.
- [`v0.2/schema.json` — search for `"default":` to audit
  all defaulted fields](../../v0.2/schema.json)
