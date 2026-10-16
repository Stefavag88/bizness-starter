# Foundation evidence

## Task 1: fresh repository and local toolchain

2026-10-16. Destination verified absent before creation. New branch codex/starter-v2-foundation; no remotes. Both source repositories started clean at the hashes recorded in SOURCE_INVENTORY and remained clean after implementation.

TDD evidence:

1. Config and port tests written before implementation. First `pnpm test` failed with two absent-module suites for packages/config/project.mjs and scripts/ports.mjs.
2. Minimal throwing stubs produced 12 expected behavioral failures (25 tests total), then implementation produced 25 passing tests.
3. Missing infrastructure regression failed because Zod default({}) skipped nested defaults, leaving flags undefined; prefault({}) corrected that boundary. 26 tests passed.
4. Live Ctrl+C teardown uncovered owned Windows processes surviving. The lifecycle test reproduced a shutdown timeout, and remained red after correcting the test to send an actual byte. Closing owned stdin and terminating exact child trees produced 27 passing tests. Test proves overridden health URLs, proxy, launcher exit 0, child PID removal and socket closure.

Checks: fresh install; frozen lockfile install; pnpm why tinacms (one version, 3.14.3); pnpm check (strict TypeScript and Astro 0 errors/0 warnings/0 hints); pnpm test; pnpm build (1 static neutral page); pnpm worker:check (dry-run only, both sending flags false).

Live default smoke: http://127.0.0.1:4330/ returned 200 with English and Greek sample copy; http://127.0.0.1:8790/api/health and the site /api/health proxy both returned 200. Starting a second pnpm dev failed clearly on occupied site port 4330. Both CMS commands returned exit 1 with the Task 3 availability message, as intended. The automated live test uses all four port overrides and proves teardown.

Self-review: strict unknown-key rejection includes nested objects; language/interest uniqueness and default-locale membership enforced; HTTPS origin rejects credentials and non-origin URLs; input remains immutable. Generated files/dependencies/local state ignored; no source content/assets/history copied. Source revisions and working trees compared after work. Only owned process trees were terminated. No deployment/provisioning/sending performed.

Independent review is performed by the coordinating agent after the task report; subsequent changes must retain this evidence and rerun affected checks.

## Task 2: canonical content and locale contracts

2026-10-16. Tests were written before implementation. The absent-module run failed five expected suites; minimal feature stubs then exposed 54 expected behavioral failures. Implementation reduced this to two renderer failures (null-character normalization and encoded protocol delimiter), both fixed with the security tests retained. Later approved contract additions produced five failing tests for person routes, cleared relationships, explicit article dates, independent translated schedules and no-trailing-slash paths, followed by passing implementation. Shared settings ownership tests failed against the complete duplicated-translation shape before that shape was restricted.

Fresh final verification: pnpm install --frozen-lockfile passed; pnpm test passed 114 tests in 9 files; pnpm check passed strict TypeScript plus Astro with zero errors/warnings/hints; pnpm build passed the existing one-page smoke site; pnpm worker:check passed a dry run with sending and marketing false. Authored seeds yield nine published routes per locale using the same canonical loader/projection/route pipeline. No Task 4 frontend integration is claimed.

Self-review checked strict unknown-key handling, section-ID copy ownership, required hero/H1 and Contact capability boundaries, missing optional translated sections, immutable frozen-snapshot projections, publication instants/relationships, omitted translation alternatives, all detail routes, disabled article file/index/nav/feed behavior, unsafe Markdown links and Unicode extraction. types.ts and pure publication.mjs are small supporting splits for maintainability. Shared consent provenance is settings.legal.privacyVersion; it has no alias or translated override.

Both sources retained the recorded HEAD and clean working trees. Only the new root received writes/install/build/test/Git operations. Known upstream package warnings remain as recorded in Task 1 (TypeDoc peer range and ignored better-sqlite3/core-js scripts). No production resources or real sending were used. Independent task review is owned by the coordinator after this implementation report.
