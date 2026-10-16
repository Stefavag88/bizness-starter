# Business Starter v2 — Composition A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Use a fresh implementer and independent task reviewer per task, then a whole-branch review. Steps use checkbox (`- [ ]`) syntax for tracking. Implementation reasoning remains medium.

**Goal:** Make the existing six section types composable in native Tina, with Standard page creation, explicit bilingual navigation editing and safe shared structure.

**Architecture:** Persist typed copy/label lists under schemaVersion 2 and normalize them to the existing internal ID maps. Static registered native templates replace content-derived fields. Small native field components use immutable operations and Final Form batches; public renderers, shared publication and backend profiles retain their contracts.

**Tech Stack:** Existing Astro/TypeScript/TinaCMS/Cloudflare monorepo, Zod, installed MDX serializer, Vitest and Playwright. Keep Node 22.x || 24.x, pnpm 10.13.1, editor3.14.3 / CLI4.0.1 / app2.5.14; no dependency upgrade is needed.

**Spec:** [Approved Composition A design](../specs/2026-10-16-starter-v2-composition-a-design.md), supplementing [the v2 architecture](../specs/2026-10-16-business-starter-v2-design.md).

**Status:** Approved by the user for execution on 2026-10-17. Execute continuously with subagents, independent task reviews and a final whole-branch review.

## Global Constraints

- Advance project.schemaVersion from 1 to 2. starterVersion remains 2.0.0-dev.
- Rewrite only the new starter's neutral Page/Settings seeds and test fixtures directly into the new representation.
- Do not alter either reference project, add a migration CLI or accept both persisted Page formats.
- There is one authoritative persisted format. Public normalized Page/Settings and LocalizedPage interfaces keep their ID-map semantics.
- Return the original native values object and rich-text ASTs from beforeSubmit; validate detached projections.
- Exactly one enabled hero is required and remains first. Contact's required form is outside optional composition. privacy_details remains enabled and nonremovable on privacy.
- Create new records only with the standard template; initialize a draft. Existing page contentId, filename, template and slug are immutable.
- Shared section/navigation order is authoritative. Do not invent translated prose or labels; no default-language fallback.
- Keep native Rename/Delete disabled for Pages and relationship-target editorials, and keep folder controls disabled.
- No real sending, provisioning, hosted-provider changes, deployment, merge, push or release tag is part of Composition A.
- All Markdown is English. Preserve neutral EN/EL design, self-hosted fonts, semantic surfaces and component tokens.
- Composition B/C and stages 3/4 remain separate plans: no new sections, media pipeline, Rooms, social/motion/visitor modules, presets or initializer here.

## Review Focus

1. Native create differs from update: filename metadata, root-relative mutation paths and previously absent files must be validated/owned without permitting traversal or deleting unclaimed edits. Tasks 1 and 4 own tests.
2. Nested typed-template aliases must roundtrip through the installed serializer without losing fields, mutating Slate ASTs or regenerating schema from new IDs. Tasks 1, 2 and 6 own tests.
3. Removal/reorder across three locales must preserve rich-node identity and associations, prune stale copy and protect required structure even when direct malformed values bypass controls. Tasks 3 and 4 own tests.
4. An explicitly added navigation link must have exact ID membership and correct labels in every configured locale, independent of list positions and destination publication. Tasks 2 and 5 own tests.
5. New pages and dormant article sections must not introduce special-template creation, route collisions, lost hidden data, accidental publication or changed backend profile boundaries. Tasks 2, 4 and 6 own tests.

## Workspace and protocol

The plan belongs to C:/Projects/bizness-starter-v2 on codex/starter-v2-composition. Foundation is retained at ac3102c on codex/starter-v2-foundation. Both C:/Projects/bizness-starter and C:/Projects/financial-consulting-example remain read-only; record their original HEADs and clean status without reading secret files. Do not run source installs/builds/saves/generators or stop source listeners.

At execution, use using-git-worktrees to verify isolation and retain a dedicated workspace for the full plan. The already running new-project launcher must be stopped only through its owned session/tree before changing schema or building CMS. The recorded launcher session is 21082, with content42696/Tina22500/Worker18128/site32320; recheck live ownership instead of assuming those PIDs are still current. Never select processes by name or kill an occupied port.

Use a plan-specific SDD ledger, task briefs, actual BASE..HEAD review packages and fresh reviewers. Each task owns its red/green cycle, one appropriate verification pass, self-review and commit. Do not replay completed tasks after interruption. Commit actual evidence to docs/superpowers/plans/2026-10-16-starter-v2-composition-a-evidence.md. No implementation starts until this written plan is reviewed.

## File and interface map

| Boundary | Ownership |
| --- | --- |
| packages/content/section-registry.mjs + .d.mts | Six canonical IDs, native aliases, variant/default-copy metadata and pure copy constraints |
| packages/content/documents.mjs + .d.mts | Strict PageDocument/SettingsDocument validation and detached normalization to existing Page/Settings |
| packages/content/composition.mjs + .d.mts | Immutable structural operations and required-region policies, with no React, filesystem or Tina imports |
| tina/fields/section-copy.ts | Static native typed copy-list templates and native default-copy adapter |
| tina/fields/composition.tsx | Shared section controls and fixed localized copy editors inside native forms |
| tina/fields/navigation.tsx | Shared navigation controls and fixed localized label editors |
| tina/fields/page-identity.tsx | Editable new-page identity versus read-only existing identity |
| tina/validation.ts, collections/page.ts, collections/settings.ts | Current-catalog validation and native capability wiring |
| scripts/cms-descriptor.mjs | Byte-stable project/module metadata, without section/nav field IDs or page identity snapshots |
| e2e/helpers/native-document.ts, cms-source-ownership.ts | Installed-schema/serializer-derived expected native create/update output and guarded restoration |
| scripts/probe-composition.mjs, tests/fixtures/composition-probe, e2e/composition-probe.spec.ts | Isolated native contract proof, not a shipped second editor |

Existing content types, declarations, loader, tests and docs change where their boundary consumes wire documents. Keep the registry dependency one-way: move the existing section type/copy definitions into section-registry.mjs and re-export them from schemas.mjs; the registry must not import schemas.mjs back. No public framework, component-path lookup or generic runtime plugin loader is added.

### Task 1: Prove native typed lists, creation and source ownership in isolation

**Files:** Create scripts/probe-composition.mjs, tests/fixtures/composition-probe/tina/config.ts, e2e/composition-probe.spec.ts and e2e/helpers/native-document.ts. Modify e2e/helpers/cms-source-ownership.ts, tests/cms-ownership.test.ts and the existing native request capture to identify create/update operations. Add tests/native-document.test.ts, tests/composition-probe.test.ts and playwright.composition-probe.config.ts. Modify playwright.config.ts to exclude the probe from ordinary runs; the explicit probe runner selects its dedicated config.

**Interfaces:** Export expectedNativeDocument(mutation, schema, prior?) -> Promise<Record<string, unknown>> from native-document.ts. Mutation is { operation: 'create'|'update', collection, relativePath, params }. Preserve createCmsSources(paths, backupRoot?, options?: { allowCreate?: boolean }); its existing update methods remain compatible. Add originalState(path) -> { exists: boolean, bytes?: string }. captureNative retains its path/mutation/schema/predicate arguments. restore removes a created file only when it was initially absent and its current bytes equal proven owned bytes.

- [ ] Write failing ownership tests: nested object templates and nameOverride persist canonical rich-text/offering-list aliases; rich AST remains unchanged; native create's single leading slash is normalized to a contained flat collection path; traversal, double-root/UNC, nested paths and wrong collections fail. An absent file is deleted only after complete expected-record ownership; external changes and failed capture preserve bytes/backups. Diagnostic failure after capture still allows restore.
- [ ] Run pnpm exec vitest run tests/native-document.test.ts tests/cms-ownership.test.ts; record real failures before implementing schema/installed-serializer-derived recursion and absent-source handling. Resolve aliases from the active schema, never infer expected values from newly saved disk bytes.
- [ ] Implement the bounded probe runner: create an ignored unique root under .generated/composition-probe, write only explicit fixture files, invoke the installed Tina dev CLI with --rootPath and configured free probe ports, and serve that fixture's generated CMS through a loopback-only static test server. Default probe ports are site4434/Tina4024/datalayer9024, overridable through the existing SITE_PORT/TINA_PORT/TINA_DATALAYER_PORT variables. Reuse owned-command cleanup/timeouts; do not build beside the main watcher or provision D1.
- [ ] The real native UI probe creates a draft Standard record, adds two rich-text instances and their EN/EL typed copies, edits bold prose, reorders references, removes one reference/copy pair, saves and reloads. Its fixture uses native list controls solely to prove serialization, not as the final translation UX. Capture the actual beforeSubmit create/update context, including form.crudType, form.path and creation-only filename; prove the hook runs before persistence. Inspect canonical aliases, complete saved bytes and exact restoration. No raw write mutations. If the installed native contract fails, report the concrete blocker before broad integration.
- [ ] Run focused tests, the actual probe and pnpm check; retain JSON proof/owned teardown. Commit test: prove native composition contracts and safe creation. Do not change project.json or product content/schema in this task.

### Task 2: Integrate schemaVersion 2 documents and static native fields

**Files:** Create packages/content/section-registry.{mjs,d.mts}, packages/content/documents.{mjs,d.mts}, tina/fields/section-copy.ts, tests/content-documents.test.ts and tests/cms-static-schema.test.ts. Modify packages/config/project.{mjs,d.mts}, packages/content/{schemas.mjs,schemas.d.mts,types.ts,index.ts,read.mjs}, tina/{validation.ts,templates/pages.ts,sections/index.ts,collections/page.ts,collections/settings.ts}, scripts/cms-descriptor.mjs, project.json, content/pages/*.json, content/settings/site.json and tests/fixtures/content/factory.ts, tests/{project-config,content-schema,content-seed,localization,publication,routes,manifest,cms-schema,cms-save,cms-rich-boundaries,cms-locales,cms-metadata,cms-articles-disabled,foundation-authoring-boundaries,cms-native-query}.test.ts where wire inputs or old lock assertions change. Keep normalized-domain fixture helpers separate from serialized document helpers. Remove only the now-unused content-derived page-copy field builder.

**Interfaces:** PersistedCopyEntry<K> is { id, _template: K } & SectionCopyMap[K]. PageDocument replaces each default/translated copy.sections map with PersistedCopyEntry[]. SettingsDocument replaces each translated navigation label map with { pageId, label }[]. Export pageDocumentSchema, settingsDocumentSchema, normalizePageDocument(raw: unknown): Page, normalizeSettingsDocument(raw: unknown): Settings. Keep pageSchema/settingsSchema as normalized-domain validators, not alternate disk readers. readContent still returns the same ContentSnapshot. sectionDefinitions contains exactly the six existing types and their unique GraphQL-safe aliases; its pure default-copy factory returns title New section, empty safe prose and, for CTA, link { label: Contact us, href: /contact }; new references remain hidden. Native field/default adapters remain in tina/fields.

- [ ] Add red tests: typed lists normalize by ID without mutating inputs; duplicate/stale/mismatched entries fail; default copy and supplied translated hero are required; missing optional translated copy remains omitted; reordered translation lists do not affect shared order; same ID with different types on separate pages is valid. Assert old disk maps are rejected under version2, version1 project config is rejected and unknown keys remain strict.
- [ ] Add SettingsDocument tests: translated labels have unique IDs and exact shared membership; each destination must exist; label-list position is irrelevant; dormant articles retain existing unread/filter behavior. Exercise EN/EL and a configured regional third locale, including duplicate native/canonical aliases.
- [ ] Implement the pure wire/document boundary using existing registered copy and normalized-domain schemas. Rewrite only new-project seeds/fixtures directly. Native projection serializes/normalizes a detached document, then the same normalizers feed catalog validation. Root page templates and rich AST return semantics remain unchanged. Preserve all existing limits, safe links, per-locale publication and default-only article manifest behavior.
- [ ] Replace per-ID native copy/label fields with static typed/object lists. Keep existing composition controls read-only for this checkpoint. Remove descriptor.pages and descriptor.navigation; retain project metadata and the existing articlePageFiles module-exclusion contract. Move existing-page identity/structure comparison to the current native catalog record matched by relativePath, initially retaining the Foundation structural lock. New standard IDs and nav IDs must not change schema field definitions or descriptor bytes.
- [ ] Run focused document/native/schema tests, pnpm check, pnpm test, static build, isolated native build and Worker dry-run with no live watcher. Confirm the native editor reads both locales and public baseline remains unchanged. Commit feat: adopt native typed composition documents.

### Task 3: Define immutable composition operations and capability guards

**Files:** Create packages/content/composition.{mjs,d.mts}, tests/composition.test.ts and tests/page-capabilities.test.ts. Modify packages/content/documents.mjs, tina/validation.ts and tests/cms-save.test.ts. Existing native UI remains fixed until Task4. assertExistingPageIdentity also rejects retyping any retained old instance ID; removing an old ID and adding a genuinely new ID is allowed.

**Interfaces:** CompositionDraft is the typed-list Page document shape with copy fields opaque enough to retain native AST nodes. Export addSection(values, { type, id, afterId, copy }), moveSection(values, id, direction: 'up'|'down'), setSectionEnabled(values, id, enabled), removeSection(values, id), addTranslationCopy(values, localeKey, sectionId, copy), assertPageCapabilities(candidate: Page), and assertExistingPageIdentity(candidate: Page, previous: Page). Each operation returns a new root/changed containers without mutating inputs. IDs follow the existing /^[a-z][a-z0-9_]{0,79}$/ contract and are unique only within one page.

- [ ] Write red tests for repeated types, deterministic supplied IDs, valid insertion position, hero-first moves, shared enabled state and removal across EN/EL/pt_BR. Assert untouched rich-node object references remain identical; no whole-draft JSON stringify/parse or AST rewrite is permitted. Test unknown IDs/types and invalid replacement-copy pairs fail.
- [ ] Add malicious-candidate tests independent of controls: second/disabled/moved hero, removed/hidden/retyped privacy_details, type changes under an existing instance ID, existing page contentId/slug/template changes and special-template creation fail. A new Standard draft with one hero and no automatic translations is valid.
- [ ] Implement operations and guards. Add requires explicit valid registered default copy; callers generate the ID and native rich defaults. Remove prunes all locale copies atomically. Hide preserves copies. Reorder touches references only. For privacy, preserve the known privacy_details instance/type; do not infer required regions from visible text.
- [ ] Replace the temporary Foundation whole-structure comparison in current-catalog save validation with the new identity/capability guards. Existing versus new is determined by the current record at the normalized file path, not by a stale descriptor or the candidate's claimed ID. Native metadata is excluded only on detached projection. Concurrent catalog validation remains a best-effort editor guard, not a claimed transactional lock.
- [ ] Run pnpm exec vitest run tests/composition.test.ts tests/page-capabilities.test.ts tests/cms-save.test.ts and pnpm check. Commit feat: enforce safe page composition operations.

### Task 4: Native composition controls and Standard page creation

**Files:** Create tina/fields/composition.tsx, tina/fields/page-identity.tsx, tests/cms-composition-controls.test.ts and e2e/composition-cms.spec.ts. Modify tina/{sections/index.ts,fields/section-copy.ts,collections/page.ts,validation.ts}, e2e/helpers/cms-evidence.ts and tests/cms-schema.test.ts. Update tsconfig.json with jsx: react-jsx and tina/**/*.tsx so strict checks include the new components.

**Interfaces:** SectionControls and SectionCopyControls are native ui.component React fields. PageIdentityControls receives the installed field props and reads tinaForm.crudType. Export createStandardPageDefaults() with draft status, empty editable identity/slug, a required intro hero and honest default copy. validateCurrentSave accepts a submission context { operation: 'create'|'update', relativePath }; existing callsites adapt through a resolveNativeSubmission(form, values, collectionPath) boundary. Preserve the original values return from beforeSubmit.

- [ ] Add failing component/model-hook tests: shared changes use one Final Form batch; copy controls render declared registered child fields without independent add/remove/reorder; localized controls only edit copy; move buttons have labels and disabled boundary states. Article-list is absent from add controls when disabled, while existing dormant references/copy remain untouched and serializable.
- [ ] Implement native controls using the installed FieldsBuilder/Final Form API proven in Task1. Add generates section_ plus UUID hex once, starts hidden and initializes only default copy. Translation copy is added explicitly; empty localized required fields must be filled before save. Remove asks for in-editor confirmation and describes removal across translations. Cancel changes nothing. Do not add drag libraries, a separate app or runtime component paths.
- [ ] Enable Pages create, keep Delete/Rename/folders disabled and provide Standard native defaults. Identity fields are editable on create and read-only afterward. Accept creation-only filename metadata only when it matches the verified native form path; reject nested paths before catalog access. Normalization of the native single leading slash must not permit absolute filesystem, UNC or traversal paths. New non-Standard templates produce an actionable error before any file write; the native picker limitation stays documented.
- [ ] Run the real native UI test on unique flat page files: create/persist/reload a Standard draft; prove no public route before explicit publication; add two same-type instances, edit both languages, reorder/hide/remove/save/reload and verify public association. Include the same ID with a different type on a second page, required hero/privacy rejection, identity protection and unchanged schema/descriptor hashes after composition changes. Use Task1's new-file ownership to remove only claimed created files and restore only claimed existing bytes.
- [ ] Run focused controls/guard tests, pnpm check and the targeted native suite with configured ports. Stop owned processes before isolated builds. Commit feat: enable native page composition and standard creation.

### Task 5: Explicit bilingual navigation authoring

**Files:** Create tina/fields/navigation.tsx, packages/content/navigation.{mjs,d.mts}, tests/navigation-authoring.test.ts and e2e/composition-navigation.spec.ts. Modify tina/collections/settings.ts and its native validation wiring.

**Interfaces:** Export addNavigationItem(values, item: { pageId, label }), moveNavigationItem(values, pageId, direction), removeNavigationItem(values, pageId), and setNavigationLabel(values, localeKey, pageId, label). Operate on SettingsDocument-shaped native values; return new containers and preserve every unrelated AST/value. Shared add initializes each existing configured translation's matching entry with an empty label, requiring editor input before a valid save. Registry/schema does not depend on destination IDs.

- [ ] Add red tests for add/reorder/remove across three locales, duplicate/stale IDs, exact label membership, unchanged unrelated legal rich AST and a published EN/draft EL destination. Shared order wins even when translated label lists differ in order. Missing required translated labels fail; no automatic copied label or fallback is accepted.
- [ ] Implement one shared native navigation control and fixed translated label editors. Destinations are existing saved Pages validated against the current catalog. Do not create pages, add links on publication, delete pages on link removal or regenerate schema after an ID is added.
- [ ] Native test: create/save a test Standard page through the UI, then explicitly add its EN/EL labels in Settings, save/reload and verify header destinations/labels. Change order, remove the link and confirm the page remains. Missing/draft destination translations disappear only in that public locale. Assert schema and descriptor byte stability. Restore Settings before deleting the owned test page to avoid transient dangling navigation.
- [ ] Run pnpm exec vitest run tests/navigation-authoring.test.ts tests/content-documents.test.ts plus strict check and the targeted native navigation suite. Capture native mutation/schema-derived ownership before optional diagnostics. Existing evidence-directory/failure-cleanup regressions remain mandatory.
- [ ] Commit feat: add explicit localized navigation authoring.

### Task 6: Composition acceptance, regression coverage and handoff

**Files:** Create e2e/composition-content.spec.ts and docs/COMPOSITION_AUTHORING.md. Update e2e/{foundation-cms,foundation-content,foundation-profiles}.spec.ts, scripts/{verify-profiles,smoke-local}.mjs only where schema2 requires it, docs/{QUICKSTART,CONTENT_MODEL,ARCHITECTURE,CMS_EDITOR_CONTROLS,FOUNDATION_DECISIONS}.md, AGENTS.md and the Composition A evidence. Do not rewrite historical Foundation evidence as though it used version2.

**Interfaces:** Retain E2E_BASE_URL, opt-in E2E_CMS_URL, all local port overrides and guarded original/owned restoration. Probe tests are not included in ordinary public/native runs unless explicitly selected; explicitly enabled unavailable CMS fails visibly. Native read/write coverage uses the installed generated schema and serializers.

- [ ] Add focused regressions for rich bilingual roundtrips, identity/template rejection, atomic remove, missing optional translation, disabled articles and fresh evidence storage. Test interruption/diagnostic failure with initially absent files, and reject restore when another editor changes them. No blind fixture reset or broad content deletion is allowed.
- [ ] Run representative EN/EL Home, Contact and newly composed Standard pages at 375/768/1440 with one H1, no nested anchors/overflow, correct locale links and keyboard controls/focus. Assert the Contact form and required privacy body persist. Retain representative axe/manual screenshot evidence without compliance claims or a neutral-design redesign.
- [ ] Stop native watchers, then run frozen install, pnpm check, pnpm test, static build, Worker dry-run and isolated CMS build using the accepted local-only skip-indexing mode. Run the indexed native query/UI suites separately, and serial enquiries/newsletter/nurture/articles-disabled verification on owned local fixtures. Avoid repeating passed broad suites unless changes/failures justify it. Restore exact configuration/source bytes and prove owned teardown.
- [ ] Document current authoring steps, schemaVersion2 wire/internal projection, template-picker limitation, immutable URLs/identity, flat paths, deletion restrictions and native AST preservation. Mark Composition B/C and stages3/4 deferred. Verify both source HEAD/status snapshots unchanged; retain false sending/marketing/review flags and no new remotes/secrets/state.
- [ ] Self-review and commit test: verify composition authoring and document contracts, then return the implementation report. The controller obtains the independent Task6 gate before dispatching the final whole-branch reviewer. The implementer never spawns a reviewer. No deployment, merge, push or tag.

## Controller final acceptance

After all six task gates pass, dispatch the required most-capable final reviewer with medium reasoning. Handle one batched final fix wave and one scoped rereview, adjudicate any residual findings explicitly, and record the reviewed runtime commit. Preserve the local branch/repo. Update acceptance documentation after review; no release tag, merge, push or deployment.

## Plan self-review and acceptance

All approved Composition A requirements have owners: native alias/creation proof and ownership in Task1; typed document boundaries/static fields in Task2; atomic policies in Task3; page/section authoring in Task4; navigation in Task5; representative/browser/profile/documentation acceptance in Task6. Each Review Focus item has explicit tests in its owning tasks. All operations share the typed-list wire model and the same normalized public contracts; no task silently reintroduces ID-derived fields, a second disk format or a custom mutation bypass.

Foundation structural locks are intentionally retained only through Task2 and replaced by tested capabilities in Task3. Pages create is enabled only in Task4. Navigation is not claimed functional for new links until Task5. The early probe is isolated and explicit, not a shipped editor or a production-readiness claim. The branch is ready for implementation only after user review of this written plan.
