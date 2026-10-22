# Prompt-driven workflow verification — 2026-10-22

The owner approved creation/maintenance skills and portable guidance, followed by independent creation of PPConsulting. The source financial app stays read-only. Inline implementation with one final independent code review; behavioral skill assessment is a separate read-only test.

## Verified results

- Real initializer regression RED: generated client lacked AGENTS.md and the inspection module. GREEN after the explicit client overlay and runtime exports.
- Read-only inspector works without generated output and leaves canonical input unchanged; invalid input rejects without rewriting it. It reports actual profile/modules, Page/section IDs, visibility, surfaces/variants, newsletter prerequisites and client/source inventory ownership without infrastructure secrets.
- Generated client receives exactly the portable AGENTS template, maintenance skill, configuration map and scripts; source-only creation skill and initializer tooling stay absent. Both explicit source inventories remain synchronized.
- Skill metadata validators pass. Baseline agent correctly inferred existing owners while identifying portable guidance gaps; no artificial behavioral failure was invented. Forward assessment used actual schemas/report and preserved an existing modal while adding inline footer signup, identified correct phone/visibility/surface owners, and avoided assuming muted means lighter. This is behavioral evidence, not a model-compliance guarantee.
- Independent final review found an Important missing release-inventory maintenance instruction and a Minor ambiguous order property. Both were verified; ordering was regraded Important because exact strict-schema ownership is this feature's purpose. Inventory discovery test RED undefined then GREEN; guidance now distinguishes clients' release source list from source starter's initializer list and generated manifests. Reordering means moving section array entries, never creating an order field. No deferred minors.
- An existing preset-snapshot fixture failed because its manually copied source omitted the newly required client AGENTS template. The fixture was updated, not the runtime validation bypassed; its successful generation test now includes useful failure diagnostics.
- Final pnpm check: 77 Astro files, zero errors/warnings/hints.
- Final pnpm test: 1,211 main tests and 47 rendering tests passed; one existing opt-in native-query test skipped.
- pnpm build: 416 local pages. pnpm worker:check: successful local dry-run.

Raw evidence remains in .generated/prompt-workflows-*.log, prompt-inventory-red.log and prompt-fixture-green.log. No source files were changed by behavioral assessments. No cloud resources, credentials, real sending, remote SQL or deployment. Verification includes unchanged pre-existing worker/provider-usage.ts and tests/provider-usage.test.ts edits; they are excluded from the commit, so this is working-tree rather than clean-HEAD evidence.

## Decisions

The owner's explicit go authorizes the agreed workflows and PPConsulting creation; the written specs formalize this scope without duplicate approval rounds. Scope changes would require local rework. Reuse the current starter branch, preserving unrelated edits. New application uses ppconsulting as technical/folder identifier, PPConsulting as visible brand, EN/EL and the reference's English default. A different default locale would require an explicit config/content change before launch. The app is independent; source creation instructions are intentionally not portable runtime dependencies. Hosted setup remains separately gated.

The presentation/content migration has its own spec and plan; scaffold success does not establish visual parity or completed migration.
