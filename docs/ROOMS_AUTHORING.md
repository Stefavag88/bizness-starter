# Rooms authoring

Rooms market room types rather than physical inventory. They provide no reservations, availability, price or payment functions.

A developer enables `modules.rooms` in `project.json` (default false). The existing profile and articles flags remain independent. Enabling does not alter Home, navigation, design or publication. Disabled Rooms and their owned `content/pages/rooms.json` index are excluded before parsing; their bytes remain dormant.

## Drafts and identity

Use the native Room collection to create a draft. Choose a unique flat filename, contentId and shared slug. Existing saved identity is read-only and save-validated. Native Delete and folders are disabled; unpublish to remove public output. The index filename/template/contentId must remain `rooms.json`/`rooms`/`rooms`. The supplied English/Greek index is draft in both locales and there are no sample Room records.

## Structure and localized copy

The default locale owns maximum guests (integer 1–100), ordered images (0–20), amenities (0–40), source uploads and crop. Add/remove/reorder uses stable lowercase IDs up to 80 characters. Do not manually rename IDs. Removal prunes copy in every supplied locale without deleting upload files; reordering preserves copy associations.

Select original local PNG/JPEG/WebP files under `/uploads/`. Every referenced source must exist and pass the existing source adapter limits. A Room can have no images. The first shared image becomes its listing thumbnail. Crop is center/top/bottom; rendering retains original dimensions, lazy loading and existing fixed classes.

Titles, image alt text, bed descriptions and amenity labels are bounded to 200 characters. Bed description can be empty. Inline descriptions/captions use safe inline Markdown (10,000 characters); body uses safe Markdown with H2/H3 (100,000); SEO text is at most 300. Do not introduce another H1 or unsafe links/HTML.

Initialize each translation explicitly. It starts draft with blank localized fields, never copied default-language text. Images/amenities retain shared IDs and each supplied locale must contain exactly their membership, with nonempty alt text and labels. Adding a shared item leaves existing translated copy untouched and exposes an Initialize copy control; complete it before saving. Translate title, description, body, SEO, beds, image alt/captions and amenity labels; shared source/order/guest count remain default-locale controls.

Nested copy controls render native fields directly so corrections remain reachable after rejected saves. Structure operations preserve unrelated native rich-text object identity. Validation returns original native values after detached checking.

## Publication

Publish the Rooms index and each Room independently for each locale. A Room appears only when both are published at the same captured publication clock. Scheduled or missing translations omit the Room and locale alternative; no language or item fallback is used. An empty published index displays its localized room-list emptyMessage. The index shared slug owns `/LOCALE/INDEX_SLUG/ROOM_SLUG`.

The detail CTA targets the existing localized contact page with `contextId`. Generic enquiry acceptance and actual Tina browser/rejected-save recovery proof are subsequent integration gates; this module does not enable real sending.

## Developer registrations

Content definition/types live in `packages/domains/rooms`; register them in content domain-registry and module-extensions, native factory in `tina/domains/index.ts`, room-list native copy fields in `tina/fields/section-copy.ts`, Astro detail in `templates/domains/index.ts` and list in `templates/sections.ts`. No domain switch belongs in loader/localizer/catalog/route/save algorithms. Browser-safe schemas import LIMITS directly from content/limits and safety helpers from rich-text, avoiding schema/registry cycles. Native schema field names remain static under record and item changes.
