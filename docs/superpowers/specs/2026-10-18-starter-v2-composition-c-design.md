# Business Starter v2 — Composition C design

Date: 2026-10-18. Status: Proposed written specification for user review; not implementation approval. Starting point: accepted Composition B runtime f9b93e2 and handoff 9ad9d86. Work remains in C:/Projects/bizness-starter-v2 on codex/starter-v2-composition-c. Both source repositories remain read-only.

## Intent and success

Make a new business collection an explicit developer extension rather than a reason to rewrite the content loader, route pipeline, native catalog validation or unrelated page templates. Prove that contract with an optional Rooms module for an accommodation website, without reservations. Preserve the current neutral site, design system, bilingual ownership, native editor and Cloudflare/Tina architecture.

The approved roadmap names collection/route registration and Rooms as Composition C. This proposal interprets a Room as a marketed room type, such as Double Room or Suite, rather than a numbered physical inventory unit. This assumption is explicit and reviewable. Adding classes, treatments or another domain later should use the same documented extension points.

## Approach and alternatives

Use static registries with explicit contracts and build-time imports. A runtime plugin loader or CMS-authored schema would introduce deployment, validation and security complexity that this starter does not need. Continuing to add rooms-specific branches everywhere would deliver one example but fail the extension goal.

Registration is deliberately separated across browser-safe content contracts, Tina factories and Astro renderers. A single universal manifest importing all three would drag framework/server dependencies across ownership boundaries. A new domain adds its own implementation and focused registrations; it must not edit core loading/localization/catalog/route algorithms or unrelated templates after the initial framework refactor.

## Extension contract

A registered domain declares a stable module key, collection identity, flat content directory, strict record schema, native field/collection factory, localized publication projection, route ownership and static detail renderer. It can additionally contribute a listing section, module-owned index Page and enquiry contexts. These are code registrations, never arbitrary component paths or executable CMS values.

The initial refactor provides generic extension datasets alongside existing named public collections. Keep current offerings, people and articles consumers working; do not rename their persisted records or force unrelated migrations. New domains are accessed through a registered typed boundary, not repeated casts or a universal Offering record. Every registered key/native alias/route identity must be unique. The implementation plan must state the exact interfaces and ownership of each layer before coding.

The generic catalog includes active extension records in global content-ID, translation, reserved-path, route-collision and relationship checks. Duplicate public URLs fail before save/build. The same publication/route projection supplies public pages, locale alternatives, navigation eligibility and backend manifests. No second independent route list or publication implementation is allowed.

Tina save validation and generated descriptors must discover active domain collections through registration. Domain instance IDs, record counts and copy edits must not regenerate the native schema. Browser/editor imports remain free of filesystem loaders and image decoders. Existing native values and ASTs are returned unchanged after detached validation.

## Enablement and dormant content

Add a developer-owned modules.rooms boolean, default false, independently of articles and enquiries/newsletter/nurture profiles. Unknown module keys fail validation. Do not replace the existing profile or articles options in this increment.

When Rooms is disabled, do not read/validate its content folder or its declared module-owned index Page. Omit its Tina collection, new-section chooser entries, public routes, navigation destinations and enquiry contexts. Dormant malformed Room records must not break an otherwise valid disabled-module build. Preserve all dormant bytes; toggling a module never writes or deletes content.

Module-owned index Page filenames must be declared explicitly so disabled-page exclusion can happen before JSON parsing. Native creation/identity guards prevent saving that special template under arbitrary filenames. Known section templates may remain in schema solely to round-trip existing dormant Page sections; hide them from creation controls and public output while disabled. Explain dormant sections clearly instead of deleting their copy on an unrelated Page save.

Ship a declared, dormant draft Rooms index Page with neutral EN/EL copy, and no published sample Room records. Enabling the module exposes its collection and index Page for authoring, without changing Home, branding, theme or navigation automatically. Disabled is the default starter experience. Preset selection and destination initialization remain Stage 4.

## Rooms content and CMS

Use a separate content/rooms collection. Shared fields include stable contentId, shared slug, publication metadata, maximum guest count and ordered image/amenity references. Localized copy includes title, inline-rich description, safe rich body, optional bed description, amenity labels and image alt/captions, with localized publication metadata following existing editorial conventions. Reuse current text and image safety limits; the plan must define any new bounded numeric/list constraints once in the module contract.

Images use shared stable IDs, original local src/crop references and localized alt/caption entries. Amenities likewise use shared IDs/order and localized labels. Exact membership and shared ordering apply in every supplied translation; no per-item or default-language fallback. Image sources may be omitted entirely for a text-only Room presentation; a supplied missing/broken source is an error. Each supplied image requires localized alt text. First shared image, when present, supplies the listing thumbnail; it is not duplicated into a second independently editable cover field.

Reuse the existing source metadata adapter, safe rich-text rendering and native item/media control principles. Structure/source controls belong to the default locale; other locales edit copy. Add/remove/reorder and explicit translation initialization preserve unrelated native AST identity. Removing a reference never deletes the physical image. This is not a new media manager or taxonomy subsystem.

Enable native creation of Room drafts through the supported Tina UI. IDs/filenames/slugs are immutable after the initial save, with flat-file and catalog collision checks. Keep native Delete disabled until relationship-aware deletion is explicitly implemented; unpublish records to remove them from public output. Do not introduce redirect generation or mutable published URLs here. Existing required hero/privacy/contact and Standard-creation policies remain intact.

## Listing, detail and visibility

The Rooms index is a module-owned composable Page with the existing single required hero and a registered room-list section. Other permitted optional sections reuse Composition B. Its shared slug owns the room detail prefix: /LOCALE/ROOMS_INDEX_SLUG/ROOM_SLUG. Existing saved-URL policies apply; language-specific slugs are not introduced.

A Room is publicly available in a locale only when both its localized record and localized Rooms index are published at the shared publication clock. Missing translations omit output and locale alternatives. Native/public guidance must explain the index dependency. The index may publish before any Room; the room-list copy owns a localized empty-state message rather than inventing business records.

Provide one default room-list layout and one focused Room detail renderer. Reuse shared cards, typography, spacing/density, radius, prose, figures and buttons. Display guest count, localized bed description, amenities, optional images and body in a clear responsive hierarchy. Keep one H1. Images retain intrinsic dimensions, fixed crop classes, lazy loading and original-file performance limits. No industry palette, animation system, lightbox, background-photo treatment or mandatory decorative styling is added.

Room detail enquiry CTA links to the existing contact page with the Room context selected. Module enablement does not choose an accommodation theme or publish any content.

## Enquiry integration

Introduce registered enquiry-context contributions from public content. Offerings retain their current behavior; Rooms contribute only when enabled and publicly eligible. The localized contact form, preselection and Worker acceptance manifest use this same pipeline. Keep existing contextId requests and stored inquiry IDs compatible; global content-ID uniqueness prevents ambiguity between domains.

Do not remove or repurpose the existing offerings/article/campaign manifest contracts needed by other consumers. Add the generic context representation at its own explicit boundary and update the shared contact consumer/Worker validation once. Future domain modules must not add new Worker conditionals. No D1 schema migration, booking operation, price quote engine, newsletter enrollment or real delivery is introduced.

An unknown, disabled, draft or otherwise unavailable context must not become accepted merely because its files exist. Preserve current idempotency, consent, origin checks, Turnstile boundary, role authorization and sending-disabled defaults.

## Acceptance

- Prove the generic framework refactor independently from Rooms registration. The Rooms implementation step must add registrations and its own files without editing the core loader/localizer/catalog/route algorithm or unrelated detail templates. Document the few intended registration points.
- Test duplicate registration keys/native aliases, incompatible route ownership, global IDs, missing/stale translations, publication clocks, index dependencies and reciprocal locale alternatives. Keep existing route and profile behavior stable.
- Enabled/disabled tests cover dormant malformed Room files and owned Page exclusion before parsing, dormant section retention, absent CMS collection/chooser/routes/navigation/context, and byte-exact restoration. Disabled modules must not be queried through absent native GraphQL types.
- Real Tina UI creates a Room draft, edits EN/EL rich content and item/image copy, reorders structure, rejects invalid saves with zero mutations, corrects nested fields, publishes/reloads and verifies public associations. Use existing request/schema/installed-serializer ownership and exact binary fixture ownership. Protect immutable saved identity and disabled deletion.
- Browser checks cover listing/detail/contact preselection at 375/768/1440, EN/EL availability, keyboard/no-JS where applicable, one H1, image loading/dimensions, safe links, meaningful empty/text-only states and representative axe/manual evidence without certification claims.
- Verify actual Worker context acceptance/rejection using local D1 capture-only fixtures, without external delivery. Keep unrelated newsletter/nurture replays bounded to changed interfaces.
- Check static builds, isolated CMS, public-static routing/CSP and owned module/profile combinations. Recheck dedicated showcase exclusion after new renderer imports. Stop only owned processes before conflicting builds; restore exact project/content/media bytes and retain unknown edits.
- Provide a developer extension recipe, Rooms editing guide, registry/ownership documentation and evidence. Demonstrate a second small test-only domain contract through the public extension API, without shipping a second production business module or another framework.

## Delivery and boundaries

Use a dedicated codex/starter-v2-composition-c branch in the existing new repository. Keep the two source repositories read-only. All Markdown is English. Preserve schemaVersion 2 and the accepted typed Page representation; only additive module/domain contracts are proposed. No dependency/font upgrade is assumed.

After written specification approval, write a separate implementation plan with exact interfaces, tasks, test owners and native-safety gates. Preserve the selected medium subagents, independent review per step and final whole-branch review. Execute continuously only after that written plan is approved. Keep the branch locally; no merge, push, tag, account provisioning or deployment.

Bookings, availability, inventory units, pricing/payment, customer accounts, optimized derivatives/srcsets, broader social/motion/visitor modules, hosted-provider readiness and business presets/initialization remain outside Composition C. No real sending or hosted configuration is authorized. Current design and Home remain unchanged while this specification is being reviewed.

Self-review: extension and framework layers are separated; Rooms semantics and dormant ownership are explicit; listing publication and enquiry eligibility share one pipeline; immutable native identity and safe content/media rules carry forward; acceptance includes disabled behavior and real CMS recovery. No runtime implementation has begun.
