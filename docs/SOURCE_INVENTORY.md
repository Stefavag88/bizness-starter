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

The approved plan and spec were copied by exact path from the conversation workspace, preserving filenames. Runtime code was written for the new contracts. No recursive source copies were used. MarkdownIt is intentionally deferred until the shared renderer exists in Task 2.

## Installation and editor compatibility

A normal pnpm installation generated a new lockfile. `pnpm install --frozen-lockfile` then passed. CLI 4.0.1 declares tinacms ^3.14.3; a root override pins 3.14.3. `pnpm why tinacms` and the .pnpm directory inventory show exactly one editor version, shared by the root, CLI and @tinacms/app 2.5.15.

Known installation notes: transitive TypeDoc 0.26.11 declares a TypeScript peer range through 5.6 while the existing toolchain uses 5.9.3. This affects the upstream documentation utility; checks/build pass. pnpm suppresses better-sqlite3 and core-js build scripts. Native CMS runtime validation is deferred to Task 3, where collections and their local editor become available. The editor is not claimed operational here.

No inherited lockfile, node_modules, .git, secrets, databases, subscriber records, generated outputs, photographic assets or client IDs were copied.

## Task 2 provenance

Only the two source package manifests were read for Task 2. financial-consulting-example/package.json supplied the existing exact MarkdownIt version, 14.3.2; it was installed normally in the new repository and the fresh lockfile was updated. No renderer or content files were copied. Canonical schemas, rich rendering, fixtures and EN/EL content were authored directly for the new representation.

The read-only source revisions remain 7473c0839dca8fadb7d7a8f9cc459cab79aba94f and 0e1e5988dcdcba508300099ccab2643daedf1aad; both git status --porcelain=v1 outputs remained empty after Task 2. No source installation, generated output, content, configuration or Git history was changed.

## Task 3 provenance and native compatibility

The modular editor, structural descriptor, detached native validation and campaign draft-copy contract were authored directly against the reviewed canonical contracts. No client content, source CMS files, assets, generated output or dependency folders were copied. Source repositories were only queried for their unchanged revision/working-tree state; installed dependency declarations/source inside the new repository supplied the native API details. The coordinator supplied read-only evidence of financial source app 2.5.14 during compatibility investigation.

The first real native build exposed app 2.5.15 importing showErrorModal absent from pinned tinacms 3.14.3; package metadata requires ^3.14.4. A targeted app override to 2.5.14 (declared runtime ^3.14.0) preserves a single editor 3.14.3 with CLI 4.0.1 and passes local build/start. Native serializer @tinacms/mdx 2.3.0 and React types 18.3.1 are explicit direct development dependencies. No unrelated upgrade was performed. Ignored better-sqlite3/core-js scripts required no activation; the TypeDoc peer warning remains upstream documentation tooling noise.

Both source revisions remain the recorded 7473c0839dca8fadb7d7a8f9cc459cab79aba94f and 0e1e5988dcdcba508300099ccab2643daedf1aad, with empty status outputs after Task 3. Generated metadata, native Tina lock/output, CMS bundles and local state are ignored. Real infrastructure values are excluded from the public editor descriptor/config import.
