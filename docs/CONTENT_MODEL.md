# Canonical content contracts

Composition A uses schemaVersion 2 with one persisted representation: JSON records with Markdown strings. Page copy is stored in typed lists and translated navigation in label lists; detached normalization supplies the internal ID maps described below. No paragraph-array loader or conversion path exists. packages/content/schemas.mjs and packages/content/index.ts are browser-safe. Filesystem consumers import readContent explicitly from packages/content/read.mjs; Tina must never import that module.

## Reading and projecting

readContent(projectRoot, project, { now?: Date }) reads projectRoot/content, validates strict records, relationships, required system pages and every configured locale's route map, and returns a detached ContentSnapshot. Its now field is an ISO string captured once. Missing editorial directories are empty collections. When articles are disabled, content/articles and the canonical dormant content/pages/insights.json are never read; article records, the index, article-list sections, index navigation and feedPath disappear.

localizeContent(snapshot, locale, project) returns a detached LocalizedContent. Every localized record uses its own publication status and schedule. A translated record never inherits a default-language publication schedule. No copy fallback exposes missing or draft editorial translations. Missing published translations for required system pages or settings fail validation. Required pages are exactly one Home, Contact and Offering index; one Article index when enabled; and the Standard record with contentId: privacy, slug: privacy. Contact uses slug contact; only Home has an empty slug. Other pages remain generic registered templates.

publicRoutes(localized) returns Route[], where each route is { kind: 'page' | 'offering' | 'person' | 'article', contentId, locale, path, alternates: [{ locale, path }] }. Canonical paths have no trailing slash: /en, /en/services/planning-session, /en/people/studio-guide, /en/insights/a-useful-first-question. Offering/article detail prefixes use their shared index slugs; people use people. Alternatives include the current locale and only published available translations, including relationship eligibility. feedPath is /en/feed.xml when articles are enabled and null otherwise; feed implementation belongs to Task 4. Route collisions fail across pages and all detail kinds. System/API/admin/design-system/newsletter and configured locale prefixes are reserved.

## Pages and sections

A Page owns { contentId, _template, slug, status, publishAt?, meta, sections, copy, translations }. meta is { title, seoDescription }; null, blank or absent optional SEO becomes ''. Shared sections are ordered references { id, _template, variant, enabled, appearance: { surface } }. Persisted enabled may be omitted and defaults to true. Surfaces are default, muted, and accent; no arbitrary class, color or component path is accepted.

Templates are home, about, contact, standard, offerings, and insights. Every template requires exactly one enabled hero, which the renderer must use for the page's single H1. There is no reserved hero instance ID: the seed uses intro. Contact's form is a template capability outside the optional section list. Composition A exposes optional section add/reorder/remove and Standard draft creation while preserving required regions and immutable saved identity.

Default copy.sections[id] is required for every structural reference, including hidden sections. Translations are { status, publishAt?, meta, copy: { sections: { [id]: copy } } } and cannot override section structure, appearance, IDs or slug. The translated hero is required. Any optional section absent from translated copy is omitted from that locale, without default-language fallback. Stale translated IDs, duplicate structural IDs, unknown keys, types and variants fail. Shared reorder preserves associations by ID.

| Section type | Copy |
| --- | --- |
| hero | { title, description, link?: { label, href } } |
| rich-text | { title, body } |
| offering-list | { title, description } |
| people-list | { title, description } |
| article-list | { title, description } |
| cta | { title, description, link: { label, href } } |
| faq | { title, description, items: [{ id, question, answer }] } |
| steps | { title, description, items: [{ id, title, body }] } |
| media-text | { title, body, image?: { alt, caption? }, link? } |
| gallery | { title, description, items: [{ id, alt, caption? }] } |

Localized pages remove translations and the separate copy container. Their sections are visible ordered references with a typed copy attached to each reference, plus the record's path and alternates. The discriminated LocalizedSection union supports renderer narrowing by _template.

## Editorial and settings ownership

Offerings and people own { contentId, slug, status, publishAt?, title, description, body, seoDescription, translations }. People additionally own localized role. Article authorId and offeringId are shared optional IDs. Native null/blank relationship values normalize to absent; supplied IDs must resolve even on drafts. A related unpublished or missing-locale person/offering prevents article publication in that locale.

Articles require publishAt in the base and every supplied translation. It is both the publication schedule and human-visible/feed publication timestamp. updatedAt is optional per locale and cannot precede that locale's publishAt. ISO timestamps accept offsets and are compared as instants with Date.parse. Public article dates and feeds use these explicit timestamps rather than build time.

Settings own shared identity, contact destinations and navigation structure:

- brand: { name, tagline }
- legal: { businessName, privacyVersion, notice }
- contact: { email, phone, address }
- ordered navigation: [{ pageId, label }]

Settings translations contain exactly { brand: { tagline }, legal: { notice }, contact: { address }, navigation: { [pageId]: label } }. Every shared navigation ID requires a translated label; stale label IDs fail. Translations cannot override brand name, business identity, consent version, email/phone or navigation order/relationships. legal.privacyVersion is shared, nonempty and at most 80 characters; the seed value sample-v1 supplies consent provenance, with review flags still false. Page hero/About copy never belongs in settings.

Canonical locale keys use hyphens, for example en-US. Tina native field names encode regional locales with underscores (for example pt_BR), and Tina serializes that native key to JSON. readContent and native save validation normalize those keys to canonical pt-BR only on detached projections. Duplicate canonical/encoded aliases, unconfigured locales and default-language translation entries fail. The original editor values and ASTs remain unchanged. This is native integration, not a legacy content adapter.

## Text and safe rendering

Exported LIMITS are title 200, SEO 300, Markdown summary 10,000, and Markdown body 100,000 characters. renderRichText escapes raw HTML, downgrades H1 to H2 and disables Markdown images. renderInlineRichText(body, { links: false }) retains emphasis while removing anchors for whole-card links. plainText(body, limit?) extracts text and truncates by Unicode code point without splitting surrogate pairs.

isSafeLink is shared with native link validation. HTTP(S), mailto, tel, internal relative paths, fragments and queries are supported. Unsafe schemes, controls, protocol-relative links, backslashes, encoded bypasses and credentialed HTTP URLs are rejected. Encoded spaces in paths/queries remain supported. Rich-text controls must not expose image/embed tools; Composition B media uses explicit shared source references with localized alt/caption. Stage 3 optimized media remains deferred. Safe rendering does not parse or mutate Tina ASTs.

## Exports

Runtime schemas: pageSchema, offeringSchema, personSchema, articleSchema, settingsSchema, sectionSchema, sectionCopySchemas, metaSchema, linkSchema, plus PAGE_TEMPLATES, SECTION_TYPES, SURFACES, LIMITS. Rendering: isSafeLink, renderRichText, renderInlineRichText, plainText. Projection/routes: localizeContent, publicRoutes. Filesystem-only: readContent.

Shared declarations live in packages/content/types.ts, re-exported through schemas/barrel declarations. The small supporting publication.mjs isolates pure publication/URL helpers from the filesystem boundary; it is not a public collection registry. The modular CMS uses these pure contracts; filesystem loading remains outside its browser bundle. The public site and backend manifest consume these contracts; see ARCHITECTURE.md.


## Draft campaign copy

ContentSnapshot additionally contains campaigns: Campaign[], loaded from the optional content/campaigns folder only for newsletter/nurture; enquiries ignores that folder and returns an empty array. Campaign is { contentId, subject, intro, articleId?, interest }. Subject is nonempty, at most 150 characters and cannot contain CR/LF; intro is plain text at most 2,000 characters; articleId blank/null normalizes to absent. Supplied articleId must identify a currently published default-locale article and interest must match project.interests. IDs are globally unique with other content records. Campaigns have no public route, translation/fallback, publication lifecycle or send operation. LocalizedContent does not expose them.

Schemas additionally export campaignSchema. catalog.mjs holds the browser-safe cross-record validator shared by readContent and CMS save validation. The canonical rich fields additionally reject raw HTML, images, unsupported Markdown nodes, unsafe link destinations and headings other than H2/H3 at validation; descriptions allow inline emphasis/links without headings. The renderer remains defensive when called directly with unvalidated strings.

## Native authoring and Foundation boundary

Native UI roundtrips verify bilingual offering description/body Markdown, cleared optional SEO, editor reload and public output. A Pages save verifies optional visibility and protected hero controls. Native JSON serializes rich text through the installed CLI serializer; datetime mutation values follow the installed backend Date/ISO behavior. The test ownership helper uses the active generated schema and request inputs, never newly saved disk bytes as its expected model. Exact original bytes are restored only after complete-record ownership validation. See QUICKSTART.md for opt-in commands and conflicts.

The registry includes ten section types: hero, rich-text, offering-list, people-list, article-list, CTA, FAQ, steps, media-text and gallery. Composition A supports Standard draft creation and optional composition/navigation authoring; Composition B adds nested copy and original local images. Composition C defers Rooms; stage 3 defers optimized media/social/motion/visitor controls and hosted-provider verification; stage 4 defers presets, safe initialization and releases. See COMPOSITION_AUTHORING.md for current editor limits.

## Flat collections and protected relationship targets

Foundation documents live directly in their collection folders. Native folder and nested-folder creation are explicitly disabled on every collection, including protected Pages, and nested native save paths fail before data-layer queries or persistence. The filesystem loader rejects subfolders in active collections with an actionable path; it does not recursively publish documents. Dormant disabled articles and inactive campaign folders remain unread.

Offerings, People and Articles are protected from native Delete because canonical `offeringId`, `authorId` and campaign `articleId` remain stable scalar IDs. Native Delete bypasses `beforeSubmit`; the save catalog guard alone cannot protect references. Loader/catalog dangling-ID rejection remains mandatory. Stage 2 must provide relationship-aware authoring/deletion before enabling these deletes. No full CRUD engine or path-based relationship conversion is part of Foundation.

Published editorial slug changes require explicit redirects from previous published URLs before hosted release. This remains a mandatory stage 2 authoring and release-gate obligation; Foundation has no redirects subsystem. `404` is reserved alongside the other system prefixes. Settings `legal.notice` renders as localized safe rich-text blocks outside the business-name paragraph in both locales, using the same renderer/link localization as editorial bodies.

## Composition A wire boundary

The Page and Settings map shapes above are internal projections. Canonical PageDocument stores copy.sections as typed entries { id, _template, ...copy } in the default and supplied translations. Canonical SettingsDocument stores each translated navigation as [{ pageId, label }]. Duplicate/stale/mismatched IDs and old map-shaped disk content are rejected. Shared list order owns structure; copy/translated-label list order does not. New section IDs are page-local UUID-based values. The generated descriptor contains project/module metadata and article-index exclusions only, without page structure or navigation IDs. New valid IDs require no schema regeneration.

Creation is limited to Standard drafts with unique flat filenames, IDs and potential routes; explicitly supplied complete draft translations are permitted. Saved filename/template/contentId/slug and retained section ID/type pairs are immutable. UI restrictions and current-catalog native validation enforce these policies independently. Structural operations preserve opaque existing native ASTs; only detached complete serialization is parsed on save.


## Composition B nested and media contracts

Existing six types retain default-only variants. FAQ adds expanded; steps adds cards; media-text adds reversed; gallery adds featured. Shared FAQ/steps references own ordered items: [{ id }]; gallery items own [{ id, media: { src, crop } }]. Media/text owns optional media: { src, crop }. Crop is center, top or bottom. Default-language structure controls order, variants, visibility, sources and crops. Supplied locale item arrays are associated by stable ID within their section, never by list position or across section boundaries. Missing whole optional translated sections are omitted; supplied item sets must be complete, even while hidden. An enabled list section must have at least one item. IDs use lowercase field IDs and generated item_ UUID hex; retained identities cannot be edited.

Every supplied image translation requires nonempty alt text, maximum 200 characters; captions are optional safe inline Markdown, maximum 10,000. FAQ answers and step/media bodies require meaningful safe body Markdown, maximum 100,000. Clear optional media through the native control: the operation removes shared media and every locale's image text while preserving body and CTA. Physical uploads are retained. Unreferenced media/text renders as text-only. A referenced missing/broken source fails visibly with page/section/item context instead of silently omitting the image.

Sources are original PNG, JPEG or WebP under /uploads/, resolved to apps/site/public/uploads by the server-only packages/media/source.mjs adapter. Queries, fragments, remote URLs, encoded dots/separators, traversal, double decoding, generated/section-images destinations and symlink escapes are rejected. Bounds are 20 MiB, 20,000 pixels per side and 40 million pixels; format must match extension. Metadata reads headers, not an exhaustive compressed-payload decode. EXIF orientation swaps intrinsic dimensions when necessary. Each read hashes actual bytes; the bounded 128-entry metadata cache uses hash and format, so same-path replacement cannot retain stale dimensions. No decoder or filesystem code enters the CMS/browser bundle.

Images emit intrinsic width/height, lazy loading and fixed 3:2 media/text or 4:3 gallery frames with object-fit cover and fixed crop classes. These are original files with no derivative/srcset pipeline: upload appropriately small files. Header bounds are safety limits, not performance targets. Stage 3 owns optimized derivatives and further performance work. No schemaVersion change, JSON migration, remote media service or business-photo import is included.
