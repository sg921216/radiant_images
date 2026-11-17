# Implementation evidence: Radiant Images

## 2026-11-17 — Supplied logo integrated locally

Implementation resumed on `9676d8a3b33b7647fcd595446720650a5b8319fe` with existing
uncommitted Spec Kit/toolchain files and `apps/web/assets/Logo.jpg`. Those existing
files were preserved. The requirements checklist passes all 16 items; the repository's
Git, ESLint and Prettier ignore rules already cover the detected setup.

The owner explicitly confirmed using `Logo.jpg` for the website during this pass.
The public header now uses the supplied logo instead of the text placeholder. The
original 1774 × 887 JPEG is unchanged. Responsive WebP derivatives are **5,600 bytes
(320 × 160)** and **14,808 bytes (640 × 320)**, with no EXIF/IPTC/XMP metadata. The
original **476,288-byte** JPEG is not referenced or shipped in the web build. Source
hash and reproducible generation instructions are in `apps/web/assets/README.md`.
[Vite asset imports](https://vite.dev/guide/assets.html) give the derivatives hashed
build URLs. The header reserves the 2:1 aspect ratio, exposes the full brand text as
the image alternative, retains its Home link and uses the existing responsive navigation.

Red/green and verification evidence:

- The component regression first failed because the brand link contained no accessible
  logo image (**1 failed / 3 passed**). After implementation, all four cases pass.
- The existing mobile performance test then failed with **Missing visible image transfer**:
  its response collector only tracked `/images/`, while the visible logo is a built static
  asset. The collector now uses the browser's image resource type, retaining the existing
  complete-body byte measurement, viewport selection and budgets.
- `pnpm check` passes formatting, lint, all TypeScript projects, **65 files / 305 tests**
  (96.57 seconds), and both production builds. The API build is a dry run. The final
  CSS blend adjustment was rebuilt and formatting/lint/tooling types were rechecked.
- The first browser selection passed 62 cases and failed 18. Sixteen could not start
  Firefox from the default cache. The existing `.wrangler/firefox-local.config.ts` points
  at the owner's previously installed pinned browser; its executable SHA-256 still matches
  the recorded `a8fa6c08d8a9e8cb961e74a626dd2f4c5064a853de38bcde3df3cb145ec44530`.
  No browser was installed and no security setting was changed.
- The other two initial failures were in the new logo test on WebKit: a pointer click
  does not ensure keyboard focus is inside the menu. The test now focuses the visible FAQ
  link before pressing Escape, then verifies menu closure and focus return. No product
  handler, timeout, retry or expectation was weakened.
- Final targeted runs pass **64/64 Chromium/WebKit desktop/mobile cases** and **16/16
  Firefox cases**, zero retries or skips. They cover inquiry success/failure/recovery,
  public/owner/questionnaire automated accessibility, SEO, built fallbacks and asset 404s.
  The new logo case checks 320/768/1001/1280-pixel layouts, decoded images, desktop center
  and link separation, mobile-menu operation, Escape focus return and Home navigation.
- Automated screenshots at 320 and 1280 pixels were inspected: the full logo is visible,
  its background blends with the cream header, and navigation does not overlap. This is
  agent visual QA, not the deferred manual accessibility or actual-device acceptance.
- Final repository privacy scanning passes (**487 files, zero blocked**) and the dependency
  audit reports no known vulnerabilities. Final artifact scanning passes **30 files,
  zero blocked**.

The corrected mobile profile passes **40 cold-cache samples**, five per public route
including the token-redacted questionnaire. Route median usable times are **1.848–2.550 s**;
the largest LCP sample is **2.404 s**, CLS **0.0545**, initial JavaScript **187,771 bytes**,
and above-fold image bodies **65,404 bytes**. All existing per-route/sample gates pass.
This remains the synthetic 60-image fixture with controlled providers and 200 ms CAPTCHA
readiness, not approved portfolio photography, live Turnstile, field INP or real-device
acceptance. Runner/browser details and all timings are retained in
`evidence/local-logo-mobile-profile-20261117.json`.

At **15:52 UTC**, the isolated frontend at `http://127.0.0.1:4273` was updated with the
same logo implementation and the documented private build variables. All **57 files**
in the staged copy matched their build hashes before activation. The prior copy remains
at `.wrangler/private-browser/web-client-before-logo-20261117` for rollback. Only the local
frontend gateway was restarted; the API gateway and deployed API were not changed.
All four gateway/inspector ports still bind only to `127.0.0.1`.

All **19 read-only HTTP checks** pass: the seven prerendered routes contain the logo,
both responsive variants serve byte-identical WebP, private deep links retain noindex and
no-referrer, source/missing assets remain 404, foreign Origin/Host and cross-site requests
return 403, and anonymous owner API access returns 401. The Host probe uses raw HTTP
because Node fetch does not preserve that supplied header. The normal synthetic-origin
build was restored afterward; the isolated private copy remains independent. Sanitized
checks, source/asset hashes and test counts are in
`evidence/local-logo-implementation-20261117.json`.

The source changes are uncommitted and have no new remote CI result. Provider configuration
and live acceptance data are unchanged. No live messages or human timing attempts were
started. **56/67 tasks remain complete**: T001, T023, T025, T057,
T058, T060, T061, T063 and T065–T067 retain their recorded external/deferred requirements.
Approval of this logo does not approve the remaining launch content or close T063.

## 2026-11-17 15:31 UTC — CI passed and private build updated

GitHub Quality run [44108958097](https://github.com/sg921216/radiant_images/actions/runs/44108958097)
passes for `aebde5d5b47a7209b32d8f274276d72948814925`, matching the current source checkout.
The required formatting, lint, type, dependency/privacy, unit-test, build and full browser
matrix steps pass. The run completed at **15:18:59 UTC**. Run/job API evidence is retained
in `evidence/github-ci-private-update-20261117.json`; this check does not claim remote test
counts or head/merge tree equality because the job log was not available anonymously.

The private acceptance API was dry-run validated and deployed at **15:27:54 UTC** as
version `5684931a-d5f1-4ff7-9055-8eba1210904a`. Its bindings, secret names, compatibility
date, schedules and observability settings are unchanged. No secrets or migrations were
applied. The frontend was rebuilt with the documented loopback settings, copied into the
isolated private directory and both local gateways restarted. The copied files match the
build byte-for-byte. The previous Worker version and local frontend archive are recorded
for rollback in `evidence/private-build-update-20261117.json`.

All **20 read-only HTTP checks pass**: seven public routes, owner/questionnaire fallbacks
and private headers, missing-asset 404, bootstrap/CORS, anonymous owner 401, foreign
Origin/Host and cross-site fetch 403 on both gateways, and the current questionnaire asset.
All four gateway/debug listeners bind only to `127.0.0.1`. Worker public/preview ingress,
custom domains/routes and both R2 public endpoints remain disabled. The after-update audit
retains **3 clients, 6 client emails, 4 invitations/responses, 1 checklist item, 3 checklist
states and 20 inquiry sends**. The settings update timestamp is unchanged. These are
aggregate preservation checks, not a full database diff. No live messages were sent.

The required-answer feedback fix is now present in the private API/frontend. A visible
browser retest remains deferred with all manual testing; no owner attempt has started.
Task completion stays **56/67**. Google production and final content remain deferred.
Replace the temporary Gmail consent before **2026-11-23 at 9:28 p.m. Eastern**.

## 2026-11-17 — Manual testing deferred; required-answer feedback fixed locally

The user requested holding manual testing until the end and continuing useful non-manual
work. `owner-timed-01` was prepared but **never started**; zero owner attempts enter the
timing denominator. Owner/participant usability, representative screen-reader and manual
browser/device checks remain deferred alongside the existing Google production and final
content deferrals. T057/T061/T063 are not closed by automated evidence.

A specific finding from the live questionnaire checks was reproduced automatically:
submitting an untouched required answer displayed “Invalid input: expected string,
received undefined.” The shared answer schema now gives missing required answers the
existing human-readable “Please answer this question” message. The customization applies
only to absent required answers, preserving optional answers, type checks, length limits
and snapshot choice validation. It uses the documented per-schema error customization
([Zod error customization](https://zod.dev/error-customization)).

Red/green evidence:

- The enhanced web regression failed for all three question kinds (short text, long text,
  single choice), reproducing the raw schema message: **3 failed / 1 passed**.
- The API regression separately failed on the same missing-answer message: **1 failed**;
  seven unrelated cases were unselected in that diagnostic command, not quarantined.
- After the shared-schema fix, the focused web/API/shared workflow selection passes
  **17/17 tests**. The web cases verify focused error summaries, accessible field error
  text, no invalid POST, a corrected valid submission and no repeat-submit control.
- The complete local suite passes **65 files / 305 tests** (`pnpm test`, 98.35 seconds).
  Whole-repository lint, type checking and the production build also pass. The API build
  is a dry run; the web build generates all seven public routes and SPA fallback.

At this earlier checkpoint, the fix was uncommitted and outside the green GitHub run for
`7b6e88c`; the live API and isolated frontend were unchanged. The 15:31 UTC checkpoint
above supersedes that deployment status after the `aebde5d` commit and passing CI run.
Recheck the updated build during the eventual manual pass.
Task completion remains **56/67**; this improves existing T057/T061 acceptance work.

## 2026-11-17 13:50 UTC — Settings acceptance and checklist removal complete

The user approved the pending CAPTCHA and permanent test-checklist removal. Chrome was
used at its current window size. The current Turnstile check completed successfully;
`negative-stale-01` was submitted through the form at **13:43:59.061 UTC**. The refreshed
form rejected the removed location and displayed “Please check the highlighted fields”
and “Choose a current location” at **13:44:04.734 UTC**. First/last name, email, shoot type
and message remained intact. Shared client validation rejects this case before its API
call; no live HTTP error code is claimed. The read-only audit at **13:45:00.758 UTC** still
contains exactly **20 inquiry sends**, with the latest at **05:35:43.700 UTC**. The negative
case remains separate from both ten-case delivery cohorts.

This satisfies US5-AS3's rejected stale selection with reselect guidance. Existing green
API integration coverage independently verifies stale options return HTTP 400 without
dispatch. Quickstart step 20 now describes these two paths instead of implying that the
live browser must observe a `stale_option` HTTP code. Combined with the recipient delivery,
atomic invalid-settings/sender rejection and public-contact propagation evidence above,
**T046 is complete**. There was no executable-code change or new deployment.

The added synthetic checklist item was removed and saved at **13:46:01.543 UTC**. At
**13:46:14.210 UTC**, D1 verifies zero remaining rows for that master item and its states
across all three clients. Each client retains one item: Gmail remains complete, Yahoo and
the initialization client remain incomplete. Reloaded Gmail and Yahoo client pages show
only the retained, renamed item at **13:47:15.253 / 13:47:22.203 UTC**. This completes the
live checklist propagation/removal checks without resetting existing progress.

**56/67 tasks complete.** T057 still requires Rebekah's unassisted under-three-minute
workflow timing; the dashboard was prepared at **13:49:44.239 UTC**, but no owner timer has
started. T025/T061/T063 retain the participant, representative screen-reader, actual-device
and deferred-content gates. No screen-reader application appeared in the connected-app
inventory; that observation is not a screen-reader test or an installed-software inventory.
Public access remains disabled and Google production/final content remain deferred.

## 2026-11-17 13:35 UTC — Client delivery, isolation and questionnaire snapshots

Visible Chrome checks now cover three synthetic clients. Both designated inboxes received
their template email and first questionnaire invitation within 300 seconds: four accepted
and received messages, with conservative receipt bounds of **159.525–206.808 seconds**.
The Yahoo template email arrived in Spam; the other three arrived in Inbox. Both clients
submitted a questionnaire exactly once, reopened links showed completion without editable
answers, and the owner UI displayed each response under the correct client. Usable links
remain omitted from owner email history and retained evidence.

Checklist checks passed for separate client completion, propagation of a new incomplete
item to both existing clients, renamed/reordered labels without lost progress, repeated
save without duplicates/reset, and a third client starting with both items incomplete.
Permanent removal of the added checklist item still awaits the requested action-time
confirmation. The automated transaction-failure checks remain separate from live UI evidence.

An expanded two-question invitation reached Gmail Inbox in **88.296 seconds**. After its
response, changing prompts, question order and choice text/order preserved the original
snapshot and answers in both D1 and the owner UI. With explicit action-time confirmation,
the short-text master question was then deleted; the completed response still retained
both original questions and choices. A distinct invitation from the final master reached
Gmail Inbox in **180.529 seconds**, rendered only the revised single-choice question and
its revised options, exposed no owner history, and submitted successfully. D1 records one
response for each invitation. At **13:38:59.860 UTC**, the owner UI showed both completed
versions with their respective original/revised prompts, choices and answers. No uncertain
send was retried.

Actual Settings UI rejected an unverified sender with “Choose the Gmail identity or an
accepted send-as alias.” Read-only D1 verification confirmed the previous sender, recipient,
public contact, options and update timestamp were intact. A temporary location was added
and selected on a new Contact form, then removed/restored at **13:34:57.219 UTC**. The
already-open form marked it “no longer available” at **13:35:11.932 UTC** (a **14.713-second**
upper bound). The separate negative case `negative-stale-01` has not been submitted: its
CAPTCHA confirmation is pending, so server rejection and reselect feedback remain open.

The installed browser is **Chrome 157.0.8103.79 on Windows NT 10.0.26200.0**. A live FAQ
sample confirmed visible skip-link focus, keyboard access to main content and expandable
answers, and readable wrapping/visible focus at 200% zoom in a 587-pixel-wide native window.
This is partial manual evidence, not screen-reader, final-photo-alt or full N/N-1 device
acceptance. Browser screenshots and usable questionnaire URLs were not retained as artifacts.

At **13:25:55 UTC**, all four local gateway/inspector ports still listened only on
`127.0.0.1`; workers.dev and previews remained disabled with no Worker custom domains.
GitHub run `44011757954` was rechecked as successful for the unchanged workspace HEAD
`7b6e88c7407de21824908885586991a3b1135b0b`. Uncommitted gateway/evidence work remains outside
that remote run. See `evidence/private-browser-live-runs-20261117.json` for case timestamps.

T025/T046/T057/T061/T063 remain open. Outstanding evidence includes the stale-form Submit,
checklist removal, unassisted owner timing, preregistered participant cohort, representative
screen-reader review and actual release browser/device matrix. Agent-operated workflows
do not substitute for human timings. Google production and final content remain deferred;
temporary Gmail consent must be replaced before **2026-11-23 21:28 Eastern**.

## 2026-11-17 05:38 UTC — Changed-recipient run complete, 10/10 received

The predeclared changed-recipient run is complete: **10 submitted / 10 accepted / 10
received**, with all Submit-to-receipt timings below 300 seconds and no send retries.
Yahoo placed **3 in Inbox and 7 in Spam**. Exact receipt headers for four cases and
timestamped, exact-case mailbox observations for six cases establish timings of
**1.745–254.786 seconds**. Provider acceptance is separately corroborated by ten sanitized
`inquiry.send` audit events. The final five were submitted within the 05:30–05:40 UTC
window, respecting the five-per-window limit.

Both initial and changed-recipient SC-002 runs now pass their delivery/timing gate.
Yahoo's Spam classification remains an explicit delivery-quality finding; messages were
not moved or resent to improve the result. T046 still needs the actual stale-form check,
and T025/T057/T061/T063 retain their other manual, human/device and deferred-content gates.

## 2026-11-17 05:27 UTC — First five changed-recipient receipts verified

The changed-recipient run has **5 submitted / 5 accepted / 5 received** of ten predeclared
cases, with no retries. Yahoo placed updated-04 in Inbox and updated-01/02/03/05 in Spam.
The initial Inbox and Spam search results missed the four Spam messages; direct folder
inspection and exact case IDs resolve the earlier delivery uncertainty. Yahoo raw-message
receipt headers establish Submit-to-receipt times of **2.059, 1.745, 2.468 and 3.192 seconds**
for updated-01/02/03/05 respectively. Updated-04's timestamped Inbox observation provides a
**145.367-second upper bound**. All five meet the 300-second receipt budget, while Spam
classification remains a practical delivery finding. SPF, DKIM and DMARC pass on all four
inspected Spam messages. No messages were moved, resent or excluded from the denominator.

Only sanitized timestamps, case IDs, authentication outcomes and folder labels are retained
in the live-run ledger; raw mail/session URLs are not stored. Updated-06 through updated-10
remain unsubmitted at this checkpoint. T046 and the broader human/device gates remain open.

## 2026-11-17 05:04 UTC — Private settings and access reverified

Actual owner-browser settings checks passed. An invalid public-contact address combined
with a draft recipient change produced “Nothing has been changed”; read-only D1 checks
confirmed that recipient, sender and public contact all retained their original values.
A subsequent valid save changed only the private inquiry recipient to the designated
second inbox, with the sender and public contact unchanged.

An independent synthetic public-contact change appeared in an already-open Contact page
after **16.305 seconds**, within the 60-second budget. The original synthetic placeholder
was restored. At **05:04:23.741 UTC**, D1 booleans confirm the changed private recipient,
unchanged sender and restored public contact. No private mailbox address was published.
The same checkpoint confirms workers.dev and previews disabled and zero Worker custom
domains. Following the desktop-app restart, both local gateways were restarted and their
listeners verified on `127.0.0.1` only.

The changed-recipient run remains unsubmitted at this checkpoint. Native Chrome controls
are usable despite the unavailable browser-extension host; URL-guard interruptions have
required resuming and rebuilding unsent forms. Settings stale-form behavior, changed-inbox
receipt evidence, clients/questionnaires and human/device gates remain open. Detailed
timestamps are retained in the live-run ledger.

## 2026-11-17 04:44 UTC — Initial healthy-provider run passes 10/10

The predeclared initial run is complete: **10 submitted / 10 accepted / 10 received**.
All ten distinct case IDs are visible in the designated recipient's Gmail Inbox. Every
started submission succeeded without a send retry. Submit-to-observed-receipt upper bounds
range from **28.869 to 151.182 seconds**, all below 300 seconds. Separate `inquiry.send`
audit events record provider acceptance for all ten; mailbox observations establish receipt.
The final five were submitted in the 04:40–04:50 UTC window, preserving the five-per-window
limit. The ledger retains all timestamps and conservative observation-based timings.

This satisfies only T025's initial SC-002 live-delivery run. The changed-recipient run,
client/questionnaire delivery, unassisted owner/participant timings, physical-browser/device
matrix, manual accessibility and deferred content/Google production gates remain open.

## 2026-11-17 04:36 UTC — First five live inquiry receipts verified

Visible Chrome Incognito is accessible through Windows Computer Use. The browser extension
host remains unavailable. The actual owner dashboard and the designated initial recipient's
Gmail mailbox are visible. Five distinct predeclared inquiries have been submitted through
the real form and real Turnstile, accepted by the deployed API, and found in the recipient
Inbox: **submitted 5 / accepted 5 / received 5**, of the declared ten. No send retries were
performed. Interactive CAPTCHA checks were completed by the user or after action-time
confirmation. Native-control URL/geometry interruptions did not trigger additional sends.

Case-order Submit-to-observed-receipt upper bounds are **32.310, 65.280, 28.869, 67.797,
126.603 seconds** for initial-01 through initial-05. These are timestamped mailbox
observations, not exact message-server arrival times. Separate sanitized D1 audit timestamps
corroborate provider acceptance. Every started submission remains in the declared run;
initial-06 through initial-10 and the changed-recipient cohort remain unsubmitted at this
checkpoint. Full details are in [the live-run ledger](./evidence/private-browser-live-runs-20261117.json).

The 04:25 UTC ingress recheck confirms workers.dev and previews disabled and zero Worker
custom domains. Public access remains disabled. T025/T046/T057/T061/T063 remain open;
agent-operated tests do not satisfy the unassisted owner or participant/device gates.

## 2026-11-17 04:12 UTC — Owner Google login verified

The owner reports that login now works. Read-only production D1 verification at
**04:12:24.922 UTC** finds one owner session, created at **04:10:00.220 UTC** and last used
at **04:11:03.344 UTC**, with its absolute expiry still in the future. Only aggregate session
counts/times were read; no bearer, token hash, identity grant or owner email was retrieved.
This corroborates the owner's successful dashboard report and resolves the earlier
`redirect_uri_mismatch` blocker. It does not establish logout/expiry or non-owner acceptance.

The configured sender and initial recipient match their designated values (verified as
booleans). There are no inquiry/client-email audit records, clients, client-email history
rows or questionnaire invitations yet. Both predeclared ten-inquiry runs remain unstarted.
Loopback web/API listeners remain bound to `127.0.0.1`. Browser-control inventory still
contains no browsers, and no mailbox connector is available. The remaining execution
dependency is browser access or owner-assisted live form/receipt observations, not more
infrastructure provisioning. Public access, deferred production/content work and the
November 23, 21:28 EST temporary-consent replacement deadline remain unchanged.

## 2026-11-17 — CI passes; controlled browser access prepared

The owner authorized the focused sequence T025/T046/T057/T061/T063, selected this Windows
computer for loopback testing, designated two receiving inboxes, and identified the Google
owner account. Actual addresses are retained in ignored `.env.acceptance` and the private
Worker secret/configuration, not in this evidence. The first designated inbox is the initial
inquiry recipient, the second is the changed recipient, and distinct synthetic clients will
exercise both. No real email has been sent at this checkpoint.

[Quality run 44011757954](https://github.com/sg921216/radiant_images/actions/runs/44011757954)
completed successfully at **04:00:35 UTC** on `7b6e88c7407de21824908885586991a3b1135b0b`.
The PR checkout `eda500f319509609c79cc4f7b8e9681d8f75a506` has the same tree. All quality,
security, build and privacy steps pass: **64 files / 292 tests; 163 browser/performance
passes across five projects; 12 declared non-target performance skips**. No functional
quarantine or warning is recorded. [Sanitized CI evidence](./evidence/github-ci-r30-20261117.json).
The new gateway work below is uncommitted local work and is not covered by that remote run.

`scripts/private-browser/` provides local web/API gateways with exact loopback host and
Origin checks. Only browser top-level GET navigations may arrive from Google/mail; other
cross-site requests are rejected. The API uses a remote service binding to the existing
`radiant-images-api`, preserving its authentication, CORS, cookies and responses without
credential injection, redirect following or retries. Both serving and inspector ports
4273/8793/9254/9253 bind only `127.0.0.1`. The frontend build is copied to an ignored isolated
directory so ordinary CI/local builds cannot silently replace the active acceptance UI.
No gateway is deployed and no tunnel is used. [Cloudflare remote bindings](https://developers.cloudflare.com/workers/local-development/).

The persistent API now uses web `http://127.0.0.1:4273` and API
`http://127.0.0.1:8793` origins. A managed Turnstile widget is restricted to `127.0.0.1`
and its secret plus the selected `OWNER_ALLOWLIST` are installed server-side. Existing
Gmail/auth/rate-limit secrets remain. Normal five-minute and 03:00 UTC schedules remain.
Automatic invocation logging and traces are disabled before tokenized browser workflows;
sanitized application logs and independent R2/GitHub monitoring remain enabled.
Invocation logs include request URLs; see [Cloudflare logging](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#invocation-logs).
Final reads confirm workers.dev/previews disabled, no Worker custom domains, and both R2
managed public endpoints disabled with no custom domains. No public launch occurred.

The first bootstrap check returned **500 `content_unavailable`** because the private
operational environment had no pricing/pages/FAQ. A guarded, transactional 14-statement
initialization adds labelled private-test content and the selected initial inquiry recipient,
preserving the verified sender and synthetic public recovery address. It creates no client
or owner-session data and does not constitute final content approval. Bootstrap now returns
200 with four pages, four FAQs, three test packages and zero gallery images. Exact-origin
CORS works; sender/recipient stay absent from public config. Unauthenticated owner reads
return 401, untrusted Origin and rebound Host probes return 403.

Local red/green evidence: the initial forwarding stub fails six host/origin boundary
assertions; the guard passes all nine cases. Two additional regressions first fail for
top-level questionnaire/email and Google callback navigation; the narrowed navigation
exception then passes. Final focused command
`pnpm exec vitest run scripts/tests/private-browser.test.ts scripts/tests/web-worker.test.ts scripts/tests/security-headers.test.ts --project tooling`
passes **15/15 tests**. Tooling typecheck, whole-repository lint/format, both gateway dry runs,
production web build and source privacy (480 files, zero blocked) pass.

**Current blocker:** the owner reached Google and reported `400 redirect_uri_mismatch`.
The existing OAuth client needs `http://127.0.0.1:8793/auth/google/callback` added to its
authorized redirects while preserving the prior Gmail-consent callback. Browser control
reports no available browsers, so the owner is completing this console change. Owner login
is not yet a pass. Real Turnstile success/replay, inquiry and client/questionnaire receipt,
settings propagation, human timings and manual screen-reader/device checks remain pending.
[Setup evidence](./evidence/private-browser-setup-20261117.json) and
[predeclared mail ledger](./evidence/private-browser-live-runs-20261117.json) retain these limits.

The mail ledger declares **10 initial + 10 changed-recipient inquiries**, all started attempts
in their respective denominators, no automatic retries, and independent mailbox timestamps.
Respect the shipped five-per-IP/600-second inquiry window; do not reset counters or rotate
identities to accelerate acceptance. Each message must arrive within 300 seconds of its own
Submit. Negative tests remain separate. Actual human recruitment and the full release-time
N/N-1 device matrix are still required; neither automation nor this loopback setup satisfies
them. **55/67 tasks complete; T025/T046/T057/T061/T063 remain open.** T065–T067 and final
content stay deferred; replace Testing Gmail consent before **November 23, 21:28 EST**.

## 2026-11-17 03:29 UTC — Scheduled alert received and recovery verified (R-30 final testing checkpoint)

**The five focused private operational checks pass.** The owner explicitly confirmed
**“Received scheduled alert”** for the actual scheduled failure below, separately from
the earlier manual test. The persistent environment and normal schedules remain active;
all public API/R2 ingress remains disabled. Broader production/release acceptance is not
closed: Google Testing consent is temporary and T065–T067 remain deferred (55/67 tasks).

- [Scheduled fault run 44010000756](https://github.com/sg921216/radiant_images/actions/runs/44010000756) has `event: schedule`, actor `sg921216`, and creation time **03:24:37 UTC** for the normal **03:17 UTC** slot. It fails at the real S3 monitoring step with the expected sanitized read-failure message; the synthetic notification shortcut is skipped.
- The bounded helper restores `RECOVERY_BUCKET=radiant-images-recovery` before [recovery run 44010074349](https://github.com/sg921216/radiant_images/actions/runs/44010074349), created at **03:25:13 UTC**. This recovery is a manual dispatch and succeeds with `ok: true`, no issues and 2,856 recovery bytes.
- The owner confirms the scheduled notification at the final 03:29 UTC recording. GitHub's late creation is retained as observed scheduling latency, not represented as an exact-minute delivery guarantee.
- Final reads at 03:27 UTC confirm hourly monitoring enabled, the correct recovery bucket, no active test fault, only `radiant-images-api` remaining, both Worker public subdomain modes disabled, no Worker custom domains, and both R2 managed/custom public paths disabled/absent. Normal five-minute and 03:00 UTC crons remain unchanged. The temporary proxy/operator and local refresh-token copies are gone; the one-time fault helper exited successfully.

The actual normal daily cron/Gmail evidence is recorded immediately below. Independent
post-test S3 reads still show healthy maintenance, verified Gmail, three valid backups
totaling 2,472 bytes and no overdue recovery/receipt cleanup. No Gmail message was sent;
notification receipt concerns the explicitly requested GitHub monitoring alert.

Usage reconciliation through **03:25:04 UTC** records **70 DO calls** (67 automatic
maintenance, one automatic daily operation and two manual daily operations), all `ok`.
Account and namespace GraphQL counts both report 27 on November 16 and 43 on November 17,
with zero errors; periodic totals agree to meaningful precision. Maximum observed scheduled
front CPU is 1 ms and DO CPU is 49 ms. November 14/15 history remains absent. A fresh,
separate Billing Read query still returns only seven older R2/Images records and cannot
establish current DO usage. The [Cloudflare investigation packet](./evidence/cloudflare-do-investigation-20261116.md)
retains that historical gap without treating missing data as zero consumption.

[Sanitized final evidence](./evidence/cloudflare-private-operations-20261116.json) includes
the scheduled event, failure log check, restoration, healthy recovery log, owner receipt,
final privacy/configuration reads and usage reconciliation. The Gmail primary-address
fix passes 33 focused tests, API typecheck, focused lint and source formatting; the consent
helper additionally rejects partial grants. Source privacy and whitespace checks pass.

## 2026-11-17 03:01 UTC — Normal daily cron and Gmail health verified (R-30 follow-up)

The actual `0 3 * * *` Cloudflare cron ran on version
`5868ab73-0666-4598-a8dc-dd759e9579ff`; the temporary operator was already removed and
no manual invocation was made for this observation. The backup finished with read-back
verification at **03:00:07.819 UTC**, and real Gmail health at **03:00:08.372 UTC** is
`verified`, with all three failure counts zero. Independent S3 reads find three valid
backups totaling 2,472 bytes and a healthy overall recovery inventory of 2,856 bytes.

Persisted Workers Observability confirms the real scheduled front event (record
`01M7KQ559B000000000000000A`) and its production DO call
(`01M7KQ5586000000000000005X`), sharing trace `eefed8024d054b0ed6ea52fe054202a7`.
Both return `ok`; front CPU is 0 ms at provider resolution, DO CPU 37 ms, wall times
4,074/4,058 ms. The following five-minute maintenance cron also succeeds, with front/DO
CPU 0/12 ms and a completion signal at 03:01:01.100 UTC. This is actual normal scheduled
execution and live Gmail verification, distinct from the earlier manual/synthetic evidence.

The 03:17 UTC scheduled monitoring fault, owner notification receipt and subsequent
recovery are still pending. Long-lived Google production consent remains T065–T067;
the current seven-day Testing grant is not a production-consent completion.

## 2026-11-17 02:38 UTC — Gmail health and manual monitoring cycle pass (R-30 follow-up)

The owner's repeated Testing consent grants both `gmail.send` and `gmail.settings.basic`.
Refresh and send-as lookup return 200, identifying the configured mailbox as the primary
address. This exposed a real-provider bug: `senderVerification` required
`verificationStatus=accepted`, but Google's `verificationStatus` applies only to custom
aliases. `apps/api/src/services/email.ts` now accepts a matching address with Google's
read-only `isPrimary=true`, while custom aliases still require accepted verification.
Pending, missing-status, malformed-primary and nonmatching addresses remain rejected.
[Google SendAs field semantics](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs).

Two regression assertions failed before the fix (provider primary lookup and the persisted
health signal); **33/33 tests across providers, operations, config, consent and monitoring**
then passed. API typecheck, focused ESLint and changed-source formatting pass. The patched
API was deployed privately as `40bd0e33-0229-4ce9-9d53-fd5886453202`; provisioning the three
Google/Gmail secrets produced active version `5868ab73-0666-4598-a8dc-dd759e9579ff`.
Existing AUTH/RATE_LIMIT secrets remain. Both public subdomain modes remain disabled and
the normal cron expressions are unchanged. This is a new tested source patch, not the
unchanged-source assertion from the earlier R-30 checkpoint.

Private settings now contain the owner-selected sender; unrelated inquiry/public-contact
addresses remain deliberately invalid acceptance placeholders, with private fixture choices.
No public contact address or final copy was inferred or published. A manual production DO
invocation completed maintenance, read-back-verified a new 930-byte backup, and wrote
**`gmail: verified` at 02:33:56.882 UTC**, with zero inquiry/auth/image failures. Two retained
backups total 1,542 bytes; the monitor's complete recovery inventory totals 1,926 bytes.
No Gmail message was sent. Both temporary local refresh-token files were removed after
live verification; the valid token is stored as a Worker secret. The Testing grant was
obtained about **November 17 02:28:55 UTC** and is temporary (seven-day lifetime, approximately
November 24 02:28 UTC / November 23 21:28 EST). T065–T067 remain deferred production work.

Authenticated S3 monitoring now returns `ok: true`, no issues and no overdue cleanup.
GitHub hourly monitoring is enabled with the verified bucket-only read credentials:

- [Healthy run 44003968086](https://github.com/sg921216/radiant_images/actions/runs/44003968086): success; real S3 monitor reports `ok: true`.
- [Controlled fault 44004156968](https://github.com/sg921216/radiant_images/actions/runs/44004156968): the real monitoring step fails after temporarily changing only the repository bucket variable to a nonexistent acceptance target.
- [Recovered run 44004223073](https://github.com/sg921216/radiant_images/actions/runs/44004223073): success after restoring `RECOVERY_BUCKET=radiant-images-recovery`; real monitor reports `ok: true` again.

The bounded fault helper restores the correct configuration in `finally`; restoration and
enabled monitoring were read back. No recovery object or application resource was altered
for this fault. These three runs are **workflow_dispatch**, not scheduled-run evidence.
The actual 03:00 UTC daily backup and 03:17 UTC scheduled alert/receipt checks are pending.
The workflow ran default-branch `d4e8aee8cfc172c6e91ba4838fe648cd17f9ce61`; its real checker
matches local source, while the feature branch's newer pinned action references remain
separate. No new full CI/browser result is inferred. **55/67 tasks complete; T001/T058 open.**

## 2026-11-17 02:27 UTC — Recovery credentials verified and staged (R-30 follow-up)

The owner saved the new R2 S3 credentials in the ignored `.env.recovery-monitor` file.
Direct S3 checks with that pair return **200** for recovery listing and **403** for
`radiant-images-media` listing, unrelated `radiant-001` listing and an empty uniquely named
write probe to the recovery bucket. No probe object was created. The real monitor also
reads all fixed operational signals and recovery metadata successfully; its sole issue
is **`gmail_unavailable`**, with no overdue recovery/receipt cleanup and 999 recovery bytes.
These are authenticated provider checks, not mocks. The owner-reported expiration is
November 16, 2027; rotate the credential before that date.

The exact verified pair was uploaded through GitHub's encrypted-secret API and both
`R2_MONITOR_ACCESS_KEY_ID` and `R2_MONITOR_SECRET_ACCESS_KEY` are now present. The repository
bucket variable names `radiant-images-recovery`. **`OPERATIONS_MONITOR_ENABLED=false`**
is retained until a healthy baseline is established; GitHub execution and scheduled
notification receipt remain unverified. No Billing Read credential was accessed or reused.
The repeated Gmail consent is still pending: neither a new consent token file nor a
refresh-token value in `.env.acceptance` is present. The earlier send-only token remains
undeployed. T001/T058 and the deferred production-consent tasks remain open (55/67 complete).

Workers Observability now records **56 automatic maintenance calls and 57 production DO
calls**, including the initial manual daily operation, all `ok`. Maximum front CPU is 1 ms;
the maximum DO sample is still the initial 49-ms manual call. GraphQL reports 27 requests
on November 16 and 30 on November 17, zero errors, with identical account/namespace counts
and periodic sums. November 14/15 rows remain absent. This supports the active environment's
execution/reporting agreement while retaining the historical investigation gap. The first
normal daily backup is still due at **November 17 03:00 UTC / November 16 22:00 EST**.
Sanitized results are appended to
[the operational evidence](./evidence/cloudflare-private-operations-20261116.json).

## 2026-11-16 — Persistent private operational environment (R-30)

**23:04 UTC private-testing follow-up:** At the owner's request, the remaining Google
homepage/privacy, Branding/Production and fresh production-consent work is explicitly
deferred as T065–T067. **55/67 tasks complete; 12 open.** The owner obtained a Testing
grant at 22:58 UTC, but live validation refreshed it successfully with only `gmail.send`;
`gmail.settings.basic` was absent and the send-as lookup returned 403. This is incomplete
consent, not a Gmail-health pass. The incomplete token was preserved in an ignored local
secret file, never deployed; a new consent attempt requesting both permissions is pending.
The local consent helper now checks both granted scopes before saving a token or returning
success; a regression reproduces rejection of partial grants and preservation of an
existing token. Both tooling tests and tooling typecheck pass. No message was sent.

Read-only Workers Observability now records 15 successful automatic maintenance calls
plus the initial manual daily DO call (16 DO calls total). All recorded outcomes are `ok`;
automatic front CPU is 0–1 ms and maintenance DO CPU is 12–19 ms. The 23:04 GraphQL query
reports 16 requests and zero errors in both account-wide and namespace aggregates, with
matching periodic sums. The earlier current-environment cross-query difference has
resolved at this observation; November 14/15 history remains absent and is retained in
the Cloudflare investigation packet. Daily cron execution still awaits 03:00 UTC.

The owner is creating `radiant-images-recovery-monitor` with the single recovery bucket's
`Workers R2 Storage Bucket Item Read` policy and reports expiry November 16, 2027.
Record rotation before that date; actual credential scope and GitHub activation remain
pending until the new S3 pair is saved and tested.
Follow-up validation also passes focused ESLint, repository formatting and the privacy
gate (471 files, zero blocked); task IDs are unique with the 55/67 count confirmed.
The temporary private operator prepared for the next health check was removed at
23:10 UTC while credentials remain pending; the provider inventory again contains only
the persistent API Worker. Normal schedules and persistent D1/R2 resources remain active.

**Google consent follow-up:** The owner reports that External production publication is
blocked until Branding has a valid app name, support email, homepage URL and privacy-policy
URL. Long-lived Gmail consent therefore has an explicit branding/privacy dependency despite
the remaining operational work proceeding separately from final site content. Testing with
the intended mailbox added as an approved test user can support temporary acceptance, but
its Gmail refresh token expires after seven days. No successful consent, token provisioning,
public page publication or Gmail-health pass is inferred. Quickstart records the corrected
procedure; T001/T058 and the task count remain unchanged.

**Private infrastructure is established; operational acceptance remains incomplete.**
The owner explicitly requested this setup while privacy copy/photos proceed separately.
The existing application source at `fb67738294d9b7c84f7c665516d8dd22595b8b4f` is unchanged
from the tested `c23c943` API/shared source. No public release or real email send occurred.

The new `apps/api/wrangler.acceptance.toml` deploys `radiant-images-api` with all four
production SQLite Durable Object classes, the dedicated `radiant-images` D1 database and
private `radiant-images-media` / `radiant-images-recovery` buckets in ENAM. All three
migrations are applied. API reads verify workers.dev and preview URLs disabled; account
Worker custom domains are empty. Both buckets have managed public access disabled and
no custom domains. The configuration has no routes. These resources are intentionally
long-lived; do not apply the historical disposable-rehearsal cleanup to them.

The normal schedules are configured: maintenance every five minutes and backup/health
at **03:00 UTC daily** (22:00 New York during EST). A temporary private operator invoked
the existing production `ScheduledOperations` DO once, without a provider double:

- Maintenance completed at **21:43:54.646 UTC**.
- Backup completed and read-back verification passed at **21:43:56.365 UTC**. The initial
  empty-data backup is 612 bytes; metadata records 28-day expiry at December 14 21:43:55.283.
- Health at **21:43:56.674 UTC** correctly reports `gmail: unavailable`, with zero
  inquiry/auth/image failures. The long-lived database has no client/content fixtures.
- The independent local binding observer, using the shipped monitor logic and actual R2
  inventory, reports only `gmail_unavailable`; recovery totals 999 bytes at observation.
  This is not the S3/GitHub transport acceptance.
- The daily invocation above is **manual production-DO evidence**, not proof that the
  configured daily cron has fired. Its first 03:00 UTC opportunity is November 17.
  Two actual `*/5 * * * *` invocations were subsequently captured at **21:51:00.042**
  and **21:56:00.236 UTC**, both `ok`, with zero-ms front CPU at provider resolution.
  Their production DO calls report 16/12 ms CPU, 1,645/1,837 ms wall time and no exceptions.
  The first automatic maintenance completion signal is 21:51:01.677 UTC.

The saved Google/Gmail values in `apps/api/.dev.vars` are placeholders and remain so.
The owner asked which environment and requested complete setup instructions; a separate
ignored root `.env.acceptance` template now holds the real-environment setup fields. Real client
credentials, refresh-token consent (`gmail.send` and `gmail.settings.basic`), and the
intended sender address were requested through the existing ignored-file workflow.
The old `.env.recovery-monitor` credential returns 403 listing the new recovery bucket.
Account token management also returns 403 (code 9109); fresh bucket-only Object Read Only
S3 credentials were requested. The Billing Read credential was neither accessed nor reused.

GitHub repository configuration is staged with `RECOVERY_BUCKET=radiant-images-recovery`,
the account-ID secret and **`OPERATIONS_MONITOR_ENABLED=false`**. The two R2 secrets remain
absent. The workflow was disabled/re-enabled as authenticated `sg921216` to establish the
intended scheduled actor; this does not prove notification preferences or receipt. No
failure notification was dispatched in this setup. The default-branch checker and lockfile
match local source; its workflow still has older action references, while the updated pinned
workflow remains on the feature branch. Healthy/fault/recovered and scheduled receipt
remain unverified pending real credentials/Gmail health.

The active namespace's account-wide and namespace-specific GraphQL aggregates were empty
at 21:48 without API errors while tail and persisted Workers Observability proved execution. The initial
production DO sample reports `ok`, 49 ms CPU, 4,462 ms wall time and no exceptions. Dataset
settings were rechecked at 21:51 UTC: enabled, 90-day lookback, 32-day query range and
10,000-row limit. At **21:57:18 UTC**, namespace aggregates began reporting **three requests**,
matching the three captured production DO calls, with zero errors. The broader account query
returned two requests and still no November 14/15 rows. This is partial reporting recovery;
cross-query ingestion delay/sampling and historical missing usage remain unresolved. The
[Cloudflare investigation packet](./evidence/cloudflare-do-investigation-20261116.md)
is prepared, not submitted; missing usage is not counted as zero consumption.

Validation: explicit-config deployment dry-run succeeds; Wrangler-generated acceptance
bindings agree with the existing types; API typecheck passes; **21/21 focused tests across
four operations/monitor/release-gate files** pass. The source privacy gate checks 471 files
with zero blocked; `git diff --check` passes. No application behavior changed, so the prior
full CI/browser evidence remains separately identified rather than claimed as a new run.
See [sanitized operational evidence](./evidence/cloudflare-private-operations-20261116.json)
for versions, privacy settings, scheduler results, GitHub status and metering queries.
The temporary operator was deleted and its absence verified at 21:57 UTC; the local
proxy and tail stopped. Only the persistent API Worker remains; D1/R2/DO resources and
normal schedules stay active.

**55/67 tasks complete; 12 open. T001/T058/T060/T063/T065–T067 remain open.** Public ingress,
final content/privacy/photos and broader real-provider/human release gates remain pending.

## 2026-11-16 — T001 committed guard and paginated provider rehearsal (R-29)

**T001 remains open; 55/64 tasks complete.** Tested the committed `c23c943` application
against disposable real D1/R2/Images resources with public ingress disabled. After seeding
1,501 small recovery keys, all four application cases pass: unauthorized refusal and PNG,
10 MiB JPEG and detailed 40-megapixel JPEG upload/read/private-original/delete journeys.
A separate four-case warm-up also passes. The production backup helper verifies a
17-table snapshot against a 1,531-object, two-page recovery inventory.

All 92 tail records report `ok`: 63 front samples at maximum 7 ms CPU; 12 gallery DO samples
at 195 ms; 12 bulk-read DO samples at 7 ms; four JPEG validator samples at 1,300 ms; one
diagnostic backup DO sample at 31 ms. This advances real pagination/CPU evidence, not
six-GiB/max-page capacity, peak memory, production cron or complete account metering.

The owner reports the Durable Objects dashboard displays zero usage for November
14–December 14. API invocation/periodic/SQL-storage datasets remain empty despite direct
execution proof. These are recorded as a metering discrepancy, not zero consumption.
GitHub confirms the persistent monitor remains unconfigured. T058 activation and scheduled
notification delivery remain open.

All temporary objects, Worker, five DO namespaces, D1 and both buckets were removed and
absence verified; the original bucket remains. Local proxy/tail stopped and temporary
credentials removed. No public release, paid-plan change or email send occurred.

Exact-head [Quality run 43953953193](https://github.com/sg921216/radiant_images/actions/runs/43953953193)
**passes**: formatting/lint/types, security checks, **290 tests in 64 files**, both builds,
and **163 browser/performance checks across five projects**. Twelve expected skips avoid
rerunning three performance profiles on their four non-target projects. No warnings;
source/diagnostic privacy checks both pass. The tested PR merge tree is identical to
`c23c943`; [CI evidence](./evidence/github-ci-r29-20261116.json) records that comparison.
The changed-source CI gate is resolved. Metering and persistent monitoring remain open.
[Detailed R-29 evidence](./evidence/cloudflare-t001-r29-20261116.json) links the application
reports, source hashes, sampled metrics and cleanup results. New edits are documentation
and evidence only; no application behavior changed during this checkpoint.

## 2026-11-16 — T001 storage admission and daily usage (R-28)

**T001 remains open; 55/64 tasks complete.** Owner dashboard confirmation resolves
Images Free plan selection. Successful GraphQL queries now supply daily Workers/D1
usage: November 14/15 requests 715/1,890, D1 reads 1,234/94,023 and writes 698/2,511.
All returned daily observations are below included allowances. Missing DO aggregates
remain missing data, not zero consumption; Workers disconnect counts remain disclosed.

Implemented a combined MEDIA/RECOVERY admission check before image processing and
backup export. It requires room within six GiB minus 32 MiB headroom for the bounded
new write; inventory failures also refuse. Uploads return 503 with
`storage_capacity_unavailable`; backup failures enter the existing scheduled-failure
path. Reads, deletion and recovery processing remain available. This closes the
previous “warn but continue writing” path without claiming an atomic/account-wide cap.

| Validation | Result |
| --- | --- |
| Red step | Exhausted/unreadable storage still admitted uploads (201); exhausted combined storage still created a backup. Fixed after observing those failures. |
| Full local check | Formatting, lint, types, 64 files / 290 tests and both builds pass. |
| Browser regression | Chromium desktop gallery: 2/2 pass, zero retries; upload/edit/reorder/delete and 60-image responsive/filtering journeys. |
| Live scoped guard probe | 34/34 private checks against real R2 succeed; ten DO tail samples at 1 ms CPU, ten front samples at 0 ms reporting resolution; all outcomes `ok`. |
| Provider limits | Probe uses the production helper, empty buckets and a synthetic DO counter. Large/paginated/error inventories are covered locally; this is not full application acceptance. |
| Cleanup | Probe Worker, DO namespace and both buckets absent; original bucket preserved; proxy/tail sessions stopped. |

Evidence: [daily account usage](./evidence/cloudflare-account-capacity-20261116.json),
[storage checks, source hashes and provider cleanup](./evidence/cloudflare-storage-admission-20261116.json).
See [research R-28](./research.md#r-28-daily-usage-evidence-and-storage-admission--2026-11-16)
for the owner confirmation, metrics limitations and current task boundary.
Persistent monitoring/scheduled recipient proof and eventual-commit CI/release checks
remain open. No paid upgrade, live mail or public application deployment occurred.

## 2026-11-16 — T064 Billing Read acceptance (R-27)

**T064 complete; 55/64 tasks complete, 9 open.** Verified the owner-created account
token as active and used the approved secure read-only API fallback. The configured
token MCP session was not exposed by this host; it is not claimed as independently
tested. Account subscription, explicit-period usage, spend-policy and billing-history
GETs all succeed. No raw token, recipient address, invoice identifier or billing profile
is retained. No billing or deployment changes were made.

| Acceptance check | Result |
| --- | --- |
| Token verification | HTTP 200, active; expiry November 24 04:59:59 UTC. Full policy not inspected. |
| Plans | R2 Paid and Images Stream Basic; both report USD 0 base price, state Paid, November 14–December 14 subscription period. |
| Explicit usage window | Generic endpoint accepts November 14 02:45:48–November 16 20:12:26 UTC, daily, limit 10,000; returns no usage rows. Not interpreted as zero. |
| Supplemental usage | v1 billable usage returns seven records for November 14–15: 0.0040398683 GB-month R2 storage, 831 Class A, 850 Class B, 49 image transformations; reported charges $0. No current-day/final-invoice assertion. |
| Spending controls | Spend-policy list is empty. Existing $1/$10 warnings remain enabled with one email recipient each; no hard cap is established. |
| Preserved gaps | v2 usage HTTP 403/code 1171; daily Workers/D1/DO totals missing; Images Free cutoff not proven by returned plan. |
| Operational inventory | Zero Workers, D1 databases and DO namespaces; one existing R2 bucket preserved. No persistent monitor target. |

This closes the Billing Read access dependency, not T001's remaining account-plan,
capacity and usage-control evidence. T058/T060/T063 remain open. Images plan
confirmation must precede reliance on a Free overage cutoff; no paid upgrade is selected.
See [research R-27](./research.md#r-27-billing-read-verified-and-account-evidence--2026-11-16)
and [sanitized evidence](./evidence/cloudflare-billing-read-20261116.json).

Documentation/evidence validation: JSON parsing, recorded-total recomputation, task
count and evidence-link checks, repository privacy scan and `git diff --check` pass.
No application code changed, so runtime suites were not repeated for this entry.

## 2026-11-16 — Committed R-25 CI acceptance and next release checks

Verified [Quality run 43934376056 / job 133534973000](https://github.com/sg921216/radiant_images/actions/runs/43934376056/job/133534973000)
through the run/job APIs and authenticated completed job log. The run succeeds on
`e1cea09a750bfa91808dbbef237560aa4cf2cc5c`. Checkout is PR merge
`7f1cf08856d8416dec35211a286c3b395a5aa622`; its tree and the feature-head tree are both
`b4e1d262191374d3b1ceea8c9b2dba2f533a197d`. This supplies remote acceptance of the
committed R-25 CPU/admission changes, not just the earlier baseline.

| Gate | Verified remote result |
| --- | --- |
| Static quality and builds | Frozen install, formatting, lint, types, API/frontend builds and test setup pass. |
| Unit/component/API/contract/tooling | **64 files / 287 tests pass.** |
| Full browser matrix | **158 pass / 12 expected skips**, 17.8 minutes. All five functional projects run; three performance profiles execute once, and their twelve non-target duplicates skip. |
| Security and diagnostics | Dependency audit passes; repository privacy checks 455 files with zero blocked, diagnostic privacy checks ten with zero blocked. Failure-only artifact upload correctly skips. |
| Source/runner identity | Attempt 1, PR event, matching checkout/head trees; runner 2.338.2 with Ubuntu 26.04 image documentation. Job duration 21m14s, ending 19:19:27 UTC. |

[Sanitized run, source identity, steps and result counts](./evidence/github-ci-r25-20261116.json)
retain no raw job log or authentication credential. T059 remains complete. Prior manual,
provider, approved-photo, actual-device and production gates are not inferred from CI.

### Continued work: action runtimes and T061 keyboard navigation

The job warns that checkout/setup-node/pnpm setup still declare Node 20 and are being
forced onto Node 24. All four repository workflows now pin official, verified Node 24
action commits: checkout 7.0.1, setup-node 7.1.0, pnpm/action-setup 6.1.1, plus
upload-artifact 7.0.2 on the diagnostic failure path. `ubuntu-26.04` pins the OS family
observed in this passing run. Application Node 24.14.0 and pnpm 12.18.0 remain unchanged;
automatic setup-node caching is explicitly disabled. Parsed comparisons against HEAD
verify every other command, condition, permission, deployment gate, monitor enablement,
secret reference and artifact retention/privacy rule is preserved. Official manifests
confirm supported inputs and Node 24 runtimes. Remote execution of these new workflow
pins still needs their eventual commit's CI; no deployment or monitor dispatch occurred.

Sources: [checkout release](https://github.com/actions/checkout/releases/tag/v7.0.1),
[setup-node release](https://github.com/actions/setup-node/releases/tag/v7.1.0),
[pnpm setup release](https://github.com/pnpm/action-setup/releases/tag/v6.1.1),
[artifact action release](https://github.com/actions/upload-artifact/releases/tag/v7.0.2),
[runner labels](https://github.com/actions/runner-images#available-images).

A new keyboard regression first fails on the current production build because focus
remains in navigation after following the Maternity link. `PublicLayout` now focuses
its main content after pathname changes, including Back/Forward navigation. Initial
page loads and hash-only navigation retain native focus; focus does not alter scrolling.
The regression also checks skip-to-content behavior and the mobile menu closing.
The first rebuilt run passes all **15 navigation/automated accessibility cases** across
five projects. During diff review, an incidental text-encoding change was removed so
footer copy remains byte-for-byte equivalent to HEAD; final verification follows below.
These checks support T061 but do not constitute an actual screen-reader, approved-photo
or field-performance pass.

Final validation of the corrected source: `pnpm check` passes formatting, lint, types,
**64 files / 287 tests** and both production builds. The rebuilt final navigation/axe
matrix passes **15/15**, zero skips/retries/flaky cases across all five projects.
The full configured suite lists 175 cases in 13 files; this listing is not a new full
execution. Source and diagnostic privacy scans and final diff checks pass.
[Sanitized workflow/runtime, source-hash and local verification evidence](./evidence/ci-runtime-accessibility-20261116.json)
records these results. The new workflow and focus changes remain uncommitted and need
remote Quality on their eventual commit.

### Owner-requested Billing Read dependency

Historical request checkpoint; completed by the T064 acceptance entry above.

The owner explicitly requested account-scoped Billing Read as a follow-up. Added **T064**
with setup and live verification criteria in quickstart.md. This connection has not been
established. Current subscription, billing usage and spend-policy requests still return
403; OAuth does not cover the first two endpoints. The current Workers inventory is empty,
so there is no persistent application to monitor. Plugin discovery supplied no additional
connection option; Cloudflare's documented API-token bearer connection is the follow-up
route. No access permissions, tokens, billing settings or production resources changed.

T064 must produce scoped subscription/current-period usage evidence and explicitly
report unsupported metrics or denied spend controls before reassessing T001. It does
not waive persistent monitoring (T058), deployment (T060), or final acceptance (T063).
Adding the requested follow-up changes the register to **54/64 complete, 10 open**;
none of the previous open tasks was closed by this documentation update.

## 2026-11-15 — HTTP CPU headroom and bulk-read admission (R-25)

Base `2c8ed7fb074fa8e81b456f2fc9cc867f4ed2e942`, plus the uncommitted source hashes in
[the sanitized R-25 record](./evidence/cloudflare-api-cpu-remediation.json). Existing
Spec Kit/toolchain changes and the logo asset were preserved. Only temporary private
Cloudflare resources and synthetic data were used; no public release or real mail send.

The initial first gallery read used 14 ms CPU. TrieRouter reduced that sample to 8 ms,
but fresh bootstrap/client-list probes still used 16/15 ms. The final implementation
keeps incremental routing and forwards only the three bulk GET/HEAD operations to
separate `BulkReads` coordinators. Eight active reads per coordinator are permitted;
excess admission returns 503/Retry-After without queueing. The front and object both
apply restore/owner checks. Responses remain streamed, and every admitted read uses
current D1 data. No content or authorization cache is introduced.

| Check | Observed result |
| --- | --- |
| Final source deployments | `96b9f4e5-193f-4493-aef7-04d266372ff2`, `86b3f31c-a8a4-466f-a6f6-6be1dcc0e14e`, `7215f935-5588-424b-805b-df2bd15433ac`; same eight-slot implementation, different cold first-read order. |
| Fixture | 60 gallery metadata rows, 200 clients, ten questionnaire questions; real D1, no R2 image bodies or provider sends. |
| Contract reads | **117/117** complete successful responses across all 13 JSON GET operations, three cycles on each final deployment. |
| Sampled CPU | **107 front invocations, maximum 8 ms**, covering all 13 operations; **65 DO invocations, maximum 15 ms**. Cold questionnaire/client-detail probes used 7/8 ms. No captured CPU-limit outcome or exception. |
| Concurrent bulk reads | Ten warm-ups then 100 measured reads per operation at concurrency five. **300/300** expected successes and valid bodies; nearest-rank p95 **349 / 369 / 385 ms** for bootstrap/gallery/clients. Includes network through the local remote-binding proxy. |
| Local quality | `pnpm check`: formatting, lint, types, **64 files / 287 tests**, API dry-run build and frontend production build pass. |
| Browser smoke | **50/50** cases pass across Chromium desktop/mobile, Firefox desktop and WebKit desktop/mobile, with zero retries/skips/flaky cases (8.8 minutes). Local synthetic-provider adapter; actual DO dispatch is covered by integration/live probes separately. |
| Private ingress | Public/preview Worker URLs disabled, routes absent, cron absent; both R2 managed domains disabled and no custom domains. |
| Cleanup | Both buckets verified empty; Worker, its DO namespaces, D1 and temporary buckets deleted. Final inventories show no matching resources; unrelated existing `radiant-001` bucket preserved. Local proxy and both tail sessions stopped. |

Behavioral red/green evidence: the initial forwarding tests failed three cases before
dispatch existed. The first four-slot implementation then failed the eight-held-read
regression; the final eight-slot implementation passes all six bulk-read cases. Tests
exercise the real object for fresh D1 content, removed-owner denial, restore refusal,
HEAD and unsupported-route behavior, plus bounded admission and slot release after
injected failures. Release/rehearsal binding and migration tests pass. The three 503
contracts describe overload as well as restore maintenance.

Earlier full-check attempts included a hook timeout while other test work overlapped,
a corrected optional-header TypeScript error, and a hook timeout during a run spanning
a multi-hour clock gap. The fresh final check passed without lengthening timeouts.
Two function-profile requests returned 404/code 10393 while private traffic succeeded;
there is no function-level CPU profile. Tail records are partial. Four final front
records report `canceled` with status 200, while callers consumed and validated complete
bodies; this is retained as an unexplained observation. The 282-ms maximum sampled DO
wall time and duration estimate in R-25 do not establish account billing or worst-case
capacity. Read-probe timing that included contract validation is excluded from latency
claims; the dedicated latency driver stops timing after full body receipt.

The five-project smoke command used `.wrangler/implementation-matrix.config.ts` and
`--grep '@smoke'`; the local Firefox executable matches the existing pinned browser
installation. Source and diagnostic artifact privacy gates report zero blocked findings;
formatting and `git diff --check` pass. Temporary credential, seed, raw-tail and generated
private configuration files were removed after saving only sanitized evidence.
These local changes still need the full remote Quality matrix on their eventual commit.
T059's prior committed
R-24 acceptance remains valid; it is not evidence for this new source. T001 stays open
for account-wide usage/plan and wider capacity evidence. T058 still requires a persistent
target and scheduled monitoring/recipient verification. **54/63 tasks complete, 9 open.**

## 2026-11-14 — Committed R-24 remote CI acceptance (T059)

The owner supplied [Quality run 43675695318 / verify job 132695230356](https://github.com/sg921216/radiant_images/actions/runs/43675695318/job/132695230356).
Verified its run/job APIs and completed job log: **SUCCESS** on feature head
`c00eaab40235185e7d320176986ccdf3fe4bc334`, which contains all R-24 CPU, usage-control,
contract and pricing changes. The PR checkout is merge commit
`ce7ca2c7a7d227cfc618a6645778fa5d739e241e`; GitHub's Git API confirms its tree exactly
matches the feature head (`e2ef3326e26b3060b790c7edb418488b98580f8c`). This closes the
previous gap between local changes and the remote-tested source.

| Gate | Verified result |
| --- | --- |
| Install and static quality | Frozen lockfile install, formatting, lint and type checks pass. |
| Unit/component/API/contract/tooling | **63 files / 281 tests pass**, including the new dispatch, upload-budget and contract-harness cases. |
| Production and browser setup | API/web builds, local database setup and all three browser-engine installations pass. |
| Full browser matrix | **158 passed / 12 skipped** in 15.7 minutes: 155 functional cases across five projects, plus three once-per-run performance profiles. Only duplicate performance-profile cells are skipped; no functional quarantine. |
| Security/privacy | Dependency audit, repository secret scan and diagnostic privacy gate pass. Failure-only artifact upload is correctly skipped on success. |
| CI guard review | PR/nightly/manual/reusable release events select the full matrix; main pushes select smoke. Focused tests are forbidden, CI permits one diagnostic retry, flaky classification fails the run, traces are disabled, and privacy-cleared failure artifacts have seven-day retention. No live-provider secrets are injected into Quality. |

The existing R-24 observation matrix establishes success/error coverage for all 40
operations and 401/403 for all 31 protected operations; the now-remote-passing security
suite also checks expired, removed-owner and non-owner sessions. Applicable-error
declaration checks and actual response validation pass. A supplementary local schema
probe passes 12 checks across all three email error schemas: valid code/retryable pairs
are accepted, while wrong codes, inverted retryability and missing retryability reject.

The historical isolated WebKit input-loss observation remains in the earlier evidence;
it did not recur in this complete matrix. No root-cause fix is claimed and no journey is
omitted. Passive failure diagnostics and T063's actual-device acceptance remain required.

**T059 is complete: 54/63 tasks complete, 9 open.** This is pinned-engine CI acceptance;
general HTTP CPU/account usage, persistent recovery monitoring, real-mail/human checks,
owner content and production release gates remain open. The evidence update itself changes
only documentation. No application code, deployment, workflow dispatch or merge occurred
during this verification. The UTC run ended November 15; the New York date is November 14.
See [sanitized run, commit/tree, step and count evidence](./evidence/github-ci-r24-20261115.json).

## 2026-11-14 — Scheduled CPU remediation, usage controls and pricing acceptance (R-24)

Base commit: `48d5ee3032ee1ad9587b18bbc2588d6b86d394db`, plus the local changes described
below. UTC measurements fall on November 15; the workstation date is November 14 (New York).
Existing Spec Kit/toolchain edits and the unrelated logo asset remain outside this work.
No public release, paid upgrade, live Gmail send or customer-data operation occurred.

### Scheduled CPU and application usage controls

Both production cron expressions now await one private `ScheduledOperations` Durable
Object, serializing the single recovery ledger with at most two outstanding jobs.
Unsupported schedules/excess queueing fail explicitly; operation failures reach the cron
caller and release the queue. The existing R2 job records remain the persistent completion,
failure and freshness evidence. Release, local and private rehearsal configurations include
the new binding and SQLite-class migration; Wrangler regenerated the binding types.

| Check | Observed result |
| --- | --- |
| Actual Cloudflare cron | Three successful accelerated invocations on version `57cfe04e-f0c3-401c-aaab-19fac45b88bb`; the daily recovery branch used real D1/R2 with a synthetic no-send Gmail boundary. |
| Front Worker CPU | **0 / 0 / 0 ms at provider reporting resolution**, compared with R-23's 32 / 34 / 30 / 43 ms. This is not zero computation. |
| Coordinator CPU | **30 / 28 / 18 ms**; front wall times 14,456 / 13,115 / 13,043 ms. All six invocations returned `ok`, without exceptions. |
| Independent observation | Separate R2 binding reader reported `ok:true`, no issues and zero overdue recovery/receipt counts after actual cron completion. |
| Private ingress | Worker public/preview URLs disabled, no routes; both R2 managed domains disabled and no custom domains. |
| Teardown | Schedule removed, buckets emptied with absence checks, local proxy/tail stopped; Worker/DO namespaces/D1/buckets removed. Final provider listings contain zero matching resources. |
| Portfolio churn control | Persistent DO allowance of 300 admitted upload attempts per rolling 30 days, before image processing. Failed admitted attempts consume a slot; exhaustion returns 429 with Retry-After. Auth/byte-limit rejection occurs before reservation. Reads and deletion remain available. Local real-DO proof; no new deployed portfolio-quota claim. |
| Account warning | Added and re-read enabled **$1 account-wide budget warning**, reusing the existing billing recipient. Existing $10 warning preserved. No notification test or paid upgrade. |
| Billing limitations | Subscription and spend-policy reads return 403 with the current OAuth connection. Budget warnings do not stop usage; no account-wide invoice cap or $0 guarantee is established. |

Evidence: [sanitized CPU/control/cleanup record](./evidence/cloudflare-cpu-remediation.json).
Research R-24 records source-backed limits and the bounded storage/transformation planning
envelope. These samples do not establish worst-case backup capacity or general HTTP CPU
headroom (the earlier cold gallery GET reached 12 ms). **T001 stays open.**

**T058 stays open:** no persistent application deployment exists to monitor. Activate only
against the real recovery bucket with verified bucket-scoped S3 read credentials, repository
settings and scheduled recipient routing. R-23's user-confirmed manual notification and
healthy/fault/recovered rehearsal remain valid but do not prove future scheduled delivery.
The $1 warning is the only persistent Cloudflare change from this follow-up.

### Red/green and local quality evidence

- `pnpm exec vitest run apps/api/tests/scheduled-dispatch.test.ts`: initial behavioral
  failures showed no coordinator dispatch and swallowed injected coordinator failure.
  Overlap/unknown-schedule checks also failed before the coordinator behavior was added.
  Final five cases pass, including real failed cleanup → successful backup/healthy signals.
- `pnpm exec vitest run apps/api/tests/gallery-budget.test.ts`: the initial 301st attempt
  returned 400 instead of 429. Final real-DO test passes for the last admitted invalid
  upload, persistent count, exhaustion/Retry-After/contract body, unauthorized access and
  expired-window recovery. No image processing is needed to consume those test attempts.
- Focused rehearsal/release configuration tests and scheduled/operations tests pass.
  `pnpm check` passes formatting, lint, types, **62 files / 277 tests** and production builds
  after the CPU/usage implementation. This run predates the later contract-harness file.
- After the contract additions, the complete API audit passes **24 files / 158 tests**;
  the subsequent four-case contract-harness run passes, including three new coverage cases.
  Final formatting, lint, types, secret/artifact privacy gates and `git diff --check` pass.
  Final secret scan: 453 files / zero blocked; diagnostic scan: 10 files / zero blocked.

### T059 contract and remote CI verification

An observation hook temporarily recorded only normalized path, method and status **after**
the normal strict response validator succeeded. The helper was restored byte-for-byte.
The complete API run exposed three coverage gaps: no error for Google sign-in start, and
no success for owner banner/questionnaire reads. Added authenticated-read cases and an
auth rate-limit case; all pass. A separate harness regression rejects an intentionally
malformed `/pricing` response with the expected schema-mismatch error.

The combined observed response set covers **all 40 operations with success and error**,
and **all 31 protected operations with 401 and 403**, in addition to the existing expired,
removed-owner and non-owner authorization tests. The audit does not treat schema
declarations alone as response evidence. See
[the complete sanitized status matrix](./evidence/contract-coverage-20261115.json).

The manually dispatched [Quality run 43673720689](https://github.com/sg921216/radiant_images/actions/runs/43673720689)
**passes** on the latest pushed commit `48d5ee3032ee1ad9587b18bbc2588d6b86d394db`:
frozen install, formatting/lint/types, dependency and secret checks, **60 files / 271 tests**,
production builds, setup and the full browser matrix. Browser result: **153 passed / 12
skipped** in 17.5 minutes. The 150 functional cases cover all five projects; three performance
profiles run once in Chromium desktop (including the specified CDP mobile conditions),
and their 12 duplicate non-target project cells are explicitly skipped. These are declared
profile-selection skips, not quarantined functional journeys. The diagnostic privacy step
passes; failure-only artifact upload is correctly skipped. Focused/flaky rejection and
seven-day retention remain configured. This run does not contain the local CPU/usage/test
diff; remote CI on its eventual commit remains required before closing T059 or releasing.
See [sanitized run/step/count evidence](./evidence/github-ci-20261115.json).

### T031 pricing, print and PDF acceptance

The expanded local pricing suite passes **20/20 cases** across Chromium desktop/mobile,
Firefox desktop and WebKit desktop/mobile, with no retries, failures, skips or flaky cases.
Every service's pricing loads from Home in one navigation-link click (plus opening the
mobile menu), and each scoped Book Now CTA opens Contact. Publication updates an already
open service page within 60 seconds; its download filename and all print revision footers
match `GET /pricing`. The PDF-module outage retains usable pricing/print controls.
Existing pricing integration tests also pass missing-type/negative-price/duplicate-order
rejection, simultaneous equal-time publication and rollback after pointer-write failure.

Downloaded PDFs and Chromium browser-print PDFs were captured before and after publication,
rendered with PyMuPDF, inspected visually, and checked with text/page coordinates. **All
four documents have three pages (12 inspected pages total):** one each for Maternity,
Newborn and Family, with readable package text, no clipping, no unexpected blank pages or
navigation. Initial prices are $250.00; the updated Family price is $350.50 with the other
two unchanged. Every corresponding footer matches the API revision. The browser-print
and PDF layouts differ visually but preserve the same complete published data.

The first short run overlapped the production rebuild and returned one transient Family
404; it is not counted as product acceptance. After the build completed, the sequential
20-case run above passed. No product fix is attributed to that harness race. Firefox used
the existing owner-installed executable via the local matrix configuration.
See [pricing matrix and page inspection evidence](./evidence/pricing-review-20261115.json).

**T031 is complete for its pricing-specific assertions; 53/63 tasks complete, 10 open.**
This adds the deferred pricing navigation to the existing US1 evidence. Overall SC-001
participant/inquiry timings still depend on T025/T063, SC-004 full acceptance remains
T061, and final owner-content/physical-printer/device acceptance remains T063. Synthetic
pricing fixtures do not constitute owner approval of launch prices or text.

## 2026-11-14 — Private recovery and monitoring rehearsal (R-23)

Requested after merge; branch `001-radiant-images-website` fast-forwarded to main
`d4e8aee8cfc172c6e91ba4838fe648cd17f9ce61`. The requirements checklist passes 16/16.
Existing local Spec Kit, `.node-version` and `.npmrc` edits remain separate and unchanged.
No public release, paid upgrade, live-email send or customer-data operation occurred.

Evidence: [sanitized rehearsal record](./evidence/cloudflare-recovery-rehearsal.json).
The UTC run crosses into November 15; the workstation date is November 14 (New York).

| Check | Observed result |
| --- | --- |
| Private infrastructure | One temporary ENAM D1 database, Worker and two R2 buckets. API confirms workers.dev/preview URLs and both r2.dev domains disabled; no routes. |
| Snapshot and application restore | PASS: transient auth/dedupe/rate/lifecycle state omitted; retained data, omission markers and invitation associations preserved; deleted client and all dependent rows absent after reconciliation; API 503 until explicit reopen. |
| Populated checklist follow-up | Initial fixture review found zero checklist states; a new assertion failed (0 versus 2). Corrected the seed and added a live targeted proof: two populated checklist states before backup, deleted client's state absent after delete/restore, retained client's exact completion time preserved. Passed on version `6310a82e-cfd0-45e7-b8b3-4aecee2c4ac5`; the earlier empty-table assertion is not counted as checklist evidence. |
| Portfolio recovery | PASS: original and three variant byte fixtures restored exactly from private recovery. This does not repeat image-decoder acceptance. |
| Unsafe restore | PASS: missing indexed receipt and day-28-expired snapshot rejected; unsafe reopen refused. |
| Delayed deletion and retry | PASS with injected R2 delete failure and 32-day clock: old backup and required receipt retained; monitor detects overdue recovery, missed target and overdue receipt. Retry verifies backup/media removal before retiring receipts. |
| Actual provider restore | PASS: real D1 Time Travel to saved pre-deletion bookmark; deleted client returned only to isolated D1, then independent R2 receipt replay removed client/dependents, cleared transient state and allowed explicit reopen. Ingress detached throughout; cron paused. |
| Compatible Worker rollback | PASS: `6e4e69a5-ae1a-442e-b38b-cbf4ee3559e4` → `0dceb9d3-a5d8-4807-8575-f555730f7d94` at 100%; recovery/monitor passed afterward. No database rollback implied. |
| Actual Cloudflare cron | PASS functionally: accelerated every-minute trigger invoked real daily maintenance/backup/health logic; first successful recorded completion `2026-11-15T03:09:23.653Z`. Gmail adapter was synthetic/no-send. |
| CPU headroom | OPEN: four tailed cron runs returned `ok` with no exceptions but used 32, 34, 30, 43 ms CPU, exceeding the Free 10-ms budget. Wall times 9,659 / 9,264 / 10,880 / 7,757 ms. No production resource-budget pass. |
| Independent observation | PASS through separate R2 binding and real S3 SigV4 checker: healthy → injected stale maintenance/overdue backup/target miss → healthy. Signals/metadata only. |
| Initial credential scope | REJECTED for GitHub setup: other fixture bucket list and recovery write both returned 200; empty write probe removed. Owner asked to replace with bucket-only Object Read Only credentials. |
| Replacement credential scope | PASS at `2026-11-15T03:21:17.637Z`: other fixture bucket listing returned 403, recovery write returned 403, while the real S3 monitor returned healthy. Only this verified replacement was used for temporary GitHub setup. |
| GitHub notification test | Both requested synthetic runs completed with the intended failure before checkout/provider access: [43670559798](https://github.com/sg921216/radiant_images/actions/runs/43670559798), retry [43671241481](https://github.com/sg921216/radiant_images/actions/runs/43671241481). Receipt is not inferred from a failed run. |
| Recipient receipt | PASS: user explicitly confirmed receipt of the failure notification for retry run `43671241481`. This proves the manually triggered recipient path; future production schedule ownership/routing must still be configured. |
| Real GitHub monitor | Verified replacement credentials encrypted into temporary repository secrets; merged-main healthy run [43672001075](https://github.com/sg921216/radiant_images/actions/runs/43672001075) succeeded. Injected-fault run [43672071929](https://github.com/sg921216/radiant_images/actions/runs/43672071929) failed at the real monitoring step after successful install; no application mutation occurred in the monitor. Recovery and teardown results are retained below/in the JSON record. |

The fault run's sanitized output contains exactly `maintenance_job_unhealthy`,
`recovery_cleanup_overdue`, and `recovery_removal_target_missed`, with one overdue copy.
After cleanup, [recovery run 43672158050](https://github.com/sg921216/radiant_images/actions/runs/43672158050)
passed with `ok:true`, no issues and no overdue objects. This completes the real GitHub
healthy → fault → recovered rehearsal using bucket-only read credentials. Manual dispatch
is not evidence of scheduled GitHub delivery or future production activation.

**Teardown verified:** the temporary schedule was removed; the local proxy/tail stopped;
both R2 buckets were emptied with absence checks; the Worker, D1 database and both buckets
were deleted. Re-listing Cloudflare returned zero matching resources. The three temporary
repository secrets and two variables were removed; GitHub lists no repository secrets or
variables afterward (matching the initial state). No paid service or production monitor was
left running. The user-controlled R2 token still needs revocation in Cloudflare; this
connection cannot manage API tokens (403). Its local file remains Git-ignored and no secret
value appears in evidence. Any broad token created solely for this rehearsal should also
be revoked by its owner.

Local red/green evidence:

- `pnpm exec vitest run scripts/tests/recovery-rehearsal.test.ts apps/api/tests/operations.test.ts scripts/tests/operations-monitor.test.ts` initially gave 1 failed isolation test / 18 passing existing tests. The failure showed the old gallery configuration was not the separate recovery target/entry/trigger.
- The new API rehearsal initially failed because POST seed returned 404, then passed the
  whole synthetic recovery sequence. Provider-reconciliation coverage separately failed
  at the unsupported provider-delete action (404), then passed after implementation.
- Fixture review added an assertion requiring two populated rows in each client-dependent
  table; checklist state failed with 0 rather than 2. Seed correction, local checks and the
  separate deployed `checklist-proof` passed. Its initial empty-table check remains disclosed.
- `pnpm check` PASS: formatting, lint, types, **60 files / 271 tests**, production API/web builds.
  The first check failed solely on 269 CRLF checkouts under `core.autocrlf=true`; `.gitattributes`
  now enforces the existing Prettier LF requirement. Formatting normalization preserved all
  tracked application-content hashes; no application behavior changed.
- `pnpm security:secrets` and `pnpm security:artifacts` PASS (0 blocked); `git diff --check` PASS.
  No browser UI behavior changed; this pass exercises recovery through real workerd/D1/R2
  locally and the private deployed resources, not a rerun of the human/browser release matrix.

The implementation hooks are optional commit hooks; surfaced without execution. T058 is
not checked off: persistent production target/monitor activation and CPU headroom remain
distinct gates. T001/T060/T063 are not closed by these scoped results;
the task count stays **52/63 complete**. Final credential, GitHub and teardown results
are retained in the evidence record.

## 2026-11-13 — T001 feasibility checkpoint

**Initial checkpoint:** T001 was blocked on strict recovery expiry and production image-decoder feasibility; the local-development exception was approved on 2026-11-13. Hosting and R2 enrollment were resolved. At that checkpoint no application code or runtime evidence existed. Current local implementation evidence follows; deployment, real mailbox delivery and human acceptance remain open.
T001 findings and primary-source links are in [research R-16](./research.md#r-16-t001-feasibility-checkpoint--2026-11-13).

**Clarification follow-up (2026-11-13)**: Zero new questions asked; one explicit owner
answer recorded in spec.md under Clarifications and Assumptions: use Cloudflare Workers
Static Assets. Synchronized plan, research, tasks, route/API descriptions, data-model gate
status and deployment guidance. Existing React/Hono/D1/R2 boundaries and session behavior
remain intact. No implementation task is marked complete by this documentation change.
Clarification validation: exactly one new Q/A under the dated session; only Clarifications
and Assumptions changed in spec.md. Spec quality checklist **16/16 → 16/16**, with no newly
passing items, regressions or unchecked items; its file is unchanged. The owner-selected host
is an explicit stakeholder constraint, with routing/deployment mechanics kept in design docs.
OpenAPI 3.1 validation and `git diff --check` pass; active design/deployment documents contain
no obsolete host instructions. Both clarification commit hooks are optional and were surfaced
without execution. This is documentation validation, not runtime or deployment acceptance.

### Checks actually performed

| Check                            | Command / method                                                                                                  | Result                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature prerequisites            | `python .specify/scripts/python/check_prerequisites.py --json --require-tasks --include-tasks`                    | PASS; feature `specs/001-radiant-images-website`; research, data model, contracts, quickstart, tasks available                                                                         |
| Requirements checklist           | Count Markdown checkboxes in `checklists/requirements.md`                                                         | PASS; 16 total, 16 complete, 0 incomplete                                                                                                                                              |
| Repository instructions          | Read parent `AGENTS.md`, current plan and constitution v1.0.0                                                     | React/Workers stack and test-first requirements retained                                                                                                                               |
| Hosting/provider feasibility     | Review current primary documentation linked in R-16                                                               | Initial checkpoint blocked on hosting; owner later selected Workers Static Assets and completed R2 enrollment. Expiry/decoder evidence remains incomplete                              |
| Local tools                      | `node --version`; `npm --version`; `pnpm --version`                                                               | 24.14.0; 11.12.0; 9.15.0; no compatibility/build pass inferred                                                                                                                         |
| Registry metadata                | `npm view` with process-local `NODE_OPTIONS=--use-system-ca`, retries disabled                                    | Initial certificate failure resolved using OS trust; Router 7.15.1 peers, Workers test pool 0.23.0/Vitest 4.1 peers, Wrangler 4.162.0 and pnpm 12.18.0 retrieved; installation not run |
| OpenAPI 3.1 structure            | PyYAML 6.0.3 + openapi-spec-validator 0.7.2                                                                       | PASS; contract 0.2.0, 40 operations                                                                                                                                                    |
| Reference resolution             | Walk all local `$ref` JSON pointers in the parsed contract                                                        | PASS; 261 references resolve                                                                                                                                                           |
| Protected-operation declarations | Inspect every operation with `security`                                                                           | PASS; all 31 declare both 401 and 403; declaration check only                                                                                                                          |
| Revised upload/429 declarations  | Inspect required original part, gallery 413 and required Retry-After                                              | PASS; runtime enforcement remains unimplemented                                                                                                                                        |
| Patch whitespace                 | `git diff --check`                                                                                                | PASS                                                                                                                                                                                   |
| Ignore behavior                  | `git check-ignore --no-index` for `.dev.vars`, `.env`, Python cache, editor settings and Wrangler SQLite fixtures | PASS; root `.gitignore` added                                                                                                                                                          |
| Extension hooks                  | Parse `.specify/extensions.yml`                                                                                   | Both implementation hooks optional; surfaced, not executed; no mandatory hook                                                                                                          |

Temporary validation packages were installed under `%TEMP%/radiant-images-contract-validation`,
outside the repository and without changing the global Python environment. Reproduce the
OpenAPI structural check in PowerShell:

```powershell
$validationPath = Join-Path $env:TEMP 'radiant-images-contract-validation'
python -m pip install --disable-pip-version-check --target $validationPath 'PyYAML==6.0.3' 'openapi-spec-validator==0.7.2'
@'
import os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.environ['TEMP'], 'radiant-images-contract-validation'))
import yaml
from openapi_spec_validator import validate
spec = yaml.safe_load(Path('specs/001-radiant-images-website/contracts/openapi.yaml').read_text(encoding='utf-8'))
validate(spec)
print('OpenAPI 3.1 structural validation passed')
'@ | python -
```

### Changes made

- Recorded source-backed hosting findings and a proposed alternative without changing
  the owner's existing hosting constraints or enabling any external resources.
- Corrected Gmail consent scopes and documented D1 application rate windows because
  a 600-second Workers rate-limit binding is unsupported.
- Added private original bytes and explicit byte/pixel limits to the upload contract and
  data model, plus gallery 413 and required 429 Retry-After declarations. API design version
  is now 0.2.0 because the upload request has a new required part.
- Recorded D1's actual free recovery window and the gap between asynchronous R2 lifecycle
  expiry and the specified maximum retention. No retention extension was approved.
- Added repository ignore rules. No Docker, ESLint, Prettier, Terraform, Helm or publishable
  package setup exists yet, so tool-specific ignore files await the applicable setup tasks.

### Decisions and evidence still needed

1. RESOLVED: Owner explicitly selected Cloudflare Workers Static Assets and reports R2
   enrollment complete. The choice is recorded in spec.md, and dependent hosting references
   are synchronized. Deployment access can be configured later; no further host approval needed.
2. Finish T001's bounded server image-decoder/metadata proof and recovery-expiry design.
3. Select/pin one compatible runtime/package-manager/framework/test-pool set and verify it
   in T002/T006. Documentation and installed version strings are not installation evidence.

Once those dependencies are resolved, continue T002 in task order. Keep T001 unchecked
until its obligations are satisfied. Red/green behavior evidence begins with executable
implementation; documentation-only work does not require an artificial failing test.
All SC-001–SC-012 and QR acceptance results remain **NOT RUN**.

## 2026-11-13 — implementation feasibility follow-up

Invoked `speckit-implement`; followed the active feature branch and mandatory T001 ordering.
The owner-selected host and completed R2 enrollment were not reopened. No paid service,
external message, deployment, credential access or production-data operation was performed.
The pre-existing `.specify` integration changes were left untouched and uncommitted.

### Work completed within T001

- Verified current provider documentation for Workers/Static Assets/D1/R2 budgets, actual
  cost controls, rate-limit windows, Images binding/pricing, Gmail scopes/verification
  exceptions, and data-recovery behavior. Source links and limitations are in research R-16.
- Calculated the portfolio/request/storage planning envelope, including media replacement
  churn, staged objects and independent database exports. Account allowance consumption
  and application enforcement remain unmeasured; no $0 invoice guarantee is claimed.
- Queried exact candidate dependency engines/peers and resolved the candidate in an isolated
  temporary directory. The npm operation wrote only a manifest/lockfile outside the repo;
  it did not install application dependencies or establish a working application/toolchain.
- Clarified existing upload validation invariants in data-model.md and the OpenAPI
  description without changing schemas, endpoint signatures, byte/pixel bounds or version.
- Prepared `feasibility-decision.md`: a bounded, explicitly unapproved proposal to continue
  local work while preserving production feasibility/deployment gates. No privacy rule,
  constitution or task dependency has been waived by writing the proposal.

### Validation actually run

| Check                                 | Command / method                                                                                                        | Result                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prerequisites                         | `python .specify/scripts/python/check_prerequisites.py --json --require-tasks --include-tasks`                          | PASS; same active feature and required documents                                                                                                        |
| Checklist/tasks                       | Parse Markdown checkboxes                                                                                               | PASS; requirements 16/16; all 63 tasks still unchecked                                                                                                  |
| Exact dependency metadata             | `npm view <package>@<version> engines peerDependencies peerDependenciesMeta --json`                                     | Retrieved candidate versions recorded in R-16; OS certificate trust enabled, verification not disabled                                                  |
| Dependency resolution                 | `npm install --prefix <probe> --package-lock-only --ignore-scripts --strict-peer-deps --no-audit --no-fund`             | PASS, exit 0, approximately 12 seconds; no runtime/build/vulnerability result inferred                                                                  |
| OpenAPI                               | `openapi_spec_validator.validate` using the existing temporary PyYAML 6.0.3 / openapi-spec-validator 0.7.2 installation | PASS; version 0.2.0; 40 operations                                                                                                                      |
| Contract references/auth declarations | Walk local JSON pointers and inspect protected operations                                                               | PASS; all 261 references resolve; all 31 protected operations declare 401 and 403                                                                       |
| Ignore setup                          | `git rev-parse --git-dir`, config inventory, `git check-ignore --no-index`                                              | Git repository; secrets/dependencies/SQLite/Wrangler/test artifacts/editor fixtures ignored; no Docker/ESLint/Prettier/Helm/Terraform/package setup yet |
| Whitespace                            | `git diff --check`                                                                                                      | PASS                                                                                                                                                    |
| Hooks                                 | Parse `.specify/extensions.yml`                                                                                         | Both eligible implementation hooks optional; no mandatory hook. Optional commit not executed.                                                           |

The unique probe directory was
`%TEMP%/radiant-t001-toolchain-1bd130375489476db90bb9b9af06a0b9`.
It used Node 24.14.0/npm 11.12.0 and the exact dependency candidate in R-16. No global
package-manager change was made. Re-run installation/build with pnpm in T002 after the
gate is resolved; this temporary npm resolution does not replace a committed pnpm lockfile.

### Remaining gate

R2 documentation does not establish the unconditional 30/31-day deletion deadlines.
The Images candidate still needs subscription-eligibility and authoritative decoding
evidence; offline emulation cannot establish either. T001 therefore remains incomplete.
Requested the owner's decision on the proposed local-development exception. Until an
explicit approval arrives, dependent implementation is not started. No behavioral red/green
run was applicable to these documentation and dependency-resolution changes. Runtime,
real-provider, human and release acceptance remain NOT RUN.

## 2026-11-13 — approved exception and setup

Owner explicitly approved the local-development exception: "yes, apply the exception and
continue with implementation". It is now active; T001 remains a deployment gate.

T002–T005 completed. Pinned pnpm 12.18.0 installed successfully, lockfile generated;
`pnpm typecheck`, `pnpm lint`, and `pnpm build` pass. Public route stubs prerender and the
SPA fallback is generated. These are test-harness placeholders, not implemented pages.
Current maintained tooling corrections: `@cloudflare/vitest-plugin@1.8.2` replaces the
deprecated pool package; ESLint 10.15.0 replaces deprecated 9.x; `oauth4webapi@3.8.8` and
`jose@6.2.17` replace unsupported Arctic. Same architecture/provider/test boundaries.
pnpm 12 uses `allowBuilds` and workspace settings; exact esbuild/workerd/sharp build
approvals are recorded. The initial native-build-policy and Router runtime configuration
errors were fixed; they are setup failures, not behavioral red evidence.

T006 red: `pnpm exec vitest run --project=tooling` observed seven behavioral failures
(wrong email retry flag accepted, missing 401/403 accepted, remote test targets allowed).
Green: implemented strict response/status/header checking and explicit loopback protection.
Provider/clock red: `pnpm exec vitest run --project=api apps/api/tests/providers.test.ts`
observed 200 instead of requested 503 and epoch instead of controlled time. Green after
fixture implementation. `pnpm test`: 14 tests pass across tooling, workerd D1/R2 and RTL.
`pnpm e2e:smoke`: two local built-HTML/API-boundary smoke tests pass in Chromium desktop
and mobile emulation (Chrome for Testing 159.0.8154.6, Playwright 1.65.1). This proves
harness execution only, not functional UX, performance, physical-device or release criteria.
Schema-specific reset/seeding and additional CI integrity checks are being completed.

## 2026-11-13 - local foundation and inquiry implementation

All evidence below is synthetic and local under the approved exception. No live email,
production deployment, physical-device, image-decoder or strict retention proof is claimed.
The prior “not started until approval” entry is historical and superseded by the approval.

Commands use the pinned pnpm 12.18.0 runner, Node 24.14.0, Windows, with OS CA trust
(`NODE_OPTIONS=--use-system-ca`) and Wrangler metrics disabled.

| Tasks                     | Behavioral red observed before implementation                                                                                                       | Green evidence                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T007                      | Six migration/seed/constraint failures against the empty schema                                                                                     | db.test.ts: 6 pass; 22 tables, cascades, singleton pricing pointer, rollback, image cap, local-only seed                                                 |
| T008                      | Shared bounds/public projection/error retry-flag failures                                                                                           | common.test.ts: 7 pass                                                                                                                                   |
| T009                      | CORS, bounded-body, sanitized error/audit and atomic-rate failures                                                                                  | middleware.test.ts: 6 pass                                                                                                                               |
| T010-T011                 | Identity grant/session, replay, rollback, claims and expiry failures; signing-key outage returned 400 instead of 502                                | auth.test.ts: 15 pass; signing-key outage corrected to 502                                                                                               |
| T012                      | Four browser failures: no exchange, fragment retained, no expiry clearing, missing recovery link                                                    | web auth.test.tsx: 4 pass; no exchange retry; local logout survives outage                                                                               |
| T013                      | Eight provider failures: unsafe MIME accepted, no dispatch, wrong delivery classifications, missing abort/verification                              | providers.test.ts: 8 pass; consent.test.ts: 1 pass after loopback/PKCE/scope red                                                                         |
| T014                      | Bootstrap/published variants returned 404                                                                                                           | public.test.ts: 2 pass; private config and originals excluded                                                                                            |
| T015                      | Missing landmarks, refresh and metadata                                                                                                             | publicContent.test.tsx: 3 pass; 25-second polling + 20-second edge cache + 10-second request deadline; visibility/focus refresh; last good data retained |
| T018-T019                 | Three schema and seven inquiry failures (permissive validation / 404 instead of expected outcomes)                                                  | shared inquiry.test.ts: 3 pass; API inquiries.test.ts: 7 pass                                                                                            |
| T020-T023 local UI        | Browser navigation/contact lacked headings/form; component tests lacked draft recovery, errors and gallery; trailing-slash metadata wrongly private | web inquiry.test.tsx: 5 pass; six Chromium desktop/mobile discovery/recovery-address smoke cases pass                                                    |
| T024                      | Page/FAQ writes returned 404; editor lacked draft field                                                                                             | API content.test.ts: 3 pass; web content.test.tsx: 1 pass; failed FAQ batch retains previous rows                                                        |
| T006 additional isolation | Synthetic reset accepted a remote origin and did not seed/clear state                                                                               | e2e-adapter.test.ts: 1 pass; separate local test D1/R2, pre/post-case reset, controlled time, provider-only doubles                                      |

`pnpm test`: 18 files / 84 tests pass. `pnpm typecheck`, `pnpm lint`, and production
build (API dry-run only) pass at this checkpoint. Built public HTML, route bundles,
SPA fallback and sitemap are generated. Later changes must be verified again.

Gmail/Turnstile adapters were checked against primary documentation:

- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/list
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

T006 remains partial pending final CI/contract coverage and diagnostic artifact policy.
Raw Playwright traces are currently disabled because they retain bearer/token HTTP data;
synthetic screenshots remain enabled. Do not describe these as sanitized traces.
T016/T017 retain additional integration/browser assertions; T023 still needs owner-approved
privacy copy. T025 real-mail denominator, participant timings and content approval are NOT RUN.
T060 direct-load tests observed 501 responses for admin deep links/missing assets before
fallback implementation; final green verification is in progress. No workflow deployment occurred.

### US1 browser and routing follow-up

`pnpm exec playwright test e2e/inquiry.spec.ts e2e/deployment.spec.ts
--project=chromium-desktop --project=chromium-mobile`: 22 pass in a clean 29.2-second run.
The preceding run had 21 pass / one reset ECONNRESET while formatting reloaded the watched
Worker; no feature assertion failed in that run. The clean run followed cessation of edits.
Cases include real local API delivery, provider and browser response loss, no timer-based
resend, fresh-CAPTCHA acknowledged restart, confirmed-receipt finish, typed definite failure,
phone validation/error focus, all seven routes at 320/768/1280 pixels, private fallback
loads and missing-asset 404. These layout fixtures do not yet contain 60 portfolio images.
T060 fallback uses the generated __spa-fallback.html through the Static Assets canonical
path and applies no-store/noindex/no-referrer. Deployment workflows/HTTPS/rollback remain open.
Routine browser CAPTCHA is now always doubled at the external script boundary, including
read-only navigation cases; no live verification is needed for routine tests.

### T026-T030 local pricing

API pricing.test.ts: four initial behavioral failures (404), followed by an ordering defect
between PUT and GET responses. Green after implementing immutable batch publication and
consistent Maternity/Newborn/Family order: 4 pass. Equal-time concurrent publication selects
the last committed complete revision; failed pointer mutation rolls back rows and pointer.
Web pricing.test.tsx: two initial missing-control failures, then 2 pass (failed publish
preserves edits, missing-type validation, failed PDF keeps web and print available).
Tooling pricing-pdf.test.ts: initially empty Blob, then 1 pass (%PDF header, nonempty PDF).

Built Chromium desktop/mobile pricing suite: 4 pass. Initial browser print assertions used
the wrong `hidden` option; corrected to Playwright `includeHidden` after adding tools/E2E
typechecking. This was a test defect, not a print-layout product defect.
Owner publication browser journey passes through the real callback/exchange/session and
pricing endpoints with a synthetic preverified identity grant fixture; it does not establish
live Google consent. An already-open Family page updates from $250.00 to $350.50 within the
60-second budget (full journey 26.3 seconds). No real pricing or receipt evidence is claimed.

PDF review used pypdf 7.1.0 and MuPDF 2.1 in ignored .venv (Poppler not installed). Text
extraction initially found revision text, but page rendering revealed an off-page absolute
footer. A visible-text/bounds assertion reproduced the defect before changing the footer to
normal document flow. Rebuilt browser download: 2 desktop cases pass; read-only
`scripts/check-pricing-pdf.py <download> --revision 01K00000000000000000000001` passes.
All three PNG pages were visually inspected: no clipping; each shows the $250.00 fixture,
correct shoot type and visible publication/revision footer. Physical print review, final
owner content and the wider release matrix remain open in T031/T063.

Expanded `pnpm typecheck` to tsconfig.tools.json. This exposed unsupported Vitest `forbidOnly`.
A temporary `.only` probe initially passed (defect); replacing it with per-project
`allowOnly:false` makes it fail with “Unexpected .only modifier”. A root-only setting did
not propagate. The temporary probe was removed after verification. All four Vitest projects
now enforce the policy, and tooling/browser typechecks pass.

## US3 gallery implementation: local red/green evidence

- T032/T034: `pnpm exec vitest run --project=api apps/api/tests/gallery.test.ts`
  first failed all seven cases with missing routes (404); after implementation seven
  passed against real local D1/R2. Covered staged upload compensation, concurrent cap
  of 60, required/trimmed alt, forged metadata/claims, tag-only edit, atomic order,
  private originals, failed deletion preservation, and unconfigured production decoder
  rejecting publication. Production decoder proof remains OPEN under T001.
- T033/T035: browser conversion and editor tests first failed on missing behavior;
  four then passed for orientation-aware sizing, format rejection before decoding,
  unsupported encoder recovery, required alt and failed-upload draft preservation.
- Local image service: a behavioral 503-to-200 red/green test verifies the loopback
  HTTP adapter with actual Sharp decoding and malformed-input rejection. Synthetic
  fixtures contain only generated solid colors. The service is excluded from the
  production Worker and does not prove Cloudflare Images entitlement or feasibility.
- The first complete browser journey caught a real list-response mismatch; the next
  caught Chromium canvas output carrying ICC metadata. Added a failing metadata
  stripping test before the fix; strict ancillary-chunk removal now follows the
  [WebP RIFF specification](https://developers.google.com/speed/webp/docs/riff_container).
  Public canvas output uses sRGB. A full-decode test corrupts PNG pixel data while
  preserving valid header dimensions/chunk lengths; the local decoder rejects it.
  The focused browser/tool suites pass 10 tests. Full-stack rerun is in progress.
- Recovery manifests retain deleted-image originals and derivatives privately with
  a 28-day target expiry. Scheduled reconciliation/cleanup is still T058; the R2
  unconditional physical deletion deadline remains the approved T001 release gate.

### US3 local completion checkpoint

- Full-stack Chromium desktop/mobile upload → oriented public image → reorder/edit →
  remove journeys passed (2/2). Each already-open publication/removal assertion completed
  within its 60-second bound; whole journeys took approximately 60 and 51 seconds.
- A separate real API/D1/R2/decoder run uploaded 60 synthetic images, disabled upload at
  capacity, and verified Home ordering, Newborn filtering, empty Maternity, and no horizontal
  overflow at 320/768/1280px (passed, 5.2 seconds). No production entitlement was exercised.
- API suite expanded to 9 passing cases: omitted alt, all gallery operations with missing,
  expired and removed-owner credentials, and D1 delete failure after R2 deletion restoring
  all four stored objects. Strict operation-level contract coverage remains in T059.
- T033/T035/T036 local obligations are complete. T034 remains partial because production
  authoritative decoding and scheduled interrupted-operation reconciliation are still open.

## US4 banners: local red/green checkpoint

- API tests first failed 3 behavioral cases with 404 (authorization already denied by
  the shared guard). Shared schema/timezone tests failed 2 cases before implementation.
  Six then passed covering UTC normalization, exclusive end, overlap/creation priority,
  safe links, invalid calendars, DST gaps/folds, non-hour offsets, atomic audit rollback,
  and missing/expired/removed-owner sessions.
- UI tests first failed missing editor/banner behavior. Additional regressions reproduced
  a stale local clock after resume and rendering saved banners before timezone loading;
  all 4 component tests pass after fixes. Local expiry removes the banner even if the
  API cannot refresh it. The editor preserves failed-save drafts.
- The initial full-stack Chromium desktop scheduling/resume/overlap/delete/outage expiry
  journey passed (1.1 seconds with a controlled browser/Worker clock). The expanded
  desktop/mobile journey adds edits and every public route; results recorded next.

## US5 settings: local red/green checkpoint

- Three API tests first failed with 404; all pass after protected configuration routes.
  Invalid addresses/options/timezones, missing public contact, unverified sender, provider
  outage, and audit failure leave the old complete configuration intact. Sender verification
  now distinguishes unavailable (502) from unverified (400). A subsequent synthetic inquiry
  uses the saved private recipient/sender; the public projection exposes only approved fields.
- The UI test failed on missing fields, then passed. Public contact is explicitly labeled
  as displayed and monitored; empty options are blocked and failed-save edits are preserved.
- At this checkpoint the full Vitest suite passes 31 files / 124 tests; typecheck, lint and
  web production build pass. Browser settings/expanded banners are running. Live-mail and
  human acceptance remain OPEN under the local-only exception (T046/T063).

### US4/US5 browser completion (local)

- Expanded banner checks passed on Chromium desktop/mobile, including editing, next-load
  display on all seven public pages, overlap/deletion, background resume, and local expiry
  during a bootstrap outage. The controlled clock measures scheduling behavior; it does not
  replace deployed clock/cache evidence or human comprehension review.
- Settings journeys passed on Chromium desktop/mobile (26.1/26.0 seconds for the complete
  workflows). Already-open recovery-email/options updates were each strictly under 60 seconds.
  Removed selected locations remain labeled “no longer available”; submission requires a
  current selection while preserving the draft. Synthetic dispatch then used the new private
  recipient and unchanged sender. Unverified sender saves were rejected and reload restored
  the last saved settings. Real mailbox delivery is still OPEN (T046/T063).

## US6 backend red/green checkpoint (2026-11-14)

- `clients.test.ts`: five initial behavioral 404 failures, then seven passing cases including
  manually entered CRUD/search, complete ordered checklist propagation/rollback, new-client
  initialization, ID/time-only deletion receipts, interrupted deletion/retry, concurrent
  ledger entries, fail-closed missing ledger/receipts, and retained template references.
  Search first exposed an SQL ESCAPE defect; fixed using a literal ! escape, retaining
  bound parameters and literal wildcard handling.
- `workflow.test.ts`: five behavioral failures against runnable placeholders, then five
  passing validation/expansion/snapshot tests. Optional session dates preview as “Not
  scheduled”; optional phone/date persist as null. Expansion is single-pass and previews
  retain {{questionnaireLink}}. Questions are capped at 40; short/long answers at 300/4000
  trimmed characters, within the shared 64 KiB request envelope.
- Migration `0002_lifecycle.sql` followed a failing schema inventory test. It records the
  independent recovery-ledger identity and one-way initialization state. The ledger head
  uses R2 conditional ETag writes; receipt keys contain only client ID/deletion time. A
  missing initialized ledger is never recreated implicitly. Restore and retention replay
  remain T058, and physical expiry guarantees remain T001.
- `questionnaire.test.ts`: six initial behavioral 404 failures; eight tests now pass for
  immutable snapshots, concurrent single-use submission, exact expiry, deletion/isolation,
  validation, rollback of answers plus claim, ordinary email, shared invitation expansion,
  all-occurrence history redaction, rejected/uncertain delivery, and known acceptance with
  history failure. Tokens remain transient in the provider double; assertions use booleans
  for token comparisons to avoid diagnostic disclosure.
- The current focused API run passes 21 tests across clients/questionnaires/migrations.
  Typecheck and lint pass. US6 browser/editor work and full release gates remain open.

## US6 interface and local workflow checkpoint (2026-11-14)

- Master-editor, client-detail and public-questionnaire component checks pass (3, 5 and 2
  cases respectively). Draft preservation, immutable invitation labels, delivery uncertainty,
  accepted-but-unrecorded sends, and explicit submission-status recovery are covered.
- The first full browser journey exposed a controlled checkbox reverting before server
  acknowledgment. A focused component reproduction failed; optimistic state with rollback
  made it pass. A subsequent run started while the web build was still completing and timed
  out loading client details. After build completion, all six Chromium desktop/mobile
  client journeys passed without retry (40.8 seconds total). Complete workflow times were
  24.8/5.3 seconds, synthetic automation only; human three-minute acceptance remains OPEN.
- The workflow covers independent clients, checklist addition/rename/reorder, failed
  propagation, all-incomplete new-client initialization, placeholder preview, transient
  invitation delivery, visitor submission, immutable question/choice history, safe invitation-ID
  navigation, isolation, and deletion invalidating the public link. T054–T056 are implemented.
  T057 still needs actual mailbox receipt and owner timing.
- Tokenized journeys disable screenshots/traces. A deliberate failing diagnostic probe
  confirmed raw synthetic tokens were absent from console output and the decoded HTML-report
  archive after reporter sanitization. The probe was removed. Full artifact/security gates
  remain T059/T062; this is not a blanket artifact guarantee.

## Operations checkpoint (2026-11-14, local exception)

- Four initial behavioral failures covered backup absence, unsafe restore acceptance,
  missing-ledger acceptance, and missing transient cleanup. Nine cases now pass: private
  snapshots excluding transient credentials/dedupe/rates; deletion replay before reopening;
  missing/incomplete ledger refusal; expiry/checksum refusal; atomic import rollback;
  cleanup outage/retry; private original/variant recovery; and bounded health signals.
  Another red case caught token-bearing history entering a backup; capture/restore now reject it.
- Focused operations/client/questionnaire/migration: 30 tests passed. Typecheck passes.
  `operations:local backup`, `restore <returned-key>`, and `reopen` were rehearsed successfully
  against isolated synthetic .wrangler/e2e state. No remote operation ran.
- Migration 0003 preserves ledger identity and adds durable restore status: live, blocked,
  verified-but-closed. Failed restore stays blocked; success still needs explicit reopen.
  No HTTP restore endpoint exists. Cron runs cleanup every five minutes, backup/health daily.
- Recovery copies target day 28 and restore refuses them at expiry. Receipt retirement
  starts at day 31 after overdue copies are deleted and absence verified. ETag updates and
  a resumable retirement list preserve concurrent deletions/interrupted cleanup. These local
  controls do not prove unconditional physical expiry during provider outages; T001/T058
  production retention and monitoring validation remain OPEN.
- D1 batch transactions and current per-invocation accounting were verified in
  [binding documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/) and
  [limits](https://developers.cloudflare.com/d1/platform/limits/). Snapshot/import uses atomic
  batches, bound values, and a fixed table/column allowlist. Snapshots are capped at 16 MiB;
  larger-database operational feasibility requires separate validation.
- Initial expanded contract run: 18 files / 104 checks pass. Existing API response witnesses
  now pass through operation-specific OpenAPI assertions. All operations declare maintenance;
  all body-bearing methods declare 413. Exhaustive authorization inventory is still in progress.

## Release-check progress (2026-11-14)

- The authorization inventory now verifies all 31 protected operations against missing,
  expired, non-owner and removed-owner sessions. Auth plus declaration/contract checks passed
  57 tests. Response assertions are applied to real local API integration responses, including
  the three distinct email failure contracts. Maintenance and all applicable body-size errors
  are declared per operation. No raw response payload is printed on a contract mismatch.
- Public and owner automated axe WCAG 2/2.1/2.2 A/AA checks and public keyboard skip-link
  navigation passed on Chromium. All seven public prerenders expose headings, descriptions,
  canonical metadata and sitemap entries; private routes have no canonical and are noindex.
  Screen-reader, physical-print and owner photo-alt review remain OPEN.
- Header tests first failed because CSP was absent. Static assets now use a generated policy
  with exact inline-script hashes; Worker fallback responses independently apply the same
  policy. API responses deny script execution. Chromium and WebKit hydration checks passed.
  Firefox exposed Zod's optional eval-based JIT probe; configuration now disables it before
  shared schema construction, following [Zod's CSP guidance](https://zod.dev/compile).
  Firefox's executable disappeared after launch on this runner, including after a normal
  Playwright reinstall; the final Firefox rerun is not yet verified. No security settings
  were disabled or exclusions added.
- `pnpm audit` initially reported two moderate development-only transitive vulnerabilities.
  Scoped overrides use esbuild 0.25.12 and minimatch 11.0.8. Audit now reports no known
  vulnerabilities; lint and types pass. Primary advisories:
  [esbuild](https://github.com/advisories/GHSA-67mh-4wv8-2f99),
  [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).
- Privacy gates followed failing token/archive tests. They inspect repository secret patterns,
  decoded HTML-report ZIP text and diagnostic text, reject raw trace ZIP uploads, and only
  allow artifact upload after a passing scan (seven-day retention). Both local scans pass.
  Binary screenshots remain limited to synthetic non-tokenized journeys; live traces are
  excluded. This gate does not replace content review or justify introducing real data.
- Separate API/web deployment workflows are prepared, with same-commit Quality checks,
  manual dispatch, production-environment review configuration and an exact evidence commit.
  The release guard was observed rejecting current unchecked tasks before preparing any
  remote configuration. No deploy/migration/secret upload was attempted.

### Provisional performance evidence

The owner-approved photograph fixture is unavailable. The versioned manifest explicitly
records `approvedPhotos: false` and `kind: synthetic-load-only`. Sixty distinct deterministic
textures meet the prescribed 2000/800/320 dimensions and 150–160/56–64/12–16 KiB envelopes,
with exact sizes and SHA-256 hashes. These measurements are provisional local engineering
evidence; they do not satisfy the approved-photo, deployed-provider, or field-data gates.

The profile seeds 200 synthetic clients, nine pricing packages, four required FAQs, service
content, contact options, an active banner and one immutable ten-question invitation. A bad
How It Works fixture shape initially caused a bootstrap 500; a failing API reproduction
preceded correcting the fixture to title/body objects. No failed timing sample was relabeled
as a successful run.

All 13 JSON GET operations passed ten warm-ups then 100 samples at concurrency five, expected
200 bodies fully read and caches bypassed. Nearest-rank p95 ranged from 37 to 311 ms, all
strictly below 500 ms. Raw samples and runner details are retained in
[local-api-latency.json](./evidence/local-api-latency.json). Mobile cold-load and inquiry
measurements are still in progress; no full SC-004/009 pass is claimed.

The 20 independent mobile inquiry samples passed, each between 888 and 913 ms from first
Submit to visible acceptance, with a cold refresh token and fixed 200 ms CAPTCHA/provider
boundaries per run. Raw timings are in [local-inquiry-latency.json](./evidence/local-inquiry-latency.json).
This does not measure mailbox receipt, live Turnstile, deployed latency or human typing.

The first cold-load interaction attempt found that the prerendered mobile Menu could accept
a click before hydration installed its handler. A component test reproduced the missing
disabled state. The Header now uses React's server/client store snapshots to enable the
button only once hydrated; the component check passes, including open/Escape/focus behavior.
The cold-load suite is being rerun against the rebuilt frontend; its earlier failure remains
recorded and is not a passing timing sample.

The completed first 40-run cold baseline is retained in
[local-mobile-baseline.json](./evidence/local-mobile-baseline.json). Service-route usable
medians were 3448–3527 ms, exceeding 3000 ms; service/contact layout shift reached 0.877
and About reached 0.142. These are failures. Focused component tests then reproduced a
redundant initial fetch and incorrect empty-gallery state. The prerender now starts a bounded
public bootstrap request before hydration; the provider consumes it once, retaining periodic
refresh. Pending galleries, service copy and the contact form reserve layout space. Both
component checks now pass. The unchanged 40-run profile is being repeated after rebuilding.

Additional inquiry API validation checks passed for conditional phone, forged recipient,
date/numeric/message bounds and blank optional fields (18 inquiry API cases in the focused
run). Browser coverage for the full optional form and API-outage contact recovery is pending.

The second cold run recorded 33 samples before the runner reported a 2.8-hour elapsed test
and hit its 600-second timeout; the retained partial data is
[local-mobile-layout-fix.json](./evidence/local-mobile-layout-fix.json). It contains the
20,544 ms Home LCP outlier and service medians 3298–3386 ms; no samples were discarded.
Service, About and Contact layout shift dropped to 0.056, while FAQ revealed a separate
0.244 shift. The FAQ now reserves its answer region. A failing preload test preceded adding
a responsive, same-API-origin preload for the first service photograph, with its bytes still
included in the viewport transfer budget. Another complete profile is required.

Generated 404/405/503 web responses initially failed three security-header tests; they now
retain no-store, noindex, no-referrer, nosniff and a deny-all script policy. A valid 80-character
client search returned 500 in the real local D1 test, matching the documented
[50-byte LIKE/GLOB pattern limit](https://developers.cloudflare.com/d1/platform/limits/).
Bound literal substring search now handles the accepted 200-character range, case folding
and wildcard-looking text. Focused search/preload/header checks pass 13 tests.

## Final local verification in progress (2026-11-14)

- The complete Vitest run passed 49 files / 224 tests in 68.97 seconds, including real local
  Worker/D1/R2 transactions, failure injection, strict operation contracts and all protected
  operations. Formatting, lint and TypeScript passed; web production prerenders/security
  generation and API dry-run build passed. Earlier typecheck issues in test options and
  optional bootstrap state were corrected before this run.
- Repository privacy scan checked 371 files with no blocked findings. Dependency audit
  reports no known vulnerabilities after scoped development dependency overrides.
- A normal pinned Firefox reinstall repeatedly failed with Windows EPERM while opening
  firefox.exe. After repeated installer attempts it was stopped. Firefox remains BLOCKED on
  this runner, not passed or removed from CI. No security configuration was changed.
- The full non-performance Chromium desktop/mobile and WebKit desktop/mobile matrix is
  running 112 cases. Performance runs separately to avoid concurrent CPU contention.

The first complete browser matrix exposed two regressions. A repeated banner save retained
the preceding success message while its request was pending; a focused component test failed
before adding explicit saving/deleting status and now passes (5 banner cases). The pricing
PDF failed because CSP blocked Yoga's bundled WebAssembly data URI. The policy now allows
that embedded data fetch and the narrower `wasm-unsafe-eval`, while continuing to exclude
JavaScript `unsafe-eval` and additional network origins. This distinction follows
[the browser CSP documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution).
A policy assertion failed before the change and passes afterward; built browser reruns are
still required. A diagnostic response-header interception could not verify the PDF because
Chromium classified the fulfilled document outside the loopback address space; this is not
accepted as product verification.

WebKit's keyboard run then reproduced an unfocusable skip link under its default link-tabbing
behavior. A direct page probe confirmed that explicit tabindex=0 makes Tab reach the link;
the component assertion failed before adding that attribute and all four public-content
component tests now pass. The browser keyboard/axe rerun will verify Enter reaches main.
The quickstart now reflects implemented local scripts, separate synthetic and normal dev
servers, trace restrictions, and manual gated deployment instead of obsolete planned commands.

During the matrix the tool host timed out/restarted and wall time jumped about 50 minutes.
WebKit mobile's keyboard test recorded 49.7 minutes and the following questionnaire/detail
case timed out on initial navigation. These failures remain recorded; the changed keyboard,
PDF and banner paths plus affected WebKit accessibility cases will be rerun after rebuild.

The next performance run tightens the readiness probe: loaded FAQ/About content and the
active fixture banner are asserted; viewport decode/paint precedes the first input so LCP
observation is not ended early. Earlier timing files remain historical partial evidence.
Browser Date is fixed to the API fixture instant while performance timers/RAF run normally,
preventing a long local session from expiring the fixture banner. Navigation phase timings
are retained to diagnose future startup outliers. All thresholds and five cold runs remain.

The first four-project non-performance matrix completed with 104 passing / 8 failing /
0 flaky / 0 skipped cases. Counts are retained in
[local-browser-baseline-summary.json](./evidence/local-browser-baseline-summary.json).
All contact, gallery, client, settings, SEO and deep-link cases passed on these four projects;
known failures and the runner interruption are described above. Artifact privacy checked
18 generated files with zero blocked findings before starting the corrective run.
A rebuilt 44-case run now covers accessibility, banners, pricing, CSP hydration and client
workflows in all four projects. The client history journey additionally deletes/reorders
master questions after submission and checks original prompts, choices, answer values and
order across three captured question types.

The JS budget now also counts inline script bytes (uncompressed, a conservative addition to
encoded external-resource sizes), including the new early bootstrap/preload script. This
avoids excluding executable inline code from the transfer check. No threshold was increased.

The rebuilt correction matrix passed 43/44 cases. All eight original failing paths now
pass, including PDF/print, banners, and WebKit keyboard/axe. Its summary is retained in
[local-browser-corrections-summary.json](./evidence/local-browser-corrections-summary.json).
The expanded WebKit mobile owner workflow saw an empty email after the automation fill;
other project runs and its earlier complete journey passed. A consecutive-field component
probe passed without a product change. The browser helper now explicitly verifies all three
entered values before Submit; a single diagnostic rerun is pending. The original failure
is not removed or treated as a clean matrix pass.

Final formatting/lint/types passed, and the complete regression suite passed 49 files /
225 tests in 67.96 seconds after the banner, CSP and skip-link fixes. The additional
consecutive-field probe passed in the six-case client component run.

The single diagnostic WebKit mobile owner-workflow rerun passed in 12.2 seconds with the
entered-value assertions. Across the initial/corrective runs, all 112 non-performance
project/case combinations have passing evidence, but the intermittent input failure remains
recorded and T059 is not marked complete. Firefox also remains blocked by Windows EPERM.
The release guard and CI fail-on-flaky policy remain unchanged. T048 and T062's implemented
local coverage is complete; this is not a real-device, real-mail or production approval.

A measurement-harness defect was detected before any new cold-load sample was recorded:
Playwright's fixed-time helper replaced Performance entries, leaving navigation timing absent.
The failed attempt is not timing evidence. The profile now sets the API fixture date to the
runner's current date immediately after each reset and leaves browser Date/Performance APIs
native. Each cold result records its fixture instant; banners and invitations stay valid
without changing browser measurement behavior. A complete native-clock rerun follows.

## Final local performance and release gates (2026-11-14)

The native-clock mobile rerun completed all 40 cold samples: five per public route, with
fresh browser contexts, caches disabled, 375×812 viewport at DPR 1, 4× CPU slowdown,
1.6 Mbps down / 750 kbps up / 150 ms RTT, and the full synthetic fixture. No other heavy
verification ran concurrently. The unchanged usable, LCP, CLS and transfer thresholds all
passed. Raw samples, navigation phases, runner/browser versions and fixture instants are in
[local-mobile-final.json](./evidence/local-mobile-final.json).

| Route                          | Usable median (ms) | Maximum LCP (ms) | Maximum CLS | Maximum JS bytes | Maximum viewport image bytes |
| ------------------------------ | -----------------: | ---------------: | ----------: | ---------------: | ---------------------------: |
| Home                           |               1823 |              836 |       0.056 |           150657 |                            0 |
| Maternity                      |               2488 |             2304 |       0.056 |           187584 |                        59572 |
| Newborn                        |               2497 |             2304 |       0.056 |           187577 |                        57580 |
| Family                         |               2481 |             2316 |       0.056 |           187573 |                        59804 |
| About                          |               2007 |              940 |       0.056 |           184938 |                            0 |
| FAQ                            |               1988 |              948 |       0.056 |           184837 |                            0 |
| Contact                        |               2093 |              952 |       0.056 |           154432 |                            0 |
| Questionnaire (token redacted) |               1876 |             1616 |       0.006 |           147236 |                            0 |

Scripted interaction elapsed times were 16.2–68.3 ms; these are lab probes, not field INP.
JS totals include inline code. Images are deterministic load textures, not approved portfolio
photographs. These are provisional local results and do not close T061 or SC-004/009's
remaining approved-content, deployed-provider and field-data requirements. The earlier
failures and interrupted runs remain retained above.

The latest JSON-read profile again passed all 13 operations, each with ten warm-ups and
100 fully read responses at concurrency five. Nearest-rank p95 ranged from 30.9 to 197.0 ms,
strictly below 500 ms; see [local-api-latency-final.json](./evidence/local-api-latency-final.json).
Twenty further independent mobile inquiry submissions took 889.9–927.6 ms, all below five
seconds; see [local-inquiry-latency-clock-run.json](./evidence/local-inquiry-latency-clock-run.json).
Those two files precede the native-browser-clock correction: the read profile has no browser,
and inquiry elapsed time uses Node's native performance clock. The inquiry run is valid
Submit-to-visible-provider-acceptance evidence, not browser resource timing or mailbox receipt.
Its historical runner clock description does not imply that browser Performance entries were
usable. Both runs use external-provider doubles with the specified delays.

Two final deployment regressions were reproduced before fixes: reserved example/test origins
were accepted, and the actual prepare-release CLI wrote the owner allowlist into plaintext
configuration. The release guard now rejects reserved domains and literal IP hosts for public
origins/contact configuration. The CLI omits `OWNER_ALLOWLIST` and `GOOGLE_CLIENT_ID`, which
remain separately provisioned Worker secrets. Both regression tests pass. A Windows test-loader
setup error was fixed before observing the real failing assertion; it is not counted as red.

### Outstanding task evidence

The approved exception's independent local implementation is complete. **51 of 63 tasks are
checked; 12 remain open** because their full acceptance requirements are not met:

| Task | Completed local portion                                                                             | Evidence still required                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T001 | Provider research, fail-closed boundaries and approved exception                                    | Unconditional physical recovery/receipt expiry and production decoder entitlement/resource proof                                   |
| T023 | Complete validated contact and uncertain-delivery recovery flow                                     | Owner privacy copy and approved, monitored public contact address                                                                  |
| T025 | US1 API/component/browser and controlled inquiry timing                                             | Real mailbox delivery and predeclared human acceptance                                                                             |
| T031 | Pricing parity, navigation, browser print/PDF and local PDF inspection                              | Physical print and owner content/readability acceptance                                                                            |
| T034 | Local authoritative decoding, upload/publication, metadata removal and failure cleanup              | Production authoritative decoder evidence under T001                                                                               |
| T046 | Settings, stale-form and controlled propagation checks                                              | Changed-recipient real-mailbox acceptance                                                                                          |
| T057 | Integrated owner workflow, isolation and immutable history                                          | Actual mailbox receipt and unassisted three-minute owner timing                                                                    |
| T058 | Private backup, restore/deletion reconciliation, media recovery, cleanup and health tests/rehearsal | Physical expiry guarantees and production monitoring/alerting proof                                                                |
| T059 | CI definition, strict contracts, privacy gates and a later 150/150 combined functional matrix       | Remote CI execution and unresolved historical WebKit input loss; passing local runs do not establish its cause or a fix           |
| T060 | Separate guarded workflows and built local fallback/security checks                                 | Real HTTPS deployment and remote rollback rehearsal                                                                                |
| T061 | Automated axe/keyboard, SEO, responsive layouts and provisional lab performance                     | Screen-reader/photo-alt review, approved photo fixture and deployed/field evidence                                                 |
| T063 | Local quickstart coverage and release acceptance register                                           | Actual browser/device matrix, live/human acceptance and owner content/privacy approvals                                            |

No live messages, real-client imports, paid subscriptions or public deployments were performed.
The release guard continues to refuse deployment while any task is unchecked. The exception
does not relax retention, privacy, image validation or hosting requirements.

Final regression validation passed **50 files / 227 tests** in 125.22 seconds. Formatting,
ESLint, all TypeScript projects, the seven-route production prerender/security build and API
dry-run build passed (`pnpm check`, exit 0). The lazy PDF bundle still emits a build-size
warning; it is loaded on download and the measured initial-route JS budgets pass. The first
final-check attempt reported two tooling
lint issues (an unnecessary regex escape and a throw inside finally); both were corrected
before this passing regression run. Repository privacy scanned 377 files and artifact privacy
scanned five files with zero blocked findings. The dependency audit found no known
vulnerabilities. These results do not erase the separate browser failures recorded above.

### Firefox installation retry requested by owner (2026-11-14)

The owner requested another Firefox installation attempt while preparing a Norton rule.
`pnpm exec playwright install firefox` downloaded pinned Firefox 159.0 / build 1572,
but all five installer attempts failed with Windows `EPERM` when opening
`%LOCALAPPDATA%\ms-playwright\firefox-1572\firefox\firefox.exe`; the command exited 1.
The executable was absent on inspection. Norton rule activation has not been confirmed;
no Firefox test run or successful installation is claimed. No antivirus settings were
changed by the agent. The existing Firefox verification gate remains open.

The owner then confirmed an exclusion for the exact executable path. A new normal installer
run still failed all five attempts with the same `EPERM` and exited 1. The browser cache's
ACL grants the current user FullControl, and no Firefox process was running; the installer
removed its incomplete target directory. The error alone does not identify the blocking
security component. Norton Security History details and the exclusion type were requested
before further changes. Firefox installation and browser verification remain blocked.

After the owner reported temporarily disabling malware protection, another requested normal
installation retry again failed all five attempts with `EPERM` at the same executable and
exited 1. The executable remained absent. Read-only checks showed Windows Defender was not
running and no matching recent Defender detection/block events were found. The owner was
advised to re-enable Norton because the temporary pause did not resolve installation. No
security settings were changed by the agent and no Firefox suite was started; the exact
blocking component remains unconfirmed.

On the owner's next request, the normal Playwright installation again ended with `EPERM`
at the same path (exit 1). A separate direct download from Playwright's official CDN succeeded:
`Downloads/playwright-firefox-1572-win64.zip`, 132,237,406 bytes, SHA-256
`17abdb829293f482dae4c85be9e0dff5995a66457d8b3ca7a7efc6f5ef9c08c5`.
ZIP inspection found 77 entries, including the 1,139,712-byte `firefox/firefox.exe` entry;
this verifies the executable is present in the downloaded archive, not that it is installed
or runnable. The blocked executable was not relocated or renamed to bypass protection.

The additionally requested Windows executable was downloaded through Mozilla's official
[Firefox download page](https://www.firefox.com/en-US/download/windows/) into
`Downloads/Firefox Installer.exe` (508,216 bytes). Windows Authenticode reported **Valid**,
signed by **Mozilla Corporation**; SHA-256
`339f43cab6f09f5cfa815807561487e6277d22296e9e363408335f3cdea08426`.
This is Mozilla's standard installer, separate from Playwright's pinned browser. It was not
executed, and its successful download does not close the Firefox automation gate.

### Manually extracted Firefox verification (2026-11-14)

The owner installed standard Firefox and manually extracted the pinned Playwright archive
into `C:/Users/My PC/Downloads/playwright-firefox-1572-win64/firefox`. The extracted
`firefox.exe` is 1,139,712 bytes with SHA-256
`a8fa6c08d8a9e8cb961e74a626dd2f4c5064a853de38bcde3df3cb145ec44530`, exactly matching
the executable entry read directly from the downloaded archive. A Playwright headless launch
reported **Firefox 159.0** and rendered the local launch-check document successfully.

An ignored machine-local config, `.wrangler/firefox-local.config.ts`, imports the existing
Playwright configuration and supplies that explicit executable path to `firefox-desktop`.
It preserves one worker, zero automatic local retries, strict flake/focus checks, privacy
reporting and the real built web/Worker/D1/R2 servers. The three Chromium-only performance
cases are excluded; all 28 Firefox functional cases are selected. Command:
`pnpm exec playwright test --config=.wrangler/firefox-local.config.ts`.

The first run passed **27/28**, with zero skipped or flaky classifications, in 162.54 seconds.
The owner workflow failed with `NS_BINDING_ABORTED` at the first navigation after the failed
checklist-write/reload check. Its assertion only checked that a removed third item was absent,
which also passes while the entire checklist is still loading. The test now first verifies
that the two persisted labels are loaded, then checks the removed item is absent, before
navigating away. No product behavior, timeout, retry count or expected result was weakened.
The initial result is retained in
[local-firefox-baseline-summary.json](./evidence/local-firefox-baseline-summary.json).
Its four diagnostic files passed the privacy gate with zero blocked findings.

The single complete verification run with the stronger readiness assertions passed
**28/28**, zero failed, skipped or flaky classifications, in **161.68 seconds**. Its summary
is retained in
[local-firefox-corrections-summary.json](./evidence/local-firefox-corrections-summary.json).
The two resulting diagnostic files and 379 repository files passed privacy scanning with
zero blocked findings. Formatting and ESLint passed for the changed browser test, and
`tsc -p tsconfig.tools.json` passed. No application code or build changed in this follow-up.

Firefox availability is now resolved for this workstation through the owner's extracted
browser and the explicit local launch configuration. The historical installer failures and
first test failure remain evidence. T059 is still open for a clean combined engine matrix,
the recorded WebKit input issue and remote CI execution; T063's actual-device/previous-version
matrix and other live/human acceptance gates remain open. The task count stays 51/63.

### WebKit client-entry investigation (2026-11-14)

The immediate scope is the recorded WebKit mobile empty-email failure in the complete owner
workflow. Production image validation/recovery expiry, owner content/privacy/contact approval,
real-mail/human/device acceptance and deployment remain separate open gates.

**Code inspection and component evidence:** `ClientsEditor` stores the list and new-client
draft separately; the list-fetch completion updates only the list/loading state. The client
form is mounted after `AdminLayout` completes its React-driven session check. Generic
[pre-hydration input loss](https://playwright.dev/docs/navigations#hydration) is therefore
not established as this failure's cause. This inspection does not rule out a browser-specific
event or rendering race.

- Baseline: `node node_modules/vitest/vitest.mjs run apps/web/tests/clients.test.tsx`
  passed 6/6 before edits (3.53 seconds).
- The consecutive-field probe now dispatches native-style `input` events rather than
  `change`. Its title no longer claims that React renders were deferred; the event helpers
  can flush updates between events.
- Two new component cases hold the initial client-list response until immediately before
  or after email entry. Both verify all three fields after focus leaves email, the submitted
  POST payload, exactly one submission, and retained fields after a rejected save.
- The focused suite passed 8/8 (4.02 seconds); the web component regression suite
  `node node_modules/vitest/vitest.mjs run --project=web` passed 15 files / 44 tests
  (4.86 seconds). These probes pass with unchanged product code. **No behavioral red was
  observed and no product fix or red/green defect-resolution claim is made.**

**Browser probes prepared, execution blocked:** `e2e/clients.spec.ts` adds two `@client-entry`
cases comparing `fill` and `pressSequentially`. Both create Avery, Blake and Casey through
the real UI/API and assert persisted first name, last name and email after each reload.
The original owner workflow keeps its default consecutive `fill` calls and existing
pre-submit value assertions. No inter-field assertion/wait, retry, timeout increase, API
substitute, quarantine or skipped critical journey was introduced. Existing token-artifact
restrictions remain active.

The initial focused command was:

```powershell
node node_modules/@playwright/test/cli.js test e2e/clients.spec.ts --project=webkit-mobile --grep 'complete owner workflow' --repeat-each=10 --retries=0
```

With metrics disabled and Wrangler logs directed into `.wrangler/logs`, local D1 migrations
reported no pending changes. The API web server then exited 1 before any browser test:
esbuild reported `Cannot read directory "../../..": Access is denied` and could not resolve
the Worker entry point. A read-only probe confirmed the ancestor profile-directory listing
is denied in this session. A separate WebKit launch reported an unavailable executable at
the expected `webkit-2388/Playwright.exe` cache path; PowerShell inspection of that path
returned **Access denied**, so absence/corruption is not established. A normal installation
attempt targeting `.wrangler/browsers` failed with network `EACCES` at the official download
endpoints. The requested pinned engine is WebKit 27.2/build 2388, not a verified running
browser version. No access controls or security settings were changed.

`pnpm --version` also failed because Corepack could not create its cache directory. The
checks above use the installed local Node entry points, with Node 24.14.0 / Playwright
1.65.1. Existing application/toolchain configuration and user edits were preserved.

The command in quickstart.md selects three scenarios × two WebKit projects × ten repetitions,
with zero retries. Adding `--list` successfully discovers **60 cases**; this is test discovery,
not execution or a pass. Formatting, scoped ESLint, tools TypeScript and web TypeScript checks
pass after correcting a computed-method formatting/lint issue. That lint failure is not a
behavioral red. Machine-readable status is retained in
[local-webkit-investigation-summary.json](./evidence/local-webkit-investigation-summary.json).
Artifact privacy scanning checked two generated files and repository scanning checked 380
files, both with zero blocked findings. `git diff --check` passed. The optional Git
after-implementation commit hook was reviewed and left unexecuted; no commit was made.

**Disposition:** WebKit investigation and T059 remain **OPEN/BLOCKED on execution**. Resume
the predeclared browser run in a session with authorized toolchain/browser-cache access,
retain all failures, reproduce the behavioral cause before a product change, and then verify
the complete functional engine matrix and remote CI. Reinstalling WebKit alone cannot solve
the independent bundler access error or establish a fix for input loss. No launch gate closes;
51/63 tasks remain complete.

### WebKit execution resumed and probe locator corrected (2026-11-14)

The later follow-up session can read the ancestor profile directory and launch the existing
WebKit 27.2/build 2388 with Playwright 1.65.1 and Node 24.14.0. `pnpm build` passed, including
the production frontend and API dry run, and both local E2E servers started. The earlier
filesystem/cache restrictions do not apply to this session. No WebKit reinstall, access-control
change, security exclusion, paid service or deployment was needed.

The predeclared command in quickstart.md executed three scenarios × two projects × ten
repetitions, with one worker and zero retries. Separate output/report directories preserve
the initial and corrected runs; tokenized journeys still disable screenshots and traces.

- **Initial execution: 20 passed / 40 failed**, zero skipped or flaky classifications,
  394.80 seconds. All complete owner-workflow repetitions passed. Every new probe failed
  after saving the first synthetic client because `getByLabel('Client email', { exact: true })`
  selected both the actual email input and the email-composer region. The diagnostic showed
  the expected saved email in the input. This was a probe locator defect. All outcomes are
  retained in [local-webkit-access-followup-summary.json](./evidence/local-webkit-access-followup-summary.json).
- **Correction:** only the new probe's two post-save/reload email assertions now share
  `getByRole('textbox', { name: 'Client email', exact: true })`. The real client-creation helper,
  consecutive entry calls, pre-submit assertions, timeouts and retry policy are unchanged.
  The failing browser assertions precede this test correction; no product fix is claimed.
- **Corrected execution: 59 passed / 1 failed**, zero skipped or flaky classifications,
  460.37 seconds. All 30 desktop cases, 10 mobile typing cases and 10 mobile owner workflows
  passed. One of ten mobile `fill` probes failed before submission: the first name was empty
  after the three consecutive fills. The expected value was the synthetic name Avery.
  This reproduces an input-loss symptom in a different field from the historical email
  failure; a common cause is not established. Zero flaky classifications with retries
  disabled does not establish that the intermittent behavior is resolved.
- **Bounded diagnosis:** 50 fresh WebKit-mobile contexts using native HTML inputs passed
  consecutive fills; this does not establish the application's cause. One additional
  ten-case mobile diagnostic series recorded native focus/input/change events, field values
  and DOM identities passively, without modifying events or adding inter-field waits. All
  ten passed, so no failing event sequence was captured. The ignored local diagnostic files
  are `.wrangler/client-input-diagnostic.spec.ts` and `.wrangler/client-input-diagnostic.config.ts`;
  they are workstation investigation aids, not required CI files. No additional repeat-until-green
  run was used to replace the failed result.

The corrected outcomes and diagnostic summary are retained in
[local-webkit-locator-corrections-summary.json](./evidence/local-webkit-locator-corrections-summary.json).
Scoped ESLint, tools TypeScript and test-file formatting checks passed after the selector edit.
Artifact privacy scanned 51 files and repository privacy scanned 382 files, with zero blocked
findings. Product code remains unchanged because the evidence does not distinguish a missing browser input event, a remount,
or an application state overwrite. The next useful evidence is a failing event sequence or
a deterministic component reproduction, followed by a targeted correction and full engine
verification. **Browser execution is unblocked; input-loss diagnosis, the clean combined
matrix, remote CI and T059 remain open. The task count stays 51/63.**

### Implementation continuation and bounded diagnostics (2026-11-14)

The requested implementation continuation passed prerequisites and the requirements
checklist (16/16). Existing Git/Spec Kit configuration changes, runtime files and prior
untracked evidence were preserved. The existing Git, ESLint and Prettier ignore rules
cover dependencies, builds, local state and secrets; no additional ignore file was needed.
The owner explicitly requested that the missing Contact privacy text **remain pending**;
T023 stays open. The approved local-development exception remains the scope boundary.

One predeclared diagnostic run used the ignored
`.wrangler/client-input-diagnostic.config.ts`, WebKit mobile, 30 repetitions and zero
retries. All **30/30 passed**, zero skipped/flaky classifications, in **137.99 seconds**.
The recorder also captured event trust/input type and document focus without adding
inter-field waits. No failing sequence was captured, and no product fix is claimed.
The earlier 59/60 result and historical email loss remain unresolved evidence.

`e2e/client-input-diagnostics.ts` now supplies passive failure diagnostics for the checked-in
client browser cases. Records contain event types, field lengths, focus state and stable
DOM identities; they exclude entered values, URLs and tokens and retain at most 200 events
per document. Only a failed client case attaches the record. Input operations, assertions,
timeouts, retry policy and product code are unchanged. This is test instrumentation, not a
behavioral red/green defect fix. Instrumentation can change timing and cannot establish that
an intermittent defect disappeared.

A standalone check initially failed under `tsx` because its serialized callback referenced
the transpiler's unavailable `__name` helper; the log was empty. The same check under the
actual Playwright test loader passed **1/1**, verifying native input/field lengths, DOM
replacement, the 200-event bound, exclusion of all entered contact values and the closed-page
empty-record fallback. Command: `pnpm exec playwright test
--config=.wrangler/verify-client-diagnostics.config.ts`. This ignored, synthetic-only probe
requires no application servers and does not replace the full application journeys.

`pnpm check` passed: formatting, ESLint, TypeScript, **50 files / 229 tests** (86.22 seconds),
the seven public prerenders plus SPA fallback, frontend security/sitemap generation and API
dry-run build. Scoped formatting, lint and tools TypeScript also passed for the added
diagnostics. Dependency audit reported no known vulnerabilities. Repository privacy checked
383 files with zero blocked findings. Existing build warnings remain: a large lazy PDF
chunk, a mixed static/dynamic API import and framework deprecation/future flags.

The GitHub Actions read-only API reported **zero workflow runs** for this repository.
No remote CI success, live-provider result or deployment is claimed.

**Combined functional result:** one run of
`pnpm exec playwright test --config=.wrangler/implementation-matrix.config.ts` passed
**150/150** in **821.73 seconds**, with zero failed, skipped or flaky classifications and
zero retries. Each of Chromium desktop/mobile, Firefox desktop and WebKit desktop/mobile
passed all 30 functional cases. The ignored machine-local configuration preserves the
base test configuration, one worker, focus/flake rejection, real built web/Worker/D1/R2
stack and privacy reporter. It only supplies the previously verified owner-extracted
Firefox executable, separate output/report paths and excludes `performance.spec.ts`.
Runtime versions: Node 24.14.0, Playwright 1.65.1, Chromium 159.0.8154.6, Firefox 159.0,
WebKit 27.2. Mobile projects are emulated on Windows, not actual-device evidence.

Every functional case/outcome and duration is retained in
[local-functional-matrix-summary.json](./evidence/local-functional-matrix-summary.json).
The separate diagnostic result is retained in
[local-webkit-event-followup-summary.json](./evidence/local-webkit-event-followup-summary.json).
Performance was not rerun after test-only changes; its existing provisional/photo/field
limitations remain. All earlier failing runs remain recorded. A successful combined local
run is now available, but the intermittent WebKit input-loss cause is still unproven.

No task acquired all its outstanding evidence in this continuation: **51/63 remain complete**.
T001/T034/T058 need production decoding/retention evidence; T023 awaits owner privacy copy;
T025/T031/T046/T057/T061/T063 retain their live, human, content, physical-device or manual
acceptance obligations; T059 needs remote CI and resolution of the intermittent issue;
T060 needs authorized HTTPS deployment/rollback evidence. No product fix, live send,
paid service, deployment or commit was performed.

Final artifact privacy scanned **55 files** and repository privacy scanned **385 files**,
both with zero blocked findings; `git diff --check` passed. The after-implementation
extension configuration was parsed again: its only applicable hook is the optional Git
commit hook, which was displayed and left unexecuted. No mandatory hooks were registered.

## 2026-11-14 — owner-guided release gate review

The owner requested resolving Production, live/human acceptance, remote CI and deployment
one at a time, with explicit identification of needed owner inputs. This review begins with
Production. No remaining gate is passed by this review; **51/63 tasks remain complete**.
Existing hosting selection and R2 enrollment remain accepted. The owner-requested Contact
privacy-copy deferral remains pending until replacement copy or a new decision is supplied.

### Checks performed in this review

- Spec Kit prerequisites identify this feature; `requirements.md` is complete (16/16).
- Existing Git, Prettier and ESLint ignore rules cover the detected private Node/TypeScript
  workspace and Python tooling. No ignore-file change is needed.
- The current local commit is `7416b3c869493c9af35797ef10d0ec5185806ab8`.
  Existing unrelated workspace changes were left intact. Application suites were not rerun
  for this documentation-only review; the previous 229-test and 150-case results above
  remain historical evidence, not new executions.
- `node node_modules/wrangler/bin/wrangler.js whoami` reports **not authenticated**.
  No account entitlement, resource inventory or deployed behavior was verified. No temporary
  account, resource creation, subscription, live send or deployment was attempted.
- `productionRuntime` has no `validateImages` implementation. The gallery service rejects
  publication without it. Closing T001/T034 requires implementation as well as account and
  deployed evidence; signing in alone does not close the gate.
- Current provider documentation still describes asynchronous R2 lifecycle deletion and
  inconsistent Images binding prerequisites: the pricing page includes free transformations,
  while the upload tutorial requires Images Paid. This does not establish this account's
  eligibility for private-byte transforms under the existing budget.

Sources rechecked: [R2 lifecycle behavior](https://developers.cloudflare.com/r2/buckets/object-lifecycles/),
[Images pricing](https://developers.cloudflare.com/images/pricing/), and
[Images upload tutorial](https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/).

### Sequence and owner inputs

| Gate | Work to complete | Owner input needed at that stage |
| --- | --- | --- |
| 1. Production — T001/T034/T058 | Resolve retention policy, implement/prove authoritative image validation, verify resource budgets and operational monitoring | Retention decision first; then sign in to the selected Cloudflare account and identify the operational alert recipient/channel. Any paid option requires a separate concrete decision. |
| 2. Live/human acceptance — T023/T025/T031/T046/T057/T061/T063 | Record actual mailbox delivery, usability/owner timings, accessibility, physical print, approved-photo performance and actual-browser/device evidence | Designated test mailboxes and Google/Turnstile setup; final content/privacy/contact/photo approvals; 10 first-time participants (at least five mobile/five desktop), owner participation and required browser/device access. |
| 3. Remote CI — T059 | Run the configured full remote matrix for the reviewed commit, resolve failures and address the historical intermittent WebKit input loss | GitHub access if unavailable; identify any account-side Actions restrictions. The recorded zero-run result above was not refreshed in this review. |
| 4. Deployment — T060/T063 | Rehearse HTTPS configuration, migration/restore/rollback and smoke checks, then release the accepted artifact | Confirm the prepared deployment inventory and release when it is concrete and reviewable; provision credentials through local/provider secret mechanisms. |

Remote CI needs no live-provider secrets and may be prepared independently. Live-provider
acceptance requires a deployed environment, so the four gates are not four completely
independent deploy phases. The present `releaseGate()` rejects **every** unchecked task,
including T060/T063 tasks requiring deployed evidence. A separate isolated acceptance/probe
path must be designed and reviewed before provider-connected execution, with synthetic
data, designated accounts, bounded usage, access controls and cleanup. Keep the final
production gate strict; do not check incomplete tasks merely to enable an acceptance run.

### First owner proposal — subsequently approved below

QR-002 currently imposes an unconditional maximum retention period for deleted client data
in recovery copies and 31-day deletion receipts. R2 lifecycle documentation does not prove
those deadlines during provider outages. The proposed alternative is an operational policy:

- Keep live deletion and private recovery storage; refuse expired or unsafe restores.
- Start verified backup/media recovery deletion at day 28 and target completion by day 30.
- Target deletion-receipt expiry at day 31; reconcile the ledger before any restore reopens.
- Retry delayed deletion, monitor missed cleanup/freshness independently, notify the owner,
  and explicitly disclose that provider outages can delay physical removal.

The owner may instead retain the strict deadlines and require another demonstrably feasible
retention design. No policy amendment, new exception or production approval is inferred from
the request to walk through gates. If the operational policy is selected, synchronize the
specification, plan, data lifecycle, contracts, tasks and runbook, then implement and verify
missing controls before considering T001/T058 complete.

## 2026-11-14 — operational retention approved; Pixieset delivery scope selected

The owner explicitly approved the proposed retention amendment: **"Adopt the operation
policy."** This is authorization to synchronize QR-002 and its dependent design/runbook
artifacts; it is not a claim of production control verification. The former pending proposal
above is superseded by this approval.

Updated spec, plan, data-model, research, feasibility decision, tasks, quickstart and contract
descriptions to require day-28 application restore expiry/verified deletion attempts, a
day-30 removal target, and a day-31 receipt-cleanup target. Failed cleanup must retry and
alert through independent monitoring, including missed jobs and stale backups. Disclose
physical-removal delays during outages. Preserve required receipts if overdue recovery
removal cannot be verified; expired/unsafe restores remain forbidden. No HTTP schema,
endpoint, executable code, retention constant or task-completion flag changed.

The owner also confirmed the existing paid plan is **Pixieset Client Gallery**, then selected
**"Client photo delivery; keep portfolio images on our website"**. R-17 records official
product/integration findings and the selected boundary. Full client collections and sharing
belong in Pixieset; portfolio processing remains on Cloudflare, so T001/T034's production
decoder still needs implementation and proof. No Studio Manager migration, automatic gallery
sync, new subscription or real-client data operation is selected/performed. Application
client deletion does not imply deletion of Pixieset collections.

**Resolved decisions:** retention-policy amendment and Pixieset product/scope.
**Remaining Production evidence:** portfolio decoder entitlement/implementation/proof,
usage controls, deployed cleanup/retry, independent monitoring/owner notification and safe
restore rehearsal. Alert destination/configuration remain outstanding. Cloudflare sign-in
was requested as the next owner action so account capabilities can be inspected.
**Task status remains 51/63 complete**; T001/T034/T058 are still open.

Validation for this amendment: `git diff --check` passes. OpenAPI parses as YAML and a
structural comparison with HEAD confirms only the general description changed; HTTP
operations and schemas are identical. Task counts remain 63 total / 51 checked.
`node node_modules/vitest/vitest.mjs run apps/api/tests/operations.test.ts` passes **1 file /
9 tests** in **7.61 seconds**, covering existing local expiry, deletion-ledger preservation
during failed cleanup, safe retry, restore refusal and private media recovery. No test or
runtime implementation was changed. These are local checks, not production alert evidence.
The after-implementation hook was parsed: only the optional Git commit hook applies, and
it remains unexecuted. No mandatory hooks are registered.

## 2026-11-14 — authenticated Cloudflare inventory and agent setup

The owner completed Wrangler login. `wrangler whoami` confirms one accessible account.
Read-only `r2 bucket list`, `d1 list --json`, and the Workers scripts API report zero
buckets, databases and Workers respectively. R2 enrollment remains accepted; application
resource provisioning is still future work. The Workers account-settings response reports
`standard`, which is not treated as proof of a billing plan or an Images entitlement.

The account-subscriptions and Images storage-statistics endpoints return HTTP 403/code
10000 with the Wrangler OAuth credential. This is insufficient API permission, not evidence
that Images is unavailable or that an upgrade is needed. Credential values and account
identifiers were excluded from the tracked
[preflight evidence](./evidence/cloudflare-account-preflight.json). No photo-processing,
resource creation, subscription change, message or deployment was performed.

The owner then explicitly requested executing the applicable instructions at
[Cloudflare's agent setup](https://developers.cloudflare.com/agent-setup/prompt.md).
Installed all 22 published `cloudflare/skills` skill directories into the global Codex
skills folder using Codex's skill-installer helper; each `SKILL.md` was verified. Registered
the official `https://mcp.cloudflare.com/mcp` server with `codex mcp add cloudflare --url ...`
after backing up the user configuration. Registration automatically started OAuth; completion
is recorded below once observed. The optional beta `cf` CLI choice was presented separately.
This environment setup does not close T001/T034/T058 or any release task.

**Setup result:** the registration process exited successfully with `Successfully logged
in`; `codex mcp list` reports the Cloudflare server enabled with OAuth authentication.
The user selected **"Skip it; keep Wrangler"** for the optional beta `cf` executable.
It was not installed. The published `cf-cli` guidance skill is included among the 22
skills, which does not install that executable. Existing user configuration is semantically
unchanged apart from the Cloudflare entry (Codex omitted one equivalent empty `args` list).
The configuration backup remains in the user Codex directory. Skills are available next
turn; restart Codex to load the newly registered MCP tools, which are not exposed to this
running session. After activation, resume Images entitlement investigation and the remaining
Production gate. No task-completion flag changed; the count remains **51/63**.

## 2026-11-14 — resumed Cloudflare connector verification

After the owner updated access and requested another retry, the Cloudflare plugin's
identity lookup and account list succeeded. The account list contains one account and
pagination is complete. The earlier local tool-approval rejection no longer blocks this
connector's account lookup.

Images storage statistics return HTTP 403/code 5403 (account invalid or unauthorized for
the service). Account subscriptions return HTTP 403/code 10000; the connector explicitly
reports that no OAuth scope covers that endpoint and that an API token with Billing Read
or Billing Write is needed. These results do not establish whether private-byte Images
transformations are available, nor do they justify purchasing a subscription. Dashboard
inspection could not proceed because no browser is connected. The owner was asked for
the Images plan/setup status shown in the dashboard.

Sanitized results are recorded in the existing
[preflight evidence](./evidence/cloudflare-account-preflight.json), preserving the earlier
Wrangler observations separately. No credentials or account identifiers were added to
project evidence. No remote resource, subscription or application code was changed.
Production image validation remains unexecuted; T001/T034/T058 and the **51/63** task count
remain unchanged.

## 2026-11-14 — Images Free activation and remote provider diagnostics

The owner activated Images & Stream Free. Account statistics now succeed (zero hosted
images; zero hosted-storage allowance). The temporary Images-only development probe
successfully transformed synthetic private image bytes on Cloudflare. R-18 records the
boundary findings and links to both raw, sanitized evidence files.

The first probe has nine successful valid-image cases, two corrupt-input refusals reported
as provider internal error 9516, one silently accepted truncated JPEG, and one PNG proxy
failure. A targeted repeat accepted the valid PNG but reproduced JPEG acceptance both with
and without an end marker. Both malformed JPEGs fail the strict local decoder. These are
unresolved validation results, not a provider pass. No production validator was wired in.

Commands: `pnpm exec wrangler dev --config scripts/image-binding-probe/wrangler.toml --remote
--ip 127.0.0.1 --port 8795 --inspector-port 9245 --show-interactive-dev-session=false`, then
`pnpm exec tsx scripts/image-binding-probe/run.ts`; targeted follow-up selected
`jpeg-truncated-scan jpeg-truncated-scan-with-end-marker png-16384-axis`. Diagnostic exits
were nonzero, as required by the unmet expectations. The development process was stopped;
the authenticated Workers scripts inventory afterward remained at zero.

Production decoder, resource-budget and retention/monitoring evidence remain outstanding.
No paid plan, real photo, live message, application deployment or task-completion change
was introduced. The count remains **51/63**.

Local regression verification: **15/15 tests passed** across the image-provider and gallery
suites, including both malformed JPEG fixtures and the unconfigured-production-validator
refusal. Full workspace typechecking, scoped ESLint, formatting and diff checks passed.
These passing local checks do not supersede the recorded provider failures.

## 2026-11-14 — damaged-JPEG blocker resolved in the upload adapter

The owner requested strict rejection and re-export guidance, with Pixieset continuing to
handle delivered client collections. Implemented `packages/shared/src/jpeg.ts`, the internal
per-portfolio `JpegValidator` Durable Object, and `validateCloudflareImages`; wired the adapter
into `productionRuntime` and protected uploads. API and generated release configurations
include Images, the validator namespace and its SQLite migration. Generated binding types
replace duplicated handwritten binding declarations.

The strict check validates sequential/progressive Huffman JPEG entropy before transformation.
Images fully decodes inputs and regenerates each public derivative from the original. A
damaged/unsupported JPEG returns HTTP 400 with “Re-export it as JPEG or PNG and try again.”
Tests verify no transformation or R2/database publication on this rejection; missing bindings
and provider outages also prevent storage. Pixieset delivery has no new integration or writes.
See R-19 for bounded work/memory, supported encodings, timeouts and residual proof limits.

Red/green evidence:

- `scripts/tests/jpeg-validation.test.ts`: the initial no-op validator failed three behavioral
  cases; the completed validator passes seven, including a strict-Sharp differential sweep
  across more than 100 damaged scans, valid baseline/progressive/grayscale/CMYK/EXIF,
  restart/padding/table checks and a 40-MP progressive source.
- `scripts/tests/cloudflare-images.test.ts`: the stub failed five adapter cases. Seven passed
  after implementation. A subsequent stalled-output/cancellation test failed (still pending
  after 30 seconds); bounding cancellation fixed it, and all eight adapter tests now pass.
- `apps/api/tests/jpeg-validator.test.ts`: the initial RPC stub returned false for an intact
  JPEG and failed; the real local workerd/SQLite DO now accepts intact data, rejects both
  truncated forms and accepts a later intact request.
- `apps/api/tests/gallery.test.ts`: before wiring, valid and damaged production uploads both
  returned 500; the new behavioral tests expected 201/400 and failed. All twelve now pass,
  including correct guidance, zero writes on failure, unavailable binding refusal and success.

Live-provider evidence: `scripts/image-binding-probe/validate.ts` passes **10/10 cases**, stored
in [images-validation-probe.json](./evidence/images-validation-probe.json). It exercises the
production adapter in local workerd/DO RPC with the live Images binding, not offline Images
emulation. Both R-18 damaged JPEG fixtures return 400. Valid PNG/WebP/JPEG, EXIF orientation,
40-MP baseline and progressive 4:4:4, 16,384-pixel width, and a 10-MiB metadata-padded JPEG
pass. Each output passes independent strict Sharp decoding and dimensions/metadata checks.
The diagnostic process was stopped; authenticated Workers inventory afterward remains zero.
The old raw-provider failure evidence is retained unchanged.

Repository verification: `pnpm check` passes formatting, lint, types, **53 files / 248 tests**,
and both production builds (API dry run only). After the additional cancellation fix, the
eight-test adapter suite, scoped lint, full workspace typecheck and API dry-run build pass.
Privacy scans found no blocked source or diagnostic artifacts. No files were staged or
committed by this work; pre-existing `.specify/`, `.node-version` and `.npmrc` edits were left alone.

`pnpm exec playwright test e2e/gallery.spec.ts --project=chromium-desktop
--project=chromium-mobile` passes **4/4**, zero retries: oriented upload, edit/reorder/delete,
public refresh, sixty-image capacity, filtering and 320/768/1280 layouts. This browser run
uses the isolated local Sharp provider; the production adapter and live Images are tested
separately above. Final source/artifact privacy and diff checks pass.

The reproduced silent-recovery bug is resolved. This is not deployed CPU/memory/usage-budget
proof, a production application deployment, paid activation, or permission to release.
T001/T034 remain open for those remaining integration/resource checks; operational retention,
monitoring and other acceptance gates remain separate. Task count stays **51/63**.

## 2026-11-14 — private deployed gallery and CPU verification

Under the owner's scoped continuation, deployed the actual API to a disposable private
Worker with synthetic D1/R2 data, Images and SQLite Durable Objects. R-20 records the
configuration, retained initial harness interruption, clean rerun, metrics and cleanup.
The original pipeline exceeded the Free front-Worker CPU target; moving upload/delete
execution into `GalleryMutations` reduced observed maximum front CPU from 109 ms to 7 ms.
Concurrent writes receive retryable 429 admission; strict JPEG rejection stays unchanged.
JPEG RPC has 20 seconds within the existing 30-second deadline; Images calls retain 8 seconds.

Red/green evidence:

- `scripts/tests/gallery-rehearsal.test.ts`: the initial stub failed both private-resource
  configuration cases; the real-entry/private-config implementation passes both.
- `apps/api/tests/gallery-mutations.test.ts`: front forwarding initially returned 400 instead
  of 204 and the coordinator stub returned 501 instead of 401. Implementation then exposed
  a missing security header in the forwarded response; preserving response headers fixed
  it. Both tests pass, including unconsumed-body forwarding, auth and concurrency release.
- `scripts/tests/cloudflare-images.test.ts`: a nine-second validator response failed at the
  old eight-second timeout. The revised budget passes that case and still refuses a stalled
  validator at twenty seconds. All nine adapter tests pass.

Remote verification: **11/11** coordinated upload/storage/publication checks pass, plus
the separate concurrent upload test (one 201, one 429, exactly one image/four objects).
All successful variants pass independent strict Sharp decode and metadata/dimension checks.
Damaged JPEGs return 400 without R2/D1 publication. Originals remain private, and deleting
an image removes its public route while creating private recovery copies. Sanitized JSON
evidence is linked from R-20; initial failed assertions are retained, not overwritten.

Invocation CPU and partial memory analytics are recorded, not inferred from local tests.
The JPEG validator reports ~30.2 MiB p99 memory and zero reported CPU/memory-limit errors;
the front Worker reports ~10.7 MiB p99. Coordinator memory metrics are missing, and no peak
heap profile was obtained. T001/T034 therefore remain open, alongside account-wide usage
controls. Task count remains **51/63**.

Repository validation: `pnpm check` passes formatting, lint, workspace/tool types,
**55 files / 254 tests**, and both production builds. The subsequent concurrency diagnostic
also passes scoped lint and tool typechecking. `pnpm exec playwright test e2e/gallery.spec.ts
--project=chromium-desktop --project=chromium-mobile` passes **4/4**, zero retries. Browser
checks use the isolated local Sharp provider; remote checks above use the actual Images
adapter. Source/artifact privacy and final diff checks pass.

Cleanup verified: no Workers, DO namespaces, D1 databases or R2 buckets remain in the
rehearsal account inventory. The local proxy stopped; generated configs and credentials
were removed. No real data, email, Pixieset operation, paid subscription, staging or commit
was performed. Existing unrelated workspace edits were preserved.

## 2026-11-14 — coordinator memory verified; GitHub monitoring implemented

R-21 records the separately authorized private follow-up. Four combined 40-MP/10-MiB
uploads pass through the unchanged production image path. Four further cycles pass with
Cloudflare-side byte-based pacing, verifying the real coordinator under slow input. Strict
Sharp decode, stripped metadata, derivative dimensions/bytes, private originals and
deletion all pass. Final-window coordinator memory p99/p999 is 40,975,644 bytes (~39.1 MiB),
validator memory 29,492,300 bytes (~28.1 MiB), with no reported DO limit errors. The broader
diagnostic coordinator p999 is ~67.6 MiB. Samples are not absolute peaks.

Retained failures: the initial driver delayed per input chunk and timed out locally, then
completed remotely; the next upload received 429. Its eventual synthetic image was found
and deleted. A regression test failed on provider chunk fragmentation, then passed after
byte-based pacing. No production image behavior was changed by this diagnostic correction.
The successful allocation profile covers early streaming only, not retained/peak memory.
One cold gallery-list GET reached 12 ms CPU; general Free-tier headroom remains T001 work.

T034 is complete from the accumulated API/storage/browser/real-provider evidence in
R-19/R-20/R-21. **52/63 tasks are complete**. This does not waive T001 or authorize release.

The owner selected GitHub failure notifications. Implemented private scheduled-job records
and an independent hourly GitHub R2 metadata monitor with a labeled notification-test mode.
TDD evidence: the initial scheduled wrapper failed both missing-status/error-transition
tests; implementation passes both. The monitor stub failed all three stale/overdue/budget
behavior cases; the completed monitor passes those plus pagination and bounded/read-only
transport tests. Existing backup/restore/deletion-retry tests also pass. A direct standalone
Node invocation without credentials exits 1 with a sanitized message, as required.

`pnpm check` passes formatting, lint, workspace/tool types, **58 files / 262 tests**, and both
builds. No browser flow changed; the earlier 4/4 gallery browser evidence remains applicable.
Source/artifact privacy and final diff checks pass. Production cron, independent monitoring
activation, actual owner notification receipt and remote restore/deletion rehearsal remain
unverified T058 gates. No GitHub notification was sent during this work.

Cleanup inventories confirm zero Workers, DO namespaces, D1 databases and R2 buckets.
Generated configs and synthetic credentials were removed, with only ignored build/profile
artifacts retained. No real data, Pixieset operation, paid plan, staging or commit occurred.

## 2026-11-14 — bucket-scoped monitoring and last-success correction

Resumed `$speckit-implement`; prerequisites identify this feature, requirements checklist
passes 16/16, and Git/ESLint/Prettier ignore patterns cover the current private monorepo.
Preserved the existing `.specify/`, `.node-version` and `.npmrc` workspace changes.
R-22 records the provider credential mismatch: Object Read Only credentials cannot use
the REST object API. Replaced the transport with S3 SigV4 and bucket-scoped credentials,
conditional backup HEAD metadata reads and fixed operational-body reads. Updated workflow,
lockfile, plan/data-model and activation instructions. No public API contract changed.

Red/green evidence:

- `pnpm exec vitest run scripts/tests/operations-monitor.test.ts`: initial credentials-only
  failures were not counted as the behavioral red step. With a synthetic legacy credential
  supplied to reach the old transport, three behavioral cases failed: wrong REST origin,
  inability to collect using S3, and permitting private-body paths. The S3 implementation
  passes all eight transport/inspection cases without the legacy credential. Tests cover
  signed fixed-origin GET/HEAD, two-page cursor encoding, conditional metadata reads,
  malformed XML/entities, denied paths, provider failures and oversized responses.
- Added a repeated-start regression and a local D1/R2 scheduled-job case. Before the fix,
  the monitor returned healthy without a recent completed job, and the stored running
  records lacked the previous success time: **2 failed / 10 passed**. Retaining and checking
  `lastSucceededAt` makes these cases pass.
- `pnpm exec vitest run scripts/tests/operations-monitor.test.ts
  apps/api/tests/operations-monitor.test.ts apps/api/tests/operations.test.ts` passes
  **3 files / 21 tests**, including existing deletion retry, receipt preservation,
  unsafe/expired restore refusal and private media recovery.

The monitor workflow's exact install command was executed in the isolated ignored
`.wrangler/monitor-install-check` directory:
`pnpm install --filter radiant-images --prod --frozen-lockfile --ignore-scripts`.
It installed nine packages. Direct Node execution without credentials exits 1 with the
sanitized configuration/connectivity message, establishing that the entrypoint loads and
fails closed rather than silently reporting success. This is not a live-provider check.

Final validation: `pnpm check` passes formatting, lint, workspace/tool types,
**58 files / 267 tests**, frontend production build and API dry-run build.
`pnpm audit --audit-level=moderate` reports no known vulnerabilities; source/artifact
privacy scans report zero blocked findings. `git diff --check` passes. Existing optional
PDF-chunk-size and framework deprecation warnings remain; no browser UI changed, so the
previous browser matrix evidence was not rerun or represented as new evidence.

Current environment checks confirm no configured `CLOUDFLARE_ACCOUNT_ID`,
`R2_MONITOR_ACCESS_KEY_ID`, `R2_MONITOR_SECRET_ACCESS_KEY` or `RECOVERY_BUCKET` variables.
GitHub CLI is unavailable, so repository secrets/variables and remote runs were not read.
Production activation, actual owner notification receipt and deployed restore/cron evidence
remain unverified; T058 is unchecked. T001's usage/CPU/recovery gates and the other live,
human, content/privacy and release tasks remain open. **52/63 tasks remain complete**.
No remote resources, messages, credentials, commits or deployments were created.

Post-hook check: parsed `.specify/extensions.yml`; only the optional Git commit hook applies.
It is offered and left unexecuted. No mandatory after-implementation hook is registered.

## 2026-11-14 — first remote PR CI pass; full browser suite prepared for next push

Read the public GitHub run/job APIs for
[Quality run 43666811821](https://github.com/sg921216/radiant_images/actions/runs/43666811821/job/132667903065).
The run is a completed successful `pull_request` event on
`358277e17d486dec15f2733778792e37f5b95c17`. The verify job ran from
`2026-11-15T02:14:14Z` to `2026-11-15T02:19:52Z` (November 14 in America/New_York).
Frozen installation, formatting, lint, types, dependency/source security, tests, builds,
test setup, browser installation, Chromium smoke and diagnostic privacy steps succeeded.
The nightly/release browser step was explicitly skipped. No detailed test counts or
individual browser results are inferred from this job metadata.

Saved only run identity, event, commit, timestamps and step conclusions in
`evidence/github-pr-smoke-43666811821.json`; no logs, credentials or client data are retained.
The successful run resolves the earlier absence of any remote CI execution, but it does
not close T059's complete-browser evidence or the historical intermittent input-loss concern.

Changed the declarative CI selection so pull requests run `pnpm e2e` across the existing
five Playwright projects. Main pushes retain `pnpm e2e:smoke`; nightly, manual and reusable
release runs keep full coverage. Exactly one browser-suite step is selected per event,
with the existing focused/flaky-test rejection, timeout and privacy gates unchanged.
YAML/format validation and event-selection checks pass for pull_request, push,
workflow_dispatch, schedule and workflow_call. Playwright lists 165 cases across 12 files
and the existing five projects; listing is not execution and project-specific performance
selection remains unchanged. The privacy scan reports 436 files with zero blocked findings,
and `git diff --check` passes. These checks cover this configuration-only change;
application code and browser tests are unchanged. The changed workflow has not been pushed
or run remotely by this session. The user should commit/push it to the existing PR and
wait for the full-suite result before merging. **52/63 tasks remain complete**; no public
deployment, notification send, credentials or release-gate bypass occurred.
