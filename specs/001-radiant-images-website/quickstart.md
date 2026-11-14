# Quickstart: Validating Radiant Images End-to-End

This guide proves the feature works against the [spec](./spec.md) acceptance scenarios. It is a run/validation guide — implementation detail lives in `tasks.md` and the code.

**Status (2026-11-13)**: Planned validation commands; application packages and test suites
have not been implemented. Constitution v1.0.0 requires red-green-refactor for executable
behavior and the E2E policy below. T002/T006 implement these scripts and browser projects.

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
pnpm test:setup   # T006: reset/seed disposable local data and select controlled providers
```

T006 MUST make setup/cleanup repeatable, reject production targets, assign unique per-test
data, and ensure test-provider/seeding modes cannot be enabled in production. Controlled
time covers banners, expiry, and date boundaries. Test fixtures MUST preserve the real
React-to-Worker-to-D1/R2 path rather than intercepting the application's own API.

## One-time provider-connected setup

The following setup is for separate live-provider acceptance/deployment, after T001
verifies account requirements. It is not required for routine CI.

```bash
pnpm install

# API bindings (creates D1 db + R2 bucket, writes ids into wrangler.toml)
cd apps/api
pnpm dlx wrangler d1 create radiant-images
pnpm dlx wrangler r2 bucket create radiant-images-media

# Local secrets (git-ignored)
cat > .dev.vars <<'EOF'
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...          # from: pnpm run gmail:consent
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
OWNER_ALLOWLIST=rebekah@example.com
WEB_ORIGIN=http://localhost:5173
EOF

pnpm run db:migrate:local        # drizzle-kit → wrangler d1 migrations apply --local
pnpm run db:seed:local           # FAQ topics, referral sources, sample pricing, page stubs
```

## Run locally

```bash
pnpm dev          # concurrently: wrangler dev (http://localhost:8787) + vite (http://localhost:5173)
```

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

T063 additionally executes every browser/OS N/N-1 cell in plan.md's release matrix. Freeze
exact stable versions at release, use actual desktop browsers and physical mobile devices
or a real-device service, and record versions/date plus each required journey's result.
Unavailable or failing combinations remain BLOCKED; do not substitute Playwright emulation
or claim full support/release without resolving the gate or an explicit governance exception.

Tests MUST use role/label locators and retrying assertions, fresh contexts, deterministic
seed/cleanup, and controlled time; fixed sleeps and shared mutable fixtures are prohibited.
CI rejects focused tests and flaky results even after a diagnostic retry (maximum one).
Capture sanitized traces/failure screenshots with seven-day retention. Any quarantine must
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
  private originals/backups, and QR-002's live deletion/30-day recovery-copy policy with
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
4. With controlled time, verify recovery copies expire within 30 days of creation and
   deletion receipts after 31 days. A restored/reconciled database's next backup must not
   reintroduce deleted client data or restart its retention clock. Record the provider's
   verified recovery window separately; external mailboxes are outside application deletion.

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

28. `pnpm dlx wrangler d1 execute radiant-images --local --command "select action,outcome from audit_events order by at desc limit 20"` → shows the actions from steps 9–26 with **no** visitor message bodies or emails.

### Public recovery address launch check

Before any public release, Rebekah must approve a monitored business address for
`publicContactEmail`, verify that she can receive and answer a delivery-check email there,
and review the visitor recovery wording. It may match her business Gmail sender/recipient
only by explicit choice. Replace `hello@example.invalid` and all other local/test address
fixtures; a placeholder or unmonitored mailbox blocks release. Record approval and successful
manual contact verification in `acceptance.md` without storing email contents. For a US1
release before the US5 editor exists, the deployer sets the approved value in site config.

## Deploy

```bash
# Secrets (once per environment)
cd apps/api && for s in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GMAIL_REFRESH_TOKEN TURNSTILE_SECRET OWNER_ALLOWLIST WEB_ORIGIN; do pnpm dlx wrangler secret put $s; done

# CI does this on push to main; manual equivalent:
pnpm --filter api run db:migrate:remote && pnpm --filter api run deploy
pnpm --filter web run build   # VITE_API_ORIGIN, VITE_TURNSTILE_SITE_KEY from GitHub Actions vars → actions/deploy-pages
```

Post-deploy smoke: check public navigation and approved test-account sign-in. Any email
or gallery mutation requires a designated test mailbox/image and cleanup; do not blindly
repeat data-changing walkthroughs against production. Deployment workflows MUST depend on
passing applicable CI, the complete browser matrix, and documented release evidence.
