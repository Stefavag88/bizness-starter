# Task 1 report: Static domain registration and dormant discovery

Date: 2026-10-18. Branch: `codex/starter-v2-composition-c`. Base: `de8b2ae4480fb6eae0e4888fccb0b0a4974db734`.

Status: Task 1 implemented and verified; independent review is owned by the controller. No Rooms production registration or module flag was introduced. No subagents/reviewers were created. No launcher was started or reused. Reference repositories were not modified. No dependency, canonical content, hosted configuration, delivery, deployment, push or merge work occurred.

Commit: `1d968898fa4531e93f0be9b271ee4a6f747dc6a7` — `feat: add static domain registration and dormant discovery`. Tracked working tree is clean after commit; report and generated evidence are intentionally unstaged.

## Delivered behavior

- Static browser-safe definitions with duplicate key/native alias/directory/owned Page filename, template and ID rejection. Built-in collection aliases/directories and protected Page ownership are reserved. Definitions and ownership/rich-path containers are copied and frozen.
- Active flat domain folders load through their own strict schemas into `ContentSnapshot.domains`; missing active folders are empty arrays. Nested folders, malformed active JSON and invalid active records fail with their filename/path.
- Disabled owned Page filenames are calculated before Page JSON is opened. Disabled domain folders are not enumerated or parsed; malformed dormant bytes remain unchanged. An active malformed sibling still fails in both the loader and descriptor builder.
- `project.modules` is an empty strict object with default `{}`; unknown keys fail. The explicit Rooms boolean belongs to Task 3.
- Descriptor construction is testable independently and retains CLI behavior. It excludes disabled Pages before legacy insights discovery, emits declaration-derived filename stems, and keeps infrastructure and record/item IDs out of generated schema metadata. Existing custom active insights filename discovery is retained.
- Native Page collection exclusions combine legacy article exclusions with disabled domain declaration filenames. Existing named datasets and `publicRoutes(content)` are unchanged.

## RED / GREEN evidence

1. Added `tests/domain-registry.test.ts`, `tests/domain-discovery.test.ts` and the test-only lesson fixture before production implementation.
   - Command: `pnpm exec vitest run tests/domain-registry.test.ts tests/domain-discovery.test.ts`.
   - Initial RED: both suites could not resolve the absent `domain-registry.mjs`.
   - After implementing registration only, reran the same command: registry passed, while discovery had 7 failing tests. Concrete failures included ignored active domain files, malformed disabled `lessons.json` being opened, missing module default and absent descriptor builder.
2. Implemented discovery/configuration/descriptor integration.
   - Focused GREEN: 6 files / 76 tests passed, including requested project-config, CMS metadata, articles-disabled and static-schema regressions.
3. `pnpm check` initially identified one existing detached media fixture missing the newly required `domains` container. Added `domains: {}` to that fixture, preserving the required public type contract.
4. Added a camel-case rich-field-path regression before changing path validation.
   - Command: `pnpm exec vitest run tests/domain-registry.test.ts`.
   - RED: 1 failed / 29 passed (`bedDescription` incorrectly rejected).
   - GREEN after accepting safe camel-case schema fields: the expanded focused set passed.
5. First full `pnpm test` uncovered a real configure integration regression: `scripts/configure.mjs` had depended on importing `cms-descriptor.mjs` for its side effect. The new pure-builder/CLI guard left a temporary fixture's `.generated/cms.json` absent.
   - Result: 574 passed / 1 failed / 1 skipped, failure named `tests/access-configuration.test.ts > emits JSON role lists for Worker without exposing identities in the CMS descriptor`.
   - Root cause was confirmed at configure's final dynamic import. Updated that caller to explicitly invoke `createCmsDescriptor` through its existing byte-stable writer. This source file addition was confirmed in scope by the controller.
   - Failed-run log: `.generated/composition-c-task-1-test-first.log`.
6. Final focused command: `pnpm exec vitest run tests/access-configuration.test.ts tests/domain-registry.test.ts tests/domain-discovery.test.ts tests/project-config.test.ts tests/cms-metadata.test.ts tests/cms-articles-disabled.test.ts tests/cms-static-schema.test.ts tests/composition-b-media.test.ts`.
   - GREEN: 8 files / 97 tests passed.
7. Final `pnpm check`: exit 0; TypeScript succeeded and Astro reported 44 files, zero errors/warnings/hints.
8. Final `pnpm build`: exit 0; 23 static pages built with existing EN/EL routes and local showcase preserved.
9. Final full `pnpm test`: exit 0; root 56 files passed, 575 tests passed, 1 optional native-query test/file skipped; site 4 files / 16 tests passed.
   - Final log: `.generated/composition-c-task-1-test.log`.
10. `git diff --check`: exit 0. Git reports only the repository's LF-to-CRLF normalization notices for several added/changed files.

The full suite was rerun only because the first run exposed the configure regression. No unresolved test failure remains.

## Baseline warnings and limitations

The existing Node experimental SQLite warning appears in the supplied baseline log and both full-suite runs. It is separate from test failures. The optional native query was already skipped in the supplied 537-root / 16-site baseline and remains skipped because no indexed CMS stack was authorized for reuse. No real native UI build/save verification was claimed in this registry/loader step.

## Changed files

- `packages/content/domain-contracts.ts`, `domain-registry.mjs`, `domain-registry.d.mts`: new public domain types, validation/static registration and lookups.
- `packages/content/types.ts`, `index.ts`: required typed domain containers and browser-safe exports.
- `packages/content/read.mjs`, `read.d.mts`: active loading and pre-parse owned Page exclusion, optional registry injection.
- `packages/content/localize.mjs`, `localize.d.mts`, `catalog.mjs`, `catalog.d.mts`: optional registry plumbing, empty localized container for Task 2.
- `packages/config/project.mjs`, `project.d.mts`: strict empty modules boundary.
- `scripts/cms-descriptor.mjs`, `cms-descriptor.d.mts`, `configure.mjs`: pure descriptor builder, CLI and explicit configure caller.
- `tina/collections/page.ts`: declared disabled Page exclusions.
- `tests/domain-registry.test.ts`, `domain-discovery.test.ts`, `fixtures/content/domain.ts`: test-only extension and discovery/registration regressions.
- `tests/cms-static-schema.test.ts`: additive descriptor metadata contract.
- `tests/composition-b-media.test.ts`: detached fixture supplies required empty domain container.
- `docs/ARCHITECTURE.md`, `docs/CONTENT_MODEL.md`: current registration ownership and next-step boundary.

## Exact produced interface handoff

Types live in `packages/content/domain-contracts.ts` and are exported by the browser-safe `packages/content/index.ts` barrel. Domain-owned type modules augment `DomainRecordMap` and `LocalizedDomainRecordMap` in `domain-contracts`; the lesson test demonstrates that exact module augmentation.

```ts
interface DomainRecordMap {}
interface LocalizedDomainRecordMap {}
type DomainRecords = {[K in keyof DomainRecordMap]?:DomainRecordMap[K][]};
type LocalizedDomainRecords = {[K in keyof LocalizedDomainRecordMap]?:LocalizedDomainRecordMap[K][]};
interface OwnedDomainPage {readonly filename:string;readonly template:string;readonly contentId:string}
interface DomainContext {project:ProjectConfig;locale:string;now:string;pages:readonly LocalizedPage[]}
interface CatalogContext {project:ProjectConfig;now:string;pages:readonly Page[];recordIds:ReadonlySet<string>}
interface DomainDefinition<R=unknown,L=unknown> {
 readonly key:string;readonly collectionName:string;readonly directory:string;readonly schema:ZodType<R>;
 readonly ownedPages:readonly OwnedDomainPage[];
 readonly enabled:(project:ProjectConfig)=>boolean;
 readonly richFields:readonly {readonly path:readonly string[];readonly inline:boolean}[];
 readonly projectRecord:(record:R,context:DomainContext)=>Omit<L,keyof RouteFields>|null;
 readonly routePath:(record:Omit<L,keyof RouteFields>,context:DomainContext)=>string;
 readonly validate:(records:readonly R[],context:CatalogContext)=>void;
 readonly enquiry:boolean;
}
interface DomainRegistry {readonly definitions:readonly DomainDefinition<any,any>[]}
```

Only the heterogeneous registry adapter erases callback types; keyed domain record maps preserve consumer types. Runtime/declaration pairs in `domain-registry.{mjs,d.mts}` expose:

```ts
defineDomain<R,L>(definition:DomainDefinition<R,L>):DomainDefinition<R,L>;
createDomainRegistry(definitions:DomainRegistry['definitions']):DomainRegistry;
const domainRegistry:DomainRegistry; // currently empty, frozen
getActiveDomains(project:ProjectConfig,registry?:DomainRegistry):DomainRegistry['definitions'];
getDisabledDomainPages(project:ProjectConfig,registry?:DomainRegistry):readonly OwnedDomainPage[];
```

Existing signatures now include the isolated registry seam:

```ts
readContent(root:string,project:ProjectConfig,options?:{now?:Date;registry?:DomainRegistry}):ContentSnapshot;
localizeContent(source:ContentSnapshot,locale:string,project:ProjectConfig,registry?:DomainRegistry):LocalizedContent;
validateCatalog(source:ContentSnapshot,project:ProjectConfig,registry?:DomainRegistry):void;
```

`ContentSnapshot.domains: DomainRecords` and `LocalizedContent.domains: LocalizedDomainRecords` are required containers with optional keyed datasets. `ProjectConfig.modules` is presently `Record<string,never>` matching the empty strict schema.

`createCmsDescriptor(root:string,project:ProjectConfig,registry?:DomainRegistry)` returns `{project,articlePageFiles:string[],domainPageFiles:string[]}`. `project` is the explicit Pick of name/starterVersion/schemaVersion/profile/articles/modules/locale/languages/siteUrl/interests. `domainPageFiles` contains disabled declared Page filename stems only. The CLI writes it byte-stably; configure explicitly calls the builder and uses its existing stable writer. Tina Page exclusions derive directly from `getDisabledDomainPages(project)` so behavior follows the requested project instead of stale descriptor enablement.

## Task 2 concerns / intentionally pending work

No Task 1 blocker remains. Registry callbacks are declared but are not yet invoked for domain publication, routes, alternates or catalog validation. `localizeContent` currently returns `domains: {}`. Task 2 must implement those algorithms plus `getDomainRecords`, route variants, enquiry projection and renderer/native seams required by its brief.

In particular, base catalog navigation currently knows only the legacy disabled insights exception. A settings navigation ID targeting a disabled domain-owned Page would still fail as a missing page until Task 2 integrates disabled ownership into catalog/navigation checks. This does not affect production because the static domain registry remains empty. Task 2 must also include active domain IDs/translations/relationships in global catalog checks and enforce owned Page identity and route/prefix collisions; this step validates declaration ownership collisions, not public path ownership.

Rooms registration, Page template/section schemas and the explicit `modules.rooms` flag remain Task 3. Native GraphQL discovery/identity/save adapter integration remains its scheduled task; this report makes no native domain querying/save claim.
