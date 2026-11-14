# T001: approved local-development exception

**Status: APPROVED for local implementation. Date: 2026-11-13.**

The owner-selected React / Workers Static Assets / Workers / D1 / R2 architecture remains
unchanged. R2 enrollment is resolved. [Research R-16](./research.md#r-16-t001-feasibility-checkpoint--2026-11-13)
now records provider allowances, overage-control limitations, Gmail scopes, a compatible
dependency-resolution candidate, and the two remaining feasibility issues.

## Why T001 cannot yet pass

1. **Recovery deletion:** QR-002 requires recovery copies to disappear within 30 days and
   deletion receipts to expire after 31 days. R2's documented asynchronous lifecycle
   behavior does not establish either unconditional deadline. A scheduled early deletion
   and alerts cannot guarantee completion during a provider outage.
2. **Server image validation:** the 40-megapixel limit rules out a naive full-frame RGBA
   decoder within Workers' memory budget. The private-byte Images binding is a candidate,
   but provider documentation conflicts on its subscription prerequisite. No deployed
   entitlement/decoder/metadata/resource-limit proof exists.

Sources: [R2 lifecycle behavior](https://developers.cloudflare.com/r2/buckets/object-lifecycles/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[Images pricing](https://developers.cloudflare.com/images/pricing/),
[Images upload prerequisite](https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/).

## Approved bounded exception

Permit local implementation and automated verification to continue while these two issues
remain explicit deployment gates. This changes task sequencing, not privacy requirements,
hosting, or the spending budget.

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

Resume T002 and proceed through local work in dependency order, preserving
open real-provider/human acceptance items. Approval does not authorize changing QR-002 or
buying an Images subscription. Provider-connected acceptance and deployment remain gated
until both T001 feasibility issues are resolved under the current requirements.
