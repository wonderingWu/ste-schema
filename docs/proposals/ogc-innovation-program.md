# OGC Innovation Program Proposal: "SpatioTemporal Entity (STE) as a Profile of OGC Features & Geometries JSON"

> Status: **draft proposal** — 2026-09-02. Target submission: OGC Innovation
> Program (IP) call, estimated Q1 2027 window. Companion to
> `docs/profile/json-fg-mapping.md` (the technical mapping) and
> `docs/governance/RFC-process.md` (the project's standards process).
>
> This is a *proposal* for the OGC IP — not the OGC document itself.
> The OGC document, if accepted, would be jointly drafted inside the
> OGC IP framework.

## 0. Executive summary (one paragraph)

We propose an OGC Innovation Program activity to standardize
**STE (SpatioTemporal Entity) v1.0 as an OGC Features & Geometries
JSON (OGC 21-045r1, published 2026-04-30) profile** for historical and
narrative-rich geographic entities. STE addresses a class of features that today's
OGC standards handle poorly: places whose identity, location, and
narrative all change over time (a school that is renamed, relocated,
demolished, and re-remembered). The activity delivers (1) a
normative JSON Schema for the profile, (2) a reference implementation
of the validator, (3) a published test suite, and (4) liaison with
the JSON-FG SWG and the OGC API Features SWG for cross-conformance.
The activity is **profile-first, server-second** — the immediate
deliverable is a conformance class that any JSON-FG consumer can
validate, not a new server protocol.

## 1. Problem statement

### 1.1 What existing OGC standards do well

- **GeoJSON / RFC 7946** carries a single point, line, or polygon for
  a single feature. Tools everywhere understand it.
- **JSON-FG (OGC 21-045r1, published 2026-04-30,
  **VERIFIED 2026-09-02 from the OGC announcement page and
  spec cover via the user's supplied link**)** adds time, CRS,
  featureType, and (as a *building block*) 3D geometry
  types and curved geometries on top of GeoJSON, while
  staying GeoJSON-superset. **Note** (correction caught
  in review 2026-09-02): JSON-FG 1.0 **does not** add
  a "namespaces" mechanism of its own; it inherits
  GeoJSON's "foreign members" pattern (RFC 7946 §6.1).
  The `properties.ste.*` convention is a **STE-level**
  design choice, not a JSON-FG-spec-mandated one.
- **OGC API Features** exposes features as a server-side collection
  with paging, filtering, and a uniform CRUD surface.
- **OGC Moving Features (JSON/SQL)** describes trajectories of
  continuously moving entities.
- **OGC SensorThings API** describes sensor observations with time.

### 1.2 What they don't do

- **No first-class snapshot timeline.** Moving Features is for
  continuously-observed trajectories, not for places that change
  state (rename, demolish, relocate) at discrete moments.
- **No first-class narrative.** All current OGC features assume
  factual, sourced, single-perspective properties. None of them
  model "this is one narrative among many, written from this
  perspective, with this source of knowledge, retractable by the
  author". This matters in cultural heritage, oral history, and any
  historical-geography work.
- **No first-class evidence chain.** A "source" in OGC is usually a
  URL string. None of them model "this is an evidence item — a photo
  with a date, a confidence value, a contributed-by provenance, and
  a retractive tombstone". This is exactly the data the
  cultural-heritage and historical-geography communities need.
- **No actor/provenance model.** Who contributed this? When? With
  what kind of identity? Current standards punt to "out of band".
  Cross-referencing the same contributor across features is
  left to platform conventions.
- **No first-class alignment with the cultural-heritage reference
  ontology.** OGC's own ecosystem has a long-standing relationship
  with **CIDOC-CRM** (ISO 21127:2014 + the 2020 extension), the
  de-facto ontology for cultural-heritage and museum documentation.
  The historical-geography, oral-history, and digital-humanities
  communities (which are STE's primary users) have CIDOC-CRM in
  their tooling, training, and reference data. A JSON-FG profile
  that ignores CIDOC-CRM cannot interoperate with Europeana,
  national-museum catalogues, or DPLA ingestion pipelines without
  an ad-hoc mapping. STE addresses part of this gap (the
  actor/provenance cluster) but **does not** currently offer a
  CIDOC-CRM round-trip; an OGC reviewer from the cultural-heritage
  SWG will flag this as the proposal's largest unresolved scope
  question (see §4 for the proposed relationship and the open
  work item in §10.6).
- **No AI disclosure.** A growing fraction of historical content is
  AI-generated or AI-enhanced. There is no OGC convention for
  declaring that, or for cross-validating against sources.

These gaps are why the historical-geography, oral-history, and
digital-humanities communities (the W3C PROV community group, the
OpenHistoricalMap project, the Europeana Network, the DPLA, the
Internet Archive's collections) have all built **bespoke schemas
that don't interoperate**. STE is the attempt to give them a
common language; OGC is the right home for that language.

### 1.3 Why now

- **JSON-FG 1.0 is published** (**2026-04-30**, **VERIFIED
  2026-09-02 from OGC 21-045r1 spec cover**; OGC
  announcement 2026-05-21; earlier-draft "(2024)" was a
  citation error caught in review). A profile of a
  stable base is much easier to standardize than a
  profile of a moving target.
- **OGC API Features is in active deployment** (2023+). Tools
  understand the "feature" abstraction; the cost of "yet another
  feature format" is low.
- **Cultural heritage data is being digitized at scale**
  (Europeana 2025–2027 roadmap; **NEH (National Endowment
  for the Humanities)** and **IMLS (Institute of Museum
  and Library Services)** digital-humanities programs;
  several national digital memory programs). The
  community needs a *standard*, not another one-off.
  (**Earlier-draft "NSF HSI program" was a citation
  error** — NSF HSI is the Hispanic-Serving Institutions
  program, unrelated to cultural-heritage digitization.)
- **AI disclosure is becoming a regulatory requirement** (EU AI Act
  2024, China生成式 AI 服务管理办法 2023, US executive orders). A
  format that bakes AI disclosure into the data model is a regulatory
  hedge the community needs.

## 2. Proposed approach

The IP activity has three streams, each with concrete deliverables.

### 2.1 Stream 1 — Standardization: "STE Profile of JSON-FG 1.0"

- **Deliverable 1.1**: OGC document `STE 1.0 — Part 1: Core`
  (normative JSON Schema + conformance class definition).
- **Deliverable 1.2**: OGC document `STE 1.0 — Part 2: Profiles`
  (the satellite profiles: `ste-attribution`, `ste-challenge`,
  `ste-memo`, etc. — each a small extension, not a full document).
- **Deliverable 1.3**: an `ogc/json-fg-ste` GitHub repository
  containing the published schemas, the test suite, the validator,
  and the liaison with the JSON-FG SWG.
- **Conformance class URL pattern** (provisional; subject to
  OGC Naming Service Coordinator confirmation at IP submission):
  `http://www.opengis.net/spec/ste/1.0/conf/<aspect>` (mirroring
  the JSON-FG 1.0 pattern **VERIFIED 2026-09-02** as
  `http://www.opengis.net/spec/json-fg-1/1.0/conf/<name>`). The
  exact conformance class name (`ste` vs `ste-v1` vs longer)
  requires OGC naming-board confirmation; the `ogc.org/standards/`
  host prefix in the earlier draft was incorrect — OGC issues
  conformance URIs from `opengis.net/spec/`, not `ogc.org/standards/`.

### 2.2 Stream 2 — Reference implementation

- **Deliverable 2.1**: extend the existing
  `wonderingWu/ste-schema` reference validator to operate in
  JSON-FG mode (no dependency, browser+Node, the existing
  zero-dependency UMD shape is preserved).
- **Deliverable 2.2**: an OGC-conformance test suite, executable
  via `ogccts` (the OGC Compliance Test Suite runner) or
  equivalent, with **four named test classes** that any
  conforming STE consumer must pass:
  1. **Parse class** — every JSON-FG 1.0 valid instance
     carrying the `ste` foreign-member block round-trips
     through the validator without loss of any field
     declared in the `properties.ste.*` profile.
  2. **Reject class** — every STE 1.0 negative fixture
     (currently 25 in the project; planned expansion to 39
     for v0.3, see RFC 0001) is rejected by the validator
     with a named error code mapped to a specific
     `app-rule-N` in the project's internal rule namespace.
  3. **Round-trip class** — for a fixed set of 12
     hand-curated historical features (the project's demo
     subset), serialize → parse → re-serialize is
     byte-identical **or** carries an explicit loss
     annotation in a `loss_profile` field (no silent
     loss). This is the "no-loss invariant" stated in
     compressed form.
  4. **Interop class** — at least one external tool
     (target: MapLibre, stac, or the OpenHistoricalMap
     importer) consumes an STE feature without manual
     pre-processing. The interop test is graded
     "imports" / "imports with loss" / "fails to
     import".
- **Deliverable 2.3**: at least one server-side demo exposing a
  curated dataset (the project's existing 89-school demo is a
  candidate) as an OGC API Features collection of STE features,
  to prove end-to-end viability.

### 2.3 Stream 3 — Community liaison

- **Deliverable 3.1**: liaison with the JSON-FG SWG to ratify the
  conformance class.
- **Deliverable 3.2**: liaison with the OGC API Features SWG to
  add STE features as a recognized `type` in feature collections.
- **Deliverable 3.3**: liaison with the **W3C PROV-O
  community of implementers** (the W3C PROV Working Group
  itself concluded in 2013; PROV-O is a W3C Recommendation
  and is now maintained as a community resource) to
  align the STE actor/provenance model with PROV-O (see
  `docs/profile/json-fg-mapping.md` §7).
- **Deliverable 3.4**: briefing notes for OpenHistoricalMap
  (the primary user community), Europeana, and the Internet
  Archive.
- **Deliverable 3.5** (added by institutional-reviewer pass
  2026-09-03): liaison with the **CIDOC-CRM Special Interest
  Group (ICOM CIDOC)** and an explicit item on the
  cultural-heritage SWG agenda (if the SWG exists at
  submission time) to scope the STE → CIDOC-CRM mapping
  (see §4 and §10.6). Without this liaison, the cultural-
  heritage community — STE's primary user base — has no
  formal path into the standardization process.
- **Deliverable 3.6** (added by institutional-reviewer pass
  2026-09-03): a **CIP (Call for Industry Priorities)
  readiness check** in 2027 Q1. If the IP formation
  timeline slips or if OGC's IP cycle does not accept new
  profiles in the target window, the project should be
  able to pivot to a CIP-track submission without
  rewriting the proposal. The CIP path is **lighter**
  than the IP path for "profile + strong user community"
  projects and is the right Plan B.

### 2.4 OGC document outline (informative — for reviewer scoping)

The eventual OGC document `STE 1.0 — Part 1: Core` will be
jointly drafted inside the OGC IP framework. To help OGC
reviewers scope the work, the expected normative section
structure is:

1. **Scope** (what the document covers; the JSON-FG profile
   shape).
2. **Conformance** (conformance classes, the four test
   classes from Deliverable 2.2 mapped to OGC ATS structure:
   Parse, Reject, Round-trip, Interop).
3. **Normative references** (RFC 7946, OGC 21-045r1, ISO
   8601-1:2019 for `about_period`, ISO 21127:2014 for
   CIDOC-CRM if the bridge is in scope).
4. **Terms and definitions** (drawn from §1 of the project's
   `PATENT-PLEDGE.md` and the JSON-FG core terms; no new
   invented terms).
5. **STE feature type** (the `properties.ste.*` foreign-
   member block; the conformance class URI;
   required-vs-optional field table).
6. **Conformance class URIs** (the `ste-core`, `ste-timeline`,
   `ste-attribution`, `ste-challenge` class definitions; each
   with a normative test reference).
7. **Media type registration** (`application/ste+json` or
   similar; to be confirmed with the JSON-FG SWG).
8. **Examples** (drawn from the project's 95-school demo
   subset, after private review by the demo data
   contributors).
9. **Security considerations** (doxxing, retractive tombstones,
   AI disclosure — informed by ETHICS.md but not OGC-normative).
10. **Annex A (informative): CIDOC-CRM bridge mapping** (the
    cultural-heritage interop mapping, scope per §10.6).

The outline is **informative** at the IP-proposal stage and
**normative** once the OGC document enters working-draft. An
OGC reviewer wanting to assess scope is asked to comment on
this outline in the IP formation phase (see §10).

## 3. What the IP activity is *not*

To be explicit, so reviewers can scope accurately:

- **Not** a new server protocol. OGC API Features is the server
  protocol. STE is a feature type.
- **Not** a replacement for GeoJSON, JSON-FG, OGC Moving Features,
  or SensorThings. It is a profile of JSON-FG and a complement to
  Moving Features.
- **Not** a content policy. ETHICS.md is the project's content
  policy and is referenced normatively but is not part of the
  OGC document. **How ethics becomes technical in the OGC
  document**: ETHICS Charter clauses R2 (author identity /
  escrow anonymous), R3 (AI disclosure), and R6 (tombstone)
  manifest in the JSON-FG profile as **data-shape** fields
  (`actor_id` namespace; `ai_generated` + `confidence` +
  `ai_model`; `retracted` + `retracted_at` with the
  schema-enforced if/then/else). The OGC document specifies
  the data shape; the project's content policy (R1, R4, R5,
  R7, R8, R9) lives in ETHICS.md and is referenced from
  the conformance class's *informative* annex, not as
  OGC-normative requirements. **An OGC reviewer asking
  "where is R2 in the OGC document"**: R2's data shape is in
  the profile spec; R2's *policy* (the why and the
  who-decides) is in ETHICS.md, not in the OGC document.
- **Not** a privacy framework. The escrow-anonymous mechanism is
  a STE-specific design; OGC documents the data shape, the project
  documents the policy.
- **Not** a tool vendor's product roadmap. The deliverable is a
  standard, not a product.

## 4. Relationship to existing OGC standards

| OGC standard | Relationship |
|---|---|
| **RFC 7946 GeoJSON** | STE 1.0 documents are valid GeoJSON. A `ste-geojson-subset` profile (out of scope for this IP, tracked for v1.x) is a lossy view that drops the timeline. |
| **OGC 21-045r1 JSON-FG** | STE 1.0 is a profile of JSON-FG 1.0. The conformance class is defined in this IP. |
| **OGC 17-069r3 OGC API Features Part 1** | A server exposing STE features is an OGC API Features server; the STE feature type is registered with the API Features SWG. |
| **OGC 18-058 OGC API Features Part 2** | CRS negotiation works as documented; STE inherits. |
| **OGC 19-045r3 OGC Moving Features (JSON)** | STE's `timeline` is closer to Moving Features' `trajectory` than to JSON-FG's snapshot, but STE's use case is *discrete state changes* (rename / demolish / relocate) rather than continuous motion. A v1.x `ste-moving` profile can lift STE onto Moving Features' trajectory primitives; this is tracked separately. |
| **OGC 15-078r6 SensorThings API** | Different abstraction (sensors + observations). Some overlap in the "evidence" concept; not a target for a direct profile. |
| **OGC API — Environmental Data Retrieval (EDR; OGC 19-086)** | Different abstraction (temporal environmental data); not a target for a direct profile. **Note**: the earlier-draft "OGC 19-086 OGC DGGS" was a citation error — **19-086 is EDR, not DGGS**. The DGGS abstract spec is OGC 15-104r5 (Topic 21) and is itself out of scope. |
| **CIDOC-CRM (ISO 21127:2014 + 2020 extension; maintained by ICOM CIDOC)** | **Not an OGC standard, but a hard requirement to address.** CIDOC-CRM is the de-facto reference ontology for cultural-heritage and museum documentation; Europeana, the DPLA, and most national-museum pipelines are CIDOC-CRM-aware. STE 1.0 is a *feature-shape* profile of JSON-FG, not an ontology. The two can coexist, but a JSON-FG instance carrying STE actor/provenance fields is **not** automatically CIDOC-CRM-compatible — a mapping (and likely a small ontology-anchor profile, e.g. `ste-cidoc-bridge`) is required for true cultural-heritage pipeline interop. This is **the largest unresolved scope item** in the proposal and is tracked in §10.6 as a "must be decided before the IP formation phase closes" gate. The SWG liaison plan in §2.3 should include the **CIDOC-CRM SIG / ICOM** as a stakeholder, not just the JSON-FG and OGC API Features SWGs. |

## 5. Deliverables, timeline, and budget (estimate)

| Quarter | Activity | Deliverable |
|---|---|---|
| 2027 Q1 | IP kickoff, JSON-FG SWG liaison opened | Charter published; working group formed. |
| 2027 Q2 | Reference validator JSON-FG mode, conformance test suite | Deliverables 2.1, 2.2 (alpha). |
| 2027 Q3 | OGC API Features demo, OGC API Features SWG liaison | Deliverable 2.3; Document 1.1 (draft). |
| 2027 Q4 | JSON-FG SWG review; W3C PROV liaison; community review (OHM, Europeana) | Document 1.1 (candidate). |
| 2028 Q1 | Public comment, IPR review, OGC TC vote | Document 1.1 (approved). |
| 2028 Q2 | Profiles documents (1.2); v1.0 stable | Public release. |

**Estimated budget** (50% of which is OGC IP fees + travel; 50%
engineering):

- IP fees: as per OGC's published Innovation Program rate card
  (varies by participant; **2024 baseline was reportedly a
  ~$15K / year *minimum* for a Strategic Member** with
  reduced rates for startups and academic participants —
  this is a 2024 number; **per §10.2 item 7, the IP
  submission packet must include an actual OGC Member
  Services quote, not the "re-verify" placeholder that
  this draft currently carries**). The project should
  plan for the Strategic Member tier unless an
  academic-participant waiver is confirmed in writing
  by OGC.
- Engineering: ~1.5 FTE for two quarters (the project already
  has the validator and demo; the lift is integration, not
  greenfield). Source: the maintainer's own time plus
  one contracted engineer for the conformance-test
  suite (Deliverable 2.2) and the OGC API Features demo
  (Deliverable 2.3).
- Community / travel: 1 OGC TC meeting + 1 hackathon
  attendance. Budget assumes hybrid attendance; the
  OGC TC meeting may be in-person at OGC's
  discretion.

This is small by OGC standards. The deliverable is
*proportionally* small — a profile, not a base standard.

## 6. Licensing / IP

- **Schema text** (current and future versions) is **CC0 1.0**
  (per `LICENSE-CC0-1.0`).
- **Code** (validator, scripts, build) is **MIT**
  (per `LICENSE`).
- **Curated data** (the demo's 89 schools) is **ODbL 1.0**
  (per `LICENSE-ODbL-1.0`).
- **Patents**: covered by `PATENT-PLEDGE.md` — a defensive patent
  pledge with a defensive-termination clause. **Correction to
  the earlier-draft "W3C-style standard" framing** (caught in
  review 2026-09-02): W3C Patent Policy uses *Essential Claims*
  with an *exclusion opportunity* and PAG exception; it does
  **not** have a "defensive termination" clause. The STE pledge
  is inspired by Dfinity's 2014 Open Patent Non-Assertion Pledge
  and OWF Agreement 1.0, with the defensive-termination addition
  for retaliation scenarios — see `PATENT-PLEDGE.md` §8 for the
  reference template lineage. **The pledge is necessary, not
  optional**: OGC's own 21-045r1 License Agreement states
  "THIS LICENSE IS A COPYRIGHT LICENSE ONLY, AND DOES NOT CONVEY
  ANY RIGHTS UNDER ANY PATENTS" (VERIFIED 2026-09-02 from
  the spec cover). The pledge is in ratification (target
  2026-10-01); the OGC submission
  cites it.
- **No third-party patent encumbrance** is known as of the
  proposal date. Any contributor who cannot make the patent
  pledge is asked to declare so under the project's RFC process
  (per `PATENT-PLEDGE.md` §6.1 — which is itself an *open
  question* pending RFC resolution; **until that RFC closes,
  this provision is aspirational, not yet a binding contributor
  commitment**); their contributions are excluded if so.

## 7. Sponsors and participants (target list, status as of proposal date)

This is the *target* list. The status tags below are
intentional and reviewed each IP formation phase
milestone (per §10.1 item 3, at least one **committed**
co-sponsor is a hard prerequisite for filing the IP
submission packet).

- **Originator**: STE project (`@wonderingWu`) — committed
  (as the proposing organization; the maintainer is the
  originating member).
- **Target sponsor members** (OGC members we'd ask to
  co-sponsor):
  - **OpenHistoricalMap** — primary user community; has
    been an early informal collaborator (see
    `docs/compatibility/`). **Status**: contacted,
    MoU conversation pending. **Note**: OpenHistoricalMap
    is **not currently an OGC member** as of the
    proposal date; their co-sponsorship would
    require them to either join OGC at Strategic
    Member level or to co-sponsor through a sibling
    organization that is already an OGC member
    (e.g. their parent org or a partner
    institution). This is **not** a small detail
    and is the reason §10.1 item 3 cannot be
    checked off without a Plan B sponsor.
  - **Heidelberg University Library** /
    **Europeana** — cultural heritage data
    community. **Status**: not yet contacted; the
    CIDOC-CRM scope decision (§10.1 item 4) is a
    prerequisite to a meaningful approach, since
    their primary data model is CIDOC-CRM.
  - **OSGeo** — open-source geospatial foundation;
    has prior art on community standards.
    **Status**: not yet contacted; their OGC
    participation is via their GeoForAll / OSGeo
    foundation structure, which the project will
    need to navigate carefully.
  - **MapLibre** / **stac** — toolchain perspective;
    OGC API Features consumers. **Status**: not
    yet contacted; neither is currently an OGC
    member, so they would co-sponsor as
    contributing participants rather than as the
    primary OGC-voting sponsor.
  - **A national mapping agency** (TBD; **DE, GB, or
    US first**; CN can be approached after the
    first draft is published, and only with a
    liaison who understands the cross-border
    political sensitivities of historical
    geography data; approaching a CN national
    agency before a European / UK / US co-sponsor
    exists is a category error that the project
    should not make). **Status**: not yet
    contacted; the project's preference order is
    DE → GB → US, in that order, on the
    historical-geography data sensitivity
    reasons noted in the inline comment above.
- **Target academic observers**: Max Planck Institute
  for the History of Science (DiRT project), Leiden
  University (Cadastre history), Sciences Po
  médialab. **Status**: all three are OGC
  academic-tier members; observer slots do not
  require commitment, only an invitation via
  OGC Member Services.
- **Target funder**: NSF / DFG / NWO (digital
  humanities programs) for the engineering time;
  OGC IP fee waiver for academic participants
  (OGC has such a track record). **Status**:
  not yet approached; the project's preference
  is DFG first (the Heidelberg connection in
  the sponsor list is a natural opening),
  followed by NSF (relevant to US-based
  historians) and NWO (relevant to
  Leiden-based work).

## 8. Exit criteria (the IP succeeds when…)

1. The OGC document `STE 1.0 — Part 1: Core` is approved by the
   OGC TC.
2. At least one OGC-conformant implementation outside the
   originator exists.
3. At least one OGC API Features server exposes a real
   (non-toy) STE dataset.
4. The JSON-FG SWG has formally recognized the conformance
   class.
5. The validator's test suite is published in the OGC
   conformance database.

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **OGC processes slow this down past the project's 1.0 timeline** | High | Medium | Ship STE 1.0 as a de-facto profile *first*, run the OGC track in parallel; document the 1.0 state at the OGC document. |
| **JSON-FG SWG disagrees with the profile's nested `properties.ste.*` structure** | Medium | Low | JSON-FG 1.0 has no §-clause on namespaces; the project uses GeoJSON's "foreign members" pattern (RFC 7946 §6.1) for the `properties.ste.*` convention. Pre-meet with the SWG chairs before submission to confirm the convention is acceptable. |
| **No sponsor member with OGC voting rights can be found** | Medium | High | The originator joins OGC at the Strategic Member level (or Academic if eligible); the budget line above covers this. |
| **Patent landscape surprises (someone holds a related patent)** | Low | High | The defensive patent pledge + public review window during OGC submission surfaces these early. |
| **Moving Features SWG sees overlap and objects** | Low | Low | Pre-meet; position STE as the "discrete-change" companion to Moving Features' "continuous-trajectory" model. |
| **OHM community doesn't adopt** | Medium | Medium | OHM is a target user, not a prerequisite; v1.0 ships even if OHM adoption is slow. |

## 10. Next steps (immediate, pre-submission)

The original draft of this section listed six flat
"next steps" without priority. A reviewer preparing
to scope the IP will not see a clear prerequisite
structure. The items are reorganized below by class
(institutional-reviewer pass 2026-09-03):

**10.1 Hard prerequisites — must be done before the IP
submission packet can be filed.** Missing any one of
these is grounds for the IP formation phase to reject
or send back the packet for revision.

0. **Confirm `PATENT-PLEDGE.md` ratification** (target
   2026-10-01). The OGC submission cites the pledge; a
   pledge still in proposal state is not legally
   credible for OGC IP reviewer purposes, and the
   IP submission postpones with it.
1. **Approach the JSON-FG SWG chairs** for a
   pre-submission sanity check on the `conformsTo` URL
   pattern. Their **written acknowledgement** is
   needed (an email is sufficient for IP formation;
   formal SWG recognition comes at the WG phase).
   Until this is on file, the conformance URI is
   a placeholder, and a placeholder is grounds for
   deferral.
2. **Approach the OGC Naming Service Coordinator** for
   the conformance-class URI pattern. The
   `http://www.opengis.net/spec/ste/1.0/conf/<aspect>`
   placeholders must be either confirmed or replaced
   with a placeholder that OGC owns.
3. **Obtain at least one committed co-sponsor** (an
   OGC member organization willing to be listed on
   the IP submission packet). OpenHistoricalMap is
   the most likely first choice; see §7. Until at
   least one written commitment is on file, the IP
   submission cannot proceed — a "target list" is
   not sufficient for the IP formation phase.
4. **CIDOC-CRM scope decision** (added 2026-09-03).
   The proposal must declare one of three positions
   before the IP formation phase closes:
   (a) CIDOC-CRM bridge is **in scope** for STE 1.0,
   with a small `ste-cidoc-bridge` profile and an
   ICOM-CIDOC liaison (Deliverable 3.5);
   (b) CIDOC-CRM bridge is **explicitly out of
   scope** for STE 1.0, with a forward-looking note
   that a v1.x profile would address it;
   (c) CIDOC-CRM bridge is **deferred** to the OGC
   document's informative annex (Annex A, see
   §2.4) with no normative commitment.

   **The institutional-reviewer recommendation** is
   (b): out of scope for STE 1.0, with Annex A
   carrying the preliminary mapping. This avoids
   overpromising and respects the cultural-heritage
   community's right to shape the bridge design
   through the OGC document process rather than
   through the IP formation phase. Whichever
   position is chosen, it must be **declared in the
   IP submission packet**, not left implicit.

**10.2 Strongly recommended (file even if missing, but
expect review questions).**

5. **OpenHistoricalMap MoU**: a formal handshake, even
   short of a fully-signed sponsor agreement,
   signals seriousness and pre-empts the "no committed
   community" objection at review.
6. **Europeana briefing**: Europeana's pipeline is
   CIDOC-CRM-aware; a pre-briefing avoids the surprise
   of a "we have our own schema" pushback at IP
   review.
7. **OGC Member Services fee quote**: an actual fee
   range, not the "re-verify with OGC Member Services"
   placeholder currently in §5. Even a non-binding
   verbal range from Member Services is acceptable
   for the IP formation phase; the formal commitment
   is a later step.

**10.3 Filing actions (in order).**

8. **Open a tracking issue** in the project:
   "OGC Innovation Program submission". Reference
   this proposal.
9. **Publish this proposal** on the project blog and on
   `ogc.org`'s community-discussion area (the OGC
   has such a space; participation there signals
   seriousness).
10. **File the IP submission packet** via the OGC
    portal, referencing the present document and
    `docs/profile/json-fg-mapping.md` as the
    technical core.

## 11. References

- OGC 21-045r1 *Features & Geometries JSON — Part 1: Core*
- OGC 17-069r3 *OGC API Features — Part 1: Core*
- OGC 19-045r3 *OGC Moving Features Encoding Extension — JSON*
- RFC 7946 *The GeoJSON Format*
- ISO 21127:2014 + 2020 extension *CIDOC Conceptual Reference
  Model* (ICOM CIDOC SIG; **not** an OGC standard but the
  de-facto reference ontology for cultural-heritage data;
  relevant to §4 and §10.1 item 4)
- W3C PROV-O (provenance ontology, for the sibling JSON-LD work)
- OGC Naming Service — `opengis.net/spec/` URL conventions
  (https://www.ogc.org/standards/ogc-naming-authority/; relevant
  to §2.1 conformance-class URIs and §10.1 item 2)
- OGC Call for Industry Priorities (CIP) program page
  (https://www.ogc.org/engagement/call-for-industry-priorities/;
  relevant to §2.3 Deliverable 3.6 and §10.2)
- The project's `docs/profile/json-fg-mapping.md` (the technical
  mapping; this proposal is the institutional frame for it)
- The project's `PATENT-PLEDGE.md` and `LICENSE-CC0-1.0`
- OGC Innovation Program public page
  (https://www.ogc.org/engagement/innovation-program/)

---

**Authors**: STE project (@wonderingWu)
**Status**: draft proposal, pre-submission
**License of this document itself**: CC0 1.0
