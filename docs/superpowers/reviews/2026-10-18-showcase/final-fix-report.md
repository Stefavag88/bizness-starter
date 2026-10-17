# Final fix report — 2026-10-18

BASE e62a8316d1a11556b1ebc0bc258f4ef0d6ea6524 on codex/starter-v2-showcase. One batched final-review wave resolves I1 and M1. No subagents/reviewers spawned; root owns scoped rereview.

## Changes and evidence

I1 reproduced before implementation in actual staging and production builds: no route HTML, but both emitted the 9,248-byte ShowcaseLayout client script and 1,829-byte dedicated showcase CSS. Retained inventory `.generated/showcase-builds/before-fix-assets.json`, SHA256 bdc7b6f161e256a9d58f0d43595fcfb96c3c76eec7a3b799998d57166c1ca255; scratch copy also present. Installed Astro public types and integration hooks confirm supported astro:config:setup injectRoute({pattern,entrypoint,prerender}). Config now conditionally registers only local `/design-system`; page entry moved outside src/pages into src/showcase/DesignSystem.astro and old filesystem rest route removed. No schema/content/CSP/packaging-setting change or post-build deletion.

Verifier scans emitted JS/CSS using dedicated compiled DOM selectors and preview entry names, avoiding generic reserved design-system strings present in legitimate CMS validation. Retains complete per-stage JS/CSS/font path/size/SHA256/fingerprint inventories before acceptance, including a failed inventory. Three asset-only red cases initially resolved instead of rejecting, and inventory-contract test initially lacked inventories. New gate failed real old staging output on exact JS/CSS, then actual staging/production/local passed with the routing fix. Positive legitimate shared theme/business/font/CMS case passes. Existing exact restoration/conflict/deletion/final-refresh/owned timeout semantics remain.

M1: expanded both named scripts/verify-showcase-builds.mjs and e2e/design-system.spec.ts into readable phases. Only small RGB repetition helper extraction; no refactor wave or changed browser assertions. Updated current architecture/guide/decisions and appended dated corrected acceptance, preserving historical HTML-only claims and explaining their limit. Permanent ruling includes route/integration revalidation cost and unchanged best-effort ownership limit.

## Fresh checks

- Focused verifier: 14/14 pass, including last formatting rerun.
- Real test:showcase-builds: staging22/production22/local23 pages; 130/130/132 JS/CSS/font assets. Zero dedicated preview fingerprints nonlocal; expected dedicated JS/CSS local. Six configure/build commands succeeded. `.generated/showcase-builds/run-DNLlCD/evidence.json` SHA256 3ac7139d61abe94393ba784dd29023077c9898e06000eac08093d7caabf543fb.
- Shared business CSS SHA256 c890747e0a3304ecc2bfd3dfeee6b36982036bd9ebdc03207aadcc33785e4f29 in all environments; ContactForm script/fonts/CMS preserved. No naive design-system string rejection.
- Exact project original/final SHA256 41b010e330e0243a96a4256076759af543ab1e47bd12943eddb82d8e6f93082f.
- pnpm check: 36 files, 0 errors/warnings/hints.
- pnpm test: 380 boundary/unit +5 actual Astro render pass, one optional native query skip. Existing experimental SQLite informational warnings.
- pnpm worker:check dry-run pass, no deployment.
- Actual built Worker8790 with generated headers/CSP: e2e/design-system.spec.ts 7/7 pass. All computed palettes/densities/layouts/ENEL/history/focus/links/axe/business baseline/no-JS cases retained; no CSP/runtime/console errors, external fonts, mutation requests, storage/cookie changes or canonical project/content/theme hash changes.
- Direct built-HTML assertion confirms noindex,nofollow and external preview script after relocation.
- git diff --check pass. Self-reviewed complete scoped diff and producer/consumer route/asset boundary.

## Teardown and scope

Owned built Worker session5351 parent PowerShell528 launcher Node13184 -> Wrangler10804 revalidated exact command before taskkill /PID13184 /T /F; reported only owned descendants terminated. Configured4330/8790/4010/9010 have no listeners. Leave all stack stopped for root rereview/verification; root owns final dev:cms restart/open.

Canonical project/content/theme bytes remain unchanged except exact-restored environment fixture. Both reference repositories strictly untouched/read-only. No install/font/native CMS save/profile/build replay/StageB-C/hosting/sending/deployment/merge/push/tag. Known SQLite/color-environment warnings informational; ownership comparisons still best effort, not atomic. No unresolved product issue found in this fix wave; independent rereview remains root-owned.

Committed 29bbc05; post-commit working tree clean. Root scoped rereview pending.
