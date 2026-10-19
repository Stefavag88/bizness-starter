# Task 5 report — fault-tested media acceptance ownership

## Status and scope

Implemented on `codex/starter-v2-media-optimization` from accepted Task 4 base `1ea8f2e`. Candidate commit is recorded below after verification. This task adds acceptance helpers and command orchestration only. No real canonical fixture setup, native editor operation, static/browser matrix, source D1 migration, hosted operation, reference-repository edit, push or deployment ran.

Node 24.12.0 / pnpm 10.13.1. The original `canonical-before.json` remains the baseline: all 16 project/content/uploads file hashes match. Its SHA-256 is `11cd8ff23ef9bd1f07af86bd538a394771332d33fa5db47bf78262dcd418bf5c`. See `task-5-canonical-audit.json`. Both retained checkout Node-process inventories are `[]`; there was no launcher to stop or restart.

## Changes and exact public exports

- `scripts/composition-c-snapshot.mjs` preserves `canonicalSnapshot(root?)` and adds an optional root to the existing `assertCanonicalSnapshot(expected, root?)`; default behavior is unchanged. Declaration updated. Temporary-root fault tests now use the same complete canonical gate as real checkout commands.
- `e2e/helpers/media-optimization-cleanup.ts` exports `MediaRestore`, `MediaCleanupLedger`, and `cleanupMediaOptimization(options)`. Options are `{stops:[{id,stop}], restores:[{id,restore,dependsOn?}], assertInputs, regenerate:[{id,run}], record}`. Actions may be asynchronous. Explicit `false` is failure; existing void-return helpers remain supported. Stop and restoration siblings run independently and are fully awaited. Dependencies must refer to earlier restoration IDs. Failed referring records retain dependent uploads; eligible independent uploads still restore. The ledger includes every attempted/retained action and every completed/failed/skipped regeneration. Unsafe cleanup refuses regeneration. Full snapshot checking happens before and after each regeneration command, including the last. Diagnostic recording is itself awaited and included in aggregate failure.
- `e2e/helpers/media-optimization-fixture.ts` exports `createMediaOptimizationFixture({root?, documents?:string[], media?:[{path,documents:string[]}]})`. It returns `{directory,before,assertInputs,expectedSnapshot,replaceProject,createDocument,replaceDocument,createMedia,replaceMedia,cleanup}`. `replaceProject(bytes:string)` and `replaceDocument(path,bytes:string)` use `createOwnedFileEdit` plus `createWorkerEdit`; only one owned replacement per original owner is supported. `createDocument(path,value)` uses per-record `createCmsSources.createAbsent`. Media uses existing `createOwnedMedia` create/replace/restore. Paths must be contained canonical content/uploads paths, with media dependency IDs registered as documents. Existing records restore exact original bytes and absent fixtures restore absence. Full expected hashes derive exclusively from caller-known bytes or deterministic JSON serialization, never from a just-written snapshot. Every mutation checks the complete expected canonical snapshot first. `cleanup({stops?,regenerate?})` writes `cleanup.json`/`restoration.json` and switches the expected command gate back to the original baseline only after the complete baseline comparison succeeds.
- `scripts/media-optimization-acceptance.mjs` exports `createMediaAcceptanceRun({root?,expected?,isStopped?,checkPorts?})` and `verifyMediaOptimization({phase?,root?,checkPorts?})`; matching `.d.mts` declares the interface. The run returns `{directory,assertInputs,command,configure,build,finish}`. `command(nodeArgs,{cwd?,timeoutMs?,env?})` uses the existing `runOwnedCommand`, inventories executable/args/cwd/PID/start/end/success/error/log, rejects unconfirmed shutdown or overlapping commands, and checks the complete expected snapshot before/after execution. Ports are availability checks only. Command timeout termination is limited to the exact child tree created by `runOwnedCommand`; no kill-by-port/name is added. Wrangler config/log defaults are private to the unique run directory. `configure()` invokes the supported configure script; `build(args?)` invokes `apps/site/scripts/build.mjs`, never raw Astro build CLI. `finish()` writes the full before/after canonical comparison and refuses mismatch or unconfirmed shutdown.
- `scripts/verify-media-optimization.mjs` is the CLI entry, exposed by `pnpm test:media-optimization`. It accepts direct or pnpm-delimited `--pure`, `--smoke`, `--static`, `--native`. Default `--pure` runs the ownership faults. `--smoke` runs an actual short owned child with no canonical mutation. Static/native deliberately throw before creating acceptance state until Task 6 implements them.

The TS fixture modules are intended for the existing Vitest/Playwright transforms. The native Node CLI imports only supported `.mjs` orchestration. Do not directly Node-import the TS fixture's existing extensionless native-helper dependency graph.

## Task 6 phase handoff

For static acceptance, create the fixture and run before mutation, passing `expected: fixture.expectedSnapshot` to `createMediaAcceptanceRun`. Declare existing `content/pages/rooms.json` in `documents` and use `replaceDocument` for its caller-known full bytes. Declare initially absent test Pages/Rooms and their upload dependencies; use `createDocument`/`createMedia`. Use `run.configure()` then `run.build()` while owned runtimes are stopped. For multiple configuration modes, finish cleanup to the original baseline before acquiring fresh owners. Supply exact owned-runtime shutdown callbacks in cleanup and an `isStopped` predicate for command gates; callbacks must fail unless shutdown is confirmed. Build/Worker/browser commands belong to a real phase implementation, with private runtime persistence inside that run's directory. No source database migration is needed or authorized.

Native acceptance is a separate phase. **Keep native-saved paths out of the static fixture's `documents` list.** This avoids competing static byte owners and native save owners. For each native record, Task 6 creates exactly one `createCmsSources([path], privateBackupDirectory, {allowCreate:true})` owner before UI dispatch. Call its `assertUnchanged()` before a save. Intercept the actual installed native create/update request and derive the complete expected record using `expectedNativeDocument(request, installedSchema, priorExpected)` before `route.continue()`. The installed serializer/request/schema preflight must also establish the exact expected serialized bytes used for the whole-canonical snapshot hash; do not observe/adopt disk bytes to construct that expected snapshot. After the successful UI response, call that same owner's `captureNative(path,request,schema,predicate)`. Its own proof derives the complete expected document again and rejects/revokes on unexpected fields. Advance the expected hash only from the preflight bytes and then compare the entire snapshot.

Pass each native owner's `restore` as an individual `cleanupMediaOptimization.restores` action. Put `createOwnedMedia.restore` actions later with `dependsOn:[referringRecordId]`. A project-only `createMediaOptimizationFixture({documents:[],media:[]})` can own configuration independently; its `cleanup()` is another independent restoration action after the native records/media. Do not register the same native record with `replaceDocument`, or make a second owner after a UI save. Capture/restore of native records remains the established helper boundary; Task 5 introduces no native persistence API and no live native proof.

To enable each future phase, Task 6 must add its actual static/native orchestration to `verifyMediaOptimization` and only then add that phase to the supported set. The current unavailable-phase tests must become assertions for real phase execution/safety, never skipped or silently successful placeholders. The existing CLI already accepts both names so unsupported work is explicit. Separate pure/static/native logs and cleanup ledgers must remain distinct; browser/native success cannot be inferred from this task's pure run.

## TDD and validation evidence

All logs below are retained beside this report unless the ignored acceptance run directory is given.

| Evidence | Result |
| --- | --- |
| `task-5-red.log` | Expected RED: 16 failed / 2 passed against unimplemented exported helpers; no canonical fixture setup. |
| `task-5-green-1.log` | 18 passing initial fault tests. |
| `task-5-red-final-regeneration.log` | Expected RED: 2 failed / 18 passed; catches stale post-restore expected hashes and missing final regeneration comparison. |
| `task-5-green-2.log` | 20 passing. |
| `task-5-red-cli.log` | Expected RED: 1 failed / 22 passed; catches forwarded option delimiter. |
| `task-5-green-final.log` | 23 passing before existing-document refinement. |
| `task-5-red-existing-document.log` | Expected RED: 2 failed / 23 passed; missing existing static document replacement. |
| `task-5-green-existing-document.log` | Final 25 fault tests passing. |
| `task-5-pure-final.log` | Public `pnpm test:media-optimization -- --pure`: exit 0, 25 tests. |
| `task-5-smoke.log` | Public `pnpm test:media-optimization -- --smoke`: exit 0; real child and unchanged canonical state. |
| `task-5-static-unavailable.log`, `task-5-native-unavailable.log` | Expected explicit exit 1, before acceptance state creation; no static/native claim. |
| `task-5-types-1.log` | Initial type-check failure: missing new module declaration and optional-root declaration; corrected. |
| `task-5-types-2.log` | TypeScript exit 0 after corrections. |
| `task-5-check.log` | First required check exit 0, before existing-document refinement. |
| `task-5-full-test.log` | First full regression exit 0: 728 passed / 1 skipped; site 24 passed. Finished 16:41:09 local before refinement tests were written at 16:41:40. |
| `task-5-check-final.log` | Final required `pnpm check` exit 0; 53 Astro files, zero errors/warnings/hints. |
| `task-5-full-test-final.log` | Final `pnpm test` exit 0 on final implementation: 730 passed / 1 skipped; separate site suite 24 passed. |
| `task-5-canonical-audit.json` | All 16 canonical baseline entries unchanged. |
| `task-5-process-inventory.json`, `task-5-process-final.json` | Both empty; no live owned launcher was present or left running. |

Fault coverage includes changed and newly added canonical inputs, pre-write ownership revocation, exact original/absence restoration, awaited asynchronous sibling failure, actual conflicted upload with independent sibling cleanup, document-dependent upload retention, explicit false restore/stop results, rejected shutdown, unsafe regeneration refusal, checking between configure/build and after the last command, child failure PID/end/output evidence, command shutdown gates, supported build entry selection, CLI invocation, and fail-closed incomplete phases.

Final-source retained command inventories and raw logs:

- Pure: `.generated/media-optimization/acceptance-Id4MEl`.
- No-mutation smoke: `.generated/media-optimization/acceptance-IPNOcU`.
- Required final check: `.generated/media-optimization/acceptance-76Bbte`.
- Required final full test: `.generated/media-optimization/acceptance-gF1B5x` (owned PID 28720, closed successfully).
- Earlier pre-refinement check/test: `acceptance-WkBAJX` / `acceptance-X1Dnx5`, retained separately.

`task-5-gate.mjs` runs required check/test through the public ownership runner against the original `canonical-before.json`; it is retained audit orchestration, not a product entry. Full tests retain the existing SQLite experimental notices and Vitest performance suggestions. The one opt-in CMS test remains skipped without its required live endpoint; no native result is claimed. No unexpected test failure remains.

## Limits and review notes

Task 6 remains responsible for photographic fixtures/provenance, real frame/sizes/currentSrc checks, no-JS/DPR/themes/densities, static Worker/CSP delivery, warm-cache publication inventory, upload watcher invalidation, disabled modes/profiles, native select/clear/AST evidence, and full seven-gate acceptance. This task ran no real build/native/browser acceptance and changed no product runtime behavior.

Compare-before-write ownership remains the established best-effort boundary rather than an atomic filesystem lock. Existing primitive `runOwnedCommand` owns finite child commands; Task 6 must retain exact launcher PID trees and positively confirmed shutdown for long-lived runtimes. The fault tests intentionally inject shutdown/false-owner failures at this boundary without launching a real native stack. No broad reset, upload sweep, source migration or generalized persistence mechanism was added.

## Verified candidate

Commit: `34a6647` — `test: guard media acceptance lifecycle` (9 files, 172 insertions / 2 deletions). `git diff --cached --check` passed and post-commit `git status --short` is empty. Candidate is ready for independent Task 5 review; acceptance of this candidate is the controller/reviewer's decision. No reference tree or canonical file changed.

## Review fix round 1 — command admission race (base `34a6647`)

Addressed the independent review's P1 race in `createMediaAcceptanceRun.command`: previously `active` was assigned only after awaited port checks, admitting concurrent commands. Admission is now reserved synchronously before any asynchronous gate. One encompassing `try/finally` releases it after every gating/execution path; a nested finalizer releases it even if terminal command evidence fails to write. Runtime shutdown is checked again after awaited port checks and before spawning. The touched command function is expanded into conventional blocks; unrelated compressed helper formatting remains deferred as requested.

Added a deferred `checkPorts` regression: while the first call awaits, a second call must reject; `finish()` must refuse both during admission and during the sole child's lifetime; exactly one command record is retained and the second child's filesystem side effect is absent. Added port-check rejection, post-await snapshot conflict and post-await revoked-shutdown cases: each refuses the first child, releases admission, and permits a subsequent eligible child. Test failures are awaited so the RED reproduction leaves no detached child.

Evidence: `task-5-fix1-red.log` has the expected 2 failed / 27 passed (overlap actually launched, revoked shutdown actually launched). `task-5-fix1-green.log` has 29/29 passing. `task-5-fix1-types.log`: `pnpm exec tsc --noEmit` exit 0. `task-5-fix1-diff-check.log`: whitespace check exit 0 (Git's existing LF/CRLF notices only). Canonical audit again matches all 16 entries. No API signature changed, real canonical fixture setup/native UI/static matrix ran, or source D1 migration occurred.

Per controller scope, no full-suite rerun was needed for this focused fix; the earlier full-suite evidence applies to candidate `34a6647`, while this revision has the focused 29-test and TypeScript evidence above. Fix candidate commit follows below.

Fix round 1 candidate: `6e1d254` — `test: reserve media command admission before async gates`. Post-commit worktree status is clean; ready for scoped rereview of the P1 correction and touched function formatting.
