# Contracts: Radiant Images

Two external interfaces exist:

1. **Worker HTTP API** — [openapi.yaml](./openapi.yaml). Consumed by the SPA; also the surface for contract tests (`apps/api/tests/contract/`).
2. **SPA route contract** — the public URLs the site must expose (below). These are prerendered by React Router v7 and are the stable links used in navigation, emails, and the questionnaire.

## SPA routes

| Route | Prerendered | Purpose | Spec |
|-------|-------------|---------|------|
| `/` | yes | Home: header, banner, full gallery, Book Now | FR-001, 005, 006, 012 |
| `/maternity`, `/newborn`, `/family` | yes | Service page: intro, How It Works, tagged gallery, **Pricing section** (Print / Download PDF / Book Now) | FR-003, 005, 006, 008–010 |
| `/about` | yes | About page | FR-004 |
| `/faq` | yes | FAQ (≥ 4 mandatory topics) | FR-004 |
| `/contact` | yes | Inquiry form + Turnstile | FR-015–022 |
| `/q/:token` | no | Client questionnaire (public, single-use link) | FR-031c |
| `/admin` | no | Login gate → dashboard | FR-024–026 |
| `/admin/callback`, `/admin/denied` | no | OAuth return / not-allow-listed | FR-025 |
| `/admin/gallery` | no | Upload / tag / reorder / delete | FR-027 |
| `/admin/banners` | no | Banner CRUD | FR-014 |
| `/admin/pricing` | no | Package editor + publish | FR-011 |
| `/admin/content` | no | Page intros, How It Works, FAQ | FR-003, 004 |
| `/admin/settings` | no | Recipient, sender, locations, referral sources, timezone | FR-028, 029 |
| `/admin/clients`, `/admin/clients/:id` | no | Client list / detail (emails, checklist, questionnaires) | FR-031, 031a–d |
| `/admin/templates`, `/admin/checklist`, `/admin/questionnaire` | no | Master data editors | FR-031a–c |

GitHub Pages serves `404.html` (a copy of `index.html`) so non-prerendered routes resolve client-side.

## Cross-cutting API behaviours

| Concern | Contract |
|---------|----------|
| CORS | `Access-Control-Allow-Origin` = configured Pages origin only; `Authorization` header allowed; no credentials/cookies |
| Auth | `Authorization: Bearer <token>`; 401 when missing/expired, 403 when email not allow-listed (re-checked per request) |
| Validation | Zod schemas from `packages/shared`; 400 with `error.fields` |
| Rate limits | 429 + `Retry-After`; limits in [research R-09](../research.md#r-09-rate-limiting--abuse-controls-fr-035) |
| Caching | `GET /public/bootstrap`, `GET /pricing`: `Cache-Control: public, max-age=60` (meets ≤ 60 s publish SLO); `GET /images/*`: immutable 1 y |
| Atomicity | All multi-row writes use D1 `batch()`; partial failure → 500 and no change |
| Audit | Every admin mutation and inquiry outcome writes `audit_events` |
| Idempotency | `PUT` replacements are idempotent; `POST /inquiries` deduped by content hash for 2 min (409 `duplicate`) |

## Functional-requirement traceability

| FR | Endpoint(s) / Route(s) |
|----|------------------------|
| FR-001, 002 | SPA `Header` component; all public routes |
| FR-003 | `/maternity` `/newborn` `/family`; `PUT /admin/pages/{page}`; `GET /public/bootstrap.pages` |
| FR-004 | `/about` `/faq`; `PUT /admin/faq` |
| FR-005 | `GET /public/bootstrap.gallery` filtered client-side by tag |
| FR-006 | `BookNow` component → `/contact` |
| FR-007 | Tailwind theme tokens (palette) |
| FR-008–010 | `GET /pricing`; `PricingSection`, `print.css`, `PricingPdf` |
| FR-011 | `GET/PUT /admin/pricing` |
| FR-012, 013 | `GET /public/bootstrap.banner` (null when none) |
| FR-014 | `/admin/banners/*` |
| FR-015–017, 021 | `InquirySubmission` schema (shared); `POST /inquiries` |
| FR-018 | Turnstile verify step in `POST /inquiries` |
| FR-019, 020 | Gmail send in `POST /inquiries`; 202 only on provider success |
| FR-022 | `inquiry_dedupe` + 409 |
| FR-023 | No inquiry table; only `audit_events` |
| FR-024 | `/auth/google/start`, `/auth/google/callback` |
| FR-025 | allow-list check in callback + `requireOwner` middleware |
| FR-026 | `sessions` sliding expiry; `POST /auth/logout` |
| FR-027 | `/admin/gallery/*`, `GET /images/*` |
| FR-028, 029 | `GET/PUT /admin/config` |
| FR-030 | D1 `batch()` everywhere |
| FR-031 | `/admin/clients/*` |
| FR-031a | `/admin/templates`, `POST /admin/clients/{id}/emails` |
| FR-031b | `/admin/checklist`, `PUT /admin/clients/{id}/checklist/{itemId}` |
| FR-031c | `/admin/questionnaire`, `POST /admin/clients/{id}/questionnaires`, `GET/POST /questionnaire/{token}` |
| FR-031d | `POST /admin/clients` (manual entry) |
| FR-032 | `audit_events` writes |
| FR-033 | SPA a11y practices + axe e2e |
| FR-034 | HTTPS (Pages + Workers), CSP, secrets via `wrangler secret` |
| FR-035 | Rate Limiting binding |
