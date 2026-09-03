# Why Rule 10: Draft Lifecycle

## The rule

A "draft" is a STE-formatted document that lacks a required
field (typically `sources`, per R1's 30-day grace period) and
is **not yet a formal dataset entry**. The schema does **not**
validate drafts; drafts live entirely in platform-side
storage. The platform runs the schema validator only at the
moment a draft is "promoted" to a formal entry.

The lifecycle is:

```
  authored  →  draft (platform-side, no schema validation)
            →  [30-day grace period for sources]
            →  promoted (schema-validated) | expired (deleted)
            →  formal dataset entry
            →  possibly edited, retracted, withdrawn, etc.
```

The schema description's **DRAFTS** paragraph makes this
explicit: "documents in the 30-day no-source grace period
(Charter R1) are platform-side records, NOT valid STE
documents; this schema validates formal dataset entries only."

## Why JSON Schema can't say this

The schema's "exports only formal entries" policy is a
**boundary statement**, not a per-field constraint. JSON
Schema can express the formal-entry constraints; it can't
say "and there exists a separate, unvalidated draft state
in platform storage". The platform is the one that owns the
draft state.

## Why it matters

- A "draft" with a non-trivial `evidence` chain (e.g. an
  AI-extracted draft) has not been confirmed by a human; the
  schema's R1 source rule is what prevents the AI's output
  from becoming a "STE fact" without human check. Without
  the draft boundary, the schema is either too lax (accepts
  unsourced drafts) or too strict (rejects in-progress work).
- The 30-day grace is the platform's lever: it lets authors
  work on contributions without exposing half-baked data
  to consumers. R1's "no source, no formal entry" is the
  hard rule; the grace period is the friction reducer.
- A draft that never gets promoted is **expired**, not
  "incomplete formal entry". The schema doesn't see it; the
  platform deletes it after 30 days (or whatever the platform
  policy is). The user's work is gone, but the formal
  dataset is uncorrupted.

## How to implement

1. **Draft state is platform-side storage** (e.g. a separate
   `drafts` table in the database). It's not exported in C2.
2. **At draft creation**, the platform accepts any shape that
   *could become* a valid STE document. The platform does
   not run the schema validator.
3. **At draft promotion** (e.g. the user clicks "publish", or
   the 30-day grace expires with sources added), the platform
   runs the schema validator + the reference validator. If
   both pass, the document moves from `drafts` to
   `entries` and gets a new `ste_id` (or keeps the draft's
   temporary ID, depending on platform policy).
4. **At draft expiry** (30 days, no sources), the platform
   deletes the draft. The user is notified; the deletion
   is logged in the user's contribution history.
5. **The schema's role** is "validate the formal entry on
   promotion". Nothing more. The schema's `description`
   field's DRAFTS paragraph is the boundary marker; future
   maintainers reading the schema know to keep the boundary.

## What's NOT in this rule

- A "draft" is not a "formal entry with missing sources".
  The schema's `additionalProperties: false` and `required`
  lists do not change between draft and formal; the document
  is either in the draft state (not validated) or the formal
  state (validated).
- The 30-day grace is not a "source field is optional for 30
  days" rule. `sources` is `required` in the schema; the
  grace means the platform doesn't enforce this on drafts.
  The user sees a UI message "you have 23 days to add
  sources" or similar.

## Common failure modes

- A frontend that lets users edit the formal entry
  directly, bypassing the draft state. The user adds a
  malformed field; the schema is run on save; the user
  gets a confusing error. The platform should always
  edit in draft, then promote.
- A backend that runs the schema validator on draft
  ingest, then stores the rejected drafts in `drafts`.
  The "draft" now has the same shape as a formal entry;
  the boundary is gone. Don't validate drafts.
- A migration from "drafts were just informal
  documents" to "drafts are platform-side records" that
  fails to delete the old informal drafts. Old data
  leaks into the new boundary.

## Reference

- ETHICS Charter R1 — "Data without sources must not
  enter the formal dataset (it may be staged in the draft
  area, with 30 days to complete sources, after which it
  is removed)."
- [`v0.2/schema.json` `description` field, DRAFTS
  paragraph](../../v0.2/schema.json)
- [`docs/schema-v0.2-notes.md`](../schema-v0.2-notes.md) §1
  — "草稿机制无处安放" — the design decision
