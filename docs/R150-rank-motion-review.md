# R150 — Rank rendering and Diamond motion

Baseline: main `64aa8f7e12af8718419003f535e835aa4d138df5`; PR #91 starts with test-only commits `ce250cbc` and `71fa4e4d`. The deployed runtime did not change between the prior audit and R149 (R149 adds AGENTS.md only).

## Evidence and scope

- High / Performance: `mountPremiumUi` wrote the membership attribute on each read. The readiness observer requested another read after that output mutation. Isolated Chrome fixtures at the real five layout widths recorded 303–440 summary reads for Gold/Diamond during a capture; Base recorded 6–7. These are deterministic mock-network observations, not production traffic measurements.
- Medium / Animation: Diamond glint and hero sweep continuously animated `left`. Their pseudo-elements are clipped by their existing parent surfaces.
- High / presentation correctness: pending reads could restore an earlier account's decoration after logout/account changes.
- Visual / Base / Gold / Diamond: existing home and profile captures at 360/390/412/768/1366 have no root horizontal overflow or uncaught errors. This PR preserves surface design; broader refinement follows separately.
- Critical: no new confirmed critical repository exposure in this package. The earlier DB, Admin Quotes and ID-input findings remain tracked separately; this PR does not modify those contracts.
- SEO / technical debt: existing R146 metadata and the active modular/CDN chain are preserved. The first visual capture used Chrome's minimum desktop width; only the second, iframe-verified run is the valid mobile baseline.

Valid before evidence: [Actions run 34034104647](https://github.com/chuihuarachif-cpu/the-french-store/actions/runs/34034104647). Synthetic accounts and catalog fixtures are isolated from production. No account credentials, purchases, payment requests or balance changes are used.

## Changes

The readiness observer now performs presentation only. A completed loyalty read supplies a presentation event for upgrades, renewals and expiry, including changes that keep the same theme. Explicit refresh, profile navigation and Auth events still read current backend state. Only concurrent reads for the same account are coalesced; there is no permanent response cache or new polling timer. Request revisions and account checks discard stale completions.

Diamond keeps its short sweep/glint on capable devices. The ribbon travels 636.363636% of its own 22%-wide element, retaining the old parent-relative -28% to 112% endpoints. The hero travels 546.428571% of its 28%-wide element, preserving -35% to 118%. Translation precedes skew. Only transform/opacity animate, once per entry; no permanent will-change is added. Existing motionMode and reduced-motion disable decorative travel on lightweight paths.

## Validation and rollback

`node scripts/test-r150-rank-rendering.mjs` runs the production controllers, tests bounded reads, 100 visual mutations without reads, concurrent refresh, membership changes, expiry, account switches, logout during a pending read, and absence of idle polling. It also verifies compositor properties, travel geometry and motion guards. Existing R47 contracts remain enabled.

The visual workflow asserts five actual layout widths, no horizontal overflow, no runtime errors, bounded Rank requests and preserved Diamond animations; it also checks lite/reduced motion. Before merge, all relevant CI and the screenshots must be reviewed. PR #91 remains draft until then.

Rollback: revert this PR's merge commit. No data migration, financial write, Auth method, backend authorization, category, price, margin or provider execution change is included. Risk is confined to frontend Rank presentation/refresh timing and its decorative CSS.

Seven existing cache guards failed after the release date moved from August to September: six required the literal month `202608`, and R124 required the old R129 URL. Their other assertions remain unchanged. A shared guard now requires exactly one bootstrap URL whose cache key matches the actual declared release/version, which rejects stale keys without imposing a historical month.
