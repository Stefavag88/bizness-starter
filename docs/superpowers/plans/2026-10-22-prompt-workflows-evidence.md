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

## PPConsulting handoff


Independent app: `C:/Projects/ppconsulting`, branch `codex/ppconsulting-design`. Actual initializer source revision `fa16a5f`; scaffold commit `5cee0de`; presentation commit `da7f28a`. See the app's `docs/VERIFICATION.md`, `docs/PRESENTATION_PARITY.md` and configuration map for acceptance evidence and deliberate differences.

Completed 12 app tests, check with no errors/warnings (six baseline hints), 37-page static build, Worker dry-run, 64 browser route/width checks, native Page save/reload and theme palette checks. Independent final review completed on an available model after the first model hit its usage limit; its single P2 light-eyebrow contrast issue was fixed with a failing-then-passing regression. Final isolated release candidate integrity verified, release ID `58a02a975c37aa0156d15d9631917a03284d68f84a1703f1707a9f98cfb095d5`. Production readiness remains blocked; no deployment, remote SQL, account setup or real sending occurred.

The reference Git tree and public content digest were confirmed unchanged. Source starter's unrelated provider-usage edits remain untouched. Minor release-vs-final-source difference is one trimmed trailing space in ArticleCards.astro before committing; no behavior changed after the verified candidate. Local evidence remains in the app's ignored `.generated` directory.

The inline execution ledger recorded field registration, selected-theme descriptor and contrast regressions; native save and final local release gates passed. Source financial reference and unrelated provider analytics edits were preserved.
