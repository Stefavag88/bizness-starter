# Composition C Task 6 acceptance report

Date: 2026-10-19. Workspace: `C:/Projects/bizness-starter-v2`. Branch: `codex/starter-v2-composition-c`. Accepted starting commit: `dca3e14819bb4778b0aa375d92b9aba1c6506637`.

## Scope and implementation

Added `pnpm test:composition-c`, `scripts/verify-composition-c.mjs`, owned public/build Playwright suites, a complete canonical snapshot helper, and focused cleanup/index-copy tests. The harness composes the accepted `createWorkerLifecycle`, `createWorkerEdit`, `createCmsSources`, `createOwnedFileEdit`, `runOwnedCommand`, and independent cleanup collector. It does not introduce a second cleanup collector or native authoring replay. Direct Node-owned fixture seeding is explicitly separate from the accepted Task 4 native UI proof and Task 5 capture-only D1 proof.

Each owner retains the complete project/content/uploads SHA-256 inventory before any fixture mutation, exact owned document/config backups, expected mode inventory, command arguments/cwd/PIDs/UTC times/raw output, actual built output inventory, and cleanup inventory. Every configure/build/CMS/Worker command is gated on stopped owned runtime state, free project ports, and the complete expected canonical snapshot. Runtime API handles are stopped and awaited before source restoration/regeneration; asynchronous source restoration is awaited; false owner restoration fails. Independent resources still restore after a sibling conflict, and regeneration is skipped on any unresolved input or shutdown conflict. Final cleanup records confirm restoration against the original full inventory.

The existing showcase verifier now applies the same full project/content/uploads gate before internal configure/build commands and refuses final local regeneration after an independent content conflict even when project restoration succeeds. Its existing per-environment asset inventories still identify dedicated preview selectors/entries rather than rejecting ordinary shared images, styles or CMS reserved-path strings.

## Narrow accessibility repair

The first public axe run detected duplicate named region landmarks when the hero and listing both used `Rooms` / `Δωμάτια`. The canonical dormant draft index now retains the hero labels and uses `Explore our rooms` / `Γνωρίστε τα δωμάτιά μας` for the listing. No inventory or availability feature was introduced. Only those two localized listing titles changed in product content. The seed test pins these titles; the actual published static listing is checked by axe. All owners created after the fix snapshot the corrected canonical bytes and restore them exactly. The superseded failing audit remains under `.generated/composition-c-task6/public-U3WW1G`.

## Coverage and evidence

Cleanup safety was fault-tested before broad fixture mutation: 3 suites / 21 tests passed. Dedicated showcase fault tests additionally cover independent content conflicts and final regeneration refusal.

The pure matrix crosses 2 Rooms values, 3 profiles and 2 articles values (12 combinations). It checks strict config parsing, content/descriptor discovery, native collection and chooser metadata, retained dormant Page section copy, hidden disabled output/navigation/contexts, and bilingual localization. Existing pure tests additionally supply real malformed Room/index JSON exclusion before parsing, native absent-query behavior, registered test-domain contracts and publication clock boundaries.

The public fixture uses actual Astro static output served by an owned local Worker. Two temporary bilingual Rooms cover an original landscape image with top crop and a text-only detail; Home/settings and all original uploads remain untouched. It checks 36 listing/detail route visits (2 locales × 3 widths × 2 JS settings × 3 routes), plus 12 keyboard CTA/contact visits; one H1, no horizontal overflow, original intrinsic image dimensions/load/object-fit/top crop, localized safe links, text-only absence of images, JS contact preselection, no-JS readable content, actual detail files and reciprocal locale alternate links. Six representative mobile axe audits and screenshots cover EN/EL listing, image detail and text-only detail. A detached snapshot at its captured `source.now` also checks that an unpublished Greek index removes Greek details/contexts and reciprocal Greek alternatives. Manual screenshot inspection supplements automated checks and is not accessibility certification.

Five representative modes each run configure, isolated CMS build, actual static build, Worker dry-run, and an actual local Worker. Modes: default Rooms=false/enquiries/articles=true; Rooms=true/enquiries/articles=true; Rooms=true/enquiries/articles=false; Rooms=true/newsletter/articles=true; Rooms=true/nurture/articles=true. Disabled mode owns a deliberately malformed index plus a schema-invalid dormant Room and verifies absent native room connection and public routes. Enabled modes publish the empty index, check localized empty states at 375/768/1440, record actual schemas/inventories/screenshots, verify Worker health, and check article/feed exclusion when articles=false. Rooms publication does not add navigation automatically.

## Actual command outcomes

The initial complete direct Playwright run passed all 7 tests (4.5 minutes). A later `pnpm test:composition-c` entry invocation first failed before mutation on an overescaped newly added schema regex; that test-only typo was corrected. The next entry invocation (`acceptance-gxkkIq`) completed all five full modes and the final public suite: 6 passed, 1 failed (4.4 minutes), exiting 1 solely because the detached Standard Page test fixture used a hyphenated contentId. The established Page contract requires underscores. The fixture was corrected to `task6_dormant` (slug remains `task6-dormant`); the covering final-source command `node node_modules/@playwright/test/cli.js test e2e/composition-c-builds.spec.ts --grep 'all 12'` then passed 1/1 test (4.5 seconds). Its raw output is `final-focused-pure.log`, and its final 12-row matrix is `pure-matrix-xMQARZ/matrix.json`. The nonzero entry is retained honestly; it is not described as an all-green entry invocation. Final acceptance uses that focused recovery plus the six unchanged, passing full/public tests rather than replaying another five unchanged lifecycle modes.

`node scripts/verify-composition-c.mjs --gates-only` exited 0. It ran the exact required package gates under complete snapshot and port checks:

| Gate | Actual result |
| --- | --- |
| `pnpm check` | Passed; 50 Astro files, 0 errors/warnings/hints |
| `pnpm test` | Passed; 67 files passed / 1 skipped, 640 tests passed / 1 skipped; footer 6 files / 21 tests passed |
| `pnpm build` | Passed; 23 local pages |
| `pnpm worker:check` | Passed; local generated Worker dry-run, no upload |
| `pnpm cms:local-build` | Passed; owned Tina build and confirmed launcher shutdown |
| `pnpm test:static-routing` | Passed; actual public assets/misses bypass Worker and protected routes invoke real Worker, including collision/CSP/header checks |
| `pnpm test:showcase-builds` | Passed; staging/production 22 pages each, final local 23 pages |

The global command/raw output/UTC clock/PIDs/restoration ledger is `.generated/composition-c-task6/acceptance-27x1kd/`. Before and after all 7 gates, the full 16-file canonical project/content/uploads inventory is exactly equal. The actual showcase asset evidence is `.generated/showcase-builds/run-UoeEIl/evidence.json`: staging 132 assets / 0 dedicated preview assets; production 132 / 0; local 134 / 2. Exact source bytes are restored, conflict=false, stages staging/production/local. Final project ports were independently confirmed free. Final local generated configuration and static dist are rebuilt for default Rooms=false/enquiries/articles=true; no public fixture records remain.

Final full-mode evidence directories under `.generated/composition-c-task6/` are `build-false-enquiries-true-UlfadJ`, `build-true-enquiries-true-wHBPTd`, `build-true-enquiries-false-hjCCom`, `build-true-newsletter-true-0RHBIN` and `build-true-nurture-true-0ixCap`. The final static public screenshots, 6 zero-violation axe audits, inventory, unpublished-index proof and explicit awaited runtime shutdown record are in `public-XJMKoU`. Each owner cleanup ledger confirms stopped runtimes and restored sources/config/index; full before/after inventories match. The retained superseded/failing entry ledgers remain alongside these directories.

Expected tooling advisories remain visible in raw logs: experimental Node SQLite and NO_COLOR/FORCE_COLOR notices, plus Wrangler's update-available informational notice. No new check warnings/errors or integration blocker remains. `git diff --cached --check` passes; only line-ending conversion notices were emitted. Independent review is still required before the orchestrator accepts Task 6.

## Boundaries and handoff

All commands ran in the authorized v2 workspace. Neither source repository was installed, built, saved or stopped. No dependencies changed. No D1 migration, cloud account/resource setup, real delivery, hosted deployment, push, tag or merge occurred. Sending and marketing configuration remain false. Generated local evidence is retained under `.generated/composition-c-task6`; independent review remains the orchestrator's next acceptance step.

Local implementation commit: `2c451d0` (`test: verify composition c public and module boundaries`). Working tree clean after commit. This report and raw generated evidence remain in the existing ignored harness/evidence directories for the orchestrator's independent review.
