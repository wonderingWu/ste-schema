# STE Defensive Patent Pledge

> **NOT LEGAL ADVICE.** This document is a draft proposal
> drafted by a non-lawyer project maintainer; it has **not** been
> reviewed by a patent attorney. Before ratification (target:
> 2026-10-01), this pledge MUST be reviewed and approved by a
> qualified patent attorney admitted in at least one jurisdiction
> where the Project may have patent exposure (e.g. CN, US, EU).
> Nothing in this document is a substitute for professional
> legal advice for any specific implementation, adoption, or
> enforcement scenario. **Why this disclaimer is required**:
> OGC's own 21-045r1 License Agreement (the spec this project's
> profile targets) explicitly states "THIS LICENSE IS A
> COPYRIGHT LICENSE ONLY, AND DOES NOT CONVEY ANY RIGHTS UNDER
> ANY PATENTS" — the absence of project-level patent protection
> is **a known gap in the OGC standards ecosystem**, not a
> hypothetical concern.
>
> Status: **proposal** — to take effect on a chosen date (target: 2026-10-01).
> Companion to `LICENSE-CC0-1.0` (schema text) and `LICENSE` (code, MIT).
> 30-day public-comment window before ratification; objections posted to
> issue tracker with `patent-pledge:` prefix.
>
> Human-readable summary first; legal text after §0.
>
> **In plain English**: the CC0 license on our schema text does not cover
> patents. This pledge closes that gap. We irrevocably promise not to sue
> anyone for using any patent we own or control if they are using it to
> implement the STE schema, validator, or reference docs — as long as
> they don't sue us first. The pledge applies whether the schema is used
> as-is, modified, or embedded in a commercial product. It does not
> cover unrelated patents you may need to implement *other* software.

---

## 0. Why this file exists

`LICENSE-CC0-1.0` dedicates the schema text to the public domain.
**Critical correction (caught in review 2026-09-02, verified
against CC0 1.0 Universal legal code §4(a))**: the
earlier-draft "CC0 includes an explicit disclaimer of patent
rights to the extent the dedicator holds them" is a
**misreading of CC0**. The actual CC0 §4(a) "Limitation on
Rights" states verbatim: **"No trademark or patent rights
held by Affirmer are waived, abandoned, surrendered,
licensed or otherwise affected by this document"**. In
other words, CC0 does **not** address patents at all — it
is a copyright dedication, not a patent license. The
"disclaimer" in §4(a) goes the **opposite** direction: CC0
expressly disclaims any patent effect. **This makes a
separate defensive patent pledge necessary, not
optional**: an implementer of STE who relies only on CC0
has no patent protection from the Project, only copyright
freedom. The pledge does not bind:

- Future patents filed by the project after CC0 is applied to a given
  version of the schema.
- Patents held by individual contributors (CC0 binds only the
  copyright holder; contributors retain their own patent portfolios
  unless they sign a separate agreement).
- Patents held by entities the project later collaborates with.

A defensive patent pledge (DPP) closes those three gaps for the
project's own patents and (with a contributor patent assignment in
§6 below) for contributors' patents. It is informed by the same
instruments used by [W3C Patent Policy (current: 2025-05-15;
the 2020-09-15 archived version is at
https://www.w3.org/policies/patent-policy/20200915/)](https://www.w3.org/policies/patent-policy/),
[Open Web Foundation Agreement 1.0](https://www.openwebfoundation.org/the-agreements/the-owf-1-0-agreements-2-2/),
[OGC Intellectual Property Policy](https://www.ogc.org/about/policies/),
and the [Open Patent Non-Assertion Pledge (Dfinity,
2014-11-18; the Dfinity Foundation page may have moved since;
retrieved 2024-XX-XX as a snapshot citation)](https://dfinity.org/blog/2014/11/18/open-patents/).
[OpenChain](https://www.openchainproject.org/) is **not** a
patent-pledge reference (it's a license-compliance process
specification); the earlier-draft inclusion of OpenChain was
a citation error caught in review and removed.

**What this pledge is NOT**:

- Not a "patent license" in the GPL sense. There is no royalty stream;
  the pledge is irrevocable and royalty-free.
- Not a "patent assignment". We keep our patents. We just promise not
  to use them offensively against implementers of STE.
- Not a Contributor License Agreement (CLA). CLAs are a separate
  concern; see §6 for the open question on whether the project wants
  one.

## 1. Definitions

- **"Project"** means the `wonderingWu/ste-schema` repository and any
  successor repository designated by `GOVERNANCE.md` at the time of
  the relevant act.
- **"Schema Material"** means any document, schema, controlled
  vocabulary, or normative reference in the Project at the moment of
  the act, including but not limited to `v0.1/`, `v0.2/`, the
  profile directories, `ETHICS.md`, `ETHICS.en.md`, `GOVERNANCE.md`,
  and `docs/`. Future schema versions inherit the pledge
  automatically unless explicitly excluded by an amendment under §4.
- **"Necessary Patent Claim"** means a claim of a patent or patent
  application that is necessarily infringed by implementing the Schema
  Material in its unmodified form, or, if the implementer has
  modified the Schema Material, by implementing the unmodified
  Schema Material itself. The "unmodified form" is the Schema Material
  as published by the Project at the time the Implementer first
  relied on this pledge. Optional features of the Schema Material do
  not pull in the necessary-claim scope unless the implementer
  actually uses them.
- **"Implementer"** means any natural person, organization, or
  government entity that uses, modifies, distributes, sells, imports,
  hosts, or otherwise exercises any right in the Schema Material, in
  compliance with applicable law (including export-control and
  economic-sanctions law). For the avoidance of doubt, an entity that
  is the subject of comprehensive sanctions administered by the
  UN, EU, US (OFAC), or PRC (MOFCOM) is not an Implementer with
  respect to activities that would be prohibited by such sanctions.
- **"Affiliate"** of a person or entity means any other person or
  entity that, directly or indirectly, controls, is controlled by,
  or is under common control with the first person or entity. A
  party "in privity" with an Implementer (used in §3) includes the
  Implementer's Affiliates.
- **"Dispute"** means the specific patent infringement claim,
  validity-challenge proceeding, or other action by an Implementer
  (or a party in privity) that triggers §3.
- **"Defensive Termination Event"** has the meaning in §3.

## 2. The pledge

The Project irrevocably pledges:

1. **Royalty-free, worldwide, non-exclusive license**. Subject to §3
   (defensive termination), the Project grants every Implementer a
   royalty-free, worldwide, non-exclusive license under any Necessary
   Patent Claim that the Project owns or controls, **solely to make,
   have made, use, sell, offer for sale, import, and otherwise
   dispose of implementations of the Schema Material**. The license
   is non-transferable and non-sublicensable, **except** that the
   license is automatically transferred to a party that acquires all
   or substantially all of the Implementer's implementation of the
   Schema Material (whether by merger, acquisition, asset purchase,
   or other operation of law effecting a transfer of the business
   line that practices the Schema Material); any such transferee
   takes the license subject to all of this pledge's terms,
   including §3. The Project further commits that, if it transfers
   any Necessary Patent Claim to a third party, the Project will
   require that third party, as a condition of the transfer, to be
   bound by this pledge with respect to the transferred claims. The
   Project's intent is that the pledge travels with the patent, not
   with the Project.
2. **No assertion**. The Project will not assert any Necessary Patent
   Claim against any Implementer for any of the activities in §2.1,
   except upon a Defensive Termination Event.
3. **No retaliation against licensees**. The license survives the
   Implementer's grant of similar licenses to others, including
   commercial sublicensing of the Schema Material or its
   implementations.
4. **No expansion by implication**. The pledge does not cover patent
   claims that are not Necessary Patent Claims. In particular,
   implementing software that happens to also be useful for something
   unrelated to the Schema Material is not in scope unless the Schema
   Material is the necessary basis.
5. **No formal registration required**. The pledge takes effect on
   the act of use; no click-through, signature, registration, or
   notice is required for the Implementer to be covered.
6. **No formal offer; pledge is intended to be irrevocable**. The
   pledge is unconditional once made; nothing in this document
   should be construed as a conditional offer that can be revoked
   by the Project, except via §4 amendment. The Project's stated
   intent is that the pledge as a whole is irrevocable for any
   Implementer who relied on it before an amendment's effective
   date: §4 amendments may add scope but may **not** retroactively
   reduce the scope of the license granted to a pre-existing
   Implementer. An individual Implementer's license may be
   terminated only by a §3 Defensive Termination Event, which
   terminates the license *with respect to that Implementer and
   parties in privity* — not the pledge as a whole. The two
   concepts are distinct: pledge-as-whole (intended-irrevocable
   subject to §4 amendment) ≠ individual-license (terminable per
   §3).

## 3. Defensive termination

The license in §2 terminates, **with respect to the Implementer that
triggered the event and any party in privity with that Implementer
for the same dispute**, upon the earliest of:

1. The Implementer (or a party in privity) files a patent
   infringement claim against the Project, any contributor to the
   Project, or any other Implementer of the Schema Material, that
   alleges infringement by any portion of the Schema Material, the
   reference validator, or any implementation of the Schema Material.
2. The Implementer (or a party in privity) initiates a proceeding
   before a patent office, court, or administrative body
   (jurisdiction-neutral; the U.S. PTAB inter partes review is
   one example but the trigger is **not** limited to U.S.
   proceedings) asserting that the Schema Material is not
   patentable, is invalid, or otherwise contests the validity
   of any Necessary Patent Claim the Project may hold. The
   license under §2 terminates with respect to the Implementer
   and parties in privity; the Project does not assert
   additional claims beyond the termination.
3. The Implementer (or a party in privity) takes any action that
   is materially inconsistent with the defensive purpose of this
   pledge, including but not limited to: (a) sublicensing this
   pledge as if the Implementer were the licensor, (b)
   misrepresenting the scope of the license granted hereunder to
   third parties in a manner that would facilitate a third
   party's evasion of the Project's patent rights, or (c)
   assisting a third party in circumventing the Project's
   patent rights in a manner that would frustrate the pledge's
   defensive purpose.

Defensive termination is **permanent with respect to the Dispute
that triggered it**. The Implementer whose license has been
terminated may petition the Project for re-instatement, which
the Project may grant at its sole discretion if the Implementer
demonstrates that (a) the conduct triggering the termination has
fully ceased and is unlikely to recur, and (b) the Implementer
is acting in good faith with respect to the Project and other
Implementers. The Project does not represent that re-instatement
will be granted in any particular case. The Project's intent in
providing this discretion is to deter offensive patent
litigation while preserving the ability to forgive good-faith
correction, not to obtain settlement leverage.

## 4. Amendment

This pledge may be amended only by:

1. A public RFC under the project's RFC process (see
   `docs/governance/RFC-process.md`).
2. A public-comment window of the duration specified in the
   then-current RFC process for governance amendments
   (currently 30 days, per `docs/governance/RFC-process.md`
   §2.2).[^amend-window] The Project may, in its sole
   discretion, extend the public-comment window for any
   amendment that materially expands or contracts the
   scope of the license granted under this pledge.
3. Approval by the project's governance body as defined in
   `GOVERNANCE.md` at the time.

Amendments may **add** scope (e.g. extend the pledge to cover a
new category of Necessary Patent Claim); they may **not reduce** the
pledge's scope as it applies to anyone who relied on it before the
amendment's effective date. (Pre-existing implementers keep the
stronger version; new implementers get the amended version.)

## 5. No warranty (as with all open licenses)

THE SCHEMA MATERIAL IS PROVIDED "AS IS" AND THE PROJECT DISCLAIMS
ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
AND NON-INFRINGEMENT OF THIRD-PARTY PATENTS. THE "NON-INFRINGEMENT"
DISCLAIMER IN THIS SECTION REFERS TO THE PROJECT'S DISCLAIMER OF
ANY REPRESENTATION THAT THE SCHEMA MATERIAL DOES NOT INFRINGE
PATENTS HELD BY PARTIES OTHER THAN THE PROJECT; IT DOES NOT AFFECT
THE PROJECT'S SEPARATE PROMISE UNDER §2 NOT TO ASSERT NECESSARY
PATENT CLAIMS AGAINST IMPLEMENTERS. NOTHING IN THIS PLEDGE GRANTS
ANY PATENT LICENSE BEYOND THE NECESSARY PATENT CLAIMS IN §1; IN
PARTICULAR, THE PLEDGE DOES NOT GRANT ANY LICENSE TO TRADEMARKS,
COPYRIGHTS, OR TRADE SECRETS (those are governed by the project's
other licenses).

## 6. Open questions (deliberately not yet answered)

1. **Should the project require a Contributor Patent Assignment (CPA)
   or Contributor License Agreement (CLA) from contributors?** A CLA
   binds the contributor's patents to the same pledge. Pros:
   completeness (no contributor can later assert a patent against
   implementers). Cons: friction in contribution flow, requires legal
   review by each contributor, can be culturally off-putting for a
   CC0 project. **Lean**: stay with no CLA for v0.x, re-evaluate at
   v1.0 with explicit community input. If a contributor refuses to
   license their Necessary Patent Claim under this pledge, the
   project may, at its sole discretion, exclude that contributor's
   contributions from the Schema Material. **This §6.1 is an
   explicit open question pending RFC resolution.** Until that RFC
   closes, (a) the OGC IP proposal's references to "§6.1's
   mechanism" are aspirational, not binding contributor
   commitments, and (b) the project commits to flagging this gap
   in any OGC IP submission so that reviewers can scope the
   proposal accurately.
2. **Should "Project" be extended to cover the Ethics Charter?**
   The Charter is normative for the schema (per GOVERNANCE.md §2 and
   the schema description). For consistency, it is in scope as
   drafted. Confirm via RFC.
3. **Trademark of "STE" / "时痕" / "TimeTrace".** The project's
   brand (per the `ETHICS.md` header) is **时痕 · STE**; a
   trademark application has **not yet been filed** in any
   jurisdiction. The project name is currently used in commerce
   without registration; trademark risk before filing is low.
   The classes 9 (NICE: scientific apparatus) and 42 (NICE:
   scientific and technological services) noted in the earlier
   draft are **planned** filing classes for the eventual
   application; these will be reviewed for CN-equivalent
   (《类似商品和服务区分表》) classes by qualified trademark
   counsel before any filing.[^tm-jurisdictional] The pledge
   does not affect trademark rights; a forthcoming
   `TRADEMARKS.md` will state the project's policy on
   nominative fair use of the mark by the community.
   **ETHICS.md already uses "时痕" as the
   project brand; GitHub repo name is `ste-schema`.** Until a
   formal policy is published, the project assumes
   nominative fair use by the community.

## 7. Effective date and ratification

This pledge takes effect on the date the Project publishes the
ratification notice (target: **2026-10-01**, subject to a
30-day public-comment window that ends no earlier than that
date). The Project may, in its sole discretion, delay
ratification or decline to ratify. **No party acquires any right
under this pledge until ratification occurs**; the proposal
text before ratification is informational only. Before
ratification, the Project commits to:

- Publishing the proposal as an issue titled "Defensive Patent
  Pledge ratification".
- Cross-posting to relevant forums (OSGeo, OGC, W3C PROV community
  group, OpenHistoricalMap talk).
- Holding a 30-day comment window, with a public decision log.
- Publishing a decision log that records every comment received
  and the Project's response (accept / reject / defer).

## 8. References

- W3C Patent Policy (current 2025-05-15; the 2020-09-15
  archived version is at
  https://www.w3.org/policies/patent-policy/20200915/;
  accessed 2026-09-02)
- Open Web Foundation Agreement 1.0 — Selected Claims License
  (https://www.openwebfoundation.org/the-agreements/the-owf-1-0-agreements-2-2/;
  accessed 2026-09-02)
- Dfinity Open Patent Non-Assertion Pledge (2014-11-18; the
  original Dfinity Foundation post may have moved — Wayback
  Machine snapshot search URL
  https://web.archive.org/web/2024*/https://dfinity.org/blog/2014/11/18/open-patents/;
  accessed 2026-09-02)
- OGC Intellectual Property Policy
  (https://www.ogc.org/about/policies/; accessed 2026-09-02;
  the OGC member-submission IP terms interact with this
  pledge but are **not** a substitute for it)
- Creative Commons CC0 1.0 Universal — §4(a) "Limitation on
  Rights" (verbatim: "No trademark or patent rights held by
  Affirmer are waived, abandoned, surrendered, licensed or
  otherwise affected by this document") and the practical
  limits highlighted by the CC0 legalcode commentary.
  Accessed 2026-09-02.
- W3C PROV-O (Recommendation 2013-04-30; the W3C PROV
  Working Group concluded in 2013; PROV-O is now maintained
  as a community resource; https://www.w3.org/TR/prov-overview/;
  accessed 2026-09-02) — referenced as a sibling instrument
  for the project's attribution profile, **not** as a
  patent-pledge authority.

## 9. Severability, governing intent, and no admission

**9.1 Severability.** If any provision of this pledge is held by
a court or other body of competent jurisdiction to be invalid,
illegal, or unenforceable, the remaining provisions shall
continue in full force and effect. The affected provision shall
be reformed to the minimum extent necessary to make it valid,
legal, and enforceable while preserving the Project's stated
intent; if such reform is not possible, the affected provision
shall be severed and the rest of the pledge shall remain in
effect.

**9.2 Governing intent; jurisdiction-neutral enforcement.**
This pledge is intended to be enforced under the laws of any
jurisdiction in which a Dispute arises. The Project does not
designate a single governing law; the Project's intent is that
this pledge be given the maximum effect permitted by applicable
law in any forum, and that the Project will not assert any
jurisdiction-specific limitation that would defeat the pledge's
defensive purpose. If a court construes a provision of this
pledge in a manner inconsistent with the Project's stated
intent, the Project's stated intent (as recorded in this
pledge) shall control the Project's conduct going forward,
subject to the court's binding judgment in the specific case.

**9.3 No admission.** Nothing in this pledge shall be construed
as:

  (a) an admission by the Project that any Necessary Patent
  Claim exists, is valid, or is infringed by any particular
  implementation;
  (b) a representation or warranty that this pledge is
  enforceable in any particular jurisdiction;
  (c) a waiver of any defense the Project may have in any
  specific Dispute, including but not limited to defenses
  based on the Implementer's conduct, the inapplicability of
  this pledge to the Implementer's activities, or the
  Implementer's failure to satisfy any condition of the
  license.

**9.4 No third-party beneficiary rights beyond those stated.**
Except as expressly set forth in this pledge, no third party
acquires any right, remedy, or standing under this pledge. An
Implementer's rights under this pledge are personal to the
Implementer's exercise of the license and do not create a
cause of action in any third party.

**9.5 Entire pledge.** This document, together with
`LICENSE-CC0-1.0` and `LICENSE` (MIT, code), constitutes the
Project's complete and exclusive statement of patent-related
terms with respect to the Schema Material, superseding any
prior oral or written communications on the same subject.

---

**Authors**: STE project (@wonderingWu)
**Status**: proposal, 30-day public-comment window
**License of this document itself**: CC0 1.0 (so that this text is
unrestricted for re-use in other projects' patent pledges)

---

[^amend-window]: The 30-day window is the project's default
for governance amendments generally. W3C's Patent Policy uses
60-day windows for some instruments; the Project has elected a
shorter default because §4's restriction against retroactive
scope-reduction protects pre-existing Implementers regardless
of the window length. Earlier drafts cited 60 days; that
figure was a citation error and is corrected here to match
`docs/governance/RFC-process.md` §2.2.

[^tm-jurisdictional]: The CN trademark classification reference
(《类似商品和服务区分表》) in this §6.3 is provided for the
convenience of the maintainer; it is not an operative term of
this pledge and is not jurisdiction-binding on the Project
outside of CN. The pledge itself is jurisdiction-neutral.
