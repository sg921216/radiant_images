# Implementation evidence: Radiant Images

## 2026-11-13 — T001 feasibility checkpoint

**Current status: Hosting clarification complete; T001 technical verification open; 0 of 63 implementation tasks complete.** No application code, build,
runtime test suite, deployment, mailbox delivery or human acceptance is claimed.
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

| Check | Command / method | Result |
|-------|------------------|--------|
| Feature prerequisites | `python .specify/scripts/python/check_prerequisites.py --json --require-tasks --include-tasks` | PASS; feature `specs/001-radiant-images-website`; research, data model, contracts, quickstart, tasks available |
| Requirements checklist | Count Markdown checkboxes in `checklists/requirements.md` | PASS; 16 total, 16 complete, 0 incomplete |
| Repository instructions | Read parent `AGENTS.md`, current plan and constitution v1.0.0 | React/Workers stack and test-first requirements retained |
| Hosting/provider feasibility | Review current primary documentation linked in R-16 | Initial checkpoint blocked on hosting; owner later selected Workers Static Assets and completed R2 enrollment. Expiry/decoder evidence remains incomplete |
| Local tools | `node --version`; `npm --version`; `pnpm --version` | 24.14.0; 11.12.0; 9.15.0; no compatibility/build pass inferred |
| Registry metadata | `npm view` with process-local `NODE_OPTIONS=--use-system-ca`, retries disabled | Initial certificate failure resolved using OS trust; Router 7.15.1 peers, Workers test pool 0.23.0/Vitest 4.1 peers, Wrangler 4.162.0 and pnpm 12.18.0 retrieved; installation not run |
| OpenAPI 3.1 structure | PyYAML 6.0.3 + openapi-spec-validator 0.7.2 | PASS; contract 0.2.0, 40 operations |
| Reference resolution | Walk all local `$ref` JSON pointers in the parsed contract | PASS; 261 references resolve |
| Protected-operation declarations | Inspect every operation with `security` | PASS; all 31 declare both 401 and 403; declaration check only |
| Revised upload/429 declarations | Inspect required original part, gallery 413 and required Retry-After | PASS; runtime enforcement remains unimplemented |
| Patch whitespace | `git diff --check` | PASS |
| Ignore behavior | `git check-ignore --no-index` for `.dev.vars`, `.env`, Python cache, editor settings and Wrangler SQLite fixtures | PASS; root `.gitignore` added |
| Extension hooks | Parse `.specify/extensions.yml` | Both implementation hooks optional; surfaced, not executed; no mandatory hook |

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
