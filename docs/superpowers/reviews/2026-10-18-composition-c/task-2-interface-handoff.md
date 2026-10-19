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
