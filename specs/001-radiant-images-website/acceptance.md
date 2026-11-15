# Implementation evidence: Radiant Images

## 2026-11-14 — Committed R-24 remote CI acceptance (T059)

The owner supplied [Quality run 43675695318 / verify job 132695230356](https://github.com/sg921216/radiant_images/actions/runs/43675695318/job/132695230356).
Verified its run/job APIs and completed job log: **SUCCESS** on feature head
`c00eaab40235185e7d320176986ccdf3fe4bc334`, which contains all R-24 CPU, usage-control,
contract and pricing changes. The PR checkout is merge commit
`ce7ca2c7a7d227cfc618a6645778fa5d739e241e`; GitHub's Git API confirms its tree exactly
matches the feature head (`e2ef3326e26b3060b790c7edb418488b98580f8c`). This closes the
previous gap between local changes and the remote-tested source.

| Gate | Verified result |
| --- | --- |
| Install and static quality | Frozen lockfile install, formatting, lint and type checks pass. |
| Unit/component/API/contract/tooling | **63 files / 281 tests pass**, including the new dispatch, upload-budget and contract-harness cases. |
| Production and browser setup | API/web builds, local database setup and all three browser-engine installations pass. |
| Full browser matrix | **158 passed / 12 skipped** in 15.7 minutes: 155 functional cases across five projects, plus three once-per-run performance profiles. Only duplicate performance-profile cells are skipped; no functional quarantine. |
| Security/privacy | Dependency audit, repository secret scan and diagnostic privacy gate pass. Failure-only artifact upload is correctly skipped on success. |
| CI guard review | PR/nightly/manual/reusable release events select the full matrix; main pushes select smoke. Focused tests are forbidden, CI permits one diagnostic retry, flaky classification fails the run, traces are disabled, and privacy-cleared failure artifacts have seven-day retention. No live-provider secrets are injected into Quality. |

The existing R-24 observation matrix establishes success/error coverage for all 40
operations and 401/403 for all 31 protected operations; the now-remote-passing security
suite also checks expired, removed-owner and non-owner sessions. Applicable-error
declaration checks and actual response validation pass. A supplementary local schema
probe passes 12 checks across all three email error schemas: valid code/retryable pairs
are accepted, while wrong codes, inverted retryability and missing retryability reject.

The historical isolated WebKit input-loss observation remains in the earlier evidence;
it did not recur in this complete matrix. No root-cause fix is claimed and no journey is
omitted. Passive failure diagnostics and T063's actual-device acceptance remain required.

**T059 is complete: 54/63 tasks complete, 9 open.** This is pinned-engine CI acceptance;
general HTTP CPU/account usage, persistent recovery monitoring, real-mail/human checks,
owner content and production release gates remain open. The evidence update itself changes
only documentation. No application code, deployment, workflow dispatch or merge occurred
during this verification. The UTC run ended November 15; the New York date is November 14.
See [sanitized run, commit/tree, step and count evidence](./evidence/github-ci-r24-20261115.json).

## 2026-11-14 — Scheduled CPU remediation, usage controls and pricing acceptance (R-24)

Base commit: `48d5ee3032ee1ad9587b18bbc2588d6b86d394db`, plus the local changes described
below. UTC measurements fall on November 15; the workstation date is November 14 (New York).
Existing Spec Kit/toolchain edits and the unrelated logo asset remain outside this work.
No public release, paid upgrade, live Gmail send or customer-data operation occurred.

### Scheduled CPU and application usage controls

Both production cron expressions now await one private `ScheduledOperations` Durable
Object, serializing the single recovery ledger with at most two outstanding jobs.
Unsupported schedules/excess queueing fail explicitly; operation failures reach the cron
caller and release the queue. The existing R2 job records remain the persistent completion,
failure and freshness evidence. Release, local and private rehearsal configurations include
the new binding and SQLite-class migration; Wrangler regenerated the binding types.

| Check | Observed result |
| --- | --- |
| Actual Cloudflare cron | Three successful accelerated invocations on version `57cfe04e-f0c3-401c-aaab-19fac45b88bb`; the daily recovery branch used real D1/R2 with a synthetic no-send Gmail boundary. |
| Front Worker CPU | **0 / 0 / 0 ms at provider reporting resolution**, compared with R-23's 32 / 34 / 30 / 43 ms. This is not zero computation. |
| Coordinator CPU | **30 / 28 / 18 ms**; front wall times 14,456 / 13,115 / 13,043 ms. All six invocations returned `ok`, without exceptions. |
| Independent observation | Separate R2 binding reader reported `ok:true`, no issues and zero overdue recovery/receipt counts after actual cron completion. |
| Private ingress | Worker public/preview URLs disabled, no routes; both R2 managed domains disabled and no custom domains. |
| Teardown | Schedule removed, buckets emptied with absence checks, local proxy/tail stopped; Worker/DO namespaces/D1/buckets removed. Final provider listings contain zero matching resources. |
| Portfolio churn control | Persistent DO allowance of 300 admitted upload attempts per rolling 30 days, before image processing. Failed admitted attempts consume a slot; exhaustion returns 429 with Retry-After. Auth/byte-limit rejection occurs before reservation. Reads and deletion remain available. Local real-DO proof; no new deployed portfolio-quota claim. |
| Account warning | Added and re-read enabled **$1 account-wide budget warning**, reusing the existing billing recipient. Existing $10 warning preserved. No notification test or paid upgrade. |
| Billing limitations | Subscription and spend-policy reads return 403 with the current OAuth connection. Budget warnings do not stop usage; no account-wide invoice cap or $0 guarantee is established. |

Evidence: [sanitized CPU/control/cleanup record](./evidence/cloudflare-cpu-remediation.json).
Research R-24 records source-backed limits and the bounded storage/transformation planning
envelope. These samples do not establish worst-case backup capacity or general HTTP CPU
headroom (the earlier cold gallery GET reached 12 ms). **T001 stays open.**

**T058 stays open:** no persistent application deployment exists to monitor. Activate only
against the real recovery bucket with verified bucket-scoped S3 read credentials, repository
settings and scheduled recipient routing. R-23's user-confirmed manual notification and
healthy/fault/recovered rehearsal remain valid but do not prove future scheduled delivery.
The $1 warning is the only persistent Cloudflare change from this follow-up.

### Red/green and local quality evidence

- `pnpm exec vitest run apps/api/tests/scheduled-dispatch.test.ts`: initial behavioral
  failures showed no coordinator dispatch and swallowed injected coordinator failure.
  Overlap/unknown-schedule checks also failed before the coordinator behavior was added.
  Final five cases pass, including real failed cleanup → successful backup/healthy signals.
- `pnpm exec vitest run apps/api/tests/gallery-budget.test.ts`: the initial 301st attempt
  returned 400 instead of 429. Final real-DO test passes for the last admitted invalid
  upload, persistent count, exhaustion/Retry-After/contract body, unauthorized access and
  expired-window recovery. No image processing is needed to consume those test attempts.
- Focused rehearsal/release configuration tests and scheduled/operations tests pass.
  `pnpm check` passes formatting, lint, types, **62 files / 277 tests** and production builds
  after the CPU/usage implementation. This run predates the later contract-harness file.
- After the contract additions, the complete API audit passes **24 files / 158 tests**;
  the subsequent four-case contract-harness run passes, including three new coverage cases.
  Final formatting, lint, types, secret/artifact privacy gates and `git diff --check` pass.
  Final secret scan: 453 files / zero blocked; diagnostic scan: 10 files / zero blocked.

### T059 contract and remote CI verification

An observation hook temporarily recorded only normalized path, method and status **after**
the normal strict response validator succeeded. The helper was restored byte-for-byte.
The complete API run exposed three coverage gaps: no error for Google sign-in start, and
no success for owner banner/questionnaire reads. Added authenticated-read cases and an
auth rate-limit case; all pass. A separate harness regression rejects an intentionally
malformed `/pricing` response with the expected schema-mismatch error.

The combined observed response set covers **all 40 operations with success and error**,
and **all 31 protected operations with 401 and 403**, in addition to the existing expired,
removed-owner and non-owner authorization tests. The audit does not treat schema
declarations alone as response evidence. See
[the complete sanitized status matrix](./evidence/contract-coverage-20261115.json).

The manually dispatched [Quality run 43673720689](https://github.com/sg921216/radiant_images/actions/runs/43673720689)
**passes** on the latest pushed commit `48d5ee3032ee1ad9587b18bbc2588d6b86d394db`:
frozen install, formatting/lint/types, dependency and secret checks, **60 files / 271 tests**,
production builds, setup and the full browser matrix. Browser result: **153 passed / 12
skipped** in 17.5 minutes. The 150 functional cases cover all five projects; three performance
profiles run once in Chromium desktop (including the specified CDP mobile conditions),
and their 12 duplicate non-target project cells are explicitly skipped. These are declared
profile-selection skips, not quarantined functional journeys. The diagnostic privacy step
passes; failure-only artifact upload is correctly skipped. Focused/flaky rejection and
seven-day retention remain configured. This run does not contain the local CPU/usage/test
diff; remote CI on its eventual commit remains required before closing T059 or releasing.
See [sanitized run/step/count evidence](./evidence/github-ci-20261115.json).

### T031 pricing, print and PDF acceptance

The expanded local pricing suite passes **20/20 cases** across Chromium desktop/mobile,
Firefox desktop and WebKit desktop/mobile, with no retries, failures, skips or flaky cases.
Every service's pricing loads from Home in one navigation-link click (plus opening the
mobile menu), and each scoped Book Now CTA opens Contact. Publication updates an already
open service page within 60 seconds; its download filename and all print revision footers
match `GET /pricing`. The PDF-module outage retains usable pricing/print controls.
Existing pricing integration tests also pass missing-type/negative-price/duplicate-order
rejection, simultaneous equal-time publication and rollback after pointer-write failure.

Downloaded PDFs and Chromium browser-print PDFs were captured before and after publication,
rendered with PyMuPDF, inspected visually, and checked with text/page coordinates. **All
four documents have three pages (12 inspected pages total):** one each for Maternity,
Newborn and Family, with readable package text, no clipping, no unexpected blank pages or
navigation. Initial prices are $250.00; the updated Family price is $350.50 with the other
two unchanged. Every corresponding footer matches the API revision. The browser-print
and PDF layouts differ visually but preserve the same complete published data.

The first short run overlapped the production rebuild and returned one transient Family
404; it is not counted as product acceptance. After the build completed, the sequential
20-case run above passed. No product fix is attributed to that harness race. Firefox used
the existing owner-installed executable via the local matrix configuration.
See [pricing matrix and page inspection evidence](./evidence/pricing-review-20261115.json).

**T031 is complete for its pricing-specific assertions; 53/63 tasks complete, 10 open.**
This adds the deferred pricing navigation to the existing US1 evidence. Overall SC-001
participant/inquiry timings still depend on T025/T063, SC-004 full acceptance remains
T061, and final owner-content/physical-printer/device acceptance remains T063. Synthetic
pricing fixtures do not constitute owner approval of launch prices or text.

## 2026-11-14 — Private recovery and monitoring rehearsal (R-23)

Requested after merge; branch `001-radiant-images-website` fast-forwarded to main
`d4e8aee8cfc172c6e91ba4838fe648cd17f9ce61`. The requirements checklist passes 16/16.
Existing local Spec Kit, `.node-version` and `.npmrc` edits remain separate and unchanged.
No public release, paid upgrade, live-email send or customer-data operation occurred.

Evidence: [sanitized rehearsal record](./evidence/cloudflare-recovery-rehearsal.json).
The UTC run crosses into November 15; the workstation date is November 14 (New York).

| Check | Observed result |
| --- | --- |
| Private infrastructure | One temporary ENAM D1 database, Worker and two R2 buckets. API confirms workers.dev/preview URLs and both r2.dev domains disabled; no routes. |
| Snapshot and application restore | PASS: transient auth/dedupe/rate/lifecycle state omitted; retained data, omission markers and invitation associations preserved; deleted client and all dependent rows absent after reconciliation; API 503 until explicit reopen. |
| Populated checklist follow-up | Initial fixture review found zero checklist states; a new assertion failed (0 versus 2). Corrected the seed and added a live targeted proof: two populated checklist states before backup, deleted client's state absent after delete/restore, retained client's exact completion time preserved. Passed on version `6310a82e-cfd0-45e7-b8b3-4aecee2c4ac5`; the earlier empty-table assertion is not counted as checklist evidence. |
| Portfolio recovery | PASS: original and three variant byte fixtures restored exactly from private recovery. This does not repeat image-decoder acceptance. |
| Unsafe restore | PASS: missing indexed receipt and day-28-expired snapshot rejected; unsafe reopen refused. |
| Delayed deletion and retry | PASS with injected R2 delete failure and 32-day clock: old backup and required receipt retained; monitor detects overdue recovery, missed target and overdue receipt. Retry verifies backup/media removal before retiring receipts. |
| Actual provider restore | PASS: real D1 Time Travel to saved pre-deletion bookmark; deleted client returned only to isolated D1, then independent R2 receipt replay removed client/dependents, cleared transient state and allowed explicit reopen. Ingress detached throughout; cron paused. |
| Compatible Worker rollback | PASS: `6e4e69a5-ae1a-442e-b38b-cbf4ee3559e4` → `0dceb9d3-a5d8-4807-8575-f555730f7d94` at 100%; recovery/monitor passed afterward. No database rollback implied. |
| Actual Cloudflare cron | PASS functionally: accelerated every-minute trigger invoked real daily maintenance/backup/health logic; first successful recorded completion `2026-11-15T03:09:23.653Z`. Gmail adapter was synthetic/no-send. |
| CPU headroom | OPEN: four tailed cron runs returned `ok` with no exceptions but used 32, 34, 30, 43 ms CPU, exceeding the Free 10-ms budget. Wall times 9,659 / 9,264 / 10,880 / 7,757 ms. No production resource-budget pass. |
| Independent observation | PASS through separate R2 binding and real S3 SigV4 checker: healthy → injected stale maintenance/overdue backup/target miss → healthy. Signals/metadata only. |
| Initial credential scope | REJECTED for GitHub setup: other fixture bucket list and recovery write both returned 200; empty write probe removed. Owner asked to replace with bucket-only Object Read Only credentials. |
| Replacement credential scope | PASS at `2026-11-15T03:21:17.637Z`: other fixture bucket listing returned 403, recovery write returned 403, while the real S3 monitor returned healthy. Only this verified replacement was used for temporary GitHub setup. |
| GitHub notification test | Both requested synthetic runs completed with the intended failure before checkout/provider access: [43670559798](https://github.com/sg921216/radiant_images/actions/runs/43670559798), retry [43671241481](https://github.com/sg921216/radiant_images/actions/runs/43671241481). Receipt is not inferred from a failed run. |
| Recipient receipt | PASS: user explicitly confirmed receipt of the failure notification for retry run `43671241481`. This proves the manually triggered recipient path; future production schedule ownership/routing must still be configured. |
| Real GitHub monitor | Verified replacement credentials encrypted into temporary repository secrets; merged-main healthy run [43672001075](https://github.com/sg921216/radiant_images/actions/runs/43672001075) succeeded. Injected-fault run [43672071929](https://github.com/sg921216/radiant_images/actions/runs/43672071929) failed at the real monitoring step after successful install; no application mutation occurred in the monitor. Recovery and teardown results are retained below/in the JSON record. |

The fault run's sanitized output contains exactly `maintenance_job_unhealthy`,
`recovery_cleanup_overdue`, and `recovery_removal_target_missed`, with one overdue copy.
After cleanup, [recovery run 43672158050](https://github.com/sg921216/radiant_images/actions/runs/43672158050)
passed with `ok:true`, no issues and no overdue objects. This completes the real GitHub
healthy → fault → recovered rehearsal using bucket-only read credentials. Manual dispatch
is not evidence of scheduled GitHub delivery or future production activation.

**Teardown verified:** the temporary schedule was removed; the local proxy/tail stopped;
both R2 buckets were emptied with absence checks; the Worker, D1 database and both buckets
were deleted. Re-listing Cloudflare returned zero matching resources. The three temporary
repository secrets and two variables were removed; GitHub lists no repository secrets or
variables afterward (matching the initial state). No paid service or production monitor was
left running. The user-controlled R2 token still needs revocation in Cloudflare; this
connection cannot manage API tokens (403). Its local file remains Git-ignored and no secret
value appears in evidence. Any broad token created solely for this rehearsal should also
be revoked by its owner.

Local red/green evidence:

- `pnpm exec vitest run scripts/tests/recovery-rehearsal.test.ts apps/api/tests/operations.test.ts scripts/tests/operations-monitor.test.ts` initially gave 1 failed isolation test / 18 passing existing tests. The failure showed the old gallery configuration was not the separate recovery target/entry/trigger.
- The new API rehearsal initially failed because POST seed returned 404, then passed the
  whole synthetic recovery sequence. Provider-reconciliation coverage separately failed
  at the unsupported provider-delete action (404), then passed after implementation.
- Fixture review added an assertion requiring two populated rows in each client-dependent
  table; checklist state failed with 0 rather than 2. Seed correction, local checks and the
  separate deployed `checklist-proof` passed. Its initial empty-table check remains disclosed.
- `pnpm check` PASS: formatting, lint, types, **60 files / 271 tests**, production API/web builds.
  The first check failed solely on 269 CRLF checkouts under `core.autocrlf=true`; `.gitattributes`
  now enforces the existing Prettier LF requirement. Formatting normalization preserved all
  tracked application-content hashes; no application behavior changed.
- `pnpm security:secrets` and `pnpm security:artifacts` PASS (0 blocked); `git diff --check` PASS.
  No browser UI behavior changed; this pass exercises recovery through real workerd/D1/R2
  locally and the private deployed resources, not a rerun of the human/browser release matrix.

The implementation hooks are optional commit hooks; surfaced without execution. T058 is
not checked off: persistent production target/monitor activation and CPU headroom remain
distinct gates. T001/T060/T063 are not closed by these scoped results;
the task count stays **52/63 complete**. Final credential, GitHub and teardown results
are retained in the evidence record.

## 2026-11-13 — T001 feasibility checkpoint

**Initial checkpoint:** T001 was blocked on strict recovery expiry and production image-decoder feasibility; the local-development exception was approved on 2026-11-13. Hosting and R2 enrollment were resolved. At that checkpoint no application code or runtime evidence existed. Current local implementation evidence follows; deployment, real mailbox delivery and human acceptance remain open.
T001 findings and primary-source links are in [research R-16](./research.md#r-16-t001-feasibility-checkpoint--2026-11-13).

**Clarification follow-up (2026-11-13)**: Zero new questions asked; one explicit owner
answer recorded in spec.md under Clarifications and Assumptions: use Cloudflare Workers
Static Assets. Synchronized plan, research, tasks, route/API descriptions, data-model gate
status and deployment guidance. Existing React/Hono/D1/R2 boundaries and session behavior
remain intact. No implementation task is marked complete by this documentation change.
Clarification validation: exactly one new Q/A under the dated session; only Clarifications
and Assumptions changed in spec.md. Spec quality checklist **16/16 → 16/16**, with no newly
passing items, regressions or unchecked items; its file is unchanged. The owner-selected host
is an explicit stakeholder constraint, with routing/deployment mechanics kept in design docs.
OpenAPI 3.1 validation and `git diff --check` pass; active design/deployment documents contain
no obsolete host instructions. Both clarification commit hooks are optional and were surfaced
without execution. This is documentation validation, not runtime or deployment acceptance.

### Checks actually performed

| Check                            | Command / method                                                                                                  | Result                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature prerequisites            | `python .specify/scripts/python/check_prerequisites.py --json --require-tasks --include-tasks`                    | PASS; feature `specs/001-radiant-images-website`; research, data model, contracts, quickstart, tasks available                                                                         |
| Requirements checklist           | Count Markdown checkboxes in `checklists/requirements.md`                                                         | PASS; 16 total, 16 complete, 0 incomplete                                                                                                                                              |
| Repository instructions          | Read parent `AGENTS.md`, current plan and constitution v1.0.0                                                     | React/Workers stack and test-first requirements retained                                                                                                                               |
| Hosting/provider feasibility     | Review current primary documentation linked in R-16                                                               | Initial checkpoint blocked on hosting; owner later selected Workers Static Assets and completed R2 enrollment. Expiry/decoder evidence remains incomplete                              |
| Local tools                      | `node --version`; `npm --version`; `pnpm --version`                                                               | 24.14.0; 11.12.0; 9.15.0; no compatibility/build pass inferred                                                                                                                         |
| Registry metadata                | `npm view` with process-local `NODE_OPTIONS=--use-system-ca`, retries disabled                                    | Initial certificate failure resolved using OS trust; Router 7.15.1 peers, Workers test pool 0.23.0/Vitest 4.1 peers, Wrangler 4.162.0 and pnpm 12.18.0 retrieved; installation not run |
| OpenAPI 3.1 structure            | PyYAML 6.0.3 + openapi-spec-validator 0.7.2                                                                       | PASS; contract 0.2.0, 40 operations                                                                                                                                                    |
| Reference resolution             | Walk all local `$ref` JSON pointers in the parsed contract                                                        | PASS; 261 references resolve                                                                                                                                                           |
| Protected-operation declarations | Inspect every operation with `security`                                                                           | PASS; all 31 declare both 401 and 403; declaration check only                                                                                                                          |
| Revised upload/429 declarations  | Inspect required original part, gallery 413 and required Retry-After                                              | PASS; runtime enforcement remains unimplemented                                                                                                                                        |
| Patch whitespace                 | `git diff --check`                                                                                                | PASS                                                                                                                                                                                   |
| Ignore behavior                  | `git check-ignore --no-index` for `.dev.vars`, `.env`, Python cache, editor settings and Wrangler SQLite fixtures | PASS; root `.gitignore` added                                                                                                                                                          |
| Extension hooks                  | Parse `.specify/extensions.yml`                                                                                   | Both implementation hooks optional; surfaced, not executed; no mandatory hook                                                                                                          |

Temporary validation packages were installed under `%TEMP%/radiant-images-contract-validation`,
outside the repository and without changing the global Python environment. Reproduce the
OpenAPI structural check in PowerShell:

```powershell
$validationPath = Join-Path $env:TEMP 'radiant-images-contract-validation'
python -m pip install --disable-pip-version-check --target $validationPath 'PyYAML==6.0.3' 'openapi-spec-validator==0.7.2'
@'
import os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.environ['TEMP'], 'radiant-images-contract-validation'))
import yaml
from openapi_spec_validator import validate
spec = yaml.safe_load(Path('specs/001-radiant-images-website/contracts/openapi.yaml').read_text(encoding='utf-8'))
validate(spec)
print('OpenAPI 3.1 structural validation passed')
'@ | python -
```

### Changes made

- Recorded source-backed hosting findings and a proposed alternative without changing
  the owner's existing hosting constraints or enabling any external resources.
- Corrected Gmail consent scopes and documented D1 application rate windows because
  a 600-second Workers rate-limit binding is unsupported.
- Added private original bytes and explicit byte/pixel limits to the upload contract and
  data model, plus gallery 413 and required 429 Retry-After declarations. API design version
  is now 0.2.0 because the upload request has a new required part.
- Recorded D1's actual free recovery window and the gap between asynchronous R2 lifecycle
  expiry and the specified maximum retention. No retention extension was approved.
- Added repository ignore rules. No Docker, ESLint, Prettier, Terraform, Helm or publishable
  package setup exists yet, so tool-specific ignore files await the applicable setup tasks.

### Decisions and evidence still needed

1. RESOLVED: Owner explicitly selected Cloudflare Workers Static Assets and reports R2
   enrollment complete. The choice is recorded in spec.md, and dependent hosting references
   are synchronized. Deployment access can be configured later; no further host approval needed.
2. Finish T001's bounded server image-decoder/metadata proof and recovery-expiry design.
3. Select/pin one compatible runtime/package-manager/framework/test-pool set and verify it
   in T002/T006. Documentation and installed version strings are not installation evidence.

Once those dependencies are resolved, continue T002 in task order. Keep T001 unchecked
until its obligations are satisfied. Red/green behavior evidence begins with executable
implementation; documentation-only work does not require an artificial failing test.
All SC-001–SC-012 and QR acceptance results remain **NOT RUN**.

## 2026-11-13 — implementation feasibility follow-up

Invoked `speckit-implement`; followed the active feature branch and mandatory T001 ordering.
The owner-selected host and completed R2 enrollment were not reopened. No paid service,
external message, deployment, credential access or production-data operation was performed.
The pre-existing `.specify` integration changes were left untouched and uncommitted.

### Work completed within T001

- Verified current provider documentation for Workers/Static Assets/D1/R2 budgets, actual
  cost controls, rate-limit windows, Images binding/pricing, Gmail scopes/verification
  exceptions, and data-recovery behavior. Source links and limitations are in research R-16.
- Calculated the portfolio/request/storage planning envelope, including media replacement
  churn, staged objects and independent database exports. Account allowance consumption
  and application enforcement remain unmeasured; no $0 invoice guarantee is claimed.
- Queried exact candidate dependency engines/peers and resolved the candidate in an isolated
  temporary directory. The npm operation wrote only a manifest/lockfile outside the repo;
  it did not install application dependencies or establish a working application/toolchain.
- Clarified existing upload validation invariants in data-model.md and the OpenAPI
  description without changing schemas, endpoint signatures, byte/pixel bounds or version.
- Prepared `feasibility-decision.md`: a bounded, explicitly unapproved proposal to continue
  local work while preserving production feasibility/deployment gates. No privacy rule,
  constitution or task dependency has been waived by writing the proposal.

### Validation actually run

| Check                                 | Command / method                                                                                                        | Result                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prerequisites                         | `python .specify/scripts/python/check_prerequisites.py --json --require-tasks --include-tasks`                          | PASS; same active feature and required documents                                                                                                        |
| Checklist/tasks                       | Parse Markdown checkboxes                                                                                               | PASS; requirements 16/16; all 63 tasks still unchecked                                                                                                  |
| Exact dependency metadata             | `npm view <package>@<version> engines peerDependencies peerDependenciesMeta --json`                                     | Retrieved candidate versions recorded in R-16; OS certificate trust enabled, verification not disabled                                                  |
| Dependency resolution                 | `npm install --prefix <probe> --package-lock-only --ignore-scripts --strict-peer-deps --no-audit --no-fund`             | PASS, exit 0, approximately 12 seconds; no runtime/build/vulnerability result inferred                                                                  |
| OpenAPI                               | `openapi_spec_validator.validate` using the existing temporary PyYAML 6.0.3 / openapi-spec-validator 0.7.2 installation | PASS; version 0.2.0; 40 operations                                                                                                                      |
| Contract references/auth declarations | Walk local JSON pointers and inspect protected operations                                                               | PASS; all 261 references resolve; all 31 protected operations declare 401 and 403                                                                       |
| Ignore setup                          | `git rev-parse --git-dir`, config inventory, `git check-ignore --no-index`                                              | Git repository; secrets/dependencies/SQLite/Wrangler/test artifacts/editor fixtures ignored; no Docker/ESLint/Prettier/Helm/Terraform/package setup yet |
| Whitespace                            | `git diff --check`                                                                                                      | PASS                                                                                                                                                    |
| Hooks                                 | Parse `.specify/extensions.yml`                                                                                         | Both eligible implementation hooks optional; no mandatory hook. Optional commit not executed.                                                           |

The unique probe directory was
`%TEMP%/radiant-t001-toolchain-1bd130375489476db90bb9b9af06a0b9`.
It used Node 24.14.0/npm 11.12.0 and the exact dependency candidate in R-16. No global
package-manager change was made. Re-run installation/build with pnpm in T002 after the
gate is resolved; this temporary npm resolution does not replace a committed pnpm lockfile.

### Remaining gate

R2 documentation does not establish the unconditional 30/31-day deletion deadlines.
The Images candidate still needs subscription-eligibility and authoritative decoding
evidence; offline emulation cannot establish either. T001 therefore remains incomplete.
Requested the owner's decision on the proposed local-development exception. Until an
explicit approval arrives, dependent implementation is not started. No behavioral red/green
run was applicable to these documentation and dependency-resolution changes. Runtime,
real-provider, human and release acceptance remain NOT RUN.

## 2026-11-13 — approved exception and setup

Owner explicitly approved the local-development exception: "yes, apply the exception and
continue with implementation". It is now active; T001 remains a deployment gate.

T002–T005 completed. Pinned pnpm 12.18.0 installed successfully, lockfile generated;
`pnpm typecheck`, `pnpm lint`, and `pnpm build` pass. Public route stubs prerender and the
SPA fallback is generated. These are test-harness placeholders, not implemented pages.
Current maintained tooling corrections: `@cloudflare/vitest-plugin@1.8.2` replaces the
deprecated pool package; ESLint 10.15.0 replaces deprecated 9.x; `oauth4webapi@3.8.8` and
`jose@6.2.17` replace unsupported Arctic. Same architecture/provider/test boundaries.
pnpm 12 uses `allowBuilds` and workspace settings; exact esbuild/workerd/sharp build
approvals are recorded. The initial native-build-policy and Router runtime configuration
errors were fixed; they are setup failures, not behavioral red evidence.

T006 red: `pnpm exec vitest run --project=tooling` observed seven behavioral failures
(wrong email retry flag accepted, missing 401/403 accepted, remote test targets allowed).
Green: implemented strict response/status/header checking and explicit loopback protection.
Provider/clock red: `pnpm exec vitest run --project=api apps/api/tests/providers.test.ts`
observed 200 instead of requested 503 and epoch instead of controlled time. Green after
fixture implementation. `pnpm test`: 14 tests pass across tooling, workerd D1/R2 and RTL.
`pnpm e2e:smoke`: two local built-HTML/API-boundary smoke tests pass in Chromium desktop
and mobile emulation (Chrome for Testing 159.0.8154.6, Playwright 1.65.1). This proves
harness execution only, not functional UX, performance, physical-device or release criteria.
Schema-specific reset/seeding and additional CI integrity checks are being completed.

## 2026-11-13 - local foundation and inquiry implementation

All evidence below is synthetic and local under the approved exception. No live email,
production deployment, physical-device, image-decoder or strict retention proof is claimed.
The prior “not started until approval” entry is historical and superseded by the approval.

Commands use the pinned pnpm 12.18.0 runner, Node 24.14.0, Windows, with OS CA trust
(`NODE_OPTIONS=--use-system-ca`) and Wrangler metrics disabled.

| Tasks                     | Behavioral red observed before implementation                                                                                                       | Green evidence                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T007                      | Six migration/seed/constraint failures against the empty schema                                                                                     | db.test.ts: 6 pass; 22 tables, cascades, singleton pricing pointer, rollback, image cap, local-only seed                                                 |
| T008                      | Shared bounds/public projection/error retry-flag failures                                                                                           | common.test.ts: 7 pass                                                                                                                                   |
| T009                      | CORS, bounded-body, sanitized error/audit and atomic-rate failures                                                                                  | middleware.test.ts: 6 pass                                                                                                                               |
| T010-T011                 | Identity grant/session, replay, rollback, claims and expiry failures; signing-key outage returned 400 instead of 502                                | auth.test.ts: 15 pass; signing-key outage corrected to 502                                                                                               |
| T012                      | Four browser failures: no exchange, fragment retained, no expiry clearing, missing recovery link                                                    | web auth.test.tsx: 4 pass; no exchange retry; local logout survives outage                                                                               |
| T013                      | Eight provider failures: unsafe MIME accepted, no dispatch, wrong delivery classifications, missing abort/verification                              | providers.test.ts: 8 pass; consent.test.ts: 1 pass after loopback/PKCE/scope red                                                                         |
| T014                      | Bootstrap/published variants returned 404                                                                                                           | public.test.ts: 2 pass; private config and originals excluded                                                                                            |
| T015                      | Missing landmarks, refresh and metadata                                                                                                             | publicContent.test.tsx: 3 pass; 25-second polling + 20-second edge cache + 10-second request deadline; visibility/focus refresh; last good data retained |
| T018-T019                 | Three schema and seven inquiry failures (permissive validation / 404 instead of expected outcomes)                                                  | shared inquiry.test.ts: 3 pass; API inquiries.test.ts: 7 pass                                                                                            |
| T020-T023 local UI        | Browser navigation/contact lacked headings/form; component tests lacked draft recovery, errors and gallery; trailing-slash metadata wrongly private | web inquiry.test.tsx: 5 pass; six Chromium desktop/mobile discovery/recovery-address smoke cases pass                                                    |
| T024                      | Page/FAQ writes returned 404; editor lacked draft field                                                                                             | API content.test.ts: 3 pass; web content.test.tsx: 1 pass; failed FAQ batch retains previous rows                                                        |
| T006 additional isolation | Synthetic reset accepted a remote origin and did not seed/clear state                                                                               | e2e-adapter.test.ts: 1 pass; separate local test D1/R2, pre/post-case reset, controlled time, provider-only doubles                                      |

`pnpm test`: 18 files / 84 tests pass. `pnpm typecheck`, `pnpm lint`, and production
build (API dry-run only) pass at this checkpoint. Built public HTML, route bundles,
SPA fallback and sitemap are generated. Later changes must be verified again.

Gmail/Turnstile adapters were checked against primary documentation:

- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/list
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

T006 remains partial pending final CI/contract coverage and diagnostic artifact policy.
Raw Playwright traces are currently disabled because they retain bearer/token HTTP data;
synthetic screenshots remain enabled. Do not describe these as sanitized traces.
T016/T017 retain additional integration/browser assertions; T023 still needs owner-approved
privacy copy. T025 real-mail denominator, participant timings and content approval are NOT RUN.
T060 direct-load tests observed 501 responses for admin deep links/missing assets before
fallback implementation; final green verification is in progress. No workflow deployment occurred.

### US1 browser and routing follow-up

`pnpm exec playwright test e2e/inquiry.spec.ts e2e/deployment.spec.ts
--project=chromium-desktop --project=chromium-mobile`: 22 pass in a clean 29.2-second run.
The preceding run had 21 pass / one reset ECONNRESET while formatting reloaded the watched
Worker; no feature assertion failed in that run. The clean run followed cessation of edits.
Cases include real local API delivery, provider and browser response loss, no timer-based
resend, fresh-CAPTCHA acknowledged restart, confirmed-receipt finish, typed definite failure,
phone validation/error focus, all seven routes at 320/768/1280 pixels, private fallback
loads and missing-asset 404. These layout fixtures do not yet contain 60 portfolio images.
T060 fallback uses the generated __spa-fallback.html through the Static Assets canonical
path and applies no-store/noindex/no-referrer. Deployment workflows/HTTPS/rollback remain open.
Routine browser CAPTCHA is now always doubled at the external script boundary, including
read-only navigation cases; no live verification is needed for routine tests.

### T026-T030 local pricing

API pricing.test.ts: four initial behavioral failures (404), followed by an ordering defect
between PUT and GET responses. Green after implementing immutable batch publication and
consistent Maternity/Newborn/Family order: 4 pass. Equal-time concurrent publication selects
the last committed complete revision; failed pointer mutation rolls back rows and pointer.
Web pricing.test.tsx: two initial missing-control failures, then 2 pass (failed publish
preserves edits, missing-type validation, failed PDF keeps web and print available).
Tooling pricing-pdf.test.ts: initially empty Blob, then 1 pass (%PDF header, nonempty PDF).

Built Chromium desktop/mobile pricing suite: 4 pass. Initial browser print assertions used
the wrong `hidden` option; corrected to Playwright `includeHidden` after adding tools/E2E
typechecking. This was a test defect, not a print-layout product defect.
Owner publication browser journey passes through the real callback/exchange/session and
pricing endpoints with a synthetic preverified identity grant fixture; it does not establish
live Google consent. An already-open Family page updates from $250.00 to $350.50 within the
60-second budget (full journey 26.3 seconds). No real pricing or receipt evidence is claimed.

PDF review used pypdf 7.1.0 and MuPDF 2.1 in ignored .venv (Poppler not installed). Text
extraction initially found revision text, but page rendering revealed an off-page absolute
footer. A visible-text/bounds assertion reproduced the defect before changing the footer to
normal document flow. Rebuilt browser download: 2 desktop cases pass; read-only
`scripts/check-pricing-pdf.py <download> --revision 01K00000000000000000000001` passes.
All three PNG pages were visually inspected: no clipping; each shows the $250.00 fixture,
correct shoot type and visible publication/revision footer. Physical print review, final
owner content and the wider release matrix remain open in T031/T063.

Expanded `pnpm typecheck` to tsconfig.tools.json. This exposed unsupported Vitest `forbidOnly`.
A temporary `.only` probe initially passed (defect); replacing it with per-project
`allowOnly:false` makes it fail with “Unexpected .only modifier”. A root-only setting did
not propagate. The temporary probe was removed after verification. All four Vitest projects
now enforce the policy, and tooling/browser typechecks pass.

## US3 gallery implementation: local red/green evidence

- T032/T034: `pnpm exec vitest run --project=api apps/api/tests/gallery.test.ts`
  first failed all seven cases with missing routes (404); after implementation seven
  passed against real local D1/R2. Covered staged upload compensation, concurrent cap
  of 60, required/trimmed alt, forged metadata/claims, tag-only edit, atomic order,
  private originals, failed deletion preservation, and unconfigured production decoder
  rejecting publication. Production decoder proof remains OPEN under T001.
- T033/T035: browser conversion and editor tests first failed on missing behavior;
  four then passed for orientation-aware sizing, format rejection before decoding,
  unsupported encoder recovery, required alt and failed-upload draft preservation.
- Local image service: a behavioral 503-to-200 red/green test verifies the loopback
  HTTP adapter with actual Sharp decoding and malformed-input rejection. Synthetic
  fixtures contain only generated solid colors. The service is excluded from the
  production Worker and does not prove Cloudflare Images entitlement or feasibility.
- The first complete browser journey caught a real list-response mismatch; the next
  caught Chromium canvas output carrying ICC metadata. Added a failing metadata
  stripping test before the fix; strict ancillary-chunk removal now follows the
  [WebP RIFF specification](https://developers.google.com/speed/webp/docs/riff_container).
  Public canvas output uses sRGB. A full-decode test corrupts PNG pixel data while
  preserving valid header dimensions/chunk lengths; the local decoder rejects it.
  The focused browser/tool suites pass 10 tests. Full-stack rerun is in progress.
- Recovery manifests retain deleted-image originals and derivatives privately with
  a 28-day target expiry. Scheduled reconciliation/cleanup is still T058; the R2
  unconditional physical deletion deadline remains the approved T001 release gate.

### US3 local completion checkpoint

- Full-stack Chromium desktop/mobile upload → oriented public image → reorder/edit →
  remove journeys passed (2/2). Each already-open publication/removal assertion completed
  within its 60-second bound; whole journeys took approximately 60 and 51 seconds.
- A separate real API/D1/R2/decoder run uploaded 60 synthetic images, disabled upload at
  capacity, and verified Home ordering, Newborn filtering, empty Maternity, and no horizontal
  overflow at 320/768/1280px (passed, 5.2 seconds). No production entitlement was exercised.
- API suite expanded to 9 passing cases: omitted alt, all gallery operations with missing,
  expired and removed-owner credentials, and D1 delete failure after R2 deletion restoring
  all four stored objects. Strict operation-level contract coverage remains in T059.
- T033/T035/T036 local obligations are complete. T034 remains partial because production
  authoritative decoding and scheduled interrupted-operation reconciliation are still open.

## US4 banners: local red/green checkpoint

- API tests first failed 3 behavioral cases with 404 (authorization already denied by
  the shared guard). Shared schema/timezone tests failed 2 cases before implementation.
  Six then passed covering UTC normalization, exclusive end, overlap/creation priority,
  safe links, invalid calendars, DST gaps/folds, non-hour offsets, atomic audit rollback,
  and missing/expired/removed-owner sessions.
- UI tests first failed missing editor/banner behavior. Additional regressions reproduced
  a stale local clock after resume and rendering saved banners before timezone loading;
  all 4 component tests pass after fixes. Local expiry removes the banner even if the
  API cannot refresh it. The editor preserves failed-save drafts.
- The initial full-stack Chromium desktop scheduling/resume/overlap/delete/outage expiry
  journey passed (1.1 seconds with a controlled browser/Worker clock). The expanded
  desktop/mobile journey adds edits and every public route; results recorded next.

## US5 settings: local red/green checkpoint

- Three API tests first failed with 404; all pass after protected configuration routes.
  Invalid addresses/options/timezones, missing public contact, unverified sender, provider
  outage, and audit failure leave the old complete configuration intact. Sender verification
  now distinguishes unavailable (502) from unverified (400). A subsequent synthetic inquiry
  uses the saved private recipient/sender; the public projection exposes only approved fields.
- The UI test failed on missing fields, then passed. Public contact is explicitly labeled
  as displayed and monitored; empty options are blocked and failed-save edits are preserved.
- At this checkpoint the full Vitest suite passes 31 files / 124 tests; typecheck, lint and
  web production build pass. Browser settings/expanded banners are running. Live-mail and
  human acceptance remain OPEN under the local-only exception (T046/T063).

### US4/US5 browser completion (local)

- Expanded banner checks passed on Chromium desktop/mobile, including editing, next-load
  display on all seven public pages, overlap/deletion, background resume, and local expiry
  during a bootstrap outage. The controlled clock measures scheduling behavior; it does not
  replace deployed clock/cache evidence or human comprehension review.
- Settings journeys passed on Chromium desktop/mobile (26.1/26.0 seconds for the complete
  workflows). Already-open recovery-email/options updates were each strictly under 60 seconds.
  Removed selected locations remain labeled “no longer available”; submission requires a
  current selection while preserving the draft. Synthetic dispatch then used the new private
  recipient and unchanged sender. Unverified sender saves were rejected and reload restored
  the last saved settings. Real mailbox delivery is still OPEN (T046/T063).

## US6 backend red/green checkpoint (2026-11-14)

- `clients.test.ts`: five initial behavioral 404 failures, then seven passing cases including
  manually entered CRUD/search, complete ordered checklist propagation/rollback, new-client
  initialization, ID/time-only deletion receipts, interrupted deletion/retry, concurrent
  ledger entries, fail-closed missing ledger/receipts, and retained template references.
  Search first exposed an SQL ESCAPE defect; fixed using a literal ! escape, retaining
  bound parameters and literal wildcard handling.
- `workflow.test.ts`: five behavioral failures against runnable placeholders, then five
  passing validation/expansion/snapshot tests. Optional session dates preview as “Not
  scheduled”; optional phone/date persist as null. Expansion is single-pass and previews
  retain {{questionnaireLink}}. Questions are capped at 40; short/long answers at 300/4000
  trimmed characters, within the shared 64 KiB request envelope.
- Migration `0002_lifecycle.sql` followed a failing schema inventory test. It records the
  independent recovery-ledger identity and one-way initialization state. The ledger head
  uses R2 conditional ETag writes; receipt keys contain only client ID/deletion time. A
  missing initialized ledger is never recreated implicitly. Restore and retention replay
  remain T058, and physical expiry guarantees remain T001.
- `questionnaire.test.ts`: six initial behavioral 404 failures; eight tests now pass for
  immutable snapshots, concurrent single-use submission, exact expiry, deletion/isolation,
  validation, rollback of answers plus claim, ordinary email, shared invitation expansion,
  all-occurrence history redaction, rejected/uncertain delivery, and known acceptance with
  history failure. Tokens remain transient in the provider double; assertions use booleans
  for token comparisons to avoid diagnostic disclosure.
- The current focused API run passes 21 tests across clients/questionnaires/migrations.
  Typecheck and lint pass. US6 browser/editor work and full release gates remain open.

## US6 interface and local workflow checkpoint (2026-11-14)

- Master-editor, client-detail and public-questionnaire component checks pass (3, 5 and 2
  cases respectively). Draft preservation, immutable invitation labels, delivery uncertainty,
  accepted-but-unrecorded sends, and explicit submission-status recovery are covered.
- The first full browser journey exposed a controlled checkbox reverting before server
  acknowledgment. A focused component reproduction failed; optimistic state with rollback
  made it pass. A subsequent run started while the web build was still completing and timed
  out loading client details. After build completion, all six Chromium desktop/mobile
  client journeys passed without retry (40.8 seconds total). Complete workflow times were
  24.8/5.3 seconds, synthetic automation only; human three-minute acceptance remains OPEN.
- The workflow covers independent clients, checklist addition/rename/reorder, failed
  propagation, all-incomplete new-client initialization, placeholder preview, transient
  invitation delivery, visitor submission, immutable question/choice history, safe invitation-ID
  navigation, isolation, and deletion invalidating the public link. T054–T056 are implemented.
  T057 still needs actual mailbox receipt and owner timing.
- Tokenized journeys disable screenshots/traces. A deliberate failing diagnostic probe
  confirmed raw synthetic tokens were absent from console output and the decoded HTML-report
  archive after reporter sanitization. The probe was removed. Full artifact/security gates
  remain T059/T062; this is not a blanket artifact guarantee.

## Operations checkpoint (2026-11-14, local exception)

- Four initial behavioral failures covered backup absence, unsafe restore acceptance,
  missing-ledger acceptance, and missing transient cleanup. Nine cases now pass: private
  snapshots excluding transient credentials/dedupe/rates; deletion replay before reopening;
  missing/incomplete ledger refusal; expiry/checksum refusal; atomic import rollback;
  cleanup outage/retry; private original/variant recovery; and bounded health signals.
  Another red case caught token-bearing history entering a backup; capture/restore now reject it.
- Focused operations/client/questionnaire/migration: 30 tests passed. Typecheck passes.
  `operations:local backup`, `restore <returned-key>`, and `reopen` were rehearsed successfully
  against isolated synthetic .wrangler/e2e state. No remote operation ran.
- Migration 0003 preserves ledger identity and adds durable restore status: live, blocked,
  verified-but-closed. Failed restore stays blocked; success still needs explicit reopen.
  No HTTP restore endpoint exists. Cron runs cleanup every five minutes, backup/health daily.
- Recovery copies target day 28 and restore refuses them at expiry. Receipt retirement
  starts at day 31 after overdue copies are deleted and absence verified. ETag updates and
  a resumable retirement list preserve concurrent deletions/interrupted cleanup. These local
  controls do not prove unconditional physical expiry during provider outages; T001/T058
  production retention and monitoring validation remain OPEN.
- D1 batch transactions and current per-invocation accounting were verified in
  [binding documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/) and
  [limits](https://developers.cloudflare.com/d1/platform/limits/). Snapshot/import uses atomic
  batches, bound values, and a fixed table/column allowlist. Snapshots are capped at 16 MiB;
  larger-database operational feasibility requires separate validation.
- Initial expanded contract run: 18 files / 104 checks pass. Existing API response witnesses
  now pass through operation-specific OpenAPI assertions. All operations declare maintenance;
  all body-bearing methods declare 413. Exhaustive authorization inventory is still in progress.

## Release-check progress (2026-11-14)

- The authorization inventory now verifies all 31 protected operations against missing,
  expired, non-owner and removed-owner sessions. Auth plus declaration/contract checks passed
  57 tests. Response assertions are applied to real local API integration responses, including
  the three distinct email failure contracts. Maintenance and all applicable body-size errors
  are declared per operation. No raw response payload is printed on a contract mismatch.
- Public and owner automated axe WCAG 2/2.1/2.2 A/AA checks and public keyboard skip-link
  navigation passed on Chromium. All seven public prerenders expose headings, descriptions,
  canonical metadata and sitemap entries; private routes have no canonical and are noindex.
  Screen-reader, physical-print and owner photo-alt review remain OPEN.
- Header tests first failed because CSP was absent. Static assets now use a generated policy
  with exact inline-script hashes; Worker fallback responses independently apply the same
  policy. API responses deny script execution. Chromium and WebKit hydration checks passed.
  Firefox exposed Zod's optional eval-based JIT probe; configuration now disables it before
  shared schema construction, following [Zod's CSP guidance](https://zod.dev/compile).
  Firefox's executable disappeared after launch on this runner, including after a normal
  Playwright reinstall; the final Firefox rerun is not yet verified. No security settings
  were disabled or exclusions added.
- `pnpm audit` initially reported two moderate development-only transitive vulnerabilities.
  Scoped overrides use esbuild 0.25.12 and minimatch 11.0.8. Audit now reports no known
  vulnerabilities; lint and types pass. Primary advisories:
  [esbuild](https://github.com/advisories/GHSA-67mh-4wv8-2f99),
  [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).
- Privacy gates followed failing token/archive tests. They inspect repository secret patterns,
  decoded HTML-report ZIP text and diagnostic text, reject raw trace ZIP uploads, and only
  allow artifact upload after a passing scan (seven-day retention). Both local scans pass.
  Binary screenshots remain limited to synthetic non-tokenized journeys; live traces are
  excluded. This gate does not replace content review or justify introducing real data.
- Separate API/web deployment workflows are prepared, with same-commit Quality checks,
  manual dispatch, production-environment review configuration and an exact evidence commit.
  The release guard was observed rejecting current unchecked tasks before preparing any
  remote configuration. No deploy/migration/secret upload was attempted.

### Provisional performance evidence

The owner-approved photograph fixture is unavailable. The versioned manifest explicitly
records `approvedPhotos: false` and `kind: synthetic-load-only`. Sixty distinct deterministic
textures meet the prescribed 2000/800/320 dimensions and 150–160/56–64/12–16 KiB envelopes,
with exact sizes and SHA-256 hashes. These measurements are provisional local engineering
evidence; they do not satisfy the approved-photo, deployed-provider, or field-data gates.

The profile seeds 200 synthetic clients, nine pricing packages, four required FAQs, service
content, contact options, an active banner and one immutable ten-question invitation. A bad
How It Works fixture shape initially caused a bootstrap 500; a failing API reproduction
preceded correcting the fixture to title/body objects. No failed timing sample was relabeled
as a successful run.

All 13 JSON GET operations passed ten warm-ups then 100 samples at concurrency five, expected
200 bodies fully read and caches bypassed. Nearest-rank p95 ranged from 37 to 311 ms, all
strictly below 500 ms. Raw samples and runner details are retained in
[local-api-latency.json](./evidence/local-api-latency.json). Mobile cold-load and inquiry
measurements are still in progress; no full SC-004/009 pass is claimed.

The 20 independent mobile inquiry samples passed, each between 888 and 913 ms from first
Submit to visible acceptance, with a cold refresh token and fixed 200 ms CAPTCHA/provider
boundaries per run. Raw timings are in [local-inquiry-latency.json](./evidence/local-inquiry-latency.json).
This does not measure mailbox receipt, live Turnstile, deployed latency or human typing.

The first cold-load interaction attempt found that the prerendered mobile Menu could accept
a click before hydration installed its handler. A component test reproduced the missing
disabled state. The Header now uses React's server/client store snapshots to enable the
button only once hydrated; the component check passes, including open/Escape/focus behavior.
The cold-load suite is being rerun against the rebuilt frontend; its earlier failure remains
recorded and is not a passing timing sample.

The completed first 40-run cold baseline is retained in
[local-mobile-baseline.json](./evidence/local-mobile-baseline.json). Service-route usable
medians were 3448–3527 ms, exceeding 3000 ms; service/contact layout shift reached 0.877
and About reached 0.142. These are failures. Focused component tests then reproduced a
redundant initial fetch and incorrect empty-gallery state. The prerender now starts a bounded
public bootstrap request before hydration; the provider consumes it once, retaining periodic
refresh. Pending galleries, service copy and the contact form reserve layout space. Both
component checks now pass. The unchanged 40-run profile is being repeated after rebuilding.

Additional inquiry API validation checks passed for conditional phone, forged recipient,
date/numeric/message bounds and blank optional fields (18 inquiry API cases in the focused
run). Browser coverage for the full optional form and API-outage contact recovery is pending.

The second cold run recorded 33 samples before the runner reported a 2.8-hour elapsed test
and hit its 600-second timeout; the retained partial data is
[local-mobile-layout-fix.json](./evidence/local-mobile-layout-fix.json). It contains the
20,544 ms Home LCP outlier and service medians 3298–3386 ms; no samples were discarded.
Service, About and Contact layout shift dropped to 0.056, while FAQ revealed a separate
0.244 shift. The FAQ now reserves its answer region. A failing preload test preceded adding
a responsive, same-API-origin preload for the first service photograph, with its bytes still
included in the viewport transfer budget. Another complete profile is required.

Generated 404/405/503 web responses initially failed three security-header tests; they now
retain no-store, noindex, no-referrer, nosniff and a deny-all script policy. A valid 80-character
client search returned 500 in the real local D1 test, matching the documented
[50-byte LIKE/GLOB pattern limit](https://developers.cloudflare.com/d1/platform/limits/).
Bound literal substring search now handles the accepted 200-character range, case folding
and wildcard-looking text. Focused search/preload/header checks pass 13 tests.

## Final local verification in progress (2026-11-14)

- The complete Vitest run passed 49 files / 224 tests in 68.97 seconds, including real local
  Worker/D1/R2 transactions, failure injection, strict operation contracts and all protected
  operations. Formatting, lint and TypeScript passed; web production prerenders/security
  generation and API dry-run build passed. Earlier typecheck issues in test options and
  optional bootstrap state were corrected before this run.
- Repository privacy scan checked 371 files with no blocked findings. Dependency audit
  reports no known vulnerabilities after scoped development dependency overrides.
- A normal pinned Firefox reinstall repeatedly failed with Windows EPERM while opening
  firefox.exe. After repeated installer attempts it was stopped. Firefox remains BLOCKED on
  this runner, not passed or removed from CI. No security configuration was changed.
- The full non-performance Chromium desktop/mobile and WebKit desktop/mobile matrix is
  running 112 cases. Performance runs separately to avoid concurrent CPU contention.

The first complete browser matrix exposed two regressions. A repeated banner save retained
the preceding success message while its request was pending; a focused component test failed
before adding explicit saving/deleting status and now passes (5 banner cases). The pricing
PDF failed because CSP blocked Yoga's bundled WebAssembly data URI. The policy now allows
that embedded data fetch and the narrower `wasm-unsafe-eval`, while continuing to exclude
JavaScript `unsafe-eval` and additional network origins. This distinction follows
[the browser CSP documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution).
A policy assertion failed before the change and passes afterward; built browser reruns are
still required. A diagnostic response-header interception could not verify the PDF because
Chromium classified the fulfilled document outside the loopback address space; this is not
accepted as product verification.

WebKit's keyboard run then reproduced an unfocusable skip link under its default link-tabbing
behavior. A direct page probe confirmed that explicit tabindex=0 makes Tab reach the link;
the component assertion failed before adding that attribute and all four public-content
component tests now pass. The browser keyboard/axe rerun will verify Enter reaches main.
The quickstart now reflects implemented local scripts, separate synthetic and normal dev
servers, trace restrictions, and manual gated deployment instead of obsolete planned commands.

During the matrix the tool host timed out/restarted and wall time jumped about 50 minutes.
WebKit mobile's keyboard test recorded 49.7 minutes and the following questionnaire/detail
case timed out on initial navigation. These failures remain recorded; the changed keyboard,
PDF and banner paths plus affected WebKit accessibility cases will be rerun after rebuild.

The next performance run tightens the readiness probe: loaded FAQ/About content and the
active fixture banner are asserted; viewport decode/paint precedes the first input so LCP
observation is not ended early. Earlier timing files remain historical partial evidence.
Browser Date is fixed to the API fixture instant while performance timers/RAF run normally,
preventing a long local session from expiring the fixture banner. Navigation phase timings
are retained to diagnose future startup outliers. All thresholds and five cold runs remain.

The first four-project non-performance matrix completed with 104 passing / 8 failing /
0 flaky / 0 skipped cases. Counts are retained in
[local-browser-baseline-summary.json](./evidence/local-browser-baseline-summary.json).
All contact, gallery, client, settings, SEO and deep-link cases passed on these four projects;
known failures and the runner interruption are described above. Artifact privacy checked
18 generated files with zero blocked findings before starting the corrective run.
A rebuilt 44-case run now covers accessibility, banners, pricing, CSP hydration and client
workflows in all four projects. The client history journey additionally deletes/reorders
master questions after submission and checks original prompts, choices, answer values and
order across three captured question types.

The JS budget now also counts inline script bytes (uncompressed, a conservative addition to
encoded external-resource sizes), including the new early bootstrap/preload script. This
avoids excluding executable inline code from the transfer check. No threshold was increased.

The rebuilt correction matrix passed 43/44 cases. All eight original failing paths now
pass, including PDF/print, banners, and WebKit keyboard/axe. Its summary is retained in
[local-browser-corrections-summary.json](./evidence/local-browser-corrections-summary.json).
The expanded WebKit mobile owner workflow saw an empty email after the automation fill;
other project runs and its earlier complete journey passed. A consecutive-field component
probe passed without a product change. The browser helper now explicitly verifies all three
entered values before Submit; a single diagnostic rerun is pending. The original failure
is not removed or treated as a clean matrix pass.

Final formatting/lint/types passed, and the complete regression suite passed 49 files /
225 tests in 67.96 seconds after the banner, CSP and skip-link fixes. The additional
consecutive-field probe passed in the six-case client component run.

The single diagnostic WebKit mobile owner-workflow rerun passed in 12.2 seconds with the
entered-value assertions. Across the initial/corrective runs, all 112 non-performance
project/case combinations have passing evidence, but the intermittent input failure remains
recorded and T059 is not marked complete. Firefox also remains blocked by Windows EPERM.
The release guard and CI fail-on-flaky policy remain unchanged. T048 and T062's implemented
local coverage is complete; this is not a real-device, real-mail or production approval.

A measurement-harness defect was detected before any new cold-load sample was recorded:
Playwright's fixed-time helper replaced Performance entries, leaving navigation timing absent.
The failed attempt is not timing evidence. The profile now sets the API fixture date to the
runner's current date immediately after each reset and leaves browser Date/Performance APIs
native. Each cold result records its fixture instant; banners and invitations stay valid
without changing browser measurement behavior. A complete native-clock rerun follows.

## Final local performance and release gates (2026-11-14)

The native-clock mobile rerun completed all 40 cold samples: five per public route, with
fresh browser contexts, caches disabled, 375×812 viewport at DPR 1, 4× CPU slowdown,
1.6 Mbps down / 750 kbps up / 150 ms RTT, and the full synthetic fixture. No other heavy
verification ran concurrently. The unchanged usable, LCP, CLS and transfer thresholds all
passed. Raw samples, navigation phases, runner/browser versions and fixture instants are in
[local-mobile-final.json](./evidence/local-mobile-final.json).

| Route                          | Usable median (ms) | Maximum LCP (ms) | Maximum CLS | Maximum JS bytes | Maximum viewport image bytes |
| ------------------------------ | -----------------: | ---------------: | ----------: | ---------------: | ---------------------------: |
| Home                           |               1823 |              836 |       0.056 |           150657 |                            0 |
| Maternity                      |               2488 |             2304 |       0.056 |           187584 |                        59572 |
| Newborn                        |               2497 |             2304 |       0.056 |           187577 |                        57580 |
| Family                         |               2481 |             2316 |       0.056 |           187573 |                        59804 |
| About                          |               2007 |              940 |       0.056 |           184938 |                            0 |
| FAQ                            |               1988 |              948 |       0.056 |           184837 |                            0 |
| Contact                        |               2093 |              952 |       0.056 |           154432 |                            0 |
| Questionnaire (token redacted) |               1876 |             1616 |       0.006 |           147236 |                            0 |

Scripted interaction elapsed times were 16.2–68.3 ms; these are lab probes, not field INP.
JS totals include inline code. Images are deterministic load textures, not approved portfolio
photographs. These are provisional local results and do not close T061 or SC-004/009's
remaining approved-content, deployed-provider and field-data requirements. The earlier
failures and interrupted runs remain retained above.

The latest JSON-read profile again passed all 13 operations, each with ten warm-ups and
100 fully read responses at concurrency five. Nearest-rank p95 ranged from 30.9 to 197.0 ms,
strictly below 500 ms; see [local-api-latency-final.json](./evidence/local-api-latency-final.json).
Twenty further independent mobile inquiry submissions took 889.9–927.6 ms, all below five
seconds; see [local-inquiry-latency-clock-run.json](./evidence/local-inquiry-latency-clock-run.json).
Those two files precede the native-browser-clock correction: the read profile has no browser,
and inquiry elapsed time uses Node's native performance clock. The inquiry run is valid
Submit-to-visible-provider-acceptance evidence, not browser resource timing or mailbox receipt.
Its historical runner clock description does not imply that browser Performance entries were
usable. Both runs use external-provider doubles with the specified delays.

Two final deployment regressions were reproduced before fixes: reserved example/test origins
were accepted, and the actual prepare-release CLI wrote the owner allowlist into plaintext
configuration. The release guard now rejects reserved domains and literal IP hosts for public
origins/contact configuration. The CLI omits `OWNER_ALLOWLIST` and `GOOGLE_CLIENT_ID`, which
remain separately provisioned Worker secrets. Both regression tests pass. A Windows test-loader
setup error was fixed before observing the real failing assertion; it is not counted as red.

### Outstanding task evidence

The approved exception's independent local implementation is complete. **51 of 63 tasks are
checked; 12 remain open** because their full acceptance requirements are not met:

| Task | Completed local portion                                                                             | Evidence still required                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T001 | Provider research, fail-closed boundaries and approved exception                                    | Unconditional physical recovery/receipt expiry and production decoder entitlement/resource proof                                   |
| T023 | Complete validated contact and uncertain-delivery recovery flow                                     | Owner privacy copy and approved, monitored public contact address                                                                  |
| T025 | US1 API/component/browser and controlled inquiry timing                                             | Real mailbox delivery and predeclared human acceptance                                                                             |
| T031 | Pricing parity, navigation, browser print/PDF and local PDF inspection                              | Physical print and owner content/readability acceptance                                                                            |
| T034 | Local authoritative decoding, upload/publication, metadata removal and failure cleanup              | Production authoritative decoder evidence under T001                                                                               |
| T046 | Settings, stale-form and controlled propagation checks                                              | Changed-recipient real-mailbox acceptance                                                                                          |
| T057 | Integrated owner workflow, isolation and immutable history                                          | Actual mailbox receipt and unassisted three-minute owner timing                                                                    |
| T058 | Private backup, restore/deletion reconciliation, media recovery, cleanup and health tests/rehearsal | Physical expiry guarantees and production monitoring/alerting proof                                                                |
| T059 | CI definition, strict contracts, privacy gates and a later 150/150 combined functional matrix       | Remote CI execution and unresolved historical WebKit input loss; passing local runs do not establish its cause or a fix           |
| T060 | Separate guarded workflows and built local fallback/security checks                                 | Real HTTPS deployment and remote rollback rehearsal                                                                                |
| T061 | Automated axe/keyboard, SEO, responsive layouts and provisional lab performance                     | Screen-reader/photo-alt review, approved photo fixture and deployed/field evidence                                                 |
| T063 | Local quickstart coverage and release acceptance register                                           | Actual browser/device matrix, live/human acceptance and owner content/privacy approvals                                            |

No live messages, real-client imports, paid subscriptions or public deployments were performed.
The release guard continues to refuse deployment while any task is unchecked. The exception
does not relax retention, privacy, image validation or hosting requirements.

Final regression validation passed **50 files / 227 tests** in 125.22 seconds. Formatting,
ESLint, all TypeScript projects, the seven-route production prerender/security build and API
dry-run build passed (`pnpm check`, exit 0). The lazy PDF bundle still emits a build-size
warning; it is loaded on download and the measured initial-route JS budgets pass. The first
final-check attempt reported two tooling
lint issues (an unnecessary regex escape and a throw inside finally); both were corrected
before this passing regression run. Repository privacy scanned 377 files and artifact privacy
scanned five files with zero blocked findings. The dependency audit found no known
vulnerabilities. These results do not erase the separate browser failures recorded above.

### Firefox installation retry requested by owner (2026-11-14)

The owner requested another Firefox installation attempt while preparing a Norton rule.
`pnpm exec playwright install firefox` downloaded pinned Firefox 159.0 / build 1572,
but all five installer attempts failed with Windows `EPERM` when opening
`%LOCALAPPDATA%\ms-playwright\firefox-1572\firefox\firefox.exe`; the command exited 1.
The executable was absent on inspection. Norton rule activation has not been confirmed;
no Firefox test run or successful installation is claimed. No antivirus settings were
changed by the agent. The existing Firefox verification gate remains open.

The owner then confirmed an exclusion for the exact executable path. A new normal installer
run still failed all five attempts with the same `EPERM` and exited 1. The browser cache's
ACL grants the current user FullControl, and no Firefox process was running; the installer
removed its incomplete target directory. The error alone does not identify the blocking
security component. Norton Security History details and the exclusion type were requested
before further changes. Firefox installation and browser verification remain blocked.

After the owner reported temporarily disabling malware protection, another requested normal
installation retry again failed all five attempts with `EPERM` at the same executable and
exited 1. The executable remained absent. Read-only checks showed Windows Defender was not
running and no matching recent Defender detection/block events were found. The owner was
advised to re-enable Norton because the temporary pause did not resolve installation. No
security settings were changed by the agent and no Firefox suite was started; the exact
blocking component remains unconfirmed.

On the owner's next request, the normal Playwright installation again ended with `EPERM`
at the same path (exit 1). A separate direct download from Playwright's official CDN succeeded:
`Downloads/playwright-firefox-1572-win64.zip`, 132,237,406 bytes, SHA-256
`17abdb829293f482dae4c85be9e0dff5995a66457d8b3ca7a7efc6f5ef9c08c5`.
ZIP inspection found 77 entries, including the 1,139,712-byte `firefox/firefox.exe` entry;
this verifies the executable is present in the downloaded archive, not that it is installed
or runnable. The blocked executable was not relocated or renamed to bypass protection.

The additionally requested Windows executable was downloaded through Mozilla's official
[Firefox download page](https://www.firefox.com/en-US/download/windows/) into
`Downloads/Firefox Installer.exe` (508,216 bytes). Windows Authenticode reported **Valid**,
signed by **Mozilla Corporation**; SHA-256
`339f43cab6f09f5cfa815807561487e6277d22296e9e363408335f3cdea08426`.
This is Mozilla's standard installer, separate from Playwright's pinned browser. It was not
executed, and its successful download does not close the Firefox automation gate.

### Manually extracted Firefox verification (2026-11-14)

The owner installed standard Firefox and manually extracted the pinned Playwright archive
into `C:/Users/My PC/Downloads/playwright-firefox-1572-win64/firefox`. The extracted
`firefox.exe` is 1,139,712 bytes with SHA-256
`a8fa6c08d8a9e8cb961e74a626dd2f4c5064a853de38bcde3df3cb145ec44530`, exactly matching
the executable entry read directly from the downloaded archive. A Playwright headless launch
reported **Firefox 159.0** and rendered the local launch-check document successfully.

An ignored machine-local config, `.wrangler/firefox-local.config.ts`, imports the existing
Playwright configuration and supplies that explicit executable path to `firefox-desktop`.
It preserves one worker, zero automatic local retries, strict flake/focus checks, privacy
reporting and the real built web/Worker/D1/R2 servers. The three Chromium-only performance
cases are excluded; all 28 Firefox functional cases are selected. Command:
`pnpm exec playwright test --config=.wrangler/firefox-local.config.ts`.

The first run passed **27/28**, with zero skipped or flaky classifications, in 162.54 seconds.
The owner workflow failed with `NS_BINDING_ABORTED` at the first navigation after the failed
checklist-write/reload check. Its assertion only checked that a removed third item was absent,
which also passes while the entire checklist is still loading. The test now first verifies
that the two persisted labels are loaded, then checks the removed item is absent, before
navigating away. No product behavior, timeout, retry count or expected result was weakened.
The initial result is retained in
[local-firefox-baseline-summary.json](./evidence/local-firefox-baseline-summary.json).
Its four diagnostic files passed the privacy gate with zero blocked findings.

The single complete verification run with the stronger readiness assertions passed
**28/28**, zero failed, skipped or flaky classifications, in **161.68 seconds**. Its summary
is retained in
[local-firefox-corrections-summary.json](./evidence/local-firefox-corrections-summary.json).
The two resulting diagnostic files and 379 repository files passed privacy scanning with
zero blocked findings. Formatting and ESLint passed for the changed browser test, and
`tsc -p tsconfig.tools.json` passed. No application code or build changed in this follow-up.

Firefox availability is now resolved for this workstation through the owner's extracted
browser and the explicit local launch configuration. The historical installer failures and
first test failure remain evidence. T059 is still open for a clean combined engine matrix,
the recorded WebKit input issue and remote CI execution; T063's actual-device/previous-version
matrix and other live/human acceptance gates remain open. The task count stays 51/63.

### WebKit client-entry investigation (2026-11-14)

The immediate scope is the recorded WebKit mobile empty-email failure in the complete owner
workflow. Production image validation/recovery expiry, owner content/privacy/contact approval,
real-mail/human/device acceptance and deployment remain separate open gates.

**Code inspection and component evidence:** `ClientsEditor` stores the list and new-client
draft separately; the list-fetch completion updates only the list/loading state. The client
form is mounted after `AdminLayout` completes its React-driven session check. Generic
[pre-hydration input loss](https://playwright.dev/docs/navigations#hydration) is therefore
not established as this failure's cause. This inspection does not rule out a browser-specific
event or rendering race.

- Baseline: `node node_modules/vitest/vitest.mjs run apps/web/tests/clients.test.tsx`
  passed 6/6 before edits (3.53 seconds).
- The consecutive-field probe now dispatches native-style `input` events rather than
  `change`. Its title no longer claims that React renders were deferred; the event helpers
  can flush updates between events.
- Two new component cases hold the initial client-list response until immediately before
  or after email entry. Both verify all three fields after focus leaves email, the submitted
  POST payload, exactly one submission, and retained fields after a rejected save.
- The focused suite passed 8/8 (4.02 seconds); the web component regression suite
  `node node_modules/vitest/vitest.mjs run --project=web` passed 15 files / 44 tests
  (4.86 seconds). These probes pass with unchanged product code. **No behavioral red was
  observed and no product fix or red/green defect-resolution claim is made.**

**Browser probes prepared, execution blocked:** `e2e/clients.spec.ts` adds two `@client-entry`
cases comparing `fill` and `pressSequentially`. Both create Avery, Blake and Casey through
the real UI/API and assert persisted first name, last name and email after each reload.
The original owner workflow keeps its default consecutive `fill` calls and existing
pre-submit value assertions. No inter-field assertion/wait, retry, timeout increase, API
substitute, quarantine or skipped critical journey was introduced. Existing token-artifact
restrictions remain active.

The initial focused command was:

```powershell
node node_modules/@playwright/test/cli.js test e2e/clients.spec.ts --project=webkit-mobile --grep 'complete owner workflow' --repeat-each=10 --retries=0
```

With metrics disabled and Wrangler logs directed into `.wrangler/logs`, local D1 migrations
reported no pending changes. The API web server then exited 1 before any browser test:
esbuild reported `Cannot read directory "../../..": Access is denied` and could not resolve
the Worker entry point. A read-only probe confirmed the ancestor profile-directory listing
is denied in this session. A separate WebKit launch reported an unavailable executable at
the expected `webkit-2388/Playwright.exe` cache path; PowerShell inspection of that path
returned **Access denied**, so absence/corruption is not established. A normal installation
attempt targeting `.wrangler/browsers` failed with network `EACCES` at the official download
endpoints. The requested pinned engine is WebKit 27.2/build 2388, not a verified running
browser version. No access controls or security settings were changed.

`pnpm --version` also failed because Corepack could not create its cache directory. The
checks above use the installed local Node entry points, with Node 24.14.0 / Playwright
1.65.1. Existing application/toolchain configuration and user edits were preserved.

The command in quickstart.md selects three scenarios × two WebKit projects × ten repetitions,
with zero retries. Adding `--list` successfully discovers **60 cases**; this is test discovery,
not execution or a pass. Formatting, scoped ESLint, tools TypeScript and web TypeScript checks
pass after correcting a computed-method formatting/lint issue. That lint failure is not a
behavioral red. Machine-readable status is retained in
[local-webkit-investigation-summary.json](./evidence/local-webkit-investigation-summary.json).
Artifact privacy scanning checked two generated files and repository scanning checked 380
files, both with zero blocked findings. `git diff --check` passed. The optional Git
after-implementation commit hook was reviewed and left unexecuted; no commit was made.

**Disposition:** WebKit investigation and T059 remain **OPEN/BLOCKED on execution**. Resume
the predeclared browser run in a session with authorized toolchain/browser-cache access,
retain all failures, reproduce the behavioral cause before a product change, and then verify
the complete functional engine matrix and remote CI. Reinstalling WebKit alone cannot solve
the independent bundler access error or establish a fix for input loss. No launch gate closes;
51/63 tasks remain complete.

### WebKit execution resumed and probe locator corrected (2026-11-14)

The later follow-up session can read the ancestor profile directory and launch the existing
WebKit 27.2/build 2388 with Playwright 1.65.1 and Node 24.14.0. `pnpm build` passed, including
the production frontend and API dry run, and both local E2E servers started. The earlier
filesystem/cache restrictions do not apply to this session. No WebKit reinstall, access-control
change, security exclusion, paid service or deployment was needed.

The predeclared command in quickstart.md executed three scenarios × two projects × ten
repetitions, with one worker and zero retries. Separate output/report directories preserve
the initial and corrected runs; tokenized journeys still disable screenshots and traces.

- **Initial execution: 20 passed / 40 failed**, zero skipped or flaky classifications,
  394.80 seconds. All complete owner-workflow repetitions passed. Every new probe failed
  after saving the first synthetic client because `getByLabel('Client email', { exact: true })`
  selected both the actual email input and the email-composer region. The diagnostic showed
  the expected saved email in the input. This was a probe locator defect. All outcomes are
  retained in [local-webkit-access-followup-summary.json](./evidence/local-webkit-access-followup-summary.json).
- **Correction:** only the new probe's two post-save/reload email assertions now share
  `getByRole('textbox', { name: 'Client email', exact: true })`. The real client-creation helper,
  consecutive entry calls, pre-submit assertions, timeouts and retry policy are unchanged.
  The failing browser assertions precede this test correction; no product fix is claimed.
- **Corrected execution: 59 passed / 1 failed**, zero skipped or flaky classifications,
  460.37 seconds. All 30 desktop cases, 10 mobile typing cases and 10 mobile owner workflows
  passed. One of ten mobile `fill` probes failed before submission: the first name was empty
  after the three consecutive fills. The expected value was the synthetic name Avery.
  This reproduces an input-loss symptom in a different field from the historical email
  failure; a common cause is not established. Zero flaky classifications with retries
  disabled does not establish that the intermittent behavior is resolved.
- **Bounded diagnosis:** 50 fresh WebKit-mobile contexts using native HTML inputs passed
  consecutive fills; this does not establish the application's cause. One additional
  ten-case mobile diagnostic series recorded native focus/input/change events, field values
  and DOM identities passively, without modifying events or adding inter-field waits. All
  ten passed, so no failing event sequence was captured. The ignored local diagnostic files
  are `.wrangler/client-input-diagnostic.spec.ts` and `.wrangler/client-input-diagnostic.config.ts`;
  they are workstation investigation aids, not required CI files. No additional repeat-until-green
  run was used to replace the failed result.

The corrected outcomes and diagnostic summary are retained in
[local-webkit-locator-corrections-summary.json](./evidence/local-webkit-locator-corrections-summary.json).
Scoped ESLint, tools TypeScript and test-file formatting checks passed after the selector edit.
Artifact privacy scanned 51 files and repository privacy scanned 382 files, with zero blocked
findings. Product code remains unchanged because the evidence does not distinguish a missing browser input event, a remount,
or an application state overwrite. The next useful evidence is a failing event sequence or
a deterministic component reproduction, followed by a targeted correction and full engine
verification. **Browser execution is unblocked; input-loss diagnosis, the clean combined
matrix, remote CI and T059 remain open. The task count stays 51/63.**

### Implementation continuation and bounded diagnostics (2026-11-14)

The requested implementation continuation passed prerequisites and the requirements
checklist (16/16). Existing Git/Spec Kit configuration changes, runtime files and prior
untracked evidence were preserved. The existing Git, ESLint and Prettier ignore rules
cover dependencies, builds, local state and secrets; no additional ignore file was needed.
The owner explicitly requested that the missing Contact privacy text **remain pending**;
T023 stays open. The approved local-development exception remains the scope boundary.

One predeclared diagnostic run used the ignored
`.wrangler/client-input-diagnostic.config.ts`, WebKit mobile, 30 repetitions and zero
retries. All **30/30 passed**, zero skipped/flaky classifications, in **137.99 seconds**.
The recorder also captured event trust/input type and document focus without adding
inter-field waits. No failing sequence was captured, and no product fix is claimed.
The earlier 59/60 result and historical email loss remain unresolved evidence.

`e2e/client-input-diagnostics.ts` now supplies passive failure diagnostics for the checked-in
client browser cases. Records contain event types, field lengths, focus state and stable
DOM identities; they exclude entered values, URLs and tokens and retain at most 200 events
per document. Only a failed client case attaches the record. Input operations, assertions,
timeouts, retry policy and product code are unchanged. This is test instrumentation, not a
behavioral red/green defect fix. Instrumentation can change timing and cannot establish that
an intermittent defect disappeared.

A standalone check initially failed under `tsx` because its serialized callback referenced
the transpiler's unavailable `__name` helper; the log was empty. The same check under the
actual Playwright test loader passed **1/1**, verifying native input/field lengths, DOM
replacement, the 200-event bound, exclusion of all entered contact values and the closed-page
empty-record fallback. Command: `pnpm exec playwright test
--config=.wrangler/verify-client-diagnostics.config.ts`. This ignored, synthetic-only probe
requires no application servers and does not replace the full application journeys.

`pnpm check` passed: formatting, ESLint, TypeScript, **50 files / 229 tests** (86.22 seconds),
the seven public prerenders plus SPA fallback, frontend security/sitemap generation and API
dry-run build. Scoped formatting, lint and tools TypeScript also passed for the added
diagnostics. Dependency audit reported no known vulnerabilities. Repository privacy checked
383 files with zero blocked findings. Existing build warnings remain: a large lazy PDF
chunk, a mixed static/dynamic API import and framework deprecation/future flags.

The GitHub Actions read-only API reported **zero workflow runs** for this repository.
No remote CI success, live-provider result or deployment is claimed.

**Combined functional result:** one run of
`pnpm exec playwright test --config=.wrangler/implementation-matrix.config.ts` passed
**150/150** in **821.73 seconds**, with zero failed, skipped or flaky classifications and
zero retries. Each of Chromium desktop/mobile, Firefox desktop and WebKit desktop/mobile
passed all 30 functional cases. The ignored machine-local configuration preserves the
base test configuration, one worker, focus/flake rejection, real built web/Worker/D1/R2
stack and privacy reporter. It only supplies the previously verified owner-extracted
Firefox executable, separate output/report paths and excludes `performance.spec.ts`.
Runtime versions: Node 24.14.0, Playwright 1.65.1, Chromium 159.0.8154.6, Firefox 159.0,
WebKit 27.2. Mobile projects are emulated on Windows, not actual-device evidence.

Every functional case/outcome and duration is retained in
[local-functional-matrix-summary.json](./evidence/local-functional-matrix-summary.json).
The separate diagnostic result is retained in
[local-webkit-event-followup-summary.json](./evidence/local-webkit-event-followup-summary.json).
Performance was not rerun after test-only changes; its existing provisional/photo/field
limitations remain. All earlier failing runs remain recorded. A successful combined local
run is now available, but the intermittent WebKit input-loss cause is still unproven.

No task acquired all its outstanding evidence in this continuation: **51/63 remain complete**.
T001/T034/T058 need production decoding/retention evidence; T023 awaits owner privacy copy;
T025/T031/T046/T057/T061/T063 retain their live, human, content, physical-device or manual
acceptance obligations; T059 needs remote CI and resolution of the intermittent issue;
T060 needs authorized HTTPS deployment/rollback evidence. No product fix, live send,
paid service, deployment or commit was performed.

Final artifact privacy scanned **55 files** and repository privacy scanned **385 files**,
both with zero blocked findings; `git diff --check` passed. The after-implementation
extension configuration was parsed again: its only applicable hook is the optional Git
commit hook, which was displayed and left unexecuted. No mandatory hooks were registered.

## 2026-11-14 — owner-guided release gate review

The owner requested resolving Production, live/human acceptance, remote CI and deployment
one at a time, with explicit identification of needed owner inputs. This review begins with
Production. No remaining gate is passed by this review; **51/63 tasks remain complete**.
Existing hosting selection and R2 enrollment remain accepted. The owner-requested Contact
privacy-copy deferral remains pending until replacement copy or a new decision is supplied.

### Checks performed in this review

- Spec Kit prerequisites identify this feature; `requirements.md` is complete (16/16).
- Existing Git, Prettier and ESLint ignore rules cover the detected private Node/TypeScript
  workspace and Python tooling. No ignore-file change is needed.
- The current local commit is `7416b3c869493c9af35797ef10d0ec5185806ab8`.
  Existing unrelated workspace changes were left intact. Application suites were not rerun
  for this documentation-only review; the previous 229-test and 150-case results above
  remain historical evidence, not new executions.
- `node node_modules/wrangler/bin/wrangler.js whoami` reports **not authenticated**.
  No account entitlement, resource inventory or deployed behavior was verified. No temporary
  account, resource creation, subscription, live send or deployment was attempted.
- `productionRuntime` has no `validateImages` implementation. The gallery service rejects
  publication without it. Closing T001/T034 requires implementation as well as account and
  deployed evidence; signing in alone does not close the gate.
- Current provider documentation still describes asynchronous R2 lifecycle deletion and
  inconsistent Images binding prerequisites: the pricing page includes free transformations,
  while the upload tutorial requires Images Paid. This does not establish this account's
  eligibility for private-byte transforms under the existing budget.

Sources rechecked: [R2 lifecycle behavior](https://developers.cloudflare.com/r2/buckets/object-lifecycles/),
[Images pricing](https://developers.cloudflare.com/images/pricing/), and
[Images upload tutorial](https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/).

### Sequence and owner inputs

| Gate | Work to complete | Owner input needed at that stage |
| --- | --- | --- |
| 1. Production — T001/T034/T058 | Resolve retention policy, implement/prove authoritative image validation, verify resource budgets and operational monitoring | Retention decision first; then sign in to the selected Cloudflare account and identify the operational alert recipient/channel. Any paid option requires a separate concrete decision. |
| 2. Live/human acceptance — T023/T025/T031/T046/T057/T061/T063 | Record actual mailbox delivery, usability/owner timings, accessibility, physical print, approved-photo performance and actual-browser/device evidence | Designated test mailboxes and Google/Turnstile setup; final content/privacy/contact/photo approvals; 10 first-time participants (at least five mobile/five desktop), owner participation and required browser/device access. |
| 3. Remote CI — T059 | Run the configured full remote matrix for the reviewed commit, resolve failures and address the historical intermittent WebKit input loss | GitHub access if unavailable; identify any account-side Actions restrictions. The recorded zero-run result above was not refreshed in this review. |
| 4. Deployment — T060/T063 | Rehearse HTTPS configuration, migration/restore/rollback and smoke checks, then release the accepted artifact | Confirm the prepared deployment inventory and release when it is concrete and reviewable; provision credentials through local/provider secret mechanisms. |

Remote CI needs no live-provider secrets and may be prepared independently. Live-provider
acceptance requires a deployed environment, so the four gates are not four completely
independent deploy phases. The present `releaseGate()` rejects **every** unchecked task,
including T060/T063 tasks requiring deployed evidence. A separate isolated acceptance/probe
path must be designed and reviewed before provider-connected execution, with synthetic
data, designated accounts, bounded usage, access controls and cleanup. Keep the final
production gate strict; do not check incomplete tasks merely to enable an acceptance run.

### First owner proposal — subsequently approved below

QR-002 currently imposes an unconditional maximum retention period for deleted client data
in recovery copies and 31-day deletion receipts. R2 lifecycle documentation does not prove
those deadlines during provider outages. The proposed alternative is an operational policy:

- Keep live deletion and private recovery storage; refuse expired or unsafe restores.
- Start verified backup/media recovery deletion at day 28 and target completion by day 30.
- Target deletion-receipt expiry at day 31; reconcile the ledger before any restore reopens.
- Retry delayed deletion, monitor missed cleanup/freshness independently, notify the owner,
  and explicitly disclose that provider outages can delay physical removal.

The owner may instead retain the strict deadlines and require another demonstrably feasible
retention design. No policy amendment, new exception or production approval is inferred from
the request to walk through gates. If the operational policy is selected, synchronize the
specification, plan, data lifecycle, contracts, tasks and runbook, then implement and verify
missing controls before considering T001/T058 complete.

## 2026-11-14 — operational retention approved; Pixieset delivery scope selected

The owner explicitly approved the proposed retention amendment: **"Adopt the operation
policy."** This is authorization to synchronize QR-002 and its dependent design/runbook
artifacts; it is not a claim of production control verification. The former pending proposal
above is superseded by this approval.

Updated spec, plan, data-model, research, feasibility decision, tasks, quickstart and contract
descriptions to require day-28 application restore expiry/verified deletion attempts, a
day-30 removal target, and a day-31 receipt-cleanup target. Failed cleanup must retry and
alert through independent monitoring, including missed jobs and stale backups. Disclose
physical-removal delays during outages. Preserve required receipts if overdue recovery
removal cannot be verified; expired/unsafe restores remain forbidden. No HTTP schema,
endpoint, executable code, retention constant or task-completion flag changed.

The owner also confirmed the existing paid plan is **Pixieset Client Gallery**, then selected
**"Client photo delivery; keep portfolio images on our website"**. R-17 records official
product/integration findings and the selected boundary. Full client collections and sharing
belong in Pixieset; portfolio processing remains on Cloudflare, so T001/T034's production
decoder still needs implementation and proof. No Studio Manager migration, automatic gallery
sync, new subscription or real-client data operation is selected/performed. Application
client deletion does not imply deletion of Pixieset collections.

**Resolved decisions:** retention-policy amendment and Pixieset product/scope.
**Remaining Production evidence:** portfolio decoder entitlement/implementation/proof,
usage controls, deployed cleanup/retry, independent monitoring/owner notification and safe
restore rehearsal. Alert destination/configuration remain outstanding. Cloudflare sign-in
was requested as the next owner action so account capabilities can be inspected.
**Task status remains 51/63 complete**; T001/T034/T058 are still open.

Validation for this amendment: `git diff --check` passes. OpenAPI parses as YAML and a
structural comparison with HEAD confirms only the general description changed; HTTP
operations and schemas are identical. Task counts remain 63 total / 51 checked.
`node node_modules/vitest/vitest.mjs run apps/api/tests/operations.test.ts` passes **1 file /
9 tests** in **7.61 seconds**, covering existing local expiry, deletion-ledger preservation
during failed cleanup, safe retry, restore refusal and private media recovery. No test or
runtime implementation was changed. These are local checks, not production alert evidence.
The after-implementation hook was parsed: only the optional Git commit hook applies, and
it remains unexecuted. No mandatory hooks are registered.

## 2026-11-14 — authenticated Cloudflare inventory and agent setup

The owner completed Wrangler login. `wrangler whoami` confirms one accessible account.
Read-only `r2 bucket list`, `d1 list --json`, and the Workers scripts API report zero
buckets, databases and Workers respectively. R2 enrollment remains accepted; application
resource provisioning is still future work. The Workers account-settings response reports
`standard`, which is not treated as proof of a billing plan or an Images entitlement.

The account-subscriptions and Images storage-statistics endpoints return HTTP 403/code
10000 with the Wrangler OAuth credential. This is insufficient API permission, not evidence
that Images is unavailable or that an upgrade is needed. Credential values and account
identifiers were excluded from the tracked
[preflight evidence](./evidence/cloudflare-account-preflight.json). No photo-processing,
resource creation, subscription change, message or deployment was performed.

The owner then explicitly requested executing the applicable instructions at
[Cloudflare's agent setup](https://developers.cloudflare.com/agent-setup/prompt.md).
Installed all 22 published `cloudflare/skills` skill directories into the global Codex
skills folder using Codex's skill-installer helper; each `SKILL.md` was verified. Registered
the official `https://mcp.cloudflare.com/mcp` server with `codex mcp add cloudflare --url ...`
after backing up the user configuration. Registration automatically started OAuth; completion
is recorded below once observed. The optional beta `cf` CLI choice was presented separately.
This environment setup does not close T001/T034/T058 or any release task.

**Setup result:** the registration process exited successfully with `Successfully logged
in`; `codex mcp list` reports the Cloudflare server enabled with OAuth authentication.
The user selected **"Skip it; keep Wrangler"** for the optional beta `cf` executable.
It was not installed. The published `cf-cli` guidance skill is included among the 22
skills, which does not install that executable. Existing user configuration is semantically
unchanged apart from the Cloudflare entry (Codex omitted one equivalent empty `args` list).
The configuration backup remains in the user Codex directory. Skills are available next
turn; restart Codex to load the newly registered MCP tools, which are not exposed to this
running session. After activation, resume Images entitlement investigation and the remaining
Production gate. No task-completion flag changed; the count remains **51/63**.

## 2026-11-14 — resumed Cloudflare connector verification

After the owner updated access and requested another retry, the Cloudflare plugin's
identity lookup and account list succeeded. The account list contains one account and
pagination is complete. The earlier local tool-approval rejection no longer blocks this
connector's account lookup.

Images storage statistics return HTTP 403/code 5403 (account invalid or unauthorized for
the service). Account subscriptions return HTTP 403/code 10000; the connector explicitly
reports that no OAuth scope covers that endpoint and that an API token with Billing Read
or Billing Write is needed. These results do not establish whether private-byte Images
transformations are available, nor do they justify purchasing a subscription. Dashboard
inspection could not proceed because no browser is connected. The owner was asked for
the Images plan/setup status shown in the dashboard.

Sanitized results are recorded in the existing
[preflight evidence](./evidence/cloudflare-account-preflight.json), preserving the earlier
Wrangler observations separately. No credentials or account identifiers were added to
project evidence. No remote resource, subscription or application code was changed.
Production image validation remains unexecuted; T001/T034/T058 and the **51/63** task count
remain unchanged.

## 2026-11-14 — Images Free activation and remote provider diagnostics

The owner activated Images & Stream Free. Account statistics now succeed (zero hosted
images; zero hosted-storage allowance). The temporary Images-only development probe
successfully transformed synthetic private image bytes on Cloudflare. R-18 records the
boundary findings and links to both raw, sanitized evidence files.

The first probe has nine successful valid-image cases, two corrupt-input refusals reported
as provider internal error 9516, one silently accepted truncated JPEG, and one PNG proxy
failure. A targeted repeat accepted the valid PNG but reproduced JPEG acceptance both with
and without an end marker. Both malformed JPEGs fail the strict local decoder. These are
unresolved validation results, not a provider pass. No production validator was wired in.

Commands: `pnpm exec wrangler dev --config scripts/image-binding-probe/wrangler.toml --remote
--ip 127.0.0.1 --port 8795 --inspector-port 9245 --show-interactive-dev-session=false`, then
`pnpm exec tsx scripts/image-binding-probe/run.ts`; targeted follow-up selected
`jpeg-truncated-scan jpeg-truncated-scan-with-end-marker png-16384-axis`. Diagnostic exits
were nonzero, as required by the unmet expectations. The development process was stopped;
the authenticated Workers scripts inventory afterward remained at zero.

Production decoder, resource-budget and retention/monitoring evidence remain outstanding.
No paid plan, real photo, live message, application deployment or task-completion change
was introduced. The count remains **51/63**.

Local regression verification: **15/15 tests passed** across the image-provider and gallery
suites, including both malformed JPEG fixtures and the unconfigured-production-validator
refusal. Full workspace typechecking, scoped ESLint, formatting and diff checks passed.
These passing local checks do not supersede the recorded provider failures.

## 2026-11-14 — damaged-JPEG blocker resolved in the upload adapter

The owner requested strict rejection and re-export guidance, with Pixieset continuing to
handle delivered client collections. Implemented `packages/shared/src/jpeg.ts`, the internal
per-portfolio `JpegValidator` Durable Object, and `validateCloudflareImages`; wired the adapter
into `productionRuntime` and protected uploads. API and generated release configurations
include Images, the validator namespace and its SQLite migration. Generated binding types
replace duplicated handwritten binding declarations.

The strict check validates sequential/progressive Huffman JPEG entropy before transformation.
Images fully decodes inputs and regenerates each public derivative from the original. A
damaged/unsupported JPEG returns HTTP 400 with “Re-export it as JPEG or PNG and try again.”
Tests verify no transformation or R2/database publication on this rejection; missing bindings
and provider outages also prevent storage. Pixieset delivery has no new integration or writes.
See R-19 for bounded work/memory, supported encodings, timeouts and residual proof limits.

Red/green evidence:

- `scripts/tests/jpeg-validation.test.ts`: the initial no-op validator failed three behavioral
  cases; the completed validator passes seven, including a strict-Sharp differential sweep
  across more than 100 damaged scans, valid baseline/progressive/grayscale/CMYK/EXIF,
  restart/padding/table checks and a 40-MP progressive source.
- `scripts/tests/cloudflare-images.test.ts`: the stub failed five adapter cases. Seven passed
  after implementation. A subsequent stalled-output/cancellation test failed (still pending
  after 30 seconds); bounding cancellation fixed it, and all eight adapter tests now pass.
- `apps/api/tests/jpeg-validator.test.ts`: the initial RPC stub returned false for an intact
  JPEG and failed; the real local workerd/SQLite DO now accepts intact data, rejects both
  truncated forms and accepts a later intact request.
- `apps/api/tests/gallery.test.ts`: before wiring, valid and damaged production uploads both
  returned 500; the new behavioral tests expected 201/400 and failed. All twelve now pass,
  including correct guidance, zero writes on failure, unavailable binding refusal and success.

Live-provider evidence: `scripts/image-binding-probe/validate.ts` passes **10/10 cases**, stored
in [images-validation-probe.json](./evidence/images-validation-probe.json). It exercises the
production adapter in local workerd/DO RPC with the live Images binding, not offline Images
emulation. Both R-18 damaged JPEG fixtures return 400. Valid PNG/WebP/JPEG, EXIF orientation,
40-MP baseline and progressive 4:4:4, 16,384-pixel width, and a 10-MiB metadata-padded JPEG
pass. Each output passes independent strict Sharp decoding and dimensions/metadata checks.
The diagnostic process was stopped; authenticated Workers inventory afterward remains zero.
The old raw-provider failure evidence is retained unchanged.

Repository verification: `pnpm check` passes formatting, lint, types, **53 files / 248 tests**,
and both production builds (API dry run only). After the additional cancellation fix, the
eight-test adapter suite, scoped lint, full workspace typecheck and API dry-run build pass.
Privacy scans found no blocked source or diagnostic artifacts. No files were staged or
committed by this work; pre-existing `.specify/`, `.node-version` and `.npmrc` edits were left alone.

`pnpm exec playwright test e2e/gallery.spec.ts --project=chromium-desktop
--project=chromium-mobile` passes **4/4**, zero retries: oriented upload, edit/reorder/delete,
public refresh, sixty-image capacity, filtering and 320/768/1280 layouts. This browser run
uses the isolated local Sharp provider; the production adapter and live Images are tested
separately above. Final source/artifact privacy and diff checks pass.

The reproduced silent-recovery bug is resolved. This is not deployed CPU/memory/usage-budget
proof, a production application deployment, paid activation, or permission to release.
T001/T034 remain open for those remaining integration/resource checks; operational retention,
monitoring and other acceptance gates remain separate. Task count stays **51/63**.

## 2026-11-14 — private deployed gallery and CPU verification

Under the owner's scoped continuation, deployed the actual API to a disposable private
Worker with synthetic D1/R2 data, Images and SQLite Durable Objects. R-20 records the
configuration, retained initial harness interruption, clean rerun, metrics and cleanup.
The original pipeline exceeded the Free front-Worker CPU target; moving upload/delete
execution into `GalleryMutations` reduced observed maximum front CPU from 109 ms to 7 ms.
Concurrent writes receive retryable 429 admission; strict JPEG rejection stays unchanged.
JPEG RPC has 20 seconds within the existing 30-second deadline; Images calls retain 8 seconds.

Red/green evidence:

- `scripts/tests/gallery-rehearsal.test.ts`: the initial stub failed both private-resource
  configuration cases; the real-entry/private-config implementation passes both.
- `apps/api/tests/gallery-mutations.test.ts`: front forwarding initially returned 400 instead
  of 204 and the coordinator stub returned 501 instead of 401. Implementation then exposed
  a missing security header in the forwarded response; preserving response headers fixed
  it. Both tests pass, including unconsumed-body forwarding, auth and concurrency release.
- `scripts/tests/cloudflare-images.test.ts`: a nine-second validator response failed at the
  old eight-second timeout. The revised budget passes that case and still refuses a stalled
  validator at twenty seconds. All nine adapter tests pass.

Remote verification: **11/11** coordinated upload/storage/publication checks pass, plus
the separate concurrent upload test (one 201, one 429, exactly one image/four objects).
All successful variants pass independent strict Sharp decode and metadata/dimension checks.
Damaged JPEGs return 400 without R2/D1 publication. Originals remain private, and deleting
an image removes its public route while creating private recovery copies. Sanitized JSON
evidence is linked from R-20; initial failed assertions are retained, not overwritten.

Invocation CPU and partial memory analytics are recorded, not inferred from local tests.
The JPEG validator reports ~30.2 MiB p99 memory and zero reported CPU/memory-limit errors;
the front Worker reports ~10.7 MiB p99. Coordinator memory metrics are missing, and no peak
heap profile was obtained. T001/T034 therefore remain open, alongside account-wide usage
controls. Task count remains **51/63**.

Repository validation: `pnpm check` passes formatting, lint, workspace/tool types,
**55 files / 254 tests**, and both production builds. The subsequent concurrency diagnostic
also passes scoped lint and tool typechecking. `pnpm exec playwright test e2e/gallery.spec.ts
--project=chromium-desktop --project=chromium-mobile` passes **4/4**, zero retries. Browser
checks use the isolated local Sharp provider; remote checks above use the actual Images
adapter. Source/artifact privacy and final diff checks pass.

Cleanup verified: no Workers, DO namespaces, D1 databases or R2 buckets remain in the
rehearsal account inventory. The local proxy stopped; generated configs and credentials
were removed. No real data, email, Pixieset operation, paid subscription, staging or commit
was performed. Existing unrelated workspace edits were preserved.

## 2026-11-14 — coordinator memory verified; GitHub monitoring implemented

R-21 records the separately authorized private follow-up. Four combined 40-MP/10-MiB
uploads pass through the unchanged production image path. Four further cycles pass with
Cloudflare-side byte-based pacing, verifying the real coordinator under slow input. Strict
Sharp decode, stripped metadata, derivative dimensions/bytes, private originals and
deletion all pass. Final-window coordinator memory p99/p999 is 40,975,644 bytes (~39.1 MiB),
validator memory 29,492,300 bytes (~28.1 MiB), with no reported DO limit errors. The broader
diagnostic coordinator p999 is ~67.6 MiB. Samples are not absolute peaks.

Retained failures: the initial driver delayed per input chunk and timed out locally, then
completed remotely; the next upload received 429. Its eventual synthetic image was found
and deleted. A regression test failed on provider chunk fragmentation, then passed after
byte-based pacing. No production image behavior was changed by this diagnostic correction.
The successful allocation profile covers early streaming only, not retained/peak memory.
One cold gallery-list GET reached 12 ms CPU; general Free-tier headroom remains T001 work.

T034 is complete from the accumulated API/storage/browser/real-provider evidence in
R-19/R-20/R-21. **52/63 tasks are complete**. This does not waive T001 or authorize release.

The owner selected GitHub failure notifications. Implemented private scheduled-job records
and an independent hourly GitHub R2 metadata monitor with a labeled notification-test mode.
TDD evidence: the initial scheduled wrapper failed both missing-status/error-transition
tests; implementation passes both. The monitor stub failed all three stale/overdue/budget
behavior cases; the completed monitor passes those plus pagination and bounded/read-only
transport tests. Existing backup/restore/deletion-retry tests also pass. A direct standalone
Node invocation without credentials exits 1 with a sanitized message, as required.

`pnpm check` passes formatting, lint, workspace/tool types, **58 files / 262 tests**, and both
builds. No browser flow changed; the earlier 4/4 gallery browser evidence remains applicable.
Source/artifact privacy and final diff checks pass. Production cron, independent monitoring
activation, actual owner notification receipt and remote restore/deletion rehearsal remain
unverified T058 gates. No GitHub notification was sent during this work.

Cleanup inventories confirm zero Workers, DO namespaces, D1 databases and R2 buckets.
Generated configs and synthetic credentials were removed, with only ignored build/profile
artifacts retained. No real data, Pixieset operation, paid plan, staging or commit occurred.

## 2026-11-14 — bucket-scoped monitoring and last-success correction

Resumed `$speckit-implement`; prerequisites identify this feature, requirements checklist
passes 16/16, and Git/ESLint/Prettier ignore patterns cover the current private monorepo.
Preserved the existing `.specify/`, `.node-version` and `.npmrc` workspace changes.
R-22 records the provider credential mismatch: Object Read Only credentials cannot use
the REST object API. Replaced the transport with S3 SigV4 and bucket-scoped credentials,
conditional backup HEAD metadata reads and fixed operational-body reads. Updated workflow,
lockfile, plan/data-model and activation instructions. No public API contract changed.

Red/green evidence:

- `pnpm exec vitest run scripts/tests/operations-monitor.test.ts`: initial credentials-only
  failures were not counted as the behavioral red step. With a synthetic legacy credential
  supplied to reach the old transport, three behavioral cases failed: wrong REST origin,
  inability to collect using S3, and permitting private-body paths. The S3 implementation
  passes all eight transport/inspection cases without the legacy credential. Tests cover
  signed fixed-origin GET/HEAD, two-page cursor encoding, conditional metadata reads,
  malformed XML/entities, denied paths, provider failures and oversized responses.
- Added a repeated-start regression and a local D1/R2 scheduled-job case. Before the fix,
  the monitor returned healthy without a recent completed job, and the stored running
  records lacked the previous success time: **2 failed / 10 passed**. Retaining and checking
  `lastSucceededAt` makes these cases pass.
- `pnpm exec vitest run scripts/tests/operations-monitor.test.ts
  apps/api/tests/operations-monitor.test.ts apps/api/tests/operations.test.ts` passes
  **3 files / 21 tests**, including existing deletion retry, receipt preservation,
  unsafe/expired restore refusal and private media recovery.

The monitor workflow's exact install command was executed in the isolated ignored
`.wrangler/monitor-install-check` directory:
`pnpm install --filter radiant-images --prod --frozen-lockfile --ignore-scripts`.
It installed nine packages. Direct Node execution without credentials exits 1 with the
sanitized configuration/connectivity message, establishing that the entrypoint loads and
fails closed rather than silently reporting success. This is not a live-provider check.

Final validation: `pnpm check` passes formatting, lint, workspace/tool types,
**58 files / 267 tests**, frontend production build and API dry-run build.
`pnpm audit --audit-level=moderate` reports no known vulnerabilities; source/artifact
privacy scans report zero blocked findings. `git diff --check` passes. Existing optional
PDF-chunk-size and framework deprecation warnings remain; no browser UI changed, so the
previous browser matrix evidence was not rerun or represented as new evidence.

Current environment checks confirm no configured `CLOUDFLARE_ACCOUNT_ID`,
`R2_MONITOR_ACCESS_KEY_ID`, `R2_MONITOR_SECRET_ACCESS_KEY` or `RECOVERY_BUCKET` variables.
GitHub CLI is unavailable, so repository secrets/variables and remote runs were not read.
Production activation, actual owner notification receipt and deployed restore/cron evidence
remain unverified; T058 is unchecked. T001's usage/CPU/recovery gates and the other live,
human, content/privacy and release tasks remain open. **52/63 tasks remain complete**.
No remote resources, messages, credentials, commits or deployments were created.

Post-hook check: parsed `.specify/extensions.yml`; only the optional Git commit hook applies.
It is offered and left unexecuted. No mandatory after-implementation hook is registered.

## 2026-11-14 — first remote PR CI pass; full browser suite prepared for next push

Read the public GitHub run/job APIs for
[Quality run 43666811821](https://github.com/sg921216/radiant_images/actions/runs/43666811821/job/132667903065).
The run is a completed successful `pull_request` event on
`358277e17d486dec15f2733778792e37f5b95c17`. The verify job ran from
`2026-11-15T02:14:14Z` to `2026-11-15T02:19:52Z` (November 14 in America/New_York).
Frozen installation, formatting, lint, types, dependency/source security, tests, builds,
test setup, browser installation, Chromium smoke and diagnostic privacy steps succeeded.
The nightly/release browser step was explicitly skipped. No detailed test counts or
individual browser results are inferred from this job metadata.

Saved only run identity, event, commit, timestamps and step conclusions in
`evidence/github-pr-smoke-43666811821.json`; no logs, credentials or client data are retained.
The successful run resolves the earlier absence of any remote CI execution, but it does
not close T059's complete-browser evidence or the historical intermittent input-loss concern.

Changed the declarative CI selection so pull requests run `pnpm e2e` across the existing
five Playwright projects. Main pushes retain `pnpm e2e:smoke`; nightly, manual and reusable
release runs keep full coverage. Exactly one browser-suite step is selected per event,
with the existing focused/flaky-test rejection, timeout and privacy gates unchanged.
YAML/format validation and event-selection checks pass for pull_request, push,
workflow_dispatch, schedule and workflow_call. Playwright lists 165 cases across 12 files
and the existing five projects; listing is not execution and project-specific performance
selection remains unchanged. The privacy scan reports 436 files with zero blocked findings,
and `git diff --check` passes. These checks cover this configuration-only change;
application code and browser tests are unchanged. The changed workflow has not been pushed
or run remotely by this session. The user should commit/push it to the existing PR and
wait for the full-suite result before merging. **52/63 tasks remain complete**; no public
deployment, notification send, credentials or release-gate bypass occurred.
