# Foundation CMS controls

Run pnpm dev:cms, then open http://127.0.0.1:4330/cms/index.html. SITE_PORT, WORKER_PORT, TINA_PORT and TINA_DATALAYER_PORT override the isolated default ports 4330/8790/4010/9010. The launcher checks every selected port and stops only its owned process tree. Run pnpm cms:local-build with the watcher stopped to create native schema/types and the local static CMS. Local builds use --local --skip-cloud-checks and require no cloud credentials. No deployment or real sending occurs.

## Collections and ownership

Settings is the content/settings/site.json singleton. Its shared brand name, business identity, contact destinations, privacy consent version and navigation destinations are excluded from translations. Translated navigation labels are keyed by page ID. Project infrastructure, secrets, profile and language configuration are never editor fields.

Pages uses native templates home/about/contact/standard/offerings/insights; insights disappears when articles are disabled. Page creation/deletion, identity and slug editing are disabled during Foundation. A fixed custom section control exposes existing optional visibility and neutral appearance surfaces without add/remove/reorder operations. Hero visibility is locked. Native beforeSubmit also validates unchanged section IDs/order/types/variants and the canonical hero requirement. Contact owns its form through its page template, with no optional form toggle. The persisted schema supports arbitrary registered pages; stage 2 owns safe creation and section authoring.

Copy and translations remain maps keyed by section ID, with readable labels showing ID/type. scripts/cms-descriptor.mjs reads validated content in Node and generates only public editor configuration and structural metadata (page identity, section references, dormant article-index filenames and navigation IDs) in ignored .generated/cms.json. No editorial copy or hardcoded page filename whitelist is duplicated. configure.mjs explicitly generates the descriptor; test/check/build and CMS launch/build explicitly run configure without relying on package lifecycle hooks. After structural changes outside the Foundation editor, restart the CMS to regenerate its descriptor. Article-index files are excluded by discovered template metadata when articles are disabled; no fixed page filename list is hardcoded. The actual native newsletter/articles-disabled build verifies this and campaign output together. Section IDs reused inside one page template must have a consistent section type so their native map field has a single schema.

Offerings, people and optionally articles expose canonical shared identity/routes and localized copy/publication. Campaign draft copy appears only in newsletter/nurture and never sends. Campaign schemas and catalog validation are described in CONTENT_MODEL.md.

## Rich text and save validation

Bodies and legal notice offer H2/H3, emphasis, links, lists and quotes. Descriptions offer inline emphasis/links; headings, images, HTML, embeds and code are unavailable. Validation rejects unsupported AST nodes/marks, unsafe destinations and oversized serialized Markdown. Native @tinacms/mdx serializes a detached validated AST before applying the same persisted schemas and character limits. Null/blank optional SEO normalizes on the detached projection. The exact original values object is returned to Tina; ASTs and native values are never replaced or mutated.

Regional native field/serialized keys use pt_BR while canonical snapshots use pt-BR. Both save and loader projections normalize losslessly and reject duplicate aliases. No legacy schema conversion is supported.

The save hook queries current native GraphQL catalogs with Document fragments and pagination, replaces the edited record by collection-relative path (or appends a new candidate), then runs the same pure catalog validation as the loader. Duplicate IDs, reserved/colliding routes, missing relationships, invalid publication and campaign references cannot pass the hook and break the next content build. Known native root _collection and non-page _template==_collection metadata are removed only from the detached validation projection; page template discriminators remain content.

## Dependencies and evidence

The pinned runtime is tinacms 3.14.3 with @tinacms/cli 4.0.1 and a targeted @tinacms/app 2.5.14 override. App 2.5.15 requires tinacms ^3.14.4 and imports showErrorModal missing from 3.14.3; 2.5.14 declares ^3.14.0 and passes the actual local build. @tinacms/mdx 2.3.0 is the editor runtime serializer, declared directly for validation. No unrelated runtime upgrade or native dependency build is needed.

Run pnpm test and pnpm check for normal checks. tests/cms-native-query.test.ts is opt-in via CMS_QUERY_URL=http://localhost:4010/graphql; it exercises actual native ASTs and save guards without writing content. Normal tests report it skipped when no native server is requested. Task 5 owns the actual native UI save/reload/public-output/restoration proof. A passing local CMS build/start and read-only GraphQL guard probe does not claim that end-to-end roundtrip.
