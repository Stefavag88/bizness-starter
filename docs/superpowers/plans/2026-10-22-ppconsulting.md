# PPConsulting implementation plan

> For agentic workers: use superpowers:executing-plans inline with one final independent review, continuing the owner-approved creation/maintenance workflow.

Goal: reproduce the approved financial presentation/content in an independent starter-v2 app named PPConsulting.
Spec: ../specs/2026-10-22-ppconsulting-design.md.
Architecture: initializer-owned scaffold, deterministic legacy-content conversion, reusable typed presentation extension and app-specific composition. No old backend/loaders/database or generated output migration.

## Task 1 — Establish parity and initialize

- [x] Inventory legacy page/content/media/design contracts, routes and existing reference screenshots; record exact mapping to v2 owners and missing capabilities.
- [x] Use creation skill and actual dry-run/initializer scripts for professional-services preset PPConsulting; verify package/source provenance, inert infrastructure and portable guidance.
- [x] Install/check/test/build/Worker dry-run before adaptation; preserve read-only originals and unrelated starter edits.

## Task 2 — Port presentation and content

- [x] Define precise typed theme/section/record extensions needed by the parity inventory; keep neutral presets and required page/CMS contracts intact.
- [x] Write repeatable one-way content/media conversion into the new app only, with input hashes, strict validation and a report of every mapped/unsupported field. Preserve EN/EL slugs/relationships and localized rich text.
- [x] Apply PPConsulting branding, self-hosted approved fonts/licences, advisory palette and reusable component tokens.
- [x] Port header/menu/footer, hero/boundary actions, alternating service groups, perspective/method bands, articles/FAQ and shared contact CTA; implement against v2 data/renderers and native form/newsletter scripts.
- [x] Preserve per-page organization and old configuration intent through explicit CMS/schema ownership. Add meaningful regressions for structural/feature behavior and settings propagation.

## Task 3 — Acceptance and handoff

- [x] Compare all important routes and native CMS fields in EN/EL at desktop/mobile; confirm typography, layout, image composition, interactions and reduced motion.
- [x] Run validation/full tests/site build/Worker dry-run, native save roundtrips with owned fixtures and independent final review; fix real findings with regressions.
- [x] Document configuration map and migration/parity evidence, commit verified app changes, start site/CMS with distinct configured ports and return links.

Production blockers stay intact. Do not claim visual parity from successful compilation alone. New scope or unresolved business inputs must be stated specifically, with independent work continued.

## Completion evidence

Independent app: `C:/Projects/ppconsulting`, branch `codex/ppconsulting-design`. Actual initializer source revision `fa16a5f`; scaffold commit `5cee0de`; presentation commit `da7f28a`. See the app's `docs/VERIFICATION.md`, `docs/PRESENTATION_PARITY.md` and configuration map for acceptance evidence and deliberate differences.

Completed 12 app tests, check with no errors/warnings (six baseline hints), 37-page static build, Worker dry-run, 64 browser route/width checks, native Page save/reload and theme palette checks. Independent final review completed on an available model after the first model hit its usage limit; its single P2 light-eyebrow contrast issue was fixed with a failing-then-passing regression. Final isolated release candidate integrity verified, release ID `58a02a975c37aa0156d15d9631917a03284d68f84a1703f1707a9f98cfb095d5`. Production readiness remains blocked; no deployment, remote SQL, account setup or real sending occurred.

The reference Git tree and public content digest were confirmed unchanged. Source starter's unrelated provider-usage edits remain untouched. Minor release-vs-final-source difference is one trimmed trailing space in ArticleCards.astro before committing; no behavior changed after the verified candidate. Local evidence remains in the app's ignored `.generated` directory.
