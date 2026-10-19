# Stage 3A media optimization acceptance evidence

Date: 2026-10-19. Task 6 acceptance candidate follows accepted Tasks 1–5 at `6e1d254`. This document records real changed-boundary proof, independently from the controller's later task review and whole-branch review. No deployment, sending, source D1 migration, reference-repository build or final user launcher restart was performed here.

## Static browser matrix

The actual built Worker serves the generated Astro output. Its wrapper marks every real Worker invocation; public derivative requests have no marker, correct image MIME and the existing CSP. Unknown derivative identities return 404 without producing output. Browser request inventories contain ordinary static derivative/original image URLs and no runtime transformation request. No privileged-route behavior is replaced; `/api/health` invokes the real Worker. Private runtime state/config stays inside each acceptance run.

| Build | Environment | Theme / density | Profile | Rooms | Articles | Optimization | Raw run |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| 1 | local | neutral / comfortable | enquiries | 4 | on | on | `.generated/media-optimization/acceptance-SAvATG` |
| 2 | staging | accommodation / compact | newsletter | 1 | off | on | `.generated/media-optimization/acceptance-WDKLA4` |
| 3 | production | trades / spacious | nurture | 2 | on | on | `.generated/media-optimization/acceptance-1o4tpi` |
| 4 | local | wellness / compact | enquiries | 3 | off | on | `.generated/media-optimization/acceptance-pJhP40` |
| 5 | production | neutral / spacious | enquiries | off | off | off | `.generated/media-optimization/acceptance-ddPY0L` |

Build 1: EN/EL × 375/640/768/1440 CSS pixels × DPR 1/2 × JavaScript enabled/disabled (32 contexts), plus EN/DPR1/JavaScript enabled at 626/627/767/769 (4 contexts). Every context visits the public media fixture, Rooms index and Room detail. Each of builds 2–5 uses 640px/DPR2/no-JavaScript and 1440px/DPR1/JavaScript; locale assignment alternates EN/EL and is retained in `browser-matrix.json`. Total: 44 contexts and 128 route inspections. This is full default-design coverage plus representative other designs, not a claim that all theme/density combinations were tested.

The media fixture has default and featured galleries with each item count 1/2/3/4, plus photo, oriented portrait, alpha PNG, small PNG and animated WebP media/text. All six size roles (including featured lead/item) are measured against browser-evaluated `sizes` within 1.1 CSS pixels; loaded `currentSrc`, srcset, intrinsic dimensions, crop, lazy/async attributes, localized alt/caption and document overflow are checked. Room cards intentionally have no caption. Disabled optimization verifies original rendering and absence of derivative inventory. Disabled modules retain dormant canonical assets while omitting public routes.

Representative EN/EL 375px axe audits have zero violations. Saved screenshots include EN/EL mobile and each additional theme at 1440px; these supplement automated geometry and are not a general accessibility certification. Chromium is the installed revision under `.generated/browsers`; no browser download ran. WebP-capable Chromium does not prove fallback selection in engines without WebP.

## Publication and warm cache

The runs execute serially and preserve the cache. Local output publishes 24 demanded candidates, including ordinary local showcase demand; warm-cache staging and production each publish exactly their 18 rendered candidates. Wellness local publishes 24; optimization-off publishes zero. `publication.json` compares all generated URLs referenced by actual output HTML with actual published files, never an independent publication algorithm. Every test fixture original remains in the build's uploads. Original starter samples remain legitimate public business assets; nonlocal exclusion concerns the local-only showcase route and dedicated preview code.

## Candidate bytes and transfer

Fixture provenance/license/source URL and SHA-256 are in `tests/fixtures/media-optimization/README.md`; fixtures are test-only and exclusively owned while copied into uploads. Full candidate metadata, URLs, source hashes and bytes are in `acceptance-SAvATG/candidate-table.json`.

Large photo: 3840×1725 JPEG, 1,610,954 bytes, SHA-256 `35f5cbcf42337206c818cf8c17f2bbeb309add5b8d4579b3432acedc6304e6c7`.

| Candidate dimensions | JPEG bytes | WebP bytes |
| --- | ---: | ---: |
| 320×143 | 10,205 | 8,940 |
| 640×287 | 36,702 | 31,722 |
| 960×431 | 80,283 | 69,668 |
| 1440×647 | 178,379 | 155,210 |
| 1920×863 | 314,123 | 275,784 |

Across 720 gallery observations, browser-selected static files range from 8,940 to 275,784 bytes, 82.88%–99.45% below this original. `selected-transfer.json` maps each actual currentSrc to the served artifact byte length and original byte length. These are selected resource payload bytes, not a universal network timing/compression benchmark.

| Fixture | Original bytes | Actual fallback candidates (dimensions: bytes) | Actual WebP candidates (dimensions: bytes) |
| --- | ---: | --- | --- |
| Oriented portrait JPEG | 2,039 | 300×600: 1,351 | 300×600: 416 |
| Transparent PNG | 2,291 | 320×160: 1,394; 400×200: 2,291 | 320×160: 222; 400×200: 280 |
| Small PNG | 238 | 100×50: 238 | 100×50: 94 |
| Animated WebP | 202 | none | none |

The portrait's stored 600×300 metadata is oriented to 300×600. Alpha/PNG fallback is lossless; equal-dimension PNG fallback has observed equal-size/lossless output here, demonstrating that savings are not universal. Every static candidate is encoded; this is not an original-byte substitution. Animation retains its original 3×2 two-frame source with `animated-or-multipage`; no flattening/animation processing or AVIF claim is made.

## Native and live proof

Native acceptance owns one `createCmsSources` record owner, excluded from the static fixture's documents. Actual Tina select/clear requests are intercepted before dispatch; `expectedNativeDocument` uses installed schema/rich-text serialization, and the installed GraphQL `stringifyFile` establishes complete expected JSON bytes before dispatch. The canonical snapshot advances from that known hash, never observed disk adoption. `captureNative` verifies the same complete document through the same owner. Body AST equality is checked across select/clear. Generated URLs never persist, and selected original uploads remain owned/present.

The final public native phase passed in `.generated/media-optimization/acceptance-SADg9D`; actual UI/schema/serializer/runtime evidence is `.generated/media-optimization/acceptance-fixture-QzojLe` (19 successful UI queries). Evidence includes installed schema/serializer paths and hashes, pre-dispatch requests/full expectations/bytes/hashes, successful UI read queries, save/clear screenshot, same-path responsive URL change, upload add/change/unlink observations, referenced missing-source visible error/recovery, separate Tina/Astro process identities/close records and dependent cleanup ledger. Astro development can retain an already-streamed HTTP 200 while displaying its actionable error page; the contract is the visible contextual source error, not a new HTTP-status guarantee.

## Failure preservation, commands and cleanup

`task-6-red-phases.log` records the intentional phase-dispatch RED assertions. `task-6-green-phases.log` records their GREEN. The final-source focused pure phase records 134 passing tests in 10 files, including reviewed ownership faults, media source/config/encoder/cache/session/integration/layout and exact owned runtime shutdown.

`task-6-static-attempt-1.log` retains four caption-expectation failures and one passing optimization-off case. Room cards intentionally omit captions; correcting the test produced `task-6-static-attempt-2.log` with all five configurations passing (2.6 minutes). No product change was needed. First-attempt root Playwright screenshot paths were superseded by the second attempt; its command logs/cleanup remain retained. Later phase runs use unique per-run browser-result paths so traces are retained.

Native attempt 1 timed out on an incorrect readiness log marker, with exact child shutdown and complete restoration. Attempt 2 passed select/clear/live refresh. Attempt 3 added referenced unlink and failed an unsupported HTTP-500 expectation; the visible contextual error was confirmed in its retained screenshot/runtime log, then the assertion was corrected. A pure invocation attempted while native was live was refused by the port gate before launching a child; `task-6-pure-overlap-refused.log` retains that refusal. It is not represented as a passing invocation.

All final gates run sequentially with owned servers stopped, through the public acceptance runner's complete project/content/uploads snapshots before and after each command. The seven planned gates are `pnpm check`, `pnpm test`, `pnpm build`, `pnpm worker:check`, `pnpm cms:local-build`, `pnpm test:static-routing`, and `pnpm test:showcase-builds`. Exact command arguments, child PID, start/end, exit status and raw logs are retained in their unique run directory; the Task 6 report records final outcomes. The supported site build wrapper owns build cleanup. An opt-in native-query skip in the general suite is accompanied by the separate actual live UI query proof above.

The canonical baseline is `.superpowers/sdd/2026-10-19-starter-v2-media-optimization/canonical-before.json` (16 files, SHA-256 `11cd8ff23ef9bd1f07af86bd538a394771332d33fa5db47bf78262dcd418bf5c`). Each successful cleanup checks exact original bytes/absence. Restoration failures preserve unknown records and dependent uploads and refuse regeneration. No final whole-branch approval is claimed by this task; the controller owns independent reviews, permanent archival, verified scratch cleanup and final launcher restoration.

## Harness source timing and persistence audit

The final public native invocation ran 14:07:01–14:07:46 UTC; the final full static invocation ran 14:07:46–14:10:25 UTC (`acceptance-Gj7Zeq`). Their product assertions were unchanged afterward. Two subsequent cleanup-only guards move static setup inside try/finally and make rejecting browser close an independent cleanup action. `task-6-red-cleanup-guards.log` proves both regressions fail with the guards removed; `task-6-green-cleanup-guards.log` proves 32 focused tests pass with the guards restored. These isolated faults use temporary roots and an actual owned long-lived child. Final-source public pure evidence is `acceptance-qJjQd0`, 134 tests. The earlier full native/static invocations are not described as running at final harness source.

Seven-gate attempt 1 (`acceptance-kvgUMD`) stopped at `pnpm check`, exit 2: newly reachable legacy acceptance port argument types and the new Worker's persistence option type. Earlier TypeScript diagnostics were retained in logs but trailing PowerShell reads masked their exit codes; previous pass statements were incorrect. `task-6-types-corrected.log` is the explicit exit-0 TypeScript rerun. The correction spreads the legacy port object and uses supported `persist:true,persistTo:<run>/runtime`. One focused real staging/static/browser case passed at the corrected harness source (`task-6-static-persist-focused.log`); no broad product matrix was repeated solely for cleanup/type changes.

The pinned Wrangler CLI forwards persist/persistTo separately, maps dev.persist to `args.persist === false ? false : args.persistTo`, and resolves a missing persistTo relative to `dirname(userConfigPath)/.wrangler/state`. Earlier absolute userConfigPath values already pointed inside unique acceptance directories. Actual private state file inventories corroborate that default location; final options name `<run>/runtime` explicitly. `task-6-persistence-audit.json` retains CLI hash/source lines, exact prior config paths/hashes, command cwd, state paths/metadata and removed source DB bindings for each static run. No source D1 migration ran in those phases, and no unknown source `.wrangler`/D1 files were removed or restored. Source `.wrangler` was outside the canonical hash baseline, so byte-for-byte absence of unrelated state changes there is not claimed.

## Final checkout gates

All seven checkout gates for candidate `01504ed` passed sequentially in `.generated/media-optimization/acceptance-u70xHM`; `commands.json` records each executable/arguments/cwd/PID/start/end/exit/log, and `restoration.json` confirms the complete baseline. Full tests: 737 passed / 1 opt-in skipped, with the separate site suite 24 passed. The live native run's 19 successful UI queries supply the explicit proof for the conditional query boundary. `task-6-canonical-final.json` confirms all 16 original hashes, and `task-6-process-final.json` is empty. First gate-attempt failure and successful retry remain separate; they are not presented as one uninterrupted green run. Task review and whole-branch review remain controller-owned and pending.

## Task 6 fix round 1 — native target admission

The independent Task 6 review found that exact native target equality was only checked after dispatch by captureNative. The fix adds an admission helper used before the route constructs any pending expectation: exactly one updateDocument operation, collection `page`, and nativeDocumentPath equal to the resolved backed-up fixture path are required. Create/delete/multiple writes, another target or another collection are refused. The route aborts before writing refusal diagnostics, clears pending expectations and never continues a rejected write. The touched handler is expanded into readable blocks; deferred crop/dimension assertions and other formatting are unchanged.

`task-6-fix1-red.log`: 5 expected failures / 1 pass with admission guards absent. `task-6-fix1-green.log`: all 6 passing after implementation. Tests exercise the actual admission helper used by the route, including a same-directory wrong collection, and assert zero dispatch, no pending expectation/hash advancement, and exact unchanged owned/unrelated source bytes.

At this fix's code source, the real native phase passed in `.generated/media-optimization/acceptance-6HyVRJ` (1 test, 43.7 seconds). `.generated/media-optimization/acceptance-fixture-jA1YvL` retains two admitted update/Page/media_native_acceptance.json save expectations, installed serializer/schema proof, 19 successful UI read queries, source restoration and separate positive Tina/Astro shutdown records. Final-source `pnpm check` and `pnpm test` each ran once and passed through complete stopped-stack snapshots in `acceptance-mkR7p6`: 743 root tests passed / 1 opt-in skipped, plus 24 site tests passed. Pinned Node SQLite ExperimentalWarning diagnostics remain visible and do not fail the suites.

The seven-gate run in `acceptance-u70xHM` remains evidence for `01504ed`; static/five-mode/seven-gate suites were not repeated for this admission-only fix. The real native rerun plus focused refusal tests and final check/full test cover the changed boundary. Controller-owned scoped re-review and whole-branch review remain pending.


## Final review batched fixes — 2026-10-19

Static WebP now consumes its actual session/cache WebP family in the img, with no duplicate source family; empty passthrough arrays retain original URLs. Cache marker/manifest/output reads are capped at 256 bytes / 4 KiB / 160 MiB using opened-handle bounded chunks and growth detection. Manifest bytes must be positive bounded safe integers, and initial output size mismatches refuse before payload reads. The cap includes 40 million RGBA8 pixels plus PNG framing/deflate overhead. A pinned Sharp characterization verifies 16-bit RGBA PNG input becomes the existing RGBA8/sRGB PNG output; no new precision policy was added.

Raw RED/GREEN remain under .superpowers/sdd/2026-10-19-starter-v2-media-optimization/final-fix-*.log: WebP component 1 expected failure then 3 passes; cache 12 expected failures / 14 passes then 26 passes. Focused covering set: 65 passed. Final complete gates in .generated/media-optimization/acceptance-GYhZrX: explicit pnpm check and pnpm test exit 0, 756 root passed / 1 conditional query skip and 24 site passed. The first full attempt in acceptance-7oV0k7 failed only dev-lifecycle.test.ts when Astro could not bind random port 65329 (EACCES); 755 passed / 1 skipped / 1 failed, and the owned children closed. Its failure evidence is retained, not suppressed.

Scoped real built-browser proof: .generated/media-optimization/acceptance-QtKi8z outer command ledger, acceptance-R9pvlK fixture run and acceptance-fixture-lFAEgA restoration. One Chromium test passed with EN 375px/DPR2 and EL 1440px/DPR1, 52 inspected images. Expected item copy/crop, intrinsic bytes/dimensions and candidate dimensions (one-pixel ratio rounding tolerance) are checked. Static WebP has only its img family at 320/640/800 widths; actual selected responses decoded to 800×400 and 640×320. All 27 HTML-demanded derivative identities equal publication exactly. Worker shutdown is confirmed; exact 16-file original snapshot restored; canonical 23-page local output rebuilt afterward. Temporary roots in the three reviewed tests now have guarded exact-root ownership, no reparse traversal and child shutdown in finally; unexpected failed-test evidence remains deliberately retained.

This is scoped final-fix evidence. The earlier seven gates remain at 01504ed, the broad 44-context/128-route matrix remains at its documented prior source, and the native boundary was unchanged and not broadly rerun. Existing SQLite/performance/toolchain notices remain visible. Controller owns independent scoped review, scratch archival and restoring the original stopped launcher. No hosted acceptance or source .wrangler byte-equivalence claim is added.

## Final independent review and fix wave

Whole-branch review of b49ae65..7a6420e found two Important defects: static WebP rendering did not consume its real single-family contract, and corrupt cache reads lacked byte bounds. One batched fix at ece55ba addressed both and all four minor observations. The scoped independent re-review accepted every finding with no new breakage. Full reports, decisions and raw command evidence are retained in ../reviews/2026-10-19-media-optimization/ (historical scratch paths in reports refer to that archive).

Final-source check/test passed in acceptance-GYhZrX: 756 root tests passed, one conditional skip, 24 site tests passed. The retained first attempt failed on a random dev-lifecycle bind EACCES; exact host cause remains unproven, and its failed log is preserved. Scoped built Chromium proof acceptance-QtKi8z / acceptance-R9pvlK passed in two EN/EL contexts with 52 image observations, successful static-WebP currentSrc decoding and 27 demanded identities exactly matching 27 published files. The restored canonical build also passed. Earlier seven-gate, broad matrix and native results retain their stated historical source attribution.

The controller independently compared all 16 actual canonical hashes and the complete file inventory against canonical-before.json. Both reference repository HEADs remain unchanged. Existing toolchain warnings, per-file rather than global memory bounds, Chromium-only browser evidence and the absence of hosted/release certification remain explicit limitations. Final local launcher restoration is recorded separately in the archive closeout report.
