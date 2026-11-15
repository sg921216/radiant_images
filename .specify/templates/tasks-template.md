---
description: "Task list template for React and Cloudflare Workers features"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md, spec.md; research.md, data-model.md, and contracts/ when applicable.
**Constitution**: `.specify/memory/constitution.md`, version [current version].
**Tests**: Mandatory TDD for executable behavior, including shared foundation and bug fixes.
Write focused tests, run them to observe a meaningful failure, implement, then refactor green.
Documentation-only and declarative setup changes use appropriate validation.
**Organization**: Independently testable story increments in priority order.

## Format: `[ID] [P?] [Story] Description`

- IDs MUST be unique and sequential in execution order.
- `[P]` means different files with no unmet dependencies. Tests and their implementation
  MUST NOT run concurrently; a meaningful failing test is an implementation prerequisite.
- `[US1]` etc. map story tasks to acceptance criteria; omit story labels for shared tasks.
- Include exact file paths, requirement references, and expected evidence.

## Path Conventions

- React: `apps/web/app/`, `apps/web/tests/`.
- Workers: `apps/api/src/`, `apps/api/tests/`; D1 migrations and R2 test fixtures.
- Shared schemas: `packages/shared/src/` and corresponding tests.
- Playwright: `e2e/`, `playwright.config.ts`; CI: `.github/workflows/`.
- Use the actual plan layout. Paths below are examples, not additional required features.

<!--
Replace every sample with real tasks derived from stories, contracts, and constitution gates.
Retain mandatory test-first sequencing and quality work. Do not keep sample placeholders.
No automatic implementation/release pass is allowed when evidence is missing.
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish reproducible tooling and verify provider/hosting feasibility.

- [ ] T001 Verify hosting/cost/runtime constraints and record evidence in specs/[feature]/research.md
- [ ] T002 Pin compatible React/Workers tooling and strict TypeScript in package.json, pnpm-lock.yaml, and tsconfig.base.json
- [ ] T003 [P] Configure Vitest/RTL, Worker integration, and OpenAPI validation in apps/web/vitest.config.ts and apps/api/vitest.config.ts
- [ ] T004 [P] Configure isolated Playwright fixtures, provider doubles, controlled time, semantic locators, and production test-adapter exclusion in playwright.config.ts and e2e/fixtures.ts
- [ ] T005 Configure PR Chromium smoke, nightly/release Chromium/Firefox/WebKit, focused-test rejection, fail-on-flaky behavior, at most one diagnostic retry, and sanitized failure artifacts in .github/workflows/ci.yml

**Checkpoint**: Toolchain runs; fixtures are repeatable and cannot target production data.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build only shared behavior needed by the specified stories.

- [ ] T006 Write and run failing migration, owner access, provider failure, and public/private boundary tests in apps/api/tests/foundation.test.ts
- [ ] T007 [P] Write and run failing shared-validation and shell interaction tests in packages/shared/tests/validation.test.ts and apps/web/tests/shell.test.tsx
- [ ] T008 Implement required migrations, server authorization, adapters, and sanitized logging in apps/api/src/ to pass T006
- [ ] T009 Implement schemas and React shell in packages/shared/src/ and apps/web/app/ to pass T007
- [ ] T010 Refactor with foundation suites green; record red/green commands and outcomes in specs/[feature]/acceptance.md

**Checkpoint**: Server authorization and data boundaries verified before dependent stories.

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Observable business outcome]
**Independent Test**: [Isolated journey, visible outcome, and persisted/public result]

### Tests for User Story 1 (MANDATORY)

- [ ] T011 [P] [US1] Write rule/component tests for [acceptance criteria] in apps/web/tests/[feature].test.tsx
- [ ] T012 [P] [US1] Write API integration/contract success/error/auth tests in apps/api/tests/[feature].test.ts
- [ ] T013 [P] [US1] Write full-stack journey and recovery tests in e2e/[feature].spec.ts
- [ ] T014 [US1] Run T011-T013 and record meaningful behavioral failures in specs/[feature]/acceptance.md before implementation

### Implementation for User Story 1

- [ ] T015 [US1] Implement authoritative shared rules and Worker behavior in packages/shared/src/schemas/[feature].ts and apps/api/src/routes/[feature].ts
- [ ] T016 [US1] Implement accessible React behavior and recovery states in apps/web/app/routes/[feature].tsx
- [ ] T017 [US1] Refactor green and record contract, journey, privacy, and accessibility evidence in specs/[feature]/acceptance.md

**Checkpoint**: Story is independently useful; success and relevant failure paths pass.

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Observable business outcome]
**Independent Test**: [How to verify without relying on previous test runs]

### Tests for User Story 2 (MANDATORY)

- [ ] T018 [P] [US2] Write component/rule tests in apps/web/tests/[feature2].test.tsx
- [ ] T019 [P] [US2] Write contract/integration tests in apps/api/tests/[feature2].test.ts
- [ ] T020 [P] [US2] Write critical E2E/recovery tests in e2e/[feature2].spec.ts
- [ ] T021 [US2] Run tests to demonstrate behavioral failures in specs/[feature]/acceptance.md

### Implementation for User Story 2

- [ ] T022 [US2] Implement Worker behavior in apps/api/src/routes/[feature2].ts
- [ ] T023 [US2] Implement React behavior in apps/web/app/routes/[feature2].tsx
- [ ] T024 [US2] Refactor and verify the story, recording results in specs/[feature]/acceptance.md

**Checkpoint**: Both stories pass independently with isolated fixtures.

[Add further story phases using the same test-fail-implement-refactor pattern.]

## Phase N: Polish & Cross-Cutting Concerns

Include these obligations in earlier story phases when they affect that increment.
Every executable change in these tasks still follows TDD.

- [ ] TXXX Verify upload bounds/content, EXIF/GPS removal, private originals, permission, and deletion in apps/api/tests/media.test.ts and e2e/gallery.spec.ts
- [ ] TXXX Verify WCAG 2.2 AA with automated checks plus keyboard/screen-reader review in e2e/accessibility.spec.ts and specs/[feature]/acceptance.md
- [ ] TXXX Verify mobile/image/script budgets, layout stability, crawlable metadata, sitemap, and private-route noindex in e2e/performance.spec.ts and e2e/seo.spec.ts
- [ ] TXXX Verify production build, secret/dependency checks, sanitized monitoring, migration recovery, backup/restore, and rollback in .github/workflows/ci.yml and specs/[feature]/quickstart.md
- [ ] TXXX Verify full browser matrix, manual print/PDF layout, separately identified live-provider checks, and owner content/photo readiness in specs/[feature]/acceptance.md

## Dependencies & Execution Order

### Phase Dependencies

- Setup precedes foundation; foundation precedes dependent stories.
- Each red test run precedes its production implementation, including schemas and helpers.
- Test authoring may be parallel across independent files. Do not use `[P]` to bypass red.
- Shared route/config/evidence files require serialized edits.
- Later stories MUST NOT block an earlier useful increment unless the spec requires them.
- An increment's applicable release gates MUST pass before its release.

### Parallel Example: User Story 1

T011, T012, and T013 can be authored independently. T014 runs the tests with a minimal
runnable harness and verifies meaningful failures. Only then may T015/T016 implement the
covered behavior. Add focused red tests for any additional behavior discovered.

## Implementation Strategy

1. Establish a runnable local stack and deterministic fixtures.
2. Deliver the highest-priority story through red-green-refactor.
3. Validate it independently, including relevant failures, privacy, and accessibility.
4. Add stories incrementally; run required regression and E2E gates.
5. Release only with documented evidence; mocked email acceptance does not prove delivery.

## Notes

- Each completed behavior MUST have red/green evidence and acceptance traceability.
- Use behavior assertions; code coverage and snapshots alone are insufficient.
- Do not add real customer data, production auth state, or live secrets to fixtures.
- Track a flake with an owner, issue, expiry, and alternative evidence; do not silently skip it.
- Record OPEN/BLOCKED checks honestly and keep task boxes unchecked until verified.
