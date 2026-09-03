# STE RFC Process

> Status: **proposal** — to take effect on ratification (target: 2026-10-15).
> Companion to `GOVERNANCE.md` §1 (roles & decisions) and §3 (quality gates).
> 30-day public-comment window before ratification.

This document is the **operating manual** for proposing, reviewing, and
ratifying changes to the STE core schema, profiles, validator, Ethics
Charter, GOVERNANCE, and the project itself. It answers three
questions:

1. *What* requires an RFC (and what doesn't)?
2. *How* does an RFC move from idea to shipped?
3. *Who* decides, and on what evidence?

It is deliberately not a constitution — see GOVERNANCE.md for that. It
is the procedure beneath the constitution. Where the two conflict,
GOVERNANCE.md wins, and this document is amended via its own process
(meta-RFC, see §6).

## 0. Why a written process now

The v0.1 → v0.2 → v1.0 transitions were all run informally by the
project owner, with help from review issues and a small group of
contributors. That worked for a 1-person × 89-school demo. It will not
work when:

- The schema gets more than one official profile (JSON-FG, OHM,
  ste-attribution, ste-challenge, ste-memo are all in flight).
- The first public API consumers start writing against it, and a
  silent breaking change costs them real money.
- A second maintainer joins, and the "ask wonderingWu" decision path
  becomes a bottleneck.
- An external Standards Development Organization (SDO) — OGC, W3C,
  IETF, OSGeo — asks "how do you make decisions?" and the answer
  cannot be "vibes".

A written process is also the precondition for the project's
**Standards Credibility** claim, which in turn is the precondition for
joining any SDO working group (per OGC's IPR policy, per W3C's process
requirements, per the Linux Foundation's Closed-Loop series).

## 1. What requires an RFC

The rule of thumb: **anything that creates or removes a public
contract needs an RFC**. The following list is exhaustive.

### 1.1 Always requires an RFC

- Any change to the **core schema** under `v0.*/` (any field, any
  constraint, any `const`, any enum value). Changes to
  **legacy versions** (e.g. v0.1, kept for compatibility with
  existing data per the README) follow a stricter process:
  only critical security / correctness fixes; not regular
  features. Legacy-version changes go through a dedicated RFC
  tagged `legacy-version-patch`.
- Any change to **ETHICS.md** or **ETHICS.en.md** (any rule, any
  mechanism, any platform commitment).
- Any change to **GOVERNANCE.md** (any role, any decision rule, any
  quality gate).
- Any change to **PATENT-PLEDGE.md** (per its own §4).
- Any change to **LICENSE-*** files.
- Any **new official profile** (a profile is "official" once it's
  admitted under GOVERNANCE.md §3.4).
- Any **breaking change** to a published official profile
  (a "breaking change" is one that a previously-valid document can
  no longer satisfy without modification, per the SemVer-style rule
  in GOVERNANCE.md §4).
- Any change to the **reference validator**'s pass/fail behavior on
  the canonical fixture set.
- Any change to the **public CLI** or **public SDK** surface. As
  of 2026-09-02, the canonical list of public surfaces is
  maintained **in this document's §1.1.1 below** (a separate
  `docs/public-surface.md` will be created as a follow-up
  tracking issue once a second maintainer joins; until then, this
  section enumerates the public surface directly). **This
  inlined enumeration is the authoritative list until
  `docs/public-surface.md` exists.**

#### 1.1.1 Public surface (inlined until `docs/public-surface.md` is created)

The following artifacts constitute the project's public surface
as of 2026-09-02. Changes to any of these require an RFC
(per §1.1 above). When `docs/public-surface.md` is created as
a follow-up artifact, this enumeration moves to that file and
this subsection becomes a pointer.

- **JSON Schema files** under `v0.1/`, `v0.2/`, and any future
  `v0.*/` or `v1.*/` directories
- **Reference validator** at `validator/ste-validator.js` (the
  single-file UMD build; the bundled copy in `demo/` is
  byte-identical by CI)
- **CLI scripts** under `scripts/` that the project documents in
  the README (e.g. `local-validate.mjs`,
  `check-validator-sync.mjs`, `test-importer.mjs`)
- **Demo public entry points** under `demo/` that the GitHub
  Pages site consumes (data loaders, map renderers, time
  slider logic)
- **Profile schemas** once any are admitted under §3.4

Items **NOT** in the public surface (changes don't require an
RFC, but should still be reviewed by a maintainer):
- Internal scripts (CI workflows, dev-only tooling)
- Comments, formatting, and non-normative documentation
- The CC0 schema text itself (changes to the schema's *meaning*
  require an RFC; rewording for clarity does not)

### 1.2 Does not require an RFC

- **Bug fixes** that preserve observable behavior on the canonical
  fixture set (governed by §4.2 fast-track below).
- **Documentation** in `docs/` that is not normative (e.g. a new
  tutorial, a new example, a new "why this rule" essay).
- **Test fixtures** themselves (additions, deletions, and
  modifications, *as long as* the canonical fixture set is preserved
  verbatim or its changes are themselves in an RFC).
- **Internal refactors** in the validator, scripts, or build, as
  long as no public contract changes.
- **Editor preferences** (e.g. tab vs. space, line length), as
  long as the canonical fixtures' byte-equality is preserved where
  required (the CI parity check).
- **Trivial additions** to controlled vocabularies when the existing
  vocabulary explicitly invites community expansion (e.g. adding a
  new OSM-style `tags` value; the `ste:`-prefixed namespace is open
  by design). This is a notable exception: profile authors may add
  *non-normative* values without an RFC, but the *introduction of
  the rule allowing such expansion* itself requires an RFC.

### 1.3 Gray zone

Sometimes a change *feels* like a bug fix but actually changes a
contract. When in doubt, file an RFC. The cost of an unnecessary RFC
is much lower than the cost of a silent contract change. The
maintainer reviewing the draft will tell you which.

## 2. The RFC lifecycle

```
                 ┌──────────────────────┐
                 │   Draft (PR open)    │
                 │  comments + edits    │
                 └──────────┬───────────┘
                            │  sponsor requests final-comment period
                            ▼
                 ┌──────────────────────┐
                 │ Final Comment Period │
                 │   14 days minimum    │
                 └──────────┬───────────┘
                            │  decision logged
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────┐                       ┌──────────────┐
│  Accepted    │                       │  Rejected    │
│ (FCP closed  │                       │ (FCP closed  │
│  "accepted") │                       │  "rejected") │
└──────┬───────┘                       └──────────────┘
       │
       ▼
┌──────────────┐
│  Implemented │  PRs land, CI green, tag cut
│  (stable)    │
└──────────────┘
```

The lifecycle mirrors the [Rust RFC process](https://github.com/rust-lang/rfcs),
adapted for a small project's actual scale.

### 2.1 Draft

- **Trigger**: anyone files a PR named `rfc: <slug>.md` against
  `docs/rfcs/`. The PR is the RFC; the file in `docs/rfcs/` is the
  RFC text.
- **Template**: copy `docs/rfcs/0000-template.md` into
  `docs/rfcs/NNNN-<slug>.md` (NNNN is the next number; use
  `gh pr create` or a small bot to increment).
- **Template content** (see also §3 below): Summary, Motivation,
  Detailed Design, Drawbacks, Alternatives, Unresolved Questions,
  Future Possibilities.
- **Discussion**: happens in PR comments and the linked issue.
- **Editing**: the author is expected to push commits addressing
  comments; the PR is the conversation.
- **Duration**: no minimum, no maximum. A draft that has had no
  activity for 6 months is closed by the maintainer ("stalled" label
  in the issue).

### 2.2 Final Comment Period (FCP)

- **Trigger**: a project sponsor (see §3.2) marks the PR with
  `final-comment-period` label and announces it in the issue
  tracker.
- **Duration**: minimum 14 days; for changes to ETHICS.md, GOVERNANCE.md,
  or PATENT-PLEDGE.md, minimum 30 days (consistent with the Charter's
  amendment notice period).
- **During FCP**: the RFC is frozen; only typo / non-substantive
  edits are merged. Substantive changes reset the FCP clock.
- **Comments from anyone are accepted**. A comment from a project
  maintainer or sponsor carries weight; a comment from a downstream
  user with a concrete use case carries weight; a comment from a
  bot carries no weight.

### 2.3 Decision

At the end of FCP, the sponsor logs a decision via PR review:

- **Accepted** → the RFC is merged; the spec is "frozen" at the
  merged state.
- **Rejected** → the PR is closed; the rationale and any standing
  objections are recorded in the rejection comment.
- **Postponed** → the PR is converted to a "tracking issue" with a
  clear re-opening criterion.

In the BDFL phase (per GOVERNANCE.md §1, until v1.0), the BDFL has
the final say and must publish the rationale. In the post-v1.0
maintainer phase, decisions follow GOVERNANCE.md §1 with the
"public decision log" rule.

### 2.4 Implementation

- **Trigger**: the accepted RFC is implemented via one or more
  follow-up PRs.
- **Quality gates** per GOVERNANCE.md §3 must pass. **Note**
  (added 2026-09-02): as of 2026-09-02, the validator
  equivalence gate in GOVERNANCE.md §3.5 is **planned, not
  implemented**; until it is implemented, the rule-count
  cross-check in `scripts/check-validator-sync.mjs` is the
  substitute, per GOVERNANCE.md §3.5's "rule-count constant
  crosswise" fallback.
- **Tag**: when the implementation ships, the implementation PR or
  the post-merge commit is tagged with the RFC number
  (`rfc-0042-implemented`). The release notes (see §5) cite the RFC
  by number.
- **Stabilization window**: for breaking changes to a published
  schema or profile, the implementation ships as a `-pre` or `-rc`
  tag for at least 30 days before being declared stable. This gives
  consumers a chance to test the new contract.
- **Rollback if the implementation breaks a downstream consumer
  (added by governance-reviewer pass 2026-09-03).** If, during
  the stabilization window or within 90 days of the stable
  tag, a downstream consumer reports a regression that is
  attributable to the implementation rather than to a
  pre-existing consumer-side issue, the BDFL (or, post-v1.0,
  the maintainer set) may:
    1. revert the implementation commit(s) to restore the
       pre-RFC state on `main`; the revert commit is tagged
       `rfc-0042-reverted` and the corresponding `CHANGELOG.md`
       entry is annotated with a link to the consumer's
       reproducer issue;
    2. open a follow-up RFC to address the regression as a
       separate normative change; the original RFC is **not**
       considered withdrawn unless the follow-up RFC explicitly
       says so.
  The choice between (1) and (2) is the BDFL's (or maintainer
  set's) discretion; the chosen path is recorded in the
  follow-up issue. The 90-day window is the
  governance-reviewer recommendation (matches the
  PATENT-PLEDGE §3 spirit of bounded permanence) and is
  revisable via this document's §6 meta-RFC.

## 3. Roles

### 3.1 Author

Anyone. The first PR is the entry point; the author doesn't need
sponsorship to start.

### 3.2 Sponsor

A project maintainer or the BDFL who:

- Reviews the draft for scope (does it belong as an RFC?).
- Merges substantive improvements.
- Triggers FCP.
- Logs the final decision.

Every RFC must have at least one sponsor by the time it enters FCP.
A draft can be merged as a "sponsored draft" with a sponsor attached,
or it can sit without a sponsor (the project then decides whether to
adopt it as a "community" draft or close it).

### 3.3 Reviewer

Anyone. Reviewers comment in PRs. There is no formal reviewer
hierarchy in the BDFL phase.

### 3.4 Decision-makers

Per GOVERNANCE.md §1: BDFL in the BDFL phase; the maintainer set
post-v1.0. The decision-makers MUST publish their reasoning in the
FCP-closing comment.

**No-appeal note (added by governance-reviewer pass
2026-09-03).** In the BDFL phase, the BDFL's FCP-closing
decision is **final within this process**. There is no
internal "appeal" mechanism because the project's review
maturity (one person × 95-school demo at the time of
writing) does not yet support a tribunal-style
reconsideration step. A dissenter's recourse is:
(a) re-open the RFC as a new draft RFC after a substantive
new argument or evidence surfaces (per §2.1, no minimum
time gap); or (b) escalate to the ETHICS §3 dispute
mechanism **only** if the RFC decision implicates a
specific data-level harm that falls within the Charter's
scope (e.g. a decision to expose personally identifying
information). The ETHICS §3 mechanism is **not** a
general-purpose appeal for governance disagreements. In
the post-v1.0 maintainer phase, the maintainer set
defines an appeal mechanism; this section will be
updated when that mechanism exists.

### 3.5 No "approval committee"

There is no formal approval committee in the BDFL phase. The whole
point of public-comment + posted rationale is to keep the decision
transparent without needing a body to convene. The ETHICS Charter's
dispute mechanism is **not** the same as the RFC process and is
**not** used to resolve RFCs; the two are about different kinds of
disagreement.

## 4. The two fast-tracks

Two classes of changes need an RFC but don't need a 14-day wait.

### 4.1 Editorial fast-track

For changes that are:

- A typo, grammar, or formatting fix.
- A correction to factual inaccuracy (e.g. a wrong OGC document
  number cited in a profile doc).
- A clarification that **does not change** the meaning of any
  normative statement.

A maintainer can apply the `editorial-fast-track` label and merge
with a single approval, **without** going through FCP. The
corresponding commit message must contain `Editorial, no FCP
required: <one-sentence rationale>`.

### 4.2 Bug-fix fast-track

For changes that:

- Are flagged as bugs in the issue tracker with a reproducer.
- Do not change observable behavior on the canonical fixture set.
- Do not relax any `const` or remove any `required`.

A maintainer can apply the `bug-fix-fast-track` label and merge
with one additional maintainer approval (i.e. two total, including
the merger). The PR description must cite the reproducer issue and
state which fixture or test case demonstrates the bug.

If a change starts as a "bug fix" but turns out to be a behavior
change, the maintainer must convert the PR into an RFC, retroactive
to the discovery. The original PR is reverted; the change re-enters
as a normal RFC.

## 5. Release notes

The project keeps `CHANGELOG.md` in [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
format. The release notes for a version MUST:

- List every implemented RFC by number and title.
- List every breaking change since the last version, in plain
  language.
- List the canonical fixture set's hash (or a brief description of
  what was added/removed).
- List the validator's "rules count" (the cross-check from
  GOVERNANCE.md §3.5).
- Be written **before** the release tag, not after.

## 6. Amending this process

This document is itself subject to the RFC process — a meta-RFC. Any
amendment requires the standard FCP and is the responsibility of the
BDFL or, post-v1.0, the maintainer set.

## 7. Anti-patterns to watch for

- **"Quick fix" PRs that quietly change the schema**. The most
  common failure mode. The fix is to require the author to file a
  `needs-rfc` issue first; the PR is then either converted to a
  draft RFC or its scope is reduced to a non-RFC change.
- **"We can interpret it that way"** — using documentation to
  *change* the contract, instead of changing the schema. Not
  allowed: if the meaning changes, the schema must change, and an
  RFC must precede.
- **"It's an emergency"** — using a fast-track to bypass review.
  The fast-tracks above are narrow; if the emergency is real, the
  fix is a hotfix branch that gets an RFC on the same day, not a
  silent merge.
- **"RFC-driven development"** — using RFCs to settle every
  question, including ones that have no normative impact. Use the
  GitHub Discussions board for non-normative conversations.

## 8. Relationship to other governance

| Document | Purpose | Process |
|---|---|---|
| `GOVERNANCE.md` | Who has what role, what the rules are | This RFC process |
| `ETHICS.md` | What data rules apply | This RFC process for amendments; ETHICS §3 for disputes |
| `LICENSE-CC0-1.0` | What license applies to schema text | This RFC process (re-ratification required to change) |
| `PATENT-PLEDGE.md` | Patent non-assertion | Its own §4 amendment process |
| `CHANGELOG.md` | What shipped when | Maintained via this RFC process (each accepted RFC = a CHANGELOG entry) |
| ETHICS §3 dispute mechanism | How data-level disputes are resolved | Independent of this process; never used for spec disputes |

## 9. References

- Rust RFC process: <https://github.com/rust-lang/rfcs>
- Python PEP 1: <https://peps.python.org/pep-0001/>
- IETF RFC 2026 (BCP 9): "The Internet Standards Process"
- W3C Process Document: <https://www.w3.org/2023/Process-20230612/>
- Keep a Changelog 1.1.0: <https://keepachangelog.com/en/1.1.0/>
- Open Web Foundation Working Group Process (used for the OWFa
  reference in `PATENT-PLEDGE.md`)

---

**Authors**: STE project (@wonderingWu)
**Status**: proposal, 30-day public-comment window
**License of this document itself**: CC0 1.0
