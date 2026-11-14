# Implementation Plan: Radiant Images Photography Website

**Branch**: `001-radiant-images-website` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-radiant-images-website/spec.md`

**Governance update**: 2026-11-13 — constitution v1.0.0. React + Cloudflare Workers
confirmed by the user; Hono, D1, R2, and the existing hosting design remain selected.
At this initial checkpoint no application code existed. Local implementation and evidence
are now recorded in acceptance.md under the approved exception; remote release remains blocked.

**Hosting clarification (2026-11-13)**: The owner selected Cloudflare Workers Static Assets
for the frontend and reports the R2 account is set up. The hosting-choice/account-enrollment
blocker is resolved. T001 remains open for technical feasibility verification (decoder,
retention, toolchain and usage budgets); no further hosting confirmation is required.
See spec.md Clarifications, research R-16 and acceptance.md.

**Implementation follow-up (2026-11-13)**: Research R-16 verifies allowance/control limits
and an exact dependency-resolution candidate. T001 remains blocked on strict recovery
expiry and production image-decoder feasibility. `feasibility-decision.md` proposes a
bounded exception for local work, explicitly approved by the owner on 2026-11-13.
T001 remains a deployment gate; local implementation may proceed under that exception.

**Owner decisions (2026-11-14)**: QR-002 now uses the approved operational retention policy:
restore eligibility ends and verified deletion starts at day 28, removal targets day 30,
and receipts target day 31 with safe preservation during unresolved cleanup. Retries,
independent monitoring/owner alerts and disclosure of physical-deletion delays are required.
The unconditional provider-deletion guarantee is superseded; operational proof remains open.
The owner has a paid Pixieset **Client Gallery** plan and selected it for client photo
delivery while keeping portfolio images on this website. R-17 records the integration
findings. The existing R2 portfolio originals/derivatives, gallery editor, metadata/privacy
and authoritative production image-validation requirements remain in scope. Full delivered
client collections stay in Pixieset; no gallery API sync or Studio Manager migration is selected.

**Images feasibility follow-up (2026-11-14)**: The owner activated Images Free. A synthetic
remote-development binding probe confirms transformation access, orientation and metadata
handling, including 40-megapixel inputs. It also demonstrates silent acceptance of damaged
JPEG scans that strict local decoding rejects. R-18 records the evidence; preserve strict
validation and the production upload gate until a compatible validator is proven. No paid
plan, application deployment, or image-validation requirement change is selected.

## Summary

Build a photography business website for Radiant Images with a public marketing site (home gallery, three service pages with "How It Works" + pricing sections, About, FAQ, Contact with CAPTCHA-protected inquiry form) and an owner admin area (gallery, banners, pricing packages, site config, clients, email templates, checklists, questionnaires) protected by Google sign-in with an owner allow-list.

Technical approach: a static React single-page app (Vite + React Router v7) deployed to
**Cloudflare Workers Static Assets**, backed by a separate **Cloudflare Worker** API (Hono)
using **D1** (SQLite) for data and **R2** for images. Outgoing email uses the **Gmail API**;
CAPTCHA is **Cloudflare Turnstile**; owner authentication is Google OpenID Connect with an
opaque bearer-token session. Pricing PDF, page and print use the same published revision.
Target $0 usage within included allowances; R2 enrollment is owner-completed and no paid-tier
upgrade is selected. Usage/overage controls remain T001 work. Full reasoning in [research.md](./research.md).

## Technical Context

**Language/Version**: Strict TypeScript; Cloudflare Workers runtime (workerd) for the API.
T001/T002 MUST verify support and pin one compatible Node/package-manager/toolchain set
for local use and CI. The dependency majors below are prior design candidates, not claims
that their support status has been revalidated on 2026-11-13.

**Primary Dependencies**:

- Web: React 19, React Router v7 (framework mode, `ssr: false`, prerendered public routes), Vite 6, Tailwind CSS 4, `@react-pdf/renderer` (pricing PDF), `@marsidev/react-turnstile`
- API: Hono 4, Drizzle ORM (D1 driver) + drizzle-kit migrations, Zod (shared validation), `arctic` (Google OAuth 2.0/OIDC client), `@oslojs/crypto` (tokens)
- Shared: `packages/shared` — Zod schemas and TypeScript types used by both web and API

**Storage**: Cloudflare D1 (SQLite) for relational data and atomic application rate-window
counters; Cloudflare R2 for private image originals and validated derived sizes; optional
Workers Rate Limiting binding for additional 10/60-second filtering. R-16 corrects the
unsupported ten-minute binding assumption. No inquiry-content persistence (FR-023).

**Testing**: Vitest (unit, web + shared); `@cloudflare/vitest-pool-workers` (API integration against local D1/R2 via Miniflare); React Testing Library (components); Playwright (end-to-end against local stack); contract tests validate API responses against `contracts/openapi.yaml`

Mandatory red-green-refactor covers foundation, UI, schemas, migrations, and bug fixes.
Use the real local React/Worker/D1/R2 stack for critical E2E; replace only external provider
boundaries with deterministic adapters. Each test gets isolated state/data and controlled
time. Use semantic locators and retrying assertions, never fixed sleeps. PRs run Chromium
smoke on mobile/desktop; nightly and release runs cover Chromium/Firefox/WebKit, including
320/768/1280 px layouts. Reject focused tests and fail on flaky outcomes; allow at most one
diagnostic retry with sanitized traces/screenshots retained for seven days. Production
must reject test adapters/seeding. Live Google, CAPTCHA, and mailbox checks are separate.

**Target Platform**: Public web — evergreen desktop & mobile browsers (current + previous
major); frontend on Cloudflare Workers Static Assets and API on a separate Cloudflare Worker.
Use separate configured HTTPS `*.workers.dev` origins initially, with frontend basename `/`;
custom domain later. Retain exact-origin CORS and the existing bearer-session contract.

**Project Type**: Web application — static SPA frontend + serverless API backend, pnpm monorepo

**Performance Goals**: Each public route reaches the SC-004 `public-usable` milestone in a median ≤ 3 s under the Mobile Acceptance Profile below; owner changes visible publicly ≤ 60 s (SC-005, SC-007, SC-011); JSON API read p95 < 500 ms and inquiry Submit-to-confirmation < 5 s under the separate API/inquiry latency profile below.

### Owner session handoff

After verified Google sign-in and browser-bound OAuth-state validation, the callback creates
only a 60-second exchange grant: a hash of a random 256-bit one-time code, the verified owner
email, and creation/expiry times. It creates no session or bearer token. Redirect with the
raw code in the SPA callback fragment; remove that fragment immediately on arrival.

`POST /auth/exchange` checks the code and current allow-list, then atomically consumes the
unexpired grant and inserts exactly one session containing the hash of a newly generated
256-bit bearer token. Return the raw bearer only after commit, once, with `Cache-Control:
no-store`; keep it in `sessionStorage`. No raw code or bearer is persisted server-side,
logged, or backed up. Concurrent redemption has one winner; invalid/expired/used codes
return 400, and a removed owner returns 403. A failed transaction leaves no session and
does not consume the grant. If the response is lost after commit, the UI clears pending
sign-in state and offers a fresh Google sign-in rather than replaying the code or trying
to recover the raw token. The unreachable session expires normally. T010/T011/T012 verify
these transitions, including allow-list removal between callback and exchange.

### Email outcomes and recovery (C1)

Classify email operations as confirmed acceptance, definite non-delivery, or uncertain
delivery. A timeout/lost connection after a send could have reached Gmail is uncertain,
including a browser timeout waiting for the API. Return `502 email_not_sent` with
`retryable: true` only for confirmed non-delivery; return `504 email_outcome_unknown`
with `retryable: false` for uncertainty. Owner sends accepted by Gmail whose history
write fails return `500 email_history_failed`, `retryable: false`; show that acceptance
is known but recording failed. Retain possibly delivered invitations. Inquiry acceptance
remains a 202 even if the primary audit write fails: emit a sanitized fallback audit and
failure signal instead of falsely reporting non-delivery.

Keep form/draft values in the active UI and require manual owner/mailbox verification
before an explicit new send after uncertainty or history failure. Do not automatically
retry a send or re-enable resend merely because the two-minute duplicate guard expired.
Retain the existing content-hash claim through that window for accepted/uncertain sends;
release it on definite non-delivery. There is no inquiry payload queue or durable retry
store. Bound each provider call to two seconds and each server email operation to four
seconds overall, including token refresh/verification/send; abort outstanding calls at
the deadline. A send interrupted after dispatch is still uncertain. Reads and provider
preflight failures do not authorize retrying a possibly executed send.

**Visitor recovery**: `site_config.public_contact_email` / API `publicContactEmail` is a
required, explicitly public business address approved by Rebekah, configured independently
of the private recipient and sender. It may be the same mailbox only by explicit owner
choice; never derive it from private settings. Show it on Contact before submission and
retain that loaded value in the active form so an API outage does not hide recovery help.
Provide selectable address text and a `mailto:` link without inquiry fields or message
content in its URL. This opens the visitor's mail app and does not invoke the Worker send.

On uncertain delivery, keep the draft and disable Submit. Explain how to email Rebekah to
check receipt. After her reply, a visitor who confirms receipt can finish without sending;
otherwise they must explicitly acknowledge "Rebekah checked and asked me to send again"
and select "Start a new submission". That action retains the draft, resets CAPTCHA, and
requires a fresh manual Submit. It does not dispatch automatically or bypass validation,
rate limits, or the two-minute duplicate claim; a still-active claim returns the normal 409. Opening the email link or waiting alone never unlocks submission. If receipt remains
unknown, keep the uncertain state. Confirmation is a visitor acknowledgement, not a new
server-side delivery-verification mechanism. T017/T023 cover this recovery interaction;
T043–T046 cover public-address validation/propagation; T063 verifies an approved, monitored
address before launch. Local seeds use `hello@example.invalid`; it is never a launch value.

### Questionnaire links and retained email history

Generate each questionnaire token only in the server send operation. An explicit template
send containing `{{questionnaireLink}}` creates one new invitation for that client and
uses its link for every occurrence in the subject/body. The dedicated questionnaire-send
operation uses the same path. Preview shows a descriptive placeholder, never a live token.
Reject literal application questionnaire URLs in template saves and composed-message input
with a field error directing the owner to the placeholder; do not store pasted tokens.

Keep two representations: the transient message sent to Gmail contains the actual URL;
the stored `client_emails` subject/body replace each questionnaire link with the plain-text
marker `[questionnaire link omitted]`. Store nullable `questionnaire_invite_id`, exposed
as `questionnaireInviteId`, for a same-client invitation; ordinary email uses null. Build
history from the pre-link-expansion message, not a copy of the delivered MIME. Responses,
admin history, logs, traces and backups must contain no raw invitation token or usable
questionnaire URL. Owner history opens the authenticated invitation detail by ID. Do not
reconstruct tokens or resend to repair history. Known/uncertain delivery retains the
existing invitation under the email-outcome rules. T048/T049/T053/T054 and T058/T062 cover
redaction, input rejection, same-client association, and backup/API/UI inspection; live
email verification remains separate from sanitized evidence artifacts.

### API and inquiry latency profile (A1)

T061 implements the following independent gates in `e2e/performance.spec.ts` and records
all raw timings plus runner/tool/fixture versions in `acceptance.md`:

- Use production builds, the real isolated local Worker/D1/R2 stack, and the Mobile
  Acceptance Profile's fixed content fixture, extended to 200 synthetic clients. Use
  healthy provider doubles with a fixed 200 ms delay per external call. Reset data before
  each endpoint batch; never replace the application's API with a mock.
- **JSON reads**: enumerate every implemented JSON GET operation, using a valid owner
  session or pending questionnaire where required. Test each operation separately with
  ten untimed warm-up requests and 100 measured requests at concurrency five on loopback,
  without network/CPU throttling. Bypass HTTP/edge response caches; retain the warmed
  Worker/database after warm-up. Measure monotonic elapsed time from sending the request
  through receipt of its complete body. All responses must be the expected success;
  assert the nearest-rank p95 (95th sorted sample) is strictly <500 ms for every operation.
  Binary images, redirects, and deliberate error cases are outside this JSON-read gate.
- **Inquiry**: run 20 independent successful submissions sequentially in pinned Chromium
  using the Mobile Acceptance Profile's viewport, CPU and network conditions. Start with
  the form completed and CAPTCHA ready; time first Submit activation through visible
  provider-accepted confirmation. Include browser validation, API transport, server CAPTCHA
  verification, cold Gmail access-token refresh, send, and audit. Exclude typing/challenge
  completion and mailbox delivery. Assert every run is strictly <5 seconds and receives
  the expected acceptance response; retain slow/failed samples as failures. Use unique
  synthetic payloads/tokens and isolated rate-limit state reset before each timed run.
- Run fault/timeout/duplicate suites separately; never label them successful latency
  samples. Record a separate deployed sample with live providers before release, clearly
  distinguishing it from these reproducible lab gates and SC-002's mailbox measurements.

### Release browser matrix (G1)

At release freeze, T063 records the exact latest stable major (`N`) and previous stable
major (`N-1`) for every row below, with full browser/OS versions and test date. These
relative labels define a release-time selection rule, not unverified version numbers.

| Browser | OS/device                            | Required versions | Verification                           |
| ------- | ------------------------------------ | ----------------- | -------------------------------------- |
| Chrome  | Windows 11 desktop                   | N and N-1         | Actual installed browser               |
| Edge    | Windows 11 desktop                   | N and N-1         | Actual installed browser               |
| Firefox | Windows 11 desktop                   | N and N-1         | Actual installed browser               |
| Safari  | Compatible supported macOS desktop   | N and N-1         | Actual Safari/OS combination           |
| Chrome  | Supported Android phone              | N and N-1         | Physical device or real-device service |
| Firefox | Supported Android phone              | N and N-1         | Physical device or real-device service |
| Safari  | iPhone with compatible supported iOS | N and N-1         | Physical device or real-device service |

Use the browser vendor's supported OS pairing; record the exact pairing rather than
substituting a Playwright engine. In each cell verify discovery/inquiry and retained-input
failure recovery, owner login/logout/expiry, gallery upload, pricing print/PDF, and the
questionnaire journey. Use designated synthetic accounts/provider adapters and record
pass/fail/evidence per journey. T059's pinned Chromium/Firefox/WebKit CI matrix remains
required and separate. Unavailable or failed cells remain BLOCKED and block claiming full
support/release until resolved or handled by an explicitly approved, documented governance
exception; do not silently narrow the spec or mark emulation as physical-device evidence.

### Human acceptance protocol (A2)

T025/T063 preregister the SC-008 cohort size and device split before sessions. Give each
first-time participant the same goal (find a suitable service and submit an inquiry) and
synthetic contact/session details without instructions naming controls or field locations.
Start on the loaded Home page with healthy controlled providers. Record device group,
first Submit result, any assistance/abandonment, and elapsed time to confirmation; start
SC-001's four-minute timer when the goal is given and stop at visible acceptance. Keep
all started sessions in the denominator, score using SC-008, and report the required
`ceil(0.9 × participants_started)` successes. Facilitators may give the initial goal and
synthetic data only. Record owner workflow timings separately, from the loaded Admin
dashboard through completion of all specified actions, without documentation or coaching.

### Mobile Acceptance Profile (SC-004)

- Use the production web build with the real local Worker/D1/R2 stack and pinned Chromium,
  not the development server. Measure Home, Maternity, Newborn, Family, About, FAQ, and
  Contact and a valid pending `/q/{token}` questionnaire independently from direct navigation.
  Admin routes retain their accessibility/security checks but are outside this public timing gate.
- Use 375 × 812 CSS pixels, DPR 1, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload,
  150 ms RTT, and zero packet loss. Record browser/tool versions, OS, CPU/RAM and runner
  class; use the same runner class for comparisons. Rebaseline only with a documented reason.
- Run each route five times in fresh browser contexts with empty HTTP/storage/service-worker
  caches. Reset API/cache fixtures for each run, serve local images without a warmed CDN,
  and apply the network profile to all page requests. Do not discard slow valid runs or
  average different routes together; retain all five results and gate each route's median.
- Version a fixed fixture manifest in `e2e/fixtures/performance/`: 60 distinct approved,
  non-sensitive photos (20 per shoot type, mixing portrait/landscape), full/card/thumb variants
  with 2000/800/320 px maximum long edges, descriptive alt text, and stable display order.
  Fixture WebP transfer sizes are 150–160 KiB full, 56–64 KiB card, and 12–16 KiB thumb;
  record exact dimensions, byte sizes and hashes in the manifest. Include all metadata,
  three packages per shoot type, four required FAQs, service copy, populated contact options,
  one active banner, and one synthetic client with a pending ten-question invitation (four
  short-text, three long-text, three single-choice questions with four choices each). Do not
  replace these with empty galleries or tiny placeholder images. Redact questionnaire tokens
  in measurement logs; identify that route by its template, never its raw token.
- Start timing at navigation start. `public-usable` is reached only after header/navigation,
  the route heading and primary content are visible, route controls are hydrated/operable,
  and each initial-viewport portfolio image is decoded and painted. Contact also requires
  the complete labeled form and ready CAPTCHA; the questionnaire requires its complete labeled
  question form; service pages require loaded current pricing after US2. E2E assertions verify
  the milestone's visible/interactive conditions rather
  than trusting an application timestamp alone. Loading/error placeholders do not qualify.
- Use a healthy deterministic CAPTCHA adapter with a 200 ms readiness delay for routine
  performance runs. Report this substitution: it does not measure live Turnstile latency.
  Record a separate deployed sample with live providers before release; never relabel local
  results as production or field evidence. Store all measurements in `acceptance.md`.
- Layout-only checks additionally use widths 320, 768, and 1280 px. T025 may record US1
  service readiness without pricing, explicitly partial; T031 completes the pricing checks
  and T061 runs the complete profile. No full SC-004 pass is recorded at the US1 checkpoint.

Initial compressed public-route JS MUST be <= 250 KiB and above-the-fold image transfer
<= 500 KiB. Public routes target LCP <= 2.5 s and CLS <= 0.1 in this profile; check interaction
latency with scripted interactions and disclose that this is not field INP. After launch,
assess LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at p75 by mobile/desktop when field data is
sufficient. T061 records lab/field limitations rather than inventing a field-data pass.

**Constraints**: Target $0/month usage within included allowances on the selected Cloudflare
services. The owner has completed R2 enrollment, resolving the earlier no-card enrollment
blocker; no paid-tier upgrade or new spending budget is selected. T001 must still verify
usage budgets and overage controls. Frontend and API have different origins; images <= 10 MB upload, 60 max;
WCAG 2.2 AA for public/admin/questionnaire routes; HTTPS only. Private originals/backups,
EXIF/GPS-free public derivatives, documented usage permission and client-data lifecycle
are required. QR-002 and data-model.md define live deletion, day-28 application recovery
expiry/deletion attempts, a day-30 removal target, and day-31 receipt cleanup subject to safe
reconciliation. Provider-outage delays require retry, independent alerts and disclosure;
expired or unsafe restores remain forbidden. T001 verifies these controls and provider
recovery windows. Pixieset client delivery does not retire the existing production decoder
requirement for the site's separately managed portfolio images.

**Scale/Scope**: 1 owner; ~1–5k visitors/month; ≤ 60 gallery images; ≤ 200 client records; ≤ 20 inquiries/day; ~12 public routes + ~10 admin routes; ~35 API endpoints

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Governing document: [constitution v1.0.0](../../.specify/memory/constitution.md).
PASS below means design evidence exists; it does not claim implementation verification.
OPEN items must be resolved before the affected implementation or release.

| Principle           | Design status | Evidence / outstanding verification                                                                                                                                  |
| ------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Business value   | PASS          | Six prioritized stories; FR traceability in contracts/README.md; T025–T057 acceptance                                                                                |
| II. React + Workers | OPEN          | React/Hono/D1/R2 selected; T001 must verify provider/cost feasibility; T002 pins supported dependencies                                                              |
| III. TDD            | PASS          | Mandatory behavioral red/green evidence, including foundation, specified in tasks.md; execution pending                                                              |
| IV. E2E             | PASS          | Matrix, isolated fixtures, external-provider boundaries, and flake policy above; T006/T059 implement                                                                 |
| V. Privacy/security | OPEN          | QR-002/data-model.md define deletion and recovery; T001 verifies provider retention/pixel limits; T007–T014, T032–T036, T050/T058/T062 enforce and verify boundaries |
| VI. UX/performance  | PASS          | WCAG 2.2 AA, lab/field budgets, SEO/media obligations; T003/T021/T061 verify                                                                                         |
| VII. Operations     | OPEN          | T006/T059 CI; T058/T060/T063 must establish monitoring, recovery, and release evidence                                                                               |

## Project Structure

### Documentation (this feature)

```text
specs/001-radiant-images-website/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── README.md        # Contract overview + FR traceability
│   └── openapi.yaml     # Worker API contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
├── web/                          # Vite + React Router v7 SPA → Workers Static Assets
│   ├── app/
│   │   ├── routes/
│   │   │   ├── public/           # home, maternity, newborn, family, about, faq, contact, q.$token
│   │   │   └── admin/            # login, dashboard, gallery, banners, pricing, settings,
│   │   │                         #   clients, clients.$id, templates, checklist, questionnaire
│   │   ├── components/           # Header, Banner, Gallery, PricingSection, BookNow, forms…
│   │   ├── lib/                  # api client, auth session store, pdf renderer, print styles
│   │   ├── styles/               # tailwind theme (palette tokens), print.css
│   │   └── root.tsx
│   ├── public/                   # logo, favicon, _headers
│   ├── worker.ts                 # HTML fallback routing/security headers only; no domain API
│   ├── wrangler.toml             # build/client assets binding; separate frontend Worker
│   ├── react-router.config.ts    # ssr:false, prerender list, basename
│   ├── vite.config.ts
│   └── tests/                    # vitest + RTL component tests
├── api/                          # Cloudflare Worker (Hono)
│   ├── src/
│   │   ├── index.ts              # app bootstrap, CORS, error handler
│   │   ├── routes/               # public.ts, auth.ts, admin/*.ts, questionnaire.ts, images.ts
│   │   ├── services/             # email (Gmail API), turnstile, images (R2), audit, session
│   │   ├── db/                   # drizzle schema.ts, migrations/
│   │   └── middleware/           # requireOwner, rateLimit, validate(zod)
│   ├── wrangler.toml             # D1, R2, rate-limit bindings
│   └── tests/                    # vitest-pool-workers integration + contract tests
packages/
└── shared/                       # Zod schemas, types, constants (palette, limits, enums)
    └── src/
e2e/                              # Playwright scenarios (quickstart.md maps to these)
.github/workflows/
├── ci.yml                        # lint, typecheck, unit + integration tests, e2e
├── deploy-web.yml                # build web → wrangler deploy (Workers Static Assets)
└── deploy-api.yml                # d1 migrations apply → wrangler deploy
pnpm-workspace.yaml
```

**Structure Decision**: Keep two deployables (`apps/web` → Cloudflare Workers Static Assets,
`apps/api` → the Hono Worker) plus shared validation. Admin remains in the same React app.
The frontend Worker serves built assets and routes valid client-only HTML navigations to
React Router's generated `__spa-fallback.html` when Home is prerendered; it contains no
business API or server-rendered React. Prerendered public pages keep their own HTML; missing
asset requests must remain 404. Test root, service, admin/callback and questionnaire direct
loads/refreshes against the built Worker. T060 replaces the former copied-404 fallback.

## Complexity Tracking

The local-development sequencing exception in `feasibility-decision.md` was approved
by the owner on 2026-11-13. Production feasibility, live-provider acceptance and release
remain gated. Open obligations are tracked above. Two deliberate
complexity choices are recorded below; rationale does not waive security or test gates:

| Choice                                  | Why Needed                                                                               | Simpler Alternative Rejected Because                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Separate frontend and API deployments   | Preserve independent static-content/API rollout and existing service boundaries          | Combining deployments is unnecessary for the requested frontend-host change                   |
| Bearer-token session instead of cookies | Preserve verified identity-grant/session behavior across configured frontend/API origins | A cookie migration changes authentication and browser tests beyond this hosting clarification |

## Post-Design Constitution Re-check

Re-evaluated after the hosting clarification on 2026-11-13 against constitution v1.0.0:
Workers Static Assets is compatible with the existing React/Workers/D1/R2 principles;
no constitution amendment is required. The design retains two deployables
and shared validation. Spec, plan, tasks, and quickstart now require TDD and the E2E policy.
The OPEN gates above remain open; T001 must resolve feasibility/data decisions before
dependent work, and implementation/release gates require actual results. No automatic
compliance or release pass is granted by this documentation update.
