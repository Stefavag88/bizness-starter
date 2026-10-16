# Business Starter v2 — Composition A: Native authoring design

Date: 2026-10-16
Status: Approved by the user on 2026-10-16. The separate Composition A implementation plan was approved for execution on 2026-10-17.

Authority: This is a focused addendum to the approved [v2 architecture](2026-10-16-business-starter-v2-design.md). It proposes an explicit revision to the Foundation localized-copy and navigation-label persistence encoding. The accepted Foundation remains available at commit ac3102c on codex/starter-v2-foundation. Both reference repositories remain read-only.

## Intent and success

A developer must be able to create materially different business websites using the same repository boundaries, and an editor must be able to compose pages without changing code for each section instance. The user approved continuing beyond Foundation, preserving English/Greek content, the design-token approach, native Tina editing and independent review per implementation step.

The first composition increment makes the existing six section types genuinely authorable. An editor can create a Standard page, add repeatable optional sections, reorder them, edit their localized rich copy, hide them and safely remove them. The required hero and template-owned Contact form remain protected. Adding a section instance must not regenerate the Tina field schema or require a second save after a schema rebuild.

This is architectural work because native field structure, persistence validation and authoring capabilities change together. This written addendum requires review before an implementation plan is finalized. The preserved execution preference is fresh subagents, independent task gates and a whole-branch review, with medium implementation reasoning.

## Delivery decomposition

| Increment | Deliverable | Explicit boundary |
| --- | --- | --- |
| Composition A — this design | Native typed copy storage, composition controls for the existing six types, Standard page creation, explicit navigation editing, stable translation ownership and protected identities | No new media pipeline, business presets, domain collection or full section library |
| Composition B — separate plan | FAQ, process steps, media-and-text, gallery and approved variants, extending the same registry | Shared media/alt ownership is designed with its minimal asset contract; derivative image generation remains stage 3 |
| Composition C — separate plan | Collection/route extension registration and an optional Rooms exercise without core-loader or unrelated-template changes | No availability, reservations, payments or customer accounts |

These increments complete stage 2 in reviewable deliveries. Stage 3 retains media/social/motion/visitor modules and hosted-provider verification. Stage 4 retains business presets, safe destination initialization and release tagging. Splitting stage 2 does not remove these obligations.

## Why the Foundation editor needs a contract adjustment

Foundation intentionally protects its seeded Pages. tina/templates/pages.ts derives native object field names from the existing section IDs. Tina has a static GraphQL schema: a new arbitrary map key is not a new editable native field. A custom component cannot make undeclared keys persist reliably. The current descriptor also prohibits the same section ID having different types across pages with the same page template.

Keeping that representation for unrestricted composition would make content authoring depend on schema regeneration. A new section would need fields that the current editor cannot yet serialize; rebuilds would introduce dirty-form and reload hazards.

Read-only inspection of the installed packages found supported native typed object lists and template nameOverride aliases. Those are the proposed integration mechanism, not an invented GraphQL scalar, runtime plugin loader or custom raw-write endpoint.

## Approaches considered

1. **Recommended: typed localized copy lists.** Native object templates describe every registered section type ahead of time. IDs are scalar values, so new instances and different page compositions do not change the schema. This requires a deliberate schemaVersion revision for the new repository.
2. **Keep maps with predeclared slots.** A fixed pool of type-specific IDs can preserve the stored maps, but imposes a finite capacity and slot naming rules. It is a more restrictive starter contract and is not selected.
3. **Regenerate fields from content after every composition change.** This retains the circular dependency between creating content and declaring its fields, with reload and dirty-form hazards. It is not selected.

## Persistence and normalized content

Advance project.schemaVersion from 1 to 2. starterVersion remains 2.0.0-dev. Rewrite only the new starter's neutral Page/Settings seeds and test fixtures directly into the new representation. Do not alter either reference project, add a migration CLI or accept both persisted Page formats.

The shared structure stays an ordered reference list. Persisted default and translated copy become typed lists:

```json
{
  "sections": [
    {
      "id": "intro",
      "_template": "hero",
      "variant": "default",
      "enabled": true,
      "appearance": { "surface": "default" }
    },
    {
      "id": "overview",
      "_template": "rich-text",
      "variant": "default",
      "enabled": true,
      "appearance": { "surface": "muted" }
    }
  ],
  "copy": {
    "sections": [
      { "id": "intro", "_template": "hero", "title": "A useful starting point", "description": "Introduce the page." },
      { "id": "overview", "_template": "rich-text", "title": "Overview", "body": "Describe the subject." }
    ]
  }
}
```

Translations use the same typed copy list and retain their own publication/meta fields. They contain no shared structural list, surface, enabled state or variant.

There is one authoritative persisted format. A browser-safe PageDocument validator accepts the typed-list representation; a detached normalization function resolves copy by ID into the existing internal Page model and copy.sections[id] lookup. This is a wire-to-domain projection, not a legacy compatibility reader. Public LocalizedPage, section renderers, safe prose, route and manifest consumers keep their existing semantic interfaces.

Use separate explicit names for persisted PageDocument and normalized Page types/validators. The loader and native save guard must validate the persisted representation before normalization. Cross-record catalog validation consumes normalized Pages. Do not maintain two independent sets of section-copy constraints: registered copy schemas supply both boundaries.

Validation rejects duplicate IDs, stale entries, missing default copy, mismatched ID/type pairs, unknown templates/variants, unsupported locale aliases and unknown fields. Exactly one enabled hero is required. A translated hero remains required for every supplied translation. Optional translated copy may be absent, in which case that section is omitted in that locale. List position never controls translation association; shared section order is authoritative.

## Native Tina integration

Declare native typed list templates once from the section registry. For a canonical type such as rich-text, use a GraphQL-safe native template name rich_text and the installed supported nameOverride: rich-text. Persist the canonical discriminator. Normalize native alias values only on detached validation projections; return the original native values object and rich-text ASTs from beforeSubmit.

Remove content-derived section field generation and its global same-ID/type restriction. Keep a small byte-stable descriptor only for project metadata and immutable existing page identity, where required. Navigation label fields must also stop depending on content-derived IDs. Copy-only saves and new section IDs must not alter the native schema descriptor.

Use a small custom structure component and a fixed copy-list component inside native Tina forms. The installed field API exposes Final Form and FieldsBuilder. Shared operations batch form changes to sections, default copy and affected locale copy, retaining existing rich-text node objects. The copy component renders registered native child fields but provides no independent structural add/remove/reorder controls, especially inside translations.

Native tests must prove the actual alias roundtrip and complete-record ownership using the installed serializer/generated schema. No test sends a raw write mutation to bypass the UI. No custom backend content-write endpoint is introduced.

## Explicit navigation editing

The same static-field issue affects translated navigation today: shared items are a list, but translated labels are map fields generated from existing page IDs. Adding a new link cannot save consistently until its undeclared translated label field exists. Standard page creation must not leave the editor with that dead end.

Retain shared navigation as [{ pageId, label }]. Store each translation's labels as the same native object-list shape, rather than a map. A detached SettingsDocument-to-Settings projection resolves the list to the current internal label map, so public navigation consumers remain unchanged. This is part of schemaVersion 2, not support for both disk formats.

Expose one explicit navigation control in Settings after the new page has been saved. Shared add/remove/reorder operations batch the structure and translated label entries; localized controls edit labels only. Do not invent translated text: required labels must be supplied before the settings save succeeds. Validate unique IDs, exact membership, known destination records and configured locales. Translation list position never changes shared order. Publication continues to filter unavailable page destinations independently per locale.

Creating or publishing a page does not automatically insert it in navigation. Test the separate native settings edit that adds its link, reloads the editor and shows the correct localized labels/destinations publicly. Removing the navigation item must prune all its label entries without deleting the page. Folder/deletion restrictions remain unchanged.
## Composition operations

The six existing types remain hero, rich-text, offering-list, people-list, article-list and cta. A focused registry supplies canonical type, native alias, copy fields/schema, allowed variants and default-copy factory. Astro uses static renderer imports. Disabling articles removes article-list from the add chooser and public output while preserving dormant section data safely.

- **Add:** choose a registered optional type and insert it after a selected section. Generate a unique page-local GraphQL-safe stable ID once; never derive it from the displayed title. Add complete honest default-language placeholder copy and start the section hidden. Do not invent or copy translated prose.
- **Reorder:** move optional references through keyboard-accessible up/down controls; drag interaction is not required. Keep the hero first. Reorder changes neither IDs nor copy association.
- **Edit translation:** an explicit add-translation-copy action initializes an empty localized editor entry for an existing shared instance. The editor must supply valid required localized fields before saving that entry. No default-language fallback is introduced.
- **Hide:** toggle the shared optional enabled state. Hidden sections retain copy in all locales.
- **Remove:** show a clear in-editor confirmation that localized copy for that instance will also be removed. Batch removal of the reference and all associated copy entries. Do not leave stale translated IDs. Native save-time validation independently rejects malformed operations.

Per-page IDs may be reused on different pages, including with different section types, because they are values rather than generated GraphQL field names. New IDs are immutable after insertion. Changing an instance's type in place is unsupported; remove and add instead.

## Template capabilities and page lifecycle

Every page keeps one hero as its first section. Home, Contact, Offering index, optional Article index and the privacy record retain their singleton/identity protection. Contact's required form is outside optional composition. The privacy record's existing privacy_details rich-text instance is required, enabled and nonremovable; its text stays editable.

Create new records only with the standard template. Collect a valid contentId, flat filename, nonempty unique slug and default-language title. Initialize a draft record with a required hero. Do not add navigation entries automatically, publish translations automatically or create nested files. New page identity and URL collisions are checked against the current complete catalog before persistence.

Tina's create permission is collection-wide, not per template. The native template picker may expose the existing special templates. Selecting one for a new record must produce a clear validation message before persistence; no hidden/create-only template API is assumed. Standard remains the documented creation choice. A separate custom page-builder application or duplicate collection view is not introduced to hide this native limitation.

After a page's first save, its contentId, filename, template and slug are immutable in the editor during this increment. Keep native Rename/Delete disabled for Pages and relationship-target editorials, and keep folder controls disabled. This protects published URLs without inventing redirect infrastructure. Developer changes to previously published URLs still require explicit redirect review before hosted release; richer URL-change/deletion workflows need their own approved design.

## Verification and acceptance

Before broad implementation, prove the native representation with an isolated new-project fixture and the installed versions: create a Standard page through the real UI, add two same-type instances, edit rich copy in both languages, reorder, remove and save/reload. Show persisted canonical aliases and unchanged type/ID association. Reuse exact schema/serializer-derived ownership; preserve unknown concurrent changes and retained originals on conflict.

Then cover:

- Strict document validation and normalization without mutation; old persisted maps rejected under schemaVersion 2.
- Repeated section types and the same ID with different types on separate pages; section/nav additions require no schema rebuild.
- Atomic removal across every translation, optional missing translation omission, draft/future publication and disabled articles.
- Native rejected second hero, hidden/removed required hero, removed privacy_details, changed existing identity, nested paths, duplicate/reserved slugs and creation of special page templates.
- Native Standard creation with a flat filename, editor reload, public output after explicit publication and no automatic navigation insertion. A subsequent explicit native Settings edit adds/removes its EN/EL navigation link and restores exact owned bytes.
- Public EN/EL representative pages at 375/768/1440, one H1, keyboard actions/focus, safe prose, correct language alternatives and no overflow.
- Existing contact, newsletter/profile and published-manifest behavior remains valid. Run focused regressions first, then required check/unit/static/native/Worker and bounded browser gates.
- Both source repositories retain their original revisions and clean working trees. New-project tests restore only demonstrably owned files/configuration and stop only owned process trees.

Representative accessibility checks are not certification. No real sending, provisioning, hosted-provider changes, deployment, merge, push or release tag is part of Composition A.

## Implementation handoff

After user review of this encoding/capability addendum, write the Composition A implementation plan against this document and the approved architecture. Preserve subagents with independent review per task and a final whole-branch review. The native contract proof is an early gate: if installed native aliases or complete-record ownership do not behave as specified, report the concrete blocker before expanding implementation.

Later plans extend this same registry with the full section library and domain collection registration. They must not add business-specific fields to a universal Offering or restore content-derived native schemas.

## Self-review

The design preserves shared section ownership, stable IDs, rich-text safety and existing public consumer interfaces while explicitly revising the persisted localized-copy and navigation-label encoding. Every proposed authoring operation has an independent validation boundary and a native test owner. Creation-only template restrictions are described as a real native limitation rather than an unsupported API. Required structure, URL immutability, dormant modules and source ownership remain explicit. No unresolved placeholder or unbounded feature subsystem is included in this increment.
