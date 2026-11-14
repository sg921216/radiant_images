# Phase 0 Research: Radiant Images Photography Website

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-17

**Constitution reconciliation (2026-11-13)**: React + Cloudflare Workers is confirmed.
Constitution v1.0.0 adds mandatory TDD, deterministic E2E, WCAG 2.2 AA, media/data privacy,
SEO/performance budgets, and release evidence. Historical provider/version/quota claims
below require T001 verification; they are not revalidated by this governance update.
T001 also resolves image pixel bounds and verifies provider support for the client deletion
and recovery policy in spec.md QR-002/data-model.md before dependent work. Current test and
quality rules are specified in plan.md and quickstart.md.

The original design decisions are recorded below. Existing constraints: public site on
**GitHub Pages**, **Cloudflare Workers** backend, email via **Rebekah's Gmail**, and $0
infrastructure. Open feasibility and governance obligations are tracked in T001 and plan.md.

---

## R-01 Frontend framework & hosting

**Decision**: React 19 + TypeScript on Vite 6 using **React Router v7 in framework mode** with `ssr: false`. Public routes are prerendered to static HTML at build time; admin and questionnaire routes are client-rendered. Deployed to GitHub Pages via GitHub Actions. A `404.html` copy of `index.html` provides SPA fallback for non-prerendered routes.

**Rationale**: Matches the user's "Vite" preference; prerendering gives crawlable, fast first paint for the marketing pages (SC-004) while keeping the admin in the same codebase. GitHub Pages is free, HTTPS by default, and the user's stated host.

**Alternatives considered**:
- *Next.js App Router* — needs a Node/edge server or `output: 'export'`, which disables most of what makes Next attractive; not Vite.
- *Astro + React islands* — excellent for static content, but the admin SPA would be a second mental model; build-time image optimization doesn't help owner-uploaded runtime images.
- *Cloudflare Workers Static Assets* for the SPA — would eliminate the cross-origin auth problem (R-06); rejected only because the user explicitly chose GitHub Pages. **Documented as the recommended future migration** if cross-origin friction arises.

## R-02 Backend runtime & framework

**Decision**: **Cloudflare Workers** (free tier) with **Hono 4** as the HTTP framework.

**Rationale**: Free tier (100k requests/day, no card required) comfortably covers 1–5k visitors/month. Hono is tiny, typed, Workers-native, has built-in CORS/validator middleware, and integrates with Zod for shared schemas.

**Alternatives considered**: itty-router (less middleware), raw `fetch` handler (more boilerplate), Google Cloud Run (option B — needs billing account), Google Apps Script (option A — Sheets/Drive limits break SC-005 and image reliability).

## R-03 Database

**Decision**: **Cloudflare D1** (SQLite) accessed through **Drizzle ORM** with `drizzle-kit` SQL migrations committed to the repo and applied in CI via `wrangler d1 migrations apply`.

**Rationale**: Free (5 GB, 5M reads/day), zero ops, same vendor as the Worker so no connection management. Data volume is tiny (hundreds of rows). D1 supports `batch()` for atomic multi-statement writes, satisfying FR-030 (no partial publish).

**Alternatives considered**: Neon Postgres (free tier, but a second vendor and connection pooling from Workers adds latency), Turso (similar to D1, extra vendor), KV (no relational queries).

## R-04 Image storage & delivery

**Decision**: Images stored in **Cloudflare R2**. The admin SPA **resizes and re-encodes in the browser** (Canvas → WebP) before upload, producing three variants: `full` (max 2000 px long edge), `card` (max 800 px), `thumb` (max 320 px). The Worker validates type/size (≤ 10 MB original, JPEG/PNG/WebP), writes the three objects, and serves them at `GET /images/{id}/{variant}` with `Cache-Control: public, max-age=31536000, immutable`.

**Rationale**: Workers cannot run `sharp`/libvips on the free tier, so client-side resizing is the zero-cost way to get responsive images. Serving through the Worker (rather than the `r2.dev` public URL, which Cloudflare labels rate-limited/not-for-production) keeps URLs stable and lets us switch to a custom domain later without changing references. Immutable caching means repeat views cost no Worker requests.

**Budget check**: 60 images × 3 variants; a home-page view requests ~60 `card` images on first visit → ~1.7k uncached page views/day before hitting the 100k/day cap. Acceptable for MVP; migrate to R2 custom domain if traffic grows.

**Alternatives considered**: Cloudflare Images (paid), committing images to the GitHub repo via API and rebuilding Pages (publishing delay 1–3 min violates SC-005), Google Drive links (unreliable hotlinking).

## R-05 CAPTCHA

**Decision**: **Cloudflare Turnstile** (free, unlimited). Widget rendered via `@marsidev/react-turnstile`; the Worker verifies the token server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify` before any validation side effects (FR-018). Tokens are single-use and expire in 300 s; expiry triggers a widget reset while preserving form values (FR-021).

**Rationale**: Privacy-friendly, no puzzle for most users (better for SC-008 first-attempt completion), same vendor as backend, free.

**Alternatives considered**: reCAPTCHA v3 (Google, scoring opaque, privacy concerns), hCaptcha (free but more friction).

## R-06 Owner authentication & session (FR-024–026)

**Decision**: **Google OpenID Connect authorization-code flow with PKCE**, implemented in the Worker using `arctic` (Google provider). Flow:

1. SPA → `GET /auth/google/start` → Worker stores `state`+`code_verifier` in a short-lived D1 row, redirects to Google.
2. Google → `GET /auth/google/callback` → Worker exchanges code, validates ID token (`email_verified` must be true), checks `email` against `OWNER_ALLOWLIST` secret (comma-separated).
3. If allowed, Worker stores only a 60-second identity grant in `exchange_codes` (SHA-256 hash of a random 256-bit one-time code, verified owner email, creation/expiry times), consumes the browser-bound OAuth state, and redirects to `https://<pages-origin>/admin/callback#code=<one-time-exchange-code>`. No session/bearer exists at callback time.
4. SPA immediately removes the fragment and submits the code once to `POST /auth/exchange`. Worker rechecks the allow-list and atomically consumes the unexpired grant and creates one session storing only the hash of a newly generated 256-bit bearer. Return the raw bearer after commit with `Cache-Control: no-store`; the SPA stores it in `sessionStorage` and sends `Authorization: Bearer <token>` on admin calls. Session clocks start at redemption (24 h sliding inactivity, seven-day absolute cap).
5. `POST /auth/logout` deletes the session. Non-allow-listed emails get a 403 page and no session.

Concurrent exchanges have one winner; invalid/expired/replayed codes return 400 and an
owner removed between callback and exchange gets 403 with grant invalidation. Failed
transactions leave no session and preserve the grant. A lost post-commit response requires
a fresh Google sign-in, not code replay or raw-token recovery; the unreachable session
expires normally. Raw codes and bearer tokens never enter server persistence, logs or
backups. These are explicit T010/T011/T012 acceptance cases.

**Rationale**: Frontend (`*.github.io`) and API (`*.workers.dev`) are different sites; Safari/iOS and increasingly Chrome block third-party cookies, so a cookie session would break the admin on Rebekah's iPhone. A bearer token in `sessionStorage` avoids that, is cleared when the tab closes, and the one-time exchange keeps the long-lived token out of browser history/referrers. Owner authorization is enforced by `requireOwner` middleware on every admin route and on the underlying operations, satisfying the "knowing the URL grants nothing" invariant.

**Hardening**: strict CSP on the SPA (only self + Turnstile + API origin), no third-party scripts in admin, token hashed in D1, rate-limited auth endpoints.

**Alternatives considered**: Auth.js (designed around cookies/Next; heavy on Workers), Cloudflare Access (free for ≤ 50 users but gates the whole origin and requires a custom domain), HttpOnly `SameSite=None` cookie (Safari ITP failure mode), Firebase Auth (extra vendor).

**Future**: once a custom domain exists and both SPA and API share it, switch to HttpOnly cookies — only `apps/web/app/lib/auth.ts` and the `auth.ts` route file change.

## R-07 Outgoing email (FR-019, FR-028, FR-031a/c)

**Decision**: **Gmail API** (`users.messages.send`) called from the Worker using a stored OAuth 2.0 **refresh token** for Rebekah's Google account (scope `https://www.googleapis.com/auth/gmail.send`). The `From` header is the owner-configured sender address (must be the authenticated Gmail account or one of its verified "Send mail as" aliases — the Worker validates this on save). Inquiry notifications set `Reply-To` to the visitor's email; client emails set `Reply-To` to the sender address.

**Setup (one-time, documented in quickstart)**: create a Google Cloud project; configure the OAuth consent screen as *External* and **publish it to Production** (unverified-app warning is shown only to Rebekah during the single consent); run `scripts/gmail-consent.ts` locally to obtain the refresh token; store as `GMAIL_REFRESH_TOKEN` secret. The same OAuth client is reused for owner sign-in (R-06).

**Known risk**: a consent screen left in *Testing* status expires refresh tokens after 7 days → emails silently stop. Mitigation: publish the app (above) and add a health check endpoint that attempts a token refresh daily (Workers Cron Trigger, free) and writes an audit event on failure.

**Quota**: consumer Gmail sends ≤ 500 messages/day via API — far above the ≤ 20 inquiries/day scale.

**Delivery semantics (FR-020, reconciled 2026-11-13)**: report acceptance only after the
Gmail API confirms it. A definite rejection/pre-dispatch failure returns `502 email_not_sent`
with `retryable: true`; a possibly dispatched send whose result is lost or times out returns
`504 email_outcome_unknown` with `retryable: false`. Preserve values and require manual
owner/mailbox verification before a new send after uncertainty, including browser/API
response loss. No automatic resend or inquiry queue is permitted. A known accepted inquiry
remains 202 if primary audit persistence fails; use sanitized fallback audit and failure
signals. An accepted owner email whose history write fails returns `500 email_history_failed`
with `retryable: false` and requires manual reconciliation, not another send. Retain possibly
delivered invitations; invalidate only on definite non-delivery. Plan.md defines two-second
provider-call and four-second overall email deadlines. Duplicate claims expire after two
minutes but expiry is not evidence that resending is safe.

Visitor recovery uses a required, owner-approved `publicContactEmail` exposed on Contact
and retained in the active form, independent of private sender/recipient settings. A
selectable address and mailto link without inquiry data let the visitor check receipt with
Rebekah outside the Worker send path. Receipt confirmed means finish without sending;
otherwise acknowledge that Rebekah checked and requested another send, then explicitly
restart with the retained draft, fresh CAPTCHA and manual Submit. Existing duplicate and
rate limits still apply. Unknown receipt, opening the link or waiting never enables resend.

For template and dedicated questionnaire sends, expand `{{questionnaireLink}}` only in
transient server dispatch content, creating one same-client invitation per explicit send.
Retain `[questionnaire link omitted]` in history subject/body plus nullable invitation ID;
never retain the rendered token-bearing MIME. Reject literal application questionnaire URLs
in stored templates/composed input. Admin previews/history expose placeholders and an
authenticated invitation-detail link, not raw tokens. See plan.md and data-model.md for
the T048/T053 redaction, association and failure cases.

**Alternatives considered**: Resend/Postmark free tiers (cannot legitimately send *from* a gmail.com address — DMARC fails; would require a custom domain the business does not have), SMTP via Workers TCP sockets (no mature library, Gmail requires app passwords), MailChannels (Workers integration discontinued).

## R-08 Pricing PDF & print (FR-009–011)

**Decision**: The **browser generates the PDF** using `@react-pdf/renderer` from the exact `GET /pricing` JSON (which includes `revisionId`); the print view is a CSS `@media print` stylesheet over the same data. The PDF footer embeds the revision id and publish date so spot checks (SC-006) are trivially verifiable.

The current revision is selected only through `pricing_publication.current_revision_id`.
Publish revision/packages and change that singleton pointer in one transaction; concurrent
publications resolve by commit order even with identical timestamps. Bootstrap and pricing
read pointer/revision/packages consistently; each web/print/PDF render retains one revision.
T026 tests equal-time publication and rollback; timestamps remain display/audit metadata.

**Rationale**: Workers free tier has no reliable headless Chromium; pure-JS layout (pdf-lib) is laborious; `@react-pdf/renderer` gives declarative layout with the same React components mindset and runs fully client-side at zero cost. Single-revision consistency is guaranteed by rendering from one payload.

**Alternatives considered**: Cloudflare Browser Rendering (free tier limited to ~10 min/day; brittle), server-side pdf-lib (manual text layout), pre-generated PDF stored in R2 on each pricing save (viable fallback if client-side generation proves slow on low-end phones — noted as a possible task).

## R-09 Rate limiting & abuse controls (FR-035)

**Decision**: Cloudflare **Workers Rate Limiting binding** (available on free tier), keyed by client IP (`CF-Connecting-IP`):

| Endpoint group | Limit |
|----------------|-------|
| `POST /inquiries` | 5 per 10 min per IP |
| `GET /auth/google/*`, `POST /auth/exchange` | 10 per 10 min per IP |
| `POST /questionnaire/{token}` | 5 per 10 min per IP |
| Admin mutations | 120 per min per session |

Plus the duplicate-inquiry guard (same normalised email + message hash within 2 min) stored in D1 with a 2-minute TTL cleanup.

**Alternatives considered**: KV counters (eventually consistent), D1 counters (write amplification), Cloudflare WAF rate rules (require custom domain / paid).

## R-10 Audit log & observability (FR-032)

**Decision**: `audit_events` table in D1 (actor email or `visitor`, action, entity type/id, outcome, timestamp, request id — **no message bodies or visitor PII**). Worker logs structured JSON (viewable with `wrangler tail`; Workers Logs free tier retains 3 days). A daily Cron Trigger runs the Gmail token health check (R-07) and prunes expired sessions/duplicate-guard rows.

**Alternatives considered**: Sentry free tier (useful later; not required for MVP), Logpush (paid).

## R-11 Testing strategy

**Decision**:
- **Process**: Mandatory red-green-refactor for all executable behavior, including shared
  foundation, migrations, UI interactions, validation, and defect fixes. Record meaningful
  failing and passing runs; do not defer tests to the final phase.
- **Unit**: Vitest for `packages/shared` schemas and web utilities (pricing → PDF model, banner eligibility, date window).
- **Component**: React Testing Library for forms (required-field logic FR-016, conditional phone), gallery responsiveness via viewport mocks.
- **API integration**: `@cloudflare/vitest-pool-workers` runs the Worker against local D1/R2 (Miniflare); Gmail/Turnstile/Google calls mocked via `fetchMock`.
- **Contract**: generated tests assert each endpoint's response matches `contracts/openapi.yaml` schemas.
- **E2E**: Playwright against the real local React/Worker/D1/R2 stack, with controlled
  external Google/Gmail/Turnstile adapters including rejection/outage scenarios. Fresh
  contexts, unique/resettable data, deterministic seeds/cleanup, and controlled time;
  semantic locators and retrying assertions replace fixed sleeps. Test-only modes must
  be unreachable in production. Separate live-provider acceptance proves mailbox receipt.
- **Matrix/CI**: PR Chromium desktop/mobile smoke; complete Chromium/Firefox/WebKit nightly
  and before release, including 320/768/1280 px checks. Reject focused/flaky tests; at most
  one diagnostic retry, sanitized traces/screenshots retained seven days, and documented
  owner/issue/expiry/alternative evidence for any quarantine. Critical checks cannot vanish.
- **Accessibility**: `@axe-core/playwright` on public/admin/questionnaire routes plus
  keyboard and representative screen-reader review against WCAG 2.2 AA (SC-009).

## R-12 CI/CD & environments

**Decision**: GitHub Actions.
- `ci.yml` on PR: formatting/lint, typecheck, production build, unit/component/integration/
  contract tests, Chromium E2E smoke, dependency/secret checks; full browser matrix nightly
  and before release. Establish these gates in T006 and complete them in T059.
- `deploy-api.yml` on push to `main`: `wrangler d1 migrations apply --remote` then `wrangler deploy` (secret `CLOUDFLARE_API_TOKEN`).
- `deploy-web.yml` on push to `main`: build with `VITE_API_ORIGIN` → `actions/deploy-pages`.
- Both deployment workflows MUST depend on applicable passing checks and release evidence;
  pushing to main alone does not satisfy release gates. Document migration/rollback/restore.
- Environments: `local` (wrangler dev + Vite), `production`. A `preview` Worker environment is optional and free; GitHub Pages has no preview — PR previews rely on local runs.

## R-13 Data backup (assumption: daily backups)

**Decision**: Daily Cron Trigger exports durable owner-managed D1 data as JSON to a private
`backups/` prefix in R2, expiring each copy within 30 days of creation. Exclude transient
OAuth state, exchange codes, sessions, and inquiry dedupe entries; never introduce inquiry
payload storage. Provider-managed recovery is supplementary: T001 must verify availability,
cost and an actual recovery window no longer than 30 days, rather than assume a free 30-day
Time Travel entitlement. R2 private originals support derived-image recovery under T001's
verified upload design.

Client deletion removes live records and dependent checklist/email/questionnaire data.
Older private recovery copies can still contain that data for at most 30 days after deletion;
they are unavailable to application routes. Maintain client-ID/deletion-time receipts for
31 days in a separate private `client-deletions/` R2 ledger, outside the database restore set.
Confirm deletion only when the live cascade and durable receipt are complete; handle partial
failures idempotently as specified in data-model.md. Restore offline, reapply the independent
ledger, and verify cascades before allowing reads or email sends. Missing/unreconciled ledger
evidence blocks reopening. Do not overwrite the ledger with an older backup or create new
backups from unreconciled data. T050/T058 tests and T063 rehearsal verify this policy (QR-002).

## R-14 Accessibility & browser targets

**Decision**: WCAG 2.2 AA for public, admin, and questionnaire routes, with automated and
manual review. Validate actual rendered palette pairings, focus, labels/errors, resizing,
and reduced motion; prior palette calculations are not proof of conformance. Browserslist
controls build targeting, not test coverage. Record the actual Playwright browser versions
separately from T063's required actual-browser N/N-1 release matrix in plan.md. That matrix
names browser/OS combinations and requires physical mobile devices or a real-device service.
Freeze exact versions at release and record per-journey results; unavailable or failed
combinations remain blocked. Do not infer physical-device or previous-version support
from emulation. T061 separately enforces plan.md's API/inquiry latency profile; T025/T063
apply the predeclared SC-002 delivery run and SC-008 cohort/scoring protocol.

Public content must be crawlable with titles/descriptions/canonical URLs and a sitemap;
private/tokenized routes must be noindex. Responsive derivatives reserve dimensions and
lazy-load below-fold media, while the primary visible image loads promptly. Use plan.md's
JS/image budgets and mobile profile for prelaunch evidence, and report field-data gaps.
Uploads require permission, private originals, safe content/pixel validation, generated
keys, and EXIF/GPS-free public derivatives under constitution Principles V–VI.

## R-15 Launch-time configuration (not design decisions)

| Item | Where set | Initial value |
|------|-----------|---------------|
| Inquiry recipient | Admin → Settings (D1 `site_config`) | `tbd@gmail.com` (placeholder; confirm) |
| Sender address | Admin → Settings; must match Gmail account/alias | Rebekah's business Gmail once created |
| Public contact email | Admin → Settings; explicitly labeled public, independent of private addresses | Owner-approved monitored business address before launch; local fixtures use `hello@example.invalid` |
| Owner allow-list | `wrangler secret OWNER_ALLOWLIST` | Rebekah's Google account email |
| Admin route | SPA `/admin` (unguessable path adds nothing — auth is the control) | `/admin` |
| Timezone | Admin → Settings | `America/New_York` |
| Turnstile keys, Google client id/secret, Gmail refresh token | `wrangler secret` / `VITE_TURNSTILE_SITE_KEY` | per environment |

## Resolved unknowns summary

| Technical Context field | Resolution |
|-------------------------|-----------|
| Language/Version | TypeScript 5, Node 22 tooling, Workers runtime |
| Primary dependencies | R-01, R-02, R-03, R-05, R-06, R-08 |
| Storage | D1 + R2 (R-03, R-04) |
| Testing | R-11 |
| Target platform | GitHub Pages + Cloudflare Workers (R-01, R-02) |
| Performance / constraints | plan.md Technical Context; provider budgets/entitlements require T001 verification |
| Email, CAPTCHA, identity provider | R-07, R-05, R-06 |
| Rate limits, audit, backups, a11y | R-09, R-10, R-13, R-14 |

Design choices remain documented; T001 feasibility/data-lifecycle decisions and all
implementation/release evidence remain open. These are tracked obligations, not passes.
