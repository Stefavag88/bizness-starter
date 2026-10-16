# Business Starter v2 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Use a fresh implementer and independent reviewer per task, followed by whole-branch review. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Create a separate, neutral, runnable business website starter with canonical rich content, modular TinaCMS and stable Pages/section boundaries from the first release.

**Architecture:** Assemble reviewed capabilities into a new repository at `C:/Projects/bizness-starter-v2`. Treat both existing repositories as read-only references. There is one new content representation, with no legacy conversion or compatibility loader; the minimal page registry is extended in later stages.

**Tech Stack:** Astro static output, TypeScript, TinaCMS, Zod, MarkdownIt, pnpm, Vitest, Playwright and the existing Cloudflare Worker/D1/Queues/SES architecture. Reuse source implementations and test contracts, not local installations or generated output.

**Spec:** [Separate-project v2 architecture](../specs/2026-10-16-business-starter-v2-design.md). This revision supersedes the in-place Foundation plan committed as `7473c08` in the original starter. The revised separate-project spec and written plan were reviewed and approved for execution on 2026-10-16. All five tasks passed independent review. Final whole-branch review and its single scoped fix-wave rereview passed on 2026-10-16 with no open findings. Foundation is accepted for local development; stages 2–4 remain deferred.

## Global Constraints

- New product root: `C:/Projects/bizness-starter-v2`. Read-only sources: `C:/Projects/bizness-starter` and `C:/Projects/financial-consulting-example`.
- Before creating files, resolve the destination and reject any nonempty directory or existing repository. Do not delete, reset or overwrite it. Initialize fresh Git on `codex/starter-v2-foundation`, with no inherited remote or history.
- Preserve both source working trees, histories, untracked files and listeners. No source checkout, commits, CMS saves or generated-file writes during extraction.
- Retain Node `22.x || 24.x` and `pnpm@10.13.1`. Pin a compatible set of the existing runtime libraries; investigate duplicate Tina versions in the new install before accepting the editor. No unrelated dependency upgrade.
- Retain monorepo boundaries: `apps/site`, `worker`, `packages/{content,contracts,design-system,email}`, `tina`, `content`, `scripts`, `tests`, `e2e`.
- All Markdown is English; sample UI/content supports English and Greek. New IDs and slugs belong to new neutral records; client migration is out of scope.
- No provisioning, deployment, remote database changes, real sending, analytics or subscriber imports. Keep review flags false and sending/marketing disabled.
- No AXIA names, assets, specific palette, business claims or stylesheet. No legacy paragraph-array schema, migration CLI, content rollback tool or duplicated page-copy fields in Website settings.
- Keep the intended `enquiries`, `newsletter`, `nurture` capability boundaries and independently optional articles. Business presets are a later independent axis.
- No product-level preset copier, complete page builder, newsletter modal, social-channel feature or photographic media pipeline in Foundation. Stage 2/3/4 own these features as the spec describes.
- Generated CSS/manifests and Tina output are not editing targets. Test-owned backups are permitted; they are not a content migration feature. D1 schema migrations remain required for a new local database.

## Review Focus

1. Native rich-text AST validation must preserve original editor values, while persisted content remains Markdown strings and raw HTML never executes.
2. Publication and relationships must agree across public pages, locale alternatives, feeds and the generated email manifest; optional author/service relationships cannot become hard sample-data dependencies.
3. A translated section's copy must resolve by stable instance ID after a shared reorder; translations must not create their own structure or expose drafts through fallback.
4. Required page structure, duplicate/reserved URLs, unsafe links and unknown schema keys must fail with actionable errors rather than disappear through Zod stripping or template toggles.
5. A new repository/install must contain no copied secrets/history/runtime state, and its local servers/tests must not take ports from either source project.

## Task protocol and evidence

Before execution, reread applicable skills and source AGENTS guidance. Record source commit IDs, working-tree status and approved extraction paths without reading or logging secret values. Write provenance in the new `docs/SOURCE_INVENTORY.md`. Preserve these planning documents in the new repository after its creation.

Each task has a failing-test/implementation/verification cycle and independent review before its commit and the next task. Resolve findings and rerun affected checks. Keep evidence in `docs/superpowers/plans/2026-10-16-starter-v2-foundation-evidence.md`. The initial repository creation needs no worktree in a source project; later isolation, if needed, belongs to the new repository only. After all tasks, obtain independent whole-branch review. Do not publish, merge or tag a completed v2 release under this plan.

## File and interface map

| Area | Responsibility |
| --- | --- |
| `project.json`, `packages/config/project.mjs` + `.d.mts` | Validated project/profile/language/design configuration; new focused config module |
| `packages/content/{schemas,read,localize,rich-text,routes}.mjs` + `.d.mts` | Browser-safe schemas, filesystem loading, immutable locale projections, rendering and public route map |
| `tina/{collections,fields,templates,sections}/*` | Native editor organization aligned to those contracts |
| `apps/site/src/{components,templates,lib,pages}` | Static neutral rendering through a small typed registry |
| `worker`, `packages/{contracts,email}`, `migrations` | Reviewed backend reuse with new validated publication manifest |
| `scripts/{configure,design,wrangler,dev,verify-profiles}.mjs` | Generated configuration, local orchestration and safe profile verification |
| `tests`, `e2e`, `docs` | Contract tests, owned editor roundtrips, architecture and provenance |

The new `packages/config` is a focused shared configuration boundary inside the packages monorepo, not a new runtime framework or published package. No server-side fs module may be imported into a Tina browser bundle.

### Task 1: Fresh repository and isolated local toolchain

**Files:** Create `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.gitignore`, `project.json`, `packages/config/{project.mjs,project.d.mts}`, `apps/site/{package.json,astro.config.mjs,src/pages/index.astro}`, `worker/index.ts`, `scripts/{configure,dev,wrangler}.mjs`, `tests/project-config.test.ts`, `vitest.config.ts`, `docs/{SOURCE_INVENTORY,ARCHITECTURE}.md` and the reviewed plan/spec copies.

**Interfaces:** `parseProject(raw: unknown): ProjectConfig`; fields include `name`, `starterVersion`, `schemaVersion`, `profile`, `articles`, `locale`, `languages`, `siteUrl`, `environment`, `design`, `infrastructure`, `legalReviewed`, `contentReviewed`. Set `starterVersion` to `2.0.0-dev`, `schemaVersion` to `1`, default profile `enquiries`, neutral theme, languages EN/EL, environment local and sending flags false. `schemaVersion` is the new schema's version, not compatibility with v1 starter content.

- [x] Resolve/verify the empty destination, initialize the fresh local repository and record source revisions. Manually extract only reviewed tooling contracts; never recursively copy a source checkout, `.git`, `.env*`, `.dev.vars*`, dependency trees, caches, client content, generated assets or local DBs.
- [x] Add project tests: duplicate/default-missing languages, unknown profile, invalid HTTPS origin, unknown configuration keys and unsupported schemaVersion fail; both sending flags default false. Confirm failures against the absent parser, then implement the minimal validated config and a neutral smoke page.
- [x] Install dependencies from new manifests normally; pin versions using inspected source manifests as input. Add MarkdownIt only for the shared renderer. Run `pnpm install --frozen-lockfile` after lock creation and verify the installed Tina/CLI dependency graph; no inherited lock entries that create an uninvestigated duplicate editor.
- [x] Provide `pnpm check`, `pnpm test`, `pnpm build`, `pnpm dev`, `pnpm dev:cms`, `pnpm cms:local-build` and `pnpm worker:check`. `dev:cms` may report that collections arrive in Task 3 until then; do not advertise a working editor prematurely.
- [x] Use port overrides `SITE_PORT`, `WORKER_PORT`, `TINA_PORT`, `TINA_DATALAYER_PORT`; default to 4330/8790/4010/9010 and fail clearly on conflicts. Configure API proxies/test URLs from these values. No source listeners are stopped.
- [x] Run config tests, strict TS and a static smoke build plus Worker local health. Inspect new tracked files for excluded state and compare source working-tree snapshots. Independent review; commit `chore: create isolated business starter v2 foundation`.

### Task 2: Canonical content, rich renderer and immutable locale contracts

**Files:** Create `packages/content/{schemas,read,localize,rich-text,routes}.mjs` with `.d.mts`, `packages/content/index.ts`, `content/{settings/site,pages/home,pages/about,pages/contact,pages/services,pages/insights,pages/privacy,offerings/sample-service,people/sample-person,articles/sample-article}.json`, `tests/{content-schema,publication,localization,rich-text,routes}.test.ts`, `tests/fixtures/content/*`.

**Interfaces:** `readContent(root: string, project: ProjectConfig, options?: { now?: Date }): ContentSnapshot`; `localizeContent(source: ContentSnapshot, locale: string, project: ProjectConfig): LocalizedContent`; `publicRoutes(content: LocalizedContent): Route[]`. Re-export readContent as loadContent only if useful to copied consumers; do not add an adapter for source content formats. `renderRichText(body: string): string`, `renderInlineRichText(body: string, options?: { links?: boolean }): string`, `plainText(body: string, limit?: number): string`.

**Canonical shape:** Editorial records have `contentId`, shared `slug`, `status`, localized `title`, Markdown `description/body` where applicable, optional plain `seoDescription` and localized translations. People have explicit status. Article authorId/offeringId are optional; nonempty IDs must resolve. Website settings own brand/legal/contact/navigation, never hero or About copy. Pages own `_template`, contentId, shared slug, status, meta, ordered sections and copy. A section reference is `{ id, _template, variant, enabled?, appearance }`; base `copy.sections[id]` and `translations[locale].copy.sections[id]` carry prose. Translations have localized status/meta/copy, with no structural sections or appearance overrides. Preserve canonical locale names in files; Tina's underscore keys normalize on detached projections.

**Initial templates/types:** Template identifiers are home, about, contact, standard, offerings and insights (Home, About, Contact, Standard, Offering index and Article index). A protected Standard privacy record owns legal content. Initial section types are hero, rich-text, offering-list, people-list, article-list and CTA, with a neutral default variant. Appearance initially supports registered semantic surfaces only; image/custom-color controls arrive in stage 3 without moving field ownership. Required hero/H1 and Contact form are template capabilities, not removable optional sections.

- [x] Add tests for rich strings accepted and old paragraph arrays rejected; unknown keys/types/variants, duplicate instance IDs, translated structural overrides, missing default copy and stale translated section IDs fail. Require title <=200 characters, optional SEO <=300, rich summary <=10,000 and body <=100,000. Native null/blank optional SEO normalizes to empty.
- [x] Add publication tests for draft/future records and optional relationships. Supplied missing references fail validation; unpublished references prevent article publication in the relevant locale. Disabled articles are neither read nor required, even with absent/malformed dormant files; enabled empty folders are allowed. All default and translated outputs leave input untouched.
- [x] Add route tests: exactly one Home at empty slug; protected Contact/privacy and one offering/article index; unique active page/detail slugs; reject API/CMS/admin/design-system/newsletter and localized-prefix collisions. Missing editorial translation omits that record and its alternates; missing required settings/system-page translation fails clearly. Article index/nav/feed disappear when articles is false.
- [x] Add security tests before implementing adapted renderer: raw HTML escaped, H1 downgraded to H2, no links in linked-card summary mode, unsafe/control-character/protocol-relative links rejected, HTTP(S)/mailto/tel/internal relative/fragment links supported, metadata extraction Unicode-safe. Foundation rich-text toolbar has no image/embed control; content media comes in stage 3.
- [x] Confirm intended failures, implement schemas and helpers, author new EN/EL sample records directly in that representation. No migration code, arrays or old-client fixtures. Use browser-safe schema modules; filesystem loading remains separate.
- [x] Run focused tests and strict TS. Independent review of schema ownership, section-ID localization, profile conditions and route/publication consistency; commit `feat: define canonical starter content contracts`.

### Task 3: Modular Tina editor on the canonical schema

**Files:** Create `tina/config.ts`, `tina/i18n.ts`, `tina/validation.ts`, `tina/collections/{index,settings,page,offering,person,article,campaign}.ts`, `tina/fields/{common,rich-text}.ts`, `tina/templates/pages.ts`, `tina/sections/index.ts`, `tests/{cms-schema,cms-save}.test.ts`, `docs/CMS_EDITOR_CONTROLS.md`.

**Interfaces:** `buildCollections(project: ProjectConfig): Collection[]`; `withTranslations(fields: TinaField[], project: ProjectConfig, localizedNames: string[]): TinaField[]`; `validateNativeSave(values: Record<string, unknown>, kind: string, project: ProjectConfig): void`. Plain/shared fields and rich node/link constraints validate on detached projections; beforeSubmit returns the exact original values object. Full persisted schemas validate serialized Git content at read/build time.

- [x] Test collection/profile exposure, shared/localized ownership and native AST object identity. Test oversize text, null optional SEO, malformed IDs, unsafe rich links and unknown template values at both editor and loader boundaries. Rich-body controls allow H2/H3; descriptions allow inline emphasis/links without headings. Never parse an AST as a stored string or cast it to bypass validation.
- [x] Implement small collection/field factories inspired by financial source modules, excluding fixed six-page schema whitelist and AXIA fields. Settings matches its singleton file; no infrastructure or secret fields are exposed.
- [x] Foundation Pages permits editing seeded page copy, existing section visibility and neutral variants. Protect required section enablement and Contact's form. Creation/deletion and structural reorder/add operations are disabled until stage 2 adds their ID-safe authoring controls. The content schema already permits registered arbitrary pages; the UI restriction is temporary and documented.
- [x] Validate translation section copy keyed by stable IDs. Present each existing copy group with a useful label. Do not introduce an independent translation section list merely for easier Tina forms.
- [x] Build local Tina output with no active watcher owning its generated files. Verify fields/types/collections from actual generated schema. Run CMS unit tests and check. Independent review; commit `feat: add modular cms for canonical content`.

### Task 4: Neutral public pages and reviewed backend integration

**Files:** Create `apps/site/src/{layouts/Layout.astro,lib/content.ts,lib/feed.ts,components/ui/RichText.astro,components/ui/Description.astro,components/ui/Button.astro,components/ui/Field.astro,components/ui/Card.astro,templates/Page.astro,templates/sections.ts,pages/[locale]/[...path].astro,styles/global.css,styles/foundations.css}` plus section renderers for the six registered types. Extract reviewed `packages/design-system/*`, `packages/contracts/*`, `packages/email/*`, `worker/*`, `migrations/*`, `scripts/{configure,design,wrangler}.mjs`, and corresponding backend tests; add `tests/{manifest,renderer-registry}.test.ts` and `docs/ARCHITECTURE.md`.

**Interfaces:** `templates/sections.ts` statically maps registered section type/variant to Astro renderer. `Page.astro` consumes one LocalizedPage and LocalizedContent. `scripts/configure.mjs` uses the same readContent/localizeContent/publicRoutes pipeline as Astro to produce Worker configuration and the existing manifest contracts. Add no runtime component-path lookup or extra public framework.

- [x] Add registry/manifest tests before implementing: each registered section type has one renderer; unsupported variants fail; only active published routes appear; manifest article IDs equal default-locale published content IDs. Titles/metadata/RSS/email descriptions use plain SEO or extracted summary, never raw Markdown.
- [x] Render canonical sections without moving page copy back into settings. Contact template owns the form and retains native labels, server validation and feedback. Default composition stays neutral, with one H1, a simple header/footer, responsive typography and reciprocal available language links. Verify domain-specific photos/selectors/claims are absent.
- [x] Reuse the tested backend security, profile, newsletter lifecycle, queue/email and operation contracts selectively. Adapt their manifest inputs to the new content model, not the reverse. Source SQL files are initial new-DB migrations only. Fresh local records contain no subscriber data; sending remains disabled for all defaults.
- [x] Test enquiries/newsletter/nurture gating and public/admin protection using isolated local fixtures. Update health/API proxy behavior from Task 1 into the real Worker; retain safe local-only behavior and production readiness blockers. Do not activate an optional experience UI just because backend support exists.
- [x] Configure local/theme CSS generation from JSON with no raw brand overrides. Use self-hosted font roles with verified Greek coverage; no financial-specific typography or radius is mandated. Motion is absent or respects reduced-motion by default.
- [x] Run full unit tests, check, static build and Worker dry-run. Start local site/Worker on configured free ports; verify representative EN/EL pages and health. Independent review; commit `feat: integrate neutral pages and profile runtime`.

### Task 5: Native authoring proof and Foundation handoff

**Files:** Create `e2e/{foundation-cms,foundation-content}.spec.ts`, `e2e/helpers/cms-source-ownership.ts`, `playwright.config.ts`, `scripts/verify-profiles.mjs`, `tests/cms-ownership.test.ts`, `docs/{QUICKSTART,CONTENT_MODEL,SOURCE_INVENTORY,ARCHITECTURE}.md` and evidence; update package commands and source inventory.

**Interfaces:** Native CMS tests opt in via E2E_CMS_URL; E2E_BASE_URL and all local ports are configurable. The ownership helper derives expected native serialized content from mutation inputs plus active generated schema/installed serializer, validates expectations, and restores only proven owned bytes. Unrelated edits are retained and reported as conflicts.

- [x] Test ownership helper success/failure/conflict paths before running native saves. Keep backups ignored, no local source files read or written by browser page JavaScript, no raw mutation to bypass the native save UI.
- [x] Native CMS tests save EN/EL description/body, clear optional SEO, toggle an optional section and reject disabling required structure. Reload editor, assert persisted source/public output, and verify exact source restoration. Reorder/creation tests belong to stage 2 and must not be claimed here. An explicitly enabled but unavailable CMS test fails visibly.
- [x] Public browser checks cover Home/About/Contact/offering/article in EN/EL at 375/768/1440px: one H1, safe rich output, no nested links, no horizontal scroll, keyboard focus, form feedback and correct language targets. Run representative axe checks and manual screenshots; do not claim complete accessibility compliance from automation.
- [x] Run check, unit tests, build, worker dry-run, public E2E, native CMS tests and serial profile verification including articles disabled. Use only new-project local databases and ignored fixture backups; profile script restores owned configuration after failure. Do not run a CMS build against a live watcher.
- [x] Compare both source working trees/status against initial snapshots. Confirm new repo provenance is recorded, source histories/remotes are absent and all new defaults are neutral with real delivery disabled. Investigate every unexpected delta rather than reverting someone else's work.
- [x] Document how to run/edit the Foundation and its exact limitations. Record deferred owners: stage 2 full section library, section add/reorder, page creation and Rooms extension; stage 3 media/social/motion/visitor controls and hosted-provider verification; stage 4 presets, safe destination initializer and release tagging. No migration guide/CLI is needed.
- [x] Independent whole-branch review, resolve findings, rerun affected checks and commit `test: verify new starter foundation and editor`. Present a local branch/diff and the evidence. Do not merge, publish or tag v2.

## Acceptance and next-stage contracts

Foundation completes when the separate neutral repo builds/runs, its seeded Pages are editable through Tina, rich text roundtrips in both languages, backend profiles respect their boundaries and both old projects remain unchanged. The six initial section types and canonical content shape are production-oriented contracts, but hosted production readiness is not asserted.

Stage 2 extends the same registry/schema ownership with more sections and creator/reorder controls. It must not replace a temporary settings-owned page model because no such model is introduced. Internal schema changes may be versioned deliberately as v2 evolves; no support for old starter clients is promised. Stage 3 and stage 4 receive separate plans based on the verified Foundation.

## Self-review

The five review-focus conditions have owners and tests across Tasks 1–5. Shared Node/browser imports are separated, stable section IDs connect translations to structure, and all rendering/publication paths share validated inputs. No legacy migration or content compatibility task remains. New-repository assembly is separated from the later client-project initializer. Execution remains subagents with independent task reviews. The approved documents governed the new-repository implementation. The original source planning documents remain unchanged; this working copy records execution status and evidence.
