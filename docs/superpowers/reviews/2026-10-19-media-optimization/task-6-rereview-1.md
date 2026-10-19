# Task 6 fix round 1 — scoped re-review

## Verdict

**ADDRESSED.** The Important native target-admission finding is resolved for the installed native save request contract. No new blocking breakage was found in `01504ed..7a6420e`.

This is a scoped re-review of the supplied fix diff, not whole-branch approval. Product files were read only. No git commands, suite reruns or subagents were used; only this report was written.

## Finding resolution

`e2e/helpers/media-optimization-native-admission.ts:11–20` rejects requests unless the query contains exactly one recognized document write and it is `updateDocument`, the request collection is `page`, and `nativeDocumentPath(request, schema)` equals `resolve(path)` for the backed-up native fixture. The existing path resolver also rejects non-flat/invalid relative paths. The same-directory alternate-collection test ensures collection admission is independent of target-path equality.

`e2e/media-optimization-cms.spec.ts:45–70` calls that admission helper before canonical checks, serializer preflight, evidence creation or assignment of a pending expectation. It includes create/update/delete writes in interception. A refusal clears pending state, awaits `route.abort('blockedbyclient')`, and returns without reaching `route.continue()`. Aborting precedes diagnostic output, so a diagnostic-write failure cannot fall through into dispatch. Expected canonical hashes still advance only in the successful save path after response/capture; refusal never reaches that path. The fixture source owner and post-save byte comparisons remain intact.

The six focused tests exercise the actual admission helper used by the route: wrong target, wrong collection sharing the same directory, create, delete, multiple writes, and the positive intended update. The rejected cases put simulated continuation/persistence after admission and assert it is never reached, pending remains unset, the expected hash stays unchanged, and both owned/unrelated source bytes remain exact. These tests do not themselves execute a Playwright route refusal; the actual handler's abort/return sequencing was inspected directly, and the real native rerun verifies the accepted path.

## Evidence inspected

- `task-6-fix1-red.log`: five failing refusal cases and one passing positive case before guards. `task-6-fix1-green.log`: all six pass after implementation.
- `task-6-fix1-native.log` and `acceptance-6HyVRJ`: one real native test passed in 43.7 seconds. `acceptance-fixture-jA1YvL/native-saves.json` contains exactly two saves, both update / page / media_native_acceptance.json, with separate known serialized hashes. Both pre-dispatch expectation files are retained. `native-query-proof.json` records 19 successful UI queries, retained originals and unchanged body AST.
- That fixture's runtime records confirm both exact Tina/Astro children closed with shutdown confirmed. `native-cleanup.json` records restored native record/media/project, matched snapshot, and completed regeneration.
- `acceptance-mkR7p6/commands.json`: check then full test, separate explicit exitCode 0 records. `command-2.log`: 743 root tests passed / one opt-in skipped, plus 24 site tests passed. `restoration.json` records complete before/after baseline equality and unchanged=true. `task-6-fix1-process-final.json` is empty.
- The changed evidence document explicitly attributes the seven-gate `acceptance-u70xHM` run to prior candidate `01504ed`. Its 737-root-test result is not presented as a seven-gate rerun of this fix. The fix instead has focused refusal tests, real native proof, check and full test.

## New fix-diff findings

None requiring correction.

## Outside-scope observations

The earlier exact crop/oriented-dimension preservation coverage and unrelated readability observations remain deferred to final whole-branch triage, as instructed. They are not reopened by this review. Static/five-mode/seven-gate suites were not rerun for this fix; whole-branch review, archival/cleanup and launcher restoration remain controller-owned. The review makes no broader arbitrary-GraphQL parser/security certification beyond the installed native request contract.
