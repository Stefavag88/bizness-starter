# Composition C Task 2 report

Status: implementation complete; controller-owned independent review pending. Base: 1d968898fa4531e93f0be9b271ee4a6f747dc6a7. Commit subject: refactor: project registered domains through shared pipelines.

## Scope and ownership

Implemented generic publication/catalog/routes, static detail dispatch, native discovery/save adapters and composable Page/section extension seams. Production content, module, Tina and Astro domain registrations remain empty. No Rooms records, flags, UI controls or renderers were added. No enquiry implementation was added; the existing domain enquiry metadata remains available for Task 5. Home, settings bytes, project.json, current editorial consumers and schemaVersion 2 remain unchanged. No dependencies changed.

Only C:/Projects/bizness-starter-v2 was modified. Neither reference repository was built, edited or used for process management. A process inventory before the full test run found no existing project Node launcher. No unrelated processes were stopped, and no stack was launched or left running by this task.

## TDD and verification evidence

- Initial RED: all 13 original new root assertions failed across domain-projection/native/extension, and both site renderer assertions failed. Missing-module discovery was followed by minimal empty boundary implementations so the intended assertions could be observed failing.
- Core GREEN: 9 projection/extension assertions passed. The test-only workshops contract supplies its own localization/publication/index-dependency callbacks and augments the public keyed record maps; lesson supplies a separate lightweight discovery/native registration example.
- Native GREEN: enabled adapter discovery, duplicate/missing native registration failures, original AST/value identity, invalid rich text, draft-only creation, persisted slug identity, missing/renamed update targets, disabled collection query omission, and dormant Page exclusion passed. The disabled Page tests use throwing getters to prove values are excluded before dereference/projection. Navigation chooser filtering has the same filename-first proof.
- Additional RED/GREEN: conflicting domain/built-in index prefixes (including drafts), configured-locale/system callback paths, dormant navigation chooser filtering, and independent LIMITS export were observed failing before their implementations.
- Focused regression matrix before final extraction: 122 tests across 13 root files passed, plus 2 actual Astro renderer tests. The matrix covered C contracts and existing publication, routes, localization/assets, native save/rich boundaries, persisted documents, renderer registry and navigation authoring.
- First complete runtime suite: 593 root tests passed, 1 existing opt-in native query test skipped; all 18 site tests passed. No failures. Node emitted its existing experimental SQLite warning.
- A later type-only native alias derivation was verified by focused contracts and pnpm check; it did not introduce runtime changes.
- Controller-approved final runtime change: shared LIMITS moved to a pure module to prevent a concrete future module-registration import cycle. Existing exports remain compatible. A test module constructs its section schema using only the pure limits and rich-text primitives, then demonstrates title limits and unsafe-link rejection. Final focused contracts: 26 tests across 5 files passed.
- Final pnpm check passed: TypeScript plus Astro, 47 Astro files, 0 errors, 0 warnings, 0 hints.
- Final pnpm test passed after the runtime import extraction: 594 root tests passed, 1 existing opt-in native query test skipped (59 files passed/1 skipped), and all 18 site tests passed (5 files). Only the existing Node experimental SQLite warning appeared.
- Final pnpm build passed: 23 static pages. No final-code runtime test failures remain.
- The second full-suite run was intentional: the controller explicitly required it after the LIMITS extraction changed the runtime import graph. All final runtime code is covered by that final full run. Only English documentation/report updates followed verification.
- git diff --check passed before report creation; final check also runs at commit preparation.

## Baseline preservation proof

An ignored detached module copy of accepted base 1d96889 was materialized under .generated/task2-base-1d96889 using Git blob reads. At the fixed clock 2026-10-18T00:00:00Z, both versions read the same canonical content. All configured localized projections were deeply equal; every locale's publicRoutes JSON and createManifest JSON were byte-identical. A first localized JSON string comparison detected only Page property-order differences caused by the extraction; deep equality confirms identical values. No public route/manifest output changed. Existing fixture route/manifest regressions also pass.

EditorialDetail.astro contains the existing article markup, extracted without redesign. Its actual Astro render regression checks one H1, role/date markup, safe rich descriptions/body and localized links. Existing site render suites remain green.

## Produced content APIs

- packages/content/domain-publication.{mjs,d.mts}: projectDomains(source, locale, project, pagesByLocale, registry?), getDomainRecords<K>(content, key, registry?), getDomainRouteRecord(content, domain, contentId, registry?) and assertOwnedPageIdentity(candidate, filename?, registry?). The public browser-safe index.ts exports these APIs.
- getDomainRecords preserves LocalizedDomainRecordMap[K] and returns an empty array for registered absent/disabled data; an unregistered runtime key throws. Its optional registry argument is an isolated-test seam, matching the existing content APIs' registry injection.
- Domain callbacks receive already localized, published base Pages for each configured locale and the same source.now captured by the reader/native catalog. Callback records are detached before projection. Generic finalization supplies the path and reciprocal alternatives. Missing translations and index eligibility are domain callback concerns, demonstrated by workshops; no default-language fallback is added by the framework.
- Framework route adaptation requires projected contentId and title; description/seoDescription are optional layout metadata. getDomainRouteRecord exposes this minimal presentation boundary; business consumers continue using the keyed accessor. Domain renderers own the rest of their record shape.
- Route is now a discriminated union retaining legacy kinds and adding {kind:'domain',domain:string,...existing route identity}. publicRoutes appends domains to the same collision-checked output consumed by static generation and manifests.
- Catalog includes active domain records in global IDs, configured translation locales, reserved slugs and active URL collisions; invokes each definition.validate with complete global recordIds; validates declared Page identity and overlapping index prefix ownership; and permits stored declared-disabled navigation IDs while rejecting unknown destinations.
- Owned Page filename/template/contentId are enforced together by filesystem loading and native catalog/save validation. Special-template creation remains forbidden. Dormant Pages are excluded before parsing/native value dereference.

## Exact Task 3 registration recipe

1. Add the domain-owned implementation under packages/domains/rooms/. Its types.ts augments DomainRecordMap and LocalizedDomainRecordMap in packages/content/domain-contracts, plus PageTemplateMap and SectionCopyMap in packages/content/types. PageTemplate is keyof PageTemplateMap; SectionType is keyof SectionCopyMap. Add a type-only Rooms types import at the declaration registration seam so consumer programs load these augmentations.
2. Register the browser-safe Rooms definition in packages/content/domain-registry.mjs, and its type module in the paired declaration imports. Keep filesystem/image decoders and all Tina/Astro imports out. Its projectRecord implements localized publication and the published Rooms index dependency using context.pages/context.now. Its routePath returns /LOCALE/INDEX_SLUG/ROOM_SLUG. Its validate implements room-owned reference/translation relationships and bounds.
3. Add the literal Rooms Page template to modulePageTemplates and the module-owned room-list definition to moduleSectionDefinitions in packages/content/module-extensions.mjs; add the corresponding type-only imports in module-extensions.d.mts as needed. The section definition supplies copySchema, nativeName, variants, referenceFields, defaultReference, richFields, defaultCopy and enabled(project). Keep disabled definitions registered so persisted copy round-trips. Schemas, persisted document normalization, generic localization, chooser filtering and renderer variant contracts derive from these registrations.
4. Important acyclic import rule: domain/section schema modules import LIMITS from packages/content/limits.mjs and safety helpers from packages/content/rich-text.mjs. They must not import schemas.mjs or section-registry.mjs, because those consume the static module registrations. Existing LIMITS imports through schemas/section-registry still work for legacy consumers.
5. Add the native module-owned section field factory to moduleSectionCopyFields in tina/fields/section-copy.ts. This is a Tina-only static map; include all custom fields such as localized empty-state copy. Disabled section copy templates remain present. Page fields are otherwise built generically from PAGE_TEMPLATES; getDisabledDomainPages hides disabled owned Page templates/files. Actual Page reference controls receive project so disabled module section types disappear from the chooser and existing dormant sections explain retained copy/public omission.
6. Register {key, allowCreate, assertIdentity, buildCollection} in nativeDomainRegistrations in tina/domains/index.ts. buildDomainCollections(project) discovers enabled definitions, requires registration coverage and verifies the native name/path match the content definition. Delete/folder creation stays disabled. The Room collection factory uses the existing collection wrapper for the common save/catalog hook. getNativeDomainAdapters(project, {registry?,nativeRegistry?}) supplies key/collectionName/directory/schema/richFields/allowCreate/assertIdentity to generic algorithms.
7. assertDomainIdentity(candidate,current,submission) is the shared native guard for flat paths, immutable existing contentId/slug and draft-only creation (including supplied translations). A module-owned assertIdentity wrapper may call it and enforce retained image/amenity identity. Existing files are matched by persisted relativePath, so renames/missing update targets fail. Use the module-owned handlers for nested structure/edit operations; no generic collection-name switches are needed.
8. Native richFields are applied to a detached normalized record and each supplied translation; wildcard array paths are supported. Native projection/save APIs accept an optional final NativeDomainOptions test seam. nativeProjection additionally accepts an optional kind before options; old two-argument calls remain valid. beforeSubmit/validateCurrentSave return the original values after successful validation.
9. Add RoomDetail.astro and RoomList.astro under templates/domains/rooms/. Register the detail in domainRenderers via createDomainRendererRegistry in apps/site/src/templates/domains/index.ts, and add room-list to the existing sectionRenderers map in templates/sections.ts. section-registry.ts derives type/variant coverage from browser-safe content definitions. Duplicate domain renderers fail; assertDomainRendererCoverage(project) runs before static snapshot/build generation and requires every active domain's renderer.
10. Native underscore aliases derive generically through NativeSectionName<T>/NativeSectionType in composition.d.mts. room-list therefore admits room_list after type registration, without editing an alias list.
11. Add only the planned explicit modules.rooms config key/default and declaration changes, module-owned content/index file and registration entries. Do not modify core read/localize/publication/catalog/routes/native algorithms to handle Rooms. Report a missing contract to the controller instead.

## Boundaries and concerns

- Real indexed Tina UI create/edit/reorder/rejected-save recovery is deliberately Task 4; Task 2 supplies tested generic boundaries, not a real-browser save claim.
- Room image/amenity contracts, media metadata, custom structure controls and item identity remain module-owned Task 3/4 work.
- Enquiry contexts/manifest/Worker changes remain Task 5. Existing offerings/articles/campaign manifest contracts are unchanged.
- Production registries are intentionally empty and there is no domain sample content. Test registrations remain isolated and are not runtime plugin loading or serialized config.
- The independent LIMITS extraction was a controller-approved resolution of a concrete import-cycle risk discovered before handoff, not a broad text-schema refactor.
- No current implementation blocker remains. Independent review is controller-owned and must precede freezing the generic algorithms.

## Files changed

- apps/site/src/lib/content.ts
- apps/site/src/pages/[locale]/[...path].astro
- apps/site/src/templates/EditorialDetail.astro
- apps/site/src/templates/domains/index.ts
- apps/site/src/templates/section-registry.ts
- apps/site/tests/domain-rendering.test.ts
- apps/site/vitest.config.ts
- docs/ARCHITECTURE.md
- docs/CONTENT_MODEL.md
- packages/content/catalog.mjs
- packages/content/composition.d.mts
- packages/content/domain-publication.d.mts
- packages/content/domain-publication.mjs
- packages/content/index.ts
- packages/content/limits.d.mts
- packages/content/limits.mjs
- packages/content/localize.mjs
- packages/content/module-extensions.d.mts
- packages/content/module-extensions.mjs
- packages/content/read.mjs
- packages/content/routes.mjs
- packages/content/schemas.d.mts
- packages/content/schemas.mjs
- packages/content/section-registry.d.mts
- packages/content/section-registry.mjs
- packages/content/types.ts
- tests/domain-extension.test.ts
- tests/domain-native.test.ts
- tests/domain-projection.test.ts
- tests/fixtures/content/domain.ts
- tina/collections/index.ts
- tina/collections/page.ts
- tina/collections/settings.ts
- tina/domain-validation.ts
- tina/domains/index.ts
- tina/fields/composition.tsx
- tina/fields/navigation.tsx
- tina/fields/section-copy.ts
- tina/sections/index.ts
- tina/validation.ts

The detailed workflow report remains in the existing ignored .superpowers handoff directory. Public architecture/content documentation is committed.

## Commit

d2503c74afe3afc58625c71451f819dbef632258 — refactor: project registered domains through shared pipelines

## Review fix round 1

Reviewed base: d2503c74afe3afc58625c71451f819dbef632258. Finding: domainPath accepted relative/en/item because parts[0] was ignored. Verified the issue with new EN/EL regression cases before changing production validation.

The one-line production change requires parts[0] === '' in addition to the existing locale, segment, reserved-prefix and canonical-segment checks. Each new regression makes only its target locale callback return relative/LOCALE/item, so both default and alternate locale projection paths are exercised. Existing absolute paths and reciprocal alternatives remain covered by the original positive tests.

Commands and actual results from C:/Projects/bizness-starter-v2:

- RED: pnpm exec vitest run tests/domain-projection.test.ts — exit 1; 1 file failed; 2 new cases failed, 9 passed. Both failures were expected [Function] to throw an error, proving the missing rejection. Raw output: .generated/evidence/task2-fix1-red.log.
- GREEN: pnpm exec vitest run tests/domain-projection.test.ts tests/routes.test.ts — exit 0; 2 files passed; 29 tests passed. Includes relative callback paths, existing reserved-system/configured-locale callback negatives, prefix ownership, route collisions and valid alternatives. Raw output: .generated/evidence/task2-fix1-focused.log.
- CHECK: pnpm check — exit 0; TypeScript and Astro checks passed; 47 Astro files, 0 errors, 0 warnings, 0 hints. Raw output: .generated/evidence/task2-fix1-check.log.
- Outputs were captured during these actual runs with PowerShell 2>&1 | Tee-Object -FilePath PATH. No full suite/build was rerun to reconfirm historical output; the controller requested the bounded focused matrix/check only for this fix.

### Historical baseline evidence limitation and actual command

The original baseline experiment was executed as an inline PowerShell here-string piped to node --input-type=module. Its JavaScript command body below is the actual comparison command used during implementation, recovered from the tool transcript; it is not a newly executed reproduction. The detached baseline modules it read remain at .generated/task2-base-1d96889/packages/content/ and .generated/task2-base-1d96889/scripts/manifest.mjs (read.mjs existence was checked again during this fix). These are implementation artifacts, not a retained raw comparison log. The original experiment did not save its script/stdout to an evidence file. Likewise, raw final full-suite/build outputs were returned through the original tool transcript and were not saved to local files. No historical raw log has been recreated or invented here; the controller owns resolution of that packaging limitation.

```js
import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {isDeepStrictEqual} from 'node:util';
import {readContent} from './packages/content/read.mjs';import {localizeContent} from './packages/content/localize.mjs';import {publicRoutes} from './packages/content/routes.mjs';import {createManifest} from './scripts/manifest.mjs';import {parseProject} from './packages/config/project.mjs';
const baseline=resolve('.generated/task2-base-1d96889');const prior=await import(pathToFileURL(resolve(baseline,'packages/content/read.mjs')).href),localized=await import(pathToFileURL(resolve(baseline,'packages/content/localize.mjs')).href),routes=await import(pathToFileURL(resolve(baseline,'packages/content/routes.mjs')).href),manifest=await import(pathToFileURL(resolve(baseline,'scripts/manifest.mjs')).href);
const project=parseProject(JSON.parse(readFileSync('project.json','utf8'))),options={now:new Date('2026-10-18T00:00:00Z')},before=prior.readContent(process.cwd(),project,options),after=readContent(process.cwd(),project,options);
const projectionEqual=project.languages.every(l=>isDeepStrictEqual(localized.localizeContent(before,l.code,project),localizeContent(after,l.code,project))),routesEqual=project.languages.every(l=>JSON.stringify(routes.publicRoutes(localized.localizeContent(before,l.code,project)))===JSON.stringify(publicRoutes(localizeContent(after,l.code,project)))),manifestEqual=JSON.stringify(manifest.createManifest(before,project))===JSON.stringify(createManifest(after,project));
console.log(JSON.stringify({baseline:'1d96889',localizedDeepEquality:projectionEqual,routeByteEquality:routesEqual,manifestByteEquality:manifestEqual}));if(!projectionEqual||!routesEqual||!manifestEqual)process.exitCode=1;
```

The historical tool result was exit 0 with {"baseline":"1d96889","localizedDeepEquality":true,"routeByteEquality":true,"manifestByteEquality":true}. This statement records the previously observed transcript result, not a fresh run. The original final check/test/build chain was pnpm check; then pnpm test; then pnpm build with exit-code guards. Its raw completion was returned by exec session 22373 in the implementation transcript.

Fix commit: 9c2a2560ea800a2c5c50853f7b9b2d9372989073 — fix: reject relative domain callback paths. Tracked worktree clean after commit.
