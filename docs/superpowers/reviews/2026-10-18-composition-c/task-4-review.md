### Spec Compliance

- ❌ Issues found: the main native proof meets the requested authoring contract, but independent image recovery is incomplete on an individual image conflict (`e2e/composition-c-cms.spec.ts:52`).
- ✅ Request expectations are derived before `route.continue()` using the captured schema and installed serializer (`e2e/composition-c-cms.spec.ts:22`); the three tests drive actual editor controls rather than substituting raw write mutations (`:28`, `:65`, `:88`).
- ✅ The rejected nested Room save records unchanged request counts and bytes (`e2e/composition-c-cms.spec.ts:25`); index and missing-locale rejections do likewise (`:70`, `:92`). Actual Cancel is exercised (`:47`).
- ✅ Flat paths, edit-only index identity, draft creation, disabled Delete/folders and saved Room identity have focused contract assertions (`tests/domain-native.test.ts:68`). Disabled catalog discovery avoids roomConnection and preserves dormant malformed bytes (`:81`). Detached invalid/corrected copy preserves the opaque AST identity (`tests/rooms-items.test.ts:51`).
- ⚠️ Broader public Room/Worker acceptance and viewport matrices are outside this task and remain later gates. No claims for those were inferred from this proof.

### Strengths

- Complete native record ownership is checked through the existing `captureNative` helper rather than accepting finally-observed editor output (`e2e/composition-c-cms.spec.ts:23`, `:73`, `:94`). A focused check of unchanged `e2e/helpers/cms-source-ownership.ts` and `native-document.ts` confirmed complete structural expected-record comparison, installed CLI serializer resolution, unknown-record rejection and exact claimed-byte restoration.
- Project configuration has a separate exact original backup and expected-byte guard (`e2e/helpers/composition-c-fixture.ts:7`, `:13`). A focused check of `.generated/composition-c-launcher.mjs:12` confirmed restoration occurs independently when the owned child exits.
- `.generated/composition-c-cms/native-command.log:16` records 3 passing native tests. The named run acceptance artifacts support four Room mutations, one index mutation, one Page creation, and three rejected attempts. `run-LparIL/incomplete-translated-items.json` and `cancel.json` support zero mutations and unchanged bytes for the rejected save and actual Cancel.
- `.generated/composition-c-cms/final-restoration.json:7` records exact project restoration, unchanged schemas, absent Room schedules and all three restored document ledgers. A narrow inspection of `run-LparIL/saves.json` confirmed every derived Room save omits a saved schedule in both available locales despite the datetime control's displayed current editing date.
- `.generated/composition-c-cms/owned-processes.json:2` retains exact PID, creation time, parent and command identities; `shutdown.json:2` reports zero remaining exact owned identities. This supports the documented shutdown without treating recycled numeric PIDs as owned processes.

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- `e2e/composition-c-cms.spec.ts:52`: once the Room is safely restored, `media.forEach(m=>m.restore())` aborts on the first image restoration error. For example, an external change to the first upload makes its ownership helper preserve the conflict and throw, but the second independently owned upload is then never restored. The following restoration ledger write is skipped as well. This violates recovery of independent owned resources and leaves avoidable fixtures/evidence gaps precisely on the conflict path. Keep the existing rule to retain media when document restoration fails; after successful document restoration, attempt each media restoration independently, collect errors, always write the ledger, then surface the aggregate error. Add a focused first-image-conflict check that proves the second image is still removed and the conflicting first image is preserved.

#### Minor (Nice to Have)

- `.generated/composition-c-cms/native-command.log:4`: the final native run emits the Node warning that NO_COLOR is ignored because FORCE_COLOR is set. The passing result remains valid; remove the contradictory color environment settings for clean evidence in the next owned invocation.

### Assessment

**Task quality:** Needs fixes.

**Reasoning:** The native proof and its request-derived ownership are credible, and the recorded passing runs demonstrate the intended editor interactions and restoration on the happy path. Fix the independently recoverable image cleanup path before accepting this task's recovery guarantee.

**Checks:** Read the supplied diff in two output-bounded passes after the first tool response truncated its middle; no changed product file was independently reread. Outside-diff reads were limited to the named ownership/serializer, launcher and raw-evidence risks above. No test replay, runtime code changes, process operations, Git/index/HEAD changes or subagents were used.
