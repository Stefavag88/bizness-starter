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

Pre-review integration corrections: four focused encoded-space URL tests failed before the link validator was narrowed to reject decoded controls rather than safe encoded path/query spaces. Two focused ID tests failed before Page contentId, section IDs, navigation pageId and keyed copy/navigation maps were changed to GraphQL-safe lowercase letter/digit/underscore identifiers with a leading letter. Editorial IDs remain kebab-safe scalar values; slugs remain hyphenated. Freshly authored section IDs were renamed directly with no name codec or legacy adapter. Full suite then passed 120 tests in 9 files; pnpm check again passed with zero Astro errors/warnings/hints.

## Task 3: modular native CMS

2026-10-16. Initial CMS tests failed against absent modules. Later focused failing tests reproduced native root metadata stripping, unsupported persisted Markdown, section IDs named body, campaign profile/eligibility boundaries, dormant article-index indexing, and installed-parser safe links/line breaks before their fixes. Native AST validation uses a detached clone and the installed browser-safe serializer; serialized Markdown lengths, supported nodes/links and strict persisted schemas apply before returning the exact original editor object.

Fresh final verification: pnpm test passes 135 tests in 17 files, with one opt-in native-query test skipped in the ordinary suite. That test separately passed against the actual local Tina GraphQL data layer, validating existing settings/page/offering/person/article values and configured hooks, preserved object/AST values, and duplicate-ID/new-record URL rejection without content writes. CMS /cms/index.html and Worker health returned HTTP 200 during owned dev:cms startup. Owned processes stopped before local builds; no source listeners were stopped.

pnpm check passes strict TS plus Astro with zero errors/warnings/hints. The descriptor was individually removed before check and before test; both recreated it via explicit configure dependencies without lifecycle-hook assumptions. pnpm cms:local-build passes with actual generated schema/type assertions for default collections, six native page templates, scalar section _template and translated settings ownership. A separate actual newsletter/articles-disabled build passes with campaign exposed and the dormant insights file excluded; exact project configuration bytes were restored. Default generated output was then rebuilt. pnpm build passes the Task 1 one-page smoke site; pnpm worker:check passes dry-run with sending/marketing false; frozen install passes.

Supporting native integration includes pure catalog validation lifted from read.mjs, lossless canonical/native regional locale projections and a small public structural descriptor. Draft campaign copy fills the omitted profile contract under coordinator ruling: Campaign[] in ContentSnapshot, empty/unread for enquiries, optional folder for newsletter/nurture, strict subject/intro/interest/article eligibility. Campaigns do not send or enter LocalizedContent.

Self-review found and resolved app 2.5.15/runtime 3.14.3 API incompatibility via targeted app 2.5.14 override; root Page _template needs real native templates rather than a reserved scalar, while section ref._template remains a safe hidden scalar. Generated public CMS vendor JS is excluded from Astro source diagnostics. Both read-only sources retain HEAD and clean status. No full native UI/public save roundtrip is claimed; Task 5 owns that proof. Independent Task 3 review remains the coordinator's gate.
