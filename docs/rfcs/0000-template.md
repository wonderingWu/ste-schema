# RFC 0000 — STE RFC Template

> This is the template every STE RFC (≥ 0001) MUST follow. RFC 0000 itself
> is normative for the form; the substance lives in 0001+.

## Status of this template

- **Proposing process**: see `docs/governance/RFC-process.md`
- **Adoption**: this template takes effect when the RFC process lands;
  the first RFC using it is `0001-v0.3-core-upgrade.md`.
- **Change process for this template**: meta-RFC (RFC NNNN where NNNN is
  the next available number). Same review rules as any other RFC.

## Filename convention

```
docs/rfcs/NNNN-<short-kebab-slug>.md
```

- `NNNN` is the next available 4-digit RFC number, zero-padded.
- `<short-kebab-slug>` is a 1–4-word lowercase-hyphenated summary,
  derived from the title.

## Required sections (in this order)

Every RFC MUST have these sections. Sub-sections are encouraged but not
required. The first occurrence of each section is **mandatory**; later
RFCs can shorten, but not omit.

### 1. Summary

One paragraph (3–6 sentences) stating the **what** and the **why** in
plain language. No jargon introduced here. If a reader has to stop after
one paragraph, they should know what the RFC proposes and why it
matters.

Bad: "This RFC introduces changes to the source structure to enable
downstream attribution."

Good: "STE v0.3 makes `sources` a structured object instead of an array
of free-text strings. This unlocks the attribution ledger (already in
the `ste-attribution` profile), liveness checks (already in the
validator's app-level rule 09), and corroboration counting (Belief 4 in
the Ethics Charter). The v0.2 string form keeps working as a
normalization shorthand."

### 2. Motivation

Why now? What is broken or unachievable today? What is the smallest
concrete example that motivates the change?

- Distinguish "user-facing motivation" (what the consumer
  experiences) from "implementation motivation" (what the
  implementation needs).
- Cite specific prior art: existing RFCs, ETHICS Charter clauses
  (R1–R9, C1–C3), GOVERNANCE.md sections, validator application-level
  rules (01–12), and why-rule docs.
- If the RFC supersedes an earlier document (a proposal in
  `docs/proposals/`, or an earlier RFC), say so explicitly in the
  "Supersession" subsection.

### 3. Detailed design

The technical meat. This is the section implementers will read most
carefully. Structure by feature / sub-change.

- **Use JSON snippets** (`jsonc` with `// comments`) for the data
  shape. For each new field, show one valid example and one negative
  example.
- **Use prose rules** for behavior that JSON Schema cannot express
  (the application-level rules). These rules will be added to
  `validator/ste-validator.js` and to `docs/why-rules/why-rule-NN.md`
  with the next available number.
- **Distinguish "additive/optional"** changes (the default; v0.2
  documents remain valid) from "breaking/required" changes
  (uncommon; requires explicit `ste_version` bump).
- **Cross-reference** every field with the existing schema section
  (e.g. "extends `v0.2/schema.json#/definitions/contribution_meta`")
  and with the validator (`validator/ste-validator.js:NNN`).
- **Migration**: a separate subsection. If the change is
  breaking, the migration path is a hard requirement, not a
  follow-up.

### 4. Drawbacks

What does this RFC make worse? What does it lock in? What is the
**cost of doing this**?

- Every change has costs. If the author can't articulate them,
  they haven't thought hard enough.
- A good drawback is concrete: "this requires updating 8 negative
  fixtures" beats "this requires more work".
- A good drawback includes the **reversibility** story: how hard
  is it to undo this RFC in 6 months if it turns out wrong?
- A good drawback distinguishes **short-term cost** (the PR will
  be long) from **long-term cost** (the schema has one more
  concept to learn).

### 5. Alternatives

What were the other designs considered? Why is this one better?

- Each alternative gets one paragraph. The "do nothing" alternative
  is always there; explain why it's worse.
- For each alternative, identify the **trigger** that would make it
  better: "if a future use case requires X, reconsider this
  alternative."
- Alternatives can be from prior art (cite: ETHICS Charter, OGC,
  OSM, Wikidata, IETF, W3C, RFC editor, etc.) or from earlier
  drafts in `docs/proposals/`.

### 6. Unresolved questions

Open issues that **need a decision before the RFC ships**. Each
question gets:

- The question (one sentence).
- The current options (2–4 max).
- A tentative leaning (with rationale).
- A deadline (the FCP can't close until these are resolved, or
  they are explicitly deferred to a follow-up RFC).

If there are no unresolved questions, the section says "None at
this time" — don't omit the section.

### 7. Future possibilities

Non-normative. What might come **after** this RFC lands?

- One paragraph per possibility, max 3–4 total. Don't speculate
  wildly; speculate concretely.
- A possibility becomes an RFC when the project decides to do it.
  The "Future possibilities" section is a parking lot, not a
  commitment.

### 8. References

List every external document, internal section, prior RFC, or
proposal that's cited. Use file-relative links.

- Format: `[label](path)` for internal; `[label](URL)` for external.
- Sort by importance, not alphabetically.
- Distinguish **normative** references (the RFC cannot ship
  without them) from **informative** references (the author
  considered them; the reader might want to).

## Optional but encouraged sections

- **Examples** — a complete example document with the proposed
  changes. Helps readers see the change in context.
- **Test plan** — for breaking changes, the test plan is
  mandatory; for additive changes, it's encouraged.
- **Open design questions** — questions that don't block the RFC
  but are worth discussing in FCP. These can move to "Unresolved
  questions" or be dropped during the FCP.

## Front matter (above the title)

```markdown
# RFC NNNN — <Title>

> **Status**: draft | final-comment-period | accepted | rejected |
>               postponed | implemented
> **Target version**: v0.3 / v1.0 / etc., or "not versioned" for
>                     process changes
> **Supersedes**: `docs/proposals/old.md` (if any)
> **Superseded by**: RFC NNNN (if any, filled in on supersession)
> **Author**: name, GitHub handle, optional affiliation
> **Sponsor**: name, GitHub handle (required by FCP)
> **Discussion**: issue or PR link
> **Created**: YYYY-MM-DD
> **Last updated**: YYYY-MM-DD
```

The front matter is the **only** normative metadata. Everything
else in the RFC is the author's argument for adoption.

## Anti-patterns

These are common failures; reviewers should call them out in FCP
comments.

- **"This is a small change"** — every change has a section 4
  (Drawbacks). If your RFC is "small", the drawbacks section is
  short, not absent.
- **"The team agreed"** — cite the discussion link. The argument
  stands on its own.
- **"Backward compatible"** — define the term. Backward
  compatibility for the v0.2 string format is different from
  backward compatibility for the v0.2 schema shape.
- **"Future work"** without a §7 — vague promises are not a
  roadmap. The Future Possibilities section is a list of
  parked, named, concrete next steps.
- **No §6 (Unresolved questions)** — every RFC has questions.
  The section forces the author to think about them.
- **Cross-references that don't resolve** — every `[text](path)`
  must point at a real path. Stale links are worse than no
  links.

## Lifecycle annotations (post-acceptance)

After an RFC is **accepted**, the following fields are filled in by
the implementer(s):

- `**Implemented in**: <commit hash or release tag>`
- `**Implementation PRs**: <list of PR links>`

These are added in the merge commit that closes the implementation
PR, not in the FCP-closing commit. The author of the RFC does not
edit these — the implementer does, to keep the author's argument
separate from the implementation record.
