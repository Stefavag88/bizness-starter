# Composition C Task 4 report

Status: implementation and native evidence complete; controller independent gate remains required. Base: c18a4917965d11743b8b5c350325bc6f31d64774. No runtime integration correction was needed. No enquiry implementation, public responsive matrix, external delivery, cloud operation, source-repository edit or subagent was used.

## Changes

- Added `e2e/composition-c-cms.spec.ts` with three actual installed Tina UI proofs. No raw write mutation is sent by the harness. Native requests are intercepted before dispatch; complete expected documents are computed with the captured active generated schema and installed CLI serializer. Only matching complete persisted records are claimed by `createCmsSources`.
- Added `e2e/helpers/composition-c-fixture.ts`, independently snapshotting exact project bytes, writing only predetermined Rooms-enabled bytes, and restoring only when those bytes still match. Unexpected bytes are retained with conflict evidence.
- Extended domain native and Rooms item regressions for edit-only index identities, flat paths, draft-only creation, immutable saved identity, disabled Delete/folders, invalid nested correction and unrelated opaque AST identity. Disabled native save catalog requests never include `roomConnection`; malformed dormant Room/index bytes remain exact.
- Updated `docs/COMPOSITION_AUTHORING.md` with actual inline Room controls, Add File, translation recovery and ownership guidance.

## Final native proof

Raw output: `.generated/composition-c-cms/native-command.log`: **3 passed in 55.7 seconds**.

| Run | Actual operations | Rejected attempts | Restoration |
| --- | --- | --- | --- |
| `run-LparIL` | 4 mutations: Room draft create; EN/EL rich text, media and amenity correction/reorder; bilingual publish; image and amenity reference removal | 1, zero mutations and exact unchanged disk | Room absent, both images absent after Room restoration |
| `index-Ah1lLH` | 1 update: optional room-list translation correction and bilingual Rooms index publication | 1 blank emptyMessage, zero mutations and exact unchanged disk | Original index byte-exact |
| `locale-rZB373` | 1 create: Standard draft with optional room-list and explicit missing Greek locale/copy initialization, correction and reload | 1 blank initialized emptyMessage, zero mutations and file remains absent | New Page absent |

Total legitimate mutations: **6**. Total rejected attempts: **3**, all zero mutations. Actual Room Remove -> Cancel sends zero mutations and leaves exact disk bytes unchanged (`run-LparIL/cancel.json`). Later amenity addition requires actual Initialize copy. Both image and amenity reorder survive save/reload. Reference removal removes only matching localized copy; both physical owned PNG uploads remain exact before cleanup. Native saved contentId/slug are read-only, collection Delete/folders are disabled by contract and absent from the observed creation surface.

Each run retains `schema-before.json`, pre-dispatch request/serializer expected records, rejection screenshots, successful save/reload evidence, and restoration backups. `final-restoration.json` independently verifies all three restoration ledgers, schema equality across all three captures and the final active schema, exact project bytes, and absent publication schedules in every Room save in both locales. The binary images were exclusive predetermined literal PNG bytes selected through the installed picker; this is native selection proof, not an upload UI claim. Unrelated rich AST identity is checked by the focused detached-operation regression; native proof checks retained serialized rich values and stable item associations after reload.

## Ownership and cleanup

Owned launcher wrapper `.generated/composition-c-launcher.mjs` imported the committed config helper and spawned `node scripts/dev.mjs --cms` with piped control input. It retained its own handle and restored configuration independently on child exit. Launcher/config ledger: `launcher.json`; exact original project backup: `config-OkuCnO/project.original.json`; exact restoration: `config-restored.json` and `final-restoration.json`.

Exact created process chain (captured command lines and creation times in `owned-processes.json`): wrapper **17060** -> development launcher **33588** -> content watcher **30904**, indexed Tina **38120**, local Worker **600**, Astro **35588**. Tina ran normal `dev --port 4010 --datalayer-port 9010 --noTelemetry`, with full indexing. Ctrl+C through the owned wrapper caused the launcher to report stopping its owned development processes. `shutdown.json` verifies no original PID/creation-time identity remains. A transient numeric PID match during the full test lifecycle was not stopped; later verification uses creation times. The wrapper exit on Ctrl+C was 1; independent restoration and shutdown were separately verified before full test/build commands.

No conflicts occurred. Rooms default remains disabled through exact restoration of original project bytes. Canonical `rooms.json` is exact-restored and remains dormant draft. No Room sample records or test PNGs remain. No regeneration was attempted from conflicted inputs. Existing ownership helpers preserve conflicts/backups rather than adopting unknown saves. Home/settings were not targeted by any mutation; final Git changes are limited to the five Task 4 files listed above.

## Iteration notes and bounded limits

Initial harness attempts used the templated Page Create New/nested-group assumptions; the installed non-template Room collection uses Add File and inline custom controls. Those failed runs restored their owned records/images. Rich editor keyboard focus after clearing needs the existing stabilization plus refocus before typing. These were harness corrections, not broadened AST/HTML allowances.

The installed optional datetime field displays a current editing value and may mark the form dirty on mount. Reload proof therefore asserts the saved title/identity and unchanged owned source rather than disabled Save. All actual request-derived Room records have `publishAt` absent in EN and EL throughout; no schedule or fallback was accepted.

One superseded missing-locale fixture used a hyphenated Page contentId (Pages use underscore IDs). It rejected without a write. Its exact worker **26276** (command and creation time reverified) was stopped while waiting for the nonexistent successful response; the replacement passed separately and in the final consolidated run. The untouched original-absence backup remains under `locale-FqVoLE`; its path is still absent. Raw failed output is retained as `native-command-superseded-fixture.log`, not presented as passing. Final proof waits are bounded at 15 seconds.

This task proves native authoring and recovery. Task 5 owns public enquiry acceptance; Task 6 owns broad public/viewport/build matrices. No public Room route availability claim is made while the canonical index is restored to draft. No CMS local-build was needed for a runtime/schema change because this task changes only proof and authoring documentation; the actual indexed stack generated and exercised the native bundle.

## Commands and results

All commands ran only in `C:/Projects/bizness-starter-v2`, Node v24.12.0, pnpm 10.13.1. Browser path was the absolute preinstalled `C:/Projects/bizness-starter-v2/.generated/browsers`; `E2E_CMS_URL=http://127.0.0.1:4330`. Actual native requests used the generated localhost:4010 GraphQL endpoint.

- `node .generated/composition-c-launcher.mjs`: owned local indexed stack, no remote operation.
- `pnpm exec playwright test e2e/composition-c-cms.spec.ts`: final 3/3 pass, output `native-command.log`.
- `pnpm exec vitest run tests/domain-native.test.ts tests/rooms-items.test.ts`: 14/14 pass, `focused-command.log`.
- `pnpm check`: 0 errors, 0 warnings, 0 hints, `check-command.log`.
- `pnpm test`: 609 pass / 1 skipped in root suite, then 21/21 footer/component tests pass, `test-command.log`.
- `pnpm build`: 23 default-disabled static pages built successfully, `build-command.log`.
- `git diff --check`: pass (only repository LF/CRLF informational warnings).

All final full tests and static build ran after verified owned stack shutdown and original project restoration. No merge, push, tag or deployment.

## Review fix round 1 — independent native media recovery

Reviewed head: `9306162c31de8c966633af7336d5d2d803e94065`. Important finding in `task-4-review.md` was verified: the original Room cleanup used `media.forEach`, so one media conflict skipped the next independently owned image and the restoration ledger. The earlier native runs prove the happy path only; they did not establish independent conflict recovery. This amendment supplies that missing proof.

Added `cleanupCompositionCNative` in `e2e/helpers/composition-c-fixture.ts` and wired the Room native proof's finally block to it. The helper reuses the existing `cleanupCompositionPublic` action/error aggregator from `composition-b-cleanup.ts`; it does not copy an error collector. It restores the referring document first. A document restoration failure retains both dependent uploads. After confirmed document restoration, each media restore is an independent action, so one upload conflict does not skip its sibling. The ledger action is always attempted, and the existing aggregator surfaces failures only after all eligible actions, including a failing ledger writer, have been attempted. The ledger now records per-image restoration flags in addition to document/file state. The independently owned project configuration remains restored by the outer launcher owner regardless of native cleanup failure.

`tests/composition-c-cleanup.test.ts` injects actual unknown file bytes through the existing ownership helpers:

1. First upload conflict after successful Room restoration: conflicting first bytes and ownership backup are preserved, second owned image is removed, both restore actions are attempted, ledger records `[false, true]`, then an AggregateError is raised.
2. Record conflict: unknown Room bytes remain, both dependent images remain and neither image restore is attempted, ledger records failed document restoration, and a separately owned outer cleanup action still executes.
3. First upload conflict plus ledger-write failure: independent second image is removed, ledger is attempted, both failures are aggregated, and a separate outer cleanup action still executes.

The tests also assert that media cleanup only runs after the record is absent. No unknown bytes are adopted or deleted. Temporary failure-injection fixtures live in unique OS temporary directories and are removed by their test owner; no native launcher or browser was started for this fix.

Raw evidence under `.generated/composition-c-cms`:

- `cleanup-red-command.log`: the three tests ran against the extracted original cleanup behavior and all three failed as expected (ordinary first errors instead of the required aggregate recovery). Exit 1.
- `cleanup-green-command.log`: `pnpm exec vitest run tests/composition-c-cleanup.test.ts tests/composition-b-cleanup.test.ts tests/cms-ownership.test.ts tests/domain-native.test.ts tests/rooms-items.test.ts`, final **48/48 passed**, five files, exit 0.
- `cleanup-check-initial-command.log`: initial `pnpm check` found the now-imported C fixture helper's pre-existing `.equals` typing against `NonSharedBuffer`. The helper now imports Node Buffer explicitly and uses `Buffer.compare` for the same byte-exact comparisons; there is no ownership-policy change.
- `cleanup-check-command.log`: final `pnpm check`, **0 errors / 0 warnings / 0 hints**, exit 0.

The native three-test replay and full suite were intentionally not repeated for this bounded test-harness recovery fix, as authorized by the controller. Prior native save/count/schema/restoration evidence remains as recorded above. The minor color-environment warning is retained as known baseline; no dependency, global environment or product change was made. Independent scoped re-review remains the acceptance gate.

## Review fix round 2 — direct Node TypeScript import

Fix base: `dfc990a8a471854383e8d1f93f736fa372c1102b`. `task-4-rereview-1.md` accepts the independent cleanup fix, but identifies the extensionless cleanup import as a direct Node launcher regression. Reproduced that exact module-resolution failure without starting a native stack or enabling Rooms.

Changed only the shared cleanup import in `composition-c-fixture.ts` to the explicit `./composition-b-cleanup.ts` path. Added the supported `allowImportingTsExtensions: true` compiler setting alongside the existing `noEmit: true`, allowing TypeScript and Vitest to accept the same direct-Node-compatible path without a new loader, wrapper or abstraction. Cleanup ordering, dependency gates, binary ownership, ledger and aggregation semantics are unchanged.

Added a persistent regression in `tests/composition-c-cleanup.test.ts` that spawns the current Node executable with `--input-type=module -e "await import('./e2e/helpers/composition-c-fixture.ts')"`. It imports only; `enableCompositionC` is never called and no native process or project mutation occurs.

Raw RED/GREEN/check evidence in `.generated/composition-c-cms`:

- `cleanup-node-import-red-command.log`: exact direct Node import fails with `ERR_MODULE_NOT_FOUND`, exit 1.
- `cleanup-node-import-test-red-command.log`: new direct-import regression fails with that same error while all three existing cleanup injections pass (1 fail, 3 pass), exit 1.
- `cleanup-node-import-green-command.log`: direct Node import succeeds after the explicit extension fix, exit 0.
- `cleanup-round2-green-command.log`: cleanup, shared cleanup, source ownership and Rooms focused tests **49/49 passed**, five files, exit 0.
- `cleanup-round2-check-command.log`: `pnpm check` passes with **0 errors / 0 warnings / 0 hints**, exit 0.

`git diff --check` passes. No native or full-suite replay was performed, as explicitly scoped by the controller. The prior actual native evidence remains unchanged. No dependencies or global environment settings changed. Independent scoped re-review remains required.
