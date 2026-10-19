# Composition C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (selected) to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make business domains additive developer extensions and prove the contract with an optional bilingual Rooms module, without reservations.

**Architecture:** Add static browser-safe content registrations, separate Tina factories and separate Astro renderer registrations. Generic loading, publication, catalog, native-save and route pipelines consume those registrations; Rooms supplies its own contracts and adapters. Contact choices and Worker validation consume one public enquiry projection.

**Tech Stack:** Existing Node 22.x/24.x, pnpm 10.13.1, Astro, TinaCMS, Zod, TypeScript, Vitest, Playwright and Cloudflare Worker/D1; no dependency changes.

**Spec:** [Approved Composition C design](../specs/2026-10-18-starter-v2-composition-c-design.md). Written-spec approval received on 2026-10-18. Written-plan approval received on 2026-10-18; execution is in progress. Tasks 1–6 are accepted; Task 7 whole-branch review is approved at `7a12969`; documentation scoped rereview and controller closeout remain pending.

## Global Constraints

- Work only in C:/Projects/bizness-starter-v2 on codex/starter-v2-composition-c. Baseline accepted B handoff: 9ad9d86; C specification: 4e93d1d.
- Keep C:/Projects/bizness-starter and C:/Projects/financial-consulting-example read-only; do not install, build, save or stop processes there.
- Preserve schemaVersion 2, current design, Home, settings, named offerings/people/articles consumers, roles, static routing and existing profile behavior.
- Add a developer-owned modules.rooms boolean, default false, independently of articles and enquiries/newsletter/nurture profiles. Unknown module keys fail validation.
- All Markdown is English. Public EN/EL text is localized. No per-item or default-language fallback.
- Browser/editor imports remain free of filesystem loaders and image decoders. Return original native values/ASTs after detached validation.
- No dependency/font upgrade, booking, inventory, price/payment, account, redirect, optimized derivative/srcset, preset or initialization work.
- No D1 migration, hosted setup, real delivery, deployment, merge, push or tag. Sending and marketing defaults remain false.
- Stop only reverified owned launchers before conflicting configure/build/full-test lifecycle operations. Keep exact ownership-based restoration; retain unknown edits.

## Review Focus

These boundary inputs need explicit tests in addition to the happy path:

1. A malformed disabled Room or declared index file must be excluded before parsing, including during descriptor generation and native catalog queries (Tasks 1 and 4).
2. Two extensions claim one native alias, index filename, reserved prefix or public path: reject rather than overwrite a map entry (Tasks 1 and 2).
3. An index is unpublished in only one locale or scheduled in the future: omit its Room, alternatives and enquiry eligibility in that locale at the same captured clock (Tasks 2 and 5).
4. A failed native save followed by correction, with unrelated opaque rich-text ASTs and item reordering: zero rejected mutations and unchanged unrelated object identity (Tasks 4 and 6).
5. A fixture conflict or failed launcher shutdown during cleanup: preserve external bytes, restore independent owned resources, and skip regeneration from conflicted inputs (Tasks 6 and 7).

## File structure and ownership

Existing algorithm files are refactored only in Tasks 1-2: packages/content/{read,publication,localize,catalog,routes,documents,section-registry,composition}.mjs and declarations; packages/content/types.ts; packages/config/project.{mjs,d.mts}; tina/{validation.ts,collections/index.ts,collections/common.ts,collections/page.ts,fields/composition.tsx,fields/section-copy.ts,sections/index.ts}; scripts/cms-descriptor.mjs; apps/site/src/pages/[locale]/[...path].astro and templates/sections.ts. Split focused helpers out of validation rather than expanding its hardcoded collection tables.

New generic units:

- packages/content/domain-contracts.ts: domain identity, context and typed registry maps; no runtime framework imports.
- packages/content/domain-registry.{mjs,d.mts}: static content registration and generic lookup/validation.
- packages/content/domain-publication.{mjs,d.mts}: active domain projection and common route/alternate finalization.
- packages/content/enquiry-contexts.{mjs,d.mts}: public localized choices and cross-locale acceptance union.
- tina/domains/index.ts: native collection factory registrations only.
- tina/domain-validation.ts: active native collection discovery/projection/identity adapters.
- apps/site/src/templates/domains/index.ts: server-side static renderer registrations only.
- apps/site/src/templates/EditorialDetail.astro: existing editorial detail markup extracted without redesign.

Rooms-owned units introduced in Task 3:

- packages/domains/rooms/{contract.mjs,contract.d.mts,types.ts,items.mjs,items.d.mts}.
- tina/domains/rooms/{collection.ts,fields.ts,items.tsx}.
- apps/site/src/templates/domains/rooms/{RoomDetail.astro,RoomList.astro}.
- content/pages/rooms.json: declared dormant draft index. content/rooms/.gitkeep: no public sample records.

Public extension registration seams are domain-registry.mjs and its declaration imports, tina/domains/index.ts, templates/domains/index.ts and the existing content/Tina/Astro section registration tables. Adding a Page-template/section map entry is registration; adding a rooms conditional to a generic algorithm is not. Developer module flags are explicit schema keys, not arbitrary strings. Task 3 may add the rooms flag and map declarations at these seams; the original no-core-edits constraint was later qualified by the two approved Task 3 helper exceptions recorded in the [ruling ledger](../reviews/2026-10-18-composition-c/RULINGS.md).

Tests are named below; introduce focused files rather than burying C assertions in B harnesses. Update the existing documentation in the task that changes its contract, then consolidate acceptance evidence in Task 7.

## Shared interfaces decided before execution

The implementation must preserve these names and signatures in matching runtime/declaration pairs. Generic heterogeneous iteration may erase types inside the registry adapter only; domain consumers use the keyed API without repeated casts.

- DomainRecordMap and LocalizedDomainRecordMap are augmentable TypeScript interfaces. Rooms adds rooms: Room and rooms: LocalizedRoom in its types.ts. ContentSnapshot.domains and LocalizedContent.domains are partial mapped arrays of their respective records. Existing named arrays are unchanged.
- DomainDefinition<R,L> contains key, collectionName, directory, schema: ZodType<R>, ownedPages: readonly {filename:string;template:string;contentId:string}[], enabled(project):boolean, richFields: readonly {path:readonly string[];inline:boolean}[], projectRecord(record:R, context:DomainContext): Omit<L,keyof RouteFields>|null, routePath(record:Omit<L,keyof RouteFields>, context:DomainContext):string, validate(records:readonly R[], context:CatalogContext):void, and enquiry:boolean. Keys/aliases/directories are bounded static identifiers; directory is a single flat collection name, never an arbitrary path.
- DomainContext is {project:ProjectConfig;locale:string;now:string;pages:readonly LocalizedPage[]}. It receives already localized/published base Pages; callbacks do not call localizeContent recursively. Domain callback records exclude final path/alternates until generic finalization. CatalogContext exposes project, now, pages and all record IDs; callback validation cannot perform I/O.
- defineDomain<R,L>(definition:DomainDefinition<R,L>):DomainDefinition<R,L>; createDomainRegistry(definitions:readonly DomainDefinition[]):DomainRegistry; getActiveDomains(project:ProjectConfig, registry?:DomainRegistry):readonly DomainDefinition[]. Optional registry injection is for isolated extension-contract tests, not a runtime plugin option or serialized config.
- getDomainRecords<K extends keyof LocalizedDomainRecordMap>(content:LocalizedContent,key:K):readonly LocalizedDomainRecordMap[K][]. A registered absent/disabled dataset returns an empty array; unregistered runtime keys error.
- Domain routes use {kind:'domain';domain:string;contentId:string;locale:string;path:string;alternates:Alternate[]}; legacy route variants remain compatible. Domain renderer lookup is keyed by domain and validates registration coverage before build.
- getEnquiryContexts(content:LocalizedContent):EnquiryContext[], where EnquiryContext={id:string;kind:string;title:string;path:string}. Existing offerings contribute kind:'offering'; extensions contribute their key only when publicly present.
- getAcceptedEnquiryContexts(contents:readonly LocalizedContent[]):{id:string;kind:string}[] deduplicates the locale union by globally unique ID. createManifest adds enquiryContexts with that exact shape, preserving offerings/articles/campaigns/routes. The Worker accepts contextId against enquiryContexts, never a domain-specific switch.
- buildDomainCollections(project:ProjectConfig):Collection[] lives only in Tina. getNativeDomainAdapters(project:ProjectConfig):readonly NativeDomainAdapter[] supplies active adapters. NativeDomainAdapter={key:string;collectionName:string;directory:string;schema:ZodType;richFields:readonly {path:readonly string[];inline:boolean}[];allowCreate:boolean;assertIdentity:typeof assertDomainIdentity}. Generic save/catalog discovery consumes these fields; native UI factories own labels/controls, not validation algorithms. Native collection/field names are static and never depend on record or item IDs.
- assertDomainIdentity(candidate, current, submission):void applies immutable filename/contentId/slug to existing records and draft-only creation to domains declaring creation support. Retained shared image/amenity IDs are immutable; remove/add uses explicit operations.

## Task 1: Generic registration and dormant discovery

**Files:** Create domain-contracts.ts and domain-registry runtime/declarations; modify config declarations/parser, content read/types and CMS descriptor; tests/domain-registry.test.ts and tests/domain-discovery.test.ts. Update docs/ARCHITECTURE.md and docs/CONTENT_MODEL.md with the registration boundary. No Rooms production registration yet.

**Interfaces:** Produce DomainDefinition, DomainRegistry, defineDomain, createDomainRegistry, getActiveDomains and typed domains containers from the shared interface block. Add an empty strict modules object now; Task 3 adds its explicit rooms field with default false. Preserve existing readContent(root,project,{now}) call compatibility; readContent options gains registry?:DomainRegistry for isolated tests; localizeContent(source,locale,project,registry?:DomainRegistry) and validateCatalog(source,project,registry?:DomainRegistry) receive that same test registry. Production callers omit it and use the static registry. publicRoutes(content) remains unchanged because it consumes finalized localized records.

- [x] Write tests using a small test-only domain: duplicate keys/native aliases/directories/owned filenames throw; active flat folder loads; disabled malformed folder/index is never parsed; sibling active malformed JSON still fails with its filename. Verify unknown module keys rejected and descriptor contains no infrastructure secrets or record/item IDs.
- [x] Run pnpm exec vitest run tests/domain-registry.test.ts tests/domain-discovery.test.ts; confirm failure identifies the absent registration/discovery behavior.
- [x] Implement registry validation and generic active folder discovery. Determine excluded Page filenames from all disabled registrations before opening Page JSON. Descriptor consumes declarations, not reparsed disabled Pages; keep legacy articles exclusion compatible. Validate collection/folder aliases against built-in collections too.
- [x] Run the focused tests plus tests/project-config.test.ts, tests/cms-metadata.test.ts and tests/cms-articles-disabled.test.ts. Expected: pass, with no schema/configuration generated from instance IDs.
- [x] Commit as feat: add static domain registration and dormant discovery; request independent task review. Resolve findings before Task 2.

## Task 2: Shared publication, routes, catalog and framework adapters

**Files:** Create domain-publication runtime/declarations, tina/domain-validation.ts, tina/domains/index.ts, templates/domains/index.ts and EditorialDetail.astro. Modify the existing generic algorithm/registration files listed above and relevant declaration pairs. Test tests/domain-projection.test.ts, tests/domain-native.test.ts, tests/domain-extension.test.ts and apps/site/tests/domain-rendering.test.ts.

**Interfaces:** Consume Task 1. Produce typed getDomainRecords, domain route variants, generic domain finalization, native adapter discovery and renderer dispatch. Current named APIs remain stable. Route projection is the sole source for all public consumers; publication uses source.now captured once. Initially all production extension registries are empty.

- [x] Write a second small test-only domain through public registrations. Assert localization without fallback, index publication dependency, shared clock, reciprocal alternatives, global ID/reserved URL collisions, invalid rich text and complete enabled collection discovery. Assert zero queries for absent disabled native GraphQL collections. Test duplicate renderer/native registrations and a missing renderer for an active domain fail actionably.
- [x] Run the four focused files with the appropriate root/site Vitest configuration; verify failures are for missing domain behavior.
- [x] Implement generic catalog/projection/native adapters and static detail dispatch; extract existing detail markup unchanged. Add composable module-owned Page-template/section registration capability, disabled chooser filtering and dormant copy round-trip. Keep special template creation forbidden and enforce declared index filenames/templates/contentIds on update. Declared disabled Page IDs allow existing navigation references to remain stored while being omitted from visible choices/output; truly unknown navigation IDs still fail. Test both cases without parsing dormant Page bytes. Native validation validates detached projections and returns original values.
- [x] Prove existing fixture route/manifest output and rendered editorial semantics unchanged; run focused C tests and existing publication/routes/localization/catalog/native/renderer regressions. Run pnpm check. Expected: no new errors/warnings; test-only extension requires registrations and its own handlers, with no algorithm branches.
- [x] Commit as refactor: project registered domains through shared pipelines; obtain independent review. Freeze generic algorithms after approval; Task 3 reports any missing contract instead of quietly adding rooms cases.

## Task 3: Rooms contracts, native controls and static presentation

**Files:** Create the Rooms-owned units listed above; modify only explicit registration seams, project module schema/types, section/template type maps, and test fixtures. Add tests/rooms-contract.test.ts, tests/rooms-items.test.ts, tests/rooms-publication.test.ts and apps/site/tests/rooms.test.ts. Add docs/ROOMS_AUTHORING.md.

**Interfaces:** Register key rooms, native collection room, directory rooms, owned filename rooms.json/template rooms/contentId rooms, section room-list with default variant. Add modules.rooms default false. Room extends the existing editorial/publication contract with maxGuests, images:[{id,media:{src,crop}}], amenities:[{id}], bedDescription, imageCopy:[{id,alt,caption?}], amenityCopy:[{id,label}]. Translations contain localized editorial/publication fields, bedDescription, imageCopy and amenityCopy, never shared refs. LocalizedRoom joins copy by stable ID into ordered images/amenities and receives generic path/alternates.

Bounds: maxGuests is an integer 1-100; images 0-20; amenities 0-40; IDs use the existing lowercase field-ID pattern/max 80. Title/alt/bed description/amenity label max 200; inline descriptions/captions max 10,000; body max 100,000; SEO max 300. Reuse existing safe prose/source/crop contracts. Every supplied locale has exact shared image/amenity membership, with required alt and labels. No images is valid; an image item without a source is invalid. room-list copy is {title,description,emptyMessage}, where emptyMessage is required plain text max 300.

- [x] Write boundary tests for numeric/list limits, duplicate/stale/missing item IDs, reordering, no fallback, original AST identity, safe image syntax and translated publication. Test no-image Room, first-image thumbnail, unpublished index, missing locale, reserved slug, one H1, empty list and safe CTA. Pin intrinsic image dimensions and existing crop classes through the source adapter.
- [x] Run focused root and site tests; confirm expected failures before implementation.
- [x] Implement Room contract, default-locale item/source operations, explicit translation initialization and recoverable native controls; reuse existing field plugins and source adapter. Draft creation requires unique flat filename/contentId/slug; saved identity is read-only and save-validated; native Delete is disabled. Add dormant bilingual draft index with required hero and room-list; no Room records or navigation/Home edits. Render guest/bed/amenities/body/images with existing design tokens and localized copy, no new palette or effects.
- [x] Run focused tests and check. Inspect diff: no domain-specific core algorithm branches or unrelated template changes; acknowledge the two approved generic-helper corrections: renderer-coverage relocation to getStaticPaths and registered translation initialization through defaultCopy/richFields. See the [chronological rulings](../reviews/2026-10-18-composition-c/RULINGS.md). Disabled default site remains unchanged. Expected native schema stable under record/item changes and disabled collection absent.
- [x] Commit as feat: add optional rooms authoring and presentation; obtain independent review before connecting enquiry behavior.

## Task 4: Native CMS creation, validation and recovery proof

**Files:** Add e2e/composition-c-cms.spec.ts and helpers/composition-c-fixture.ts; reuse helpers/native-document.ts, cms-source-ownership.ts and owned-media.ts. Extend tests/domain-native.test.ts and tests/rooms-items.test.ts where actual installed schema/serializer exposes a narrow compatibility gap. Update docs/COMPOSITION_AUTHORING.md.

**Interfaces:** Consume active native adapters and Rooms controls. Collection discovery uses active registrations; index file guards and draft identity apply before mutation. No raw write mutation substitutes for actual editor interaction.

- [x] Add failing native/contract tests for edit-only index filename/template, immutable saved Room filename/contentId/slug, flat paths, draft-only create, disabled Delete and invalid nested copy. Add a disabled-mode query test proving no roomConnection request occurs; malformed dormant files remain byte-identical.
- [x] Establish an owned indexed dev:cms stack and known exclusive image bytes using existing ownership helpers. Capture active schema and installed serializer expectations before each UI mutation. Use browser-driven draft creation, EN/EL rich edits, image/amenity add/reorder/remove, explicit translated initialization, save/reload and publish.
- [x] Prove invalid save attempts cause zero mutations and exact unchanged disk bytes; correct nested controls and then save successfully. Preserve unrelated opaque AST identity. Verify actual Cancel changes no disk/request. Reference removal preserves physical uploads and removes only matching localized copy. Any compatibility correction returns to the owning implementer and gets focused regression tests; no broadened HTML/AST allowances.
- [x] Restore the owned Page/Room records before owned image deletion; independently restore project bytes. Preserve conflicts and backups. Record mutation counts, no-op attempts, recovery and exact restoration; confirm focused tests and native proof pass, or leave the gate explicitly incomplete.
- [x] Commit as test: verify native rooms authoring and recovery; independent review must assess evidence and ownership, not replay all UI work merely to reconfirm green.

## Task 5: Generic enquiry contexts and Worker compatibility

**Files:** Create enquiry-contexts runtime/declarations; modify scripts/manifest runtime/declarations, templates/ContactForm.astro, worker/index.ts and actual manifest consumers/types found by rg. Add tests/enquiry-contexts.test.ts; extend tests/manifest.test.ts, tests/offering-contact.test.ts and backend tests. Add e2e/composition-c-worker.spec.ts.

**Interfaces:** Produce getEnquiryContexts, getAcceptedEnquiryContexts and manifest.enquiryContexts exactly as above. Room CTA uses the existing contact preselection query parameter and contextId request field; keep existing Offering links and D1 storage compatible. Backend acceptance is the union of publicly eligible locales, matching current Offering semantics; it does not trust a client-supplied locale.

- [x] Write tests for Offering compatibility, Room EN-only/EL-only publication, index schedule, unknown/draft/disabled IDs and collision rejection. Assert manifest legacy arrays unchanged and contexts generated from the same localized projection. Pin form option titles and preselection to localized contexts.
- [x] Run focused tests and verify failure on the old Offering-only validation.
- [x] Implement the generic projection once; consume it in form and Worker allowlist. Keep arbitrary/unknown URL query values unselected; direct API unknown context fails. Preserve bounded contextId schema, idempotency, consent, origins, Turnstile, access roles and disabled sending.
- [x] Against an owned local Worker/D1, exercise valid Offering/Room capture and invalid/draft/disabled context rejection. Assert expected stored scalar contextId, no duplicate on retry and no external send. Run relevant existing backend regression tests; no migration or unrelated newsletter replay unless changed boundaries require it.
- [x] Commit as feat: share registered enquiry contexts across forms and worker; obtain independent review.

## Task 6: Public, disabled-module and build acceptance

**Files:** Add e2e/composition-c-content.spec.ts, e2e/composition-c-builds.spec.ts and scripts/verify-composition-c.mjs; add package.json test:composition-c acceptance entry. Extend tests/composition-b-cleanup.test.ts or introduce tests/composition-c-cleanup.test.ts for new ownership paths; reuse existing cleanup primitives. Update docs/DESIGN_SYSTEM_SHOWCASE.md only for affected renderer/import boundaries.

**Interfaces:** Public verifier owns temporary Rooms/project/index/media resources and restores them exactly. Its evidence records commands, clock, module/profile combinations and owned shutdown, rather than assuming build success from files left by another run.

- [x] Test cleanup failures before broad fixture mutation: failed shutdown prevents regeneration; one conflicting resource does not suppress independent restoration; full source snapshots are checked before each configure/build. Extend safeguards only where C creates a new ownership path.
- [x] Verify EN/EL Room listing/detail and contact selection at 375/768/1440: one H1, image dimensions/load/crops, text-only and empty states, keyboard, no-JS content, safe links, no overflow and representative axe/manual screenshots. Use known media and temporary content, preserving baseline Home/settings.
- [x] Stop the exact owned launcher. Verify rooms false/true crossed with enquiries/newsletter/nurture and articles false/true through pure/config/native metadata tests. Run full build/CMS/Worker acceptance for default rooms=false; rooms=true/enquiries/articles=true; rooms=true/enquiries/articles=false; rooms=true/newsletter/articles=true; rooms=true/nurture/articles=true. Avoid replaying unchanged lifecycle flows for every permutation.
- [x] Prove disabled malformed Rooms/index exclusion before parsing across read/configure/CMS build; no collection/chooser/routes/nav/contexts, dormant section AST/copy retained. Verify enabled empty index can publish; unpublished localized index blocks its details/alternates. Restore exact bytes after each owned mode and before regeneration.
- [x] Run pnpm check, pnpm test, pnpm build, pnpm worker:check and pnpm cms:local-build with owned dev stopped. Run pnpm test:static-routing and pnpm test:showcase-builds; confirm protected/public routing and dedicated preview code exclusion in actual staging/production inventories. Distinguish known baseline advisories from new failures; do not upgrade dependencies to quiet output.
- [x] Commit as test: verify composition c public and module boundaries; obtain independent review. Record any remaining blockers honestly before finalization.

## Task 7: Extension handoff and whole-branch review

**Files:** Create docs/DOMAIN_EXTENSIONS.md and docs/superpowers/plans/2026-10-18-starter-v2-composition-c-evidence.md; update AGENTS.md, docs/{ARCHITECTURE,CONTENT_MODEL,COMPOSITION_AUTHORING,ROOMS_AUTHORING,QUICKSTART,FOUNDATION_DECISIONS}.md. Archive execution reviews/rulings under docs/superpowers/reviews/2026-10-18-composition-c/.

**Interfaces:** The developer recipe lists the exact registration seams, keyed dataset access, owned Page declaration, typed map contributions, static Tina/Astro adapters, shared publication and enquiry contribution. The existing test-only second domain proves that recipe without shipping a second business module.

- [x] Cross-check the extension recipe against the second-domain test and Rooms diff: use the final seams; disclose the two reviewed Task 3 generic-helper exceptions after Task 2. Document module enablement/restart, draft creation/index publication dependency, immutable URLs, EN/EL copy, source bounds, disabled dormant behavior and known original-image performance limits.
- [x] Fill evidence with actual commands/results, narrow browser/native scopes, owned cleanup, source-repo read-only snapshots and limits; mark this plan's boxes only from recorded evidence. Document all controller rulings with the associated cost/tradeoff. Do not label local tests hosted readiness or accessibility certification.
- [x] Request one whole-branch review on the most capable available model at medium reasoning (gpt-6-astra, approved candidate `7a12969` with no Critical/Important findings; [report](../reviews/2026-10-18-composition-c/final-review.md)), with accepted spec, plan, baseline diff, task reviews and evidence. Review is read-only; no automatic broad test replay. Batch legitimate final findings into one owned fix wave and one scoped re-review, with verification appropriate to changed boundaries.
- [ ] Commit final documentation/evidence. Preserve permanent reviews/rulings before removing only the verified C-owned scratch workspace. Keep branch local; no release operation. Restart the exact owned local stack if it was stopped, verify site/CMS/query/Worker endpoints, and report HEAD, acceptance evidence and any remaining limitations.

## Execution and review protocol

Use the previously selected medium subagents and separate independent review after every task. Each implementer receives only the spec, this plan, its task brief, accepted interface handoff and relevant files. Fresh reviewers check specification compliance and code quality before the next task; controller coordinates rather than silently implementing fixes. Dependent tasks run serially. No product changes begin before this written plan is approved.

At execution startup, read the subagent-driven-development and worktree skills; establish the C-specific workspace/ledger, confirm branch/source snapshots and process ownership, and record the task file/interface preflight. Existing C branch in the isolated v2 repository is intentional; do not move to or mutate either reference repository. Read verification-before-completion before completion/commit claims.

Self-review: all approved specification areas map to Tasks 1-7; registry/native/Astro ownership and exact shared interfaces are defined; numeric/list constraints are pinned once; second-domain proof, index gating, enquiry compatibility, immutable native identity and disabled-before-parse behavior each have explicit tests. No runtime code or dependencies were changed while writing this plan.
