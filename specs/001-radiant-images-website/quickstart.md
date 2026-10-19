# Quickstart: Validating Radiant Images End-to-End

This guide proves the feature works against the [spec](./spec.md) acceptance scenarios. It is a run/validation guide — implementation detail lives in `tasks.md` and the code.

## Prerequisites

- Node.js ≥ 22 (Node 24 verified), pnpm ≥ 10 (pnpm 12 verified) — install with `corepack enable && corepack prepare pnpm@latest --activate`
- Cloudflare account (free) with `wrangler` logged in: `pnpm dlx wrangler login`
- Google Cloud project with an OAuth 2.0 Web client (redirect URIs: `http://localhost:8787/auth/google/callback` and the production Worker URL). Consent screen **published to Production** (see [research R-07](./research.md#r-07-outgoing-email-fr-019-fr-028-fr-031ac)).
- Cloudflare Turnstile site: use the official test keys locally (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).

## One-time setup

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
pnpm lint && pnpm typecheck
pnpm test                 # vitest: shared schemas, web components, api integration (miniflare), contract tests vs contracts/openapi.yaml
pnpm e2e                  # playwright against the local stack; includes axe a11y scan of all public routes
```

All suites green = FR coverage per [contracts/README.md](./contracts/README.md#functional-requirement-traceability).

## Manual acceptance walkthrough

Each step cites the spec scenario it proves.

### Public site (User Stories 1, 2)

1. Open `http://localhost:5173/`. Header shows centered logo, Maternity/Newborn/Family left, About/Contact/FAQ right. — US1-AS1
2. Resize to 375 px: menu collapses to a toggle exposing all six links; gallery has no horizontal scroll. — US1-AS10, SC-004
3. Open `/newborn`: intro, "How It Works" steps, newborn-tagged gallery, **Pricing** section listing packages. — US1-AS2, US2-AS1
4. In the Pricing section click **Print** → print preview shows all three shoot types, no nav. Click **Download PDF** → PDF opens; footer shows revision id matching `GET /pricing`. — US2-AS2/3, SC-006
5. Click **Book Now** → lands on `/contact`. — US1-AS3, US2-AS5
6. Open `/faq`: entries for what to expect, what to wear, payment timing, deposits. — US1-AS4

### Inquiry (User Story 1)

7. On `/contact`, submit empty form → field errors on first/last name, email, contact method, shoot type; nothing sent. — US1-AS7
8. Choose contact method **Text**, leave phone blank, submit → phone error. — US1-AS8
9. Fill valid values, complete Turnstile, submit → "Your inquiry was sent" (not "booked"); email arrives at `inquiry_recipient` from `sender_address` with Reply-To = visitor. — US1-AS6, FR-019/020
10. Re-submit the identical form within 2 min → 409 duplicate message shown; no second email. — FR-022
11. Stop network to Gmail (set `GMAIL_REFRESH_TOKEN=invalid`, restart dev) and submit → retryable error, values preserved, no success text. — US1-AS9

### Owner sign-in (FR-024–026)

12. Visit `/admin` → "Sign in with Google". Sign in with a **non**-allow-listed account → `/admin/denied`; `GET /admin/gallery` with no token → 401. — SC-003
13. Sign in with the allow-listed account → dashboard; `GET /auth/session` returns email. Sign out → token invalid. — US6-AS1

### Gallery (User Story 3)

14. Admin → Gallery: upload a JPEG tagged **Newborn** with alt text → appears on `/` and `/newborn` within 60 s, not on `/maternity`. — US3-AS1, SC-005
15. Change tag to **General** → disappears from `/newborn`, remains on `/`. Delete → gone everywhere; R2 objects removed. — US3-AS2
16. Attempt a 12 MB upload → rejected; gallery unchanged. Upload until 60 → 61st rejected with `gallery_full`. — US3-AS3, Edge Cases

### Banner (User Story 4)

17. Create banner with window spanning now → appears beneath header on every public page. Set end in the past → gone within 60 s, no empty gap. — US4-AS1/2, SC-007
18. Create two overlapping banners → only the later-starting one shows. — US4-AS3

### Settings (User Story 5)

19. Change `inquiry_recipient` to a second mailbox → next inquiry arrives there. — US5-AS1
20. Add a shoot location → new `/contact` load shows it. Remove it while a form is open, submit → `stale_option` error prompting reselect. — US5-AS2/3
21. Save an invalid sender address (not the Gmail account/alias) → 400; previous config intact. — US5-AS4

### Pricing editor (FR-011)

22. Admin → Pricing: change a package price, publish → `/family` Pricing section, print, and PDF all show the new price and a new revision id within 60 s. — SC-011
23. Try to publish with zero Maternity packages → 400. — data-model invariant

### Client workflow (User Story 6)

24. Admin → Clients → New client. Send a template email → arrives at the client address from `sender_address`; appears in client history. — US6-AS2/3
25. Tick two checklist items → persist on reload; rename a master item → state retained; delete a master item → row disappears. — US6-AS4/5
26. Send questionnaire → client receives `/q/{token}` link; open it (incognito) → only that client's first name + questions visible; submit → answers visible in Admin. Re-open link → "closed". — US6-AS6/8, SC-012
27. Edit questionnaire questions → previously collected responses still render against their snapshot. — US6-AS7

### Observability (FR-032)

28. `pnpm dlx wrangler d1 execute radiant-images --local --command "select action,outcome from audit_events order by at desc limit 20"` → shows the actions from steps 9–26 with **no** visitor message bodies or emails.

## Deploy

```bash
# Secrets (once per environment)
cd apps/api && for s in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GMAIL_REFRESH_TOKEN TURNSTILE_SECRET OWNER_ALLOWLIST WEB_ORIGIN; do pnpm dlx wrangler secret put $s; done

# CI does this on push to main; manual equivalent:
pnpm --filter api run db:migrate:remote && pnpm --filter api run deploy
pnpm --filter web run build   # VITE_API_ORIGIN, VITE_TURNSTILE_SITE_KEY from GitHub Actions vars → actions/deploy-pages
```

Post-deploy smoke: repeat steps 1, 9, 13, 14 against the production URLs.
