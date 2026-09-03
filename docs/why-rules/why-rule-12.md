# Why Rule 12: Baidu Baike Content Not Ingested

## The rule

`external_ids.baidu_baike` stores a **link only** (the lemma ID
or URL slug). The platform MUST NOT extract the lemma's content
(paragraphs, photos, references) into STE data. The Baidu Baike
content is stored as a pointer; the content lives on Baidu's
servers under Baidu's terms.

## Why JSON Schema can't say this

The schema can store the `baidu_baike` field; it can't
prevent an application from copying Baidu Baike content into
the field. The enforcement is at the application / pipeline
boundary, not at the schema.

## Why it matters

- **Licensing**: Baidu Baike's content is published under
  Baidu's terms, which are not CC0, ODbL, or any open license
  compatible with STE's data licensing (R8). Ingesting the
  content into a CC0 / ODbL dataset is a license violation —
  the data would no longer be re-licensable downstream.
- **Copyright**: Baidu Baike's content is contributed by users
  under Baidu's contributor agreement; the platform has no
  right to re-license it. Storing the link is fine; copying
  the content is not.
- **Reference role**: the `baidu_baike` reference is for
  *cross-checking*, not for *copying*. A Chinese-language
  contributor may want to point to a Baidu Baike lemma as
  evidence ("this is the entity's name in Chinese"), without
  bringing the lemma's prose into the dataset. The `note`
  field on the `external_id_ref` can record the reason for
  the link.

## How to implement

1. **At ingest** (e.g. an import script from Baidu Baike):
   the script MUST extract the lemma ID / URL slug only.
   The content (paragraphs, photos) MUST NOT be stored in
   STE fields. The import script's source code is
   reviewable for compliance.
2. **At export** (C2): the `baidu_baike` field is exported
   as a URL / ID, not as content. The export bundle MUST
   NOT contain a copy of the Baidu Baike lemma.
3. **At cite** (e.g. a UI that displays a Baidu Baike
   link): the UI shows a link, not the content. The
   consumer can fetch the content from Baidu's site if
   they have the right to do so; the platform doesn't
   proxy it.
4. **The schema's role**: the `baidu_baike` field's
   description in `v0.2/schema.json` warns about
   licensing. The validator doesn't enforce (the
   validator can't tell the difference between a
   slug like `汇文中学` and a slug *plus* a
   paragraph of prose). The licensing warning is
   the marker for the application maintainer.

## What's NOT in this rule

- A `baidu_baike` link is not invalid. It's a
  legitimate `external_ids` entry, with the same
  `verified` / `verified_at` / `note` provenance as
  any other external reference. The rule is about
  the **content**, not the **link**.
- The `wikipedia` field, by contrast, *can* be
  ingested with attribution (CC BY-SA on Wikipedia
  content; the schema's R8 licensing handles the
  attribution). The `baidu_baike` rule is specific
  to Baidu Baike's licensing; the same caution may
  apply to other non-open encyclopedias (e.g. some
  Chinese-language wiki variants), which should be
  evaluated case-by-case.

## Common failure modes

- A web scraper that copies the Baidu Baike HTML
  into a `description` or `narrative.text` field
  "for reference". The data is now contaminated
  with non-re-licensable content. The platform's
  CI should fail any document that includes
  `description` content with provenance that
  hints at "imported from baidu_baike" (the
  `description_provenance: "imported"` field is
  the marker; the application can flag and
  review).
- A UI that proxies the Baidu Baike content
  (e.g. an iframe that displays the Baidu Baike
  page inside the STE entity's page). This is
  also a license violation; Baidu Baike's
  published terms of service (the project's
  maintainer must read the **current** version,
  archived at `https://baike.baidu.com/help` and
  any linked licensing terms) **generally disallow
  proxying or scraping the content for reuse**.
  The UI should link out, not embed. The exact
  clause numbers and current text must be
  re-verified by the platform maintainer; this
  why-rule is a *design* constraint, not a legal
  opinion.
- A migration from "we have a few Baidu Baike
  imports" to "we have a clean dataset" that
  doesn't audit the existing imports. The
  audit is the platform's job, not the schema's.

## Reference

- Baidu Baike terms of service (the actual
  document, not a summary — the platform
  maintainer is responsible for reading the
  current terms)
- [`v0.2/schema.json` `external_ids.baidu_baike`
  description](../../v0.2/schema.json) —
  licensing warning
- ETHICS Charter R1 / R8 — source requirement
  and licensing
- [`docs/compatibility/2026-08-27-osm-overpass-report.md`](../compatibility/2026-08-27-osm-overpass-report.md)
  — the project's import-policy precedent (the
  "no-invention" policy applied at the import
  boundary)
