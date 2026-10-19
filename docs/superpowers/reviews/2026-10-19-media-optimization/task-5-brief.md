### Task 5: Fault-tested acceptance ownership

**Files:** New acceptance fixture/cleanup helpers, tests/media-optimization-cleanup.test.ts, verification entry point/package script test:media-optimization.

**Interfaces:** Reuse canonicalSnapshot/assertCanonicalSnapshot, owned file/media helpers and installed serializer preflight. The new verification command owns only its child processes and unique .generated/media-optimization/acceptance-* directory.

- [ ] Before any canonical fixture mutation, write fault tests for full project/content/uploads snapshot gates, pre-write owner conflict, awaited independent restoration, one failed sibling restore, dependent media retention after document conflict, false restore results, process shutdown failure and refusal to regenerate while unsafe. Retain ledger outcomes for every eligible cleanup action.
- [ ] Run pnpm exec vitest run tests/media-optimization-cleanup.test.ts; retain RED.
- [ ] Implement fixtures and command orchestration using existing ownership boundaries rather than broad reset/delete. Support separate pure/static/native runs, command/PID/time/log inventories and final snapshot comparison. Stop only verified owned launcher trees before configure/build/CMS; ports are checks, not ownership. Private acceptance runtime state only, no source D1 migration. Never overwrite external changes.
- [ ] Repeat fault tests and a no-mutation orchestration smoke; expect passing and unchanged canonical hashes. Commit test: guard media acceptance lifecycle after review.

