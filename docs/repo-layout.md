# Repository Layout & Split Policy (2026-08-27)

> Owner-delegated evaluation of the "split the repo" question (N4).
> **Decision: do NOT split yet. Keep one repo with explicit zone discipline;
> re-evaluate at the triggers below.**

## Why not split now

1. The project is 3 weeks old, single maintainer, zero external consumers.
   Splitting now multiplies CI/sync overhead (schemas, validators, demo,
   charter would each need cross-repo version pinning) for zero current
   audience.
2. The demo is the schema's only living proof; keeping them one `git log`
   apart keeps every schema claim reproducible (`npm test` + demo fixtures
   in the same CI run).
3. Cross-references (schema ↔ ethics charter ↔ validators ↔ compatibility
   reports) are dense; separate repos turn every reference into a
   version-negotiation problem.

## Zone discipline (what this repo is)

| Zone | Paths | Identity |
|---|---|---|
| Protocol core | `v0.1/`, `v0.2/`, `docs/`, `validator/`, `examples/`, `test/` | The citable standard. Stable URLs, semver discipline |
| Evidence | `demo/` | Living proof + GitHub Pages host. May change fast |
| Governance | `ETHICS*.md`, this file | Charter zone; edits follow charter amendment rules (C3) |
| Tooling | `scripts/`, `.github/` | CI and import/validation utilities |

Rules: protocol-core changes require CI green + negative fixtures for new
rules; demo changes must not touch core; charter changes follow C3.

## Split triggers (re-open this decision when ANY fires)

1. A second, non-project data producer ships STE data and pins a schema
   version (they need a stable, demo-free core to reference).
2. v1 schema work starts (event model) — split `ste-schema` (core) from
   `ste-demo` at that point, keeping this repo as the core.
3. External contributors appear for either the demo or the schema but not
   both (permission/review boundaries become real).

## If/when splitting

- `ste-schema` keeps: v0.x/, docs/, validator/, examples/, test/, ETHICS,
  scripts/, CI. History preserved via `git filter-repo` subtree split.
- `ste-demo` gets: demo/, plus a pinned submodule or npm dep on the core.
- Register a persistent namespace (w3id.org/ste) BEFORE the split so
  canonical URLs survive the move (see v0.3 lifecycle proposal §4).
