# Composition A authoring

This local branch implements Composition A on the neutral Foundation. It uses project schemaVersion 2 and one persisted JSON format. It does not enable sending, hosted providers, deployment or release tagging. Composition B/C and stages 3/4 remain deferred.

## Create a Standard page

1. Start pnpm dev:cms and enter local edit mode at /cms/index.html.
2. Open Pages, Create New and select Standard. The installed native template picker is collection-wide: other templates remain visible, but their creation is rejected before persistence.
3. Choose a unique flat filename, contentId and slug. Filenames accept ASCII letters, digits, underscores and hyphens, followed by .json. The native create request alone may use one leading slash; folders, nested paths, traversal and filesystem paths are rejected.
4. Fill the required default-language title, hero and metadata. Save the draft, reload, then inspect it. Creation does not publish, create navigation or invent translations.
5. Explicitly initialize each desired locale, enter its required hero and metadata, and complete any chosen optional copy. A locale can be initialized before the first save, but supplied translations must be complete drafts. Publish each locale deliberately when ready. Public alternatives expose only independently published available locales.

After the first save, filename, contentId, slug and page template are immutable. Existing section IDs and their types are immutable too. The save hook checks current catalog records independently of the controls. Catalog freshness and file ownership checks are best effort; they are not filesystem locks or atomic multi-editor transactions.

## Compose sections

The default-language shared section list owns order, visibility, type, default variant and neutral surface. Use Add section to select rich text, offerings, people, articles (when enabled) or CTA. New optional instances start hidden with a fresh UUID-based ID. Hero cannot be added, moved, hidden or removed. The required privacy_details body remains enabled and protected; Contact's required form is outside optional composition.

Enter copy, enable the section when ready, and move optional instances with the labelled up/down buttons using the keyboard or pointer. Repeated types are supported. IDs are page-local, so different pages may reuse an ID with different types. No ID becomes a generated native field name.

Use the explicit locale-copy action for an existing shared instance. Missing optional translated copy omits that instance in that locale; no default-language fallback is published. Shared visibility retains all copy. Remove section asks for confirmation and removes the reference plus every locale's copy in one editor batch; cancel changes nothing. Retained rich ASTs are preserved by identity during structural edits.

Only the six existing static section renderers and default variants are included. This work adds no photos, media library, new styling system or section library from Composition B/C.

## Navigation

Save a Page first. Open Settings and use the shared navigation destination chooser, refreshing it if necessary. It lists saved Pages, including drafts; the complete current save catalog is still authoritative. Supply the default label and every configured translated label explicitly. Add starts new translated labels empty. Blank required labels block Save.

Shared navigation owns order and membership. The shared control shows direct locale label fields for correcting a failed save: the installed editor can block nested navigation while its form is invalid. Correct the missing label there, save, then continue using the fixed locale editors. Both views edit the same form values. Locale editors expose labels only and resolve entries by page ID, independent of storage order.

Move and remove links with the shared controls. Removing a navigation link does not delete a Page. Public navigation filters destinations independently by locale publication and never substitutes another locale's label or content. Creating or publishing a Page never inserts a link automatically.

## Disk and native contracts

PageDocument.copy.sections and each translation's copy.sections are typed lists of { id, _template, ...copy }. SettingsDocument.translations[locale].navigation is a list of { pageId, label }; shared navigation is also ordered. Strict decoding projects these lists into detached internal ID maps for Page/Settings consumers. There is no old-map disk reader or second wire format. Shared section references use canonical scalar types such as rich-text; native typed-copy discriminators use installed GraphQL aliases such as rich_text, which the installed serializer maps back to canonical disk types.

Native regional locale names may use underscores; detached validation/loading normalizes them to configured hyphenated locales and rejects duplicate aliases. Rich editors use native root/paragraph/text AST defaults for new fields, including blanks. The save hook serializes a detached projection through the installed serializer and returns the original values and ASTs unchanged. It preserves original thrown errors/objects after showing actionable alerts. No automated translation or publication exists.

Settings creation/deletion, Page deletion/rename, folder creation and relationship-target deletion remain disabled. Offerings, People and Articles retain stable IDs; native Delete bypasses beforeSubmit and remains unsafe without relationship-aware deletion. Changed published editorial slugs require explicit redirects before hosted release; no redirect subsystem is supplied here.

## Verification and safe restoration

Use the commands in QUICKSTART.md. Native query tests use CMS_QUERY_URL=http://localhost:4010/graphql; the public site and E2E_CMS_URL use http://127.0.0.1:4330 by default. All port overrides remain supported. An explicitly requested unavailable CMS fails visibly. Ordinary browser runs exclude the isolated probe.

Acceptance initializes evidence before any save. Native expected records come from the actual request, generated schema and installed serializer before diagnostic writes. Unique backups record initial existence and original bytes. Restore compares complete owned bytes, rejects external edits permanently, and deletes initially absent files only after proving ownership. Restore Settings before removing an owned newly created destination Page. Avoid concurrent editing; retain unknown bytes and backups for review, never blindly reset fixtures.

The public composition fixture is separately Node-owned and is not native-creation evidence. Opt in with E2E_COMPOSITION_FIXTURE=1 only against this checkout's development stack. Screenshots and representative axe scans are acceptance evidence, not accessibility certification.

Development freshness note: directly adding an already-published JSON file outside the native editor may leave the dev route cache stale. The current change-driven Vite refresh does not handle add-only events. Restart the owned launcher or perform a subsequent deliberate owned content edit. Native creation starts as a draft and explicit publication is an update; that sequence is separately proven. This limitation remains unresolved.
