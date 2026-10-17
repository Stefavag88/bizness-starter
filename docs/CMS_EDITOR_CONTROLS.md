# Current CMS editor controls

Use pnpm dev:cms and open /cms/index.html on the configured public origin. Defaults are site 4330, Worker 8790, native query localhost:4010 and datalayer 9010. All existing overrides apply. Stop the owned launcher before isolated cms:local-build or test:profiles. The isolated local build uses supported --skip-indexing; full dev indexing/query/UI saves are verified separately.

The current controls, creation workflow, native picker limitation, immutable identity, atomic section removal, translated navigation correction, flat paths and AST behavior are documented in [Composition authoring](COMPOSITION_AUTHORING.md). [Content contracts](CONTENT_MODEL.md) distinguish wire lists from internal maps. Settings own identity/contact/navigation; Pages own copy and shared sections. No generated field names derive from page/section/navigation IDs.

Bodies and legal notice allow H2/H3, emphasis, safe links, lists and quotes; descriptions allow inline emphasis and links. No images, HTML, embeds, code or media tools are exposed. New native rich defaults are fresh ASTs, including blank fields. Detached installed serialization validates content limits, safe Markdown and regional locale aliases; original values/ASTs and thrown errors are preserved.

The complete current paginated native catalog validates identities, routes, relationships, publication and campaign references. Save validation is independent of UI affordances. Rename/Delete/folders remain restricted as documented; Contact form and hero/privacy required regions stay protected.

Pinned runtime remains tinacms 3.14.3, CLI 4.0.1, app override 2.5.14 and mdx 2.3.0. No package upgrades were introduced. E2E_CMS_URL explicitly opts into actual native UI saves; CMS_QUERY_URL opts into read-only query/guard tests. Unavailable explicitly enabled CMS fails visibly. Complete request/schema/serializer ownership guards exact-byte restoration; avoid concurrent editing.

Historical Foundation native saves remain in its evidence. Composition Task 4 proves five native composition saves plus rejection coverage; Task 5 proves eight navigation/publication saves. Current acceptance broadens public/profiles/build coverage without claiming hosted or complete accessibility compliance. Composition B/C and stages 3/4 remain deferred.
