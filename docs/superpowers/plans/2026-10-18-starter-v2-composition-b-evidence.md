# Composition B local acceptance evidence

Date: 2026-10-18. Workspace: C:/Projects/bizness-starter-v2. Branch: codex/starter-v2-composition-b. Task 5 base: b3fec11. Node 24.12.0 and pnpm 10.13.1; dependencies stayed pinned. This is implementer acceptance evidence. Independent Task 5 review and the controller's most-capable whole-branch final review are pending; no branch-wide final approval is claimed.

## Delivered boundaries and preceding commits

| Task | Commit | Actual boundary |
| --- | --- | --- |
| 1 | d7909f6 | FAQ/steps registered references, nested copy, native controls, semantic renderers and rich-path projection. |
| 2 | 7893ab0 | Browser-safe source syntax and separate server-only physical metadata adapter. |
| 3 | 45cf603 | Media/text/gallery references, native picker/clear operations and real renderers. |
| 4 | b3fec11 | Actual native create/correction/reload/publication/reorder/removal/clear saves and guarded binary ownership. |
| 5 | Current task commit, test: verify composition b and document section contracts | All fourteen real showcase type/variant pairs in EN/EL, original samples, owned public/build acceptance and current docs. |

Task 4's reviewed native evidence is retained at .generated/composition-b-cms/run-U2sQCT and .generated/task4-evidence/native-final.log: two native tests, one separately enabled native-query test, four real saves and rejected corrections with zero new mutations. Its narrow native validation acceptance for undefined link target and opaque string/finite-number leaf IDs remains intact. Task 5 did not replay those saves or unrelated newsletter/nurture delivery. The ordinary full unit suite still includes the shared native/media contracts. Historical Foundation, Composition A and showcase evidence is preserved unchanged.

## Commands and observed results

| Command | Observed result | Retained output |
| --- | --- | --- |
| pnpm install --frozen-lockfile | Already up to date; pnpm 10.13.1; no upgrade or lockfile change. | .generated/task5-install.log |
| pnpm check | TypeScript passed; 44 Astro files, zero errors/warnings/hints. | .generated/task5-check-complete.log |
| pnpm test | 530 unit/boundary tests passed; one optional native-query skip; 16 Astro render tests passed. | .generated/task5-test-complete.log |
| pnpm build | 23 pages built. | .generated/task5-build.log |
| pnpm worker:check | Successful local dry-run; no deployment. | .generated/task5-worker.log |
| pnpm cms:local-build | Tina build complete; isolated existing local skip-indexing mode. | .generated/task5-cms-build.log |
| pnpm test:showcase-builds | Real staging, production and exact-restored local builds; six owned commands. | .generated/task5-showcase-builds-final.log and .generated/showcase-builds/run-9eHpjU |
| E2E_COMPOSITION_B_FIXTURE=1 pnpm exec playwright test e2e/composition-b-content.spec.ts | 10 passed in 27.9s, owned indexed development stack. | .generated/task5-public-accepted.log and .generated/composition-b-public/run-8qDP0H |
| E2E_BASE_URL=http://127.0.0.1:8790 pnpm exec playwright test e2e/design-system.spec.ts | 7 passed in 12.2s, built assets through owned Worker and actual CSP. | .generated/task5-built-showcase-browser.log |
| E2E_COMPOSITION_B_ARTICLES_DISABLED=1 pnpm exec playwright test e2e/composition-b-builds.spec.ts | 1 passed in 13.8s; own build/runtime, exact restore and default local rebuild. | .generated/task5-articles-disabled.log and .generated/composition-b-articles-disabled/run-Uu5gHp |
| pnpm exec tsc --noEmit; git diff --check | Passed after final screenshot harness correction. | Task 5 report/tool transcript |

Playwright used only installed Chromium at C:/Projects/bizness-starter-v2/.generated/browsers. Existing Node SQLite experimental warnings, inherited NO_COLOR/FORCE_COLOR warnings and frozen-install ignored better-sqlite3/core-js build-script notices remain visible. No upgrade, browser download or broad delivery replay was performed.

## Public matrix and meaningful screenshots

The public seed is a separate initially absent Node-owned Standard page, not native authoring/upload evidence. It includes every showcase pair plus text-only media/text and an English-only optional FAQ. Known expected JSON and literal original PNG buffers determine ownership before writes; no observed unknown bytes become expected state. Creation is exclusive. Shared ownership helpers permanently revoke on conflict and preserve backups. Scope is the current EN/EL enquiries seed, not arbitrary site languages or profiles.

All eight new variants render at 375/768/1440 in EN/EL, alongside the existing six examples. The suite verifies a single H1, unique light-DOM IDs, localized safe links, visible section headings, no horizontal overflow, keyboard FAQ Enter/Space operation and visible focus, native no-JS disclosure/expanded/text-only behavior at all three widths, reduced-motion rendering, whole-section Greek omission and retained text-only CTA. Every public image is scrolled into view and browser-decoded: naturalWidth/naturalHeight match intrinsic attributes; object-fit, fixed aspect frames and center/top/bottom crops are checked.

Representative preview combinations are Neutral/compact, Trades/comfortable, Accommodation/spacious and Wellness/compact at 768px, including Greek Wellness. All four themes and three densities are exercised without treating this as a full cross-product. The existing built showcase suite additionally retains its four-theme/three-density/three-width computed-token checks, language/history/reset/storage/source invariance and no runtime/CSP errors or external font/mutation requests.

Eight representative axe reports have zero violations: four public locale/width pairs and four theme/density combinations. This is bounded local evidence, not accessibility certification. Retained public images are en-375.png, en-1440.png, el-375.png, el-1440.png and the four theme-density PNGs under .generated/composition-b-public/run-8qDP0H; missing-source.png and unsafe-source.png retain visible errors. Manual inspection of mobile English, desktop Greek and the loaded Greek Wellness layout found no clipping/overlap and confirmed normal/reversed media placement, cards, gallery featured layout and text-only flow. Earlier theme screenshots captured unloaded lazy-image frames; the final screenshot phase explicitly scrolls and decodes every visible image before capture. The initial ID assertion incorrectly crossed Astro toolbar shadow roots; document IDs remain strictly unique, and dev-only toolbar is removed for screenshots/axe.

## Upload refresh and source errors

The owned temporary source /uploads/composition_b_public_1792304620078.png is described by live-media.json in the final run (the recorded source field is authoritative). The test deliberately points a known fixture at an absent upload and observes the contextual visible render error. Exclusive creation adds the 480x320 original; replacement at the identical URL supplies the 320x480 original; unlink again produces the visible error. A separate stable public page records actual Vite full-reload websocket messages after each add/change/unlink operation. No restart or content/schema change is used between those three binary operations. Unsafe encoded traversal in a known owned fixture produces visible source validation rather than silent image removal, then exact valid content is restored.

The schema SHA-256 is unchanged before/after: d1b3ecec0f6279d82ae71cc1a4992063bcf6e766ff0a367353ea89481668559b. Original sample hashes and dimensions are in [sample provenance](../../STARTER_SAMPLE_ASSETS.md). Native picker clear/recovery and physical-file retention belong to Task 4's actual-save evidence, while Task 5 proves resulting text-only public rendering.

## Real environment inventories and exact restoration

| Environment | JS | CSS | Font files | Ordinary PNGs | Total inventoried | Dedicated preview entries |
| --- | --- | --- | --- | --- | --- | --- |
| staging | 96 | 2 | 32 | 2 | 132 | 0 |
| production | 96 | 2 | 32 | 2 | 132 | 0 |
| local | 97 | 3 | 32 | 2 | 134 | 2 |

Inventories retain path, bytes and SHA-256. The local entries are _astro/DesignSystem.CFkSrtFE.css and _astro/ShowcaseLayout.astro_astro_type_script_index_0_lang.BojS7CWA.js. Both ordinary starter PNGs remain byte-identical in every environment, classified as shared media. The only verifier extension is PNG fingerprint inventory; dedicated JS/CSS leakage detection is unchanged. No output-count workaround was needed for localized literal 404 copies, and the predecessor localized-static-not-found integration remains unchanged.

The showcase project hash is equal before/after: 791eda9087dab819250d4f3511f305b63d1c82a878800a498cd40b41defd231c, restored true, conflict false. The public fixture's 18 project/content/theme/sample inputs compare exactly and its page/upload are absent again. The articles-disabled owner also restores the same project hash and every original content/upload hash, removes its page, records no cleanup errors, stops its own ephemeral Wrangler runtime and rebuilds default local output. Dormant article/index bytes were untouched, while actual EN/EL browser checks retain all eight new variants with decoded images/CSP and return 404 for article index/detail/feed. The harness attempts independent Page and project restorations even if one owner refuses, and regenerates only a safe restored state.

Representative unchanged SHA-256 values:

| Source | Before = after |
| --- | --- |
| content/pages/home.json | 1dfda8fcdb9d3454025b5422d46cfc6e9e9c1e81204c28f6925b990d799d1ff3 |
| content/settings/site.json | 45a65bbaf8411f420a44d7173c62d09bc3ff135cec6823c59bc99cfd2c0b39bb |
| content/articles/sample-article.json | 2fddca08327dc1cfb000661dcdcab1384a1a13b0bb22a326716e501016a90ebf |
| content/pages/insights.json | 719f34e44aab21d8cdd2424af510be22b6417853010b3709b805b1e53be10a65 |

Both read-only references were clean at start and end: C:/Projects/bizness-starter at 7473c0839dca8fadb7d7a8f9cc459cab79aba94f and C:/Projects/financial-consulting-example at 0e1e5988dcdcba508300099ccab2643daedf1aad. Only HEAD/status snapshots were taken for Task 5; no installs/builds/saves/secret reads or process stops occurred there. .generated/task5-reference-snapshots.json retains the final comparison.

## Limits, rulings and handoff

[Content contracts](../../CONTENT_MODEL.md), [editor steps](../../COMPOSITION_AUTHORING.md), [architecture](../../ARCHITECTURE.md), [showcase usage](../../DESIGN_SYSTEM_SHOWCASE.md) and [decisions/costs](../../FOUNDATION_DECISIONS.md) now describe Composition B. Original-image bounds are 20 MiB, 20,000 pixels per side and 40 million pixels; these are safety bounds, not loading targets. Metadata validates headers/format and hashes file bytes, not exhaustive payload decode. Every resolution still reads/hashes originals; the cache is bounded to 128 entries. Intrinsic dimensions/fixed crops do not optimize downloads. There are no derivatives/srcsets, new media service, remote fetch, migration or schemaVersion change. Stage 3 optimization remains deferred.

The two original reusable PNGs cost 3,301 public bytes and ordinary image requests in nonlocal builds. Tina remains a separate Free-plan membership system with at most two CMS users; Access role lists do not synchronize seats. Existing public-static routing, Worker request/quota and hosted readiness limits stay truthful in [authentication](../../AUTHENTICATION.md) and [routing](../../STATIC_ASSET_ROUTING.md). No hosted behavior, quota accounting, real sending, deployment, push, merge or tag is claimed.

All owned stacks are stopped: launcher sessions 31557, 79660 and 53001 received Ctrl+C and reported stopping their exact children; the built Worker session 88062 shut down; isolated CMS owned process 33780 exited; the profile runtime stopped in finally. Configured ports 4330/8790/4010/9010 were checked free. The controller owns independent review, permanent review/report archival and the eventual final local stack restart. No ignored logs, native backups or scratch reports are staged in the task commit.
