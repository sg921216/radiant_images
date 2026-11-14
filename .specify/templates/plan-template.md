# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Strict TypeScript for React and Cloudflare Workers; [pin supported toolchain versions]

**Primary Dependencies**: React, Hono, shared validation schemas; [feature dependencies and compatibility evidence]

**Storage**: Cloudflare D1 and R2; [data lifecycle, migrations, private/public media boundaries or justified N/A]

**Testing**: Mandatory TDD; Vitest, React Testing Library, Worker integration against local D1/R2, OpenAPI contract tests, and Playwright E2E

**Target Platform**: Responsive web; GitHub Pages frontend and Cloudflare Workers API; [tested browser versions and hosting feasibility]

**Project Type**: React web application and modular Worker API

**Performance Goals**: Public usability <= 3 s; publication <= 60 s; LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1; [mobile lab profile, image/script budgets, field measurement plan]

**Constraints**: WCAG 2.2 AA; HTTPS; no persisted inquiry contents; private originals/backups; [verified provider/cost limits]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution**: `.specify/memory/constitution.md`, version [record current version].
Record PASS (design evidence), OPEN (tracked work), BLOCKED (unresolved violation), or
N/A (reason) for each gate. A design pass does not imply tests or deployment have passed.

| Principle | Required design evidence | Status / artifact / task |
|-----------|--------------------------|--------------------------|
| I. Business value | Story/acceptance traceability; truthful inquiry status; pricing consistency | [evidence] |
| II. React + Workers | Strict TypeScript; boundaries; OpenAPI; D1/R2; hosting/cost feasibility | [evidence] |
| III. TDD | Red-green-refactor for foundation and stories; unit/component/integration/contract layers | [evidence] |
| IV. E2E | Real local stack; isolated fixtures; provider doubles; critical/failure journeys; browser matrix; flake policy | [evidence] |
| V. Privacy/security | Owner enforcement; safe uploads; EXIF removal; permission; retention/deletion; secret/log protection | [evidence] |
| VI. UX/performance | WCAG 2.2 AA; manual checks; image budgets; crawlable public routes; private noindex | [evidence] |
| VII. Operations | Reproducible builds; CI; sanitized monitoring; migration/rollback/restore evidence | [evidence] |

**E2E execution**: PR Chromium smoke at mobile/desktop sizes; complete Chromium/Firefox/WebKit
nightly and before release; 320/768/1280 px layout coverage. Specify fixture reset, controlled
time, semantic locators, trace retention, one diagnostic retry maximum, fail-on-flaky policy,
and production exclusion of test adapters. Live-provider evidence is separate from CI.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Adapt this React/Workers layout to the feature. Include only
  required modules and use real paths; preserve explicit application/test boundaries.
-->

```text
apps/
├── web/
│   ├── app/             # React routes, components, state, transport adapters
│   └── tests/           # Vitest + React Testing Library
└── api/
    ├── src/            # Hono routes, domain/services, D1/R2/provider adapters
    └── tests/          # Unit, local Worker integration, OpenAPI contracts
packages/shared/
├── src/                # Shared schemas and types; server validation is authoritative
└── tests/
e2e/                    # Playwright journeys and isolated fixtures
playwright.config.ts
.github/workflows/      # CI and gated delivery
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> Record complexity decisions and any requested exception. A rationale does not waive a gate;
> exceptions require scope, owner/maintainer acceptance, compensating evidence, and expiry.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
