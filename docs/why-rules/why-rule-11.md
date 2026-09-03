# Why Rule 11: Retraction Tombstone Rendering

## The rule

When a narrative or evidence item is `retracted: true`:

- The narrative's `text` is empty (or set to a tombstone
  marker) and `retracted_at` is set.
- The evidence's `url` / `ste_asset_id` is **forbidden** (the
  pointer IS the content; the retraction is the absence of
  the pointer) and `retracted_at` is set.

The schema enforces this data shape. The **rendering** — what
the UI shows to the consumer — is application-side policy.
The recommended rendering is a "tombstone" message:

> "An [oral account / narrative / evidence] existed here;
> it was withdrawn at the contributor's request on
> [retracted_at]."

## Why JSON Schema can't say this

The data shape is enforceable (and the v0.2 schema does so
with if/then/else). The rendering is a UI concern, not a
schema one. The schema can require `retracted_at` to be a
valid timestamp; it can't require a specific UI label.

## Why it matters

- ETHICS Charter R6's design choice: "Withdrawal is not
  silent deletion — it leaves a tombstone record." The
  tombstone is the **public acknowledgement** that the entry
  existed. Without it, the dataset is edited to look as if
  the entry never existed; the user sees a gap, not a
  withdrawal.
- A consumer that simply hides retracted items (filter
  them out) defeats the purpose. The consumer must show
  the tombstone, so the user knows the data is
  intentionally missing, not just missing.
- The "no `text`" requirement on retracted narratives is
  a data shape: the *content* is gone. The tombstone is
  the *meta*. A retracted narrative is not a narrative
  with empty text; it's a metadata record about a
  narrative that used to exist.

## How to implement

1. **At validation**: the schema's if/then/else handles
   the data shape. The reference validator's R6 rule
   does the same.
2. **At render**: a UI component that takes a narrative
   or evidence item and renders it. For `retracted: true`,
   the component MUST:
   - NOT render `text` (for narratives) or `url` /
     `ste_asset_id` (for evidence). These are not
     present in the data shape, but the component must
     also not fall back to a cached value.
   - Display a tombstone string in the document's
     language (i.e. localized). The string template is
     application policy, but the recommended wording is
     in ETHICS R6.
   - Link to the `retracted_at` timestamp (rendered in
     the document's locale, but stored as ISO 8601).
3. **At export** (C2), the retracted items are exported
   with the tombstone shape. Consumers can choose to
   render or hide them; the dataset's data shape
   supports both.
4. **Tombstone-free deletion** is a separate mechanism
   (per ETHICS R6, fast-track committee approval). The
   data shape is then *complete absence* (not a
   tombstone). The schema's R6 rule is for the
   tombstone case; the deletion case is platform-side
   policy.

## Edge cases

- A narrative that's retracted *and* has a
  `contributed_by` record: the contributed_by is
  preserved (the contributor's identity is not lost).
  The data shape: `narrative.retracted: true` +
  `narrative.text: ""` + `narrative.retracted_at: <ts>`
  + `narrative.contributed_by: <unchanged>`. The
  contributor's record outlives the retraction; ETHICS
  R9 (the AI training exclusion) and R4 (challenge
  records) both depend on this.
- An evidence item that's `offline: true` and retracted:
  the `offline: true` and `title` are preserved
  (the title is the *description* of the item, not the
  content). The `url` / `ste_asset_id` are removed.
- A snapshot in the timeline whose `name` is
  retracted: **not in scope of v0.2**; **a v0.3 follow-up
  is tracked in RFC 0001 (v0.3 core upgrade) §3.4 (entity
  lifecycle)**. In v0.2, the workaround is: (1) edit
  the snapshot's `name` field directly, (2) record the
  edit in `contributed_by.last_modified_at` + a
  tombstone narrative pointing to the change; (3) wait
  for v0.3's per-snapshot retraction mechanism
  (proposed, not yet implemented). For the
  ETHICS-R5 (living-individual) scenario specifically,
  prefer the "edit + tombstone narrative" workaround
  over silent name change, even though the audit trail
  is imperfect.

## Common failure modes

- A UI that hides retracted items silently. The user's
  expectation (from R6) is the tombstone, not the
  absence. Hide-after-tombstone is fine; hide-instead-of-tombstone
  is not.
- A UI that shows a retracted narrative's *cached*
  text from before retraction. The data shape
  ensures the text is empty in the formal record;
  the UI must not have a side-channel cache that
  bypasses the schema.
- A schema validator that flags `text: ""` on a
  non-retracted narrative as an error (Rule 02 /
  minLength 1 on text). The v0.2 schema's else
  branch explicitly allows `text: ""` only when
  `retracted: true`; the reference validator's R6
  rule does the same. A test fixture catches the
  common bug.

## Reference

- ETHICS Charter R6 — Withdrawal and Tombstones
- [`v0.2/schema.json` `narrative_entry` and `evidence_item`
  if/then/else blocks](../../v0.2/schema.json)
- [`validator/ste-validator.js`](../../validator/ste-validator.js)
  — R6 rules for narratives and evidence
