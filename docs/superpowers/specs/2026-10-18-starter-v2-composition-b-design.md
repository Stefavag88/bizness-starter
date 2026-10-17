# Business Starter v2 — Composition B design

Date: 2026-10-18. Status: Proposed written design; user review pending. Authority: the approved v2 architecture and Composition A delivery decomposition. Showcase is accepted at runtime29bbc05, handoffd3a3478. This increment extends the existing registry and native CMS; it is architectural work, not a replacement website or preset implementation.

## Intent and selected approach

The user approved continuing from the completed showcase to FAQ, process steps, media/text and gallery. Success is an editor adding these sections to any eligible Page, editing bilingual rich copy, ordering/hiding/removing instances, choosing supported layouts and seeing the actual production renderers in the local showcase. Preserve the minimal neutral visual baseline and four themes. Business identity, existing seed pages and protected required regions remain unchanged.

Use four explicit registered section types and small native controls for shared nested structure. A generic unconstrained block builder would weaken current validation. Separate language-specific nested lists would permit structure and translation associations to drift. Recreating AXIA-specific pages would couple the starter to one industry. Extend the current contracts instead: default locale owns shared structure, order and appearance; translations own copy by stable IDs.

## Section library and variants

| Canonical type | Content and semantics | Supported variants |
| --- | --- | --- |
| faq | Section title, inline rich introduction and question/answer items. Native details/summary disclosure, useful without JavaScript. Answers use the existing safe rich-body editor/renderer. | default: disclosures; expanded: all answers visible |
| steps | Section title, inline rich introduction and ordered title/body items. Use an ordered list; the order conveys the process. | default: vertical sequence; cards: responsive process cards |
| media-text | Section title, safe rich body, optional shared image and optional localized CTA. A missing optional image is an intentional text-only layout. | default: image before text on desktop; reversed: text before image |
| gallery | Section title, inline rich introduction and shared ordered image items with localized alternative text and optional inline rich captions. | default: responsive grid; featured: first shared item prominent, remaining items in a grid |

Existing six types retain default-only variants. Register canonical names, native GraphQL-safe aliases, copy/reference schemas, supported variants, honest defaults, Tina fields and static renderer imports together. No arbitrary CSS, component paths, HTML, remote embeds or script content is accepted. New sections start hidden; all existing hero/privacy/contact capability protections still apply.

Variants are explicit instance settings, independent of theme names. All variants work at375/768/1440 and collapse predictably on mobile; reversed affects desktop presentation, not the accessible reading order of title/body. Keep heading hierarchy: one Page hero H1, section H2, appropriate item H3. FAQ questions are summary text, not a second H1. No FAQ structured-data or search-result claims are added.

## Wire format and shared nested ownership

Retain schemaVersion2, the typed section-copy lists, detached domain projection and original native values/AST return. Extend section references with type-specific optional fields without changing valid existing records. Treat this as an additive registered-type extension, not another disk format or a migration tool.

FAQ and steps references own items:[{id}]. Gallery references own items:[{id,media:{src,crop}}]. Media/text references own optional media:{src,crop}. crop is center, top or bottom; source and crop are shared. Fixed CSS classes implement these positions without CSP-breaking inline style attributes. Item IDs are generated once, unique within their owning section and immutable thereafter. Section IDs retain their existing protections; the same item ID in another section is a separate scope.

Each localized section-copy entry owns its normal title/introduction/body and an items list associated by item ID: FAQ items have id/question/answer; steps id/title/body; gallery id/alt/caption. Media/text copy owns optional image text {alt,caption} corresponding to its shared media and its existing-style optional CTA. Captions use safe inline rich text. Native rich defaults use actual fresh editor ASTs, not string placeholders that the installed serializer omits.

Shared order is authoritative even if localized lists arrive in another order. Default copy must match every shared item; each supplied localized section must have exact shared item membership and valid required copy. An optional translated section may be absent entirely and is then omitted, with no default-language fallback. No per-item translation fallback or partial item omission is introduced. Reject duplicate/stale item IDs, unsupported variants and copy/reference type mismatches with precise paths.

New hidden FAQ/steps/gallery sections may have zero items while being composed. An enabled section requires at least one complete item; incomplete intermediate native form states remain editable but cannot be persisted as a complete invalid record. FAQ requires a nonempty question and meaningful answer; steps require a title and meaningful body. Content images require nonempty localized alt text in every supplied section translation. Optional captions may be blank. Missing optional media/text image uses text-only rendering; a referenced missing/broken file is not treated as an absent image.

## Native authoring and operations

Default-locale controls add, move and remove nested items in one Final Form batch, updating shared references/default copy and pruning matching copy across all existing translations on removal. Adding an item initializes honest default-language draft fields only; explicitly initialize the missing localized copy before a valid save. Do not automatically create translations or prose. IDs cannot be edited or retyped. Localized fixed editors expose copy, not independent item add/remove/reorder/source controls.

Removal confirmation explains its effect across languages; cancel changes nothing. Hiding a section retains its items, image references and all copy. Structural edits preserve unrelated rich AST object identity. The current Page invalid-save correction mechanism must also reach nested item rich fields and image text after rejected saves, retaining unsaved edits. Native tests must exercise early invalid Save followed by correction, rather than only completing every field before the first Save.

Shared image selection uses the existing Tina local upload picker rooted at public/uploads. Clearing an optional media/text image removes only its shared media and now-stale localized image text, preserving title/body/CTA. Gallery item removal prunes its localized text through the same item operation. Source replacement preserves item identity and leaves alt/caption editable for deliberate editorial review; it does not invent descriptive text or publish translations. File deletion remains separate from reference removal; no automatic physical media deletion or reference-aware media-library CRUD is added.

## Minimal image contract

These are content images, not decorative backgrounds. Keep src/crop shared and alt/caption localized. Restrict references to original local PNG/JPEG/WebP uploads; reject SVG, remote/data/protocol-relative URLs, query/fragment components, traversal, unsafe encoded paths, generated derivative destinations and realpath/symlink escapes outside the upload root. Support ordinary filenames including spaces through one explicit decode/containment boundary. Do not expose filesystem paths in browser bundles.

A server-only source metadata adapter reads dimensions/format from the installed image tooling already used by Astro, following the read-only financial project's established adapter boundary. It validates actual file format, bounded metadata reads and realpath containment, and handles EXIF-oriented dimensions. Render original uploaded files with explicit intrinsic width/height, lazy loading and asynchronous decoding. Use fixed aspect-ratio frames and object-fit/crop classes; do not generate derivatives or responsive srcsets in this increment. Record this original-image performance limit rather than claiming production image optimization.

Keep syntax/ownership validation browser-safe for native saves. Physical existence/format/dimension verification belongs to the server/build adapter; do not pretend a browser hook can prove filesystem existence. Validate only media actually required for public enabled/published rendering, with actionable page/section/item errors; structural/path syntax remains strict for all records. Draft/hidden sections retain their data without causing image generation. No URL fetch, private filesystem import or image decoder enters the editor/client bundle.

Watch referenced upload changes in local development so an uploaded/replaced image reaches the same public metadata resolver without schema regeneration. Retain deterministic metadata caching keyed by source bytes rather than filename alone. No general asset manifest protocol, new external storage service or dependency upgrade is assumed; the implementation plan must verify the installed adapter and exact limits before coding.

## Rendering, design system and showcase

Use existing semantic colors, font roles, radius, spacing/density, buttons, rich prose and focus treatments. Add focused section tokens only when a shared configurable behavior needs them; avoid AXIA-specific selectors or mandatory decorative accents. FAQ disclosures and nested links have clear keyboard focus. Respect reduced motion and keep content available without JavaScript; no new animation or accordion dependency.

Extend the local showcase with all four types and their variants using the actual registered renderers. Supply clearly labelled neutral original sample images with established provenance; do not copy financial-client photography or present illustrations as real business premises. Production showcase route and dedicated assets remain excluded through the accepted local-only registration/artifact checks. Normal business media assets are distinct from the developer preview graph and remain available when referenced by real Pages.

## Acceptance and delivery discipline

Pure tests cover registry exhaustiveness, variant/type validation, exact nested ID membership/order, add/reorder/remove/cancel across three locales, missing whole-section translation, enabled-empty rejection, metadata clearing and retained AST identity. Image tests cover valid supported files, missing/corrupt/mismatched formats, unsafe/encoded paths, symlink escapes, source replacement and dimensions. Invalid save recovery must preserve the existing native object and nested ASTs.

Actual Tina UI coverage adds two instances, nested items and EN/EL rich copy, changes variants/images, reorders, hides/removes, clears an optional image, rejects incomplete input with zero mutation, corrects it and reloads. Verify public ID associations and no schema/descriptor regeneration from item IDs. Use installed request/schema/serializer-derived complete ownership, capture before optional diagnostics, exclusive creation for absent files and exact guarded cleanup. Do not overwrite unknown editor bytes or delete uploaded files that were not proven test-owned.

Browser acceptance covers EN/EL, both selected layout directions,375/768/1440, keyboard/FAQ disclosure behavior, no-JavaScript content, reduced motion, one H1, correct links, visible focus, no overflow and stable image layout/dimensions. Retain representative axe scans and manual screenshots without claiming certification. Preserve articles-disabled and functional profile boundaries; rerun only directly affected profile checks rather than an unbounded cross-product.

Use the existing pinned toolchain and owned-process/file helpers. Stop the new project's owned dev stack before the full suite or conflicting builds; restore/restart it at handoff. Both reference projects remain strictly read-only. All Markdown is English. Preserve accepted Composition A/showcase commits and use a dedicated codex/starter-v2-composition-b branch. Execution preference remains medium subagents, independent review per implementation step and a final whole-branch review, after written spec and implementation plan review.

## Deferred work and self-review

Composition C owns domain/route extension registration and Rooms. Stage3 owns hashed image derivatives, responsive optimization, decorative section backgrounds, broader media/editorial integrations, social/motion/visitor modules and hosted-provider verification. Stage4 owns business presets, safe new-project initialization and releases. No reservations, payments, customer accounts, sending, provisioning, deployment, merge, push or tag is included.

Self-review: four concrete types/eight variants have explicit rendering semantics; nested structure and translation ownership are fixed; minimal media is separated from optimization; browser/native/server validation responsibilities are distinct; current empty-state/save-recovery/CSP/production-exclusion contracts carry forward. No temporary global-settings content, second persisted representation or independent per-language structure is proposed.
