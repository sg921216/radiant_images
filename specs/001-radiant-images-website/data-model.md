# Data Model: Radiant Images Photography Website

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Store**: Cloudflare D1 (SQLite) via Drizzle ORM; binary images in R2

Conventions: all ids are ULIDs (`TEXT`, 26 chars, sortable); timestamps are ISO-8601 UTC `TEXT`; booleans are `INTEGER` 0/1; money is `INTEGER` cents in USD. Every table has `created_at`, `updated_at`. Soft deletes are not used — deletions are hard and audited.

Enum `shoot_type`: `maternity | newborn | family`. Enum `gallery_tag`: `shoot_type ∪ general`.

**T001 checkpoint (2026-11-13)**: The corrections below are design requirements, not
implemented/verified behavior. Frontend hosting is resolved to Cloudflare Workers Static
Assets and the owner reports R2 enrollment complete. Strict recovery expiry and bounded
server image decoding remain open in research R-16. Its implementation follow-up records
verified quotas, the image-provider eligibility conflict and a proposed storage envelope.
That historical retention blocker is superseded by the owner-approved operational policy
below (2026-11-14). Production verification remains open. The separate local-development exception in
`feasibility-decision.md` was approved on 2026-11-13; production gates remain open.

---

## Public-content entities

### `gallery_images` (FR-005, FR-027)

| Field                            | Type    | Rules                                                                                                                                 |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| id                               | TEXT PK | ULID; also the R2 key prefix `images/{id}/{variant}.webp`                                                                             |
| tag                              | TEXT    | `gallery_tag`; required                                                                                                               |
| alt_text                         | TEXT    | required descriptive text, 1–200 chars after trimming; reject empty/whitespace-only values; all portfolio photographs are informative |
| sort_order                       | INTEGER | unique among images; renumbered on reorder                                                                                            |
| width / height                   | INTEGER | of `full` variant                                                                                                                     |
| original_mime                    | TEXT    | `image/jpeg \| image/png \| image/webp`                                                                                               |
| original_bytes                   | INTEGER | ≤ 10 485 760                                                                                                                          |
| original_width / original_height | INTEGER | derived from validated original bytes; each 1–16 384; product ≤ 40 000 000                                                            |
| created_at / updated_at          | TEXT    |                                                                                                                                       |

Invariants: `COUNT(*) ≤ 60` enforced in the insert transaction (FR-027). The private original
and variants `full`, `card`, `thumb` must all exist in R2 before the row is committed;
on any R2 failure the row is not written and staged objects are removed, with failed cleanup
recorded for idempotent reconciliation (FR-030). Originals use generated keys under
`originals/{id}/source`; only the three variants of a published row are publicly readable.

T001 upload correction: send the original binary, not just claimed original metadata.
Server validation derives MIME, byte length and dimensions from actual content and rejects
claims that disagree. Full/card/thumb WebP long edges are ≤ 2000/800/320 pixels, with byte
ceilings 2 MiB/1 MiB/256 KiB and at least one pixel per axis. Total multipart input is
bounded to 16 MiB. Original limits above are application design bounds, not evidence of
Worker decoding capacity. Reject malformed/animated input and verify orientation and
EXIF/GPS-free derivatives. Browser validation is early feedback only; the bounded server
decoder/transform path still needs the feasibility proof in research R-16 before implementation.
Do not equate header inspection or animation flattening with full decoding or animation
rejection. A complete 40-megapixel RGBA frame alone exceeds Workers' isolate memory budget;
the external-transform candidate must establish private-byte access, output safety and
the approved cost constraints. Keep staged/recovery objects in the total storage budget;
the 60-row publication limit does not bound storage churn.

Queries: home gallery = all ordered by `sort_order`; service page = `WHERE tag = :shootType` ordered.

### `banners` (FR-012–014)

| Field                   | Type      | Rules                                                   |
| ----------------------- | --------- | ------------------------------------------------------- |
| id                      | TEXT PK   |                                                         |
| message                 | TEXT      | 1–200 chars, plain text                                 |
| link_url                | TEXT NULL | optional `https://` URL                                 |
| starts_at               | TEXT      | ISO UTC; stored UTC, authored in `site_config.timezone` |
| ends_at                 | TEXT      | must be > `starts_at`                                   |
| created_at / updated_at | TEXT      |                                                         |

Eligibility (evaluated at request time): `starts_at ≤ now < ends_at`. If several eligible, pick `MAX(starts_at)`, tie-break newest `created_at`. Zero eligible → API returns `null` and SPA renders nothing (FR-013).

### `pricing_revisions` + `pricing_packages` + `pricing_publication` (FR-008–011)

`pricing_revisions`

| Field        | Type    | Rules                                                                                                  |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------ |
| id           | TEXT PK | the `revisionId` printed in PDF footer                                                                 |
| published_at | TEXT    | publication timestamp for display/audit only; timestamps may tie and never select the current revision |
| created_by   | TEXT    | owner email                                                                                            |

`pricing_packages`

| Field       | Type                        | Rules                                               |
| ----------- | --------------------------- | --------------------------------------------------- |
| id          | TEXT PK                     |                                                     |
| revision_id | TEXT FK → pricing_revisions |                                                     |
| shoot_type  | TEXT                        | `shoot_type`                                        |
| sort_order  | INTEGER                     | within (revision, shoot_type)                       |
| name        | TEXT                        | 1–60 chars                                          |
| price_cents | INTEGER                     | ≥ 0                                                 |
| description | TEXT                        | ≤ 500 chars                                         |
| inclusions  | TEXT                        | JSON array of strings, 1–15 items, each ≤ 120 chars |

`pricing_publication`: exactly one seeded row, `id INTEGER PRIMARY KEY CHECK(id = 1)`,
`current_revision_id TEXT NOT NULL REFERENCES pricing_revisions(id)`. This pointer is the
sole authority for the current revision; timestamps are not a selection mechanism.

Invariants: a revision must contain ≥ 1 package for **each** shoot type. Publication writes
a new immutable revision and its packages and replaces the singleton pointer in one atomic
`batch()`. Generate new package-row IDs for each revision. A failed write leaves the prior
pointer and published schedule intact. Concurrent publications serialize at the database;
the last committed pointer update wins, including when publication timestamps are equal.
Read the pointer, revision and packages in one consistent query/snapshot for both bootstrap
and `GET /pricing`. Each web/print/PDF render retains that complete revision. Earlier
revisions remain history and are not selected by public readers. Test simultaneous saves
with a frozen identical timestamp, complete package sets, rollback and eventual reader
agreement within the publication budget (SC-006/011).

### `faq_entries` (FR-004)

| Field      | Type    | Rules                                                     |
| ---------- | ------- | --------------------------------------------------------- |
| id         | TEXT PK |                                                           |
| question   | TEXT    | 1–200 chars                                               |
| answer     | TEXT    | 1–2000 chars, limited Markdown (paragraphs, lists, links) |
| sort_order | INTEGER |                                                           |

Seeded with the four mandatory topics (what to expect, what to wear, payment timing, deposits); owner-editable in Admin → Content (lightweight; no rich editor).

### `page_content` (FR-003, FR-004 About)

| Field        | Type    | Rules                                                                                                                |
| ------------ | ------- | -------------------------------------------------------------------------------------------------------------------- |
| page         | TEXT PK | `about \| maternity \| newborn \| family`                                                                            |
| intro_md     | TEXT    | ≤ 4000 chars Markdown                                                                                                |
| how_it_works | TEXT    | JSON array of `{title ≤ 80, body ≤ 600}` steps, 2–8 items; required for the three service pages, ignored for `about` |
| updated_at   | TEXT    |                                                                                                                      |

### `site_config` (FR-019, FR-028, FR-029) — single row, `id = 1`

| Field                | Type | Rules                                                                                                                                                                                   |
| -------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| inquiry_recipient    | TEXT | valid email; initial `tbd@gmail.com`                                                                                                                                                    |
| sender_address       | TEXT | valid email; must equal the Gmail account or one of its verified send-as aliases (validated against Gmail `sendAs` list on save)                                                        |
| public_contact_email | TEXT | required valid email, ≤ 254 chars; explicitly owner-approved for public display/recovery; independent of recipient/sender; local fixture `hello@example.invalid` is forbidden at launch |
| shoot_locations      | TEXT | JSON array of 1–20 strings, each 1–80 chars, unique                                                                                                                                     |
| referral_sources     | TEXT | JSON array of 1–20 strings; seeded `["Business Card","Word of Mouth","Social Media"]`                                                                                                   |
| timezone             | TEXT | IANA tz; default `America/New_York`                                                                                                                                                     |
| updated_at           | TEXT |                                                                                                                                                                                         |

Saves are all-or-nothing; validation failure leaves the row untouched (FR-029).
Only `public_contact_email` is exposed as `publicContactEmail`; never derive or expose the
private recipient/sender through public bootstrap. Changes use the 60-second publication
budget. The active contact form retains the loaded public address during an API outage.

---

## Inquiry (transient — FR-015–023)

**Not a table.** `InquirySubmission` is a Zod schema in `packages/shared`, validated identically in browser and Worker:

| Field               | Type    | Rules                                                                                    |
| ------------------- | ------- | ---------------------------------------------------------------------------------------- |
| firstName, lastName | string  | required, 1–80                                                                           |
| email               | string  | required, RFC-5322 practical regex, ≤ 254                                                |
| phone               | string  | optional; **required if** `contactMethod ∈ {call,text}`; 7–20 chars, digits/space/`+()-` |
| contactMethod       | enum    | `email \| call \| text`, required                                                        |
| postalCode          | string  | optional, 3–12 chars                                                                     |
| shootType           | enum    | `shoot_type`, required                                                                   |
| preferredDay        | date    | optional; `today ≤ d ≤ today + 18 months` in `site_config.timezone`                      |
| specialRequests     | string  | optional ≤ 2000                                                                          |
| sessionLengthHours  | integer | optional; 1–4                                                                            |
| numberOfPeople      | integer | optional; 1–12                                                                           |
| shootLocation       | string  | optional; must be in current `site_config.shoot_locations` (stale → reject)              |
| referralSource      | string  | optional; must be in current `site_config.referral_sources`                              |
| message             | string  | optional ≤ 2000                                                                          |
| turnstileToken      | string  | required; verified server-side before anything else                                      |

Processing order in Worker: rate-limit → Turnstile verify → schema validate → duplicate guard → Gmail send → audit → respond. Nothing is persisted except `inquiry_dedupe` and `audit_events`.

Definite non-delivery releases the duplicate claim; accepted or uncertain dispatch keeps
it until its original expiry. Uncertainty is not proof of failure and must not trigger
resend. Provider-accepted inquiries still return 202 if the primary audit write fails;
write a sanitized fallback operational event and raise the audit failure signal. Do not
persist inquiry payloads to repair audit failures. Error/UI semantics follow plan.md.

### `inquiry_dedupe` (FR-022)

| Field      | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| hash       | TEXT PK — SHA-256 of `lower(email) + "\n" + trim(message)` |
| expires_at | TEXT — now + 2 min; pruned by cron                         |

The hash is a short-lived operational guard, not an inquiry record. Exclude these rows
from backups and remove expired rows. Expiry does not authorize the UI to resend an
uncertain submission; manual verification remains necessary under FR-020.

### `rate_limit_windows` (FR-035; T001 correction)

| Field         | Type / rules                                                                          |
| ------------- | ------------------------------------------------------------------------------------- |
| group_name    | TEXT; inquiry, auth, questionnaire, or admin mutation policy                          |
| subject_hash  | TEXT; HMAC of trusted client IP, or owner session identity; never raw IP/bearer/token |
| window_start  | INTEGER; UTC epoch seconds, aligned to policy period                                  |
| request_count | INTEGER; positive and at most the configured limit                                    |
| expires_at    | INTEGER; window start + policy period                                                 |

Composite primary key: `(group_name, subject_hash, window_start)`. Use an atomic conditional
insert/increment to admit requests; denial cannot dispatch email or create auth state.
R-09 defines 600-second windows for inquiry/auth/questionnaire and 60 seconds for admin
mutations. These are fixed windows; test the boundary burst explicitly. Return 429 with
`Retry-After = max(1, ceil(expires_at - now))` on denial. Separate endpoint-group keys;
do not include questionnaire tokens or inquiry fields in keys. A trusted IP comes from
Cloudflare's request header in production; test fixtures provide explicit synthetic identities.
Use a server-secret HMAC key and keep rotation from resetting active windows.

Exclude counters from application backups and logs. Expired rows do not affect admission;
periodic cleanup must remove them promptly. Provider-managed D1 Time Travel can retain
historical operational hashes for its documented seven-day free-plan recovery window;
application-level backup exclusion cannot remove them from provider-managed history.
No raw inquiry payload, IP, bearer, or questionnaire token is introduced by these counters.

---

## Owner & security entities

### `sessions` (FR-024–026)

| Field               | Type        | Rules                                                                 |
| ------------------- | ----------- | --------------------------------------------------------------------- |
| id                  | TEXT PK     |                                                                       |
| token_hash          | TEXT UNIQUE | SHA-256 of the opaque bearer token                                    |
| owner_email         | TEXT        | must be on allow-list at creation **and** re-checked on every request |
| last_seen_at        | TEXT        | sliding; expired if `now − last_seen_at > 24 h`                       |
| absolute_expires_at | TEXT        | created + 7 days                                                      |
| created_at          | TEXT        |                                                                       |

### `oauth_states` — transient browser-bound PKCE state, `expires_at` = +10 min

### `exchange_codes` — verified identity grant, not a session reference

| Field       | Type    | Rules                                                                                                                |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| code_hash   | TEXT PK | SHA-256 of random 256-bit exchange code; raw code appears only transiently in the callback fragment/exchange request |
| owner_email | TEXT    | verified Google identity; allow-listed at callback and rechecked at redemption                                       |
| created_at  | TEXT    | callback time                                                                                                        |
| expires_at  | TEXT    | created + 60 seconds; valid only while now < expires_at                                                              |

The callback consumes valid OAuth state and stores this grant; no session/bearer token
exists yet. Redemption conditionally consumes exactly one unexpired grant and inserts a
new session with a freshly generated bearer-token hash in one transaction. No grant match
means no session insert; concurrent redemption has one winner. Return the raw bearer once,
only after commit, with `Cache-Control: no-store`. Session inactivity/absolute clocks start
at redemption. Rollback leaves both grant and session state unchanged. Invalid, expired or
used codes return 400; allow-list removal returns 403 and invalidates the grant. Never store
raw codes/bearers or put them in logs/backups. Lost post-commit responses require a new
Google sign-in; no token-recovery endpoint exists and unreachable sessions expire normally.

### `audit_events` (FR-032)

| Field                   | Type                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                      | TEXT PK                                                                                                                                              |
| at                      | TEXT                                                                                                                                                 |
| actor                   | TEXT — owner email, `visitor`, or `system`                                                                                                           |
| action                  | TEXT — e.g. `gallery.add`, `banner.update`, `config.update`, `pricing.publish`, `inquiry.sent`, `inquiry.failed`, `client.email_sent`, `auth.denied` |
| entity_type / entity_id | TEXT NULL                                                                                                                                            |
| outcome                 | TEXT — `ok \| error`                                                                                                                                 |
| request_id              | TEXT                                                                                                                                                 |
| detail                  | TEXT NULL — non-PII JSON (e.g. error code, counts); **never** message bodies or visitor contact data                                                 |

---

## Client workflow entities (FR-031, FR-031a–d)

### `clients`

| Field                   | Type      | Rules                                             |
| ----------------------- | --------- | ------------------------------------------------- |
| id                      | TEXT PK   |                                                   |
| first_name / last_name  | TEXT      | 1–80                                              |
| email                   | TEXT      | valid email; not unique (a parent may book twice) |
| phone                   | TEXT NULL |                                                   |
| shoot_type              | TEXT      | `shoot_type`                                      |
| session_date            | TEXT NULL | ISO date                                          |
| notes                   | TEXT      | ≤ 4000                                            |
| created_at / updated_at | TEXT      |                                                   |

Deleting a client cascades to `client_checklist_state`, `client_emails`, `questionnaire_invites`, `questionnaire_responses`.

### Client deletion and recovery lifecycle (QR-002)

Owner-approved operational policy (2026-11-14): R2 lifecycle deletion is asynchronous;
physical removal during outages has no unconditional day-30/day-31 guarantee. Application
backups/media recovery expire for restore at day 28 after creation and deletion begins then,
with a day-30 completion target. Retry failed cleanup on subsequent scheduled runs and
independently detect/alert missed runs, delayed removal and stale backups. The target and
possible delays must be disclosed. T001/T058 still require deployed evidence of these
controls; neither policy approval nor a cron expression alone closes the gate. Verify D1
provider-managed recovery separately and reject unsafe restore points under QR-002.

Live client records and their questionnaire/email/checklist data remain until owner deletion;
30-day invitation expiry closes access but does not itself delete retained owner responses.
The owner deletion cascade removes both submitted and expired invitation data. External
mailbox retention remains outside application deletion. Recovery-copy expiry never extends
live retention or permits deleted data to reappear after a restore.

- The live cascade is transactional. Confirm deletion only after both the cascade and a
  durable private deletion receipt exist. Retry/reconcile interrupted operations idempotently;
  never report successful deletion while either obligation is incomplete.
- Keep the deletion ledger outside the database restore set, as private R2 objects under
  `client-deletions/{clientId}.json`. Each receipt contains only `clientId` and `deletedAt`,
  with a day-31 removal target from deletion; do not copy names, addresses, answers, or email bodies.
  Storage keys are never reused for new clients. This ledger is recovery metadata, not a
  soft-deleted client profile, and is never exposed by public image/API routes.
- Private daily backups become ineligible for restore at day 28 of creation. Verify removal
  beginning at day 28 and target completion by day 30; delayed physical removal may retain
  deleted data longer during outages. New backups exclude already-deleted live data.
  Begin receipt cleanup at day 31 only after overdue recovery copies are verified absent;
  if that check or removal fails, preserve the required receipts, retry, alert the owner
  and keep unsafe restores blocked. Do not describe an unsuccessful delete as completed.
  Provider-managed recovery windows and restore eligibility must also be verified by T001;
  do not use provider recovery to bypass ledger reconciliation or expiry checks.
- Restore into an isolated environment. Before enabling any reads or sending email, load
  the independently retained deletion ledger and reapply each cascade to the restored data.
  Abort reopening if the ledger is unavailable/incomplete or any deletion cannot be applied.
  Do not overwrite this ledger with the older backup. Subsequent backups use the reconciled
  live database so restoration cannot reset the retention clock for deleted client data.
- Operations tests cover deletion followed by restoration of a pre-deletion backup, expired
  recovery-copy cleanup, receipt retention, interrupted deletion/retry, and refusal to reopen
  without the ledger. Delivered messages in external mailboxes are outside this cascade.

### `email_templates`

| Field      | Type    | Rules                                                                                                                                          |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| id         | TEXT PK |                                                                                                                                                |
| name       | TEXT    | 1–80, unique                                                                                                                                   |
| subject    | TEXT    | 1–200; placeholders allowed                                                                                                                    |
| body       | TEXT    | 1–10000 plain text/limited Markdown; placeholders `{{firstName}}`, `{{lastName}}`, `{{sessionDate}}`, `{{shootType}}`, `{{questionnaireLink}}` |
| sort_order | INTEGER |                                                                                                                                                |

Reject literal application questionnaire URLs in template subject/body and composed-message
input before persistence or dispatch; direct the owner to `{{questionnaireLink}}`. Preview
keeps a descriptive placeholder. A send containing that placeholder creates one new
same-client invitation and expands every occurrence server-side in transient dispatch data.

### `client_emails` (history)

| Field                   | Type                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| id                      | TEXT PK                                                                                                                                         |
| client_id               | TEXT FK                                                                                                                                         |
| template_id             | TEXT NULL FK (null if template later deleted)                                                                                                   |
| questionnaire_invite_id | TEXT NULL FK to `questionnaire_invites.id`; same client required; null for ordinary email                                                       |
| subject                 | TEXT — rendered subject with questionnaire links replaced by `[questionnaire link omitted]`                                                     |
| body                    | TEXT — rendered body with questionnaire links replaced by `[questionnaire link omitted]`; private client correspondence, never operational logs |
| gmail_message_id        | TEXT                                                                                                                                            |
| sent_at                 | TEXT                                                                                                                                            |

Build the stored subject/body from pre-link-expansion content, separately from the transient
MIME sent to Gmail. All occurrences are redacted. The associated invitation ID is safe for
owner-authorized history navigation; do not reconstruct a usable link from it. Serialize
the field as required nullable `questionnaireInviteId` in `ClientEmail`. D1, API history,
admin views and backups contain no raw questionnaire tokens. Raw tokens are handled only
transiently for dispatch/link verification and appear in delivered email; redact them from
logs and test artifacts. The email row and its invitation association are written together
after known acceptance; history failures follow the existing reconciliation rules below.

If Gmail acceptance is known but this history write fails, return `email_history_failed`
with `retryable: false`, emit a sanitized failure signal, and require manual mailbox/history
reconciliation; never resend merely to obtain a history row. If acceptance is unknown,
do not fabricate a successful `client_emails` row. Preserve any invitation that may have
been delivered; only definite non-delivery permits invalidating that send's invitation.

### `checklist_items` (master) and `client_checklist_state`

`checklist_items`: `id`, `label` (1–120), `sort_order`.
`client_checklist_state`: `client_id` FK, `item_id` FK, `completed_at` TEXT NULL; PK (`client_id`,`item_id`).

Master changes apply to all retained clients in one transaction. Adding a master item inserts
one state row with `completed_at = NULL` for every existing client in the same transaction.
Retained item IDs preserve each client's completion state through renaming, reordering, and
repeated saves; repeated saves never duplicate rows or reset progress. Removing a master item
deletes its per-client state rows. Any failure rolls back both master and state changes.
Creating a client initializes all current master items with `completed_at = NULL` in the
client-creation transaction (FR-031b).

### `questionnaire_questions`

| Field      | Type      | Rules                                                 |
| ---------- | --------- | ----------------------------------------------------- |
| id         | TEXT PK   |                                                       |
| prompt     | TEXT      | 1–300                                                 |
| kind       | TEXT      | `short_text \| long_text \| single_choice`            |
| options    | TEXT NULL | JSON array 2–10 strings, required iff `single_choice` |
| required   | INTEGER   |                                                       |
| sort_order | INTEGER   |                                                       |

### `questionnaire_invites` (FR-031c)

| Field              | Type        | Rules                                                                                                                                                                   |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                 | TEXT PK     |                                                                                                                                                                         |
| client_id          | TEXT FK     |                                                                                                                                                                         |
| token_hash         | TEXT UNIQUE | SHA-256 of 256-bit URL token; never persist the raw token, including in email history; raw link is delivered by email and handled transiently for dispatch/verification |
| questions_snapshot | TEXT        | JSON copy of questions at send time (so later edits don't orphan answers)                                                                                               |
| sent_at            | TEXT        |                                                                                                                                                                         |
| expires_at         | TEXT        | sent + 30 days                                                                                                                                                          |
| submitted_at       | TEXT NULL   | set once; further submissions rejected                                                                                                                                  |

State machine: `pending` (now < expires, no submission) → `submitted` | `expired`. Only `pending` accepts `POST`.

Owner-authorized `QuestionnaireInvite` responses MUST include `questionsSnapshot`, mapped
from `questions_snapshot`, and `answers` (null until submission). Each snapshot preserves
the original question ID, prompt, kind, options, required flag, and sort order. The client
detail/history UI pairs answers with this snapshot rather than joining the current question
master. Editing/deleting/reordering master questions cannot mutate sent snapshots. Public
link responses continue to use `QuestionnairePublic`; they do not expose owner history.

### `questionnaire_responses`

| Field        | Type                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| invite_id    | TEXT PK FK                                                               |
| answers      | TEXT — JSON `{questionId: value}` validated against `questions_snapshot` |
| submitted_at | TEXT                                                                     |

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

### Local implementation detail: recovery-ledger identity (2026-11-14)

`lifecycle_state` preserves `ledger_id` (random 128-bit hex identity), `initialized` (0/1),
and `restore_status` (0 live, 1 blocked, 2 verified but closed). Migrations 0002/0003 establish
this state. Client creation initializes the private R2 `client-deletion-ledger/head.json`
once; backups verify that identity. Restore never initializes a replacement ledger or
imports lifecycle state from a snapshot.

The head holds a generation, ID/time receipt entries and a resumable `retiring` list,
updated with ETag compare-and-swap. Individual receipts contain only client ID/deletion time.
Missing initialized heads, identity mismatches or missing indexed active receipts fail closed.
Reconciliation indexes valid orphan receipts left by an interrupted compare-and-swap, then
replays deletions. Retirement starts at day 31 only after overdue recovery copies have been
deleted and their absence verified. Interrupted retirement resumes safely.

Private snapshots contain an allowlisted 17-table D1 batch, version, creation/28-day expiry,
ledger identity/generation and SHA-256 checksum; transient credentials, dedupe/rate state and
lifecycle state are excluded. Capture/restore reject token-bearing email history. The local
implementation bounds snapshots at 16 MiB. Restore prunes deleted clients before atomic import,
reconciles the independent ledger again and remains closed until explicit reopen. Original
and variant recovery verifies all four media objects before reopening. These locally tested
controls do not establish T001's deployed operational-retention/alerting or production
capacity evidence. The owner-approved policy supersedes unconditional physical expiry.

Question master input permits 0–40 questions, with at least one required before an invitation
can be sent. Short-text answers allow up to 300 trimmed characters; long-text answers allow
up to 4000. Optional unanswered fields may be omitted. Choice answers must match a captured
option. The global 64 KiB JSON request limit still applies. These bounded validation details
are local implementation constraints, not changes to the question types or data lifecycle.
