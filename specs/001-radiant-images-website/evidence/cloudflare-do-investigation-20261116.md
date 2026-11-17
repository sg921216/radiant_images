# Durable Objects usage investigation — persistent private environment

Prepared for Cloudflare investigation; not submitted. No credential values or client data
are included. Missing aggregates are not interpreted as zero usage or unused allowance.

**November 17 03:25 UTC reconciliation:** Persisted execution records show 70 DO calls:
67 automatic maintenance operations, one normal automatic daily operation and two manual
daily operations. All return `ok`; the 68 scheduled front invocations use at most 1 ms CPU,
and the DO maximum is 49 ms. Account and namespace aggregates both report 27 requests
on November 16 and 43 on November 17, with zero errors. Integer periodic sums agree;
duration totals agree to meaningful precision. The active-environment discrepancy is
resolved at this observation; historical November 14/15 rows remain absent. The actual
03:00 UTC daily backup/Gmail check, scheduled GitHub alert and owner receipt all pass.

**November 17 02:56 UTC billing-source check:** The separate Billing Read connection
successfully queried the account's billing-anchor-inclusive November 14–17 range. The
billable-usage feed still contains seven R2/Images rows ending before November 16 UTC,
with no DO records; it does not yet cover the persistent environment's execution period.
The documented `/billing/usage` metric list also does not offer a DO metric. This feed
cannot establish current DO consumption or reconcile the earlier owner-observed dashboard
zero. Its absent DO data is not interpreted as zero usage or as a new billing defect.
Sanitized source results are retained in the operational evidence; GraphQL and execution
logs remain the supported current observations in this packet.

**November 17 02:27 UTC update:** The persistent environment has 57 recorded DO calls
(56 automatic maintenance invocations plus the initial manual daily operation), all `ok`.
Account-wide and namespace aggregates both report 27 requests on November 16 and 30 on
November 17, zero errors and matching periodic sums. November 14/15 history is still absent.
The active environment remains consistent after several hours; the unresolved issue is
historical reporting/ingestion, not a current zero or cross-query mismatch.

**23:04 UTC update:** Account-wide and namespace aggregates now agree: 16 requests, zero
errors, and matching periodic sums. Workers Observability independently records the
initial manual DO call plus 15 automatic maintenance DO calls, all `ok`. The earlier
current-environment cross-query count discrepancy has resolved at this observation.
November 14/15 history is still absent; the packet retains the earlier observations to
investigate historical reporting and ingestion behavior. This is not evidence of zero
historical consumption or a billing-cap guarantee.

**21:57 UTC update:** The persistent namespace now reports three requests, matching the
three captured DO calls, with zero errors. The broader account query reports two requests
and still no November 14/15 rows. This packet now tracks **partial reporting recovery and
remaining historical/cross-query discrepancies**, not continued zero usage for the active
namespace. The final query/response is preserved alongside the earlier empty result.

## Environment and reproduction

- Account: `c99576a777ec2286fcd04b8433231159`.
- Worker: `radiant-images-api`; created November 16, 2026, and intentionally left active.
- Class: `ScheduledOperations`; SQLite namespace `22cf4ea67a7f4cc6bc8a172621a398e6`.
- Named object: `recovery`; instance ID
  `e4b2c60461e62a76163d6970127e6ca28d4a44b23a4bdaa78490f6eeaaf99c57`.
- Initial executed version: `1e957798-4d86-47ce-82fb-ca095b89ca43` (secret provisioning created
  this version after the initial `fe88a6f5-7318-4413-b203-a0e095b513a0` deployment).
- Initial application source: `fb67738294d9b7c84f7c665516d8dd22595b8b4f`, with no implementation
  edits at the initial observation. A later Gmail primary-address correction passed 33
  focused tests and was deployed; current version after Gmail secret provisioning is
  `5868ab73-0666-4598-a8dc-dd759e9579ff` (November 17 02:33 UTC). The earlier execution evidence
  remains attributed to its original version. Config: `apps/api/wrangler.acceptance.toml`.
- Runtime compatibility: `2026-11-13`, `nodejs_compat`; local Wrangler `4.162.0`.
- Public ingress is disabled. Normal maintenance `*/5 * * * *` and daily backup/health
  `0 3 * * *` remain configured. R2/D1 are real persistent resources.

A temporary private service-bound operator invoked the **existing production DO** with
`run('0 3 * * *')`, using the production runtime rather than a test provider. The initial
call began at **2026-11-16 21:43:52.472 UTC** and completed successfully. Its private
R2 records show maintenance finished at 21:43:54.646 and backup at 21:43:56.365. The
backup was read back and verified by the production helper. Gmail was unavailable because
real consent/site settings had not yet been configured; backup success is not Gmail success.

## Direct execution evidence

Wrangler tail and persisted Workers Observability agree on the initial invocation:

| Field | Value |
| --- | --- |
| execution model | `durableObject` |
| entrypoint / RPC | `ScheduledOperations` / `run` |
| outcome / exceptions | `ok` / none |
| CPU / wall time | 49 ms / 4,462 ms |
| observability record | `01M7K5266X000000000000006A` |
| trace | `db769962c90c6ab616a3b62f9d793ebf` |

The event is discoverable through Workers Observability with `$workers.scriptName`
equal to `radiant-images-api`, beginning at 21:40 UTC. The evidence JSON alongside this
packet retains later observations and actual cron samples where available. These timings
prove execution; they are not a calculation of billable GB-seconds or complete usage.

Two automatic `*/5 * * * *` invocations followed at 21:51 and 21:56 UTC. Both front calls
report `ok` and 0 ms CPU at provider resolution; their production DO calls report `ok`,
16/12 ms CPU and 1,645/1,837 ms wall time. No exceptions were recorded. The first automatic
completion signal is 21:51:01.677. The namespace's final three-request count matches the
initial manual call plus these two automatic calls. The broader account's two-request
observation was collected in the same GraphQL request and may reflect ingestion/sampling.

## Aggregate observations

At **21:48:17 UTC**, a successful `/graphql` query returned `errors: null` but empty
arrays for all four of the following:

1. Account-wide `durableObjectsInvocationsAdaptiveGroups`, November 14–16 inclusive.
2. Account-wide `durableObjectsPeriodicGroups`, the same dates.
3. Invocation groups for namespace `22cf4ea67a7f4cc6bc8a172621a398e6`, November 16.
4. Periodic groups for the same namespace/date.

Each query used `limit: 10000`. Fields and namespace filters were checked against live
GraphQL introspection. Invocation sums requested `requests`, `errors`, `wallTime`;
periodic sums requested `cpuTime`, `duration`, `activeTime`, `rowsRead`, `rowsWritten`.
The complete query and response are in
[the operational evidence](./cloudflare-private-operations-20261116.json).

R-28/R-29 already retained empty aggregates for November 14–16 despite earlier successful
DO executions. Dataset settings reported enabled, 90-day lookback, 32-day query range and
10,000-row limit. The owner previously reported monthly dashboard zeros for November
14–December 14; that is historical owner-attested evidence, not a fresh dashboard check.
See [R-28](./cloudflare-account-capacity-20261116.json) and
[R-29](./cloudflare-t001-r29-20261116.json).

Recent-event ingestion delay or adaptive sampling has not been excluded. The persistent
target removes deletion of the namespace as a confounding factor for follow-up queries.
No root cause or zero-consumption conclusion is claimed.

## Requested investigation

Please reconcile the named namespace's initially empty then populated aggregates,
the account/namespace count difference, and the missing historical rehearsal usage/account
Usage display. Confirm whether this is expected
Free-plan reporting, ingestion delay, a query/dataset mismatch, or a metering defect; provide
the supported account/day usage and duration source and any ingestion/backfill timeframe.
The environment is left active for reproduction. No paid-plan upgrade is authorized.

References: [DO metrics and GraphQL datasets](https://developers.cloudflare.com/durable-objects/observability/metrics-and-analytics/),
[analytics sampling/consistency](https://developers.cloudflare.com/analytics/faq/graphql-api-inconsistent-results/),
[DO Free-plan limits](https://developers.cloudflare.com/durable-objects/platform/pricing/).
