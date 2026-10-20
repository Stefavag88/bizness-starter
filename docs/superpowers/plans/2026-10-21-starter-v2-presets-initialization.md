# Starter Presets and Independent Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The owner selected inline implementation with one final independent review in the approved design.

**Goal:** Offer a local gallery of four business presets plus a neutral baseline and safely create an independently editable application from any selection.

**Architecture:** A server-only preset catalog produces validated canonical seed files. A CLI exports a reviewed application source snapshot and safe configuration to an empty destination. Local-only gallery routes render detached seeds through explicit shared rendering context; client projects have no preset runtime dependency.

**Tech Stack:** Node 22.x/24.x, pnpm 10.13.1, JavaScript ESM with declaration files, TypeScript, Astro 7.3.6, TinaCMS 3.14.3, Vitest, Playwright and the existing local Cloudflare Worker/D1 tooling. No new production dependencies.

**Spec:** [Approved design](../specs/2026-10-21-starter-v2-presets-initialization-design.md), approved by the owner after commit f57d5cb on 2026-10-21. Execution baseline includes backlog fixes ab4384f.

## Global Constraints

- English Markdown; seed/public interfaces support English and Greek. Generated projects may select en, el or both, with default language in that set.
- Neutral plus professional-services, trades, accommodation and studio presets; business type and functional profile are independent. Initializer defaults to enquiries.
- Suggested themes are neutral, trades, accommodation and wellness, independently selectable from existing validated themes.
- Existing static Astro/Tina/Worker architecture, shared immutable slugs, independent language publishing and strict content schemas remain authoritative.
- No reservations, payments, accounts, new Classes domain, provisioning, remote migrations, deployment, remote push or release tag.
- Sending/marketing and content/legal review flags reset false. Hosted release remains blocked; no secrets, local DBs, dependencies, generated output, subscriber data or Git history are exported.
- Preserve C:/Projects/financial-consulting-example and C:/Projects/bizness-starter as read-only references. This plan runs in the approved v2 repository; use a dedicated codex/starter-v2-presets branch at execution, preserving attached worktree guidance.
- CLI never overwrites or deletes an occupied destination, installs dependencies implicitly, starts a server implicitly or edits the starter's canonical content.
- Use the existing complete-record/schema/serializer ownership helpers for native save acceptance. Stop only owned processes and serialize lifecycle-owning verification.
- Write task verification/decisions into one execution ledger and commit each coherent task. Perform one independent review after all tasks, then one correction pass for important findings.

## Review Focus

1. A destination changes between validation and creation: exclusive writes must preserve the competing file and never delete the partial project. Task 3 collision test.
2. A symlink/junction disguises a destination inside the source: resolved ancestor checks must reject it before export. Task 3 Windows junction test.
3. A source editor changes a file during export: snapshot hashing must reject mixed-version output and preserve unknown destination edits. Task 2 snapshot race and Task 3 failure tests.
4. A Greek-only destination or articles-disabled preset retains broken references: bundle validation and actual target build must reject/avoid them. Tasks 1 and 6 matrix.
5. A preview rich-text link, signup control or client script escapes into the authored site/API/storage: explicit context and intercepted-request/storage tests must prevent it. Tasks 4–6.

## Units and interfaces

Use .mjs/.d.mts pairs for Node-consumed helpers. Keep browser metadata free of filesystem/content-loader imports. Paths below are relative to C:/Projects/bizness-starter-v2.

- `packages/presets/catalog.mjs`: immutable public metadata only.
- `packages/presets/bundle.mjs` and `packages/presets/seeds/`: create independent canonical content/configuration from reviewed seed records.
- `scripts/initialize/export-manifest.json`, `snapshot.mjs`, `options.mjs`, `destination.mjs`, `initialize.mjs`: export inventory, source snapshot, CLI parsing, ownership checks and exclusive creation respectively.
- `scripts/create-project.mjs`: thin CLI; no filesystem-writing HTTP endpoint.
- `scripts/initialize/client/`: package-script template, application quickstart and preset-independent client smoke test.
- `.starter-tools.json`: source-only marker `{ "kind": "starter-source", "version": 1 }`; initializer excludes it. `starter-provenance.json` belongs only to generated destinations.
- `apps/site/src/lib/render-context.ts`: pure render/link context; normal routes keep current defaults.
- `apps/site/src/presets/`: local-only gallery/preview entries, presenter and external CSS. Client export excludes this directory and preset packages.
- `scripts/verify-initialization.mjs`, `scripts/verify-presets.mjs` and `e2e/presets*.spec.ts`: owned disposable application, CMS and artifact proofs.

### Task 1: Versioned catalog and validated seed bundles

**Files:** Create catalog/bundle .mjs and .d.mts files, `packages/presets/seeds/{neutral,professional-services,trades,accommodation,studio}.mjs`, `tests/preset-bundles.test.ts`; update package scripts only when a task introduces its command.

**Interfaces:**
- `PresetId = 'neutral'|'professional-services'|'trades'|'accommodation'|'studio'`.
- `PresetMetadata = {id:PresetId,version:1,title:{en:string,el:string},summary:{en:string,el:string},suggestedTheme:string,rooms:boolean}`.
- `presetCatalog: readonly PresetMetadata[]`.
- `createPresetBundle(id, {name,languages:('en'|'el')[],defaultLanguage:'en'|'el',theme:string,articles?:boolean}): {project:ProjectConfig, files:Map<string,Uint8Array>}`. files contains only canonical content and required reviewed media, not source code/project.json.

- [ ] Write failing tests: exactly five metadata IDs; unknown selection rejects; every bundle parses project/content/localization/routes; Home compositions differ beyond theme; no booking/account claims. Use the real loader on owned temporary content roots.
- [ ] Run `pnpm exec vitest run tests/preset-bundles.test.ts`; expect failure for missing catalog/bundle implementation.
- [ ] Implement declarative EN/EL seeds and safe project defaults using parseProject, canonical document schemas and existing domain registry. Neutral reproduces the current neutral baseline. Theme suggestions: professional-services→neutral, trades→trades, accommodation→accommodation, studio→wellness. Required contact/legal fields use obvious sample placeholders, optional real channels blank.
- [ ] Add matrix cases for en-only, el-only/default-el, bilingual/default-en, bilingual/default-el, articles off and all independently selectable themes. Prune untranslated seed copy and disabled article links deliberately; do not invent translations.
- [ ] Accommodation enables Rooms with complete fictional sample records and a published localized index; other presets keep Rooms dormant. Studio classes use Offerings/People and an informational Standard Page, with no new domain schema.
- [ ] Run focused tests plus existing content/Rooms/publication/manifest tests. Expect no changes to source content/project.json and no weakening of schema validation.
- [ ] Commit `feat: add validated bilingual business preset bundles`.

### Task 2: Reviewed application export snapshot and client tooling

**Files:** Create `scripts/initialize/export-manifest.json`, `snapshot.mjs/.d.mts`, client templates, `.starter-tools.json`, `tests/initializer-export.test.ts`. Modify `apps/site/astro.config.mjs` only to tolerate an absent source-only gallery marker/entry; preserve design-system behavior.

**Interfaces:**
- `snapshotApplication(root:string): {revision:string, files:Map<string,{bytes:Uint8Array,sha256:string}>, assertUnchanged():void}`.
- `createClientPackage(name:string, sourcePackage:object):object`; preserves dependency/engine/package-manager definitions so the existing lockfile remains usable with frozen install.
- Client export includes its own generic `tests/project.test.ts` and current Vitest/TypeScript configuration. Its root test command runs the included tests, never absent maintainer suites.

- [ ] Write failing tests for explicit inventory completeness, denied source classes and modified source detection. Place dummy env/database/cache/review files outside allowed paths and assert none are included.
- [ ] Run `pnpm exec vitest run tests/initializer-export.test.ts`; expect missing snapshot/export failures.
- [ ] Author an explicit file inventory for worker, packages except presets, Tina, application sources/assets except dedicated gallery, all migrations, lock/workspace/tsconfig/Vitest files and the necessary configure/design/ports/build/dev/security helpers. Inventory additions require a reviewed explicit entry; do not recursively copy arbitrary workspace directories or all tracked files.
- [ ] Store exact bytes/hashes and source HEAD once; recheck every selected source and inventory before/during finalization. Refuse symlinks, unapproved files or changed source instead of creating a mixed export. Do not read unselected secret files for diagnostics.
- [ ] Provide client package scripts for configure/check/test/build/dev/dev:cms/worker:check/db:local/doctor/deploy:check. Include production readiness/operations and concise client authoring docs; omit historical evidence, starter gallery/initializer tests and maintenance-only CI/scripts. Include portable boundary tests only with their full fixtures and no neutral-content assumptions.
- [ ] Client Astro configuration must remain valid when the excluded gallery marker/files do not exist; do not retain imports into excluded packages. Prove module/import closure by a destination build in Task 6.
- [ ] Run export tests and `pnpm check`; commit `feat: define independent client application export`.

### Task 3: Safe CLI initialization and provenance

**Files:** Create initialize options/destination/initialize .mjs/.d.mts helpers, `scripts/create-project.mjs`, `tests/project-initializer.test.ts`; modify root package.json with `create:project`.

**Interfaces:**
- `parseInitializeArgs(argv:string[]): {help:boolean,dryRun:boolean,preset:PresetId,name:string,destination:string,languages:('en'|'el')[],defaultLanguage:'en'|'el',theme?:string}`. Reject unknown/duplicate options and missing values; no automatic prompt or shell evaluation.
- `inspectDestination(source:string,target:string): {source:string,target:string,existedEmpty:boolean,assertOwned():void}`; resolves existing ancestors and checks every path component.
- `initializeProject({source,options,dryRun}): Promise<{destination:string,createdFiles:string[],revision:string,nextCommands:string[]}>`.
- Provenance: `starter-provenance.json = {format:1,starterVersion:'2.0.0-dev',sourceRevision:string,preset:PresetId,presetVersion:1}`. No source absolute path, account details or private snapshot.

- [ ] Write failing tests for help/dry-run with zero writes, invalid options, occupied directory, Git repository, source/ancestor/descendant targets, junction aliases, missing parent and competing files after inspection.
- [ ] Run `pnpm exec vitest run tests/project-initializer.test.ts`; expect missing initializer failures.
- [ ] Resolve theme/languages/defaults with Task 1. Require an existing regular parent directory; create only the requested destination or verify a pre-existing empty regular directory. Reject any pre-existing .git and source ancestry overlap. Never remove contents to make a target empty.
- [ ] Snapshot Task 2, validate the full planned file set for conflicts, then create files exclusively with exact paths and ownership checks. Export preset content instead of source business content; construct destination project.json from safe defaults, never spread source infrastructure. Copy all migrations and reviewed media.
- [ ] Test failure halfway through writes and source mutation during export. Report the created-file list and conflict, retaining partial output and unknown files; no recursive cleanup or force option.
- [ ] Run `git init -- <resolved destination>` via argument-array process API after final validation; set no identity, remote or commit. Verify no inherited history/remotes. Record provenance, print dependency/check/run steps; never run install or launcher automatically.
- [ ] Add safe PowerShell display quoting for paths when commands are shown, including spaces, apostrophes and shell metacharacters. CLI arguments are never interpolated into executable shell strings.
- [ ] Run initializer/export/bundle tests and checks; commit `feat: initialize safe independent business projects`.

### Task 4: Explicit shared rendering context and preview-safe forms

**Files:** Create `apps/site/src/lib/render-context.ts` and tests; modify `lib/content.ts`, `layouts/Layout.astro`, `templates/{Page,EditorialDetail,ContactForm}.astro`, existing section renderers including Rooms, and UI `{Button,RichText,Description,SectionImage}.astro` only where context must propagate. Existing styles/design remain unchanged.

**Interfaces:**
- `RenderContext = {project:ProjectConfig,routes:PublicRoute[],previewBase?:string,link(href:string,locale:string):string,rich(value:string,locale:string,inline?:boolean,links?:boolean):string}`.
- `createRenderContext(project,routes,{previewBase?:string}={}):RenderContext`; use existing safe renderer/resolveContentLink, not HTML postprocessing or arbitrary path injection.
- A new optional `context?:RenderContext` prop is passed explicitly from Layout/Page to all affected descendants; absent context uses the current canonical project/routes and preserves behavior.

- [ ] Add failing pure/render tests for default public links unchanged, same-preset internal/alternate/rich-text links, safe fragments/query handling, external links unchanged and malformed preview-base rejection.
- [ ] Run focused context and existing link/component tests; expect preview behavior failures before implementation.
- [ ] Extract context-safe rich/link resolution from lib/content.ts while preserving its public API as wrappers around the normal context. No browser bundle may import the filesystem adapter. Thread context explicitly; no module-global mutation, Astro.locals ambient dependency or rewriting rendered HTML/anchor strings.
- [ ] Layout uses the context project for identity/theme/languages/metadata. Preview canonical/feed links are omitted and robots is noindex. Preview disables visitor experience output and business social destinations.
- [ ] ContactForm preview renders representative fields disabled, with disabled submit, no business form data markers/action and no endpoint calls. Normal forms are unchanged. Page/Editorial/Room and nested section links all use the supplied context.
- [ ] Run existing contact/newsletter/link/render tests plus `pnpm check`, `pnpm test`, `pnpm build` with owned launchers stopped. Commit `refactor: support explicit isolated preview rendering`.

### Task 5: Local preset gallery and full previews

**Files:** Create `apps/site/src/presets/{Gallery,Preview}.astro`, presenter helper/CSS and `tests/preset-routes.test.ts`; modify `apps/site/astro.config.mjs` and `scripts/dev.mjs`; add `e2e/presets.spec.ts`.

**Interfaces:**
- Source marker plus local environment permits routes `/templates` and `/templates/[preset]/[theme]/[locale]/[...path]` through pre-graph injectRoute. An empty path denotes that preview's localized Home.
- `preparePresetPreview(preset,theme,locale): {project,content,routes,context}` uses the Task 1 validated bundle, never source content edits. Enumerate actual public routes for all five presets/four existing themes and seed locales.
- `formatInitializeCommand(options):string` shares CLI option names and safe display quoting from Task 3; the gallery only copies/displays text.

- [ ] Add failing route tests: source local marker allows gallery; staging/production and missing marker omit registration; invalid preset/theme/locale/path is not generated; preview targets stay scoped.
- [ ] Implement gallery with existing typography/tokens, distinct business descriptions and included-page/module lists. Offer preview links/theme/language choices and a copyable creation command. No privileged browser file-writing API.
- [ ] Render actual Page/Editorial/Room templates through Task 4 context. Theme is an explicit route segment, allowing static links and non-JavaScript navigation without mutating the authored site. Assets use reviewed shared sample media only.
- [ ] Advertise /templates in local source launcher output only. Keep default /en, /el, root redirect and /design-system functioning as before; client projects have no marker/gallery registration.
- [ ] Browser tests at 375/768/1440 in EN/EL: no horizontal overflow, keyboard focus, usable navigation, theme changes, no business API requests and no subscriber/preference storage changes. Include contact, rich-text crosslinks, locale alternatives and Room detail.
- [ ] Run focused route/context tests and browser suite against an owned source stack; commit `feat: add local business preset gallery`.

### Task 6: Independent-project rehearsal, exclusion proof and final review

**Files:** Create `scripts/{verify-initialization,verify-presets}.mjs`, declarations as needed, `e2e/presets-cms.spec.ts`, `docs/{PRESETS,INITIALIZATION}.md` and dated evidence report. Modify package scripts/QUICKSTART/ARCHITECTURE to link current workflow; retain historical evidence as history.

**Interfaces:**
- `pnpm test:initialization` owns disposable sibling destinations outside source ancestry, export/install/check/build tests and cleanup ownership.
- `pnpm test:presets` owns source local/staging/production artifact checks and gallery/browser checks with exact restoration guards. No simultaneous mutation-owning suites.
- Native rehearsal uses `createCmsSources`/installed serializer evidence helpers and unique ports from existing port APIs. No raw write GraphQL mutations masquerading as editor proof.

- [ ] Test generated client validation smoke without neutral sample assumptions and source inventory unchanged. Generate neutral and four presets, including Greek-only and articles-disabled representative cases.
- [ ] Install normally into owned destinations using pnpm frozen lockfile; no source node_modules copy/junction workaround. For each preset run client check/test/build/Worker dry-run. Assert separate clean Git history/no remote, safe reset fields, complete migration chain and no excluded file classes or source-runtime imports.
- [ ] Perform one actual bilingual generated trades project CMS session on distinct ports. Edit a Page section and Offering rich text, save/reload through UI, and confirm public rendering. Retain complete-record mutation ownership evidence and preserve unknown bytes on any conflict.
- [ ] Verify source local gallery output and nonlocal/client absence by route and fingerprinted dedicated JS/CSS/fixture inventories, not merely hidden navigation or an empty getStaticPaths. Keep legitimate application/media assets present. Exact-restore source project/content and local output last.
- [ ] Restore only owned fixtures after stopping owned processes; never follow junctions recursively or delete conflicted client output. Failure reports preserve destination paths/backups for review. Record supported platform/browser and external evidence limits.
- [ ] Run standard checks/tests/build/Worker dry-run and applicable focused source/client suites. Production readiness must remain blocked. Do not rerun unrelated native profile suites unless a changed boundary warrants it.
- [ ] Document preset extension, source export maintenance, initialization commands/recovery, client upgrades as reviewed patches, expected placeholders, and hosted prerequisites. Record actual commands and limits in `docs/superpowers/plans/2026-10-21-starter-v2-presets-initialization-evidence.md`.
- [ ] Dispatch one fresh read-only whole-branch reviewer. Correct important findings with failing/passing regression tests and repeat affected verification; preserve the original review and controller correction evidence. No per-task reviewer dispatches.
- [ ] Commit `test: verify independent preset initialization and CMS workflow`. Leave work on the local branch; no merge/push/tag/deployment without a separate request.

## Completion criteria

All five selections create validated independent application projects; local source gallery previews actual compositions without writes; normal source/client sites retain working CMS and rendering; source-only tooling is absent from nonlocal/client output; filesystem hazards and failure ownership are tested; native generated-project edits roundtrip; final checks and review corrections are recorded. Hosted deployment and production readiness are explicitly not completion claims for this plan.

## Plan self-review

Spec sections map to Tasks 1–6. The filesystem export/CLI split keeps exact-copy ownership separate from application content generation. RenderContext is defined once and consumed by both normal and preview rendering, with current defaults preserved. Each Review Focus item has a named owning task/test. Client dependency closure and native proof are explicit, not inferred from source tests. There is no dangling new Classes schema, automatic update mechanism, privileged browser write API or external-provider task.
