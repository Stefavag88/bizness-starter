# Canonical content contracts

Foundation uses one representation: JSON records with Markdown strings. No paragraph-array loader or conversion path exists. packages/content/schemas.mjs and packages/content/index.ts are browser-safe. Filesystem consumers import readContent explicitly from packages/content/read.mjs; Tina must never import that module.

## Reading and projecting

readContent(projectRoot, project, { now?: Date }) reads projectRoot/content, validates strict records, relationships, required system pages and every configured locale's route map, and returns a detached ContentSnapshot. Its now field is an ISO string captured once. Missing editorial directories are empty collections. When articles are disabled, content/articles and the canonical dormant content/pages/insights.json are never read; article records, the index, article-list sections, index navigation and feedPath disappear.

localizeContent(snapshot, locale, project) returns a detached LocalizedContent. Every localized record uses its own publication status and schedule. A translated record never inherits a default-language publication schedule. No copy fallback exposes missing or draft editorial translations. Missing published translations for required system pages or settings fail validation. Required pages are exactly one Home, Contact and Offering index; one Article index when enabled; and the Standard record with contentId: privacy, slug: privacy. Contact uses slug contact; only Home has an empty slug. Other pages remain generic registered templates.

publicRoutes(localized) returns Route[], where each route is { kind: 'page' | 'offering' | 'person' | 'article', contentId, locale, path, alternates: [{ locale, path }] }. Canonical paths have no trailing slash: /en, /en/services/planning-session, /en/people/studio-guide, /en/insights/a-useful-first-question. Offering/article detail prefixes use their shared index slugs; people use people. Alternatives include the current locale and only published available translations, including relationship eligibility. feedPath is /en/feed.xml when articles are enabled and null otherwise; feed implementation belongs to Task 4. Route collisions fail across pages and all detail kinds. System/API/admin/design-system/newsletter and configured locale prefixes are reserved.

## Pages and sections

A Page owns { contentId, _template, slug, status, publishAt?, meta, sections, copy, translations }. meta is { title, seoDescription }; null, blank or absent optional SEO becomes ''. Shared sections are ordered references { id, _template, variant: 'default', enabled, appearance: { surface } }. Persisted enabled may be omitted and defaults to true. Surfaces are default, muted, and accent; no arbitrary class, color or component path is accepted.

Templates are home, about, contact, standard, offerings, and insights. Every template requires exactly one enabled hero, which the renderer must use for the page's single H1. There is no reserved hero instance ID: the seed uses intro. Contact's form is a template capability outside the optional section list. Foundation Tina restricts structural authoring in Task 3; the persisted contract already supports generic registered pages and repeatable optional sections.

Default copy.sections[id] is required for every structural reference, including hidden sections. Translations are { status, publishAt?, meta, copy: { sections: { [id]: copy } } } and cannot override section structure, appearance, IDs or slug. The translated hero is required. Any optional section absent from translated copy is omitted from that locale, without default-language fallback. Stale translated IDs, duplicate structural IDs, unknown keys, types and variants fail. Shared reorder preserves associations by ID.

| Section type | Copy |
| --- | --- |
| hero | { title, description, link?: { label, href } } |
| rich-text | { title, body } |
| offering-list | { title, description } |
| people-list | { title, description } |
| article-list | { title, description } |
| cta | { title, description, link: { label, href } } |

Localized pages remove translations and the separate copy container. Their sections are visible ordered references with a typed copy attached to each reference, plus the record's path and alternates. The discriminated LocalizedSection union supports renderer narrowing by _template.

## Editorial and settings ownership

Offerings and people own { contentId, slug, status, publishAt?, title, description, body, seoDescription, translations }. People additionally own localized role. Article authorId and offeringId are shared optional IDs. Native null/blank relationship values normalize to absent; supplied IDs must resolve even on drafts. A related unpublished or missing-locale person/offering prevents article publication in that locale.

Articles require publishAt in the base and every supplied translation. It is both the publication schedule and human-visible/feed publication timestamp. updatedAt is optional per locale and cannot precede that locale's publishAt. ISO timestamps accept offsets and are compared as instants with Date.parse. Task 4 must format these explicit timestamps rather than infer dates from build time.

Settings own shared identity, contact destinations and navigation structure:

- brand: { name, tagline }
- legal: { businessName, privacyVersion, notice }
- contact: { email, phone, address }
- ordered navigation: [{ pageId, label }]

Settings translations contain exactly { brand: { tagline }, legal: { notice }, contact: { address }, navigation: { [pageId]: label } }. Every shared navigation ID requires a translated label; stale label IDs fail. Translations cannot override brand name, business identity, consent version, email/phone or navigation order/relationships. legal.privacyVersion is shared, nonempty and at most 80 characters; the seed value sample-v1 supplies consent provenance, with review flags still false. Page hero/About copy never belongs in settings.

Canonical locale keys use hyphens, for example en-US. The loader rejects underscore keys and unconfigured/default-locale translation entries. Task 3 may normalize Tina underscore keys only on detached validation projections.

## Text and safe rendering

Exported LIMITS are title 200, SEO 300, Markdown summary 10,000, and Markdown body 100,000 characters. renderRichText escapes raw HTML, downgrades H1 to H2 and disables Markdown images. renderInlineRichText(body, { links: false }) retains emphasis while removing anchors for whole-card links. plainText(body, limit?) extracts text and truncates by Unicode code point without splitting surrogate pairs.

isSafeLink is shared with native link validation. HTTP(S), mailto, tel, internal relative paths, fragments and queries are supported. Unsafe schemes, controls, protocol-relative links, backslashes, encoded bypasses and credentialed HTTP URLs are rejected. Foundation rich-text controls must not expose image/embed tools; content media belongs to stage 3. Safe rendering does not parse or mutate Tina ASTs.

## Exports

Runtime schemas: pageSchema, offeringSchema, personSchema, articleSchema, settingsSchema, sectionSchema, sectionCopySchemas, metaSchema, linkSchema, plus PAGE_TEMPLATES, SECTION_TYPES, SURFACES, LIMITS. Rendering: isSafeLink, renderRichText, renderInlineRichText, plainText. Projection/routes: localizeContent, publicRoutes. Filesystem-only: readContent.

Shared declarations live in packages/content/types.ts, re-exported through schemas/barrel declarations. The small supporting publication.mjs isolates pure publication/URL helpers from the filesystem boundary; it is not a public collection registry. No frontend, CMS or backend integration is implemented in this task.
