# Quickstart: Validating Radiant Images End-to-End

This guide proves the feature works against the [spec](./spec.md) acceptance scenarios. It is a run/validation guide — implementation detail lives in `tasks.md` and the code.

**Status (2026-11-14)**: Local application, migration, synthetic provider adapters and automated
suites are implemented under the approved T001 exception. See acceptance.md for actual
commands/results and remaining gates. Production decoder/operational-retention proof, owner content,
real email, human/device acceptance and deployment remain open. Gmail consent needs both
`gmail.send` and `gmail.settings.basic` for sending and verified sender lookup.

**Owner decisions (2026-11-14)**: Use the operational retention procedure below; the
unconditional physical-deletion deadline is superseded. Use the existing paid Pixieset
Client Gallery account for client photo delivery and keep portfolio images on this website.
Portfolio uploads still require production image validation. Upload/share delivered client
collections through Pixieset's own controls; no automatic synchronization or cross-provider
deletion is implemented. Verify each private collection's intended audience in Pixieset.

## Prerequisites

- Use the supported Node and pnpm versions pinned by T002; install from the committed
  lockfile. Do not use an unpinned `latest` toolchain in CI.
- Routine local/CI testing uses isolated D1/R2 and controlled Google/Gmail/Turnstile
  adapters, synthetic identities, and approved non-sensitive images. No live accounts,
  production credentials, or real customer data are required for these tests.
- Provider-connected acceptance/deployment additionally requires the Cloudflare resources
  verified by T001, Google OAuth configuration and Gmail consent from research R-07,
  and appropriate Turnstile keys. Live-provider checks use designated test recipients.

## Repeatable automated-test setup

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps
pnpm test:setup   # Apply local E2E migrations; browser fixtures reset/seed each test
```

The harness makes setup/cleanup repeatable, rejects nonlocal targets, resets synthetic data
per test, and keeps test-provider/seeding endpoints outside the production entry point. Controlled
time covers banners, expiry, and date boundaries. Test fixtures MUST preserve the real
React-to-Worker-to-D1/R2 path rather than intercepting the application's own API.

## Run locally

Use Node 24.14.0 and pnpm 12.18.0. The isolated browser suite starts its own built frontend
at 127.0.0.1:4173 and synthetic API at 127.0.0.1:8787; it needs no live secrets:

```bash
pnpm build
pnpm e2e:smoke
```

For interactive development, copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and
`apps/web/.env.example` to `apps/web/.env`, then from the repository root:

```bash
pnpm --filter @radiant/api db:migrate:local
pnpm --filter @radiant/api db:seed:local
pnpm dev
```

The frontend uses 127.0.0.1:5173 and the API 127.0.0.1:8787. Ordinary development does not
install the E2E provider endpoints; placeholder credentials cannot sign in or send mail.
The local-only decoder belongs to the isolated E2E server. Production gallery publication
fails closed until an approved authoritative provider is configured.

## Separate provider-connected setup

T001 and separately scoped authorization must be resolved first. Provision the approved D1,
media and recovery buckets using the pinned `pnpm exec wrangler`, record the returned IDs,
and configure the release inventory described below. Creation commands do not automatically
update Wrangler configuration. Do not replace the checked-in local resource IDs with live
ones. Use `pnpm gmail:consent` only during the separately authorized consent procedure;
its runtime secrets remain outside browser builds and source control.

## Automated validation

```bash
pnpm lint && pnpm typecheck && pnpm build
pnpm test                 # vitest: shared schemas, web components, api integration (miniflare), contract tests vs contracts/openapi.yaml
pnpm e2e                  # complete configured Playwright matrix against the isolated local stack
pnpm exec playwright test --project=chromium-desktop --project=chromium-mobile --grep @smoke
```

Use the smoke command on every PR and the complete Chromium/Firefox/WebKit matrix nightly
and before release. Include 320/768/1280 px layouts, mobile emulation, and WCAG 2.2 AA scans
of public/admin/questionnaire routes. Record the tested engine versions; emulation is not
evidence of real-device or previous-version browser support.

On the current Windows workstation, the owner manually extracted Playwright's pinned
Firefox 159.0 / build 1572 into
`C:/Users/My PC/Downloads/playwright-firefox-1572-win64/firefox`. The executable hash
matches the official archive and a headless launch succeeded. The ignored, machine-local
`.wrangler/firefox-local.config.ts` selects this executable for the existing Firefox project:

```bash
pnpm exec playwright test --config=.wrangler/firefox-local.config.ts
```

Run that command from the repository root after building. It starts the same local stack
and runs all Firefox functional cases; the separate Chromium-only performance profile
is excluded. This local config is not committed and is not required by CI's normal pinned
browser installation. Mozilla's standard Firefox installation is separate from this patched
Playwright browser. Results and the preserved initial failure are recorded in acceptance.md.

For the unresolved WebKit client-email input loss, the focused probes compare consecutive
`fill` calls with character-by-character `pressSequentially` entry. Each creates three
synthetic clients and checks all entered values after save/reload. Run these alongside the
original complete owner workflow with a predeclared ten repetitions and no retries:

```powershell
node node_modules/@playwright/test/cli.js test e2e/clients.spec.ts --project=webkit-desktop --project=webkit-mobile --grep '@client-entry|complete owner workflow' --repeat-each=10 --retries=0
```

This selects 60 cases (three scenarios × two projects × ten repetitions). Keep every outcome;
do not repeat until green or treat a typing-only pass as fixing `fill` input loss. The default
helper still uses consecutive `fill` calls without inter-field waits. Existing synthetic
provider isolation, one-worker execution, fail-on-flaky policy, sanitized reporting, and
disabled screenshots/traces for tokenized workflows remain in force. Run the artifact privacy
gate afterward. These tests make no live email sends.

The initial 2026-11-14 restricted session could list the selection and run component probes, but
could not start the local bundler or access the existing browser cache. A workspace-local
WebKit download was also blocked by network policy. These are setup blockers, not failed
browser assertions or evidence that the cached browser is missing. A later session on the
same date could read the ancestor directory, build the application, launch the existing
WebKit 27.2/build 2388, and start both local servers without reinstalling WebKit or changing
security settings. If these access errors recur, use a session with authorized access to
the project/toolchain and pinned browser cache; reinstalling WebKit alone does not address
the separate ancestor-directory bundling failure.

Actual execution then exposed a probe defect: on the client detail page, `getByLabel('Client
email', { exact: true })` matches both the email input and the email-composer region. The
post-save/reload assertions now use `getByRole('textbox', { name: 'Client email', exact: true })`.
The creation helper and original owner workflow retain their consecutive fills and timing.
See acceptance.md for the preserved failures and follow-up results. The corrected 60-case
run passed 59 cases and reproduced input loss in the first-name field on WebKit mobile before
submission. A single ten-case diagnostic with passive native event recording passed without
capturing a cause; it does not erase the failure. The historical email loss and newly observed
first-name loss have no established common cause. Identify whether an input event is missing,
the form remounts, or state overwrites a received value before selecting a product fix; then
verify the complete functional engine matrix. Do not substitute typing, sleeps or retries to
turn the failing `fill` scenario into a claimed pass.

Client browser cases now install `e2e/client-input-diagnostics.ts` before navigation.
On failure they attach a bounded `client-input-events` JSON record with native event types,
focus state, field lengths and DOM node identities. It records no entered values, URLs,
tokens or message content. Input/blur events and post-input microtasks can distinguish a
missing event from a received value being cleared or a control being replaced. There are
no additional waits between field fills. A closed page produces an empty attachment, so
an empty log alone cannot establish that no events occurred. The listener is test-only;
it is not application telemetry or a product fix, and its timing overhead can affect an
intermittent reproduction. Keep the earlier failures when interpreting later passes.

T063 additionally executes every browser/OS N/N-1 cell in plan.md's release matrix. Freeze
exact stable versions at release, use actual desktop browsers and physical mobile devices
or a real-device service, and record versions/date plus each required journey's result.
Unavailable or failing combinations remain BLOCKED; do not substitute Playwright emulation
or claim full support/release without resolving the gate or an explicit governance exception.

Tests MUST use role/label locators and retrying assertions, fresh contexts, deterministic
seed/cleanup, and controlled time; fixed sleeps and shared mutable fixtures are prohibited.
CI rejects focused tests and flaky results even after a diagnostic retry (maximum one).
Traces are disabled because they retain HTTP tokens. Synthetic failure screenshots are
disabled on tokenized journeys; sanitized text/HTML artifacts require the privacy gate and
have seven-day retention. Any quarantine must
record an owner, issue, expiry, and alternative evidence; critical checks cannot disappear.

For each behavioral change, record the focused red command/failure, green command/result,
and refactor regression result in `acceptance.md`. Maintain scenario/FR/QR coverage rather
than inferring completeness from a green summary or coverage percentage. Automated suites
do not prove mailbox delivery, human usability, full accessibility, or production readiness.

## Manual quality evidence

- Perform keyboard and representative screen-reader walkthroughs for inquiry, owner edits,
  and questionnaires; confirm focus, error announcements, contrast, text resizing, and
  reduced motion. Automated scans supplement these checks.
- Inspect print/PDF pricing for pagination/clipping and exact revision/content parity.
- Use plan.md's Mobile Acceptance Profile, fixed 60-photo fixture manifest and image/script
  budgets. Record all five cold-cache measurements per public route (including the valid
  questionnaire fixture, with its token redacted), their individual
  medians, and evidence that the SC-004 `public-usable` conditions were actually visible
  and operable. Record runner/browser/fixture versions and the 200 ms CAPTCHA-adapter
  substitution; collect a separate deployed sample with live providers. Distinguish lab
  interaction timing from field INP and assess field p75 only when sufficient data exists.
- Execute plan.md's separate API/inquiry latency profile in T061: per JSON GET, ten untimed
  warm-ups and 100 measured requests at concurrency five, bypassing HTTP/edge caches;
  assert nearest-rank p95 <500 ms. Run 20 independent mobile-profile inquiry submissions,
  each <5 seconds from Submit to visible provider-accepted confirmation. Use the specified
  200 ms provider doubles, cold Gmail token and isolated rate-limit state; retain every
  result. Record errors/slow samples as failures and deployed live-provider samples separately.
- Verify public crawlable content/metadata/canonical URLs/sitemap and private-route noindex.
- Verify owner-confirmed photo usage/guardian permission, EXIF/GPS-free public derivatives,
  private originals/backups, and QR-002's live deletion/operational recovery policy with
  T001-verified provider support. Portfolio alt text must be descriptive and nonblank;
  inspect meaning manually, since a schema or automated scan cannot establish it.
- Rehearse restore/rollback using the deletion-reconciliation checks below and confirm
  sanitized inquiry/auth/image failure signals.

### Client deletion and restore rehearsal (QR-002)

1. In isolated test storage, create a synthetic client with checklist state, email history,
   and submitted questionnaire answers; take a backup, then delete that client.
2. Verify the transactional live cascade, inaccessible old questionnaire link, and private
   ID/time-only receipt under `client-deletions/`. Simulate interrupted receipt/cascade work;
   deletion must not falsely report completion, and an idempotent retry must reconcile it.
3. Restore the pre-deletion backup offline, retaining the independent current ledger.
   Reapply deletion receipts and verify the client and every dependent record are absent
   before enabling reads or email sends. Prove missing/incomplete ledger evidence blocks
   reopening. Never overwrite the ledger with the historical backup.
4. With controlled time, verify application recovery copies become unrestorable and verified
   deletion starts at day 28 after creation; normal removal targets day 30. At day 31 after
   client deletion, remove receipts only after overdue recovery removal is verified. Inject
   storage failure across both targets: preserve required receipts, reject expired/unsafe
   restores, retry cleanup after recovery and record the actual verified removal time.
5. Verify independent monitoring detects missed cleanup, stale backups and delayed deletion,
   and the configured owner alert channel receives a sanitized alert. Record detection and
   recovery evidence; a private health file alone does not prove notification. Physical
   deletion can be delayed during provider outages and that limitation must be disclosed.
   A reconciled database's next backup must not reintroduce deleted data or restart its clock.
   Record provider-managed recovery windows separately. External mailboxes and Pixieset
   collections are separate deletion boundaries; application deletion does not remove them.

## Separate live-provider acceptance

Run the following provider-dependent steps only with designated test accounts/mailboxes;
do not send test inquiries or client email to real customers. Record provider acceptance
and actual receipt separately, including timing. A provider double cannot satisfy SC-002.

Before starting, declare at least 10 distinct healthy-path inquiries and their designated
recipient(s). Count every submission in that run, including unexpected failures; record
submitted/accepted/received totals and individual Submit-to-mailbox times. All must be
accepted and received within five minutes. Predeclared validation, duplicate, injected
provider-failure and uncertainty cases are separate negative tests, never expected deliveries.
T046 repeats the healthy-path check for the changed recipient; use separate runs/records so
failed deliveries cannot be hidden by combining different configurations.
Pace these live submissions within T001's verified rate limits; the five-minute delivery
clock applies to each Submit, not to the duration of the complete acceptance run.

## Human acceptance (SC-001/008/010/012)

Preregister at least 10 first-time participants, with at least five mobile and five desktop,
before sessions. Follow plan.md's identical goal/synthetic-data script with healthy controlled
providers. Include everyone who starts; record device group, first Submit outcome, assistance,
abandonment, and elapsed time. Built-in hints and corrections before Submit are allowed;
first-Submit rejection, abandonment, or navigation/field help is failure. Require
`ceil(0.9 × participants_started)` first-attempt successes; never replace unsuccessful people.
Record SC-001 from goal delivery on the loaded Home page to visible confirmation, and owner
workflow timings from the loaded Admin dashboard to completion without coaching/documentation.
These human and controlled-provider results cannot replace live SC-002 mailbox evidence.

## Manual acceptance walkthrough

Each step cites the spec scenario it proves.

At the US1 checkpoint, execute only the US1 portions of steps 3 and 5. T031 executes the
deferred pricing assertions after US2. T025 records partial SC-001/SC-004 evidence rather
than claiming a complete pass; T031 completes pricing navigation and T061 performs the
full SC-004 benchmark. Step 2 verifies layout only, not the three-second timing budget.

### Public site (User Stories 1, 2)

1. Open `http://localhost:5173/`. Header shows centered logo, Maternity/Newborn/Family left, About/Contact/FAQ right. — US1-AS1
2. Resize to 375 px: menu collapses to a toggle exposing all six links; gallery has no horizontal scroll. — US1-AS10, SC-004
3. **US1**: Open `/newborn` and verify intro, "How It Works" steps, and newborn-tagged gallery. **US2 / T031**: Also verify its Pricing section lists current packages; repeat on the other service pages and confirm Home-to-pricing takes fewer than three clicks. — US1-AS2, US2-AS1, SC-001
4. In the Pricing section click **Print** → print preview shows all three shoot types, no nav. Click **Download PDF** → PDF opens; footer shows revision id matching `GET /pricing`. — US2-AS2/3, SC-006
5. **US1**: Click **Book Now** on Home and each service page → `/contact`. **US2 / T031**: Repeat from each Pricing section. — US1-AS3, US2-AS5
6. Open `/faq`: entries for what to expect, what to wear, payment timing, deposits. — US1-AS4

### Inquiry (User Story 1)

7. On `/contact`, submit empty form → field errors on first/last name, email, contact method, shoot type; nothing sent. — US1-AS7
8. Choose contact method **Text**, leave phone blank, submit → phone error. — US1-AS8
9. Fill valid values, complete Turnstile, submit → "Your inquiry was sent" (not "booked"); email arrives at `inquiry_recipient` from `sender_address` with Reply-To = visitor. — US1-AS6, FR-019/020
10. Re-submit the identical form within 2 min → 409 duplicate message shown; no second email. — FR-022
11. Using controlled provider adapters, reject token refresh before dispatch → 502 `email_not_sent`, values preserved, explicit retry permitted, no success text. Separately accept the send but drop/delay its response past the deadline → 504 `email_outcome_unknown`, no immediate resend or false success, and claim retained until expiry. Drop the browser/API response too; UI must treat it as uncertain and must not re-enable resend merely when two minutes pass. Simulate primary audit failure after confirmed acceptance → 202 plus sanitized fallback audit/failure signal, without resending. — US1-AS9/11, FR-020/023

    Confirm the form displayed `publicContactEmail` before Submit and still shows the loaded
    address if the API is unavailable. Verify selectable address text and a mailto link with
    no inquiry data; opening it must not invoke the Worker send or unlock Submit. Unknown
    receipt remains blocked. If Rebekah confirms receipt, finish without another dispatch.
    Otherwise acknowledge **Rebekah checked and asked me to send again**, select **Start a
    new submission**, and verify retained fields, fresh CAPTCHA and an explicit manual
    Submit. A still-active duplicate claim must return 409, with no bypass or second email.
    Repeat after the guard expires: only the owner-checked explicit new submission is
    eligible; elapsed time alone never unlocks the uncertain form.

### Owner sign-in (FR-024–026)

12. Visit `/admin` → "Sign in with Google". Sign in with a **non**-allow-listed account → `/admin/denied`; `GET /admin/gallery` with no token → 401. — SC-003
13. Sign in with the allow-listed account → dashboard; `GET /auth/session` returns email. Sign out → token invalid. — US6-AS1

    In the isolated auth suite, stop after callback: only a hashed 60-second exchange grant
    exists, with no session yet. Redeem it and verify one session/bearer hash, a working raw
    bearer returned once, and `Cache-Control: no-store`. Concurrent redemption has one
    winner; replay/expired/invalid codes return 400 without extra sessions. Remove the owner
    before exchange → 403, grant invalidated, no session. Inject a transaction failure → no
    session and grant preserved. Lose the response after commit → the UI removes pending
    code state and offers fresh Google sign-in, never token recovery or automatic replay.
    Do not print raw codes/bearers in evidence; inspect server storage/logs for leakage.

### Gallery (User Story 3)

14. Admin → Gallery: upload a JPEG tagged **Newborn** with descriptive alt text → appears on `/` and `/newborn` within 60 s, not on `/maternity`; check the rendered alternative. Missing/blank/whitespace-only alt on upload, or blank/over-200-character alt edits, must show an actionable error and preserve the published gallery. Omitting alt from a tag-only PATCH preserves existing text. — US3-AS1/3, FR-027/033, SC-005
15. Change tag to **General** → disappears from `/newborn`, remains on `/`. Delete → gone everywhere; R2 objects removed. — US3-AS2
16. Attempt a 12 MB upload → rejected; gallery unchanged. Upload until 60 → 61st rejected with `gallery_full`. — US3-AS3, Edge Cases

### Banner (User Story 4)

17. Create banner with window spanning now → appears beneath header on every public page. Set end in the past → gone within 60 s, no empty gap. — US4-AS1/2, SC-007
18. Create two overlapping banners → only the later-starting one shows. — US4-AS3

### Settings (User Story 5)

19. Change `inquiry_recipient` to a second mailbox → next inquiry arrives there. — US5-AS1
20. Add a shoot location → new `/contact` load shows it. Remove it while a form is open, submit → `stale_option` error prompting reselect. — US5-AS2/3
21. Save an invalid sender address (not the Gmail account/alias) → 400; previous config intact. — US5-AS4

    Save a separately approved **Public contact email** → Contact and recovery instructions
    reflect it within 60 seconds. Confirm the editor clearly warns that this field is public;
    changing private recipient/sender alone leaves it unchanged. Empty/malformed public
    addresses reject the entire save. Anonymous bootstrap must expose only the approved
    public address, never private addresses by inference. — US5-AS5, FR-028/029

### Pricing editor (FR-011)

22. Admin → Pricing: change a package price, publish → `/family` Pricing section, print, and PDF all show the new price and a new revision id within 60 s. — SC-011
23. Try to publish with zero Maternity packages → 400, prior pointer unchanged. In the controlled integration suite, freeze publication time and issue two simultaneous complete publications → exactly one current pointer, last committed save wins, and each reader returns one complete revision. Force package/pointer write failure → previous published revision remains intact. — US2-AS6, data-model invariant

### Client workflow (User Story 6)

24. Admin → Clients → New client. Send a template email → arrives at the client address from `sender_address`; appears in client history. Separately use controlled adapters for definite rejection (502, explicit retry allowed), uncertain delivery (504, verify manually before another send), and known acceptance/history-write failure (500 `email_history_failed`, reconcile history without resending). Preserve active drafts and possibly delivered invitations in the latter two cases. — US6-AS2/3/9
25. Create two clients with different checklist completion states. Add a master item → it appears incomplete for both after reload, while their existing progress remains unchanged. Rename/reorder retained items → labels/order update without resetting either client's progress; remove an item → it and its state disappear. Repeat the same master save → no duplicate items or reset progress. Create another client → every current master item starts incomplete. In the controlled integration suite, force a propagation failure → the entire master/state change rolls back; the browser shows the failed-save feedback and both clients' checklists remain unchanged after reload. — US6-AS4/5, FR-031b
26. Send questionnaire → client receives `/q/{token}` link; open it (incognito) → only that client's first name + questions visible; submit → answers visible in Admin. Re-open link → "closed". — US6-AS6/8, SC-012

    Repeat with a template containing multiple `{{questionnaireLink}}` occurrences in
    subject/body. One same-client invitation is created per explicit send; the delivered
    email contains its usable link. Preview contains no raw token. D1 email history, owner
    API responses, admin history, backup/restore copies and sanitized test artifacts contain
    `[questionnaire link omitted]` and the associated `questionnaireInviteId`, never the raw
    token. Ordinary email returns `questionnaireInviteId: null`. Owner history opens only
    authenticated invitation detail. Reject cross-client associations and pasted application
    questionnaire URLs in template/message input before persistence/send. Check both the
    template and dedicated invitation endpoints, including uncertain/history-write-failed
    outcomes that preserve the invitation without leaking its token. — US6-AS10, FR-031a/c

27. After collecting answers, edit/reorder master prompts and single-choice options and delete a master question. Reload the client's history: the owner API supplies `questionsSnapshot` plus `answers`, and the UI retains the original prompts, answer types, choices and order. Send a new invitation and verify it uses the updated master; public links must not expose owner history. — US6-AS7, FR-031c

### Observability (FR-032)

28. `pnpm exec wrangler d1 execute DB --local --config apps/api/wrangler.toml --command "select action,outcome from audit_events order by at desc limit 20"` → shows the actions from steps 9–26 with **no** visitor message bodies or emails.

### Public recovery address launch check

Before any public release, Rebekah must approve a monitored business address for
`publicContactEmail`, verify that she can receive and answer a delivery-check email there,
and review the visitor recovery wording. It may match her business Gmail sender/recipient
only by explicit choice. Replace `hello@example.invalid` and all other local/test address
fixtures; a placeholder or unmonitored mailbox blocks release. Record approval and successful
manual contact verification in `acceptance.md` without storing email contents. For a US1
release before the US5 editor exists, the deployer sets the approved value in site config.

## Deploy

The frontend and API are separate Workers deployments. Configure `WEB_ORIGIN` on the API
to the exact frontend HTTPS origin; set the browser's public API origin to the API Worker.
Use the frontend origin for canonical URLs, sitemap entries, sign-in return links and
questionnaire emails, with basename `/`. Register the API `/auth/google/callback` URI with
Google and the frontend hostname with Turnstile. Cloudflare account/deployment access is
configured locally or through environment-scoped CI secrets; R2 keys do not go in the web
build. GitHub Actions remains CI; both deployment workflows use pinned Wrangler.

Before deployment, T060 serves the production web build through local Wrangler to verify
prerendered public routes and the generated SPA fallback for admin/callback/questionnaire
direct loads and refreshes. Check missing assets return 404 and both static/fallback
responses carry the intended security headers. A Vite dev-server pass alone is insufficient.

Deployment is manual, with separate API/web workflows, exact acceptance-commit checking,
required environment review, and the release guard below. Pushes to main run CI only.
There is no ungated package deploy command. Runtime secrets are provisioned only after
separate release authorization; use the checked-in examples to identify required names.

Post-deploy smoke: check public navigation and approved test-account sign-in. Any email
or gallery mutation requires a designated test mailbox/image and cleanup; do not blindly
repeat data-changing walkthroughs against production. Deployment workflows MUST depend on
passing applicable CI, the complete browser matrix, and documented release evidence.

## Local recovery rehearsal (T058)

Stop development servers before operating on synthetic state. These commands use only
`e2e/wrangler.toml`, `.wrangler/e2e/v3`, and disabled remote bindings. They accept no account,
config, remote flag, or arbitrary storage path. Run `pnpm test:setup` first.

1. `pnpm operations:local backup` returns a private `backups/ID.json` key.
2. `pnpm operations:local list` lists keys/expiry without recovery payloads.
3. `pnpm operations:local restore backups/ID.json` closes API access with 503, including
   after restart. Import is atomic and checks/replays independent deletion receipts. Missing
   receipts, corrupt/expired copies, or incomplete media refuse access. Correct the cause
   and repeat restore after a failure.
4. Inspect restored synthetic data offline and run the operations integration suite. Then
   `pnpm operations:local reopen` verifies the ledger again; it cannot reopen a failed restore.
5. `pnpm operations:local cleanup` exercises transient cleanup and verified recovery expiry.

The deletion rehearsal is `pnpm exec vitest run apps/api/tests/operations.test.ts`: capture
before deletion, delete a client, restore the older copy, prove deleted data stays absent and
retained history keeps invitation associations. Import/storage faults verify closed access.

Production restore remains blocked by T001 and release authorization. Detach ingress and
pause cron before database replacement; preserve the independent R2 ledger and lifecycle
identity outside the restore set; apply migrations offline; use the same verification and
reconciliation services. A fresh database must not silently initialize a new ledger. Never
use Time Travel on an exposed database. Replay receipts and clear sessions/grants before
reopening. Refuse copies at day-28 expiry. Never copy real recovery payloads into CI.

`health/latest.json` is private: Gmail sender status and inquiry/auth/image failure counts,
without mail content or addresses. Monitor independent provider job failures and backup
freshness as well: a stale health file does not mean success. Independent monitoring and
owner alert delivery remain unverified release gates. The approved operational policy
allows disclosed provider-outage delays; record target misses and verified cleanup without
claiming an unconditional physical-expiry guarantee. The alert destination and deployed
monitoring configuration still need to be established.

## Deployment and rollback preparation (T060)

The API and frontend have separate manually dispatched workflows. Both require the Quality
workflow on the same commit, an exact acceptance commit input, and the `production` GitHub
environment. Configure that environment with required owner review before enabling releases.
`scripts/prepare-release.ts` refuses any unchecked task (including T001/T063), non-HTTPS
origins, test CAPTCHA keys, and placeholder contact addresses. The refusal was exercised
locally. No deployment was attempted.

Store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` only as environment secrets. Use the
least permissions required for the named Workers, D1 and R2 resources. Configure the variables
named in the workflow from the approved deployment inventory; never reuse local zero IDs or
synthetic buckets. Runtime Gmail/Google/Turnstile/auth secrets, including `OWNER_ALLOWLIST`
and `GOOGLE_CLIENT_ID`, must be provisioned as Worker secrets; the generated deployment
configuration omits them. They must never become VITE variables. `VITE_*` values are
deliberately public. API CORS permits the exact frontend
origin; both workers must be reached over HTTPS before live acceptance.

Before an eventual authorized release, record deployed Worker version IDs, schema version,
latest verified private backup key/expiry and independent ledger identity. API migrations
are forward-only and run before the API deployment. A code rollback may use the prior
Worker version only when its database schema remains compatible. For incompatible data
changes, detach ingress, pause cron and use the offline restore/reconciliation procedure;
never roll back the deletion ledger. Rebuild/redeploy the matching prior frontend artifact
and verify direct public/admin/callback/questionnaire navigation, CORS and HTTPS. Do not
describe the local fallback checks as a remote rollback or HTTPS rehearsal.

## Release acceptance register (T063; all live/human rows OPEN)

The local-development exception excludes live provider acceptance and recruitment. Prepare
the following record before a separately authorized run:

| Check                              | Predeclared sample or inventory                                                                                            | Current evidence                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Initial inquiry mailbox delivery   | 10 distinct eligible inquiries with healthy providers; keep every started eligible attempt                                 | No live attempts                                        |
| Changed-recipient mailbox delivery | A separate 10 distinct inquiries after saving settings                                                                     | No live attempts                                        |
| First-time usability SC-008        | 10 adults: 5 desktop, 5 mobile; unassisted; at least ceil(0.9 × started) successes; all started attempts retained          | No participants enrolled                                |
| Discovery SC-001                   | Goal-to-visible-acceptance time, under four minutes; same participant records                                              | No human timings                                        |
| Owner workflow SC-012              | Loaded dashboard through required workflow, under three minutes without coaching                                           | Synthetic automation only                               |
| Accessibility                      | Keyboard plus representative screen-reader and meaningful photo-alt review                                                 | Automated axe/keyboard evidence only                    |
| Print/PDF                          | Physical print plus owner content/readability review                                                                       | Local PDF rendering evidence only                       |
| Live browser matrix                | Exact N/N-1 versions at release freeze, every plan.md browser/OS/device cell                                               | Every actual-browser/device cell BLOCKED pending access |
| Deployed freshness/performance     | Live providers and deployed cache/clock/HTTPS observations                                                                 | Local controlled results only                           |
| Content/privacy                    | Logo, 60 approved photo assets, copy, pricing, privacy/deposit terms, usage/guardian permissions, monitored public contact | Owner approval/assets pending                           |

For each participant record started/completed/abandoned, device, first Submit result, any
assistance and elapsed time. For email record provider health, first Submit, API outcome,
mailbox receipt and latency; negative/fault runs remain separate. Unknown delivery requires
the documented manual receipt check and must never be counted as successful receipt.

## Isolated Images provider diagnostic

The synthetic provider probe uses a separate Worker configuration containing only Images;
it does not use the application or any D1/R2 binding. It contacts Cloudflare and is not part
of routine CI. Run only in the selected account for a scoped provider investigation:

```powershell
pnpm exec wrangler dev --config scripts/image-binding-probe/wrangler.toml --remote --ip 127.0.0.1 --port 8795 --inspector-port 9245 --show-interactive-dev-session=false
```

In another terminal, run `pnpm exec tsx scripts/image-binding-probe/run.ts`. Optional case
names select targeted follow-ups, for example `jpeg-truncated-scan-with-end-marker`.
The runner writes sanitized evidence under `specs/001-radiant-images-website/evidence/`;
targeted runs use the `-followup` filename. Preserve previous evidence before a new run.
Stop the development session afterward. Never deploy this diagnostic as the application.

The recorded run intentionally fails: the provider accepts damaged JPEG scans that the
strict local decoder rejects. See research R-18. A successful transformation or local
simulation alone must not close T001/T034 or enable production gallery publication.
