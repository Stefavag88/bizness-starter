# CMS authoring guide

## Where to edit

- **Settings** owns shared business identity, legal details, contact details, social channels and main navigation. Newsletter controls appear when the configured profile and module enable them.
- **Pages** owns page metadata, shared section composition and localized section content.
- **Offerings** owns individual service descriptions and full service content.
- **People** owns team profiles. Articles may refer to a profile by its Content ID.
- **Articles** owns insight entries, summaries and full article content. Related service and author fields use saved Content IDs.

## Pages: structure and content

Use **Page sections** to manage visibility, background surface, layout and order. Section types have readable names; the stable section ID remains visible as a secondary reference. Required sections are protected. New optional sections start hidden.

Use **Section content** to edit section headings, rich text and links. Match its section ID to the corresponding Page sections entry. Use **Page title and SEO** for the browser title and search engine summary. These fields are separate from the hero title and visible introduction.

Use **Translations** for localized content and metadata. Visibility and structure are shared; each language has its own copy and publication status. Existing publication, validation and missing-translation rules still apply.

## Publication and identity

Draft entries stay hidden. Published entries become eligible when their publication date permits it. Production pages are static: a future publication date does not schedule a rebuild. Trigger a build after that date to publish the change.

Content IDs are internal references; URL slugs identify public routes. Preserve saved identity. Article relationships currently accept Content IDs rather than titles or URLs; this pass clarifies that contract without adding relationship pickers.

**Short introduction** is preview copy with inline formatting. **Main content** is the full rich-text body with H2/H3 headings, lists and links. **Search engine description** is a separate plain-text summary.

## Navigation

Use **Main navigation** in Settings to add saved Pages, edit localized labels and reorder links. **Linked page** changes an existing item's destination while preserving its position and labels across languages. Destinations used by other items are excluded. Removing a menu link retains the Page. See [composition authoring](COMPOSITION_AUTHORING.md#navigation).

## Usability review — 2026-10-20

The walkthrough covered Settings, Pages, Offerings and Articles in the local CMS. This pass replaces technical field names with readable labels, makes collection names plural, clarifies Page structure versus copy, and adds publishing and relationship guidance. Persisted field names, templates, validation, editor ASTs and website design remain unchanged.

Search configuration is a separate integration task; the native Tina search notice is not removed or disguised. Relationship pickers and automatic scheduled builds are outside this presentation pass. Native save/create/update acceptance is covered by the existing ownership-aware composition scenarios; this walkthrough does not claim a new save acceptance run.

### Verification

The live Edge walkthrough opened Settings, Page composition, Page SEO, Page section content, an Offering and an Article. It confirmed the renamed groups and fields were visible and their editors remained accessible. All canonical JSON files in settings, pages, offerings, people and articles were compared byte-for-byte before and after; no saves were submitted. Native group descriptions were omitted because Tina folds them into button names. Final review also aligned existing browser scenario selectors with the renamed groups.
