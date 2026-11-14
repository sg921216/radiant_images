# T001: approved feasibility decisions

**Status: APPROVED for local implementation. Date: 2026-11-13.**

**Retention policy amendment: APPROVED by the owner on 2026-11-14**, in response to the
concrete operational-policy proposal: "Adopt the operation policy." QR-002 now requires
day-28 application recovery expiry and verified deletion attempts, a day-30 removal target,
and a day-31 receipt-removal target. Retry/independent alerts and disclosure cover provider
delays; required receipts remain until overdue recovery cleanup is verified, and expired or
unsafe restores remain blocked. This resolves the policy decision, not production proof.

**Photo-delivery decision (2026-11-14)**: The owner already pays for Pixieset **Client Gallery**
and selected "Client photo delivery; keep portfolio images on our website". Client delivery
uses Pixieset; website portfolio processing still requires T001/T034 validation. No Studio
Manager migration, paid Cloudflare Images upgrade or new Pixieset subscription is selected.

The owner-selected React / Workers Static Assets / Workers / D1 / R2 architecture remains
unchanged. R2 enrollment is resolved. [Research R-16](./research.md#r-16-t001-feasibility-checkpoint--2026-11-13)
now records provider allowances, overage-control limitations, Gmail scopes, a compatible
dependency-resolution candidate, and the two remaining feasibility issues.

## Why T001 cannot yet pass

1. **Operational recovery proof:** the owner's policy amendment replaces unconditional
   physical-deletion deadlines. Production must still prove verified deletion, retry after
   failure, independent monitoring of missed/stale jobs, owner alerting, safe receipt
   retention and refusal of expired/unsafe restores. Provider delays must be disclosed.
2. **Image resource and usage budgets:** R-19 resolves the reproduced damaged-JPEG gap
   with strict scan validation before Images transformation. The owner authorized a
   temporary private deployed rehearsal on 2026-11-14. R-20 records 11/11 passing checks,
   private originals, metadata-free derivatives and successful concurrency admission.
   Upload/delete now run in a per-portfolio Durable Object; observed front-Worker CPU
   fell from 109 ms to 7 ms. JPEG-validator sampled memory is about 30 MiB, but coordinator
   memory analytics remain unavailable and percentiles do not establish peak allocation.
   Complete that resource evidence and account-wide usage/overage controls before release.
   All temporary resources were removed. See [research R-20](./research.md#r-20-private-deployed-gallery-rehearsal--2026-11-14).

Sources: [R2 lifecycle behavior](https://developers.cloudflare.com/r2/buckets/object-lifecycles/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[Images pricing](https://developers.cloudflare.com/images/pricing/),
[Images upload prerequisite](https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/).

## Original bounded local-development exception (2026-11-13)

Permit local implementation and automated verification to continue while feasibility
remains open. This original exception changes task sequencing, not privacy requirements,
hosting, or the spending budget. The separate owner-approved retention amendment above
now governs QR-002; it is not an inferred expansion of the original exception.

- **Scope:** implement and test locally with synthetic identities, disposable D1/R2 and
  controlled provider boundaries. Preserve real React-to-Worker integration and mandatory
  red-green-refactor. Build against a replaceable image-provider interface; keep gallery
  publication unavailable if authoritative validation cannot succeed.
- **Unresolved gates:** leave T001 unchecked. Tasks requiring real mailbox receipt, human
  acceptance, production decoder evidence or deployment remain incomplete until that
  evidence exists. Finish their independent local portions and record partial status.
- **Compensating checks:** exercise provider rejection, corrupt/oversized images, metadata
  handling, interrupted deletion, overdue backups and restore refusal locally. Local
  emulation is never labeled a production/provider pass.
- **Exclusions:** no paid subscription, hosting change, real client data, live sends,
  public deployment, retention-policy relaxation or automatic task completion.
- **Risk:** eventual provider evidence may require changes to media processing or recovery
  design. Local implementations must remain replaceable; these checks may still prevent
  release.
- **Expiry:** before the first provider-connected acceptance run or deployment, whichever
  occurs first. Resolve the issues or obtain a separately scoped owner decision then.
- **Approving owner:** project owner, 2026-11-13, in this session: "yes, apply the exception and continue with implementation".

Local implementation has since progressed; preserve outstanding real-provider/human
acceptance items. The original exception did not authorize changing QR-002 or buying an
Images subscription. Only the separately approved retention amendment changes QR-002.
Provider-connected acceptance/deployment still require their scoped prerequisites and
actual evidence; no unfinished task becomes complete through either decision.
