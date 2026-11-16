# Phase 0 Research: Radiant Images Photography Website

## R-29: Committed storage guard under real pagination — 2026-11-16

**T001 advanced; remains open.** The owner committed R-28 as `c23c943`. A new private
rehearsal deploys that application source with real D1, Standard R2, Images and its four
production Durable Object classes. workers.dev and preview URLs are verified disabled;
Wrangler reports no deployment targets and the schedule list is empty. The local
service-binding proxy is not deployed. No real client data or email is used.

### Application and backup observations

Seeded **1,501 tiny synthetic recovery objects** (13,509 payload bytes) outside normal
recovery prefixes. This forces the admission guard to inventory unrelated keys and follow
real R2 pagination. The first application run overlaps seeding and is retained as a warm-up;
the second starts after all fixture objects are present. Both runs pass their four cases:
unauthorized upload refusal, PNG, a 10 MiB JPEG and a detailed 40-megapixel JPEG. Each valid
case verifies regenerated derivatives, metadata removal, private originals, publication,
deletion and the subsequent public 404. The post-seed upload latencies are 1,783 / 8,081 /
10,490 ms through the local proxy. No memory-peak or maximum-load claim is made.

After six successful uploads/deletions across the two runs, the recovery inventory holds
**1,531 objects / 36,707,167 payload bytes**, returned over two pages. A private diagnostic
DO then imports the unchanged production `createBackup` helper. It creates and verifies a
7,862-byte, 17-table snapshot against that inventory: 31 ms DO CPU / 2,737 ms wall time,
with 1 ms front CPU. This is manually invoked helper evidence, not production cron,
scheduled health or Gmail acceptance. The diagnostic entry point never enters application
source or the public deployment configuration.

The combined tail contains **92 records, all `ok`, with no recorded exceptions**:

| Execution | Samples | Maximum observed CPU |
| --- | ---: | ---: |
| Front Worker | 63 | 7 ms |
| GalleryMutations | 12 | 195 ms |
| BulkReads | 12 | 7 ms |
| JpegValidator | 4 | 1,300 ms |
| Diagnostic backup DO | 1 | 31 ms |

The front sample stays below the Workers Free 10-ms allowance; DO samples stay below
their 30-second allowance. The fixture exercises pagination at about 35 MiB of recovery
payload, not six GiB, twenty pages, provider failure or peak concurrent demand. R-28's
local refusal tests remain the evidence for exhausted/unavailable storage. Tail CPU and
wall time cannot substitute for account-wide request/duration metering.

### Account evidence and persistent monitor

At 20:53 UTC, account Workers analytics now includes November 16: 69 requests, zero errors
and zero client disconnects. This is a partial observation before this new rehearsal,
not the day's final total. DO invocation/periodic queries remain empty at 21:00 UTC while
the rehearsal namespaces still exist; SQL-storage aggregates also return no rows.

The owner reports the account Durable Objects Usage screen for **November 14–December
14** shows duration **0 GB-sec**, requests **0**, SQL/KV storage **0 B**, SQL rows read and
written **0**, and KV storage operations **0**. Record these as owner-attested displayed
values. They do not reconcile with direct execution logs and are not accepted as zero
operational consumption or proof of a daily Free allowance. The display period is monthly;
the cause of the missing metering remains unestablished. Do not request another Images
plan confirmation: that separate Free-plan question was resolved in R-28.

Cloudflare documents that DO Free limits reset at 00:00 UTC and exceeding a limit rejects
further operations of that type. Missing usage observations do not imply permission to
upgrade, disable controls or label available headroom measured. The documented cutoffs
and the unresolved observability discrepancy are separate facts.
[Durable Objects pricing and Free-limit behavior](https://developers.cloudflare.com/durable-objects/platform/pricing/).

GitHub API inspection confirms the recovery workflow is active but its enablement variable
is false/absent, its bucket variable is absent, and all three required repository secrets
are absent. No configuration was changed. A persistent recovery target, normal schedules,
independent monitoring and scheduled recipient proof remain T058/release prerequisites.

### Cleanup and acceptance boundary

Deleted all 1,533 disposable recovery objects, verified both buckets empty, stopped the
proxy/tail, and removed the Worker, all five associated DO namespaces, D1 and both buckets.
Provider inventory confirms zero Workers/databases/namespaces and the single pre-existing
bucket preserved. Removed the temporary local session/secrets and unsanitized tail.

Quality [run 43953953193](https://github.com/sg921216/radiant_images/actions/runs/43953953193)
**passes** for exact head `c23c9431b94a0221d06392725c948832e5f1585e`. Tested PR merge
`0f1eaf99649f897deb30e1b6a71491ee0d048724` has the identical tree. Formatting, lint, types,
dependency/privacy checks, **64 files / 290 tests**, builds and **163 browser/performance
checks across all five projects** pass. Twelve skips are the expected duplicate cells
for three once-per-run performance profiles; no functional case is quarantined. Browser
time is 18.4 minutes; the job completes 20:50:43–21:12:08 UTC with no warnings. Source
privacy scans 462 files and diagnostic privacy scans ten files, both with zero blocked.
This closes the changed-source CI gate, including the earlier workflow-runtime and
navigation-focus changes. The new R-29 evidence-only edits are outside that tested tree.
[Exact-head CI evidence](./evidence/github-ci-r29-20261116.json).

Evidence: [post-seed application checks](./evidence/cloudflare-gallery-rehearsal-paginated-storage-20261116.json),
[warm-up checks](./evidence/cloudflare-gallery-rehearsal-storage-admission-20261116.json),
[source hashes, tail, account/dashboard observations and verified cleanup](./evidence/cloudflare-t001-r29-20261116.json).
No tracked application behavior changed during R-29. **T001/T058/T060/T063 remain open;
55/64 tasks complete, nine open.**

## R-28: Daily usage evidence and storage admission — 2026-11-16

**T001 advanced; remains open.** The owner explicitly confirmed: “My account page
shows Free.” This resolves R-27's Images plan ambiguity as owner-attested dashboard
evidence. The documented Free plan includes 5,000 unique transformations per calendar
month and rejects new transformations beyond that allowance. Both Free and Paid include
5,000; the allowance alone would not have established the account plan. No subscription
was changed. The account's two Images analytics values of 49 are cumulative snapshots,
not 98 transformations. [Images pricing](https://developers.cloudflare.com/images/pricing/).

Existing operational OAuth can query GraphQL analytics. Requested UTC dates November
14–16, daily groups, limit 10,000, without filtering to a particular Worker or D1 database:

| UTC date | Workers requests | D1 rows read | D1 rows written |
| --- | ---: | ---: | ---: |
| November 14 | 715 | 1,234 | 698 |
| November 15 | 1,890 | 94,023 | 2,511 |

The largest observations are 1.89% of Workers' 100,000/day, 1.88% of D1's five million
reads/day and 2.511% of its 100,000 writes/day. They describe these rehearsal days, not
future peak demand. Workers reports zero errors but 48/396 client disconnects; do not
claim every request completed. No November 16 row was returned at collection time.
Adaptive operational analytics are not an exact billing ledger.
[Workers metrics](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/),
[D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/),
[analytics limits](https://developers.cloudflare.com/analytics/graphql-api/).

Both DO invocation and periodic aggregate datasets return no rows for the same dates.
A separate SQL aggregate also returns none. Dataset settings report enabled, 90-day
lookback, 32-day query range and a 10,000-row limit, so the gap is not explained by a
24-hour retention allowance. R-20/R-21 retained provider metrics and the new live probe
below prove execution; empty current queries are not zero usage. Root cause remains
unestablished. [Account observations and limits](./evidence/cloudflare-account-capacity-20261116.json).

### Storage-control defect and fix

R-24 limits upload churn, and the independent monitor alerts on recovery storage, but
neither stopped uploads/new backups when delayed cleanup accumulated actual objects.
New regression tests first demonstrate valid uploads returning 201 under exhausted or
unreadable inventory and backup creation succeeding with six GiB already observed.

`requireStorageCapacity` now streams inventory metadata from both MEDIA and RECOVERY,
including all staged, orphaned and recovery objects. Before image-provider processing,
require current bytes plus the original and maximum regenerated variants to fit within
**6 GiB minus 32 MiB headroom**. Backup creation checks with its 16 MiB maximum before
exporting tables. Inventory is bounded to 1,000 objects/page and 20 pages/bucket; each
list has an eight-second deadline, with 30 seconds overall. Unverifiable sizes, broken
pagination, unavailable inventory, or insufficient room fail closed. Upload refusal is
HTTP 503 `storage_capacity_unavailable`; backup refusal fails the scheduled job.

Tests prove pagination, combined bucket accounting, refusal before Images calls/no
publication, recovery after cleanup, no new backup at capacity, and continued public
reads/photo deletion during pressure. The earlier rolling upload reservation still
counts a later capacity refusal. This is an admission threshold, not an atomic storage
reservation or an account cap: concurrent operations, preserved deletion receipts,
necessary recovery writes and unrelated buckets remain operational considerations.
The 32 MiB reserve reduces overlap exposure; it does not prove a maximum invoice.

### Validation and scoped provider evidence

`pnpm check` passes formatting, lint, types, **64 files / 290 tests** and both builds.
The Chromium desktop gallery suite passes **2/2**, with no retry, covering the full
upload/edit/reorder/delete journey plus 60-image filtering/responsive layouts. Other
browser projects were not rerun for this backend-only change; eventual-commit CI remains
required.

A disposable private Worker imported the production capacity helper and invoked it
inside a SQLite DO against two empty real Standard R2 buckets. **34/34 checks pass**:
24 initial requests plus ten while tailing. The twenty tail records cover ten front
and ten DO executions, all `ok`; front CPU is 0 ms at provider resolution, DO CPU 1 ms,
and DO wall time 110–200 ms. This narrow probe includes a synthetic invocation counter;
it is not a full application capacity rehearsal, absolute peak or large-bucket test.
No Images or email calls were made and no R2 objects were written. Fresh DO aggregate
queries still returned no rows before deletion, with ingestion delay not ruled out.

workers.dev and preview URLs were verified disabled; only a local service-binding proxy
invoked the probe. The Worker, DO namespace and both buckets were deleted and absence
verified. The pre-existing R2 bucket remains. No persistent deployment exists.
[Guard source hashes, red/green checks, probe/tail and cleanup evidence](./evidence/cloudflare-storage-admission-20261116.json).

**Remaining gates:** DO aggregate metering is unavailable; T058 still needs the
persistent recovery target, production schedules, independent monitoring and scheduled
recipient proof. The changed application source needs its eventual-commit CI/release
acceptance. Preserve the accepted R-23 private restore/retry/manual-notification proof
and R-25 sampled CPU results without extending them to unmeasured production demand.
T001/T058/T060/T063 remain unchecked; **55/64 tasks complete, 9 open**.

## R-27: Billing Read verified and account evidence — 2026-11-16

**T064 is complete.** The owner-created account token verifies as active, expiring
2026-11-24 04:59:59 UTC. The separate token-backed MCP configuration exists, but this
host did not expose that connection or inherit the newly saved environment variable.
Used T064's approved read-only REST fallback with the secret loaded from the Windows
User environment into a scoped child process. No secret is retained in repository
evidence. Verification proves target-account access; it does not independently attest
every token-policy permission. The operational OAuth connection remains unchanged.

Subscriptions, explicit-period billing usage, spend policies and billing history all
return HTTP 200. Two subscriptions report `R2 Paid` and `Images Stream Basic`, each
with `state: Paid`, base price USD 0 and current period November 14–December 14.
Their component values describe subscription settings, not measured consumption.
No Workers paid subscription is returned. Workers' `standard` usage-model setting
does not by itself establish a paid subscription.

The generic usage request explicitly spans `2026-11-14T02:45:48Z` through
`2026-11-16T20:12:26Z`, daily aggregation, limit 10,000. Its actual response differs
from the OpenAPI array: zero rows, null data and empty totals, with the echoed end
rounded to `2026-11-16T23:59:59Z`. Missing data is **not zero usage**. Supplemented
with the account billable-usage v1 alpha API: coverage is true; the billing period
starts November 14 00:00 UTC, and the explicit November 14–16 query returns seven
records covering November 14–15 (latest exclusive end November 16 00:00 UTC).

| Returned metric | Recorded consumption | Included monthly allowance | Reported charge |
| --- | ---: | ---: | ---: |
| R2 Standard storage | 0.0040398683 GB-month | 10 GB-month | $0 |
| R2 Class A operations | 831 | 1,000,000 | $0 |
| R2 Class B operations | 850 | 10,000,000 | $0 |
| Images transformations | 49 | 5,000 | $0 |

These are account totals for the returned records, including earlier rehearsals;
they are not current storage size, today's full usage or a final invoice. Billing
history is empty. Restricted billable-usage v2 returns HTTP 403/code 1171. Historical
daily Workers, D1 and DO totals are absent from these billing reads and remain a gap.
[R2 allowances](https://developers.cloudflare.com/r2/pricing/),
[Images pricing](https://developers.cloudflare.com/images/pricing/).

The spend-policy list succeeds and is empty. Separate OAuth reads confirm the
existing **$1 and $10 account budget warnings**, both enabled with one email recipient;
recipient details are omitted. Current spend-management documentation supports
Workers and Durable Objects separately, excludes R2/Images from those controls,
and does not guarantee an invoice ceiling even when a limit is enabled. No limit,
subscription, recipient or billing setting was changed.
[Spending controls](https://developers.cloudflare.com/billing/manage/spend-management/).

Rechecked documented Free allowances: Workers 100,000 requests/day and 10-ms HTTP CPU;
D1 five million rows read/day, 100,000 written/day and 5 GB; SQLite DO 100,000
requests/day and 13,000 GB-s/day. These are planning limits, not measured remaining
account headroom. R2's included tier applies only to Standard storage; Infrequent
Access is enabled on this account but has no included free tier.
[Workers/D1 pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

**T001 remains open.** Images and transformations are enabled, with zero hosted-image
storage allowance. The returned subscription does not verify the earlier owner-reported
Images Free cutoff. Reconcile that account plan before assuming new transformations
will stop at 5,000; the documented paid alternative charges $0.50/1,000 beyond the
included amount. R-24's application upload/retention limits still apply, but are not
an account-wide cap. Current inventory is zero Workers, zero D1 databases, zero DO
namespaces and one preserved R2 bucket. T058 has no persistent application to monitor;
T060/T063 retain their release prerequisites. No infrastructure or token policy changed.

[Sanitized API evidence, windows, allowances and limitations](./evidence/cloudflare-billing-read-20261116.json).
The register is now **55/64 complete, 9 open**. Temporary access can be revoked after
remaining billing verification; token revocation was not performed with this read-only credential.

## R-26: Account-scoped Billing Read follow-up — 2026-11-16

Historical pre-connection checkpoint; superseded by verified R-27 above.

The owner requested a separate Billing Read connection to complete the account evidence
needed by T001 and dependent operational/release work. Live subscription and billing-usage
GETs return 403 with the existing OAuth connection; these endpoints require an API token
with Billing Read. Spend-policy GET also returns 403, and its current API schema does not
declare accepted permissions. Reconnecting the same OAuth scopes is not a resolution.

T064 records the concrete follow-up. Limit its token to Account > Billing > Read and the
Radiant Images account, with a finite expiry; no Billing Edit or deployment authority is
needed. Cloudflare documents account-owned token support for Billing and bearer API-token
support on its official API MCP server. The connection must be verified before claiming
access or task completion. No token was created in this session.
[Billing permissions](https://developers.cloudflare.com/billing/understand/billing-permissions/),
[account token support](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/),
[API MCP authentication](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/).

Read subscriptions and an explicit billing-period usage window; the generic usage API's
default is only six hours and limited results can truncate without error. Its metric list
is not comprehensive for R2, D1 and Durable Objects, so retain gaps or supplement through
appropriate authorized read-only sources. Record only sanitized plan/allowance/usage/control
facts. A successful Billing Read connection does not establish an enforced spend cap,
zero cost, persistent monitoring or release acceptance. The existing $1/$10 budget warnings
remain unchanged; no upgrade or billing-write permission is selected.

## R-25: HTTP read CPU and bounded admission — 2026-11-15

The private production-code baseline reproduced a 14-ms first gallery request with
60 synthetic gallery records and 200 clients. Replacing Hono's default SmartRouter with
its incremental TrieRouter reduced the first gallery sample to 8 ms, but separate fresh
deployments still used 16 ms for public bootstrap and 15 ms for the client list. Routing
alone did not resolve the Free Worker's 10-ms budget. Hono documents the router choices
and configurable router constructor; the installed SmartRouter implementation builds
its optimized matcher on the first match.
[Hono routers](https://hono.dev/docs/concepts/routers),
[Hono constructor](https://hono.dev/docs/api/hono).

Keep TrieRouter and delegate just GET/HEAD for `/public/bootstrap`, `/admin/gallery`
and `/admin/clients` to separate `BulkReads` Durable Object instances. Each coordinates
eight active requests, rejects excess work with 503/Retry-After, and releases admission
on success or failure. This adds bounded coordination for the measured bulk operations;
other API routes retain their execution paths. The front Worker preserves restore/owner
checks and streams the response. The object repeats those checks and queries D1 on every
read. No content, session or authorization cache can delay an owner removal or recovery
gate. Updated bindings, generated types, release/rehearsal configuration and the three
503 contracts travel with the code.

The final eight-slot version passed 100 measured reads per delegated operation at
concurrency five, after ten warm-ups each. Every complete body was received successfully
and validated against its contract. Nearest-rank p95 through the local binding proxy to
the private deployed Worker was 349 ms (bootstrap), 369 ms (gallery) and 385 ms (clients).
These are network-inclusive supplemental measurements, not the prescribed isolated
loopback performance fixture. Raw timings and sampled CPU, including cold probes, are
in [the sanitized R-25 record](./evidence/cloudflare-api-cpu-remediation.json).

This change moves CPU rather than eliminating it. Cloudflare documents 10 ms CPU for
Free Workers and 30 seconds per DO invocation. DO requests and duration, including I/O
waits, count toward their own allowances; repeated front/object auth and restore checks
also add D1 work. The final latency cohort's sampled DO wall time peaked at 282 ms;
5,000 non-overlapping reads at that observed duration and 128 MB would be about 181 GB-s.
That is a workload estimate, not measured daily billing or a worst-case cap. The
13,000 GB-s/day Free allowance is shared with other objects and applications; request,
D1, storage and other account limits still apply.
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/),
[DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

Two production CPU-profile requests during healthy private traffic returned 404/code
10393, "No recent executions were found for this Worker." No function-level profile
was obtained; the diagnosis uses source inspection and controlled deploy/tail comparisons.
Tail records are partial observations, not an exhaustive invocation census. Some front
records say `canceled` despite status 200 and successfully consumed/validated bodies;
the cause is unestablished and no zero-cancellation claim is made. No CPU-limit outcome
or exception was captured in the final cohort. The private ingress remained disabled
throughout. T001 stays open for account-wide usage/plan evidence and wider capacity;
T058 still needs a persistent monitor target and scheduled operation/recipient proof.

## R-24: Scheduled CPU remediation and upload usage controls — 2026-11-14

The R-23 cron baseline used 32/34/30/43 ms in the ordinary Free Worker. Scheduled
dispatch now awaits a private SQLite-backed `ScheduledOperations` Durable Object, which
serializes the two schedules over the single recovery ledger. At most two jobs are
outstanding; unknown schedules and excess queueing fail explicitly. A failed operation
does not poison the next invocation. The existing private R2 records preserve last
completion, failure and stale-work monitoring across restarts.

Three actual accelerated Cloudflare cron invocations on version
`57cfe04e-f0c3-401c-aaab-19fac45b88bb` completed with **0/0/0 ms** front-Worker CPU at
provider resolution and **30/28/18 ms** coordinator CPU. Front wall times were
14,456/13,115/13,043 ms. The independent binding observer reported healthy with no issues.
This establishes headroom for the sampled synthetic recovery workload, not zero CPU,
worst-case backup sizing, general HTTP CPU or live Gmail acceptance. The source hashes,
private-ingress checks and verified teardown are in
[the sanitized CPU record](./evidence/cloudflare-cpu-remediation.json).

Cloudflare documents [10 ms Free Worker CPU](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)
and [30 seconds per Durable Object invocation](https://developers.cloudflare.com/durable-objects/platform/limits/).
DO duration includes waiting for I/O; the sample's ~13–14 seconds is not its CPU cost.
At 128 MB allocated, 289 invocations/day of the sampled daily workload would use roughly
520 GB-s/day, before other DO work, versus the documented 13,000 GB-s/day Free allowance.
This conservative extrapolation is not an account-wide usage measurement.
[DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

The portfolio coordinator now persists at most **300 owner-authorized upload attempts
per rolling 30 days**, charging failures after admission and returning 429 plus
Retry-After at exhaustion. Authentication/byte-limit rejections precede reservation.
Reads and deletion are unaffected. Local real-DO tests verify
the final admitted attempt, refusal, unauthorized access and expiry. This closes the
unbounded upload/delete churn path left by the 60-current-image cap. At the existing
13.25-MiB maximum per upload, 300 recovery copies plus 60 live images and 28 maximum
16-MiB backups total about 5.10 GiB, excluding receipts, overhead, delayed cleanup and
other account resources. A 31-day calendar month can contain two boundary bursts, up to
600 admitted uploads / 3,600 transformation calls. Neither calculation guarantees $0.

Account controls inspected: only the existing $10 budget warning was installed. Added
and re-read an enabled **$1 account-wide budget warning** using its existing recipient;
the $10 warning remains. No notification test, subscription change or paid upgrade was
performed. Budget warnings notify without stopping usage. Current spending limits cover
Workers and Durable Objects, exclude R2, and explicitly do not guarantee the invoice.
Both subscription and spend-policy reads return 403 for the current OAuth connection.
[Budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/),
[spending limits](https://developers.cloudflare.com/billing/manage/spend-management/).

T001 remains open for general API CPU headroom and account-wide usage evidence. T058
remains open for the persistent deployment, bucket-scoped read credentials, schedule and
recipient routing. All temporary Worker/DO/D1/R2 resources were removed and their absence
verified; the account budget warning is the only persistent provider change.

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-17

**Constitution reconciliation (2026-11-13)**: React + Cloudflare Workers is confirmed.
Constitution v1.0.0 adds mandatory TDD, deterministic E2E, WCAG 2.2 AA, media/data privacy,
SEO/performance budgets, and release evidence. Historical provider/version/quota claims
below require T001 verification; they are not revalidated by this governance update.
T001 also resolves image pixel bounds and verifies provider support for the client deletion
and recovery policy in spec.md QR-002/data-model.md before dependent work. Current test and
quality rules are specified in plan.md and quickstart.md.

Current design decisions are recorded below. The owner selected **Cloudflare Workers
Static Assets** for the frontend and has set up R2. The **Cloudflare Workers** backend and
email via **Rebekah's Gmail** remain selected, targeting $0 usage within included allowances.
Open technical feasibility and governance obligations are tracked in T001 and plan.md.

**T001 checkpoint (2026-11-13): BLOCKED.** Hosting selection and R2 enrollment are resolved.
The follow-up below verifies usage allowances, cost-control limitations and a dependency
resolution candidate. Strict recovery expiry and production image-decoder feasibility remain
unresolved. See [the approved local-development exception](./feasibility-decision.md).
R-16 supersedes
historical feasibility claims where noted. No additional hosting confirmation is required.

**Current owner decisions (2026-11-14)**: R-17 records approval of operational retention
and the existing paid Pixieset Client Gallery account for client delivery only. Website
portfolio processing remains on the selected Cloudflare stack. The unconditional retention
guarantee is superseded; production image validation and operational monitoring/alert
evidence remain open. Earlier checkpoints describe their date's requirements and evidence.

---

## R-01 Frontend framework & hosting

**Decision (owner clarification, 2026-11-13)**: React 19 + TypeScript on a supported Vite
version pinned by T002, using **React Router v7 framework mode** with `ssr: false`. Public
routes remain prerendered; admin/questionnaire routes remain client-rendered. Deploy the
frontend to **Cloudflare Workers Static Assets** using GitHub Actions and pinned Wrangler.
Keep a separate API Worker and existing bearer-session/CORS behavior. Frontend basename is `/`.

**Rationale**: Implements the owner's explicit host selection while preserving crawlable
marketing pages and the existing app boundaries. Asset routing must serve React Router's
generated SPA fallback for client routes. Because Home is prerendered, that file is
`__spa-fallback.html`; blindly enabling an `index.html` fallback would use Home's document.
T060 verifies public HTML, direct admin/callback/questionnaire navigation, refreshes and
real 404s for missing assets. The frontend Worker only handles asset/fallback responses.
Sources: [React Router prerendering](https://reactrouter.com/how-to/pre-rendering),
[Workers routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/),
[SPA mode](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

Use `public/_headers` for static security headers and attach equivalent headers to Worker
fallback responses, including private-route noindex and no-referrer protection for tokenized
links. `_headers` does not apply to Worker-generated responses. Source:
[Workers asset headers](https://developers.cloudflare.com/workers/static-assets/headers/).

**Alternatives considered**:

- _Next.js App Router_ — needs a Node/edge server or `output: 'export'`, which disables most of what makes Next attractive; not Vite.
- _Astro + React islands_ — excellent for static content, but the admin SPA would be a second mental model; build-time image optimization doesn't help owner-uploaded runtime images.
- _GitHub Pages_ — previous host selection, superseded by the owner's explicit Workers
  Static Assets instruction. GitHub remains the repository/CI service.

## R-02 Backend runtime & framework

**Decision**: **Cloudflare Workers** (free tier) with **Hono 4** as the HTTP framework.

**Rationale**: Free tier (100k requests/day, no card required) comfortably covers 1–5k visitors/month. Hono is tiny, typed, Workers-native, has built-in CORS/validator middleware, and integrates with Zod for shared schemas.

**Alternatives considered**: itty-router (less middleware), raw `fetch` handler (more boilerplate), Google Cloud Run (option B — needs billing account), Google Apps Script (option A — Sheets/Drive limits break SC-005 and image reliability).

## R-03 Database

**Decision**: **Cloudflare D1** (SQLite) accessed through **Drizzle ORM** with `drizzle-kit` SQL migrations committed to the repo and applied in CI via `wrangler d1 migrations apply`.

**Rationale**: Free (5 GB, 5M reads/day), zero ops, same vendor as the Worker so no connection management. Data volume is tiny (hundreds of rows). D1 supports `batch()` for atomic multi-statement writes, satisfying FR-030 (no partial publish).

**Alternatives considered**: Neon Postgres (free tier, but a second vendor and connection pooling from Workers adds latency), Turso (similar to D1, extra vendor), KV (no relational queries).

## R-04 Image storage & delivery

**Decision, corrected by T001**: Images stored in the owner's configured **Cloudflare R2**
account, subject to R-16's usage-budget verification. The admin SPA prepares WebP
`full`/`card`/`thumb` variants at 2000/800/320px maximum
long edges and uploads them together with the private original. The Worker independently
validates actual binary content, dimensions and metadata under contract 0.2.0, then stages
all four objects before publishing. Only published variants are served at
`GET /images/{id}/{variant}` with `Cache-Control: public, max-age=31536000, immutable`.
The bounded server decoding/transform implementation is still an OPEN R-16 proof; browser
conversion alone cannot establish safety or recovery.

**Rationale**: Browser preparation reduces upload work, but the historical claim that it
alone makes secure zero-cost processing feasible is withdrawn pending R-16. Serving
published variants through the Worker keeps originals/private prefixes inaccessible and
URLs stable. Client caching reduces repeat requests; it does not remove cold-load quotas.

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
3. If allowed, Worker stores only a 60-second identity grant in `exchange_codes` (SHA-256 hash of a random 256-bit one-time code, verified owner email, creation/expiry times), consumes the browser-bound OAuth state, and redirects to `<WEB_ORIGIN>/admin/callback#code=<one-time-exchange-code>`, where WEB_ORIGIN is the configured HTTPS frontend origin on Workers Static Assets. No session/bearer exists at callback time.
4. SPA immediately removes the fragment and submits the code once to `POST /auth/exchange`. Worker rechecks the allow-list and atomically consumes the unexpired grant and creates one session storing only the hash of a newly generated 256-bit bearer. Return the raw bearer after commit with `Cache-Control: no-store`; the SPA stores it in `sessionStorage` and sends `Authorization: Bearer <token>` on admin calls. Session clocks start at redemption (24 h sliding inactivity, seven-day absolute cap).
5. `POST /auth/logout` deletes the session. Non-allow-listed emails get a 403 page and no session.

Concurrent exchanges have one winner; invalid/expired/replayed codes return 400 and an
owner removed between callback and exchange gets 403 with grant invalidation. Failed
transactions leave no session and preserve the grant. A lost post-commit response requires
a fresh Google sign-in, not code replay or raw-token recovery; the unreachable session
expires normally. Raw codes and bearer tokens never enter server persistence, logs or
backups. These are explicit T010/T011/T012 acceptance cases.

**Rationale**: Retain the existing token handoff when moving the frontend host. Frontend and
API still have separate configured origins; bearer authentication avoids a new dependency
on cross-origin cookie behavior. The one-time exchange and sessionStorage token rules remain
unchanged. Owner authorization is enforced by `requireOwner` on every admin operation.

**Hardening**: strict CSP on the SPA (only self + Turnstile + API origin), no third-party scripts in admin, token hashed in D1, rate-limited auth endpoints.

**Alternatives considered**: Auth.js (designed around cookies/Next; heavy on Workers), Cloudflare Access (free for ≤ 50 users but gates the whole origin and requires a custom domain), HttpOnly `SameSite=None` cookie (Safari ITP failure mode), Firebase Auth (extra vendor).

**Future**: A same-origin or HttpOnly-cookie migration requires a separate authentication
design and test review; it is not part of this frontend hosting change.

## R-07 Outgoing email (FR-019, FR-028, FR-031a/c)

**Decision (scope correction, T001)**: **Gmail API** (`users.messages.send`) called from the Worker using a stored OAuth 2.0 **refresh token** for Rebekah's Google account with both `https://www.googleapis.com/auth/gmail.send` and `https://www.googleapis.com/auth/gmail.settings.basic`. Sending permission alone cannot list send-as identities. The `From` header is the owner-configured sender address (must be the authenticated Gmail account or one of its verified "Send mail as" aliases — the Worker validates this on save). Inquiry notifications set `Reply-To` to the visitor's email; client emails set `Reply-To` to the sender address. See R-16 for consent and verification limits.

**Setup (one-time, documented in quickstart)**: create a Google Cloud project; configure the OAuth consent screen as _External_ and **publish it to Production** (unverified-app warning is shown only to Rebekah during the single consent); run `scripts/gmail-consent.ts` locally to obtain the refresh token; store as `GMAIL_REFRESH_TOKEN` secret. The same OAuth client is reused for owner sign-in (R-06).

**Known risk**: a consent screen left in _Testing_ status expires refresh tokens after 7 days → emails silently stop. Mitigation: publish the app (above) and add a health check endpoint that attempts a token refresh daily (Workers Cron Trigger, free) and writes an audit event on failure.

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

**Alternatives considered**: Resend/Postmark free tiers (cannot legitimately send _from_ a gmail.com address — DMARC fails; would require a custom domain the business does not have), SMTP via Workers TCP sockets (no mature library, Gmail requires app passwords), MailChannels (Workers integration discontinued).

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

**Required policy; implementation correction (T001)**: Preserve the following limits.
The Workers Rate Limiting binding alone cannot implement the ten-minute windows below:
its supported periods are only 10 or 60 seconds, with approximate per-location counts.
Use atomic D1 counters for the application policy; an optional binding may provide an
additional short-window abuse filter. Never configure a binding with `period = 600` or
silently replace ten-minute limits with one-minute limits. See R-16 and data-model.md.

| Endpoint group                              | Limit                   |
| ------------------------------------------- | ----------------------- |
| `POST /inquiries`                           | 5 per 10 min per IP     |
| `GET /auth/google/*`, `POST /auth/exchange` | 10 per 10 min per IP    |
| `POST /questionnaire/{token}`               | 5 per 10 min per IP     |
| Admin mutations                             | 120 per min per session |

Plus the duplicate-inquiry guard (same normalised email + message hash within 2 min) stored in D1 with a 2-minute TTL cleanup.

**Alternatives considered**: KV counters (eventually consistent); D1 counters now required
for the stated application windows despite write cost; provider binding alone is insufficient.

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
- `deploy-web.yml` on push to `main`: build with public frontend/API origins and Turnstile
  site key, then use pinned `wrangler deploy` with `apps/web/wrangler.toml` to publish Workers
  Static Assets and its fallback router. Use environment-scoped Cloudflare CI credentials.
- Both deployment workflows MUST depend on applicable passing checks and release evidence;
  pushing to main alone does not satisfy release gates. Document migration/rollback/restore.
- Environments: `local` (API wrangler dev + Vite; built web Worker for deployment/E2E checks),
  `production`. Optional isolated preview Workers require explicit origin/provider configuration;
  they must not inherit production data or credentials. CI uses the isolated local stack.

## R-13 Data backup (assumption: daily backups)

**Decision**: Daily Cron Trigger exports durable owner-managed D1 data as JSON to a private
`backups/` prefix in R2. Under the owner-approved operational policy, copies become
unrestorable and enter verified deletion at day 28, with removal targeted by day 30.
Retry and independently alert on failures/missed runs; disclose delayed physical removal
during outages. Exclude transient
OAuth state, exchange codes, sessions, rate-limit counters, and inquiry dedupe entries; never introduce inquiry
payload storage. Provider-managed recovery is supplementary: T001 must verify availability,
cost and restore eligibility consistent with QR-002, rather than assume a free 30-day
Time Travel entitlement. R2 private portfolio originals support derived-image recovery under T001's
verified upload design.

Client deletion removes live records and dependent checklist/email/questionnaire data.
Older private recovery copies are unavailable to application routes and subject to the
day-28 expiry/day-30 removal target; outages can delay physical removal beyond that target.
Keep client-ID/deletion-time receipts in a separate private `client-deletions/` R2 ledger,
outside the database restore set. Target receipt removal at day 31 after client deletion,
but preserve required receipts and alert if overdue recovery removal cannot be verified.
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

| Item                                                         | Where set                                                                     | Initial value                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Inquiry recipient                                            | Admin → Settings (D1 `site_config`)                                           | `tbd@gmail.com` (placeholder; confirm)                                                              |
| Sender address                                               | Admin → Settings; must match Gmail account/alias                              | Rebekah's business Gmail once created                                                               |
| Public contact email                                         | Admin → Settings; explicitly labeled public, independent of private addresses | Owner-approved monitored business address before launch; local fixtures use `hello@example.invalid` |
| Owner allow-list                                             | `wrangler secret OWNER_ALLOWLIST`                                             | Rebekah's Google account email                                                                      |
| Admin route                                                  | SPA `/admin` (unguessable path adds nothing — auth is the control)            | `/admin`                                                                                            |
| Timezone                                                     | Admin → Settings                                                              | `America/New_York`                                                                                  |
| Turnstile keys, Google client id/secret, Gmail refresh token | `wrangler secret` / `VITE_TURNSTILE_SITE_KEY`                                 | per environment                                                                                     |

## Design choices summary

| Technical Context field           | Resolution                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| Language/Version                  | TypeScript 5; Node 24 candidate verified below; Workers runtime                    |
| Primary dependencies              | R-01, R-02, R-03, R-05, R-06, R-08                                                 |
| Storage                           | D1 + R2 (R-03, R-04)                                                               |
| Testing                           | R-11                                                                               |
| Target platform                   | Cloudflare Workers Static Assets frontend + separate API Worker (R-01, R-02)       |
| Performance / constraints         | plan.md Technical Context; provider budgets/entitlements require T001 verification |
| Email, CAPTCHA, identity provider | R-07, R-05, R-06                                                                   |
| Rate limits, audit, backups, a11y | R-09, R-10, R-13, R-14                                                             |

Design choices remain documented; T001 feasibility/data-lifecycle decisions and all
implementation/release evidence remain open. These are tracked obligations, not passes.

## R-16 T001 feasibility checkpoint — 2026-11-13

Status: **BLOCKED — hosting resolved; two feasibility gates remain**. This is
documentation/source verification, not a deployed-account, image-decoder, installation,
or production-performance test. The agent has not enabled subscriptions, accessed payment
details/credentials, or deployed infrastructure.

**Owner follow-up**: The owner reports that their R2 account is now set up. Account
enrollment is no longer an owner action blocking progress; this is user-reported readiness,
not an authenticated deployment check. The owner subsequently selected Cloudflare Workers
Static Assets for the frontend. Both owner decisions are resolved. No R2 access keys are
needed for local implementation; deployment access can be configured later. Decoder,
retention, toolchain and usage-budget verification remain technical work for the agent.

### Hosting decision resolved

- **R2**: Cloudflare requires an R2 subscription through checkout. Standard storage includes
  10 GB-month, one million Class A and ten million Class B operations monthly; additional
  usage is billed. The general billing setup requires a primary payment method to purchase
  services and permits alternatives to cards. Taken together, these do **not** establish a
  no-billing/no-card deployment or a guaranteed $0 ceiling for this project. The owner has
  now completed enrollment, so that earlier prerequisite is resolved. Continue using the
  existing R2 account and target included allowances; verify usage controls without selecting
  a paid-tier upgrade or assuming a new spending budget. Sources: [R2 setup](https://developers.cloudflare.com/r2/get-started/),
  [pricing](https://developers.cloudflare.com/r2/pricing/),
  [billing setup](https://developers.cloudflare.com/billing/get-started/create-billing-profile/).
- **Superseded GitHub Pages choice**: GitHub restricts using Pages to run an online business or a site primarily
  facilitating commercial transactions. Applying that restriction to this photography
  pricing/inquiry site is an inference, not a GitHub ruling on this account. Its suitability
  was not treated as verified; the owner has now selected a different host. Source: [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- **Owner-approved selection**: Keep React, Hono, D1 and R2; serve the prerendered
  frontend through Workers Static Assets, with the modular API and existing bearer-session
  design retained. Static asset requests/storage have no additional charge; requests that
  execute Worker code follow Workers quotas. The frontend and API remain separate deployables;
  R2 enrollment has separately been completed by the owner. Source:
  [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

The owner instruction is explicit: switch the frontend to Cloudflare Workers Static Assets.
Record it in spec.md and use it for implementation without asking again. The backend/storage
principles remain compatible with constitution v1.0.0, so no constitution amendment is needed.

### Verified technical corrections

- **Rate limits**: binding periods are 10 or 60 seconds, Wrangler must be at least 4.36.0,
  and counters are approximate per Cloudflare location. Preserve R-09's policy using atomic
  D1 fixed-window counters, keyed by endpoint group and HMAC of trusted IP (owner session ID
  for admin mutations), with a required numeric `Retry-After`. This is an application design
  choice; concurrency/boundary tests and D1 write-budget checks remain T007/T009 work.
  Source: [binding documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
- **Gmail sender validation**: `sendAs.list` requires a scope other than `gmail.send`;
  select `gmail.settings.basic` alongside sending permission. The settings scope is
  restricted, so the earlier claim that production consent alone resolves setup is not a
  verification result. Check the applicable owner-only/personal-use verification exception
  before live use; do not request broader mailbox-read scopes as a workaround. Login OIDC
  consent remains separate from the local Gmail consent operation. Sources:
  [sendAs.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/list),
  [scope classifications](https://developers.google.com/workspace/gmail/api/auth/scopes).
- **D1 recovery**: Free-plan Time Travel is seven days; paid-plan recovery is 30 days.
  Free recovery fits QR-002's maximum, but it does not replace the independent deletion
  ledger or private application backups. Source:
  [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).
- **R2 expiry**: lifecycle deletion is normally within 24 hours after expiration, and
  migration of existing objects can take longer. A 30-day lifecycle rule therefore cannot
  prove deletion within a strict 30-day maximum. The owner subsequently adopted operational
  targets (R-17): day-28 expiry/deletion attempts, day-30 removal target, day-31 receipt
  target, retries, independent alerts and unsafe-restore refusal. Provider delays must be
  disclosed; actual control verification remains open. Source:
  [object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

### Media contract correction and remaining proof

The old multipart request contained client-asserted `originalMime`/`originalBytes` but no
original bytes, despite requiring private original recovery. Add the original binary part;
derive MIME/size/dimensions from bytes on the server and reject mismatching claims. Never
trust browser conversion or file extensions as security validation. The revised contract
sets application bounds: original 10,485,760 bytes, each axis 1–16,384 pixels, total at most
40,000,000 pixels; WebP full/card/thumb long edges at most 2000/800/320 pixels, respectively.
Variant byte ceilings are 2 MiB/1 MiB/256 KiB; total multipart request ceiling is 16 MiB.
These are explicit design limits, **not measured runtime capacity**. Reject malformed and
animated input, preserve orientation, and verify stripped public metadata before publication.

Server decoder feasibility remains OPEN: binary headers alone cannot establish that an image
fully decodes or that derivatives are safe. Current Cloudflare Images documentation exposes
a Worker binding for byte-based transforms and inspection, with free-plan transformations;
evaluate it or a bounded decoder before T004/T033/T034. No paid Images storage is selected.
Sources: [Images binding](https://developers.cloudflare.com/images/optimization/binding/),
[Images pricing](https://developers.cloudflare.com/images/pricing/).

### Toolchain evidence and remaining proof

Local commands report Node **24.14.0**, npm **11.12.0**, pnpm **9.15.0**. Node's current
release table lists Node 24 as LTS; pnpm's compatibility table lists Node 24 with supported
pnpm 10/11/12 lines. Vite currently lists 8.3 for regular fixes, 7.3/8.2 for important fixes,
and 6.4/8.1 for security fixes. Thus the old unspecified Vite 6 / Node 22 candidate is not a
verified, pinned dependency set. T002 must pin compatible patches and prove install/build;
T006 must match the Workers test pool's actual Vitest peer dependencies. No install or build
has passed. Sources: [Node releases](https://nodejs.org/en/about/previous-releases),
[pnpm installation](https://pnpm.io/installation), [Vite support](https://vite.dev/releases).

Registry follow-up (`npm view … version engines peerDependencies --json`, with Node's
`--use-system-ca`): `@react-router/dev@7.15.1` accepts Vite 5/6/7/8 and Node ≥20;
`@cloudflare/vitest-pool-workers@0.23.0` requires Vitest/runner/snapshot `^4.1.0`;
Wrangler 4.162.0 requires Node ≥22.12; pnpm's current registry tag returned 12.18.0.
The first query attempt hit `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; retry using the OS trust
store succeeded without disabling certificate verification. These are retrieved package
metadata, not chosen lockfile pins or a tested installation. Use explicit versions when
resuming, because the React Router `latest` tag is already 8.x while this plan selects 7.x.

### Resume conditions

The owner's host choice and R2 readiness are recorded; plan/tasks/contracts/deployment
instructions reflect Workers Static Assets. Continue T001's operational-retention/decoder
and usage-budget verification. Mark each task complete only when its required evidence exists;
current progress is recorded in tasks.md/acceptance.md. The operational policy in R-17
supersedes the earlier unconditional recovery deadlines. Inquiry content remains transient.

### Implementation follow-up — verified allowances and controls

The following are documentation-backed allowances, not measured application consumption
or evidence of remaining allowance in the owner's account. All account-shared usage must
be included before deployment.

| Resource      | Included allowance / constraint                                                | Project planning envelope                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workers Free  | 100,000 requests/day; 10 ms CPU per HTTP request and cron; 128 MB per isolate  | 5,000 monthly visits × 60 cold image reads = 300,000 image requests/month. At 31 days, approximately 9,678/day on average; daily spikes, API calls, frontend fallback and other Workers must also fit. |
| Static Assets | Static asset delivery is free; invoking Worker code consumes Workers allowance | Serve existing public HTML/assets directly; count fallback execution separately.                                                                                                                       |
| D1 Free       | 5 million rows read/day; 100,000 rows written/day; 5 GB total storage          | Indexed public reads; count indexes, counters, audit, cleanup and rejected traffic in measured D1 metadata. Keep the application's planning target below 25,000 row writes/day.                        |
| R2 Standard   | 10 GB-month; 1 million Class A and 10 million Class B operations/month         | 60 × (10 + 2 + 1 + 0.25) MiB = 795 MiB for maximum-sized current originals/variants. A 300,000-read baseline uses 3% of Class B allowance.                                                             |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/).

**Design controls to implement and measure**: Reserve a combined 6 GiB R2 application
envelope, including staged/orphaned files, recovery media, backups and deletion receipts.
Budget before writes and reconcile actual storage; a 60-image live cap alone does not cap
replacement churn or orphan storage. Daily JSON exports must exclude binary media; retain
each generated original/variant object once and reference it from manifests. Thirty copies
of the maximum-sized gallery would alone consume about 23.3 GiB, exceeding the included
storage. A provisional 25 MiB daily JSON export ceiling uses at most 750 MiB over 30 copies;
exceeding it must raise an operational failure rather than silently skip data. These are
technical planning limits, not new accepted user-facing limits or implemented controls.

Budget alerts notify but do not stop R2 usage. Cloudflare's newly documented product spending
limits cover Workers/Durable Objects, exclude R2, and do not guarantee an invoice ceiling.
Therefore the existing $0 **target** is feasible at the estimated scale, but it is not an
enforceable $0 account cap. No billing setting, subscription or paid upgrade was changed.
Sources: [budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/),
[spending controls](https://developers.cloudflare.com/billing/manage/spend-management/).

The existing ten-minute D1 window design remains necessary: the provider binding supports
only 10/60-second windows and local approximate counters. Account quotas do not replace
application limits. [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

### Implementation follow-up — image feasibility boundary

The Images byte-stream binding is the strongest candidate for moving decoding out of the
application isolate. Its transformation performs decoding/re-encoding; `.info()` is only
inspection. Offline Wrangler/Vitest uses a reduced-feature implementation and cannot prove
production entitlement, full validation, metadata or CPU behavior.
[Images binding](https://developers.cloudflare.com/images/optimization/binding/).

Provider documentation is inconsistent about subscription eligibility: the pricing page
(updated October 19) describes 5,000 free monthly transformations and rejection without
charges beyond that allowance; the upload-to-R2 tutorial (updated June 10) explicitly
requires Images Paid to bind the API. Do not treat either an offline test or the pricing
table alone as evidence that this account can use private-byte transforms without a new
subscription. No upgrade is authorized. Sources: [Images pricing](https://developers.cloudflare.com/images/pricing/),
[upload tutorial prerequisites](https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/).

An in-isolate full-frame decoder is not an established fallback: 40,000,000 pixels × four
RGBA bytes = 160,000,000 bytes (152.6 MiB), already above the 128 MB isolate limit before
input buffers/runtime allocations. This calculation rules out that allocation strategy,
not every possible streaming decoder; no streaming implementation has been benchmarked.
The 10 ms Free CPU budget must also be measured, not inferred from local wall time.

Required proof before accepting the candidate: validate synthetic JPEG/PNG/WebP at the
contract's byte/pixel boundaries; reject truncation, misleading headers, MIME mismatch and
animation; preserve EXIF orientation; verify final WebP metadata; exhaust/read all decoder
output before publication; verify fail-closed behavior on provider errors/quota exhaustion.
Flattening animation with `anim:false` does not satisfy the specified rejection requirement.
Count at least four transform operations per attempted upload if the original and all
three supplied variants are decoded separately (240 for a 60-image initial portfolio);
retries, distinct inputs and additional output variants consume further allowance. The
test must keep originals private and must not fall back to serving an original on errors.
This is a proposed proof protocol, **not a completed decoder test**.

### Implementation follow-up — retention and Gmail

D1 Free's documented seven-day recovery window and R2's asynchronous lifecycle behavior
require distinct checks. R2 does not establish an unconditional physical-deletion upper bound.
The owner approved the R-17 operational policy on 2026-11-14: day-28 restore expiry/deletion
attempts, day-30 removal target, day-31 receipt target, retries and independent alerts with
explicit disclosure of outage delays. Do not discard required receipts while overdue
recovery removal is unverified; refuse expired or unsafe restores. The policy mismatch is
resolved by that amendment, while implementation and deployed control evidence remain open.
Sources: [D1 recovery](https://developers.cloudflare.com/d1/reference/time-travel/),
[R2 lifecycle behavior](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

Gmail sender lookup still requires `gmail.settings.basic` alongside `gmail.send`.
Google documents a verification exception when only the developer or a small number of
personally known users grant account access. Applying it to an owner-only Gmail integration
is a reasonable design inference, not approval of this OAuth project; anonymous visitors
do not grant Gmail access. Confirm the account/consent configuration before live email
acceptance, retain the unverified-app warning and user-cap caveats, and request no mailbox
read scope. Sources: [sendAs.list scopes](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/list),
[scope classifications](https://developers.google.com/workspace/gmail/api/auth/scopes),
[verification exceptions](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification#exceptions_to_verification_requirements).

### Implementation follow-up — toolchain resolution evidence

Candidate exact versions: Node 24.14.0 (installed), pnpm 12.18.0 (registry metadata only),
React/react-dom 19.3.1, React Router/@react-router/dev 7.18.5, Vite 8.3.8, TypeScript 5.9.3,
Tailwind/@tailwindcss/vite 4.3.5, Vitest/@vitest/runner/@vitest/snapshot 4.1.12,
@cloudflare/vitest-pool-workers 0.23.0 and Wrangler 4.162.0.

Read exact `engines`, `peerDependencies` and optional-peer metadata with `npm view` using
the OS certificate store (`NODE_OPTIONS=--use-system-ca`). Node 24 is a supported LTS line;
Vite 8.3 receives regular patches. The Router and Tailwind plugins accept Vite 8; the
Workers pool requires Vitest ^4.1.0. Sources: [Node support](https://nodejs.org/en/about/previous-releases),
[Vite support](https://vite.dev/releases), [pnpm installation](https://pnpm.io/installation).

A temporary manifest containing these application/build/test packages passed
`npm install --package-lock-only --ignore-scripts --strict-peer-deps --no-audit --no-fund`
on Node 24.14.0/npm 11.12.0. No application dependencies were installed in the repository;
this proves dependency resolution only. pnpm installation, lockfile, runtime imports,
builds, vulnerability scanning and Workers integration tests remain T002/T006/T059 work.
The pool itself pins a different Wrangler/Miniflare pair; do not override its internal
versions merely to deduplicate dependencies. Tests must establish compatibility.

## R-17 Owner-approved retention and Pixieset boundary — 2026-11-14

**Retention decision: APPROVED.** The owner replied "Adopt the operation policy" to the
explicit day-28/day-30/day-31 proposal. QR-002, plan, data-model, contract descriptions,
T058 and quickstart now distinguish restore eligibility and operational deletion targets
from actual physical removal. No unconditional provider-outage deadline is claimed.

Application recovery copies become unrestorable and enter verified deletion at day 28
after creation, targeting removal by day 30. Receipt cleanup targets day 31 after client
deletion and preserves required receipts when overdue recovery removal is unverified.
Retry failed deletion, independently monitor missed cleanup/stale backups/target misses,
alert the owner and disclose delays. Live cascades, private storage, transient inquiries
and refusal of expired/unsafe restores remain required. This replaces the earlier strict
retention feasibility mismatch, but T001/T058 require actual operational proof. The owner
alert destination and independent monitoring configuration are still outstanding.

**Photo delivery decision: APPROVED.** The owner confirmed an existing paid **Client Gallery**
plan and chose "Client photo delivery; keep portfolio images on our website". The exact
storage tier/account limits have not been inspected, and no new subscription is selected.

| Responsibility | Selected system | Consequence |
| --- | --- | --- |
| Public Home/service portfolio and owner gallery editor | Radiant Images on Cloudflare | Keep R2 portfolio originals/derivatives and T001/T034 server validation, metadata removal, usage permissions, alt text and publication tests. |
| Full client collections, favorites, downloads and delivery | Existing Pixieset Client Gallery account | Manage collection privacy and sharing in Pixieset; do not build a duplicate delivery system or import full client shoots into the portfolio bucket. |
| Website client records, questionnaires, inquiry workflow and application recovery | Existing Radiant Images implementation | QR-002 still applies; a website client deletion does not automatically delete Pixieset collections or external mailbox messages. |

The provided link describes **Studio Manager**, a separate product. Pixieset offers
individual subscriptions and a Suite bundle, so a paid Client Gallery account does not
establish a paid Studio Manager entitlement. No Studio Manager migration is selected.
[Subscription documentation](https://website-help.pixieset.com/en/articles/4064291-managing-your-pixieset-subscription)

Client Gallery documents uploads, client favorites/downloads, privacy controls and sharing
through Pixieset email invitations or copied collection links. These support the selected
delivery workflow without requiring an API integration into the custom website.
[Client Gallery guide](https://help.pixieset.com/hc/en-us/articles/360058713951-Getting-started-with-Client-Gallery)

The documented automatically synchronized gallery blocks are a **Pixieset Website** feature;
the article also allows up to an hour for automatic synchronization. That is not evidence
of an embeddable/API integration for this React website or its 60-second publication budget.
No supported custom-site gallery API/embed contract was established in the reviewed sources,
and no automatic sync, CDN hotlinking or scraping is selected.
[Gallery-block documentation](https://help.pixieset.com/hc/en-us/articles/360033998392-Sharing-Client-Gallery-collections-on-your-website)

T063 must record the operational boundary: review designated synthetic Pixieset collection
sharing/privacy separately if testing delivery, and verify website portfolio permission
and publication independently. Do not treat these documentation findings as an account
test, photo migration, real-client delivery, production decoder pass or release approval.

## R-18 Images Free activation and remote binding probe — 2026-11-14

The owner reported activating the free Images & Stream plan. The Images statistics API
then changed from HTTP 403/code 5403 to success, with zero current and zero allowed hosted
images. This is consistent with using R2 for storage. It is not a paid Images storage plan.
The [pricing documentation](https://developers.cloudflare.com/images/pricing/) describes
5,000 unique transformations/month on Free, with new transformations refused at the limit
and no overage charge. The older upload tutorial still says Paid is required; actual
remote-development binding calls now establish transformation access for this account.

Used project-local Wrangler 4.162.0 and the standalone diagnostic configuration in
`scripts/image-binding-probe/`, with only an Images binding. `wrangler dev --remote` ran
the diagnostic on Cloudflare through a loopback development endpoint. No application,
D1/R2 binding, client photo, email, subscription change or persistent Worker deployment
was involved. The temporary process was stopped; the Workers scripts inventory afterward
remained empty. This is remote provider-development evidence, not a deployed application
or production CPU/memory/usage-budget pass.

The initial run records 13 cases in [probe evidence](./evidence/images-binding-probe.json).
A targeted [follow-up](./evidence/images-binding-probe-followup.json) retains the failures
instead of replacing them with a clean run:

- Valid PNG/WebP/JPEG transformed to decodable, static, metadata-free WebP. EXIF orientation
  changed 60 x 40 to 40 x 60 as expected. `.info()` reports the oriented dimensions, whereas
  the application's source header reports the encoded dimensions; an adapter must account
  for this difference when verifying originals.
- The 8000 x 5000 (40 MP) PNG produced 2000 x 1250, 800 x 500 and 320 x 200 derivatives.
  A 10,485,760-byte PNG with synthetic metadata succeeded. A 16,384-pixel-wide JPEG passed;
  the equivalent PNG hit a development proxy internal error once, then passed the targeted
  repeat. Preserve that failure; these samples do not establish reliability or worst-case
  resource budgets for all supported input combinations.
- PNG and WebP with corrupt pixel payloads were refused with provider code 9516. Cloudflare
  [documents this as an internal error](https://developers.cloudflare.com/images/reference/troubleshooting/),
  so the probe deliberately does not claim correct client-input error classification.
- **Blocking result:** a truncated JPEG scan was accepted and re-encoded without a warning.
  Adding a valid end-of-image marker did not change this. Both fixtures pass the application
  header parser but fail local Sharp decoding with `failOn: 'warning'`. A terminal-marker
  check alone therefore cannot close the validation gap.

The [binding documentation](https://developers.cloudflare.com/images/optimization/binding/)
describes transformation decoding; the observed implementation tolerates damaged JPEGs.
No documented strict-decoding option was established. At this checkpoint the production
validator remained unconfigured. R-19 below supersedes that implementation gap with a strict
validator and adapter; the gallery still fails closed when validation is unavailable.
Do not infer that a paid Images subscription changes decoding behavior.

The diagnostic is intentionally outside routine CI and exits nonzero for unmet expectations.
It is test code and does not add or change production behavior. T001/T034/T058 remain open.

## R-19 Strict JPEG rejection and production adapter — 2026-11-14

The owner explicitly accepted rejecting damaged JPEGs and re-exporting them, and reaffirmed
Pixieset for client delivery. Website portfolio uploads remain independently validated.

`assertJpegComplete` implements bounded 8-bit Huffman sequential/progressive scan validation
against [ITU T.81](https://www.w3.org/Graphics/JPEG/itu-t81.pdf), including complete MCU counts,
Huffman/quantization tables, restart order, padding, progression and exact end markers.
It retains only progressive coefficient significance, capped at 24 MiB, rather than decoded
pixels. Input, scan-count and coefficient-work bounds prevent unbounded parsing. Unsupported
encodings (including arithmetic/lossless JPEG) fail closed; owners can re-export standard
JPEG/PNG. A syntactically valid change to compressed content cannot be identified as an
unintended visual alteration without a trusted source; this is structural/entropy validation,
not a guarantee that arbitrary byte changes preserve photographic intent.

An internal `JpegValidator` SQLite Durable Object serializes checks per portfolio through
RPC and retains no image data or storage. This isolates scan CPU from the ordinary Free
Worker's 10-ms allowance. Durable Objects are available on Free with a default 30-second
CPU limit; [limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
and [pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) do not
replace a deployed measurement. The adapter bounds individual operations to eight seconds
and processing to thirty seconds. Exhausted budgets or unavailable services block publication.

`productionRuntime` now invokes the Images adapter. It checks source/variant bounds, sends
JPEGs through the strict check before transformation, fully decodes supplied variants and
regenerates all public WebP derivatives from the original. It verifies output dimensions,
bytes, animation and metadata, preserving EXIF orientation. Private originals and public
variants are written only after every check passes. Rejected photos get actionable HTTP 400
re-export guidance. Provider errors such as 9516 remain server failures rather than being
misreported as proof of damaged input; see [error reference](https://developers.cloudflare.com/images/reference/troubleshooting/).
API and generated release configuration include both bindings and the SQLite migration.

[Adapter evidence](./evidence/images-validation-probe.json) records **10/10 passing cases**
using local workerd/DO RPC and the live Images binding: PNG/WebP, intact re-exported JPEG,
EXIF orientation, both damaged JPEGs, 40-MP baseline/progressive 4:4:4, 16,384-pixel width,
and a JPEG padded with legal metadata to exactly 10 MiB. Successful derivatives also passed
independent strict Sharp decoding and metadata/dimension checks. Both damaged fixtures
return 400 before transformation. The synthetic diagnostic was stopped; no application
deployment, application storage, real photo, paid activation or Pixieset write occurred.

This resolves the reproduced silent-JPEG-recovery blocker. T001/T034 remain open for deployed
resource/usage-budget evidence and final release integration; T058 retention/monitoring is
separate. No task is marked complete solely from local execution or these live transformations.

## R-20 Private deployed gallery rehearsal — 2026-11-14

The owner authorized the proposed next step: verify the deployed upload pipeline using
temporary private Cloudflare resources and synthetic data. The real API entry point used
Images, two SQLite Durable Object classes, D1, and separate media/recovery R2 buckets.
Workers.dev, preview URLs, routes and bucket public access were disabled. A loopback-only
service-binding proxy supplied access; a short-lived synthetic session was seeded directly
in disposable D1. No Google/Gmail/Turnstile credentials, client images or Pixieset writes
were used. Wrangler 4.162.0, Node 24.14.0 and compatibility date 2026-11-14 identify this
rehearsal; the checked-in API target remains 2026-11-13 and needs its final release checks.

The first deployment exposed a resource issue: large multipart uploads consumed 92–109 ms
of front-Worker CPU and a large deletion consumed 11 ms. Requests completed, but exceeded
the 10-ms Free target. `GalleryMutations` now admits one upload/delete at a time per
portfolio, returning 429 plus `Retry-After: 2` for overlap. The front Worker authenticates
and forwards the unconsumed body; the coordinator runs the same authorization, bounded
body, validation, R2/D1, recovery and auditing code. The separate `JpegValidator` retains
strict scan validation. Neither Durable Object stores image bytes between operations.

The cold 40-MP progressive JPEG check approached the old eight-second timeout (7,935 ms
wall time). JPEG RPC now has a 20-second ceiling within the unchanged 30-second processing
deadline; Images operations retain eight-second ceilings. Timeout or provider failure
still prevents publication. This gives observed valid inputs headroom without accepting
damaged JPEGs or removing work bounds.

The [coordinated run](./evidence/cloudflare-gallery-rehearsal-coordinated.json) passes
**11/11** checks: unauthorized access, PNG/WebP/JPEG, EXIF orientation, two damaged JPEGs,
40-MP progressive 4:4:4 and high-detail baseline JPEGs, 16,384-pixel width and exactly
10 MiB of legal JPEG input. Successful uploads create one private original and three
public derivatives, independently decoded with strict Sharp and checked for static content,
dimensions and stripped metadata. Damaged JPEGs return 400 with no storage/publication.
Original routes stay inaccessible; deletion removes public access and writes private
recovery copies. A [concurrent-upload run](./evidence/cloudflare-gallery-concurrency.json)
returns one 201 and one 429, publishes exactly one image/four objects and cleans up.

| Deployed component | Maximum observed CPU | Maximum observed wall time | Evidence scope |
| --- | --- | --- | --- |
| Original front Worker | 109 ms | 11,212 ms | 74 invocations before coordination |
| Coordinated front Worker | 7 ms | 10,832 ms | 91 invocations |
| Gallery mutation coordinator | 159 ms | 10,748 ms | 21 invocations |
| Strict JPEG validator, coordinated version | 7,366 ms | 7,841 ms | 8 RPC invocations |

All retained invocation outcomes are `ok`; HTTP 400/401/404/429 are expected refusal paths.
The [CPU receipt](./evidence/cloudflare-gallery-cpu.json) is reduced from invocation logs,
without request headers, IPs or tokens. The [analytics receipt](./evidence/cloudflare-gallery-metrics.json)
records front-Worker memory p99 of 11,184,267 bytes (~10.7 MiB) and JPEG-validator memory
p99 of 31,707,058 bytes (~30.2 MiB), with zero reported validator CPU/memory-limit errors.
These are sampled percentiles, not absolute peaks. Coordinator memory rows and DO invocation
aggregates remained unavailable. An idle-object profiler request returned HTTP 503/10397;
no CPU/heap profile was captured. Do not interpret missing analytics as zero usage or close
the remaining memory gate from the absence of request failures.

The [initial run](./evidence/cloudflare-gallery-rehearsal.json) is retained with two failed
assertions. Editing the local proxy during execution caused a reload and 503 for the wide
JPEG while its remote upload still completed (201 in invocation logs). Its four objects
then caused the next inventory assertion to see eight new objects instead of four.
Both entries were removed through the API before the clean rerun. This records a harness
interruption and an uncertain upload response, not evidence that a failed response cancels
an already-dispatched write. Do not edit proxy source/config during a run or blindly retry
an uncertain upload without checking the gallery.

Usage planning, verified against current provider documentation:

- Images Free permits 5,000 unique transformations per month and refuses new ones at the
  limit without overage charges. The adapter makes six transformations per successful
  upload (three supplied-variant decodes, three regenerated outputs); `.info()` is unbilled.
  Budgeting every call separately gives at most 833 uploads/month before other account
  activity, failed attempts and diagnostic usage. This is a planning ceiling, not an
  installed quota guard. Public reads use stored R2 derivatives, not new transformations.
  [Images pricing](https://developers.cloudflare.com/images/pricing/)
- Free SQLite Durable Objects include 100,000 requests and 13,000 GB-s/day, with operations
  refused at limits. A JPEG upload uses one coordinator request and one validator RPC;
  deletion uses one coordinator request. Duration is billed using allocated 128 MB while
  active, including I/O waits; sampled CPU alone is not a usage-cost estimate.
  [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- R2 Standard includes 10 GB-month, one million Class A and ten million Class B operations
  monthly, then bills usage. The 60-image cap and existing per-file bounds cap live portfolio
  data at 795 MiB, excluding recovery, database backups and other account use. The coordinated
  run ended with zero live media and 38,041,744 bytes of recovery data, subsequently removed.
  Recovery churn and reads still need account-wide controls; no hard $0 guarantee follows
  from a small rehearsal. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

The [cleanup receipt](./evidence/cloudflare-gallery-cleanup.json) confirms deletion of the
Worker, both DO namespaces, D1 and both emptied R2 buckets; final inventories are empty.
The proxy stopped and local generated configs/synthetic credentials were removed. No paid
plan or public launch occurred. T001/T034 remain open for coordinator memory/resource and
usage-control evidence; retention/independent monitoring and other acceptance gates remain.

## R-21 Gallery memory and independent recovery monitoring — 2026-11-14

The owner requested the next item and selected **GitHub failure notifications for this
repository** as the operational alert channel. Continued the scoped private synthetic
rehearsal; no public release, paid subscription, real client data or Pixieset write occurred.

### Deployed memory evidence

Delayed R-20 analytics still lacked coordinator samples. A new disposable API/D1/R2/DO
deployment exercised a deterministic high-detail 8000 x 5000 JPEG, legally padded to
10,485,760 bytes, with an 11,324,096-byte multipart request. The first four cycles passed
([workload receipt](./evidence/cloudflare-gallery-memory-workload.json)), but the local
Wrangler service-binding proxy buffered the slow incoming stream. That pacing could not
establish coordinator activity throughout the client's upload duration.

A separate private driver Worker then paced the actual service-binding body on Cloudflare.
Its first version delayed every upstream chunk; small provider chunks made the request
exceed the client's 120-second timeout. The remote operation still completed after about
212 seconds and a competing attempt received 429. Both the [timeout receipt](./evidence/cloudflare-gallery-memory-streaming-initial.json)
and [busy receipt](./evidence/cloudflare-gallery-memory-streaming-busy.json) are retained.
The pending synthetic image was detected and deleted before the final run. No uncertain
upload was treated as rolled back solely because its client stopped waiting.

After a failing pacing regression test, the driver was corrected to delay per 32 KiB of
bytes, independent of upstream chunk boundaries. The API entry and image-processing code
were unchanged. An immediate private API redeployment refreshed the rehearsal version;
cleanup removed the completed earlier upload. The [final stream run](./evidence/cloudflare-gallery-memory-streaming.json)
passes **4/4** complete upload/strict derivative decode/private-original/delete cycles,
with approximately 31 seconds inside the coordinator for each slow upload.

Cloudflare analytics for 18:27–18:30 UTC now provide the missing memory evidence:

| Component | Memory p99/p999 | Reported CPU/memory-limit errors |
| --- | --- | --- |
| GalleryMutations isolate | 40,975,644 bytes (~39.1 MiB) | 0 / 0 |
| JpegValidator isolate | 29,492,300 bytes (~28.1 MiB) | 0 / 0 |

The broader diagnostic cohort, including the interrupted request, recorded coordinator
p999 of 70,915,496 bytes (~67.6 MiB). These samples are below the 128-MB isolate limit;
they are not absolute peak measurements or proof for every possible upload. The code's
input/variant/work bounds and one-mutation admission complement the deployed boundary
fixtures. [Metrics receipt](./evidence/cloudflare-gallery-memory-metrics.json),
[Cloudflare memory semantics](https://developers.cloudflare.com/durable-objects/observability/metrics-and-analytics/).

A 50-second heap profile succeeded during the initial slow request, following one 404
“no recent executions” response. Three allocation samples sum to 2,097,244 bytes, attributed
to anonymous `apps/api/src/index.ts` frames and generic JavaScript/root frames. This early
body-stream sample is not a full-pipeline sizing result. Allocation profiles do not show
retained or peak memory; the [profile receipt](./evidence/cloudflare-gallery-memory-profile.json)
records its hash and limits. [Profiling semantics](https://developers.cloudflare.com/workers/observability/profiling-in-production/).

The [CPU receipt](./evidence/cloudflare-gallery-memory-cpu.json) retains both deployment
versions. Final coordinator maximum CPU is 241 ms, JPEG CPU 1,255 ms; upload/delete front
invocations remain below 7 ms. A separate cold `GET /admin/gallery` reached 12 ms in the
earlier cohort and 10 ms in the final cohort. This is a remaining general Free-Worker CPU
headroom concern for T001; do not extrapolate the earlier 7-ms maximum to all requests.
All invocation outcomes in the receipt are `ok`, including expected 400 and 429 refusals.

T034's portfolio implementation and provider/memory evidence are now complete; T001 still
gates release for general resource/usage controls and operational recovery. Task count is
**52/63**. The [cleanup receipt](./evidence/cloudflare-gallery-memory-cleanup.json) confirms
both private Workers, both DO namespaces, D1 and both emptied R2 buckets are absent. The
proxy stopped and local generated configs/synthetic credentials were removed.

### Independent monitoring implementation

Scheduled maintenance and backup now write separate private running/ok/error records.
Failures replace an earlier healthy status; inability to update the record leaves a stale
or running value, which also fails monitoring. A successful backup signal is written only
after the existing read-back verification. The monitor independently enumerates R2 object
metadata, so an apparently healthy heartbeat cannot conceal a missing/stale backup or
overdue recovery copy. It never downloads client backup or receipt bodies.

The hourly GitHub workflow uses a dedicated read-only token and the standalone
`scripts/operations-monitor.ts` checker. It detects missed/stuck cleanup, stale backups and
health, day-28 cleanup delay, day-30 removal misses, day-31 receipt delay, nonzero recorded
application failures and a 6-GiB recovery-storage warning. Missing credentials, read errors,
invalid metadata and incomplete pagination fail closed. Output contains only fixed issue
codes and aggregate counts. The warning does not enforce a billing cap or cover other
account resources. Existing safe retention/retry rules are unchanged.

The owner must receive notifications as the scheduled-workflow actor; GitHub notification
preferences and a labeled synthetic failure receipt must be verified. The default-branch
workflow and repository-scoped secrets/variables are not activated in this rehearsal.
Quickstart documents setup, hourly detection limits, schedule delays and a notification
test that performs no Cloudflare operation. T058 remains open for actual production cron,
restore/deletion failure rehearsal and notification delivery; no live monitoring pass is
inferred from local tests. [GitHub notification routing](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).

## R-22 Monitoring credential scope and successful-job freshness — 2026-11-14

Cloudflare explicitly documents that R2 Object Read Only credentials work through the
S3-compatible API, not the Cloudflare REST object API. REST requires Admin Read Only or
Admin Read & Write credentials, both account-wide. The R-21 activation instructions could
therefore not provide bucket-scoped monitoring with their selected transport.
[Authentication restriction](https://developers.cloudflare.com/r2/platform/troubleshooting/#object-level-api-tokens-fail-against-the-rest-api),
[Cloudflare aws4fetch example](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/).

Corrected `scripts/operations-monitor.ts` to use S3 SigV4 via pinned `aws4fetch@1.0.20`
and `fast-xml-parser@5.12.1`. Package versions were checked against the registry and the
updated lockfile passes the dependency audit. The hourly workflow installs only the root
production dependencies from the frozen lockfile, with package lifecycle scripts disabled.
An isolated install required nine packages and the standalone Node entrypoint runs.

The transport is fixed to the selected account's default-jurisdiction S3 endpoint and
recovery bucket. It reads the three fixed operational JSON bodies, lists object metadata,
and performs conditional HEAD requests for backup creation/expiry metadata omitted from
S3 listings. It does not read backup, receipt, original or derivative bodies. GET/HEAD only,
no redirects/retries, 15-second request timeouts, a three-minute collection budget, 2-MiB
body bounds and 100 inventory pages bound the inspection. Reject malformed/DTD XML,
missing or repeating pagination, provider failures and missing/changed backup metadata.
Quickstart now names the two S3 credential secrets and the required bucket-only read scope.

Also reproduced a false-health case in R-21: repeatedly replacing the status with a fresh
`running` record could conceal an indefinitely old successful completion. Running records
now retain `lastSucceededAt`; the monitor requires that completion to remain within the
maintenance/backup freshness window. First starts, retries after errors and stale successes
cannot count as healthy merely because their start time is recent.

Local red/green evidence and final verification are in acceptance.md. The shell has no
configured S3 monitor credentials or recovery-bucket target, and GitHub CLI is unavailable;
remote workflow state was not inspected. No credentials were created, remote resources
changed, notifications sent, or release gates closed. T001/T058 remain open; the feature
still has **52/63 tasks complete**. Account usage controls, general API CPU headroom,
deployed recovery/cron proof and actual notification receipt remain separate requirements.

## R-23 Private recovery and monitoring rehearsals — 2026-11-14

The owner requested this next implementation step after merging the feature to main. The
existing feature branch was fast-forwarded to `d4e8aee`; pre-existing local Spec Kit/toolchain
configuration changes were preserved. New private rehearsal resources used only synthetic
data. They were provisioned with D1 in ENAM, two private R2 buckets and a Worker with
workers.dev and preview URLs disabled and no routes. Cloudflare API reads confirmed those
privacy settings. No production resource or client record was restored or deleted.

`scripts/cloudflare-recovery-rehearsal/` provides the separate operator, fixed resource
configuration, local service-binding proxy and sanitized result recorder. It imports the
shipped backup/deletion/media/scheduler services; the production application does not import
the operator. Local tests first failed for missing isolation/driver behavior, then passed.
See acceptance.md for the exact commands, final validation and sanitized evidence.

Verified against deployed D1/R2:

- Private snapshots omit transient auth/dedupe/rate/lifecycle state, retain omission markers
  and same-client invitation associations, and restore retained data.
- Client deletion cascades remove dependent email/checklist/invite/response data. Restoring
  a pre-deletion application snapshot replays the independent ledger and does not resurrect
  deleted data. All four portfolio original/variant byte fixtures recover exactly.
  Review found the initial seed lacked checklist master rows; a failing 0-versus-2 assertion
  caught the vacuous checklist test. The corrected seed and a separate deployed populated
  checklist backup/delete/restore proof passed, preserving the retained completion time.
- Missing indexed receipts and copies at day-28 expiry refuse restore/reopen and keep API
  reads at 503. Successful reconciliation precedes explicit reopening.
- An injected R2 delete failure under a 32-day fixture clock preserves the expired backup
  and required receipt. Independent monitoring reports the failed job, overdue recovery,
  missed day-30 target and overdue receipt. A subsequent retry verifies object removal before
  retiring the receipt. This is fault injection/controlled time, not an observed 32-day outage.
- Actual D1 Time Travel restored the selected pre-deletion bookmark. With ingress detached
  and cron paused, the operator verified the deleted synthetic client had returned to offline
  D1, restored the maintenance gate, replayed the independently retained R2 ledger, cleared
  transient credentials and verified dependent cascades before reopening. Time Travel can
  reset the maintenance flag, which is why detached ingress is essential.
  [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).
- A compatible Worker version rollback returned 100% of traffic to the recorded earlier
  version, and recovery/monitor checks passed afterward. It did not roll back D1 or R2.
  This is private operator rollback evidence, not the full application release matrix.
  [Worker rollback behavior](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
- Cloudflare actually invoked the temporary every-minute cron. The first successful receipt
  completed at `2026-11-15T03:09:23.653Z`; four captured runs returned `ok`, without exceptions,
  using 30–43 ms CPU and 7,757–10,880 ms wall time. The daily branch and storage were real;
  Gmail sender verification used a labeled synthetic no-send adapter. This does not establish
  actual Gmail health, production cadence or ongoing monitoring.

The independent observer first used a separate remote R2 binding, then the shipped S3 SigV4
checker against real R2. It downloaded only operational signals and metadata. The S3 sequence
was healthy → stale maintenance/overdue recovery/missed removal target → healthy after
cleanup. Initial user-provided credentials also allowed a media-bucket listing and an empty
write probe, so their scope was rejected for GitHub use; the probe was removed. The owner was
asked to replace them with recovery-bucket-only Object Read Only credentials. Final scope,
GitHub execution, owner receipt and cleanup outcomes are recorded in acceptance.md.
The replacement credentials subsequently denied both unrelated-bucket listing and recovery
writes (403) while permitting healthy S3 inspection. Only that replacement was copied into
temporary GitHub secrets. The real monitor passed against R2, then correctly failed on the
injected stale maintenance/overdue backup/target miss. The user explicitly confirmed receipt
of the synthetic notification retry; this is actual human receipt evidence for manual runs.
The recovered GitHub run `43672158050` returned healthy with no issues. Temporary repository
settings/secrets and all four Cloudflare resources were removed and their absence verified.
The user retains responsibility for revoking the temporary R2 token because the connection
has no token-management permission. No persistent monitor or public deployment remains.

GitHub's intended synthetic notification failure ran on merged main as `sg921216` in runs
[43670559798](https://github.com/sg921216/radiant_images/actions/runs/43670559798) and, at the
owner's request, [43671241481](https://github.com/sg921216/radiant_images/actions/runs/43671241481).
Both failed at the labeled first step and skipped checkout/Cloudflare access. They need no
R2 credentials. Actual owner notification receipt is a separate human observation.
[GitHub notification routing](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).

**Release boundary:** functional completion is not a Free-plan resource pass. Cloudflare
documents 10 ms CPU per Free Cron invocation and permits occasional over-limit execution;
all four captured full-job samples exceeded 10 ms. Production scheduling needs resource
headroom/remediation evidence before release. The existing T001/T058 gates remain open;
no paid upgrade, production deployment, or permanent monitoring activation is inferred.
[Workers CPU limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time).
