# Provisional synthetic load fixtures

These 60 deterministic textures exercise the required transfer sizes, dimensions, count,
orientation mix and order without real people or private photos. They are **not approved
photographs** and do not satisfy the Mobile Acceptance Profile's photo-content gate.
`manifest.json` records `approvedPhotos: false`. Keep T061 and release acceptance open until
the owner supplies/approves the required non-sensitive photograph set and the profile is rerun.

Regenerate with `pnpm exec tsx scripts/generate-performance-fixtures.ts`. Every file has its
dimensions, exact byte size and SHA-256 recorded. The API serves actual R2 WebP bytes during
measurements; tiny or empty galleries are not used as performance evidence.
