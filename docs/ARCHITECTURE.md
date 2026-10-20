# Architecture

This is the isolated Business Starter v2 Foundation with Compositions A, B and C (C whole-branch review approved; local closeout complete). Canonical EN/EL JSON lives under `content/`; developer configuration lives in `project.json`. Public output is static Astro, with a separate Worker for forms, protected operations and email lifecycle. No deployment or external account has been configured.

| Boundary | Contract |
| --- | --- |
| packages/config | Strict browser-safe `parseProject`; no filesystem imports |
| packages/content | `readContent(PROJECT_ROOT, project)` validates canonical documents; `localizeContent` and `publicRoutes` share publication and reciprocal locale availability |
| apps/site/src/lib/content.ts | Server-only project/content adapter; project-root injection remains outside client bundles |
| apps/site/src/templates/Page.astro | One `LocalizedPage` plus one `LocalizedContent`; copy remains on page records |
| templates/sections.ts | Eleven static section Astro imports, exhaustive renderer map, registered variant validation; no component-path lookup |
| packages/design-system | Reviewed theme JSON/validator and generated semantic CSS; neutral theme uses self-hosted Noto Sans for Greek/Latin |
| packages/contracts, email | Bounded API schemas, escaping/token helpers and plain email rendering |
| worker | Contact, enquiries/newsletter/nurture gating, SQL consent lifecycle, reviewed campaign snapshots, delivery/queue/workflow, protected operations and localized asset fallback |
| migrations | Initial schema for a new project database; contains no subscriber records |
| tina | Native editor collections, rich-text projection and detached save validation; browser imports contain no filesystem adapter |
| scripts | Configuration, local migration/startup, owned processes, input-only content generation and local smoke |

`pnpm configure` explicitly runs the CMS descriptor generator after project/content validation and emits ignored local URLs, Worker bindings, the backend manifest, migration input, theme CSS and asset headers. Backend manifest IDs and URLs come from the same read/localize/publicRoutes pipeline as the site. Enquiry context IDs are the deduplicated union of public Offering and registered enquiry-enabled domain records in every configured locale, so independently published translations remain valid contact choices. The localized contact form and manifest.enquiryContexts share packages/content/enquiry-contexts.mjs; domain eligibility is already determined by the existing publication projection, including each locale’s owned index dependency. The Worker validates the existing bounded scalar contextId against that union, without trusting a client locale or switching on domain names. Legacy offerings/articles/campaigns/routes manifest arrays retain their contracts. Static contact pages preselect only a context present in their localized option set from the existing contextId query parameter. Articles in the manifest are exactly the active default-locale article set. SEO/RSS/email summaries use plain SEO or `plainText` extraction. All canonical routes omit a trailing slash; offering detail paths follow the configured offerings page slug, and people have `/LOCALE/people/SLUG` routes. The root redirects to the default locale. Workers Static Assets serves public locale pages and nearest localized 404.html files directly; root/API/newsletter/CMS/admin boundaries remain explicitly Worker-first. Astro dev middleware and the retained Worker fallback also preserve localized errors. See [static asset routing](STATIC_ASSET_ROUTING.md) for ownership, runtime proof and quota limits.

The public layout has one H1, semantic sections, simple navigation/footer, canonical metadata, available-language links and feeds. The public surface has no modal, visitor-state system or financial-specific branding; shared contact/social links use static explicit-prop components and a browser-safe destination projection; native CMS media selection supplies explicit local content images. The contact template owns native fields, required consent, inline validation, a focusable error summary, preserved retry keys, disabled duplicate submissions, timeout/retry feedback and server validation. JavaScript is required to submit the JSON API; a direct email alternative is provided. Hosted form protection is intentionally not configured in this local foundation.

## Local use

Use Node 22.x or 24.x and pnpm 10.13.1:

```text
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm worker:check
pnpm dev
```

`pnpm dev` validates/generates, builds the static asset baseline, applies additive D1 migrations with `--local`, then starts the input watcher, Worker and Astro site. Forms are not available before migration succeeds. Local sending writes only dummy capture messages in ignored project-local D1. Default site/Worker/Tina/datalayer ports are 4330/8790/4010/9010. `/api/health` works directly and through the site proxy. `pnpm db:local` is available separately and never uses remote migrations.

`pnpm dev:cms` additionally owns Tina on its configured port and datalayer port. `pnpm cms:local-build` runs the native local CMS build alone, without site/Worker/content watcher. Stop a launcher before a separate CMS build. Ctrl+C stops only exact PIDs/process trees created by that launcher; it never selects another project's processes by name or port. Occupied/duplicate ports fail before children are started. Override `SITE_PORT`, `WORKER_PORT`, `TINA_PORT`, `TINA_DATALAYER_PORT`; listener/port changes require a launcher restart.

## Save freshness

The owned `scripts/watch-content.mjs` watches only JSON input under content, project.json and theme JSON. It debounces saves and serializes `configure` subprocesses. Generated outputs, databases and native CMS outputs are excluded. Writes are byte-stable, including the CMS descriptor, so editorial copy does not unnecessarily rebuild the editor schema. Vite watches the same public inputs, invalidates server content modules and requests full reload. Wrangler observes changed imported manifests/settings. A successful canonical save therefore reaches public reload and the backend manifest without restarting the launcher. Invalid input reports validation errors and keeps the last valid generated manifest until corrected. Static deployment output still requires a new build; this is not a hosted content service.

## Security and profile boundaries

All profiles allow contact; enquiries exposes no newsletter/campaign routes. Newsletter enables consent and campaign lifecycle; nurture alone generates the Workflow binding. Marketing is not automatically enabled by publishing content. Default sending and marketing flags are false. SQL operations retain idempotency, scoped/generation-bound tokens, double opt-in, withdrawal suppression, approval hashes and ambiguous-provider quarantine. Node tests use isolated in-memory SQLite. Native Workflow execution and external providers are not simulated as successful cloud integrations.

Local origin allowances are generated exact loopback origins for the configured site/Worker ports and apply only to actual local requests. Remote requests require `SITE_URL`; the environment label alone cannot grant local administration or origin exemptions. Confirmation/unsubscribe capture links use the configured local Worker URL. Public assets have same-origin CSP for built scripts/styles/fonts; protected runtime HTML has nonce CSP, JSON APIs have no-store/nosniff and restrictive CSP. Hosted CMS/operations still require Access configuration. Developer-owned administrator/editor email arrays are normalized and emitted as JSON Worker variables; administrators can access CMS and operations, while editors can access CMS only. Both roles require verified Access JWTs remotely. Tina membership remains separate. See [authentication and migration](AUTHENTICATION.md).

`pnpm doctor` validates local configuration. `pnpm deploy:check` intentionally fails for this foundation: hosted CMS/form protection, secrets, account readiness and content/legal review remain required. There is no deploy command, real sending, cloud provisioning or remote migration in this task. Sample nurture messages remain a production blocker.

`pnpm smoke:local` starts an owned local launcher, checks public/Worker behavior and briefly changes one article's SEO copy to prove freshness. It checks the startup bytes before mutation and its exact temporary bytes before either normal or failure restoration. If another editor changes the source, it preserves those bytes in place, saves an unexpected-byte snapshot beside a unique original backup under `.generated/smoke-backups`, reports both paths and exits unsuccessfully. Process cleanup still runs on a restore conflict. These comparisons are best-effort filesystem checks, not an atomic cross-editor lock. Avoid concurrent editing during smoke. Its ignored `.generated/task4-smoke.json` records ports, checks, source hashes, backup/conflict paths, failures and stopped child PIDs. Native editor/browser save and source-ownership E2E coverage lives in e2e/foundation-cms.spec.ts and tests/cms-ownership.test.ts.

## Verification and handoff

The configurable Playwright harness uses E2E_BASE_URL and explicitly opted-in E2E_CMS_URL. Public routes and native saves have separate tests. Native source ownership derives expected serialized content from the actual UI request, active generated schema and installed CLI serializer, then verifies the complete persisted record before claiming its bytes. Conflicts retain user edits and original backups. The profile verifier serially builds native/static outputs, exercises built Worker/browser boundaries, stops only its own Worker tree and restores exact owned configuration on failure. See QUICKSTART.md for commands and COMPOSITION_AUTHORING.md for current authoring limits.

Isolated local CMS builds use Tina CLI’s supported --skip-indexing after an observed intermittent Indexing-local-files stall; native dev keeps full indexing and its query/UI saves are verified. The exact local-build limitation and controller-approved boundary are in QUICKSTART.md. Profile stages are bounded by PROFILE_STAGE_TIMEOUT_MS (default120000); their command runner stops only its created process tree on timeout.

## Composition A boundary

Project schemaVersion 2 selects one typed-list persisted document shape. Strict browser-safe document codecs produce detached normalized Page/Settings ID maps; public components, backend manifests and routes retain their semantic contracts. The static registry owns type/variant/copy definitions and does not import schemas back into itself. The CMS descriptor contains no page structure or navigation IDs. Static registered fields support new IDs and cross-page ID/type reuse without regenerating the schema.

Pure page/navigation operations copy changed containers while retaining opaque rich AST identity. Native custom controls batch shared/copy/translation changes in Final Form, permit incomplete editing states and validate a complete detached serialized candidate only at Save. Current catalog identity/path checks protect updates and flat Standard draft creation. No raw mutation service or custom persistence bypass is added. Native template creation permissions are collection-wide; visible special-template choices fail before disk writes. Settings exposes same-state direct locale labels so a rejected invalid form can be corrected before entering nested editors again.

Composition B adds FAQ/steps/media-text/gallery; Composition C adds static domains and optional Rooms. Stage 3A adds responsive static media; remaining Stage 3 and Stage 4 work stays deferred. Historical Foundation evidence retains its schemaVersion 1 observations; current Composition evidence records schemaVersion 2. No deployment, sending or external resources are enabled.

A known development freshness limit remains: the current Vite plugin invalidates on input changes through handleHotUpdate, but an add-only externally written published file may leave the route module cached and return 404 until a later content change or launcher restart. The supported native flow creates a draft and explicitly publishes through an update; its actual native proofs passed. Task 6's separately Node-owned fixture models that same draft-create/publish-update sequence and does not claim the add-only behavior is fixed.

## Showcase boundary

The local `/design-system` route uses a separate developer shell, actual registered renderers and detached localized fixtures. Its browser controller imports only pure preview state and generated theme metadata. Allowlisted URL values update document attributes and sample visibility without content/config/storage/API writes. Astro registers the route with its supported config-setup injectRoute hook only for local configuration; its entry lives outside src/pages. Staging/production never discover the showcase client graph, so dedicated preview JS/CSS and page HTML are absent. Shared business/theme/font assets and content-derived manifests/navigation/feeds retain their normal behavior. See DESIGN_SYSTEM_SHOWCASE.md.

Astro build.inlineStylesheets='never' and Vite build.assetsInlineLimit=0 keep emitted showcase styles/scripts external under the existing self-only asset CSP. These supported compiler settings affect asset packaging and request/performance costs across the site; they grant no new runtime permission. Shared component defaults and canonical content contracts remain unchanged.


## Composition B boundaries

The section registry owns strict per-type reference fields, default references, copy/item schemas, variants and rich-text paths (including wildcard item answers/captions). Detached native projection follows those paths without rebuilding opaque ASTs; nested item operations preserve unrelated native identity. Default-language references own shared ordered item IDs, images and crops; localized copies attach by section/item ID. Browser-safe packages/content/media.mjs validates source syntax. Server-only media modules validate contained original byte snapshots and produce bounded content-addressed derivatives through an explicitly owned Sharp 0.35.5 dependency. Browser/editor imports retain syntax and layout policy only. No content migration is needed.

SectionImage emits layout-aware picture/srcset/sizes, intrinsic dimensions and fixed aspect/crop classes. A per-build/per-dev-root media session separates rendered demand from the persistent cache; built Worker delivery serves ordinary static files. See [media optimization](MEDIA_OPTIMIZATION.md) for policy, lifecycle and ownership. Missing optional media/text is text-only; referenced failures throw with context. Vite's upload integration watches the stable public parent and invalidates on upload add/change/unlink/addDir; content JSON refresh remains separate. Metadata cache keys actual byte hashes, not paths. The public fixture exercises 480x320 to 320x480 replacement at one unchanged URL, then unlink/error, without schema regeneration.

The local showcase renders fourteen real type/variant pairs per supported locale. Dedicated preview JS/CSS are excluded by local-only route registration before graph discovery. Ordinary original PNGs in public/uploads/starter-samples remain production-usable media; they are not dedicated preview code. [Composition B evidence](superpowers/plans/2026-10-18-starter-v2-composition-b-evidence.md) records local acceptance, exact restoration and separate native/public proof scopes. Hosted Access/Tina/provider limits remain as documented in AUTHENTICATION.md and STATIC_ASSET_ROUTING.md.


## Composition C registration boundary

Browser-safe `packages/content/domain-contracts.ts` defines the augmentable `DomainRecordMap` and `LocalizedDomainRecordMap`, typed partial array containers, domain callbacks and registry interface. `domain-registry.mjs` owns static developer registrations; its production registry registers Rooms. `project.modules` is strict with explicit `rooms:boolean`, default false; unknown keys reject. Rooms remains independently optional from profile/articles and ships only a dormant draft index.

A domain declares a bounded key, GraphQL-safe collection alias, flat directory, record schema, owned Page filenames/templates/IDs, rich-text paths, enablement and projection/route/catalog callbacks. Registration rejects duplicate keys, collection aliases, directories and owned Page identities, plus collisions with built-in collections and Pages. Registry declarations are copied and frozen so later mutation of input arrays cannot change discovery. Content, native collection factories and Astro renderer registrations remain separate ownership boundaries; this registry imports neither Tina/Astro nor filesystem/image adapters.

`readContent(root, project, { now?, registry? })` reads only active flat domain directories into `ContentSnapshot.domains`. It calculates disabled owned Page filenames before opening Page JSON, preserving dormant invalid bytes. The optional registry is an isolated test seam; production uses the static registry. `localizeContent(source, locale, project, registry?)` and `validateCatalog(source, project, registry?)` accept the same seam for isolated tests; active domain projection uses the snapshot clock, then generic route/alternate finalization. Existing named collections and `publicRoutes(content)` remain unchanged.

The CMS descriptor has a testable `createCmsDescriptor(root, project, registry?)` builder and retains its existing CLI. It validates through the same loader, emits only allowlisted public project fields and declaration-derived disabled domain Page filename stems (`domainPageFiles`), and never reopens disabled Pages. Legacy article-index exclusion remains available through `articlePageFiles`, including custom active insights filenames. Native Page indexing calculates domain exclusions from the static declarations and the requested project. Record counts, IDs, nested item IDs and copy are absent from descriptor/schema metadata; infrastructure remains server-only.

## Composition C registration boundaries

The generic domain framework separates browser-safe content registrations in packages/content/domain-registry.mjs, optional Page/section registrations in packages/content/module-extensions.mjs, Tina factories in tina/domains/index.ts and server-only Astro detail renderers in apps/site/src/templates/domains/index.ts. Rooms is the only production registration; test-only workshops/lessons prove independent extension contracts. A business module adds its own contracts/handlers and entries at those seams rather than adding collection-name branches to loading, catalog, localization, routes or native validation.

Tina's getNativeDomainAdapters discovers only enabled definitions, requires matching native registrations and supplies their schema/rich paths/identity guard to the existing detached save/catalog pipeline. buildDomainCollections verifies matching collection names/paths and disables Delete/folder creation. Disabled collections are not queried through absent GraphQL types. Native validation returns original values and ASTs; module-owned identity wrappers protect nested business references on top of the shared immutable saved identity/draft-creation guard.

The static route template dispatches registered domain details and retains the existing editorial markup in EditorialDetail.astro. Domain renderer coverage is checked before build; duplicate/missing registrations fail actionably. Section renderers remain in the existing templates/sections.ts registration map, with type/variant coverage derived from the content section definitions. Disabled known sections retain their copy and native fields while disappearing from public projection and creation choices.

Keep domain schemas acyclic: use the independent limits.mjs and rich-text.mjs primitives, not the schema/section aggregators. Read [developer extensions](DOMAIN_EXTENSIONS.md) for the exact registration recipe and two approved helper corrections after the framework refactor. [Rooms authoring](ROOMS_AUTHORING.md) covers native draft/recovery/index publication; [C evidence](superpowers/plans/2026-10-18-starter-v2-composition-c-evidence.md) records accepted Tasks 1–6, local-only native/Worker/static scopes and approved whole-branch review with completed local closeout. Module enablement requires owned-stack shutdown, configure and restart; original images retain existing safety/performance limits.

## Contact/social rendering and acceptance

`packages/content/contact.mjs` supplies safe ordered destinations to explicit-prop `ContactDetails`, `SocialLinks` and decorative `ContactIcon` components. Contact keeps a form-first DOM and a 56rem aside split; footer and optional header consume the same shared Settings values. Distinct localized social navigation names identify each placement. No browser SDK, remote icons, app probes or new dependency is required. [Contact/social authoring](CONTACT_SOCIAL.md) documents tokens, localization, clears and static rebuilds.

The narrow public/native acceptance driver reuses established runtime/fixture ownership. Static fixtures use caller-known byte owners; the contact native test supplies an additive optional `expectedBytes` guard to the existing single `captureNative` owner. Installed GraphQL variable coercion precedes request/schema/serializer projection, including input-field ordering, before UI save dispatch. Raw native legal/translation ASTs remain separate from canonical Markdown serialization. Foreign equal-JSON/different-byte edits revoke claims and block regeneration. Existing helper callers retain their prior behavior.

## Shared motion

See [MOTION](MOTION.md) for opt-in project settings, generated tokens, renderer markers, reduced-motion/no-JavaScript fallback and the transient local showcase control. The local example enables motion; omitted settings stay disabled.

## Newsletter and visitor preferences

See [newsletter authoring and delivery boundaries](NEWSLETTER.md) for the opt-in newsletter modal, compact footer signup, localized visual editors, shared browser suppression and preferences. The default enquiries project remains unchanged. Hosted protection and actual sending require separately configured integrations.
