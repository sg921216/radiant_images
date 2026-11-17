# Quickstart: Validating Radiant Images End-to-End

This guide proves the feature works against the [spec](./spec.md) acceptance scenarios. It is a run/validation guide — implementation detail lives in `tasks.md` and the code.

## 2026-11-17 — Google production handoff (T066 → T067)

**Latest owner update — under review:** The owner confirms the verification package
was submitted and reports **“Your app's data access is under review.”** Await Google's
decision or requests before resuming T066. The unsaved-form/demo preparation notes below
are historical; do not repeat submission or rotate the installed grant on their basis.
Interactive work is paused at the owner's request. On return, recheck the normal
post-rotation daily health after November 18 03:00 UTC for T067. Approval, actual user
limits and that scheduled result are not yet established. No automatic follow-up task
was created during this handoff.

**18:56 UTC installed state (supersedes pending-token notes below):** Owner confirms
Audience **In production** and verified published branding. Both Gmail scopes were
granted freshly and `GMAIL_REFRESH_TOKEN` was installed on private API version
`2ecf83f7-00c0-4471-a2bf-aca16112359b` via stdin. Real deployed manual daily health
reports Gmail `verified` at 18:56:10.936 UTC; independent S3 monitoring passes. The
temporary operator and local token file are removed; no duplicate token remains in
`.env.acceptance`. The old Testing grant's November 23 expiry is superseded by this
replacement. Production tokens remain revocable; keep existing failure monitoring.

T066 still needs resolution/documentation of the unverified-app scope warning and
applicable limits/exemption. T067 awaits the normal November 18 03:00 UTC scheduled
Gmail-health run (November 17 22:00 EST); a manual DO invocation is not that evidence.
Recheck using `node --import tsx .wrangler/acceptance/s3-snapshot.mjs latest` with the
existing ignored local read-only S3 setup, and retain sanitized health/backup timestamps.

**Historical pre-submission checkpoint:** Record the actual OAuth/scope-use demo and supply its YouTube
URL in Data Access. Chrome access now works through native Computer Use after the owner
enabled access and requested another attempt; the extension browser host remains unavailable.
The console confirms both Gmail scopes are unverified and requires scope justifications,
intended data usage and a demo video. Both justification fields are populated in the open
form (888 and 949 characters), with **Email productivity** selected. **Save is disabled**
while the video URL is missing: these are unsaved form edits, not a submitted review.
Owner reports establish resolved ownership, verified published Branding and Audience
**In production**; scope approval remains separate. Actual user-cap usage is not recorded.
The independent read-only S3 check passes with no issues. Its Gmail timestamp remains
18:56:10.936 UTC (manual daily invocation); maintenance completed at 19:06:01.974 UTC.
Do not rotate the installed grant again merely to check the upcoming cron.
Manual human/device acceptance remains deferred. Historical pre-installation states are
retained in acceptance.md, not instructions to preserve a token file that was removed.

Completed setup values below are retained for reference and recovery. In the
**existing production-bound Google Cloud project**, open Google Auth Platform
→ Branding and use these approved values:

| Field | Value |
| --- | --- |
| App name | Radiant Images |
| User support email | `radiantimages.ct@gmail.com`, if available to the project's signed-in administrator |
| Application home page | `https://radiantimagesct.com/` |
| Application privacy policy | `https://radiantimagesct.com/privacy` |
| Authorized domain | `radiantimagesct.com` |

If the support address is unavailable, resolve project/account access or obtain an
owner-selected monitored support address; do not substitute another address by guess.
Keep the existing developer contact unless the owner changes it. No terms URL has been
approved; do not invent one or reuse the privacy URL as a terms page.

1. Verify `radiantimagesct.com` in Google Search Console with the Google account that
   manages the project. For a Domain property, use Google's exact generated TXT record
   in Cloudflare DNS and return to Search Console to verify. Nameserver correctness is
   separate from Google ownership. Record the actual verified status; no TXT value is
   available in this session.
2. Save Branding. If the console offers Draft Branding, Verify Branding or Publish
   branding, record each actual status and complete the applicable flow. Saving fields
   alone does not establish published/verified branding.
3. Confirm Data Access contains `gmail.send` and `gmail.settings.basic`, and preserve
   the existing web-client callback `http://127.0.0.1:8085/callback` plus its existing
   private-login redirect. Set Audience to **In production** and read back the status.
4. Record Verification Center's exact requirements, pending reviews, warnings and user
   cap. Google lists a personal-use exception for fewer than 100 users; applicability
   to this deployment is not established. An ordinary Gmail account is not an Internal
   Workspace app. `gmail.settings.basic` remains restricted. Production publishing,
   brand approval and scope verification are separate evidence items.
5. Once T066's requirements are resolved, run
   `node --env-file=.env.acceptance --import tsx scripts/gmail-consent.ts` from this
   repository. The owner opens the newly printed URL, signs into the intended sender
   and grants **both** permissions. The helper requires state/PKCE and both scopes and
   writes only the ignored `.gmail-refresh-token.secret`. Do not paste tokens into chat.
6. Provision the new refresh token through protected file/stdin as `GMAIL_REFRESH_TOKEN`
   on `apps/api/wrangler.acceptance.toml`; preserve existing Google client credentials
   and sender configuration. Verify the intended send-as address. Then record a real
   normal `0 3 * * *` UTC scheduled Gmail-health result after the rotation, including
   its timestamp/version. A manual scheduler call is preliminary evidence only.
7. After successful provisioning, remove transient local token files. Record consent
   time, scope names and sanitized health outcomes only. Production refresh tokens can
   still be revoked/expire; retain existing failure monitoring and recovery procedures.

T066/T067 remain unchecked until the respective evidence exists. The old Testing grant's
November 23 expiry estimate is historical and superseded by the installed production-mode
grant. Steps 5–7 describe recovery if a replacement becomes necessary; they are already
complete for this rotation except for the normal scheduled health evidence. No private
application release or real email send is required for this handoff.

Checked against Google's [brand verification guidance](https://developers.google.com/identity/verification/authentication-verification),
[verification exceptions](https://support.google.com/cloud/answer/13464323?hl=en),
[Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) and
[token expiry guidance](https://developers.google.com/identity/protocols/oauth2#expiration).

### T066 verification form and demo preparation

The console's current Data Access form requires sensitive and restricted scope
justifications, a restricted-scope feature category, and a YouTube demo URL. No review
was submitted and no credentials, scopes or public application access were changed.

**Sensitive scope justification (888 characters, entered in Chrome):**

Radiant Images is a photography business application. The authorized owner connects the business Gmail account so the server can forward visitor inquiries and send owner-initiated client emails and questionnaire invitations using users.messages.send. gmail.send supplies send-only access without inbox-reading, draft-management or mailbox-modification permissions; narrower Gmail add-on scopes cannot support this standalone server application. Visitors and clients do not connect their Gmail accounts. Recipient addresses, subjects and bodies are sent to Gmail for delivery. Accepted client sends retain the returned message ID and application email history, with questionnaire links omitted. Inquiry contents are transient and are not saved as inquiry records. Tokens remain server-side. We do not read inbox messages or use Google data for advertising, sale or generalized AI training.

**Restricted scope justification (949 characters, entered in Chrome):**

Radiant Images uses gmail.settings.basic only for GET users/me/settings/sendAs. When the owner saves the configured sender address, and during scheduled Gmail health checks, the server confirms the address matches the primary account or an alias with accepted verification status. This prevents use of an unverified From address. We inspect sendAsEmail, isPrimary and verificationStatus transiently; the app stores the configured sender and sanitized health outcome, not the returned alias list. We do not create or change aliases, settings, filters, forwarding or signatures, or read inbox messages. gmail.send and Google sign-in email scopes do not authorize this endpoint. Its other supported scopes grant mailbox-reading/modification or full-mail access, so settings.basic is the most limited documented permission for this required sender check. Tokens remain server-side and data is used only for the disclosed business communication features.

**Intended usage:** Email productivity, for inquiry forwarding and owner-initiated
client/session communication with verified sender configuration. Selection is a factual
description of the feature, not Google's determination of eligibility or approval.

**Demo recording outline (not yet recorded/uploaded):**

1. Use the existing isolated private review application with synthetic client data and
   designated test recipients. Show the app name, homepage and linked privacy policy.
2. Demonstrate Google sign-in and the Gmail connection/consent flow, showing both scope
   permissions and the expected unverified-app notice. The owner handles authentication
   and any warning continuation. Do not capture passwords, tokens, authorization codes,
   unrelated tabs/mail or real client information. Do not replace the installed production
   grant just to make a video; any demonstration grant is separate and must be cleaned up.
3. Demonstrate the configured sender check in Settings and explain that the backend only
   reads send-as addresses to validate a primary/accepted alias. Show a rejected unverified
   sender and retained configuration, then the intended valid sender.
4. Demonstrate an inquiry forwarded to the designated mailbox and an owner-composed client
   message/questionnaire invitation with synthetic data. Show provider-accepted UI results
   and receipt, avoiding usable questionnaire tokens in the shared recording.
5. Explain server-side token storage, transient inquiry handling and client history with
   omitted questionnaire links. Show the policy and explain account-connection revocation.
6. Include every OAuth client assigned to the project, as the console requests; inventory
   these before recording. Supply the actual YouTube URL only after recording, review and
   authorized upload, then save/read back the fields and finish verification submission.

Source code reviewed: `apps/api/src/services/email.ts`, `apps/api/src/scheduled.ts`,
`apps/api/src/routes/admin/config.ts`, `scripts/gmail-consent.ts` and the published policy
source. Google's [sendAs.list authorization](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/list)
does not accept `gmail.send`; deleting the restricted permission would break the current
sender-validation feature. [Restricted-scope guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)
describes review and possible assessment requirements. No exemption, assessment completion,
paid assessment budget or approval is established here.

## 2026-11-17 — Homepage/privacy preparation for Google (T065)

The owner confirms the domain connection is complete for `radiantimagesct.com`, including
correct nameservers seen in Cloudflare and Google public DNS. Public contact is
`radiantimages.ct@gmail.com`. This report is not Google Search Console ownership evidence.

The isolated informational site uses the approved logo and the existing cream/sage palette.
Its homepage describes photography and the private owner application; its privacy policy
explains actual Google sign-in/Gmail use, both Gmail scopes, send-as verification, revocation,
client information, recovery-copy retention, provider delays and separate mailbox/Pixieset
lifecycle boundaries. It has no forms, application bundles, third-party scripts or API calls.

Configuration: `apps/web/branding.json`. Build from the repository root:

```powershell
pnpm branding:build
pnpm exec wrangler deploy --config apps/web/wrangler.branding.jsonc --dry-run
pnpm exec wrangler dev --config apps/web/wrangler.branding.jsonc --ip 127.0.0.1 --port 4193
```

Local review: `http://127.0.0.1:4193/` and `http://127.0.0.1:4193/privacy`.
While that loopback server runs, `pnpm branding:verify` checks both pages at 320/768/1280px,
JavaScript-disabled content, automated axe accessibility, metadata/security headers and
404 responses for application/API URLs. Screenshots and machine-readable results go to
ignored `.wrangler/branding-review/`. Automated checks do not replace deferred manual review.

**Published, owner-approved production URLs (T065 complete):**

- Homepage: `https://radiantimagesct.com/`
- Privacy policy: `https://radiantimagesct.com/privacy`

The dedicated `apps/web/wrangler.branding.jsonc` names `radiant-images-branding`, enables
only the apex custom domain and uploads only `apps/web/dist/branding`. It contains no
resource bindings or secrets. Both workers.dev and preview URLs are disabled. Unknown
routes use a genuine 404; there is no SPA fallback into the private application.

The owner explicitly approved the wording and publication. Version
`b5082e76-8a73-4a20-8a75-ca903bcab0ed` serves the dedicated custom domain. Six public
page/viewport checks pass, with normal TLS validation. `Cache-Control: no-transform`
prevents automatically injected analytics/email transformations. For future updates,
use the installed Wrangler identity/account checks, inspect custom-domain routing, build,
dry-run and deploy **only** this dedicated configuration, then verify HTTPS/headers/404s.
Do not use the
full-application release configuration or alter the private API, CORS, OAuth callbacks,
Gmail credentials or R2 visibility as part of branding publication.

Cloudflare authoritative DNS and 1.1.1.1 return `104.21.96.36` / `172.67.172.66`.
At the initial live check Google/local recursive resolvers cached the prior empty response. Google public DNS subsequently refreshed; the local upstream cache still returned no address.
The public check used the independently verified address with the real hostname and TLS
certificate checks enabled. Once recursive caches refresh, `pnpm branding:verify --public`
uses ordinary DNS. During the recorded cache window, the reproducible PowerShell command was:

```powershell
$env:BRANDING_VERIFY_ADDRESS = '104.21.96.36'
pnpm branding:verify --public
Remove-Item Env:BRANDING_VERIFY_ADDRESS
```

Re-resolve before using any address override in a later run; Cloudflare addresses can change.
T066 still requires Google Search Console ownership,
Branding fields (including the selected support email and authorized domain), Production
status and applicable verification. T067 requires fresh production Gmail consent and
actual scheduled Gmail health. Domain connection and informational-page implementation
do not establish those outcomes. T063's final photos/content and human/device checks remain deferred.

**Status (2026-11-14)**: Local application, migration, synthetic provider adapters and automated
suites are implemented under the approved T001 exception. See acceptance.md for actual
commands/results and remaining gates. Deployed image-resource/operational-retention proof, owner content,
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
The local-only Sharp decoder belongs to the isolated E2E server. The production adapter uses
`IMAGES` and `JPEG_VALIDATOR`, plus `GALLERY_MUTATIONS` for upload/delete coordination;
missing bindings or provider failures prevent publication.
Damaged or unsupported JPEGs return HTTP 400 with instructions to re-export as JPEG or PNG.
No original or derivative is written until validation succeeds. Live binding evidence is
recorded in research R-19/R-20. The private deployed rehearsal passes functional and sampled
CPU checks; R-21 adds coordinator memory samples. Account-wide usage controls and general
API CPU headroom remain release evidence.

## Separate provider-connected setup

### Controlled browser access on the owner's Windows computer (November 17)

This is private acceptance against the existing deployed API/D1/R2, not the isolated
synthetic-provider suite. Use only the two owner-designated receiving inboxes saved in
ignored `.env.acceptance`. Public API workers.dev/preview/routes and R2 access stay disabled.
Google production setup/final content remain deferred. The temporary Gmail grant must be
replaced before approximately **November 23, 2026, 9:28 p.m. Eastern**.

The web URL is **http://127.0.0.1:4273** and owner entry is
**http://127.0.0.1:4273/admin/login**. The API's loopback port is 8793. Access works only
on this computer. `scripts/private-browser/api.jsonc` binds the deployed API through
Wrangler's authenticated remote service; it never adds an owner session or bypasses Google.
Do not deploy these local gateways, bind them to a network interface, or add a public tunnel.

The November 17 logo update is present in the isolated frontend copy. The owner-approved
source is `apps/web/assets/Logo.jpg`; responsive derivatives and their reproduction
instructions are alongside it. All 19 read-only update checks pass. The prior frontend
is archived at `.wrangler/private-browser/web-client-before-logo-20261117`. The API,
Google configuration and live acceptance data were not changed; human testing stays deferred.

In the existing Google OAuth web client, preserve the Gmail-consent redirect and add
**`http://127.0.0.1:8793/auth/google/callback`** to authorized redirect URIs. Keep Testing
audience mode and the existing Gmail scopes/grant. This URI adjustment is private login
setup, not T065–T067 production acceptance. Google permits loopback redirect URIs for testing:
[OAuth redirect rules](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation).
The first attempted owner sign-in reported `redirect_uri_mismatch`. At 04:12 UTC the owner
confirmed successful dashboard login and a read-only D1 check corroborated a live session
created at 04:10 UTC. Login is now verified. Do not paste codes, tokens or passwords into
chat or evidence.

The deployed API configuration now declares the two loopback origins. The designated owner
is stored in `OWNER_ALLOWLIST`; `TURNSTILE_SECRET` is server-side. The real widget's public
site key is `0x4AAAAAAGEioZgDan3nTzgi`, restricted to `127.0.0.1` with no pre-clearance.
No dummy CAPTCHA response or provider adapter may substitute for live acceptance. Automatic
invocation logs/traces are off to avoid storing OAuth/questionnaire URLs; the independent
operations monitor and sanitized application logs remain enabled. Do not capture live
browser traces, request bodies, screenshots of inboxes, or raw tokenized URLs.

The active frontend is an isolated copy in `.wrangler/private-browser/web-client`. To prepare
a new copy, stop only the two local acceptance processes first; verify that the resolved
copy destination is inside this repository's `.wrangler/private-browser/`, archive the prior
build if needed, and build with these process-scoped public variables:

```powershell
$env:VITE_API_ORIGIN='http://127.0.0.1:8793'
$env:VITE_WEB_ORIGIN='http://127.0.0.1:4273'
$env:VITE_TURNSTILE_SITE_KEY='0x4AAAAAAGEioZgDan3nTzgi'
$env:VITE_PUBLIC_CONTACT_EMAIL='hello@example.invalid'
pnpm --filter @radiant/web build
# Copy to an absent destination; do not recursively nest client/ inside an old copy.
Copy-Item -LiteralPath 'apps/web/build/client' -Destination '.wrangler/private-browser/web-client' -Recurse
```

The public contact value above is intentionally a private-test placeholder; final monitored
recovery-contact approval is still open. Never infer it from the private sender/recipient.
Use a fresh terminal for ordinary tests so their builds do not inherit these variables.
Start the following commands in separate terminals from the repository root:

```powershell
$env:WRANGLER_SEND_METRICS='false'
$env:WRANGLER_WRITE_LOGS='false'
pnpm exec wrangler dev --config scripts/private-browser/api.jsonc --ip 127.0.0.1 --port 8793 --inspector-port 9253 --show-interactive-dev-session=false --log-level error
```

```powershell
$env:WRANGLER_SEND_METRICS='false'
$env:WRANGLER_WRITE_LOGS='false'
pnpm exec wrangler dev --config scripts/private-browser/web.jsonc --ip 127.0.0.1 --port 4273 --inspector-port 9254 --show-interactive-dev-session=false --log-level error
```

Check that all four ports listen on `127.0.0.1`. Bootstrap should return 200; anonymous
`/admin/config` should return 401; a foreign Origin or Host should return 403 before remote
forwarding. Recheck Cloudflare ingress and R2 privacy after any deployment. Stopping these
processes closes browser access without interrupting the deployed schedules or monitor.

Before live sends, finish owner login and real CAPTCHA verification, establish mailbox
receipt observation, and use the predeclared ledger
`evidence/private-browser-live-runs-20261117.json`. Run ten distinct inquiries to the initial
inbox, then change Settings to the second inbox and run ten more. Pace at no more than five
inquiry POSTs per fixed ten-minute IP window; negative cases consume the same limit and
belong outside the healthy cohorts. Record every attempt and each actual receipt timestamp;
Gmail acceptance alone is not delivery. Never blindly retry an uncertain outcome. The two
synthetic client workflows must use the designated recipients and preserve questionnaire
token redaction, client isolation and snapshot checks. Human timing, screen-reader review
and the release device matrix retain the plan's separate requirements.

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

The owner deferred manual testing until the end on 2026-11-17. The prepared
`owner-timed-01` case has not started and must not count as a timed attempt. Resume these
checks only when requested, using the updated verified build and preserving the existing
private-access boundary. The required-answer feedback fix passed CI run `44108958097`
for `aebde5d` and was applied to the private API/isolated frontend on 2026-11-17. Twenty
read-only HTTP checks pass; see `evidence/private-build-update-20261117.json`. Reload the
site at the start of the eventual manual pass so already-open tabs use the updated assets.

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
20. Add a shoot location → new `/contact` load shows it. Remove it while a form is open, submit → validation rejects the removed selection and prompts reselect while preserving the draft. If refreshed options have already reached the form, shared client validation rejects before a POST; independently verify server-side stale-option rejection (HTTP 400 `validation_failed`, no dispatch) in the API integration suite. Do not claim a live HTTP code when the browser rejected locally. — US5-AS2/3
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

## Billing Read connection follow-up (T064)

**Verified 2026-11-16; T064 complete.** The owner-created account token is active
until November 24 04:59:59 UTC. The configured token MCP session was not exposed by
this host, so verification used the approved secure read-only REST fallback. Subscription,
explicit-period usage and spend-policy GETs succeeded. Detailed v1 billable usage
reports R2/Images usage through November 15; generic usage has no rows, restricted v2
is denied, and daily Workers/D1/DO totals remain unverified. See research R-27 and
`evidence/cloudflare-billing-read-20261116.json`. Preserve these gaps when repeating:
successful access alone is not proof of complete metering or zero cost.

The procedure below remains the repeatable setup/verification scope. Existing OAuth
alone cannot read Billing; no additional billing-write permission is required.

1. In Cloudflare, create a custom API token with **Account > Billing > Read** only,
   limited to the Radiant Images account. An account-owned token is supported for
   Billing; creating one requires the appropriate account token provisioning role.
   Select a finite expiry suitable for this verification. Do not add Billing Edit,
   deployment, payment or account-member permissions.
2. Configure a separate token-authenticated connection to Cloudflare's official API MCP
   server, `https://mcp.cloudflare.com/mcp`, using its secure bearer-token credential
   setting. Keep the existing operational OAuth connection. If the selected client only
   offers OAuth, use an approved secure API session with the same scoped token instead;
   do not assume an OAuth reconnect expands permissions. Store the secret through the
   client's credential mechanism, never in this repository or a chat message.
3. Verify actual GET access to `/accounts/{account_id}/subscriptions` and
   `/accounts/{account_id}/billing/usage`. Use explicit billing-period `since`/`until`,
   daily aggregation and sufficient result limits; the usage endpoint otherwise defaults
   to six hours and can silently truncate. Record active plans, included allowances,
   relevant usage and observed charges with their time window. Supplement missing R2,
   D1, Images or DO metrics through the corresponding authorized read-only sources;
   the generic billing usage endpoint is not an exhaustive account usage report.
4. Read available spend policies and existing budget-warning configuration separately.
   The spend-policy endpoint declares no token permission in the current API schema;
   retain a gap if it remains denied. Distinguish warning thresholds from enforced
   controls and do not report a hard cap or zero charge without supporting evidence.
5. Save only sanitized totals, plan names, dates, control states and limitations. Mark
   T064 complete only after connection and the required reads are verified; then reassess
   T001. Persistent monitoring (T058), deployment (T060) and final acceptance (T063)
   retain their other prerequisites. Revoke or rotate temporary verification access when
   finished, without changing the operational connection or existing budget warnings.

Sources: [Billing permissions](https://developers.cloudflare.com/billing/understand/billing-permissions/),
[account-owned token support](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/),
[Cloudflare API MCP authentication](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/).

## Deployment and rollback preparation (T060)

**R-28 storage admission prerequisite:** Deploy `storageCapacity.ts` with the gallery
and backup services. Uploads check combined MEDIA/RECOVERY inventory before calling
Images; backups check before export. At 6 GiB minus 32 MiB headroom minus the bounded
new allocation, or when inventory cannot be established, uploads return 503
`storage_capacity_unavailable` and backups fail visibly. Inspect independent monitoring
and actual bucket usage, verify cleanup, then retry; do not erase required recovery
receipts or reset the rolling upload allowance to bypass refusal. Public reads and
photo/client deletion are not disabled by this admission gate. This threshold does
not replace account budget warnings or promise a maximum invoice.

R-28 records daily Workers/D1 analytics and the private capacity-check probe. R-29 adds
committed application uploads/deletion with 1,501 small recovery keys forcing real R2
pagination, plus a verified backup snapshot. All 92 provider tail records report `ok`;
maximum front CPU is 7 ms. These scoped checks do not establish six-GiB/max-page capacity.
The owner confirmed that the account Images page shows Free on November 16. DO aggregates
remain empty and the owner's monthly dashboard displays zeros despite execution proof;
do not treat that discrepancy as zero consumption. Exact-head Quality run 43953953193
passes 290 tests and 163 browser/performance checks across five projects, with 12 expected
duplicate performance skips and an identical tested tree. Persistent monitoring and
production release acceptance remain explicit gates.

**R-25 bulk-read prerequisite:** Include `BULK_READS` / `BulkReads` and the
`bulk-reads-v1` SQLite-class migration from the release generator. GET/HEAD for public
bootstrap, owner gallery and owner clients use separate named instances, each admitting
up to eight concurrent reads. Excess admission returns 503 with `Retry-After: 2` and
no-store; retry after the indicated delay. Restore and owner checks still apply before
dispatch and inside the object. There is no cached content or authorization state.
Other endpoints retain their current execution paths. Record front-Worker and DO CPU
separately, and include DO requests/duration and repeated D1 reads in account usage.
R-25's disposable synthetic rehearsal is sampled capacity evidence, not a billing cap
or a persistent production monitor. Run remote Quality on the eventual source commit.

**R-24 operational prerequisites:** Include the `SCHEDULED_OPERATIONS` binding and
`scheduled-operations-v1` SQLite-class migration from the release generator. Both cron
expressions dispatch to the same `recovery` object and await completion. Inspect the
maintenance/backup/health objects with the independent monitor; successful RPC dispatch
alone is not a successful backup. Do not restore service while the deletion ledger or
recovery cleanup remains unverified.

The portfolio coordinator now admits 300 upload attempts in any rolling 30-day window.
Admitted validation/provider failures consume a slot; authentication and byte-limit
rejections occur before reservation. At exhaustion, uploads return 429 and a
`Retry-After` value; photo deletion and reads remain available. Do not delete the DO
namespace or clear its storage to bypass the allowance. The existing 60-photo and byte
bounds still apply. The verified account-wide $1 budget warning uses the existing billing
recipient and supplements the $10 warning; neither stops billing. R2 is not covered by the
documented Workers/DO spending limits. R-27 now verifies subscriptions and an empty
spend-policy list through Billing Read. R-28 resolves the Images Free label and supplies
daily Workers/D1 observations. DO metering remains unresolved; no paid upgrade is selected.

Persistent recovery monitoring still needs the actual long-lived recovery bucket,
verified bucket-only S3 read credentials, repository settings and scheduled notification
routing. The disposable CPU rehearsal is not that target. Keep
`OPERATIONS_MONITOR_ENABLED` off until those values point to the persistent deployment;
then repeat healthy → injected fault → recovered and verify a scheduled recipient path.

Pull requests now run the complete configured Chromium desktop/mobile, Firefox desktop,
and WebKit desktop/mobile suite in the Quality workflow. Main-branch pushes run Chromium
smoke; scheduled, manual and reusable release runs retain the full suite. A successful
old PR smoke run does not establish a full-suite pass. R-24 commit `c00eaab` now passes
PR Quality run 43675695318 with an identical tested merge tree: 281 unit/integration
tests and 158 browser passes, plus 12 declared duplicate performance-profile skips.
T059 is complete; acceptance.md retains the exact commit/tree and gate evidence. Later
application changes still require a fresh remote result before merge or release.

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

## Release acceptance register (T063; partial private live evidence)

The local-development exception excludes live provider acceptance and recruitment. The
owner separately authorized the private live runs recorded below on 2026-11-17. Public
access remains disabled; the human/device/content gates are still open. Detailed timestamps
are in `evidence/private-browser-live-runs-20261117.json` and acceptance.md.

| Check                              | Predeclared sample or inventory                                                                                            | Current evidence                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Initial inquiry mailbox delivery   | 10 distinct eligible inquiries with healthy providers; keep every started eligible attempt                                 | 10 submitted / accepted / received; all Inbox and under 300 s |
| Changed-recipient mailbox delivery | A separate 10 distinct inquiries after saving settings                                                                     | 10 submitted / accepted / received under 300 s; 3 Inbox / 7 Spam |
| First-time usability SC-008        | 10 adults: 5 desktop, 5 mobile; unassisted; at least ceil(0.9 × started) successes; all started attempts retained          | No participants enrolled                                |
| Discovery SC-001                   | Goal-to-visible-acceptance time, under four minutes; same participant records                                              | No human timings                                        |
| Owner workflow SC-012              | Loaded dashboard through required workflow, under three minutes without coaching                                           | Agent-run real receipt/response/isolation/snapshot checks pass; human timing pending |
| Accessibility                      | Keyboard plus representative screen-reader and meaningful photo-alt review                                                 | Automated evidence plus Chrome FAQ keyboard/200% zoom sample; screen-reader/final-photo review pending |
| Print/PDF                          | Physical print plus owner content/readability review                                                                       | Local PDF rendering evidence only                       |
| Live browser matrix                | Exact N/N-1 versions at release freeze, every plan.md browser/OS/device cell                                               | Every actual-browser/device cell BLOCKED pending access |
| Deployed freshness/performance     | Live providers and deployed cache/clock/HTTPS observations                                                                 | Private live public-contact propagation 16.305 s; removed-option display 14.713 s; full profile remains separate |
| Content/privacy                    | Logo, up to 60 approved photo assets, copy, pricing, privacy/deposit terms, usage/guardian permissions, monitored public contact | Logo approved; 17 maternity photos and pricing intake prepared locally (see content-intake.md); permissions, final policies and newborn/family photos pending |

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

The original raw-provider run intentionally fails: the provider accepts damaged JPEG scans
that strict decoding rejects (R-18). Preserve this evidence. The production adapter adds
strict scan validation before transformation (R-19). Its separate diagnostic uses local
workerd and Durable Object RPC with the **live** Images binding:

```sh
pnpm exec wrangler dev --config scripts/image-binding-probe/validation.wrangler.toml --ip 127.0.0.1 --port 8795 --inspector-port 9245 --show-interactive-dev-session=false
# In another terminal:
pnpm exec tsx scripts/image-binding-probe/validate.ts
```

Stop the diagnostic process afterward. It uses only synthetic files and no D1/R2 bindings;
never deploy either diagnostic Worker. The sanitized report is
`evidence/images-validation-probe.json`. All ten recorded cases pass, including both
previously accepted damaged JPEGs (400), re-exported JPEGs, EXIF orientation, 40 MP,
16,384-pixel width and a 10 MiB input. This checks adapter/provider behavior, not deployed
CPU/memory or remaining T001/T034 release evidence. Full client collections stay in Pixieset.

## Private deployed gallery rehearsal

R-20 records the separately authorized 2026-11-14 rehearsal. It passes 11/11 checks plus
concurrent upload admission. This workflow creates temporary remote resources; it is not
part of ordinary local setup or CI. Use the owner's scoped authorization and designated
account. Never reuse a live database/bucket or copy application credentials into the probe.

1. Choose a fresh suffix shaped `YYYYMMDD-abcdef`. Confirm the corresponding
   `radiant-rehearsal-<suffix>` Worker/D1 and `-media`/`-recovery` buckets do not exist.
   Create that disposable D1 and two Standard R2 buckets, with public access disabled.
2. Run `pnpm exec tsx scripts/cloudflare-gallery-rehearsal/prepare.ts <suffix> <d1-id>
   <account-id>`. It writes ignored configs and synthetic credentials under
   `.wrangler/gallery-rehearsal/`. Inspect the generated configuration: actual API entry,
   isolated D1/R2, Images, both SQLite DO bindings/migrations, no routes/cron/workers.dev/
   preview URLs, full diagnostic telemetry. No Google or Gmail integration is enabled.
3. Using `.wrangler/gallery-rehearsal/wrangler.jsonc`, apply remote D1 migrations, deploy
   the private Worker, load the generated `secrets.json` with Wrangler's bulk-secret
   command, and execute `session.sql` only against that disposable D1. Verify Worker and
   bucket public access remains disabled before invoking it. `refresh.ts` updates the
   generated bindings when rehearsal code changes; it does not deploy or change identities.
4. Start the loopback proxy (never deploy this entry point):

   ```sh
   pnpm exec wrangler dev --config .wrangler/gallery-rehearsal/proxy.jsonc --ip 127.0.0.1 --port 8796 --inspector-port 9246 --show-interactive-dev-session=false
   ```

5. In another terminal run `pnpm exec tsx scripts/cloudflare-gallery-rehearsal/run.ts
   --report=coordinated`, then `pnpm exec tsx scripts/cloudflare-gallery-rehearsal/concurrency.ts`.
   Optional case-name arguments select a subset. Preserve failed evidence; choose a new
   report suffix for a repeat. Keep the proxy/config unchanged during execution: a reload
   can interrupt the response while a dispatched upload still completes. Check inventory
   before any retry; `tidy.ts` removes only gallery entries with the synthetic rehearsal alt
   prefix. Never run these scripts against a real gallery.
6. Collect invocation CPU and GraphQL Worker/DO memory metrics by version/namespace and
   time window. Analytics can lag; empty rows are missing evidence. Export only sanitized
   aggregates, never headers, tokens, client IPs or raw invocation payloads. Record sampled
   percentiles separately from peak-memory profiling and report failed profiling attempts.
7. Call local `POST /__empty-storage`, verify `GET /__storage` is empty, stop the proxy,
   then delete only the verified rehearsal Worker, D1 and two empty buckets. Confirm both
   DO namespaces and all named resources are absent. Remove generated local configs and
   synthetic credentials; retain sanitized evidence and a cleanup receipt.

Production requires `IMAGES`, `JPEG_VALIDATOR`/`JpegValidator` and
`GALLERY_MUTATIONS`/`GalleryMutations`, with both SQLite migrations. One portfolio mutation
is admitted at a time; overlap returns 429 with a two-second retry hint. The UI retains its
existing error/retry flow. JPEG validation has a 20-second ceiling, Images calls eight
seconds each, and overall validation thirty seconds; failure prevents publication.
Account-wide Images/R2/DO budgets and general API CPU headroom still gate release. This
rehearsal does not verify scheduled retention, independent alerts or full client delivery.

### Coordinator memory follow-up

`scripts/cloudflare-gallery-rehearsal/memory.ts` creates a deterministic 40-MP high-detail
JPEG padded with legal metadata to exactly 10 MiB and verifies four upload/read/delete
cycles. The ordinary local proxy buffers uploads before forwarding them, so local pacing
does not establish remote stream duration. For the R-21 follow-up, a separate private
`streaming-driver.ts` Worker was bound only to the rehearsal API. The loopback proxy's
TARGET pointed at that driver; `memory.ts --remote-streaming` let the driver pace actual
Cloudflare-to-Cloudflare traffic at 75 ms per 32 KiB. Keep all routes, workers.dev and preview
URLs disabled. Delete the driver before the API because it holds a service binding.

The first driver paced each incoming chunk, timed out, and eventually completed remotely.
The corrected byte-based pacing has a regression test and four passing cycles. Preserve
both failed receipts and check the gallery before retrying any uncertain result. R-21
records sampled memory, profiling limitations, CPU observations and complete cleanup.

## Independent recovery monitoring and GitHub alerts

### Persistent private target (R-30, 2026-11-16)

The owner authorized private operational acceptance independently of final copy/photos.
The persistent resource configuration is `apps/api/wrangler.acceptance.toml`:

| Resource | Persistent identity |
| --- | --- |
| API Worker | `radiant-images-api` |
| D1 database | `radiant-images` / `003885df-e1f5-4bc1-acf6-8a21915e7406` |
| Portfolio bucket | `radiant-images-media` |
| Recovery bucket | `radiant-images-recovery` |
| Maintenance | `*/5 * * * *` (UTC) |
| Daily backup and Gmail health | `0 3 * * *` (UTC) |

Workers.dev, preview URLs and routes are disabled; neither R2 bucket has a public managed
domain or custom domain. No public frontend is deployed. All three D1 migrations are
applied. This database starts without client/content fixtures; a small empty-data backup
is an operational bootstrapping observation, not final content acceptance.

Use the explicit config for every remote operation. Dry-run with
`pnpm exec wrangler deploy --dry-run --config apps/api/wrangler.acceptance.toml`.
An authorized private update uses the same command without `--dry-run`. Keep the existing
public release generator and its incomplete-task refusal intact. Do not deploy the default
local config or use the old disposable rehearsal names. Do not delete these persistent
resources during diagnostic cleanup.

Keep `apps/api/.dev.vars` as development placeholders. The ignored root `.env.acceptance`
template is for the real production-bound private environment. Fill `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET` and `GMAIL_SENDER_ADDRESS` there. Use the Google Cloud project
reserved for the real deployment, enable Gmail API, configure Google Auth Platform branding,
and choose External for ordinary Gmail or Internal only for an eligible Workspace organization.
Add `https://www.googleapis.com/auth/gmail.send` and
`https://www.googleapis.com/auth/gmail.settings.basic` in Data Access. Create a **Web
application** OAuth client with the exact authorized redirect
`http://127.0.0.1:8085/callback`; no JavaScript origin is needed by the consent helper.
Do not register the deliberately invalid acceptance API origin.

For durable External consent, set Audience publishing status to **In production** before
generating the final refresh token: Testing authorizations for these Gmail scopes expire
after seven days. OAuth publication is separate from exposing the Cloudflare application.
`gmail.settings.basic` is restricted; follow Google's applicable verification or limited-use/
internal exception, and do not invent public privacy URLs to pass a verification prompt.
[Google audience](https://support.google.com/cloud/answer/15549945),
[verification exceptions](https://support.google.com/cloud/answer/13464323),
[Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).

**Owner-observed Google publishing blocker (R-30 follow-up):** The console refuses to
switch this External app to production until a valid app name, support email, homepage URL
and privacy-policy URL are configured on Branding. A verification exemption does not
establish that these required fields can be omitted. Do not enter invented URLs or expose
the private application to satisfy the form. Long-lived Gmail consent now depends on
genuine, owner-approved public branding/privacy pages; those can be hosted separately
while the application and recovery resources remain private. Google's brand-verification
guidance requires an owned/verified homepage domain, a description of the app, and a
linked privacy policy disclosing Google-data access/use/storage/sharing.
[Branding requirements](https://support.google.com/cloud/answer/13464321).

To continue bounded acceptance before those pages are ready, leave the OAuth app in
**Testing**, add the intended sending Gmail account under **Audience → Test users → Add
users**, save, and restart the local consent command below. Use the new authorization URL
and that exact account. Record the resulting grant as temporary, with its seven-day expiry;
do not call it long-lived Gmail acceptance or silently refresh consent as a permanent
workaround. After branding/publication is resolved, obtain fresh production consent and
replace the temporary refresh token. This does not change the Cloudflare ingress boundary.
The owner deferred this production setup as T065 (approved real pages), T066 (Branding,
Production and applicable verification), and T067 (fresh consent and scheduled health).

From the repository root run
`node --env-file=.env.acceptance --import tsx scripts/gmail-consent.ts`, open its printed
Google URL on this computer, sign into the intended sending mailbox, and select **both**
requested permission checkboxes before continuing. Granting only send-mail access is
insufficient for sender verification: the live partial-grant attempt returned 403 from
the send-as lookup. The helper now rejects incomplete scope grants without saving a token;
restart it and use the newly printed URL if this happens.
The helper saves the refresh token in ignored `.gmail-refresh-token.secret` without printing
it. It is optional to duplicate that token into `GMAIL_REFRESH_TOKEN` in `.env.acceptance`;
the operator can read the separate secret file directly. Never paste credentials into chat.
Provision only the three real Google/Gmail values as Worker secrets using protected file/stdin
input. Obtain the intended sender address and initialize the private site settings before
expecting Gmail health to be verified. Do not publish a contact address by inference.
No real inquiry/email send is needed merely to inspect verified send-as status.

**Current private-testing state (November 17 02:38 UTC):** Both scopes are granted and
the sender is verified by the deployed health check. Gmail's primary address may omit
`verificationStatus` because that field applies only to custom aliases; the tested adapter
accepts a matching `isPrimary=true` address or an accepted custom alias. The three real
Google/Gmail values are Worker secrets and transient local refresh-token files were removed.
This Testing grant was obtained about November 17 02:28 UTC; its seven-day lifetime reaches
approximately November 24 02:28 UTC (November 23 21:28 EST). T067 tracks replacement after
the deferred production setup. Do not mistake today's passing health check for durable
production consent. Private settings retain deliberately invalid inquiry/public-contact
addresses until those separate settings are approved.

Create fresh **R2 Object Read Only** credentials scoped only to `radiant-images-recovery`
and store the two S3 values in ignored `.env.recovery-monitor`. The old rehearsal credentials
return 403 for this new bucket. The connected Cloudflare OAuth cannot manage account API
tokens (403); creating the R2 credentials requires the owner's dashboard/token authority.
The Billing Read token is unrelated and must not be copied into the monitor.
In the Cloudflare dashboard select the account above, open **R2 Object Storage → Overview**,
then **Account Details → API Tokens → Manage**. Create an account API token (or user API token
if account tokens are unavailable), name it `radiant-images-recovery-monitor`, choose
**Object Read only**, and restrict it to the single `radiant-images-recovery` bucket.
Use a lifetime appropriate to unattended monitoring and record any chosen rotation deadline.
For the owner's November 16, 2026 token setup, the selected expiration is **November 16,
2027**. Rotate the S3 pair in the ignored file and GitHub secrets before that date, repeat
the scope/healthy checks below, and retire the old pair only after the replacement passes.
Copy the resulting **Access Key ID** and **Secret Access Key** into the two existing entries
in `.env.recovery-monitor`; do not substitute the displayed general API token. The secret
access key is shown only once. [R2 credential creation](https://developers.cloudflare.com/r2/api/tokens/).
Before GitHub provisioning, verify recovery listing/operational reads succeed, media and
unrelated-bucket listings return 403, and an empty uniquely named recovery write probe
returns 403. If an incorrectly scoped credential writes the probe, remove exactly that
probe and reject the credential; never accept broader access as a workaround.

The remainder of this section describes the monitor's established behavior. Historical
R-29 statements about absent Workers/databases are superseded by the persistent inventory
above. Current acceptance evidence is recorded in acceptance.md.

The owner selected GitHub failure notifications on 2026-11-14. R-30 now verifies enabled
private-environment monitoring, a real scheduled failure (`44010000756`), owner-confirmed
receipt, restored configuration and healthy recovery (`44010074349`). The scheduled run
was created at 03:24:37 UTC for the 03:17 slot; scheduling may be delayed. R-23's earlier
manual synthetic notification remains separate evidence. The workflow runs hourly at minute 17 and can also be run
manually. Node 24 executes the TypeScript checker after a frozen, production-only install
of its pinned signing/XML dependencies (nine packages including transitive dependencies,
with install scripts disabled).
It reads R2's S3-compatible API independently of the application/cron, never invoking
application mutations. No public health endpoint or application owner session is added.

`operations/maintenance.json` and `operations/backup.json` contain version, status and times
only, in the private recovery bucket. Running records also carry `lastSucceededAt` when
a preceding successful completion exists; restarting work cannot reset its freshness.
Running/error/stale records cannot masquerade as a
completed job. The monitor separately paginates R2 metadata, checking actual backup
freshness and delayed removal rather than trusting a successful heartbeat alone. It does
not download backup, original, derivative or deletion-receipt bodies. S3 listings omit
custom metadata, so the checker retrieves backup creation/expiry metadata using conditional
HEAD requests against the listed ETag. Missing or changed objects fail the run. Requests
use SigV4, fixed bucket/origin and GET/HEAD only, with no redirects or automatic retries.
Each request has a 15-second timeout; the collection budget is three minutes, each body
is bounded to 2 MiB, and inventory is capped at 100 pages of 1,000 objects.

Detection thresholds: maintenance missing/stuck/older than 20 minutes; backup and health
older than 30 hours; recovery still present 28 days plus 20 minutes after creation; removal
target misses at day 30; receipts remaining after day 31 plus 20 minutes; recovery bucket
at or above 6 GiB; Gmail unavailable or nonzero recorded application failure counts.
Outputs contain fixed issue codes and counts only. Provider/network errors, malformed
metadata, incomplete pagination and oversized responses fail the check. Delayed receipt
removal is reported for investigation; the monitor never deletes receipts or bypasses safe
preservation. The storage threshold is an alert, not a billing cap or account-wide limit.

Activation and re-verification checklist for the persistent deployment:

Current R-30 state: the persistent private API/D1/R2 target exists, all three repository
secrets below are installed, `RECOVERY_BUCKET=radiant-images-recovery`, and
`OPERATIONS_MONITOR_ENABLED=true`. The normal daily backup and live Gmail health passed
on the actual 03:00 UTC cron. Use the checklist for future configuration/re-verification,
preserving the existing target. The deleted disposable rehearsal must never be reused as
the monitor target. Temporary Google consent still requires the deferred T065–T067 work.

1. Deploy the scheduled status-record changes and complete a verified daily backup/health
   run. Keep R2 private. Create R2 **Object Read Only** credentials limited to the recovery
   bucket and retain their S3 access key ID and secret access key in the secret store.
   Verify the bucket scope without copying credentials into chat/source control. The REST
   API does not accept these credentials; its Admin Read Only alternative grants account-wide
   access and is not used here. [Cloudflare authentication restriction](https://developers.cloudflare.com/r2/platform/troubleshooting/#object-level-api-tokens-fail-against-the-rest-api).
2. Put the workflow on the default branch. At repository scope configure secrets
   `CLOUDFLARE_ACCOUNT_ID`, `R2_MONITOR_ACCESS_KEY_ID`, `R2_MONITOR_SECRET_ACCESS_KEY`,
   variable `RECOVERY_BUCKET`, then
   `OPERATIONS_MONITOR_ENABLED=true`. The existing deployment environment's secrets are
   not automatically available to this independent job. Missing enablement leaves it
   inactive and does not satisfy T058.
3. The intended owner should create/update the schedule or disable/re-enable the workflow,
   then enable GitHub Actions notifications and “Only notify for failed workflows.” GitHub
   routes scheduled notifications to the creating/updating/re-enabling user; watching the
   repository alone does not prove delivery. [Notification routing](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs),
   [notification preferences](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications).
4. Manually dispatch with `notification_test=true` and verify receipt of the explicitly
   labeled synthetic failure. This test makes no Cloudflare call. Then run the real check
   and retain the sanitized healthy result; rehearse stale-job/deletion failure and recovery
   on an isolated deployment before closing T058. Never age/delete real client recovery
   copies for a test.

GitHub schedules can be delayed/dropped under load and inactive public repositories can
have schedules disabled. The hourly check is operational monitoring, not a guaranteed
delivery deadline; review workflow activity and usage allowance separately. No scheduled
run, notification receipt or repository credential configuration was performed in R-21.
[Schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

R-22 validates the corrected transport locally and verifies the workflow's minimal frozen
dependency installation. No S3 monitor credentials or recovery-bucket target are configured
in the current shell. GitHub CLI is unavailable in this environment; repository settings
and remote workflow outcomes were not inspected. Do not infer notification activation or
receipt from local test results. The existing scoped provider/release gates still apply.

## Private recovery and monitoring rehearsal (R-23)

This disposable diagnostic has no public routes, workers.dev URL or preview URLs. It imports
the real recovery services into a separate operator entry point; the application entry does
not import it. Use only new `radiant-recovery-YYYYMMDD-xxxxxx` resources with synthetic data.
Gmail is explicitly replaced with a no-send sender-verification adapter. Portfolio recovery
compares four small byte fixtures; it does not replace the R-20/R-21 image-decoder evidence.
The day-28/day-31 checks use controlled time and injected deletion failure, not a month-long
provider-outage observation.

1. Verify the new names are absent, create one D1 database and private `-media`/`-recovery`
   buckets, then prepare fixed-name configuration:

   ```powershell
   pnpm exec tsx scripts/cloudflare-recovery-rehearsal/prepare.ts <suffix> <d1-id> <account-id>
   pnpm exec wrangler deploy --config .wrangler/recovery-rehearsal/wrangler.jsonc --dry-run
   pnpm exec wrangler d1 migrations apply <rehearsal-name> --remote --config .wrangler/recovery-rehearsal/wrangler.jsonc
   pnpm exec wrangler deploy --config .wrangler/recovery-rehearsal/wrangler.jsonc
   pnpm exec wrangler dev --config .wrangler/recovery-rehearsal/proxy.jsonc --ip 127.0.0.1 --port 8797 --inspector-port 9247 --show-interactive-dev-session=false
   ```

2. In another terminal, run `pnpm exec tsx scripts/cloudflare-recovery-rehearsal/run.ts ACTION`
   for `seed`, `backup`, `delete`, `restore`, `unsafe`, `retention` in that order. The driver
   checks the phase and refuses to seed an existing fixture. Inspect each result before
   continuing; do not retry an uncertain mutation without inspecting its state. `restore`
   verifies deleted clients/dependents remain absent, retained invitation associations and
   omission markers survive, all original/variant bytes match, and public reads stay 503
   until explicit reconciliation/reopen. `unsafe` checks missing receipts and day-28 expiry.
   The seed asserts two populated rows in every client-dependent fixture table; empty-table
   absence checks cannot satisfy cascade evidence. `checklist-proof` provides a separate
   populated checklist snapshot/delete/restore check when cron is off.

3. After `retention`, run `monitor 32`: the independent binding reader should report failed
   maintenance, overdue copies/receipts and missed removal targets under the 32-day fixture
   clock. Run `retry`, `healthy`, then `monitor`; the final result must be healthy. A successful
   retry verifies actual R2 absence before retiring receipts. The monitor command records the
   result; deliberate negative probes are interpreted by their fixed issue codes, not just
   by the diagnostic driver's exit code.

4. Run `cron-on` and wait for `cron-receipt` to contain a new Cloudflare-generated scheduled
   event and successful completion. The temporary every-minute trigger calls the daily
   maintenance/backup/health branch. It is not the production schedule. Cloudflare documents
   [up to 15 minutes of trigger propagation](https://developers.cloudflare.com/workers/configuration/cron-triggers/).
   Record actual tail CPU/wall time and outcome, not just a configured cron expression.
   Run `cron-off` before fault injection, Time Travel or cleanup.

5. To rehearse provider recovery, keep ingress detached, disable fixture cron, capture a
   current bookmark using `wrangler d1 time-travel info <name> --json`, run `provider-delete`,
   then use `wrangler d1 time-travel restore <name> --bookmark <saved-bookmark>` on that
   isolated D1 only. Run `provider-reconcile`: it verifies the deleted fixture returned to
   offline D1, reapplies the independent R2 ledger, clears transient credentials and verifies
   cascades before reopening. Do not import or reset the ledger/lifecycle identity from a
   backup. A provider restore can reset the maintenance flag, so detached ingress is essential.
   Never use a fixture bookmark for a production restore.

6. For independent S3 verification, put `R2_MONITOR_ACCESS_KEY_ID` and
   `R2_MONITOR_SECRET_ACCESS_KEY` in ignored `.env.recovery-monitor`. Use R2 **Object Read Only**
   credentials restricted to the recovery bucket. Verify the chosen bucket can be read,
   another disposable bucket cannot be listed, and writes are denied. Never put a broader
   credential in GitHub as a shortcut. Run `monitor-s3`, then `stale`, `monitor-s3`,
   `recover-monitor`, `monitor-s3`. Expect healthy → stale maintenance/overdue recovery/target
   miss → healthy. This uses the shipped SigV4/conditional-HEAD checker against real R2.
   Only synthetic metadata is aged; real client recovery copies must never be aged for a test.

7. A compatible Worker code rollback uses a saved version ID and `wrangler rollback` with
   this exact config. Confirm the active version and run `recover-monitor` plus `monitor-s3`
   afterward. This private operator rollback does not establish the web/API release rollback
   matrix, schema compatibility for arbitrary versions, or public HTTPS acceptance.

8. The existing workflow's `notification_test=true` intentionally fails before checkout or
   Cloudflare access; it requires no R2 credentials. Verify receipt with the intended recipient.
   For a real GitHub check, use only verified bucket-only read credentials, record the run,
   and remove temporary repository secrets/variables when the rehearsal ends. Persistent
   monitoring still requires the production target and notification routing described above.

9. Run `cron-off`, remove the temporary schedule, then `empty` to verify both fixture buckets
   empty. Stop the loopback proxy/tail. Delete only the verified rehearsal Worker, D1 and
   empty buckets; re-list resources to prove absence. Remove any temporary GitHub credentials
   and ask the credential owner to revoke the rehearsal R2 token. Retain sanitized JSON
   results from `.wrangler/recovery-rehearsal/results.jsonl`, never credentials or raw tails.

R-23 records actual outcomes, limitations, credential checks and cleanup. A passing functional
rehearsal does not close the Free CPU budget: the observed cron samples were 30–43 ms against
the [documented 10-ms Free limit](https://developers.cloudflare.com/workers/platform/limits/#cpu-time).
