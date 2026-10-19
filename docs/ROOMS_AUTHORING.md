# Rooms authoring

Rooms market room types rather than physical inventory. They provide no reservations, availability, price or payment functions.

A developer enables `modules.rooms` in `project.json` (default false). Stop the exact owned launcher first, run `pnpm configure` after editing, then restart `pnpm dev:cms` so the collection and indexing agree. Ordinary valid copy saves use the watcher; static output needs a new build. The existing profile and articles flags remain independent. Enabling does not alter Home, navigation, design or publication. Disabled Rooms and their owned `content/pages/rooms.json` index are excluded before parsing; their bytes remain dormant.

## Drafts and identity

Use the native Room collection to create a draft. Choose a unique flat filename, contentId and shared slug. Existing saved identity is read-only and save-validated. Native Delete and folders are disabled; unpublish to remove public output. The index filename/template/contentId must remain `rooms.json`/`rooms`/`rooms`. The supplied English/Greek index is draft in both locales and there are no sample Room records.

## Structure and localized copy

The default locale owns maximum guests (integer 1–100), ordered images (0–20), amenities (0–40), source uploads and crop. Add/remove/reorder uses stable IDs matching `[a-z][a-z0-9_]{0,79}`. Do not manually rename IDs. Removal prunes copy in every supplied locale without deleting upload files; reordering preserves copy associations.

Select original local PNG/JPEG/WebP files under `/uploads/`. Every referenced source must exist and pass the existing source adapter limits: 20 MiB, 20,000 pixels per side and 40 million pixels. These are metadata safety bounds, not a performance budget or exhaustive payload verification. Original files have no optimized derivatives/srcsets; choose small uploads. A Room can have no images. The first shared image becomes its listing thumbnail. Crop is center/top/bottom; rendering retains original dimensions, lazy loading and existing fixed classes.

Titles, image alt text, bed descriptions and amenity labels are bounded to 200 characters. Bed description can be empty. Inline descriptions/captions use safe inline Markdown (10,000 characters); body uses safe Markdown with H2/H3 (100,000); SEO text is at most 300. Do not introduce another H1 or unsafe links/HTML.

Initialize each translation explicitly. It starts draft with blank localized fields, never copied default-language text. Images/amenities retain shared IDs and each supplied locale must contain exactly their membership, with nonempty alt text and labels. Adding a shared item leaves existing translated copy untouched and exposes an Initialize copy control; complete it before saving. Translate title, description, body, SEO, beds, image alt/captions and amenity labels; shared source/order/guest count remain default-locale controls.

Nested copy controls render native fields directly so corrections remain reachable after rejected saves. Structure operations preserve unrelated native rich-text object identity. Validation returns original native values after detached checking.

## Publication

Publish the Rooms index and each Room independently for each locale. A Room appears only when both are published at the same captured publication clock. Scheduled or missing translations omit the Room and locale alternative; no language or item fallback is used. An empty published index displays its localized room-list emptyMessage. The index shared slug owns `/LOCALE/INDEX_SLUG/ROOM_SLUG`.

The detail CTA targets the existing localized contact page with `contextId`. The localized form uses public Room/Offering choices; the Worker accepts the deduplicated configured-locale union through manifest.enquiryContexts. Unknown, draft and disabled IDs reject; no new D1 schema or booking flow exists. Accepted Task 4 native recovery, Task 5 local capture-only Worker and Task 6 public/build evidence are [recorded separately](superpowers/plans/2026-10-18-starter-v2-composition-c-evidence.md). Final whole-branch review remains pending; this module does not enable real sending.

## Developer registrations

Content definition/types live in `packages/domains/rooms`; register them in content domain-registry and module-extensions, native factory in `tina/domains/index.ts`, room-list native copy fields in `tina/fields/section-copy.ts`, Astro detail in `templates/domains/index.ts` and list in `templates/sections.ts`. No domain switch belongs in loader/localizer/catalog/route/save algorithms. Browser-safe schemas import LIMITS directly from content/limits and safety helpers from rich-text, avoiding schema/registry cycles. Native schema field names remain static under record and item changes.

See [the extension recipe](DOMAIN_EXTENSIONS.md) for exact typed registrations and test-only second-domain proof. Room contentId uses lowercase hyphenated scalar IDs; Page and nested item field IDs use their own underscore-safe contracts. Do not copy Room ID syntax into a Page fixture. Unpublishing preserves the immutable saved URL identity; renames/redirect generation are outside this increment.
