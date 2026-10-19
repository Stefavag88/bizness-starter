### Spec Compliance

- ✅ **P1 ADDRESSED.** `scripts/media-optimization-acceptance.mjs:16–23` rejects a second caller and reserves `active` synchronously before the first await. The reservation covers both admission gates and the owned child lifetime.
- ✅ Shutdown is checked again after the asynchronous port gate and before launch (`scripts/media-optimization-acceptance.mjs:24–25`). The encompassing finalizer releases admission on gate failure, launch/execution failure, success, and terminal inventory-write failure (`scripts/media-optimization-acceptance.mjs:51–62`).
- ✅ The deferred-port regression checks overlap refusal, finish refusal while waiting and while the child runs, absence of the rejected child's side effect, and exactly one retained command (`tests/media-optimization-cleanup.test.ts:39–61`). Port rejection, post-await snapshot conflict, and revoked shutdown each refuse launch and allow a later eligible command (`tests/media-optimization-cleanup.test.ts:64–81`).

### Strengths

- The reservation remains held through terminal command evidence, and its nested finalizer releases it even when that evidence cannot be written (`scripts/media-optimization-acceptance.mjs:54–62`).
- The overlap test observes both command outcomes and awaits the first child before assertions, avoiding an abandoned child when the regression fails (`tests/media-optimization-cleanup.test.ts:45–53`).
- The touched command function now uses conventional blocks, making the admission and release boundaries readily auditable (`scripts/media-optimization-acceptance.mjs:15–64`).

### Issues

- **Critical:** None.
- **Important:** None.
- **Minor introduced by this fix:** None. The previously recorded compressed helper formatting outside the touched command and prior full-suite warning noise remain deferred/documented; they are not new fix regressions.

### Assessment

- **Spec compliance: Approved for this scoped correction. Code quality: Approved.** No new breakage found in `34a6647..6e1d254`.
- **Checks performed:** Read the supplied immutable fix diff once, brief, original review, report, and retained focused validation. No git commands, suite reruns, subagents, or product mutations. The changed command source was additionally read for line mapping; this was redundant with the diff and exceeded the reviewer template's changed-file reread restriction.
- **Named outside-diff risk:** Whether the slot remains held until the owned child completes. Inspected `scripts/owned-command.mjs:5–62`: the existing helper resolves on child close after timeout cleanup; the fix awaits that promise before its release finalizer. Existing callback-error and process ownership behavior was not changed by this fix.
- **Retained evidence:** `task-5-fix1-green.log:14–15` reports one file and 29 tests passing. `task-5-fix1-types.log` contains no text, so TypeScript exit 0 is a report claim rather than independently observable output in that file. No TypeScript signature changed in this fix.
