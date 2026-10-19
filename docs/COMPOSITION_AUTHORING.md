# Composition A, B and C authoring

This local branch implements Composition A, B and C on the neutral Foundation. It uses project schemaVersion 2 and one persisted JSON format. It does not enable sending, hosted providers, deployment or release tagging. Composition C adds optional Rooms and registered domains; stages 3/4 remain deferred. Read [Rooms authoring](ROOMS_AUTHORING.md) and [developer extensions](DOMAIN_EXTENSIONS.md). Whole-branch review approved candidate `7a12969`; local closeout is complete; [C evidence](superpowers/plans/2026-10-18-starter-v2-composition-c-evidence.md) records accepted task scopes.

## Create a Standard page

1. Start pnpm dev:cms and enter local edit mode at /cms/index.html.
2. Open Pages, Create New and select Standard. The installed native template picker is collection-wide: other templates remain visible, but their creation is rejected before persistence.
3. Choose a unique flat filename, contentId and slug. Filenames accept ASCII letters, digits, underscores and hyphens, followed by .json. The native create request alone may use one leading slash; folders, nested paths, traversal and filesystem paths are rejected.
4. Fill the required default-language title, hero and metadata. Save the draft, reload, then inspect it. Creation does not publish, create navigation or invent translations.
5. Explicitly initialize each desired locale, enter its required hero and metadata, and complete any chosen optional copy. A locale can be initialized before the first save, but supplied translations must be complete drafts. Publish each locale deliberately when ready. Public alternatives expose only independently published available locales.

If Save rejects incomplete Page metadata or locale copy, close the native error dialog and open the same metadata/copy editors to correct it. Page object navigation stays available after rejection, including nested locale and link fields. Current unsaved text and rich-text ASTs remain in the same form; resubmit after completing the required fields.

After the first save, filename, contentId, slug and page template are immutable. Existing section IDs and their types are immutable too. The save hook checks current catalog records independently of the controls. Catalog freshness and file ownership checks are best effort; they are not filesystem locks or atomic multi-editor transactions.

## Compose sections

The default-language shared section list owns order, visibility, type, registered variant and neutral surface. Use Add section to select rich text, offerings, people, articles (when enabled) CTA, FAQ, process steps, media/text or gallery. New optional instances start hidden with a fresh UUID-based ID. Hero cannot be added, moved, hidden or removed. The required privacy_details body remains enabled and protected; Contact's required form is outside optional composition.

Enter copy, enable the section when ready, and move optional instances with the labelled up/down buttons using the keyboard or pointer. Repeated types are supported. IDs are page-local, so different pages may reuse an ID with different types. No ID becomes a generated native field name.

Use the explicit locale-copy action for an existing shared instance. Missing optional translated copy omits that instance in that locale; no default-language fallback is published. Shared visibility retains all copy. Remove section asks for confirmation and removes the reference plus every locale's copy in one editor batch; cancel changes nothing. Retained rich ASTs are preserved by identity during structural edits.

The ten registered static section renderers share the existing theme tokens. Existing six types keep default-only variants; FAQ supports default/expanded, steps default/cards, media/text default/reversed and gallery default/featured.

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

The public composition fixture is separately Node-owned and is not native-creation evidence. Its initial source must be absent and its first write is exclusive; subsequent updates and restoration retain complete-record ownership guards. Opt in with E2E_COMPOSITION_FIXTURE=1 only against this checkout's development stack. Screenshots and representative axe scans are acceptance evidence, not accessibility certification.

Development freshness note: directly adding an already-published JSON file outside the native editor may leave the dev route cache stale. The current change-driven Vite refresh does not handle add-only events. Restart the owned launcher or perform a subsequent deliberate owned content edit. Native creation starts as a draft and explicit publication is an update; that sequence is separately proven. This limitation remains unresolved.


## Author FAQ, steps and content images

1. In the default-language shared section editor, add a section; it starts hidden. Choose its registered variant and surface.
2. For FAQ, steps or gallery, add items, then complete their default-language question/answer, title/body or image/alt/caption. Use the labelled item move buttons for shared order. Item IDs are generated once and are read-only; repeated IDs in another section remain separate identities.
3. Explicitly initialize each desired section translation. Enter every item by its fixed shared ID. Locale list order never changes public shared order. Omit an optional section translation entirely to omit that whole public section; there is no per-item/default-language fallback.
4. For media/text or a gallery item, open the actual native image picker, select an original PNG/JPEG/WebP under uploads and choose center/top/bottom crop. The two labelled abstract starter samples are reusable neutral illustrations, not client photographs. Enter nonempty alt in every supplied translation; captions may be blank. Media/text also owns body and optional CTA independently of its image.
5. Complete the section, enable it, save and reload. Inspect both public locales. Invalid nested answers or missing translated alt block Save before mutations. Dismiss the actionable alert, reopen the same item/localized editors, correct the field and resubmit; current unrelated prose and rich ASTs remain in memory.
6. To make media/text text-only, use the picker's clear button. Installed native blank/null states are normalized by the shared control operation: shared source and all localized image text are removed, body/CTA retained. Save/reload to verify. Removing gallery items or references also retains physical files. Cancel removal leaves the draft unchanged.

A selected missing, unsafe or broken source fails public rendering with an actionable error. Re-select a valid upload or clear optional media; do not use an arbitrary external URL or silently delete the erroring copy. See [source and metadata limits](CONTENT_MODEL.md#composition-b-nested-and-media-contracts). Original files are served directly, without optimized derivatives; choose small uploads rather than treating the safety bounds as a loading budget.

Run the separate Node-owned public matrix with E2E_COMPOSITION_B_FIXTURE=1 and pnpm exec playwright test e2e/composition-b-content.spec.ts against this checkout's owned indexed dev:cms stack. It creates an initially absent page exclusively, compares complete expected documents before updates, preserves unknown bytes on conflicts and removes only owned fixtures. Binary sources use caller-known buffers, exclusive creation and permanent ownership revocation. This is public seed/render/watch proof, not native creation/upload proof. Task 4's actual UI save evidence remains separate.

## Native Rooms proof and recovery

Rooms is enabled by a developer with `modules.rooms: true`; the starter default remains disabled. In the Room collection, use **Add File** to create a flat draft. Set a unique filename, contentId and slug before the first Save. Saved contentId and slug are read-only; native Delete and folder creation are disabled. Unpublish a saved Room to remove its public presentation.

Room image, amenity and translated copy controls render directly in the form. Use the installed image picker under **Add Room image**, **Add amenity**, and the stable item ID move/remove controls. Structure belongs to the default language. Initializing Ελληνικά Room translation deliberately supplies blank localized copy; complete every image alt and amenity label. Adding later items requires explicit **Initialize copy** for that locale. A rejected save leaves these same-state controls reachable, so correct the fields and retry. Cancel in the item removal confirmation preserves the draft and sends no mutation. Removing a reference removes only its matching localized copy and preserves the physical upload.

The index must be saved as the declared `rooms.json` Page with template/contentId `rooms`. Optional room-list sections need explicit translated copy initialization. Their blank translated empty message is an editing state and must be completed before Save. A Room appears publicly in a locale only when both the Room and its index are published in that locale.

`e2e/composition-c-cms.spec.ts` opts into an already indexed, owned Rooms-enabled stack with `E2E_CMS_URL`. It uses actual UI actions, captures the generated schema, and intercepts each native request before dispatch to derive the expected record using the installed serializer. It claims only the complete matching saved record, restores documents before owned image deletion, and retains backups on conflicts. The installed optional datetime control may initialize a current editing value on mount, so reload proof checks saved values and exact unchanged disk bytes instead of relying on a disabled Save button.
