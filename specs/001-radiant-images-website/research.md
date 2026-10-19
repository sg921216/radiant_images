# Phase 0 Research: Radiant Images Photography Website

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-17

All "NEEDS CLARIFICATION" / "TBD" items from the plan's Technical Context and the brief's known-unknowns (item 9 — technology & operations; item 10 — quality/privacy targets; item 7 — admin identity) are resolved below. User-confirmed constraints: public site on **GitHub Pages**, **Cloudflare Workers** backend (option C), email via **Rebekah's Gmail**, $0 infrastructure.

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
3. If allowed, Worker creates a `sessions` row (random 256-bit opaque token, hashed at rest, 24 h sliding inactivity expiry, 7-day absolute cap) and redirects to `https://<pages-origin>/admin/callback#token=<one-time-exchange-code>`.
4. SPA exchanges the one-time code for the session token via `POST /auth/exchange`, stores it in `sessionStorage`, and sends `Authorization: Bearer <token>` on admin calls.
5. `POST /auth/logout` deletes the session. Non-allow-listed emails get a 403 page and no session.

**Rationale**: Frontend (`*.github.io`) and API (`*.workers.dev`) are different sites; Safari/iOS and increasingly Chrome block third-party cookies, so a cookie session would break the admin on Rebekah's iPhone. A bearer token in `sessionStorage` avoids that, is cleared when the tab closes, and the one-time exchange keeps the long-lived token out of browser history/referrers. Owner authorization is enforced by `requireOwner` middleware on every admin route and on the underlying operations, satisfying the "knowing the URL grants nothing" invariant.

**Hardening**: strict CSP on the SPA (only self + Turnstile + API origin), no third-party scripts in admin, token hashed in D1, rate-limited auth endpoints.

**Alternatives considered**: Auth.js (designed around cookies/Next; heavy on Workers), Cloudflare Access (free for ≤ 50 users but gates the whole origin and requires a custom domain), HttpOnly `SameSite=None` cookie (Safari ITP failure mode), Firebase Auth (extra vendor).

**Future**: once a custom domain exists and both SPA and API share it, switch to HttpOnly cookies — only `apps/web/app/lib/auth.ts` and the `auth.ts` route file change.

## R-07 Outgoing email (FR-019, FR-028, FR-031a/c)

**Decision**: **Gmail API** (`users.messages.send`) called from the Worker using a stored OAuth 2.0 **refresh token** for Rebekah's Google account (scope `https://www.googleapis.com/auth/gmail.send`). The `From` header is the owner-configured sender address (must be the authenticated Gmail account or one of its verified "Send mail as" aliases — the Worker validates this on save). Inquiry notifications set `Reply-To` to the visitor's email; client emails set `Reply-To` to the sender address.

**Setup (one-time, documented in quickstart)**: create a Google Cloud project; configure the OAuth consent screen as *External* and **publish it to Production** (unverified-app warning is shown only to Rebekah during the single consent); run `scripts/gmail-consent.ts` locally to obtain the refresh token; store as `GMAIL_REFRESH_TOKEN` secret. The same OAuth client is reused for owner sign-in (R-06).

**Known risk**: a consent screen left in *Testing* status expires refresh tokens after 7 days → emails silently stop. Mitigation: publish the app (above) and add a health check endpoint that attempts a token refresh daily (Workers Cron Trigger, free) and writes an audit event on failure.

**Quota**: consumer Gmail sends ≤ 500 messages/day via API — far above the ≤ 20 inquiries/day scale.

**Delivery semantics (FR-020)**: success is reported to the visitor only when the Gmail API returns 200 with a message id; any error → visitor sees the retryable error, values preserved, audit event recorded, no retry queue (FR-023).

**Alternatives considered**: Resend/Postmark free tiers (cannot legitimately send *from* a gmail.com address — DMARC fails; would require a custom domain the business does not have), SMTP via Workers TCP sockets (no mature library, Gmail requires app passwords), MailChannels (Workers integration discontinued).

## R-08 Pricing PDF & print (FR-009–011)

**Decision**: The **browser generates the PDF** using `@react-pdf/renderer` from the exact `GET /pricing` JSON (which includes `revisionId`); the print view is a CSS `@media print` stylesheet over the same data. The PDF footer embeds the revision id and publish date so spot checks (SC-006) are trivially verifiable.

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
- **Unit**: Vitest for `packages/shared` schemas and web utilities (pricing → PDF model, banner eligibility, date window).
- **Component**: React Testing Library for forms (required-field logic FR-016, conditional phone), gallery responsiveness via viewport mocks.
- **API integration**: `@cloudflare/vitest-pool-workers` runs the Worker against local D1/R2 (Miniflare); Gmail/Turnstile/Google calls mocked via `fetchMock`.
- **Contract**: generated tests assert each endpoint's response matches `contracts/openapi.yaml` schemas.
- **E2E**: Playwright against `pnpm dev` (web + `wrangler dev`) covering the quickstart scenarios; Turnstile uses the official *always-pass* test site key in non-prod.
- **Accessibility**: `@axe-core/playwright` on every public route (SC-009).

## R-12 CI/CD & environments

**Decision**: GitHub Actions.
- `ci.yml` on PR: lint (ESLint + Prettier), typecheck, unit/component/integration/contract tests, Playwright e2e.
- `deploy-api.yml` on push to `main`: `wrangler d1 migrations apply --remote` then `wrangler deploy` (secret `CLOUDFLARE_API_TOKEN`).
- `deploy-web.yml` on push to `main`: build with `VITE_API_ORIGIN` → `actions/deploy-pages`.
- Environments: `local` (wrangler dev + Vite), `production`. A `preview` Worker environment is optional and free; GitHub Pages has no preview — PR previews rely on local runs.

## R-13 Data backup (assumption: daily backups)

**Decision**: Daily Cron Trigger in the Worker exports all D1 tables as JSON to a private `backups/` prefix in R2 (30-day retention); D1 Time Travel (30-day point-in-time restore, free) is the primary restore mechanism. R2 image originals are the backup of derived variants.

## R-14 Accessibility & browser targets

**Decision**: WCAG 2.1 AA. Palette pairings verified: Charcoal `#2F3431` on Warm Cream `#F9F6F0` = 12.6:1 ✓; Charcoal on Soft Sage `#9CAF88` = 6.4:1 ✓ (use charcoal text on sage buttons, **not white** — white on sage is 2.4:1 ✗); white on Muted Olive `#6E7A5F` = 4.9:1 ✓; Soft Linen Rose only decorative. Browserslist: `defaults and fully supports es6-module`, i.e., current + previous major evergreen browsers.

## R-15 Launch-time configuration (not design decisions)

| Item | Where set | Initial value |
|------|-----------|---------------|
| Inquiry recipient | Admin → Settings (D1 `site_config`) | `tbd@gmail.com` (placeholder; confirm) |
| Sender address | Admin → Settings; must match Gmail account/alias | Rebekah's business Gmail once created |
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
| Performance / constraints | plan.md Technical Context; verified against free-tier budgets (R-04, R-07, R-09) |
| Email, CAPTCHA, identity provider | R-07, R-05, R-06 |
| Rate limits, audit, backups, a11y | R-09, R-10, R-13, R-14 |

No NEEDS CLARIFICATION items remain.
