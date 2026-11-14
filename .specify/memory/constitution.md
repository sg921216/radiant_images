<!--
Sync Impact Report
Version change: unratified template -> 1.0.0 (initial adoption, 2026-11-13)
Modified principles: five unnamed template slots replaced by Principles I-VII below.
Added principles:
- I. Deliver Verifiable Business Value
- II. React and Cloudflare Workers with Explicit Boundaries
- III. Test-Driven Development
- IV. Reliable End-to-End Verification
- V. Protect Clients and Photographs
- VI. Accessible, Fast, Discoverable Experiences
- VII. Operable and Reproducible Delivery
Added sections: Engineering Standards; Development Workflow and Quality Gates;
  concrete amendment, exception, and versioning rules under Governance.
Removed sections: none; unnamed template sections were instantiated.
Templates and dependent artifacts:
- ✅ updated: .specify/templates/plan-template.md
- ✅ updated: .specify/templates/spec-template.md
- ✅ updated: .specify/templates/tasks-template.md
- ✅ updated: specs/001-radiant-images-website/spec.md
- ✅ updated: specs/001-radiant-images-website/plan.md
- ✅ updated: specs/001-radiant-images-website/tasks.md
- ✅ updated: specs/001-radiant-images-website/quickstart.md
- ✅ updated: specs/001-radiant-images-website/research.md
- ✅ reviewed: all 15 .agents/skills/speckit-*/SKILL.md command definitions;
  generic optional-test wording is superseded by this explicit project TDD mandate.
  No obsolete agent-specific runtime guidance requires replacement.
- ✅ reviewed: ../AGENTS.md (delegates to current plan), contracts/README.md,
  templates/Plan_Template.md, templates/Feature_Template_V2.md; no amendment needed.
Deferred placeholders: none.
Follow-up: existing T001 provider/hosting feasibility checks and implementation/release
  evidence remain open in tasks.md; they are not constitution synchronization defects.
-->

# Radiant Images Constitution

## Core Principles

### I. Deliver Verifiable Business Value

Every feature MUST map to a prioritized user story, measurable acceptance criteria, and
tests of observable behavior. Deliver independent increments of discovery, inquiries,
pricing, and owner workflows. Book Now MUST initiate an inquiry; it MUST NOT imply a
confirmed booking. Email success MUST reflect provider acceptance, with actual mailbox
receipt verified separately. Failed submissions MUST preserve valid input and explain
recovery. Web, print, and PDF pricing MUST use one published revision. New booking,
payment, or client-account capabilities require an explicit specification change.

Rationale: a photography site earns trust through accurate information and reliable
inquiries, not through the number of features it ships.

### II. React and Cloudflare Workers with Explicit Boundaries

The frontend MUST use React with strict TypeScript, cohesive components, explicit state
ownership, and accessible semantic HTML. Domain rules, transport code, and presentation
MUST be independently testable. Derived values MUST NOT be duplicated in state without
a documented synchronization need. Secrets, authorization, and authoritative validation
MUST remain server-side.

Backend services MUST run on Cloudflare Workers with TypeScript and Hono, using D1 for
relational data and R2 for media as specified in the current plan. Keep HTTP handlers,
application/domain logic, and persistence/provider adapters separate. Each feature plan
MUST justify hosting compatibility, cost, operations, and testing. Start with one modular
Worker backend; additional services or frameworks MUST solve a documented requirement.
HTTP contracts MUST be explicit, version controlled, and compatibility-tested across
React and the API. A future backend-platform change requires an architecture decision
and constitution amendment rather than an implicit Java/Spring migration.

### III. Test-Driven Development

For every new or changed executable behavior, including validation, UI interactions,
authorization, migrations, and defect fixes, developers MUST:

1. Write a focused test expressing the required outcome.
2. Run it and observe a failure caused by missing or incorrect behavior. An import,
   configuration, or environment failure alone does not establish the red step.
3. Implement the smallest change that makes the test pass.
4. Refactor while the relevant suite stays green.

Tests MUST assert behavior rather than internal implementation or snapshot volume.
Use unit/component tests for rules and interactions, integration tests for persistence
and provider boundaries, contract tests for HTTP interfaces, and E2E tests for complete
journeys. A bug fix MUST first reproduce the defect. Reviews MUST include the red/green
commands and observed outcomes; separate red commits are not required. Documentation-only
changes and declarative setup with no executable behavior require appropriate validation,
not artificial tests. Generic Spec Kit wording that calls tests optional does not waive
this principle. Coverage percentages alone MUST NOT be accepted as proof of correctness.

### IV. Reliable End-to-End Verification

Playwright MUST verify the critical visitor and owner journeys through the real React
application, API, and isolated persistence/storage or faithful local equivalents. Mocking
the application's own API does not count as full-stack E2E coverage. External email,
CAPTCHA, and identity providers MUST use controlled test adapters for routine CI, including
failure cases. Live-provider checks MUST be separate and explicitly identified.

Tests MUST be independent, repeatable, safe to run concurrently, and traceable to acceptance
criteria. Required journeys include discovery-to-inquiry, pricing print/PDF consistency,
owner access rejection and expiry, gallery publication/removal, banner boundaries,
configuration changes, and client/questionnaire isolation as those features are delivered.
Each affected journey MUST cover its relevant failure/recovery path, not only success.

### V. Protect Clients and Photographs

Every owner operation MUST authenticate and authorize on the server, deny by default, and
test unauthenticated, non-owner, expired-session, and cross-client access where applicable.
CAPTCHA verification, input limits, rate limits, output encoding, and upload validation
MUST be enforced server-side. Secrets and production credentials MUST NOT enter source
control, browser bundles, fixtures, logs, screenshots, or traces.

Collect only specified personal data. Inquiry contents MUST remain transient under FR-023;
client records and questionnaire responses MUST have documented access, retention, and
deletion rules. Logs MUST exclude message bodies, questionnaire tokens, and client contact
details. Public portfolio publication MUST have owner-confirmed usage permission, including
guardian permission for identifiable children. Public image derivatives MUST strip GPS and
unnecessary EXIF metadata. Originals, unpublished assets, and backups MUST be private.
Uploads MUST validate actual file content, size and pixel bounds, and use generated storage
keys. Test fixtures MUST use synthetic identities and approved non-sensitive images.

### VI. Accessible, Fast, Discoverable Experiences

Public, admin, and questionnaire interfaces MUST meet WCAG 2.2 AA. Validate semantic
structure, keyboard operation, visible/unobscured focus, labels, error announcements,
contrast, text resizing, meaningful image alternatives, and reduced-motion preferences.
Automated accessibility scans MUST be supplemented by keyboard and representative
screen-reader checks; a clean scan alone does not establish conformance.

Gallery delivery MUST use responsive compressed derivatives, reserved image dimensions,
and lazy loading below the fold. The primary visible image MUST NOT be delayed by lazy
loading. Public routes MUST have crawlable content, meaningful titles/descriptions,
canonical URLs, and a sitemap; admin and tokenized questionnaire routes MUST be excluded
from indexing, without treating robots directives as access control.

Plans MUST define reproducible mobile measurement conditions and image/script budgets.
Public pages MUST retain the feature's three-second usability and 60-second publication
budgets, including cumulative cache age. Core Web Vitals targets are LCP <= 2.5 seconds,
INP <= 200 milliseconds, and CLS <= 0.1 at the 75th percentile, measured separately for
mobile and desktop when sufficient field data exists. Before launch, use documented lab
checks and disclose missing field evidence instead of claiming a field-data pass.

### VII. Operable and Reproducible Delivery

Builds MUST pin compatible runtimes and dependency versions, commit lockfiles/build wrappers,
and run from documented commands in a clean checkout. CI MUST check formatting/lint,
types, production builds, required tests, dependency vulnerabilities, and secret exposure.
Supported runtime/framework releases MUST be selected and their support status verified
when implementation begins; the constitution MUST NOT freeze transient version numbers.

Deployments MUST pass applicable quality gates, use environment-scoped secrets and least
privilege, and document migration, rollback, backup, and restore procedures. Structured
logs MUST include correlation identifiers and sanitized outcomes. Health/failure signals
MUST cover inquiry delivery, authentication, and image publication without exposing client
data. State changes MUST be atomic within the database and recoverable across external
systems; uncertain email outcomes MUST NOT trigger blind retries or false success.

## Engineering Standards

### Stack and Test Boundaries

- React tests MUST use Vitest and React Testing Library for observable component behavior.
  The existing Worker backend MUST retain local D1/R2 integration and OpenAPI contract tests.
- React and Workers MUST agree through the OpenAPI schema and shared TypeScript validation
  schemas. Server-side validation remains authoritative. Validate success, error,
  authorization, migration, and compatibility behavior against isolated local D1/R2.
- External calls MUST have bounded timeouts and documented retry/idempotency semantics.
  Database migrations MUST be versioned and exercised against disposable data.

### E2E Suite Rules

1. Use role/name or label locators; use stable test IDs only where semantics are insufficient.
   Use Playwright auto-waiting and retrying assertions. Fixed sleeps and brittle CSS/XPath
   selectors MUST NOT be used to synchronize application behavior.
2. Give each test a fresh browser context and unique/resettable data. Fixtures MUST seed and
   clean up deterministically. Test order, a shared mutable owner account, or previous test
   output MUST NOT determine results. Control time for scheduling, expiry, and date limits.
3. Test authentication itself separately from reusable authenticated fixtures. Test adapters
   and any seeding endpoints MUST be unreachable in production; secrets/auth state MUST be
   ignored by version control. Verify rejected CAPTCHA and provider-outage behavior too.
4. Run Chromium smoke journeys on each pull request, covering mobile and desktop layouts.
   Run the complete Chromium, Firefox, and WebKit suite nightly and before release; include
   mobile emulation and 320, 768, and 1280 px layout checks. Record tested versions. Emulation
   MUST NOT be represented as verification on physical devices or older browser versions.
5. CI MUST reject focused tests and fail on a test that passes only after retry. Permit at
   most one diagnostic retry; capture a trace and failure screenshot, with sanitized logs
   and a bounded retention period. Do not hide flakes by increasing timeouts/retries.
6. A quarantined test MUST have an owner, issue, expiry, and alternative evidence. Critical
   inquiry, authorization, privacy, and pricing checks MUST NOT be silently skipped.
7. Browser assertions MUST check visible outcomes and persisted/public results. Verify
   downloads and pricing revision/content, with a manual print/PDF layout check for changes
   affecting pagination or appearance. Visual snapshots supplement behavior tests.
8. Routine CI MUST NOT send real inquiries or email real clients. Record provider acceptance,
   mailbox delivery, accessibility review, and human usability evidence separately.

## Development Workflow and Quality Gates

1. **Specify**: Document story outcomes, boundaries, negative/recovery scenarios, permissions,
   data lifecycle, accessibility, and measurable performance/publication requirements.
2. **Plan**: Record the constitution version, backend choice, contracts, test layers, E2E
   matrix/fixtures, observability, and delivery/recovery design. Evaluate Principles I-VII
   before research and after design, with evidence or a tracked unresolved item for each.
3. **Task**: Put test writing and demonstrated failures before dependent implementation,
   including foundation code. Parallel labels MUST NOT bypass this dependency. Include CI,
   media privacy, accessibility, performance, and restore work in the relevant increments.
4. **Implement**: Follow red-green-refactor; keep changes bounded and synchronize schemas,
   documentation, and migration behavior with each increment.
5. **Review**: Check acceptance traceability, test failure/pass evidence, security boundaries,
   accessibility, and complexity justification. Report planned, verified, and blocked gates
   distinctly. Missing evidence MUST NOT become an automatic pass.
6. **Release**: Require passing applicable CI and browser matrix, manual accessibility and
   print/PDF checks where relevant, owner-approved content/photos, verified configuration,
   and a restore/rollback rehearsal. Record results in the feature's acceptance evidence.

## Governance

This constitution governs project specifications, plans, tasks, reviews, and implementation.
Current user instructions take precedence. Generic templates and command examples MUST NOT
weaken these project rules. Ratification is 2026-11-13, the date of this first concrete
constitution; earlier feature-specification dates are not constitution adoption dates.

Amendments MUST state the reason, changed principles, compatibility impact, and migration
work; update the Sync Impact Report and affected templates/artifacts in the same change.
The project owner or designated maintainer MUST accept an amendment before it governs
future work. An explicit request to amend the constitution authorizes that amendment work.
Use MAJOR for incompatible principle removals/redefinitions, MINOR for new principles or
materially expanded obligations, and PATCH for non-semantic clarification. Preserve the
original ratification date and update Last Amended only when the document changes.

Every feature plan and review MUST assess compliance. An exception requires a recorded
scope, rationale, approving owner/maintainer, risk, compensating verification, and expiry;
a complexity note alone does not grant a waiver. Unresolved violations block the affected
implementation or release. Existing plans MUST replace template-era automatic passes and
track unmet obligations before dependent work proceeds.

Reference guidance: [React component/state design](https://react.dev/learn/thinking-in-react),
[Playwright best practices](https://playwright.dev/docs/best-practices),
[WCAG 2.2](https://www.w3.org/TR/WCAG22/),
[OWASP upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html),
and [Core Web Vitals](https://web.dev/articles/vitals).
The project-specific requirements above remain the governing decisions.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13
