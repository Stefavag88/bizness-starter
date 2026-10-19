# Task 3 implementation report

Status: verified implementation candidate, pending independent controller review.

## Implemented

- Explicit root-keyed begin/get/end registry and build/dev sessions. A Symbol-keyed process registry bridges integration and Vite SSR module instances without creating sessions implicitly. Overlapping root ownership rejects.
- Build source requests deduplicate, while dev reads replacements afresh. Each session owns a separate exact demanded URL map; only those candidates can be read or published. Warm persistent cache inventory does not grant demand. Disabled/unused sessions create no cache output.
- Static publication writes demanded validated bytes into the actual build output under /_media/v1, refusing symlink/reparse destinations. It exposes neither raw cache paths nor manifests.
- Astro integration owns build start/done and server setup/done. Exact GET/HEAD media middleware provides MIME, length and immutable caching; unknown, traversal and query-generated requests cannot transform or authorize cache reads. Existing upload refresh events remain unchanged.
- Section media adapter consumes ResponsiveMedia from the explicit active session and retains page/section/item/source error context. Detached composition media, Rooms and showcase component suites explicitly begin/end sessions and retain original ownership cleanup checks.
- Pinned Astro has no general build-error hook. The approved apps/site/scripts/build.mjs public-API wrapper closes sessions in finally, including unrelated prerender errors. Site package build, dev preparation, profile verifier and showcase verifier use that entry. Existing cwd/env/timeout/process ownership remains unchanged. Supported build CLI options are forwarded; unknown arguments fail explicitly.
- Approved cache scope extension drains every sibling encode/validation/write before rejecting, preserving first failure and successful family ordering. Replaced the directly affected fixed-sleep cache test drain with actual completion. A delayed failing-write regression confirms sibling work finishes before rejection/close.

## Verification

- RED: task-3-red.log records initial absent-module contracts; task-3-red-behavior.log records nine expected behavior failures against explicit unimplemented contracts.
- Additional RED evidence: task-3-wrapper-red.log, task-3-drain-red.log and task-3-flags-red.log.
- Focused final: pnpm exec vitest run tests/media-session.test.ts tests/media-integration.test.ts tests/media-cache.test.ts: 26 passed; task-3-focused-final.log.
- Actual isolated temporary-root Astro build: controlled unrelated prerender failure, controlled compile failure, then a fresh successful media page build. Its HTML referenced /_media/v1 and the referenced output decoded to the expected width. Included in the focused integration suite; no canonical fixture mutation or reference-repository build.
- pnpm check: TypeScript and 52 Astro files, zero errors/warnings/hints; task-3-check-2.log.
- pnpm test: root suite 71 files passed/one skipped, 698 tests passed/one skipped; then six site component files and 21 tests passed. task-3-full-test.log. The opt-in cms-native-query test was skipped because no CMS_QUERY_URL was configured. Existing Node SQLite experimental warnings were retained.
- Complete project/content/uploads inventory and hashes match canonical-before.json after all checks; task-3-canonical-final.log. git diff --check passed. No launcher was active before checkout checks/full tests; the full suite owned its dev lifecycle process.

## Retained intermediate failures and corrections

- task-3-green-2.log: build-time Vite container attempted a dev registration, causing active-owner rejection. Integration now distinguishes the Astro command and detached test container.
- task-3-green-3.log: isolated temporary-root build lacked package resolution for Astro's prerender entry. The owned fixture now has a temporary node_modules junction to the installed site dependencies; recursive temporary-root cleanup owns the junction itself.
- task-3-components.log: duplicate test setup import and showcase missing explicit session ownership; corrected in task-3-components-2.log.
- task-3-check-1.log: optional hook/test-root typing errors; corrected in task-3-check-2.log.
- All per-attempt test/check logs are retained alongside this report. The controller's initial assumption that existing launchers already used the site package build script was corrected after source inspection; three direct CLI build invocations were updated under explicit ruling.

## Limits and concerns

- Task 4 responsive markup/layout is deliberately unchanged. Session demand and publication are implemented here; existing renderers still emit their original markup until Task 4.
- General build-error cleanup is guaranteed through the supported wrapper/build scripts. Direct ad hoc Astro CLI invocations bypass that finally boundary because pinned Astro offers no matching error hook.
- Publication does not clean arbitrary pre-existing output namespaces; Astro owns normal outDir cleanup. It publishes only current session demand and never scans/copies the persistent cache.
- No Worker route changes, remote services, deployments, pushes, tags, reference builds or canonical-content changes.

Commit candidate: a317582 (feat: publish demanded media as static assets).

## Review fix round 1

Finding: Important output ancestor-junction containment gap at session.mjs publication. The previous leaf-only lstat followed an ancestor junction before checking the leaf, including in disabled unused sessions.

Change: validate the complete absolute directory chain from its filesystem anchor before any output mkdir. Reject observed symlink/junction/reparse or non-directory ancestors; validate again after creation and immediately before writing/renaming publication assets and removing owned temporary files. Existing ordinary outDir behavior is preserved. No public signatures changed.

TDD evidence:

- pnpm exec vitest run tests/media-session.test.ts tests/media-integration.test.ts: RED, two new real-junction cases failed because publication resolved instead of rejecting (12 passed, 2 failed); task-3-fix1-red.log.
- Same exact command after fix: GREEN, 14 passed across two files, including actual isolated compile/prerender failure recovery and ordinary successful build; task-3-fix1-green.log.
- Both new cases assert the junction target retains exactly its original keep file and unchanged bytes: disabled/unused session and demanded-image session.
- git diff --check passed (only existing Git LF/CRLF normalization warnings). No declaration/signature change, so the requested conditional TypeScript rerun was unnecessary. No broad or downstream browser/native suite was repeated for this focused safety fix.

The pre-existing SQLite runtime-warning policy remains deferred as directed. Downstream browser/native proofs remain Tasks 4–6; no new claims made here.

Review fix round 1 commit: d141651a9b3af014c0a542807e32bca385445199. Working tree clean after commit.
