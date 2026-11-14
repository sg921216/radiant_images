# Contracts: Radiant Images

Two external interfaces exist:

**T001 checkpoint (2026-11-13)**: API contract 0.2.0 adds required original image bytes,
explicit upload/pixel bounds, a 413 upload response, and a required numeric Retry-After
header. Research R-16 records the remaining decoder/retention feasibility work.
The frontend host is now owner-approved Cloudflare Workers Static Assets; decoder/retention
verification remains open. These are design corrections; there is no implemented API or
passing runtime suite yet.

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

Cloudflare Workers Static Assets serves prerendered public HTML at the frontend origin's
root basename `/`. The frontend Worker routes valid non-prerendered HTML navigations to
React Router's generated `__spa-fallback.html` when Home is prerendered. Direct loads and
refreshes of admin/callback and questionnaire URLs must hydrate the intended route; missing
asset requests remain 404. The separate API origin always returns its API responses and
must never fall back to frontend HTML.

## Cross-cutting API behaviours

| Concern | Contract |
|---------|----------|
| CORS | `Access-Control-Allow-Origin` = exact configured frontend origin (`WEB_ORIGIN`); `Authorization` header allowed; no credentials/cookies |
| Auth | `Authorization: Bearer <token>`; 401 when missing/expired, 403 when email not allow-listed (re-checked per request). Every protected operation declares both responses in OpenAPI. |
| Session handoff | Callback stores a hashed 60-second identity grant, with no session yet. Exchange atomically consumes it and stores a fresh bearer hash; return the raw bearer once after commit with `Cache-Control: no-store`. Invalid/expired/used codes: 400; owner removed before redemption: 403 and grant invalidation. Lost response: restart Google sign-in, never recover/replay the token. |
| Public recovery contact | Required `PublicConfig.publicContactEmail` is explicitly approved for publication, independent of private recipient/sender. Display it before submission and retain it in the active form through failures; never derive it from private fields. |
| Validation | Zod schemas from `packages/shared`; 400 with `error.fields` |
| Rate limits | 429 + `Retry-After`; limits in [research R-09](../research.md#r-09-rate-limiting--abuse-controls-fr-035) |
| Caching | `GET /public/bootstrap`, `GET /pricing`: `Cache-Control: public, max-age=60` (meets ≤ 60 s publish SLO); `GET /images/*`: immutable 1 y |
| Atomicity | Database multi-row changes use D1 `batch()`; failed transactions leave prior database state intact. External email delivery cannot be rolled back; its separate outcomes below govern recovery. |
| Audit | Every admin mutation and inquiry outcome writes `audit_events` |
| Idempotency | `PUT` replacements are idempotent; `POST /inquiries` deduped by content hash for 2 min (409 `duplicate`) |
| Pricing selection | Publish revision/packages and update the singleton `pricing_publication` pointer atomically. Last committed publication wins; equal timestamps do not create multiple current revisions. Both public readers load one consistent revision. |
| Error contracts | Every operation declares applicable validation, authorization, resource, rate-limit, internal and provider failures. Contract tests validate status and body against that operation; a shared component alone does not declare a response. |

### Email outcome contract

| Outcome | Response | Recovery |
|---------|----------|----------|
| Confirmed provider acceptance | Inquiry 202; owner send/invitation 201 after required history is recorded | Show acceptance, never a confirmed booking; mailbox receipt is separate evidence. |
| Definite non-delivery | 502 `email_not_sent`, `retryable: true` | Preserve draft, allow an explicit user retry after recovery; release inquiry duplicate claim. |
| Delivery uncertain after dispatch | 504 `email_outcome_unknown`, `retryable: false` | Preserve draft and possibly delivered invitation; retain inquiry claim until expiry. Require manual owner/mailbox verification before any explicit new send. |
| Confirmed owner-send acceptance but history write failed | 500 `email_history_failed`, `retryable: false` | Report acceptance and recording failure separately; manually reconcile history without resending. |

A lost browser/API response after Submit is also uncertain. No send is automatically
retried; guard expiry does not re-enable an uncertain submission. Unclassified failures
do not establish retry safety. Only a definite non-delivery result permits invalidating
that send's invitation. A known accepted inquiry remains 202 if primary audit storage
fails; emit sanitized fallback audit/failure signals without retaining its payload.
Provider and overall operation deadlines follow plan.md. Generic `BadGateway` is used
only before email dispatch, never in place of these send-specific outcomes.

For visitor uncertainty, show selectable `publicContactEmail` and a mailto link containing
no inquiry data. Submit remains disabled until the visitor acknowledges that Rebekah
checked and requested another send and explicitly starts a new submission. Restart retains
the draft but requires fresh CAPTCHA and manual Submit; duplicate claims/rate limits still
apply. Confirmed receipt ends the flow without another send. Opening the link, waiting, or
unknown receipt cannot unlock resend. This is a UI acknowledgement, not a server override
or proof of delivery; `retryable: false` still applies to the uncertain request.

### Questionnaire email-history privacy

Template and dedicated questionnaire sends share one server link-expansion path. An
explicit template send with `{{questionnaireLink}}` creates one new same-client invitation;
all occurrences use that invitation's URL only in transient dispatch content. Reject
literal application questionnaire URLs in template/message subject/body with 400 field
errors. Preview shows a placeholder. Store only token-redacted subject/body using
`[questionnaire link omitted]`, plus nullable `questionnaireInviteId` (null for ordinary
email). Owner history navigates to authenticated invitation detail by ID. Neither owner
responses nor stored history/backups/logs/test artifacts retain raw tokens. Do not recover
or reconstruct previously sent links; uncertainty/history-write failures retain the
invitation and require the existing manual reconciliation without blind resend.

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
| FR-023 | No inquiry-content table; sanitized `audit_events` and the backup-excluded two-minute content-hash guard |
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
| FR-034 | HTTPS (Workers Static Assets + API Worker), CSP/security headers on both static and fallback responses, secrets via `wrangler secret` |
| FR-035 | Atomic D1 application-window counters; optional short-window Rate Limiting binding (research R-09/R-16) |

## Gallery and questionnaire response invariants

- Gallery `altText` is descriptive, trimmed, 1–200 characters and never whitespace-only.
  All portfolio photographs are informative; the empty-alt exception for decorative
  non-gallery interface images does not apply to gallery uploads or metadata edits.
- Owner-authorized `QuestionnaireInvite` objects, including those returned within
  `ClientDetail.questionnaires`, include immutable `questionsSnapshot` and nullable
  `answers`. Render historical labels, types, choices and ordering from that snapshot,
  including after master questions are edited or deleted. Public link responses remain
  `QuestionnairePublic` and never expose owner history or another client's data.
- Client DELETE confirmation requires the live cascade and durable private deletion receipt
  described in data-model.md. Recovery copies expire within 30 days; restore-time receipt
  reconciliation must finish before any application access resumes (QR-002).
