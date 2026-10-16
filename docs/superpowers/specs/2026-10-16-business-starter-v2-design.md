# Business Website Starter v2 — Architecture Design

Date: 2026-10-16
Status: Revised for the separate-project direction approved in chat on 2026-10-16. Revised written documents await review before implementation.

Authority: This revision supersedes the in-place-upgrade spec and Foundation plan committed in the original starter. Those historical documents remain unchanged. Planning copies live in the conversation workspace until the new repository is created.

## Purpose and decision

Create a separate project and fresh Git repository at `C:/Projects/bizness-starter-v2`. Selectively reuse proven capabilities from `C:/Projects/bizness-starter` and `C:/Projects/financial-consulting-example`; both repositories are read-only sources. Their files, histories, content, design and running servers remain unchanged. This is a clean assembly of existing capabilities around the new contracts, not a rewrite of working infrastructure.

The intended users are developers creating independent client websites and editors managing their content in TinaCMS. The first release targets professional services, trades, accommodation without reservations, and studios/wellness. Booking engines, payments and customer accounts are future integrations, not starter features.

Success means that a developer can initialize a project, select a business preset, change content and appearance, and add a domain collection without restructuring the framework. Different businesses must be able to produce genuinely different page compositions.

## Evidence and alternatives

Read-only inspection found that the repositories retain the same contracts and email package files, while the financial implementation has modular Tina collections/fields/templates, rich-text content, page appearance, responsive media and substantially broader verification. Its homepage and AXIA stylesheet also contain business-specific composition that cannot safely become the default starter.

The initial in-place upgrade proposal was superseded by the user-approved separate-project approach. No existing client migration is required. A clean repository removes transitional schema support and lets the new content model be authoritative from the outset. Wholesale copying the financial site still risks hidden AXIA assumptions; rewriting proven backend behavior still increases verification work. Reuse selected source capabilities with provenance and review. No effort estimate or production certification is implied by this assessment.

## Scope and delivery boundaries

This document defines the target architecture and staged acceptance criteria. Implementation plans are written separately after review, one coherent delivery stage at a time. Do not combine every subsystem into one large implementation task.

1. Foundation: canonical content/CMS contracts, safe rich rendering, a minimal Pages/section contract and a neutral runnable site.
2. Composition: expand the existing minimal registry with the complete section library, authoring creation/reordering controls and extension exercises.
3. Experience modules: optional articles, newsletter and visitor preferences, plus reusable contact/media/motion capabilities.
4. Presets and release: four starter compositions, initialization, extension exercises and documentation.

Each stage must leave a working new site and carry its own tests and review. The old starter remains a separate working reference; the new repository does not support its schemas. Foundation uses the final architectural boundaries immediately, without temporary fields in global settings that later move to Pages.

## Runtime architecture

Retain Astro static public pages, TypeScript, TinaCMS Git-backed authoring, Zod validation and the existing Cloudflare Worker under `worker/`. Retain D1, Queues and existing email/SES/SNS integrations where the selected functional profile needs them. Public rendering consumes repository content at build time rather than querying TinaCloud at request time.

Keep the established monorepo boundaries: `apps/site`, `worker`, `packages/content`, `packages/contracts`, `packages/design-system`, `packages/email`, `tina`, `content`, `scripts`, `tests` and `e2e`. Add focused registries and modules inside these boundaries instead of introducing a new framework, runtime plugin loader, database CMS or distributed package system. A small packages/config module supplies the shared project validator to Node scripts and TypeScript consumers.

Published client sites are independent repository copies with separate infrastructure and subscriber data. Presets initialize content; they do not remain runtime dependencies or silently overwrite later editor changes.

## Configuration ownership

| Owner | Responsibilities |
| --- | --- |
| `project.json` | Identity, environments, enabled languages, functional profile, enabled modules, preset provenance and developer-selected design defaults |
| Theme JSON | Brand palette, font roles and semantic theme values, editable through the appropriate CMS collection |
| Foundation/component CSS tokens | Component geometry, shared spacing and motion defaults; developer-controlled unless an explicit editor contract exists |
| Website settings | Business identity, shared contact details, configured social destinations and navigation |
| Pages and editorial records | Localized content, approved section variants, ordering, visibility and section appearance |
| Environment variables/secrets | CMS and infrastructure credentials; never public content or theme fields |

Every configurable value must have one authoritative source. Generated CSS, registries and runtime manifests are outputs, never editing targets. Validate cross-field constraints at CMS-save and build boundaries using shared browser-safe validators where possible. Preserve native rich-text values during validation; do not replace the editor's AST with a parsed projection.

CMS appearance supports approved surface choices, optional custom backgrounds with readability validation, local background images, crop and opacity. Optional sections may be hidden. Required primary content, including the contact form, cannot disappear through a decorative appearance toggle.

## Content and localization contracts

Use stable `contentId` values independently of URL slugs. Create fresh neutral sample content directly in the canonical schema; retaining existing client IDs and URLs through migration is outside scope. Support English and Greek initially, and additional configured locales without duplicating templates. Use the same typography scale across languages with suitable font coverage and explicit localized font-role fallbacks.

Shared data includes IDs, relationship IDs, image source/crop and contact/social destinations. Localized data includes titles, descriptions, body content, meaningful image alternative text and editorial metadata labels. Publication must be respected per locale; unavailable translations must not create broken navigation or expose draft content. The default locale owns structure; translations supply copy, not independent section order or appearance.

Use Tina rich-text editing with stored Markdown and the shared safe renderer. Escape raw HTML and validate link destinations; do not promise arbitrary executable HTML or MDX. Avoid rich-text links nested inside a whole-card anchor. Optional cleared fields accept the native empty/null states defined by their schema. Invalid saved content must produce actionable editor/build errors rather than silently losing fields.

## Pages and section composition

Create a template-based Pages collection in the new repository from the outset. Initial templates are Home, Standard content, About, Contact, Offering index and Article index. Offering and article detail routes remain owned by their respective collections.

Home has one protected record and route. Contact owns its primary form region. System privacy content remains explicitly identified. Standard content pages can be created through Tina. Template capabilities determine which sections and actions the editor may add, remove or reorder. Protect required regions; section visibility and list editing cannot remove primary page content.

A section instance contains a stable instance ID, a registered type, an enabled flag for optional instances, shared appearance, a registered variant and localized copy. Native Tina templates expose only supported section types. Renderers resolve registered type/variant combinations; unknown or duplicate instance IDs and unsupported combinations fail validation. Do not let editors enter component paths, scripts, arbitrary classes or CSS.

Initial reusable sections: hero, rich text, offering list/groups, media-and-text split, process steps, gallery, people, article previews, FAQ and CTA. Not every business enables every section. Repeated optional sections are permitted when the template allows them; only one primary hero/H1 is allowed per page.

The page slug is shared across locales in v2 and resolves below each locale prefix. Reserve system, editorial-detail and API paths; reject duplicate and conflicting routes before saving/building. A changed published slug requires an explicit redirect. Localized URL slugs and editor-managed redirect generation are outside this release.

## Developer extension contracts

Section registration connects an explicit identifier to its schema, Tina field template, supported variants and Astro renderer. A new section requires one focused implementation plus registry registration, not changes to unrelated templates. Use static imports compatible with Astro builds; this is not a runtime plugin API.

A new domain collection provides its schema, Tina collection, localized publication rules and routes. Add its registration through the established collection/route extension points. Keep industry fields out of a universal Offering record. Rooms and classes are examples of optional project-specific models, not mandatory core collections.

The component layer retains semantic UI primitives, sections and page compositions. Rename/generalize AXIA-specific selectors when transferring a capability; preserve the financial example's files. Visual variants such as editorial service groups or curved accents must be optional, not baked into every card.

## Functional profiles and optional modules

Business presets and functional profiles are separate axes. Preserve `enquiries`, `newsletter` and `nurture` profile behavior; profiles control backend capabilities and their CMS exposure. Articles are independently optional. Disabled modules must not leak routes, navigation, editor collections or API functionality. The reused D1 schema may retain dormant empty tables to preserve tested backend behavior, independently of the content model. SQL schema migrations for a new database remain required; legacy CMS-content migration does not.

Newsletter prompts and visitor preferences are optional modules. Persist suppression state defensively, including unavailable/corrupt storage. Newsletter browser state is a convenience, not proof of server subscription. Cookie controls must accurately describe configured storage/tracking and gate optional integrations when present. A banner does not establish legal compliance, and no analytics is added by default.

Use native phone/email links, safe new-tab social links, optional WhatsApp and shared contact/footer rendering. Keep forms usable with clear labels, validation, feedback and server-side checks. Actual production mail remains disabled until separately configured and tested.

## Media, visual system and motion

Extract local responsive image generation, source validation, content-hashed derivatives, lazy loading and explicit dimensions. Distinguish decorative backgrounds from content images and preserve localized alt text. Missing optional images yield intentional text-only layouts. Do not copy illustrative AXIA assets or imply genuine business photography.

Transfer useful typography, button, field, icon, footer and navigation primitives as configurable variants. Preserve semantic theme tokens, language consistency, readable contrast, focus indicators and responsive layouts. No AXIA palette, 3px radius, photographic treatment, editorial menu or article accent is mandatory for every preset.

Motion is progressive enhancement: content starts readable, reduced motion disables decorative movement, keyboard focus and hash navigation reveal content immediately. Add no animation library solely to reproduce the current effects.

## Business presets and initialization

| Preset | Initial composition | Extension example |
| --- | --- | --- |
| Professional services | Services, process, people, optional insights and enquiry | Practice-specific advisory content |
| Trades | Services, service areas, direct contact, FAQ and enquiry | Service-area information |
| Accommodation | Gallery, amenities, location, local information and enquiry | Rooms collection without availability or reservations |
| Studio/wellness | Classes/services, instructors, studio information and enquiry | Classes with instructor relationships; informational schedule only |

Use existing suitable themes as starting points; theme selection and business preset selection remain independent. Presets contain honest, clearly marked sample content and empty real-world social/contact integrations where appropriate. Supply a neutral default for a project that selects no business preset.

Initialization writes into a new empty destination, rejects existing project content by default, records starter version/preset provenance, resets environment/review flags/infrastructure identifiers and disables outbound sending. It must not copy secrets, generated output, local databases, caches, dependencies, subscriber data or client Git history. No automatic provisioning or deployment occurs.

## New repository and release discipline

Inventory source capabilities before extraction. Classify each as reusable unchanged, reusable after generalization, or example-only. Record source commit/path provenance. Copy reviewed source files only; never import source Git history, dependencies, generated output, local databases, subscriber records, secrets or client photographs.

Before initialization, resolve the destination and reject a nonempty path or existing repository. Never delete or overwrite a destination to make it usable. Initialize a fresh local repository with no inherited remote. Source snapshots are read-only verification records and must not contain secret values. Dependencies are installed normally in the new project; validate package/CLI compatibility instead of inheriting duplicate Tina copies.

Use one canonical content schema from the first sample record. No paragraph-array compatibility loader, migration command, migration rollback or source-client conversion is included. Schema versioning exists for future v2 evolution only; versioning is not an obligation to support the previous starter.

Version the starter and maintain a change log. New client projects copy a tagged starter release. Future fixes are reviewed patches with compatibility notes; automatic synchronization of customized client forks is outside v2. Database schema migrations and test-owned fixture restoration remain separate necessary mechanisms.

## Acceptance and review

- The neutral baseline and all four presets initialize, validate and build without credentials or cloud resources.
- Exercise each functional profile and articles-disabled behavior independently from business presets; cover every preset at baseline and representative optional-module combinations rather than an unbounded Cartesian test matrix.
- Native CMS roundtrips prove page creation, section reorder/hide, rich text, translations, palette/appearance, image changes and cleared optional values reach source and public rendering. Restore only demonstrably test-owned source changes.
- Check duplicate/reserved slugs, unknown sections/variants, missing translations, draft content, invalid links and stale/generated image paths.
- Verify representative pages at 375px, 768px and 1440px in English and Greek, keyboard focus, reduced motion, image loading and absence of horizontal overflow. Automated accessibility checks supplement manual visual review.
- Build two materially different examples, trades and accommodation. Add a Rooms collection and a new section through documented extension points without editing the core content loader or unrelated page templates.
- Verify disabled modules are absent from public/editor/API surfaces and initialization never enables real sending.
- Preserve both source repositories' tracked/untracked files and Git state throughout extraction. Do not disturb their running development servers.
- The new repository contains no source history, old content formats, real subscriber data, credentials or AXIA assets. Existing client-site migration is explicitly outside scope.

## Documentation deliverables

All Markdown is English. Provide quickstart, architecture/ownership map, CMS editing guide, theme/token guide, section/collection extension recipes, preset authoring guide, fresh-project initialization guide, deployment checklist and limitations. Link to verified source implementations instead of copying AXIA decisions into generic guidance. Provider pricing and production search choices must be reverified against official documentation when that deployment work is scheduled.

## Approval boundary

This is the architecture spec, not a detailed implementation plan or permission to modify runtime code. The revised Foundation plan accompanies this specification for review, with concrete files, contracts, acceptance tests and review gates. Product implementation starts only after review of these revised documents. Preserve the previously requested subagent implementation and independent review per step when execution is authorized. Later stages receive their own plans based on the verified preceding stage.

## Foundation contract carried into later stages

Foundation defines Pages and a small registered section set immediately. Website settings contain identity/contact/navigation, not hero or About copy. A page owns an ordered structural section list; translations reference stable section IDs and supply localized copy only. This shape remains stable when stage 2 adds more sections and authoring operations. Contact's required form is template-owned, never a removable optional section. Stage 2 expands the same contracts instead of migrating a temporary Foundation representation.
