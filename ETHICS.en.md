# STE · Content & Ethics Charter v0.2

> (Project brand: 时痕 · STE — formerly TimeTrace / 时迹, renamed 2026-08-27. Brand change only; no charter clause is affected.)

> **Version note**: v0.2 completes the enforcement mechanisms on top of the v0.1 value statement. It has four parts: Beliefs (what we believe), Rules (how data is governed), Mechanism (how disputes are handled), Commitments (platform self-restraint).
> Items marked ⚠️ depend on technical capabilities not yet implemented; see Appendix A for the rollout timeline.
> This charter's version history is preserved forever — we treat our own charter the way we treat historical data (C3).

---

## Part 1 · Our Beliefs

**1. Historical truth can be approached infinitely, but never fully reached.**
What we can do is make evidence transparent, disputes visible, and methods reproducible.
"Reproducible" specifically means: data fully exportable, schema open-source, AI generation pipelines and prompt strategies public, anyone able to verify the same conclusions with the same evidence.

**2. Narratives are products of people.**
An AI-generated narrative is not "objective fact" — it is a version produced by a machine from training data. It must be clearly labeled, and its self-reported confidence must itself be treated with caution.

**3. Collective memory belongs to the people who create it.**
The platform does not own memory; it merely provides a container and index. This belief is honored through three things: open licensing (contributor grants a license rather than transferring ownership), the right of withdrawal (Rule R6), and data portability (Commitment C2).

**4. Disagreement is not a bug — it is a feature.**
When two narratives that both **meet the evidence standard** coexist, the platform shows the full evidence of both, rather than choosing for the user which is "correct".

**5. We do not manufacture an "official version".**
There is no "STE-certified" historical fact. The reliability of a fact is determined jointly by sources, evidence, and community confirmation — not by the platform.

**6. The platform is neutral toward opinions, but not toward methods.**
The precondition for a narrative to be displayed is not "someone believes it", but "it cites verifiable sources". Neutrality is the platform's attitude toward conclusions; non-neutrality is the evidence bar. Fabricating sources, tampering with historical materials, and organized manipulation of the confirmation mechanism are attacks on the evidence mechanism itself, and are not protected as "disagreement" under Belief 4.

---

## Part 2 · Data Rules

### R1 Sources
Every piece of data must be attributed to a source. Data without sources must not enter the formal dataset (it may be staged in the draft area, with 30 days to complete sources, after which it is removed).

### R2 Authors and Perspectives
Every narrative must carry a **perspective** and an **author identity**:

- **Perspective** (mandatory, one of four):
  `firsthand` / `secondhand` / `research` / `ai_generated`
- **Author identity** (three tiers, chosen by the contributor):
  - **Real name**: publicly verifiable identity
  - **Persistent pseudonym**: a consistent pen name across entries, able to accumulate reputation
  - **Platform-escrowed anonymity**: the platform verifies the authenticity of the source but does not publicly reveal the identity. Intended for oral histories involving traumatic memories, politically sensitive periods, or personal safety risk. Escrowed information is stored encrypted in a minimally sufficient manner and may only be unsealed under legal compulsion or a unanimous committee resolution; any unsealing must be recorded in the transparency report.

### R3 AI-Generated Content
- Must carry the `ai_generated` flag and a `confidence` value (enforced at the schema level)
- At the v0.1 stage, confidence is a **self-reported value from the generator**; interfaces must present it truthfully and must not package it as "platform-certified credibility" ⚠️
- AI content must not be visually conflated with human oral accounts in display
- AI must not generate narrative details about identifiable living individuals unless those details come directly from a cited source

### R4 Right to Challenge
Any user may challenge any data. The challenge is itself data: it must include reasons and evidence (or point out missing evidence), be publicly visible, and be displayed side by side with the challenged content. ⚠️ A bare opposition of opinion without evidence does not constitute a "challenge" in the rule's sense.

### R5 Living Individuals (proactive rule, not post-hoc firefighting)
- **Negative statements about identifiable living individuals**: anonymized by default ("a neighborhood cadre at the time"); keeping a real name requires BOTH: ① a publicly verifiable source, and ② that the matter concerns public affairs rather than purely private life
- The person mentioned (or their immediate family) may apply for review via the dispute mechanism
- **Deceased transition period**: individuals deceased less than 10 years with living immediate family are treated under a relaxed version of the living-individual standard

### R6 Withdrawal and Tombstones
Contributors have the right to withdraw their own narratives and oral accounts. Withdrawal is not silent deletion — it leaves a **tombstone record**:

> "An [oral account/narrative] existed here; it was withdrawn at the contributor's request on [date]."

- The tombstone preserves the fact that the entry existed and the withdrawal time, but not the content
- Other entries citing withdrawn content have their evidence chains automatically marked "depends on withdrawn source", with correspondingly reduced reliability
- Withdrawals involving personal safety may apply for **tombstone-free complete deletion**, approved through the committee's fast track

### R7 Territorial and Administrative Claims (mechanized, no case-by-case adjudication)
Boundary changes are normal data in a historical-geography project, not sensitive exceptions. Rules:

- Every attribution statement must be **anchored to a specific time period + source**: "Between YYYY–YYYY, per [source], this place was under X's administration"
- The platform displays or generates **no time-unbounded** attribution claims
- When multiple sourced attribution claims exist for the same period, they are displayed side by side (Belief 4)
- Only when the mechanism itself is abused (fabricated sources, organized manipulation) does the case escalate to the committee

### R8 Licensing
- Contributors grant the platform and the public a license under **ODbL 1.0** (decided 2026-08-27, consistent with GOVERNANCE.md §2: ODbL chosen for direct OSM-ecosystem compatibility and its attribution + share-alike protection against data enclosure; schema text and this charter are published under CC0 1.0); contributors retain copyright; the platform is a licensee, not the rights holder
- The license for escrowed-anonymous content holds equally; attribution obligations are fulfilled via pseudonym/anonymous identifiers

### R9 AI Training Use
- User-contributed content is **not used by default** for training or fine-tuning any generative model
- If this use is ever enabled: separate opt-in consent is required (no default checkboxes), and contributors may opt out at any time, after which their data is removed from subsequent training sets
- Oral-history content is **permanently excluded** from training use, with no opt-in option

---

## Part 3 · Dispute Mechanism

### 3.1 Layered Handling, Committee as Last Resort

```
Layer 1: The data itself — challenge and counter-evidence displayed side by side (R4); most disputes end here
Layer 2: Community process — evidence-standard review (is the source verifiable, is it fabricated)
Layer 3: Committee — handles only the triggers below, and only rules on procedural matters
```

### 3.2 The Committee (Content & Ethics Committee)

**Triggers (any of)**:
- Review requests concerning living individuals (R5)
- Narratives involving ethnic, cultural, or religious communities that the community process cannot converge on
- Systematic abuse of the territorial/attribution mechanism (R7 escalation)
- Systematic deviation in AI behavior
- Tombstone-free deletion requests (R6 fast track)
- Escrow unsealing requests (R2)

**Boundary of powers (core clause of this charter)**:

> The committee rules on **procedure and compliance**, not historical truth.

| May rule on | Must NOT rule on |
|--------------|------------------|
| Whether privacy rules were violated | Which of two evidence-compliant narratives is "correct" |
| Whether to delete, anonymize, or add warning labels | The characterization of historical events |
| Whether data meets the evidence standard | Any form of "official conclusion" |
| Whether an AI system must be taken offline for remediation | — |
| Whether the confirmation mechanism was manipulated | — |

No committee decision may be phrased as a determination of historical fact.

**Procedural rules**:
- **Composition**: 5–7 members, including at least 1 with history/archives expertise, 1 with legal/privacy expertise, and 1 contributor representative elected by the community
- **Terms**: 2 years, renewable once; membership list public
- **Recusal**: members with a direct interest in the disputed content (author, person mentioned, same institution) must recuse
- **Deadlines**: 30 days for general matters; 72 hours for R6 safety fast-track cases
- **Appeal**: the affected party may appeal once, reviewed by members who did not participate in the original decision
- **Publicity**: decisions and reasons are public (personally identifying parts redacted), archived with case numbers, forming a precedent library

---

## Part 4 · Platform Commitments

### C1 Transparency Report
Published annually, including: committee case statistics, number of government/legal data requests, number of escrow unsealings (including zero reports), and AI system deviation incidents.

### C2 Data Portability
All data (except escrowed identity information and completely deleted content) is continuously exportable in open formats. If the platform ceases operations, it commits to transferring data to a public archive institution with a compatible license (e.g. Internet Archive / OHM).

### C3 Charter Amendments
Amendments to this charter are conducted publicly. Major changes (boundary of powers, licensing, R9) require a 30-day public notice period and community consultation. The charter's version history is preserved forever — we treat our own charter the way we treat historical data.

---

## Appendix A · Charter Clauses vs Technical Implementation

| Clause | Dependent capability | Schema/Platform status | Target version |
|--------|---------------------|------------------------|----------------|
| R1 Sources mandatory | sources made required | optional in v0.1 | schema v0.2 |
| R2 Authors & perspectives | narratives fields (author/perspective) | none | schema v0.2 |
| R3 AI labeling | ai_generated ⇒ mandatory confidence+sources | ✅ implemented, negative tests in CI | done |
| R4 Challenge structure | dispute/annotation data structure | none | platform v1 |
| Belief 4 multi-narrative coexistence | description → narratives[] | single narrative | schema v0.2 |
| Belief 5 community confirmation | community reliability mechanism (distinct from self-reported confidence) | none | platform v1 |
| R6 Tombstones | withdrawal record structure | none | platform v1 |
| R7 Time anchoring | timeline period structure | ✅ natively supported | done |

> Until a capability is implemented, the corresponding clause is enforced through editorial process and manual review; technical unreadiness does not waive the rule.



