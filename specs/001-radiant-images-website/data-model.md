# Data Model: Radiant Images Photography Website

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Store**: Cloudflare D1 (SQLite) via Drizzle ORM; binary images in R2

Conventions: all ids are ULIDs (`TEXT`, 26 chars, sortable); timestamps are ISO-8601 UTC `TEXT`; booleans are `INTEGER` 0/1; money is `INTEGER` cents in USD. Every table has `created_at`, `updated_at`. Soft deletes are not used — deletions are hard and audited.

Enum `shoot_type`: `maternity | newborn | family`. Enum `gallery_tag`: `shoot_type ∪ general`.

---

## Public-content entities

### `gallery_images` (FR-005, FR-027)

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | ULID; also the R2 key prefix `images/{id}/{variant}.webp` |
| tag | TEXT | `gallery_tag`; required |
| alt_text | TEXT | ≤ 200 chars; may be empty string (decorative) |
| sort_order | INTEGER | unique among images; renumbered on reorder |
| width / height | INTEGER | of `full` variant |
| original_mime | TEXT | `image/jpeg \| image/png \| image/webp` |
| original_bytes | INTEGER | ≤ 10 485 760 |
| created_at / updated_at | TEXT | |

Invariants: `COUNT(*) ≤ 60` enforced in the insert transaction (FR-027). Variants `full`, `card`, `thumb` must all exist in R2 before the row is committed; on any R2 failure the row is not written and uploaded objects are deleted (FR-030).

Queries: home gallery = all ordered by `sort_order`; service page = `WHERE tag = :shootType` ordered.

### `banners` (FR-012–014)

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| message | TEXT | 1–200 chars, plain text |
| link_url | TEXT NULL | optional `https://` URL |
| starts_at | TEXT | ISO UTC; stored UTC, authored in `site_config.timezone` |
| ends_at | TEXT | must be > `starts_at` |
| created_at / updated_at | TEXT | |

Eligibility (evaluated at request time): `starts_at ≤ now < ends_at`. If several eligible, pick `MAX(starts_at)`, tie-break newest `created_at`. Zero eligible → API returns `null` and SPA renders nothing (FR-013).

### `pricing_revisions` + `pricing_packages` (FR-008–011)

`pricing_revisions`

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | the `revisionId` printed in PDF footer |
| published_at | TEXT | set when owner publishes; exactly one row is "current" (`MAX(published_at)`) |
| created_by | TEXT | owner email |

`pricing_packages`

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| revision_id | TEXT FK → pricing_revisions | |
| shoot_type | TEXT | `shoot_type` |
| sort_order | INTEGER | within (revision, shoot_type) |
| name | TEXT | 1–60 chars |
| price_cents | INTEGER | ≥ 0 |
| description | TEXT | ≤ 500 chars |
| inclusions | TEXT | JSON array of strings, 1–15 items, each ≤ 120 chars |

Invariants: a revision must contain ≥ 1 package for **each** of the three shoot types before it can be published. Publishing writes a new revision + packages in one `batch()`; earlier revisions are retained (history) but never served. Web sections, print view, and PDF all read `GET /pricing` which returns the current revision only (SC-006, SC-011).

### `faq_entries` (FR-004)

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| question | TEXT | 1–200 chars |
| answer | TEXT | 1–2000 chars, limited Markdown (paragraphs, lists, links) |
| sort_order | INTEGER | |

Seeded with the four mandatory topics (what to expect, what to wear, payment timing, deposits); owner-editable in Admin → Content (lightweight; no rich editor).

### `page_content` (FR-003, FR-004 About)

| Field | Type | Rules |
|-------|------|-------|
| page | TEXT PK | `about \| maternity \| newborn \| family` |
| intro_md | TEXT | ≤ 4000 chars Markdown |
| how_it_works | TEXT | JSON array of `{title ≤ 80, body ≤ 600}` steps, 2–8 items; required for the three service pages, ignored for `about` |
| updated_at | TEXT | |

### `site_config` (FR-019, FR-028, FR-029) — single row, `id = 1`

| Field | Type | Rules |
|-------|------|-------|
| inquiry_recipient | TEXT | valid email; initial `tbd@gmail.com` |
| sender_address | TEXT | valid email; must equal the Gmail account or one of its verified send-as aliases (validated against Gmail `sendAs` list on save) |
| shoot_locations | TEXT | JSON array of 1–20 strings, each 1–80 chars, unique |
| referral_sources | TEXT | JSON array of 1–20 strings; seeded `["Business Card","Word of Mouth","Social Media"]` |
| timezone | TEXT | IANA tz; default `America/New_York` |
| updated_at | TEXT | |

Saves are all-or-nothing; validation failure leaves the row untouched (FR-029).

---

## Inquiry (transient — FR-015–023)

**Not a table.** `InquirySubmission` is a Zod schema in `packages/shared`, validated identically in browser and Worker:

| Field | Type | Rules |
|-------|------|-------|
| firstName, lastName | string | required, 1–80 |
| email | string | required, RFC-5322 practical regex, ≤ 254 |
| phone | string | optional; **required if** `contactMethod ∈ {call,text}`; 7–20 chars, digits/space/`+()-` |
| contactMethod | enum | `email \| call \| text`, required |
| postalCode | string | optional, 3–12 chars |
| shootType | enum | `shoot_type`, required |
| preferredDay | date | optional; `today ≤ d ≤ today + 18 months` in `site_config.timezone` |
| specialRequests | string | optional ≤ 2000 |
| sessionLengthHours | integer | optional; 1–4 |
| numberOfPeople | integer | optional; 1–12 |
| shootLocation | string | optional; must be in current `site_config.shoot_locations` (stale → reject) |
| referralSource | string | optional; must be in current `site_config.referral_sources` |
| message | string | optional ≤ 2000 |
| turnstileToken | string | required; verified server-side before anything else |

Processing order in Worker: rate-limit → Turnstile verify → schema validate → duplicate guard → Gmail send → audit → respond. Nothing is persisted except `inquiry_dedupe` and `audit_events`.

### `inquiry_dedupe` (FR-022)

| Field | Type |
|-------|------|
| hash | TEXT PK — SHA-256 of `lower(email) + "\n" + trim(message)` |
| expires_at | TEXT — now + 2 min; pruned by cron |

---

## Owner & security entities

### `sessions` (FR-024–026)

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| token_hash | TEXT UNIQUE | SHA-256 of the opaque bearer token |
| owner_email | TEXT | must be on allow-list at creation **and** re-checked on every request |
| last_seen_at | TEXT | sliding; expired if `now − last_seen_at > 24 h` |
| absolute_expires_at | TEXT | created + 7 days |
| created_at | TEXT | |

### `oauth_states` — transient PKCE state, `expires_at` = +10 min. `exchange_codes` — one-time code → session id, `expires_at` = +60 s, deleted on use.

### `audit_events` (FR-032)

| Field | Type |
|-------|------|
| id | TEXT PK |
| at | TEXT |
| actor | TEXT — owner email, `visitor`, or `system` |
| action | TEXT — e.g. `gallery.add`, `banner.update`, `config.update`, `pricing.publish`, `inquiry.sent`, `inquiry.failed`, `client.email_sent`, `auth.denied` |
| entity_type / entity_id | TEXT NULL |
| outcome | TEXT — `ok \| error` |
| request_id | TEXT |
| detail | TEXT NULL — non-PII JSON (e.g. error code, counts); **never** message bodies or visitor contact data |

---

## Client workflow entities (FR-031, FR-031a–d)

### `clients`

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| first_name / last_name | TEXT | 1–80 |
| email | TEXT | valid email; not unique (a parent may book twice) |
| phone | TEXT NULL | |
| shoot_type | TEXT | `shoot_type` |
| session_date | TEXT NULL | ISO date |
| notes | TEXT | ≤ 4000 |
| created_at / updated_at | TEXT | |

Deleting a client cascades to `client_checklist_state`, `client_emails`, `questionnaire_invites`, `questionnaire_responses`.

### `email_templates`

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| name | TEXT | 1–80, unique |
| subject | TEXT | 1–200; placeholders allowed |
| body | TEXT | 1–10000 plain text/limited Markdown; placeholders `{{firstName}}`, `{{lastName}}`, `{{sessionDate}}`, `{{shootType}}`, `{{questionnaireLink}}` |
| sort_order | INTEGER | |

### `client_emails` (history)

| Field | Type |
|-------|------|
| id | TEXT PK |
| client_id | TEXT FK |
| template_id | TEXT NULL FK (null if template later deleted) |
| subject | TEXT — as sent |
| body | TEXT — as sent (owner-authored content, not visitor PII) |
| gmail_message_id | TEXT |
| sent_at | TEXT |

### `checklist_items` (master) and `client_checklist_state`

`checklist_items`: `id`, `label` (1–120), `sort_order`.
`client_checklist_state`: `client_id` FK, `item_id` FK, `completed_at` TEXT NULL; PK (`client_id`,`item_id`). Removing a master item deletes its state rows; renaming preserves state (FR-031b).

### `questionnaire_questions`

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| prompt | TEXT | 1–300 |
| kind | TEXT | `short_text \| long_text \| single_choice` |
| options | TEXT NULL | JSON array 2–10 strings, required iff `single_choice` |
| required | INTEGER | |
| sort_order | INTEGER | |

### `questionnaire_invites` (FR-031c)

| Field | Type | Rules |
|-------|------|-------|
| id | TEXT PK | |
| client_id | TEXT FK | |
| token_hash | TEXT UNIQUE | SHA-256 of 256-bit URL token; raw token appears only in the emailed link `/q/{token}` |
| questions_snapshot | TEXT | JSON copy of questions at send time (so later edits don't orphan answers) |
| sent_at | TEXT | |
| expires_at | TEXT | sent + 30 days |
| submitted_at | TEXT NULL | set once; further submissions rejected |

State machine: `pending` (now < expires, no submission) → `submitted` | `expired`. Only `pending` accepts `POST`.

### `questionnaire_responses`

| Field | Type |
|-------|------|
| invite_id | TEXT PK FK |
| answers | TEXT — JSON `{questionId: value}` validated against `questions_snapshot` |
| submitted_at | TEXT |

---

## Relationships (summary)

```text
pricing_revisions 1──* pricing_packages
clients 1──* client_emails          *──1 email_templates (nullable)
clients 1──* client_checklist_state *──1 checklist_items
clients 1──* questionnaire_invites  1──1 questionnaire_responses
sessions *──(allow-list) owner email (secret, not a table)
gallery_images ──> R2 objects images/{id}/{full|card|thumb}.webp
```

## Validation ownership

All field rules above live once in `packages/shared/src/schemas/*.ts` (Zod) and are imported by both the SPA forms and the Worker's `validate()` middleware, guaranteeing FR-017's "server validates regardless of browser".
