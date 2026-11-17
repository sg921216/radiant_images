# Tasks: Radiant Images Photography Website

**2026-11-17 03:29 UTC focused operational acceptance complete:** The normal daily
backup/Gmail health run passes. Actual scheduled GitHub run `44010000756` detects the
controlled fault; the owner confirms receiving its alert. The correct bucket reference
is restored, recovery run `44010074349` passes, and normal monitoring remains enabled.
Public API/R2 access is still disabled; temporary operators and token files are removed.
Current account/namespace usage agrees with all 70 DO calls captured through 03:25 UTC;
historical missing usage remains documented for Cloudflare. **55/67 tasks complete.**
The focused private tests pass with temporary consent; T001/T058 and broader release
acceptance remain open, including deferred Google production work T065–T067.

**2026-11-17 03:01 UTC scheduled backup checkpoint:** The normal `0 3 * * *` invocation
completed backup/read-back verification and real Gmail health (`verified`, zero failures).
Persisted provider logs show the actual scheduled front invocation and production DO,
both `ok` on version `5868ab73-0666-4598-a8dc-dd759e9579ff`; five-minute maintenance
also continues successfully. Scheduled alert receipt/recovery is the remaining focused
test. Temporary Testing consent and the broader T001/T058 production gates remain tracked.

**2026-11-17 02:38 UTC Gmail/monitoring checkpoint:** Complete temporary Testing consent
is now installed. A reproduced primary-address verification bug is fixed and deployed;
33 focused tests pass. The production DO completes backup and real Gmail health, and
GitHub's manual healthy → controlled fault → recovered cycle passes with the correct
bucket reference restored and hourly monitoring enabled. Actual 03:00 UTC daily execution
and 03:17 UTC scheduled notification receipt remain pending. T065–T067 still gate durable
production consent; the Testing grant has a seven-day lifetime from about November 17
02:28 UTC. **55/67 tasks complete; T001/T058 remain unchecked.**

**2026-11-17 02:27 UTC R2 follow-up (November 16 local):** The new credentials pass
recovery listing/operational reads; media and unrelated-bucket reads and a recovery write
probe all return 403. The exact verified pair is now staged in GitHub secrets for
`radiant-images-recovery`. Activation awaits a healthy baseline: the live S3 monitor's
only issue is `gmail_unavailable`, and complete two-scope Gmail consent is still pending.
The selected R2 credential expiry is November 16, 2027; rotate before then. Persisted
observability shows 56 successful maintenance crons plus the initial manual DO call;
account and namespace metrics agree on 57 calls. **55/67 tasks complete; T001/T058 open.**

**2026-11-16 persistent operational setup (R-30):** The owner explicitly
authorized a long-lived environment with public access disabled. `radiant-images-api`,
the `radiant-images` D1 database and private `radiant-images-media` / `radiant-images-recovery`
buckets now exist. Normal five-minute maintenance and 03:00 UTC backup/health schedules
are configured; two actual automatic maintenance runs succeeded. A manual call to the
production scheduler completed maintenance and a verified backup; Gmail correctly reports
unavailable. Real Gmail consent/sender and new
recovery-bucket-only S3 credentials are still required. See acceptance.md for current
scheduled-execution and metering evidence. **T001/T058 remain unchecked; 55/64 complete.**

**2026-11-16 owner-directed deferral:** Continue private acceptance using the newly granted
Testing consent. T065–T067 below track the remaining Google production setup for later;
final photos/content remain under T063. R2 credentials are being prepared by the owner.
**55/67 tasks complete, 12 open.** Testing consent does not close a production release gate.

**Gmail dependency clarification:** The owner's Google console requires genuine homepage
and privacy-policy URLs plus valid branding before External production publication. These
pages now gate long-lived Gmail consent. Approved-test-user consent in Testing is only a
seven-day acceptance credential, not completion of the persistent Gmail-health requirement.

The focused operational sequence is tracked within T001/T058:

- [X] Establish the persistent API/D1/R2 target and verify public ingress is disabled.
- [X] Configure the normal maintenance and daily backup schedules.
- [X] Verify two automatic maintenance invocations and their successful production DO calls.
- [X] Verify automatic maintenance, automatic daily backup, and real Gmail health together (temporary Testing consent; T067 remains deferred).
- [X] Configure and enable GitHub monitoring with verified recovery-bucket-only Object Read Only S3 credentials.
- [X] Verify healthy → fault → recovered monitoring and scheduled notification receipt (actual scheduled run `44010000756`, owner-confirmed receipt, successful recovery `44010074349`).
- [X] Recheck active-environment DO usage and retain the investigation packet: account and namespace counts match 70 captured calls through 03:25 UTC; historical reporting remains unresolved.

**2026-11-16 T001 checkpoint (R-29):** Committed storage guard `c23c943` passes private
application uploads/deletion with real paginated R2 inventory; production backup helper
also succeeds. All 92 tail samples are `ok`, front CPU at most 7 ms. Temporary resources
are removed and absence verified. Owner-reported DO dashboard zeros conflict with live
execution; aggregate metering remains unresolved. Persistent monitor is unconfigured.
Exact-head Quality run 43953953193 passes 290 tests and 163 browser/performance checks
across five projects (12 expected duplicate performance skips), with an identical tested
tree. **55/64 complete, nine open; T001 unchecked.**

**2026-11-16 T001 checkpoint (R-28):** Owner confirms the account Images page shows
Free; daily Workers/D1 analytics are below included allowances in the returned rehearsal
cohorts. Added fail-closed combined R2 capacity checks before image processing and new
backups. Local quality: 64 files / 290 tests and both builds pass; Chromium gallery
2/2 passes. Private provider helper probe: 34/34 checks; resources removed and verified.
DO aggregate metering, persistent recovery monitoring and eventual-commit CI/release
acceptance remain open. **T001 remains unchecked; 55/64 complete, 9 open.**

**2026-11-16 Billing Read checkpoint (R-27): T064 complete.** The scoped token is
active; approved read-only API verification succeeds for subscriptions, explicit-period
usage and spend policies. Supplemental billing records report $0 for the returned
November 14–15 R2/Images usage. No spend policy is configured; $1/$10 budget warnings
remain enabled. T001 retains daily Workers/D1/DO usage, Images plan/cutoff and wider
capacity/control gaps; persistent monitoring and release gates remain open.
**55/64 tasks complete, 9 open.** See acceptance.md and the sanitized billing evidence.

**2026-11-16 CI and follow-up checkpoint (historical):** Quality run
[43934376056](https://github.com/sg921216/radiant_images/actions/runs/43934376056/job/133534973000)
passes on committed R-25 head `e1cea09a750bfa91808dbbef237560aa4cf2cc5c`; the tested PR
merge tree matches exactly. All 287 tests and 158 browser/performance cases pass, with
12 declared duplicate performance-profile skips. New local work updates the deprecated
action runtimes and corrects public-route keyboard focus under T061. The owner explicitly
requested account-scoped Billing Read connection as a follow-up: **T064 is added and
open**, supporting T001 and the dependent persistent monitoring/deployment/release gates.
This adds one tracked dependency without completing any existing gate:
**54/64 tasks complete, 10 open.** See acceptance.md and the T064 quickstart procedure.

**2026-11-15 HTTP CPU checkpoint (R-25):** Incremental routing plus three bounded
bulk-read coordinators resolves the reproduced 14–16-ms cold-read overruns in the sampled
60-photo/200-client workload. Final samples cover all 13 JSON GET operations: front CPU
peaks at 8 ms, with 15 ms inside the read objects. All 117 final contract probes pass;
300 measured bulk reads at concurrency five pass with p95 349/369/385 ms. The final
local quality check passes 64 files / 287 tests and both builds; all 50 smoke cases
across five browser projects pass without retries or skips. Temporary Cloudflare
resources were removed and absence verified, preserving the unrelated existing bucket.
See acceptance.md and `evidence/cloudflare-api-cpu-remediation.json` for sample limits,
browser results and source identity. These source changes need remote CI after commit.
T001 remains open for account-wide usage/plan and wider capacity evidence; T058 needs
persistent monitoring. T059's committed R-24 acceptance remains complete.
**54/63 tasks complete, 9 open.**

**2026-11-14 committed R-24 CI checkpoint:** T059 is complete. PR Quality run
[43675695318](https://github.com/sg921216/radiant_images/actions/runs/43675695318/job/132695230356)
passes for `c00eaab40235185e7d320176986ccdf3fe4bc334`; the tested PR merge tree exactly
matches that feature head. Results: 63 files / 281 tests; 158 browser passes and 12 declared
duplicate performance-profile skips, with all five functional projects covered. Quality,
security, builds and diagnostic privacy gates pass. R-24's 40-operation success/error and
31-operation authorization evidence is retained. **54/63 tasks complete, 9 open.** The
actual-device matrix remains T063; T001/T058 and the other release gates stay open.
See acceptance.md and `evidence/github-ci-r24-20261115.json`.

**Earlier 2026-11-14 CPU, usage and pricing checkpoint (R-24):** Scheduled recovery now runs in
one private Durable Object. Three actual accelerated cron samples report 0/0/0 ms front
CPU at provider resolution, versus the earlier 30–43 ms; coordinator work completes at
30/28/18 ms and the independent observer reports healthy. Temporary resources were
removed and absence verified. Portfolio uploads now have a persistent 300-attempt rolling
30-day allowance, with local integration proof. An enabled $1 account budget warning
supplements the existing $10 warning; neither stops billing. T001 remains open for general
HTTP CPU and account-wide usage/plan evidence; billing reads return 403. T058 still needs
the persistent deployment and scheduled monitoring/recipient configuration.

T031's pricing checks are complete: 20/20 browser cases across all five configured
projects, successful publication/rollback integration tests, and visual/text inspection
of all 12 pages from initial/updated download and browser-print PDFs. Prices and revision
IDs match. Overall SC-001 human timings remain with T025/T063; final-content/physical-device
acceptance is not inferred. **53/63 tasks complete, 10 open.** Contract observation now
covers all 40 operations with success/error and all 31 protected operations with 401/403.
The latest pushed baseline `48d5ee3` passes remote Quality run 43673720689: 271 tests,
153 browser passes and 12 declared non-target performance-profile skips. T059 remains
open for remote CI on the current local changes. See acceptance.md and the sanitized
evidence records. No public release occurred.

**2026-11-14 recovery rehearsal checkpoint (R-23):** On the feature branch fast-forwarded
to merged main `d4e8aee`, a private temporary Worker/D1/two-R2-bucket rehearsal now verifies
application backup/restore, deleted-client cascades, media byte recovery, blocked unsafe/expired
restores, failed cleanup with receipt preservation and successful retry. Actual D1 Time Travel
and independent-ledger reconciliation, compatible Worker rollback and an actual accelerated
Cloudflare cron invocation pass. An independent binding reader detects injected stale jobs and
overdue recovery objects and returns healthy after recovery. The GitHub notification test ran
and failed at its intended synthetic step; recipient receipt is separate. The first tailed cron
used 32 ms CPU, above the Workers Free 10-ms limit: T001 CPU headroom remains open.
Replacement bucket-only read credentials passed live S3 checks, real GitHub healthy/failure
runs and a recovered healthy run executed, and the user confirmed notification receipt.
All temporary Cloudflare resources and GitHub monitor settings were removed and verified;
details and token-revocation follow-up are in acceptance.md.
T058 remains open for persistent deployment/monitor activation and unresolved operational
acceptance; **52/63 tasks complete, 11 open**. No public release is authorized by this rehearsal.

**2026-11-14 remote PR CI checkpoint:** GitHub run 43666811821 passes the Quality job
on commit `358277e17d486dec15f2733778792e37f5b95c17`, including frozen install,
quality/security checks, tests/builds and Chromium smoke. Its full browser suite was
skipped by the previous event condition. CI now selects the complete configured suite
for pull requests as well as nightly/manual/release runs; main pushes retain smoke checks.
The changed workflow still needs a remote run before merge. T059 remains open and
**52/63 tasks remain complete**. See acceptance.md and the linked sanitized run evidence.

**2026-11-14 monitoring credential/freshness correction:** R-22 replaces the monitor's
account-wide REST authentication with bucket-scoped S3 Object Read Only credentials.
The checker reads only job/health bodies, inventory and backup HEAD metadata. Running jobs
must retain a recent successful completion; repeated starts no longer hide missed work.
T058 remains open for deployed recovery/cron proof, monitoring activation and owner receipt.
**52/63 tasks remain complete, 11 open**; no release or provider acceptance is inferred.

**2026-11-14 memory/monitoring follow-up:** R-21 closes the missing coordinator-memory
sample with four passing deployed 40-MP/10-MiB slow-stream uploads. T034 implementation
and portfolio-provider evidence are complete: **52/63 tasks complete, 11 open**. T001
still gates release for account-wide usage controls, general API CPU headroom and recovery
operations. T058 now includes tested private job signals and an independent hourly GitHub
monitor; production cron/restore proof and actual owner notification receipt remain open.
The owner selected GitHub failure notifications. All temporary resources were removed.

**Earlier 2026-11-14 deployed gallery follow-up:** R-20 and acceptance.md record 11/11 passing
private deployed checks and concurrent-upload admission. A per-portfolio mutation Durable
Object reduced observed front-Worker maximum CPU from 109 ms to 7 ms. Strict damaged-JPEG
rejection, private originals and metadata-free derivatives passed. JPEG-validator memory
analytics arrived; coordinator memory remains unavailable. T001/T034 stay unchecked for
remaining resource/usage-budget evidence; operational retention and other release gates
remain open. All rehearsal resources were removed. Task count stays 51/63; Pixieset handles
client delivery.

**Input**: `specs/001-radiant-images-website/` — spec.md, plan.md, research.md, data-model.md, contracts/README.md, contracts/openapi.yaml, quickstart.md.
**Organization**: Setup, shared foundation, six independently verifiable story increments in priority order, then release validation.
**Tests**: Mandatory red-green-refactor for every executable behavior, including foundation,
schemas, UI interactions, migrations, security, and fixes. Before each implementation task,
write focused tests in the owning `apps/web/tests/`, `apps/api/tests/`, or
`packages/shared/tests/` module and observe a behavioral failure. Missing imports or broken
setup alone do not count. Each implementation task includes these test steps even when a
separate story-level test task exists. Record red/green commands and outcomes in
`specs/001-radiant-images-website/acceptance.md`; refactor with relevant suites green.
Full-stack Playwright uses the real local React/Worker/D1/R2 stack with doubles only at
external provider boundaries. Real-mail and human acceptance remain separate evidence.
**Constitution**: `.specify/memory/constitution.md` v1.0.0 (2026-11-13) governs this task list.
React + Cloudflare Workers is the confirmed stack. Generic optional-test instructions do
not override the mandatory TDD and E2E requirements.
**Paths**: Repository-relative. `[P]` means tasks can run concurrently only within the dependency waves stated below. All other tasks run in listed order. Story labels map directly to spec.md.

**Owner gate decisions (2026-11-14)**: The operational retention policy is approved and
supersedes the historical unconditional day-30/day-31 physical-deletion requirements below.
T001/T058 still need verified cleanup/retry, independent monitoring/owner alerts, safe receipt
retention and expired/unsafe-restore refusal in production. The owner selected the existing
paid Pixieset **Client Gallery** account for client delivery while retaining portfolio images
on this website. T001/T034 production portfolio decoding therefore remains required. No
Studio Manager migration or automatic gallery sync is selected. **51/63 tasks remain complete**;
policy/scope decisions alone do not close implementation or acceptance tasks.

**Earlier local verification (2026-11-14)**: `pnpm check` passes **50 files / 229 tests**,
formatting/lint/types and production builds. A single combined functional matrix passes
**150/150** (30 cases in each of Chromium desktop/mobile, Firefox desktop and WebKit
desktop/mobile), with zero retries, failures, skips or flaky classifications. The separate
30-case WebKit event diagnostic also passes, without reproducing the historical input loss.
Client browser cases now attach bounded, contact-value-free native-event diagnostics on
failure. Product code and input sequences are unchanged; no input-loss cause or fix is
claimed. Remote CI has no recorded runs and T059 stays open. The owner requested privacy
copy remain pending, so T023 stays open. **51/63 tasks remain complete**; see acceptance.md
and `evidence/local-functional-matrix-summary.json` for results and outstanding gates.

**Earlier implementation checkpoint (2026-11-14)**: Prerequisites passed; requirements checklist
16/16 complete. The owner has selected Cloudflare Workers Static Assets and completed R2
account enrollment; the hosting-choice blocker is resolved. T001 remains **OPEN**, not
completed: strict recovery expiry and production image-validation feasibility remain
blocked. Research R-16 now records verified usage allowances/control limitations, exact
toolchain candidate metadata and successful strict dependency resolution. The local-only
sequencing exception in `feasibility-decision.md` was explicitly APPROVED by the owner
on 2026-11-13. All six stories now have local API and interface implementations, with private recovery,
security headers, strict contracts, CI/deployment guards and performance fixtures. Checked
tasks below identify verified completion: **51 of 63 complete, 12 open**. The final local
Vitest run passed 50 files / 227 tests. Browser corrections have passing evidence across
the 112 Chromium/WebKit project/case combinations. The owner-extracted Firefox 159.0 now
launches; its complete functional rerun passed 28/28 after strengthening a checklist reload
readiness assertion. Initial failures remain recorded, including the unresolved WebKit input
failure; no clean combined matrix or remote CI pass is claimed. All 40 native-clock cold mobile
samples, 13 JSON-read latency profiles and 20 inquiry timings passed their local thresholds;
synthetic photographs keep performance acceptance provisional. `acceptance.md` records the
full evidence and remaining gates. Real-provider/human, production-decoder/retention,
owner content/privacy and remote release tasks remain open under the approved exception.

**WebKit investigation follow-up (2026-11-14)**: Consecutive `input` events and deferred
client-list responses before/after email entry preserve the draft through blur and submission
in all 8 client component tests; the web component suite passes 15 files / 44 tests.
Two focused browser probes compare `fill` and `pressSequentially`, create three clients,
and verify persisted values after reload. The initial restricted session could only list
60 cases; its access failures remain in `evidence/local-webkit-investigation-summary.json`.
A later session built the app and launched the existing WebKit 27.2 without reinstalling
the browser or changing security settings. Actual execution exposed an ambiguous detail-page
email locator: 40 probe failures / 20 owner-workflow passes. Correcting only the post-save/reload
assertions to target the textbox produced **59/60 passes**, with one WebKit mobile `fill`
case losing the first name before submission. A single ten-case passive-event diagnostic
run passed but did not establish the cause or erase that failure. **Execution is unblocked;
input-loss investigation and T059 remain OPEN.** No product code changed. See acceptance.md,
`evidence/local-webkit-access-followup-summary.json`, and
`evidence/local-webkit-locator-corrections-summary.json`; the count remains 51/63.

## Phase 1: Setup

**Goal**: Establish a runnable monorepo and resolve feasibility issues before dependent implementation.

- [ ] T001 Verify the selected Workers Static Assets/R2 deployment's included-usage budgets and overage controls, R2 availability (owner reports enrollment complete), rate-limit binding windows, Gmail send-as validation scopes, supported toolchain versions, backup/client/questionnaire retention and deletion, and browser/server image validation with explicit pixel bounds; record evidence and required design/contract/data-lifecycle corrections in `specs/001-radiant-images-website/research.md`, `specs/001-radiant-images-website/data-model.md`, and `specs/001-radiant-images-website/contracts/openapi.yaml`, escalating any required change to the user's hosting constraints before dependent work.
- [x] T002 Initialize pnpm workspaces, TypeScript configuration, pinned compatible dependencies, Node engines, and root dev/build/lint/typecheck/test/e2e scripts in `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `apps/web/package.json`, `apps/api/package.json`, and `packages/shared/package.json` using plan.md's stack.
- [x] T003 [P] Configure declarative React Router framework settings for ssr:false, public prerender routes, root deployment basename `/`, Workers Static Assets deployment configuration, Tailwind, and route declarations in `apps/web/react-router.config.ts`, `apps/web/vite.config.ts`, `apps/web/wrangler.toml`, and `apps/web/app/routes.ts`. Defer executable shell, routing, and metadata/sitemap generation behavior to T012/T015 after T006 provides the test harness; verify built output in T061.
- [x] T004 [P] Configure Worker bindings, local D1 migrations, R2, scheduled jobs, and environment types in `apps/api/wrangler.toml`, `apps/api/drizzle.config.ts`, and `apps/api/src/env.ts` using T001's verified provider constraints.
- [x] T005 [P] Configure ESLint/Prettier and ignore secrets, build artifacts, local databases, and dependencies in `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `apps/api/.dev.vars.example`, and `apps/web/.env.example`; document which browser variables are public.
- [x] T006 Configure Vitest/RTL, Worker integration with local D1/R2 and provider doubles, strict OpenAPI validation (including explicit error status/schema checks and a missing-401/403 operation check), Playwright, and axe in `apps/web/vitest.config.ts`, `apps/api/vitest.config.ts`, `packages/shared/vitest.config.ts`, `apps/api/tests/helpers/contracts.ts`, `apps/api/tests/helpers/providers.ts`, and `playwright.config.ts`; create isolated synthetic fixtures/reset/cleanup and controlled time in `e2e/fixtures.ts` and `scripts/test-setup.ts` with a root `test:setup` script. Establish `.github/workflows/ci.yml` before foundation: PR Chromium smoke, nightly/release Chromium/Firefox/WebKit, mobile/desktop projects, semantic locators, focused-test rejection, fail-on-flaky policy, one diagnostic retry maximum, sanitized traces/screenshots with seven-day retention, and production exclusion of test adapters/seeding. Exercise harness behavior with focused tests before implementing it; T059 completes the release gates.

## Phase 2: Foundational Prerequisites

**Goal**: Provide the shared database, secure admin boundary, provider adapters, and public data infrastructure. Complete this phase before any story.

- [x] T007 First write/run failing migration, constraint, cascade, and seed-boundary tests in `apps/api/tests/db.test.ts`; then implement data-model.md tables, foreign keys, uniqueness constraints, cascade rules, indexes, migration commands, and safe local seeds in `apps/api/src/db/schema.ts`, `apps/api/src/db/migrations/0001_initial.sql`, and `apps/api/src/db/seed.ts`; include the seeded singleton pricing-publication pointer with foreign-key/check constraints and rollback tests, required FAQ topics, referral defaults, timezone, three-type pricing, page stubs, no inquiry-content table, hashed identity-grant exchange_codes (no session reference), nullable same-client client_emails.questionnaire_invite_id, required public_contact_email with a synthetic hello@example.invalid local seed, and T001's data-lifecycle rules.
- [x] T008 [P] First write/run failing validation boundary tests in `packages/shared/tests/common.test.ts`; then define shared enums, IDs, date/number limits, API error schemas, and content/bootstrap types in `packages/shared/src/constants.ts`, `packages/shared/src/schemas/common.ts`, `packages/shared/src/schemas/content.ts`, and `packages/shared/src/index.ts`; preserve OpenAPI field names and keep story-specific schemas separate.
- [x] T009 [P] First write/run failing CORS, request-limit, error, log-redaction, and rate-limit tests in `apps/api/tests/middleware.test.ts`; then implement Hono bootstrap, configured-origin CORS, request IDs, sanitized errors/logs, bounded bodies, validation, and rate limits in `apps/api/src/index.ts`, `apps/api/src/middleware/validate.ts`, `apps/api/src/middleware/rateLimit.ts`, and `apps/api/src/services/audit.ts`; enforce T001-verified limits and Retry-After without logging visitor data (FR-030/032/034/035).
- [x] T010 Add authentication contract/integration cases for verified identity, invalid/replayed state/code, allow-list rejection/removal, session expiry, logout, provider outage, and protected operations in `apps/api/tests/auth.test.ts` before implementing auth. Prove callback creates only a hashed identity grant; exchange atomically consumes it and creates one usable session with a stored bearer hash, including concurrent redemption, invalid/expired/replayed codes, allow-list removal between callback/exchange, rollback, no-store response, and lost post-commit response followed by fresh sign-in. Assert no raw auth material in storage/logs (FR-024–026, SC-003).
- [x] T011 Implement Google OIDC/PKCE, full ID-token validation, short-lived browser-bound OAuth state, one-time exchange codes, hashed bearer tokens, 24-hour sliding inactivity and seven-day absolute expiry, and allow-list checks on every owner operation in `apps/api/src/routes/auth.ts`, `apps/api/src/services/session.ts`, and `apps/api/src/middleware/requireOwner.ts`; use the contract's callback `#code` consistently. At callback store only the hashed 60-second verified-identity grant; at exchange recheck allow-list, atomically consume the grant and insert a new bearer hash, then return the raw token once after commit with no-store. Reject invalid/expired/replayed codes with 400 and removed owners with 403 plus grant invalidation; transaction rollback preserves the grant and creates no session. Mount protection for every `/admin/*` route.
- [x] T012 Implement the API client, sessionStorage token handling, callback fragment removal, sign-out/expiry handling, denied/login pages, and protected admin shell in `apps/web/app/lib/api.ts`, `apps/web/app/lib/auth.ts`, `apps/web/app/routes/admin/login.tsx`, `apps/web/app/routes/admin/callback.tsx`, `apps/web/app/routes/admin/denied.tsx`, and `apps/web/app/routes/admin/dashboard.tsx`; remove the callback fragment before the exchange request, never automatically retry exchange, and offer fresh Google sign-in after an exchange failure/lost response rather than token recovery. Expose links only for implemented sections.
- [x] T013 Implement Gmail refresh/send and verified sender lookup, header-safe MIME construction, Turnstile verification, and local consent tooling in `apps/api/src/services/email.ts`, `apps/api/src/services/turnstile.ts`, and `scripts/gmail-consent.ts`; keep credentials server-side and fail closed. Implement plan.md's two-second per-provider/four-second overall email deadlines and typed confirmed-acceptance, definite-non-delivery, and uncertain-delivery outcomes. Test response loss after provider acceptance and abort after dispatch; never automatically retry a send.
- [x] T014 Implement public bootstrap and image variant reads in `apps/api/src/routes/public.ts`, `apps/api/src/routes/images.ts`, and `apps/api/src/services/publicContent.ts`; serve only public config/content (including required publicContactEmail, never inferred recipient/sender fields), ordered gallery metadata and the current pricing revision, restrict image paths to published image variants, and keep total cache age within the 60-second publication budget.
- [x] T015 First write/run failing layout, refresh, and metadata tests in `apps/web/tests/publicContent.test.tsx`; implement the public layout, theme/focus styles, typed bootstrap state and bounded refresh in `apps/web/app/components/PublicLayout.tsx`, `apps/web/app/styles/theme.css`, and `apps/web/app/lib/publicContent.ts`. Add root/route metadata, canonical URLs, sitemap generation, and private-route noindex in `apps/web/app/root.tsx` and `apps/web/scripts/sitemap.ts` (QR-003); lazily load admin/questionnaire UI. Revalidate public data within the publication budget without stacking a fresh 60-second client TTL on cached responses.

**Checkpoint**: Local migrations/seeding, authenticated shell, provider mocks, and public bootstrap work; no private config, client records, secrets, or backup objects are publicly readable.

## Phase 3: US1 — Discover Services and Submit an Inquiry (P1, MVP)

**Goal**: Deliver the complete anonymous discovery-to-inquiry journey with seeded content and gallery data.
**Independent test**: Navigate all six links at desktop/mobile widths; open each service and FAQ; submit a valid inquiry and verify actual mailbox receipt within five minutes. Invalid data/CAPTCHA, stale options, duplicates, and provider outages must never yield false success or lose entered values. Gallery management is not required for this increment.

- [x] T016 [P] [US1] Write inquiry contract/integration cases in `apps/api/tests/inquiries.test.ts` for conditional phone, optional blank fields, timezone date limits, numeric/text limits, stale options, CAPTCHA expiry/outage, forged sender/recipient, concurrent duplicates, definite rejection with explicit retry, accepted-send response loss/timeout, audit-write failure after acceptance, and PII-free audit/storage. Assert typed 502/504 code/retryable pairs, retained duplicate claims on uncertainty, and 202 with sanitized fallback audit after known acceptance (FR-015–023, SC-002/003).
- [x] T017 [P] [US1] Write discovery/contact acceptance cases in `e2e/inquiry.spec.ts` for header ordering, all public routes, Book Now, FAQ topics, mobile menu, all contact inputs, retained values, disabled in-flight submission, keyboard errors, and gallery layouts at 320/768/1280px. Add provider-response loss and browser/API-response loss cases; assert preserved values, no false success or immediate resend, and no timer-based re-enable after duplicate expiry. Test selectable publicContactEmail and a mailto link without inquiry data even while the API is unavailable; opening the link or waiting never unlocks resend. Cover confirmed receipt without another send, unknown receipt staying blocked, and explicit owner-checked acknowledgement/restart retaining the draft with fresh CAPTCHA/manual Submit and unchanged duplicate/rate limits (US1-AS1–11).
- [x] T018 [US1] Implement context-aware inquiry validation in `packages/shared/src/schemas/inquiry.ts`, including Call/Text phone requirement, today through 18 calendar months in configured timezone, 1–4 hours, 1–12 people, and current dropdown membership (FR-015–017).
- [x] T019 [US1] Implement rate-limit → CAPTCHA → validation → atomic duplicate claim → Gmail dispatch → audit → response in `apps/api/src/routes/inquiries.ts` and `apps/api/src/services/inquiry.ts`; enforce the two-minute normalized email/message guard, release claims only on definite non-delivery and retain accepted/uncertain claims until expiry. Retain no inquiry content. Return 502 email_not_sent with retryable:true or 504 email_outcome_unknown with retryable:false as defined in the contract; preserve 202 for known acceptance even when primary audit storage fails, using sanitized fallback audit/failure signals. Never resend to repair audit history (FR-018–023/032/035).
- [x] T020 [P] [US1] Build centered-logo desktop navigation, accessible collapsed mobile navigation, and Contact-bound CTA in `apps/web/app/components/Header.tsx` and `apps/web/app/components/BookNow.tsx` (FR-001/002/006).
- [x] T021 [P] [US1] Build responsive ordered gallery with tag filtering, srcset/sizes, reserved dimensions, meaningful alternative text, empty-state handling, and failed-image placeholders in `apps/web/app/components/Gallery.tsx` (FR-005/033).
- [x] T022 [US1] Build Home, Maternity, Newborn, Family, About, and FAQ routes with safe Markdown rendering, service descriptions/How It Works, seeded gallery content, and CTAs in `apps/web/app/routes/public/home.tsx`, `apps/web/app/routes/public/maternity.tsx`, `apps/web/app/routes/public/newborn.tsx`, `apps/web/app/routes/public/family.tsx`, `apps/web/app/routes/public/about.tsx`, and `apps/web/app/routes/public/faq.tsx`; retain extension points for US2 pricing (FR-003–007).
- [ ] T023 [US1] Build the complete labeled contact form in `apps/web/app/routes/public/contact.tsx` and `apps/web/app/components/forms/InquiryForm.tsx`, with shared validation, Turnstile/reset flow, refreshed stale options, preserved input, error summaries, provider-accepted confirmation, and separate definite-failure/uncertain-delivery states. Treat a lost API response after Submit as uncertain; preserve active-form values and suppress resend until manual owner verification and an explicit new submission, with no timer-based re-enable. Show the approved publicContactEmail before submission and retain it through outages; provide selectable text and a mailto link without inquiry data. Implement receipt-confirmed finish, unresolved receipt, and the explicit Rebekah-checked acknowledgement plus Start a new submission transition defined in plan.md; retain the draft, reset CAPTCHA and require manual Submit without bypassing server limits. Include owner-supplied privacy copy without inventing policy (FR-015–022/033).
- [x] T024 [US1] Implement protected atomic page/FAQ editing endpoints and admin editor in `apps/api/src/routes/admin/content.ts` and `apps/web/app/routes/admin/content.tsx`; preserve required FAQ coverage, reject unsafe content, and audit successful/failed changes (design contract support for FR-003/004/030/032).
- [ ] T025 [US1] Run US1 suites and quickstart steps 1–3 and 5–13 using only their US1 assertions (step 3 excludes pricing; step 5 excludes the Pricing-section CTA). Execute the predeclared SC-002 healthy-provider run (at least 10 distinct inquiries) and record submitted/accepted/received counts plus Submit-to-receipt timings separately from negative cases. Apply plan.md's preregistered SC-008 cohort/scoring protocol for human acceptance and record results/content inputs in `specs/001-radiant-images-website/acceptance.md`. SC-001 covers only service/Contact navigation and inquiry completion here; defer pricing navigation to T031. SC-004 layout/readiness evidence is partial until US2 pricing and T061's full profile; do not mark either criterion fully passed at this checkpoint (SC-001/002/003/004/008).

**Checkpoint**: US1 is a working lead-capture MVP with seeded gallery/configuration. US2–US6 remain later increments of the full specified product.

## Phase 4: US2 — Review, Print, and Download Pricing (P2)

**Goal**: Present editable packages and consistent web/print/PDF pricing.
**Independent test**: Publish prices, open each service, compare all three types across print/PDF/current revision, then force PDF failure and confirm print/page still work. Reject missing-type packages without changing published prices.

- [x] T026 [P] [US2] Write pricing API/atomicity and revision consistency checks in `apps/api/tests/pricing.test.ts` and `e2e/pricing.spec.ts`, including package order, three-type completeness, 60-second propagation, print-only schedule, and PDF failure. Freeze the clock for simultaneous publications; prove exactly one current pointer, last-committed publication selection, complete unmixed package sets, consistent bootstrap/pricing readers, and rollback on a failed pointer/package write (FR-008–011, SC-006/011).
- [x] T027 [US2] Define package/pricing validation and implement public GET /pricing plus protected GET/PUT /admin/pricing in `packages/shared/src/schemas/pricing.ts`, `apps/api/src/services/pricing.ts`, and `apps/api/src/routes/admin/pricing.ts`; publish complete immutable revisions and fresh package-row IDs together with the singleton pricing_publication.current_revision_id update in one transaction. Last committed publication wins even for equal timestamps; timestamps never select current pricing. Read pointer/revision/packages in one consistent query/snapshot shared with public bootstrap (US2-AS6).
- [x] T028 [P] [US2] Build package add/remove/reorder/edit and publish UI with atomic failure feedback in `apps/web/app/routes/admin/pricing.tsx` (FR-011/030).
- [x] T029 [P] [US2] Build one-revision pricing state, service-type sections, Book Now, and full-schedule print layout in `apps/web/app/lib/pricing.ts`, `apps/web/app/components/PricingSection.tsx`, and `apps/web/app/styles/print.css`; never mix bootstrap and separately fetched revisions (FR-006/008/009).
- [x] T030 [US2] Build lazy-loaded full-schedule PDF generation with revision/publish footer, download and retryable error state in `apps/web/app/lib/PricingPdf.tsx`; bind page, print, and PDF to the same revision and integrate pricing into the three service routes in `apps/web/app/routes/public/maternity.tsx`, `apps/web/app/routes/public/newborn.tsx`, and `apps/web/app/routes/public/family.tsx` (FR-010/011).
- [x] T031 [US2] Run pricing suites and quickstart steps 3–5 (including their deferred US2 assertions) and 22–23. Verify Home-to-pricing navigation in fewer than three clicks, the Pricing-section Book Now CTA, and service readiness including loaded pricing; combine with T025's evidence to complete SC-001. Visually inspect print/PDF for clipping/pagination and record price/revision parity in `specs/001-radiant-images-website/acceptance.md`; full SC-004 benchmarking remains T061 (SC-001/006/011).

## Phase 5: US3 — Owner Manages the Gallery (P3)

**Goal**: Add, tag, reorder, describe, and delete portfolio images safely.
**Independent test**: Owner uploads Newborn image, confirms Home/Newborn only within 60 seconds, retags/reorders/deletes it; exercise zero/one/60 images, invalid upload, storage failure, and unauthorized requests without partial publication.

- [x] T032 [P] [US3] Write gallery contract/integration and browser cases in `apps/api/tests/gallery.test.ts` and `e2e/gallery.spec.ts` for tag filtering, order, metadata validation, forged uploads, concurrent 60-image cap, R2 failure compensation, deletion failure, and authorization. Assert missing alt is rejected on upload; empty, whitespace-only or over-200-character alt is rejected on upload or when supplied on edit; omitted alt in a tag-only edit preserves existing text. Verify published data is unchanged on failure and descriptive alt renders on Home/service pages (FR-027/030/033, SC-003/005).
- [x] T033 [US3] After T032's relevant red cases, write/run failing conversion and metadata tests in `apps/web/tests/images.test.ts`; implement JPEG/PNG/WebP size/pixel checks and full/card/thumb generation at 2000/800/320px maximum long edge in `apps/web/app/lib/images.ts`. Verify GPS/unnecessary EXIF removal from public derivatives, preserve visual orientation, and retain source data privately according to T001's upload contract (QR-001).
- [x] T034 [US3] Implement gallery schema, protected list/upload/patch/reorder/delete, actual binary/pixel/metadata validation, generated storage keys, capacity enforcement, staged R2 writes/cleanup, atomic publication and auditing in `packages/shared/src/schemas/gallery.ts`, `apps/api/src/routes/admin/gallery.ts`, and `apps/api/src/services/images.ts`; trim and require descriptive alt text of 1–200 characters on upload and when supplied on edit (omitted edit fields preserve existing text). First test forged client derivatives, EXIF/GPS exposure, private originals/unpublished objects, and cross-storage failures in `apps/api/tests/gallery.test.ts` (FR-027/033, QR-001). R-19/R-20/R-21 record strict-decoder, deployed upload and sampled resource evidence; release still requires T001.
- [x] T035 [US3] Build upload progress/errors, tag and required descriptive-alt editing with 1–200 trimmed-character validation/help text, accessible reorder controls, and delete confirmation in `apps/web/app/routes/admin/gallery.tsx`; do not offer a decorative-image bypass for portfolio photographs. Refresh public data within 60 seconds after successful saves (FR-027/033, SC-005).
- [x] T036 [US3] Run gallery suites and quickstart steps 14–16; verify fresh and already-open public pages at 320/768/1280px and record publication latency in `specs/001-radiant-images-website/acceptance.md` (SC-004/005).

## Phase 6: US4 — Owner Schedules a Promotion or Alert Banner (P4)

**Goal**: Show exactly one scheduled banner beneath the header with no inactive gap.
**Independent test**: Create overlapping windows, advance through start/end boundaries, edit/delete, and verify every public page updates within 60 seconds, including an already-open page.

- [x] T037 [P] [US4] Write banner boundary, timezone/DST, overlap/tie, atomic-save, and public refresh cases in `apps/api/tests/banners.test.ts` and `e2e/banners.spec.ts` (FR-012–014, SC-007).
- [x] T038 [US4] After T037's relevant red cases, write/run focused boundary tests in `packages/shared/tests/banner.test.ts`; define message/HTTPS-link/schedule validation and inclusive-start/exclusive-end selection in `packages/shared/src/schemas/banner.ts` and `apps/api/src/services/banners.ts`; choose latest start then newest creation and handle invalid/ambiguous local times.
- [x] T039 [US4] Implement protected banner CRUD, audit, and shared public eligibility lookup in `apps/api/src/routes/admin/banners.ts` and `apps/api/src/services/publicContent.ts`; enforce end after start and atomic save (FR-012–014/030/032).
- [x] T040 [P] [US4] Build timezone-labeled scheduling editor and error feedback in `apps/web/app/routes/admin/banners.tsx` (FR-014).
- [x] T041 [P] [US4] Build accessible optional banner beneath Header in `apps/web/app/components/Banner.tsx` and integrate it with `apps/web/app/components/PublicLayout.tsx`; use bounded data refresh and local end-time handling so inactive banners leave no gap and appearance/disappearance meets 60 seconds (FR-012/013, SC-007).
- [x] T042 [US4] Run banner suites and quickstart steps 17–18, including background-tab resume and next-load edits/deletes, and record timing evidence in `specs/001-radiant-images-website/acceptance.md` (SC-007/010).

## Phase 7: US5 — Owner Configures Contact Options and Recipient (P5)

**Goal**: Configure recipient/sender, locations, referral options, and timezone with safe validation.
**Independent test**: Save a new recipient and verify a subsequent inquiry reaches it; change dropdowns and reject a stale selection; reject invalid recipient/sender/empty lists while preserving all previous settings.

- [x] T043 [P] [US5] Write configuration contract/integration and contact interaction cases in `apps/api/tests/config.test.ts` and `e2e/settings.spec.ts` for sender verification failure, malformed addresses, empty/duplicate options, atomic saves, stale forms, and subsequent inquiry delivery. Cover required/nonempty valid publicContactEmail, explicit public labeling, independence from private recipient/sender, safe public bootstrap projection, failed-save preservation, and 60-second recovery-address propagation (FR-028/029/030, SC-005).
- [x] T044 [US5] Implement shared configuration validation and protected GET/PUT /admin/config in `packages/shared/src/schemas/config.ts` and `apps/api/src/routes/admin/config.ts`; verify sender using T013, persist all-or-nothing, audit outcomes, and validate required publicContactEmail independently and expose it through bootstrap without deriving/exposing private sender/recipient values (FR-028/029/032).
- [x] T045 [US5] Build recipient/sender, required publicContactEmail explicitly labeled as publicly displayed and monitored for recovery, ordered location/referral, and IANA-timezone settings with saved-state/error feedback in `apps/web/app/routes/admin/settings.tsx`; retain previous settings on failed saves (FR-028/029).
- [ ] T046 [US5] Run settings suites and quickstart steps 19–21; repeat SC-002's predeclared healthy-provider run of at least 10 distinct inquiries to the updated real mailbox, retain submitted/accepted/received counts and timings, verify an independent public-contact update reaches Contact/recovery within 60 seconds without exposing/changing private addresses, and record stale-form behavior and 60-second propagation in `specs/001-radiant-images-website/acceptance.md` (SC-002/005).

## Phase 8: US6 — Owner Manages Clients and Session Workflows (P6)

**Goal**: Maintain clients, template emails/history, independent checklist progress, and single-use questionnaires.
**Independent test**: Create two clients; email one from a template, change only that client's checklist, send/submit its questionnaire and review responses. Reject expired/reused/cross-client access; preserve snapshots after master edits; cascade client deletion.

- [x] T047 [P] [US6] Write client/template/checklist API cases in `apps/api/tests/clients.test.ts` for manual CRUD, deletion cascades and durable private deletion receipts, interrupted deletion/idempotent retry without false success, definite email rejection, accepted-send response loss/timeout, accepted-send/history-write failure with manual reconciliation and no blind resend, sender/Reply-To, master addition/reorder/rename/removal, and independent per-client progress. Use two existing clients with different completion states; verify a new master item is incomplete for both, retained progress survives saves/reloads and rename/reorder, removed items and their state disappear, repeated saves create no duplicates or reset progress, and a new client receives every current item as incomplete. Force a propagation failure and prove the master and all per-client state roll back together (FR-031/031a/031b/031d, QR-002).
- [x] T048 [P] [US6] Write questionnaire API and complete owner workflow acceptance cases in `apps/api/tests/questionnaire.test.ts` and `e2e/clients.spec.ts` for 30-day expiry, concurrent single-use submission, token isolation, schema snapshot validation, definite-send failure invalidation versus preserving possibly delivered invites on uncertain/history-failed outcomes, client deletion, and retained past responses. Require owner `questionsSnapshot`/nullable `answers` contract fields; edit/delete/reorder master questions and choices, reload client detail, and assert original prompts/types/choices/order still label the saved answers. Verify ordinary email uses questionnaireInviteId:null; template/dedicated questionnaire sends associate one same-client invitation, redact every link in stored subject/body and owner/API history with the omission marker, and deliver a usable link only through the controlled email adapter. Assert pasted application questionnaire URLs are rejected before persistence/send, cross-client invitation associations fail, and uncertain/history-failed sends retain their invitation without leaking tokens. Keep assertion output/traces sanitized. Verify public responses expose no owner history. In the browser workflow, add a master checklist item and reload two clients with different progress; verify the new item is incomplete for both and retained progress is unchanged, new-client initialization is all incomplete, and a failed master save leaves both client checklists unchanged (FR-031b/031c, US6-AS5, SC-012).
- [x] T049 [US6] Implement client/template/checklist/questionnaire Zod schemas and allowed placeholder expansion in `packages/shared/src/schemas/client.ts`, `packages/shared/src/schemas/template.ts`, `packages/shared/src/schemas/checklist.ts`, `packages/shared/src/schemas/questionnaire.ts`, and `packages/shared/src/templates.ts`; define missing optional-value behavior and reject unknown placeholders. Keep questionnaireLink unresolved in previews and reject literal application questionnaire URLs in template/message subject/body with field errors guiding the owner to the placeholder.
- [x] T050 [P] [US6] Implement protected client search/list/create/update/delete/detail with activity aggregation and cascade removal in `apps/api/src/routes/admin/clients.ts` and `apps/api/src/services/clients.ts`; create from manually entered inquiry details without importing or retaining inquiry payloads. Client detail returns each invitation's immutable `questionsSnapshot` and nullable `answers`; email history exposes only token-redacted subject/body and required nullable questionnaireInviteId for a same-client invitation. Implement durable ID/time-only deletion receipts outside the database restore set in `apps/api/src/services/clientDeletion.ts`; confirm deletion only after the transactional cascade and receipt are durable, with idempotent recovery for interrupted attempts (FR-031/031c/031d, QR-002).
- [x] T051 [P] [US6] Implement protected template CRUD/reordering and master/per-client checklist operations in `apps/api/src/routes/admin/templates.ts`, `apps/api/src/routes/admin/checklist.ts`, and `apps/api/src/services/checklist.ts`; apply master changes atomically across all retained clients, inserting incomplete state for each added item, preserving retained item IDs and per-client completion states through rename/reorder and repeated saves, and removing state for deleted items. Initialize new clients with every current master item incomplete, roll back the entire master/state change on failure, and audit changes (FR-031a/031b).
- [x] T052 [P] [US6] Implement question master editing, hashed 256-bit invites with no raw-token persistence, including email history, immutable question snapshots, public GET/POST, server-side answer validation, atomic single-use claim/response write, expiry and rate limiting in `apps/api/src/routes/admin/questionnaire.ts`, `apps/api/src/routes/questionnaire.ts`, and `apps/api/src/services/questionnaire.ts`. Owner responses serialize stored `questions_snapshot` as `questionsSnapshot` with original IDs/prompts/types/options/required flags/order and nullable answers; public responses expose only the intended client's minimum data, never other clients or admin history (FR-031c).
- [x] T053 [US6] Implement client template sending and questionnaire invitations in `apps/api/src/routes/admin/clientMessages.ts` and `apps/api/src/services/clientMessages.ts`; use configured From/Reply-To, server-resolve questionnaireLink through the shared template/dedicated-send path, creating one fresh same-client invitation per explicit send and reusing it across placeholder occurrences. Build transient delivered MIME separately from history; replace all questionnaire links in retained subject/body with [questionnaire link omitted], persist nullable questionnaire_invite_id (ordinary email null), and return questionnaireInviteId. Never copy token-bearing MIME into D1/API history/logs; reject pasted application questionnaire URLs before sending. Record accepted sends/history, invalidate invitations only on definite non-delivery, and retain possibly delivered invitations. Return typed 502 email_not_sent, 504 email_outcome_unknown, or 500 email_history_failed with contract retryable flags. Signal unrecorded known acceptance and require manual mailbox/history reconciliation; never resend merely to repair a history write (FR-031a/031c/032).
- [x] T054 [P] [US6] Build client list/create/edit/delete, message preview/edit/send, per-client checklist, activity history, questionnaire status/responses in `apps/web/app/routes/admin/clients.tsx` and `apps/web/app/routes/admin/clients.$id.tsx`; preserve manual entry and active message drafts, distinguish definite rejection/uncertainty/known acceptance with failed history, suppress immediate resend after uncertainty or history failure, show questionnaire placeholders in preview and omission markers in sent history, navigate by questionnaireInviteId to authenticated same-client invitation details without reconstructing a public link, and render saved answers using only that invitation's `questionsSnapshot` IDs/prompts/types/options/order, never the mutable question master (FR-031/031a–d).
- [x] T055 [P] [US6] Build ordered template, checklist, and questionnaire master editors in `apps/web/app/routes/admin/templates.tsx`, `apps/web/app/routes/admin/checklist.tsx`, and `apps/web/app/routes/admin/questionnaire.tsx`; support short/long text and single-choice questions and safe invalid-save feedback.
- [x] T056 [P] [US6] Build accessible public questionnaire with answer validation, pending/submitted/expired/not-found states and single-submit feedback in `apps/web/app/routes/public/q.$token.tsx`; prevent token leakage via referrers/logging and never show other client data (FR-031c/033/034).
- [ ] T057 [US6] Integrate workflow route modules in `apps/api/src/index.ts` and `apps/web/app/routes.ts`, expose all owner sections in `apps/web/app/routes/admin/dashboard.tsx`, run US6 suites and quickstart steps 24–27, and record mailbox receipt, isolation, snapshot behavior, and the three-minute owner workflow timing in `specs/001-radiant-images-website/acceptance.md` (SC-012).

## Phase 9: Polish and Cross-Cutting Release Checks

**Goal**: Validate full-product accessibility, security, operations, performance, and release readiness.

- [ ] T058 First write/run failing backup/restore, retention/cleanup, and health-signal tests in `apps/api/tests/operations.test.ts`. Restore a pre-deletion backup and prove deleted clients and dependent data stay inaccessible after replaying T050's independent deletion ledger; unavailable/incomplete receipts must block reopening. Implement daily private D1 backups excluding transient auth/dedupe state, day-28 recovery-copy restore expiry and verified deletion attempts, a day-30 removal target, and day-31 receipt cleanup only after overdue recovery copies are verified removed. Retry delayed deletion, independently monitor missed cleanup/stale backups/target misses, notify the configured owner channel with sanitized alerts, disclose provider delays, and refuse expired or unsafe restores. Preserve required receipts while recovery cleanup is unverified. Implement offline restore/reconciliation, Gmail health and inquiry/auth/image failure signals, and expired session/state/code/dedupe/rate-window cleanup in `apps/api/src/scheduled.ts` and `apps/api/src/services/backup.ts`. Inspect backup/restore email-history records for omission markers and preserved invitation associations, proving no raw questionnaire tokens are retained. Wire handlers in `apps/api/src/index.ts`, implement portfolio original/variant recovery, and document restore/rollback rehearsal, actual deletion/alert evidence and sanitized monitoring in `specs/001-radiant-images-website/quickstart.md`. Pixieset client-delivery collections remain a separate lifecycle boundary (QR-002).
- [x] T059 [P] Complete T006's CI gates in `.github/workflows/ci.yml`: formatting/lint, types, production builds, unit/component/integration/contract/E2E, dependency vulnerabilities, and secret checks. Verify the PR/nightly/release browser matrix, focused/flaky-test rejection, sanitized seven-day artifacts, live-secret exclusion, and success/error/auth coverage for every implemented contract operation. Reject OpenAPI operations missing applicable 400/401/403/404/413/429/500/502/504 declarations; validate observed statuses and bodies against their operation, including unauthenticated, expired-session and removed/non-owner allow-list cases for every protected operation. Verify the three email error schemas enforce their code/retryable combinations. The actual browser/version release matrix remains T063, separate from these pinned-engine CI jobs. Quarantines require owner/issue/expiry/alternative evidence and cannot silently omit critical journeys.
- [ ] T060 [P] Prepare separate API migration/deploy and web Workers Static Assets deployment workflows in `.github/workflows/deploy-api.yml` and `.github/workflows/deploy-web.yml`, plus frontend asset/fallback routing in `apps/web/wrangler.toml` and `apps/web/worker.ts`. First add failing built-deployment cases in `e2e/deployment.spec.ts`; then verify prerendered public HTML, root basename `/`, direct loads/refreshes of admin, callback and questionnaire URLs using React Router's generated `__spa-fallback.html`, missing-asset 404s, HTTPS and rollback. Use pinned Wrangler for web deployment; preserve separate configured frontend/API origins and exact-origin CORS. No deployment is performed during task generation.
- [ ] T061 Add/run public/admin/questionnaire WCAG 2.2 AA axe checks, keyboard and representative screen-reader review in `e2e/accessibility.spec.ts`; manually review meaningful portfolio alt text and legitimate decorative non-gallery exceptions. Verify crawlable content, canonical/metadata/sitemap and private noindex in `e2e/seo.spec.ts`. Version the Mobile Acceptance Profile fixture manifest/assets in `e2e/fixtures/performance/`; measure five independent cold-cache runs per public route (including the valid questionnaire fixture with token-redacted results), assert the visible/interactive `public-usable` milestone and ≤3-second median, and retain all results in `e2e/performance.spec.ts`. Also verify 320/768/1280px layouts, JS/image budgets, lab LCP/CLS and interaction latency. Implement plan.md's API/inquiry latency profile: enumerate all JSON GETs, ten warm-ups plus 100 samples at concurrency five per operation, strict nearest-rank p95 <500 ms, and 20 independent mobile-profile inquiries each strictly <5 seconds. Retain all samples and fail on unexpected statuses/slow samples; use the specified cache, provider-delay, cold-token and rate-limit fixtures. Record runner/browser/fixture versions, CAPTCHA substitution, separate deployed samples and field-data limitations in `specs/001-radiant-images-website/acceptance.md`. Reproduce defects before fixing them (SC-004/009, QR-003/004/005).
- [x] T062 Add/run cross-route authorization, injection, session expiry, rate-limit, backup privacy, token-redaction (including auth exchange, questionnaire subject/body, owner-history responses and backups), and PII-log checks in `apps/api/tests/security.test.ts` and `e2e/security.spec.ts`; configure CSP/security headers for Workers Static Assets in `apps/web/public/_headers`, equivalent headers on fallback responses in `apps/web/worker.ts`, and API security headers in `apps/api/src/index.ts`, permitting only required Turnstile/API/PDF sources; verify noindex/no-referrer on private/tokenized routes and do not rely on `_headers` for Worker-generated responses (FR-025/032–035, SC-003).
- [ ] T063 Run all quickstart suites and manual acceptance, rehearse restore/rollback, verify real-email receipt and all 60-second freshness budgets, and record browser versions, red/green evidence, manual accessibility/print/PDF review, and participant/owner timings using plan.md's human acceptance protocol in `specs/001-radiant-images-website/acceptance.md`. Freeze and execute every N/N-1 browser/OS cell in plan.md's release matrix using actual desktop browsers and physical mobile devices or a real-device service; record exact versions and per-journey evidence. Missing/failed cells are BLOCKED, not satisfied by emulation. Record the predeclared SC-002 denominator and every started SC-008 participant, device split, first-Submit result, assistance and ceil(0.9 × started) threshold. Obtain final logo/photos/copy/pricing/privacy/deposit terms and photo usage/guardian permission; confirm owner approval and actual monitoring of publicContactEmail, exercise the uncertain-delivery recovery instructions, reject local/test placeholder addresses, and replace launch placeholder addresses via `specs/001-radiant-images-website/quickstart.md` before release (SC-001/008/010/012, QR-001–005).

## Owner-requested dependency follow-up (2026-11-16)

- [x] T064 Connect a Cloudflare API token limited to Account > Billing > Read for the Radiant Images account, using the token-authenticated Cloudflare API MCP connection or an approved secure read-only API session. Follow `quickstart.md`'s Billing Read procedure; do not put the token in chat, source, CI artifacts or evidence. Verify successful live subscription and explicit billing-period usage reads, separately inspect available spend controls, and record only sanitized plan, usage, allowance and alert/control evidence in `research.md` and `acceptance.md`. Treat unsupported metrics or still-denied controls as explicit gaps. Reassess T001 after verification; do not infer a billing cap, paid-plan approval or production acceptance. Completed 2026-11-16 through the approved secure read-only API fallback; research R-27 and `evidence/cloudflare-billing-read-20261116.json` record successful reads and explicit remaining gaps.

## Deferred Google production setup (owner-requested 2026-11-16)

- [ ] T065 Prepare owner-approved application homepage and privacy-policy content for Google's Branding requirements. Use an owned domain and accurately describe Radiant Images, the Gmail scopes/data use, retention/deletion, and contact details; implement the approved pages in `apps/web/app/routes/` and record their real URLs and domain-verification evidence in `specs/001-radiant-images-website/quickstart.md`. Coordinate with T023/T063; placeholder URLs or unapproved privacy copy do not satisfy this task. Keep the acceptance API private; any public page publication requires its own authorized scope.
- [ ] T066 After T065, complete Google Auth Platform Branding with the valid application name, support email, real homepage/privacy URLs and required domain ownership. Move the external OAuth app to Production and complete any applicable Google verification requirements, recording the actual console status and any remaining limits in `specs/001-radiant-images-website/acceptance.md`. Production publishing and Google verification are separate checks; neither authorizes public application launch.
- [ ] T067 After T066, obtain fresh owner consent for `gmail.send` and `gmail.settings.basic`, replace the temporary Testing grant through ignored local files and server-side Worker secrets, and verify the intended sender plus a real scheduled Gmail-health run. Record sanitized results and credential-lifecycle handling in `specs/001-radiant-images-website/acceptance.md` and `quickstart.md`; remove transient local token files. Testing grants expire after seven days and must not be recorded as long-lived production acceptance. This is a dependency of the remaining T001/T058/T063 operational and release checks.

## Dependencies and Execution Order

```text
Billing Read follow-up (T064) -> T001 account evidence
Google homepage/privacy (T065) -> Branding/Production (T066) -> fresh consent and scheduled health (T067)
Setup (T001–T006)
  -> Foundation (T007–T015)
     -> US1 (T016–T025) -> lead-capture MVP
        -> US2 (T026–T031)
        -> US3 (T032–T036)
        -> US4 (T037–T042)
        -> US5 (T043–T046)
     -> US6 backend work (T047–T053), then UI/integration (T054–T057)
All six completed stories -> release checks (T058–T063)
```

- Default delivery order is US1 → US2 → US3 → US4 → US5 → US6. Later stories do not block the lead-capture MVP.
- US2–US5 need US1's public routes/contact/gallery for full acceptance. Their backend work can start after Foundation with seeded data; final integration waits for US1. US6 uses Foundation auth/email and seeded settings; it does not require US5's editor.
- Within Setup, T003/T004/T005 run together after T002; T006 follows them. Within Foundation, T008/T009 run together after T007; subsequent tasks run in order.
- Each foundation/story behavior requires a meaningful failing test before implementation,
  including schemas and utilities. A minimal runnable harness may precede red; production
  behavior must not. T033 depends on T032's relevant red cases; T038 depends on T037's.
  Independent tests can be authored concurrently, but their implementations wait for red.
- Every route task includes mounting its router in `apps/api/src/index.ts` or registering its page in `apps/web/app/routes.ts` as needed. These shared-file edits must be serialized even when endpoint/component bodies are built in parallel. T057 checks the final assembled route inventory.
- `specs/001-radiant-images-website/acceptance.md` is a shared evidence log: serialize updates. Never mark a real-provider or human acceptance check complete based only on mocks.
- T064 supplies the remaining account billing evidence for T001. Completing T064 does not by itself close T001 or T058; persistent deployment, monitoring and release acceptance still require their own evidence.
- T065–T067 are explicitly deferred while private testing proceeds with temporary consent. They gate long-lived Gmail acceptance, not the currently authorized private tests; T063 still owns final photos and broader content/release approval.
- T001 is a feasibility gate: unresolved provider constraints block dependent production work, but do not justify silently replacing the agreed hosting model. Record required spec/plan/contract adjustments before implementing affected behavior.

## Parallel Execution Examples

| Story | Safe concurrent tasks                                                                                                                        | Join point                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| US1   | T016 inquiry cases + T017 browser cases; later T020 navigation + T021 gallery                                                                | T018 follows test-writing wave; T022 follows both components |
| US2   | After T027: T028 admin editor + T029 public pricing/print                                                                                    | T030 PDF integration                                         |
| US3   | Independent cases within T032                                                                                                                | T032 red, then T033 test/conversion, then T034 upload        |
| US4   | After T037 red and T038/T039: T040 editor + T041 banner                                                                                      | T042 acceptance                                              |
| US5   | T043 API cases and browser cases can be authored concurrently in its two separate files                                                      | T044 implementation; subsequent tasks sequential             |
| US6   | T047 workflow cases + T048 questionnaire cases; after T049: T050 clients + T051 masters + T052 questionnaire; after T053: T054/T055/T056 UIs | Serialize shared route registrations, then T057              |

T059 and T060 can run concurrently after T058; their first successful execution requires the implemented suites/build. Parallel markers do not authorize concurrent migrations or shared route-file edits.

## Implementation Strategy

1. Complete Setup and Foundation, then US1. Validate discovery, CAPTCHA, actual email receipt, outage behavior, authorization, and mobile navigation as the first useful increment.
2. Add US2 pricing, US3 gallery management, US4 banners, US5 settings, then US6 client workflows. Validate each independently using seeds for unrelated features.
3. Before exposing any increment publicly, perform applicable deployment, security, accessibility, backup, content-approval, and acceptance checks from Phase 9; the smaller MVP does not waive release checks.
4. Run `/speckit-analyze` against these tasks before implementation. Constitution v1.0.0
   applies; resolve T001 and affected OPEN gates before dependent implementation/release.

## Requirement Coverage Index

| Requirement                  | Primary tasks                                             |
| ---------------------------- | --------------------------------------------------------- |
| FR-001/002                   | T017, T020                                                |
| FR-003/004                   | T007, T022, T024                                          |
| FR-005                       | T014, T021, T032–T036                                     |
| FR-006/007                   | T015, T020, T022, T029                                    |
| FR-008–011                   | T026–T031                                                 |
| FR-012–014                   | T037–T042                                                 |
| FR-015–017                   | T016–T019, T023                                           |
| FR-018–023                   | T013, T016, T019, T023, T025                              |
| FR-024–026                   | T010–T012, T062                                           |
| FR-027                       | T032–T036                                                 |
| FR-028/029                   | T007, T043–T046                                           |
| FR-030                       | T007, T024, T027, T034, T039, T044, T050–T053             |
| FR-031/031a–d                | T047–T057                                                 |
| FR-032                       | T009, T019, all admin mutation tasks, T058, T062          |
| FR-033                       | T015, T017, T020–T023, T056, T061                         |
| FR-034/035                   | T005, T009–T013, T019, T052, T060, T062                   |
| SC-001                       | T025 (US1 subset), T031 (pricing), T063 (full acceptance) |
| SC-002/008                   | T025, T046, T063                                          |
| SC-003                       | T010, T016, T032, T062                                    |
| SC-004/009                   | T017, T021, T036, T061                                    |
| SC-005                       | T014/T015, T036, T046, T063                               |
| SC-006/011                   | T026–T031                                                 |
| SC-007/010                   | T037–T042, T063                                           |
| SC-012                       | T048, T057, T063                                          |
| QR-001                       | T001, T032–T036, T063                                     |
| QR-002                       | T001/T064, T007, T047/T050, T052, T058, T062/T063              |
| QR-003/004                   | T003, T021, T061                                          |
| QR-005 / Constitution III–IV | T006, all behavior tasks, T025–T057, T058–T063            |

## Analysis Remediation Traceability (2026-11-13)

The first review's seven analysis findings are resolved in the design; implementation/evidence remains
unchecked. These task obligations prevent a documentation fix from being mistaken for a
runtime pass.

| Finding | Design decision                                                            | Implementation / verification tasks               |
| ------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| C1      | Typed email outcomes, bounded calls, manual recovery without blind resend  | T013, T016/T017, T019, T023, T047/T048, T053/T054 |
| I1      | Predeclared healthy-provider delivery denominator; negative cases separate | T025, T046, T063                                  |
| I2      | Explicit per-operation error responses and strict contract validation      | T006, T010, T059, T062                            |
| A1      | Reproducible JSON-read and inquiry latency gates                           | T061                                              |
| U1      | Atomic singleton pricing pointer; concurrent equal-time publication tests  | T007, T026/T027                                   |
| A2      | Predeclared first-time usability cohort and scoring protocol               | T025, T063                                        |
| G1      | Actual N/N-1 browser/OS release matrix with blocked-cell tracking          | T063                                              |

### Follow-up review: session handoff, questionnaire history, visitor recovery

These three follow-up findings are resolved in the design only. Task IDs and their unchecked
implementation status are preserved; the identifiers below belong to this follow-up review.

| Finding | Design decision                                                                                                                | Implementation / verification tasks     |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| U1      | Callback stores a hashed identity grant; atomic redemption creates/returns a fresh bearer once; lost response restarts sign-in | T007, T010–T012, T062                   |
| I1      | Separate transient email from token-redacted history; keep same-client invitation ID and reject pasted questionnaire URLs      | T007, T048–T050, T052–T054, T058, T062  |
| U2      | Explicitly public contact email plus owner-checked acknowledgement/restart with fresh CAPTCHA and unchanged server guards      | T007, T014, T017, T023, T043–T046, T063 |
