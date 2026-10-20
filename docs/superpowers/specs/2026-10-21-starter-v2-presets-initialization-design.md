# Starter presets and independent project initialization

Date: 2026-10-21
Status: Proposed for owner review. Implementation has not started.
Baseline: ab4384f in C:/Projects/bizness-starter-v2.

## Intent and success

Turn the existing reusable framework into a practical starting point for professional services, trades, accommodation without reservations, and studio/wellness websites. A developer can compare starting compositions, choose a business type and independent theme/language options, generate a fresh project, then enrich it through Tina without restructuring the application.

This is the previously deferred Stage 4 preset/initialization slice. It preserves Astro static pages, Tina collections, registered sections/domains, the Worker lifecycle, existing publication rules and all current production blockers. The existing financial example and original starter remain read-only. No hosted provisioning or deployment is included; the owner has not supplied environment resources or a retention policy.

## Approaches considered

1. **Local preview gallery plus CLI initializer — recommended.** Reuses local-only route registration and keeps filesystem creation in a developer command with explicit source/destination checks. No browser write API or account service is required.
2. **Browser wizard creating folders.** More convenient in one interface, but requires a local privileged server, destination authorization and a new write surface. Defer until actual use demonstrates a need.
3. **Manual copying and applying presets in place.** Cheapest initially, but creates overwrite and secret/data-copy risks and does not reliably produce independent projects. Do not use as the supported initializer.

## Presets and composition

Ship a neutral baseline plus these four presets, following the original approved architecture:

| Preset | Starting composition | Existing model used |
| --- | --- | --- |
| Professional services | Hero, service list, process steps, people, optional insights, FAQ and enquiry | Offerings, People, Articles and registered sections |
| Trades | Hero, services, service-area information, process/FAQ and direct enquiry | Offerings and informational Standard Pages |
| Accommodation | Hero, imagery/gallery, amenities, location/local information, Rooms and enquiry | Existing optional Rooms domain; no booking functionality |
| Studio/wellness | Hero, classes/services, instructors, studio information, informational schedule and enquiry | Offerings, People and Standard Pages; no booking functionality |

Each preset must differ meaningfully in composition and copy, not just palette. Business type and functional profile remain independent. Default profile is enquiries, sending/marketing disabled; newsletter/nurture retain their existing separate configuration and production restrictions. Themes are suggested defaults, freely selectable independently. Existing typography, semantic tokens, responsive layouts, focus and reduced-motion behavior are reused.

Do not introduce a new Classes domain simply to ship the studio example. Add one later only when structured class/instructor relationships become a real requirement. Preset sample media uses reviewed reusable local assets and clearly illustrative placeholders; never copy client photographs or imply real business claims, testimonials, qualifications or results.

Preset data is versioned, declarative and validated against the same canonical schemas as authored content. Stable identity, section IDs, item IDs, translations, media references and routes obey current contracts. Seeds provide complete English and Greek examples. Generated projects may select one or both supported seed languages, with an explicitly chosen default included in that set. More languages remain an authoring/extension task rather than invented automatic translations.

The accommodation preset deliberately enables Rooms and supplies clearly fictional sample room information. All seeds and links must validate when articles are disabled. Presets do not automatically enable newsletter prompts, tracking or cookies. Real contact/social destinations remain blank where allowed or honest required placeholders.

## Local preview gallery

Add a development-only `/templates` entry point, separate from `/design-system` and the existing EN/EL site. Advertise it in the local launcher output and documentation. Keep `/en`, `/el` and root site routing working as today. Do not silently replace the currently authored site on startup.

The gallery compares the neutral baseline and four presets, describes included pages/modules and offers English/Greek previews with selectable existing themes. Preview choices are URL/local view state only; they never save project.json or CMS documents.

Full previews use the actual layout and registered renderers with a detached validated preset dataset. Introduce explicit preview route/link context where needed; do not rewrite rendered HTML or global canonical content. Internal preview links stay inside that preset/locale. Clearly mark previews; disable contact/signup submission and prevent all business API calls, visitor prompts and persistent subscriber/preferences state in previews.

Register gallery/preview routes only for the local starter experience before Astro builds its client graph. Dedicated gallery/preview assets and fixture-only content must not leak into staging/production. Initialized client projects do not show or register the starter gallery, including when they run locally. Existing design-system availability can remain as separately documented developer tooling.

The gallery may display/copy the initializer command and explain its options. It does not execute shell commands or write a destination from the browser.

## CLI creation and ownership

Provide a documented command such as:

```powershell
pnpm create:project --preset trades --name example-plumbing --destination C:/Projects/example-plumbing --languages en,el --default-language el --theme trades
```

The final CLI must expose help and a dry-run showing resolved destination, selected preset/theme/languages, planned source set and safe reset policy. It must not install dependencies, start servers or provision resources implicitly. Shell snippets are display text; never interpolate user input into a shell command.

Resolve absolute source and destination and inspect path ancestry/symlinks/junctions. Reject the starter itself, ancestors/descendants that could copy recursively, existing repositories, occupied/nonempty destinations, unsafe links and collisions. A pre-existing empty regular directory may be accepted only with complete ownership checks; never delete or overwrite an existing destination to make it usable. Validate all choices before writing.

Use a reviewed explicit source export inventory rather than recursively copying the workspace or trusting the current worktree. A Git-tracked file list may inform that inventory but is not permission to copy every tracked file. Exclude source Git history/remotes, credentials, env files, generated output, dependencies, caches, local D1/captures/subscriber data, test results, historical review evidence, temporary fixtures and client-specific media/content. All filesystem operations use exact validated paths.

Create files exclusively. If creation fails, report what was created and leave unknown/external edits untouched. Never recursively remove a partially created project as automatic recovery. Detect source changes across snapshot/export and refuse mixed-version output. Record starter version, preset version and source revision in a small provenance record, separate from CMS business content; no schema-version bump is needed just to record provenance.

The destination contains copied application source and its selected canonical seed content. It does not read business data from the source starter or depend on preset definitions at runtime. Later starter or preset changes never overwrite destination CMS edits.

Initialize a fresh local Git repository with no inherited remote; do not commit or configure an identity automatically. Report dependency-install, local check/build and run commands for the destination. Do not copy node_modules or credentials to make those commands appear to work.

## Configuration reset and generated-project tooling

Construct destination project.json from reviewed safe defaults, not by spreading the source infrastructure. Set the selected project name, preset/theme/languages, local environment, enquiries default profile, explicit module choices, false content/legal review flags, false sending/marketing flags, placeholder site/mail identity, zero D1 placeholder, empty Access roles/issuer/audience and SNS topic. Remove every source-specific account/resource value. Safe defaults must validate without cloud credentials.

Seed business identity comes from honest preset examples with an obvious place to replace it; initialization never claims to have created a production-ready business website.

Distinguish starter-maintainer tooling from client-project tooling. Export a reviewed application package/script set and client smoke tests that validate the selected configuration, content and routes without assuming the neutral starter's sample IDs or wording. Do not ship scripts that point at excluded starter acceptance fixtures, or copy source-only CI/evidence assuming every customer will maintain the starter repository. Preserve useful portable runtime tests and their required fixtures only when their dependencies are included and their contract is preset-independent. Client `check`, `test`, `build`, Worker dry-run and local run commands must work from the destination.

All SQL migrations, including the Workflow cursor migration, belong to the application export. Existing generated-output ignore rules and configure locking remain active. Hosted identity isolation, retention/deletion, real provider setup, remote migrations, deployment and tagging remain gated by PRODUCTION_READINESS.md.

## Rehearsal and verification

Validate and build the neutral baseline and all four presets in owned disposable destinations without credentials. Cover representative theme/language choices and articles-disabled/module interactions without an unbounded combination matrix. Assert that source worktree content/configuration remains unchanged.

Test initializer refusal of occupied destinations, repositories, traversal/link/ancestry hazards, invalid presets/themes/languages, pre-existing conflicts and injected mid-copy failures. Verify exact exported contents contain no secret files, generated/local state, inherited remotes/history or runtime dependency on the source preset directory. Confirm safe reset values and the migration chain.

Verify the local gallery at 375/768/1440 pixels in English and Greek, keyboard navigation, readable previews and no API writes. Build nonlocal output and initialized projects to prove gallery routes/assets/fixture data are absent rather than merely unlinked.

Rehearse one complete generated business project: install dependencies normally, run checks/tests/build/Worker dry-run, run its local CMS on distinct ports, edit a page/Offering through the real UI, save and reload, and confirm public rendering. Native acceptance follows the existing schema/serializer-derived ownership and exact restoration rules. Do not exercise external sending or delete unknown editor changes.

Use a single final independent review after implementation and address important findings before completion. Record successful commands and the limits of evidence. No release tag, remote push, real business deployment or hosted readiness claim is included.

## Delivery order

1. Preset catalog and validated canonical seeds.
2. Safe initializer and client source/tooling export contract.
3. Local gallery and detached full-page previews, using the shared catalog.
4. Disposable generated-project and CMS rehearsal; nonlocal exclusion proof.
5. Authoring/initialization documentation and final review.

The initializer is implemented before the gallery so displayed commands and preview metadata share a tested catalog and creation contract. Hosted staging remains the next separate phase once owner inputs exist.
