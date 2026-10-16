# Source inventory

Created 2026-10-16 in a verified absent destination, C:/Projects/bizness-starter-v2. Fresh Git branch: codex/starter-v2-foundation; no remotes or imported history.

## Read-only source snapshots

- C:/Projects/bizness-starter at 7473c0839dca8fadb7d7a8f9cc459cab79aba94f. `git status --porcelain=v1` was empty before and after extraction.
- C:/Projects/financial-consulting-example at 0e1e5988dcdcba508300099ccab2643daedf1aad. `git status --porcelain=v1` was empty before and after extraction.

Only tracked tooling and guidance were read. No source environment files or secret values were read. No source commands that install, generate, save content or change Git state were run.

## Task 1 provenance

| Source path | Classification | New use |
| --- | --- | --- |
| bizness-starter/package.json and apps/site/package.json | Reusable after selection | Existing Node/pnpm constraints and exact Zod, Astro, Tina, TypeScript, Wrangler and Vitest versions; fresh manifests and lockfile |
| bizness-starter/project.json | Reusable after generalization | Configuration field names and neutral placeholders; new strict browser-safe validator; new version fields |
| bizness-starter/scripts/wrangler.mjs | Reusable after adaptation | Scoped Wrangler log/config paths, metrics disabled, error/signal handling |
| bizness-starter/scripts/configure.mjs | Reusable after generalization | Generate only local tool configuration; no content, resources or backend bindings copied in Task 1 |
| bizness-starter/apps/site/astro.config.mjs, tsconfig.json, vitest.config.ts | Reusable after adaptation | Static Astro/strict TypeScript/test boundaries, configurable isolated API proxy |
| financial-consulting-example/package.json | Reference only | Corroborated existing dependency versions and nondefault CMS port contract |
| Both AGENTS.md files | Reference only | Source-specific guidance inspected; no source UI or brand assets transferred |
| Financial client content, assets and styles | Example only; excluded | None copied |

The approved plan and spec were copied by exact path from the conversation workspace, preserving filenames. Runtime code was written for the new contracts. No recursive source copies were used. Task 1 omitted MarkdownIt; Task 2 added it with the shared renderer.

## Installation and editor compatibility

A normal pnpm installation generated a new lockfile. `pnpm install --frozen-lockfile` then passed. CLI 4.0.1 declares tinacms ^3.14.3; a root override pins 3.14.3. `pnpm why tinacms` and the .pnpm directory inventory show exactly one editor version, shared by the root and CLI. The initial app 2.5.15 selection was corrected to app 2.5.14 in Task 3 after actual runtime verification.

Known installation notes: transitive TypeDoc 0.26.11 declares a TypeScript peer range through 5.6 while the existing toolchain uses 5.9.3. This affects the upstream documentation utility; checks/build pass. pnpm suppresses better-sqlite3 and core-js build scripts. Task 3 subsequently verified native build/start with app 2.5.14; Task 5 verifies native UI saves and public roundtrips. These initial installation observations are retained as provenance.

No inherited lockfile, node_modules, .git, secrets, databases, subscriber records, generated outputs, photographic assets or client IDs were copied.

## Task 2 provenance

Only the two source package manifests were read for Task 2. financial-consulting-example/package.json supplied the existing exact MarkdownIt version, 14.3.2; it was installed normally in the new repository and the fresh lockfile was updated. No renderer or content files were copied. Canonical schemas, rich rendering, fixtures and EN/EL content were authored directly for the new representation.

The read-only source revisions remain 7473c0839dca8fadb7d7a8f9cc459cab79aba94f and 0e1e5988dcdcba508300099ccab2643daedf1aad; both git status --porcelain=v1 outputs remained empty after Task 2. No source installation, generated output, content, configuration or Git history was changed.

## Task 3 provenance and native compatibility

The modular editor, structural descriptor, detached native validation and campaign draft-copy contract were authored directly against the reviewed canonical contracts. No client content, source CMS files, assets, generated output or dependency folders were copied. Source repositories were only queried for their unchanged revision/working-tree state; installed dependency declarations/source inside the new repository supplied the native API details. The coordinator supplied read-only evidence of financial source app 2.5.14 during compatibility investigation.

The first real native build exposed app 2.5.15 importing showErrorModal absent from pinned tinacms 3.14.3; package metadata requires ^3.14.4. A targeted app override to 2.5.14 (declared runtime ^3.14.0) preserves a single editor 3.14.3 with CLI 4.0.1 and passes local build/start. Native serializer @tinacms/mdx 2.3.0 and React types 18.3.1 are explicit direct development dependencies. No unrelated upgrade was performed. Ignored better-sqlite3/core-js scripts required no activation; the TypeDoc peer warning remains upstream documentation tooling noise.

Both source revisions remain the recorded 7473c0839dca8fadb7d7a8f9cc459cab79aba94f and 0e1e5988dcdcba508300099ccab2643daedf1aad, with empty status outputs after Task 3. Generated metadata, native Tina lock/output, CMS bundles and local state are ignored. Real infrastructure values are excluded from the public editor descriptor/config import.

## Task 4 provenance

The original starter's tracked worker/index.ts, campaigns.ts, db.ts, newsletter.ts, operations.ts, pages.ts, types.ts, webhook.ts, workflow.ts, security.ts and delivery.ts were selected individually, together with migrations/0001_initial.sql, packages/contracts/index.ts, packages/email/index.ts, packages/design-system/theme.mjs and its declaration, only the neutral theme JSON, scripts/design.mjs, and backend tests db.ts/security.test.ts/lifecycle.test.ts. No recursive checkout copy was used. The financial example's tracked worker/assets.ts supplied only the localized-404 helper. No experience/visitor-state implementation was copied.

Adapters replace old settings aliases with canonical brand.name/legal.businessName/legal.privacyVersion, old article identity with the canonical default-locale publication manifest, hardcoded ports with generated exact loopback origins/local URLs, and unsafe trim-before-subject-header validation with raw CR/LF rejection. The local launcher remains the new owned-process implementation and now migrates a new local DB before accepting forms. Public Astro components, pages, forms, feeds, watcher, manifests and readiness wrapper were authored for the new contracts. The source UI_UX_BASELINE.md and UI/UX Pro Max SKILL.md were read for native-label, contrast, focus, readable-measure and error-summary guidance; no financial CSS/photos/branding were used.

Noto Sans 5.2.8, aws4fetch 1.0.20 and jose 6.2.12 were installed normally in this new checkout. The font package declares Greek/Greek-ext/Latin support and imports its unicode-range-aware 400/600 CSS, with locally bundled WOFF/WOFF2 files and font-display swap. No remote font request or source asset was copied. The original neutral theme's validated semantic tokens remain; all four font roles now use the same Greek-capable neutral family. Its unused art tokens do not activate image/UI features.

No environment/secrets, database/subscriber data, generated outputs, dependency folders, financial client content/assets, Git history or remote were transferred. The smoke creates dummy enquiry/capture records only in ignored new-project-local D1; subscription tests use empty in-memory fixtures.

## Task 5 provenance

Individually selected financial-consulting-example/e2e/helpers/cms-source-ownership.ts and tests/cms-source-ownership.test.ts supplied the guarded native full-record backup/serialization/restoration approach and behavioral conflict fixtures. The new helper additionally implements installed backend datetime-to-ISO semantics and timezone tests. Native UI tests, public matrix, serial profile verifier and handoff documents were authored for this new content shape; source cms-controls.spec.ts and verify-profiles.mjs were read as references only. Source package.json supplied exact Playwright 1.63.0 and axe-core/playwright 4.13.0 versions, installed normally into the new repository. A project-local browser download is ignored under .generated/browsers. No source installation, state, media, financial styling, credentials or history was copied.
## Task 5 local toolchain note

The existing Playwright/axe versions are pinned exactly. Native app 2.5.14/editor 3.14.3/CLI 4.0.1 remain unchanged. Repeated isolated local native builds intermittently stalled at indexing after schema/type generation. The controller approved the CLI-supported --skip-indexing flag only for isolated --cms-build; dev:cms retains full indexing and passed actual native query/UI save proof. A datalayer connection startup race is inferred from installed CLI code, not asserted as an established upstream cause. No dependency upgrade or reconnect patch was made. Experimental Node SQLite and upstream TypeDoc peer-range warnings remain documented.

The source UI_UX_BASELINE.md and ui-ux-pro-max skill were read for validation/focus guidance. The contact regression changes only already-reported field feedback: correcting an invalid field clears its message before blur can move the next pointer target. New fields still validate on blur/submit. No source visual theme or client composition was transferred.
