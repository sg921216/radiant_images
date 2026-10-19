# Implementation Plan: Radiant Images Photography Website

**Branch**: `001-radiant-images-website` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-radiant-images-website/spec.md`

## Summary

Build a photography business website for Radiant Images with a public marketing site (home gallery, three service pages with "How It Works" + pricing sections, About, FAQ, Contact with CAPTCHA-protected inquiry form) and an owner admin area (gallery, banners, pricing packages, site config, clients, email templates, checklists, questionnaires) protected by Google sign-in with an owner allow-list.

Technical approach: a static React single-page app (Vite + React Router v7) deployed to **GitHub Pages**, backed by a **Cloudflare Worker** API (Hono) using **D1** (SQLite) for data and **R2** for images. Outgoing email is sent through the **Gmail API** as the owner's Gmail account; CAPTCHA is **Cloudflare Turnstile**; owner authentication is Google OpenID Connect with an opaque bearer-token session. The pricing PDF is rendered in the browser from the same published pricing revision that drives the on-page sections and print stylesheet. Everything runs on free tiers with no credit card required. Full reasoning in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x; Node.js 24 (local toolchain; CI pins Node 22 LTS minimum via `engines`); Cloudflare Workers runtime (workerd) for the API

**Primary Dependencies**:
- Web: React 19, React Router v7 (framework mode, `ssr: false`, prerendered public routes), Vite 6, Tailwind CSS 4, `@react-pdf/renderer` (pricing PDF), `@marsidev/react-turnstile`
- API: Hono 4, Drizzle ORM (D1 driver) + drizzle-kit migrations, Zod (shared validation), `arctic` (Google OAuth 2.0/OIDC client), `@oslojs/crypto` (tokens)
- Shared: `packages/shared` — Zod schemas and TypeScript types used by both web and API

**Storage**: Cloudflare D1 (SQLite) for all relational data; Cloudflare R2 for image originals and derived sizes; Cloudflare Workers Rate Limiting binding for abuse controls; no inquiry persistence (FR-023)

**Testing**: Vitest (unit, web + shared); `@cloudflare/vitest-pool-workers` (API integration against local D1/R2 via Miniflare); React Testing Library (components); Playwright (end-to-end against local stack); contract tests validate API responses against `contracts/openapi.yaml`

**Target Platform**: Public web — evergreen desktop & mobile browsers (current + previous major); static assets on GitHub Pages; API on Cloudflare's edge (`*.workers.dev`, custom domain later)

**Project Type**: Web application — static SPA frontend + serverless API backend, pnpm monorepo

**Performance Goals**: Public pages visually usable ≤ 3 s on a typical mobile connection (SC-004); owner changes visible publicly ≤ 60 s (SC-005, SC-007, SC-011); API p95 < 500 ms for reads; inquiry submit end-to-end < 5 s

**Constraints**: $0/month infrastructure (GitHub Pages free, Workers free tier 100k req/day, D1 free 5 GB, R2 free 10 GB + no egress fees, Gmail API consumer quota); no credit card on file; frontend and API on different origins (cross-origin auth); images ≤ 10 MB upload, 60 max; WCAG 2.1 AA; HTTPS only

**Scale/Scope**: 1 owner; ~1–5k visitors/month; ≤ 60 gallery images; ≤ 200 client records; ≤ 20 inquiries/day; ~12 public routes + ~10 admin routes; ~35 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled template — **no project principles have been ratified**. There are therefore no enforceable gates; this check **passes by default**.

Provisional self-imposed gates (to be confirmed by running `/speckit-constitution`):

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity: ≤ 3 deployable projects | PASS | `apps/web`, `apps/api`, plus `packages/shared` (library, not deployable) |
| Test-first for API contracts | PASS (planned) | Contract tests generated from `contracts/openapi.yaml` before endpoint implementation |
| No secrets in repo | PASS | All provider secrets via `wrangler secret`; `.dev.vars` git-ignored |
| Spec-driven: every FR traceable to an endpoint/route | PASS | Traceability table in `contracts/README.md` |

**Recommendation**: run `/speckit-constitution` before `/speckit-tasks` so real gates exist for future features.

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
├── web/                          # Vite + React Router v7 SPA → GitHub Pages
│   ├── app/
│   │   ├── routes/
│   │   │   ├── public/           # home, maternity, newborn, family, about, faq, contact, q.$token
│   │   │   └── admin/            # login, dashboard, gallery, banners, pricing, settings,
│   │   │                         #   clients, clients.$id, templates, checklist, questionnaire
│   │   ├── components/           # Header, Banner, Gallery, PricingSection, BookNow, forms…
│   │   ├── lib/                  # api client, auth session store, pdf renderer, print styles
│   │   ├── styles/               # tailwind theme (palette tokens), print.css
│   │   └── root.tsx
│   ├── public/                   # logo, favicon, 404.html (SPA fallback)
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
├── deploy-web.yml                # build web → GitHub Pages
└── deploy-api.yml                # d1 migrations apply → wrangler deploy
pnpm-workspace.yaml
```

**Structure Decision**: Web application layout with two deployables (`apps/web` → GitHub Pages, `apps/api` → Cloudflare Workers) plus one shared validation package so the contact-form and admin validation rules (FR-016/017) are defined once and enforced identically in the browser and on the server. Admin lives inside the same SPA (route-level code splitting) rather than a separate app, per the "one codebase" decision.

## Complexity Tracking

No constitution violations to justify. Two deliberate complexity choices worth recording:

| Choice | Why Needed | Simpler Alternative Rejected Because |
|--------|------------|-------------------------------------|
| Separate API origin (Workers) instead of all-static | GitHub Pages cannot run server logic required by FR-017/018/019/025 | Static-only cannot verify CAPTCHA, send email, or protect owner operations |
| Bearer-token session instead of cookies | Frontend (`github.io`) and API (`workers.dev`) are cross-site; Safari blocks third-party cookies | Cookie sessions would silently fail on Safari/iOS until a shared custom domain exists |

## Post-Design Constitution Re-check

Re-evaluated after Phase 1 (data-model, contracts, quickstart): still PASS by default; provisional gates unchanged. Deployable count remains 2. All 39 functional requirements map to at least one route/endpoint in `contracts/README.md`.
