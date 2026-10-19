# Composition C — final whole-branch senior code review

Reviewed: 2026-10-19. Base `9ad9d86`; candidate `7a1296971154c0452381bc3fc6247f658cd56e7e`. Read-only review against the approved design, implementation plan, current execution ledger and accepted task evidence. No subagents, product edits, checkout/index/branch changes, build/test replay, browser/native replay or release actions were performed. Only this report was written.

## Strengths

- The extension boundary is coherent across content registrations, typed datasets, Tina factories and static Astro renderers. Existing named offerings/people/articles consumers survive; the Worker gains one generic context allowlist rather than a Rooms branch. Browser-safe contracts avoid filesystem/media decoding imports.
- Disabled domain directories and explicitly owned Page filenames are excluded before parsing. Native discovery uses only active adapters, and navigation/save filtering avoids reading dormant values. Owned filename/template/contentId checks complement immutable saved Room identity and draft-only creation.
- Rooms publication checks both localized record and localized index against the captured source clock. Generic finalization supplies reciprocal alternatives and canonical paths; the corrected locale schedule handling avoids base-language schedule inheritance. Item copy joins by stable IDs and shared order, with exact membership and no localized fallback.
- Original-image presentation reuses the established server-only source adapter, safe prose renderers and design components. No public Room seeds, navigation changes, theme changes, dependencies, D1 migration or sending-default changes were introduced.
- Detached native validation returns original editor values. The real native tests derive ownership from requests, installed schema and serializer expectations; they exercise creation, bilingual rich/nested correction, reorder, explicit initialization, publication, cancellation and reference removal. Failure-injection coverage addresses independent cleanup, dependent uploads, asynchronous restoration, false restoration results and regeneration after shutdown/ownership conflicts.
- Documentation is unusually explicit about segmented acceptance, missing historical stdout, local-only proof, original-image limitations and approved framework exceptions. The two Task 3 generic corrections are narrow and justified by the resulting import and translation-initialization code, rather than treated as exempt from review.

## Issues

### Critical (must fix)

None found.

### Important (should fix)

None found.

### Minor (nice to have)

1. **Split the native item-control expression into named rendering helpers.** `tina/domains/rooms/items.tsx:12` places image selection, crop selection, reorder buttons and the removal confirmation flow in one long expression. Current behavior is supported by native and pure tests, but future changes to accessibility or recovery are unnecessarily difficult to inspect. Extract small item/source/removal rendering helpers without changing state ownership or native field integration.

2. **Assert localized prose visibility in the no-JavaScript acceptance loop.** `e2e/composition-c-content.spec.ts:28` checks successful responses, one H1, alternatives, layout, image loading and links, but does not assert the expected localized H1 text and detail body are visible. A regression that hides or substitutes the prose could pass this portion of the suite. Add focused EN/EL title/body visibility assertions to the existing loop. This is nonblocking because the static renderers emit the prose directly and existing renderer/native/public evidence provides supporting coverage; it is not a current rendering defect.

3. **Expand the new acceptance orchestration into readable blocks.** `scripts/verify-composition-c.mjs:7` and `e2e/helpers/composition-c-acceptance.ts:19` compress ownership checks, command recording, process execution and completion checks into long statements. The cleanup policy is sound on inspection and fault tests cover meaningful failures, but the format makes future ordering mistakes harder to review. Separate these steps into conventional multiline statements and preserve the current order and error propagation. Avoid a broader harness redesign.

4. **Correct the checked Task 3 no-core-edits statement.** `docs/superpowers/plans/2026-10-18-starter-v2-composition-c.md:111` still checks off “no core algorithm edits” despite the two approved generic-helper corrections. The extension recipe and ruling ledger disclose them correctly, so this is an internal handoff inconsistency rather than an undisclosed deviation. Amend this checkbox to acknowledge renderer-coverage relocation and registered translation initialization, linking the existing rulings.

## Review coverage and evidence

Reviewed the baseline-to-candidate runtime changes across config, registry/declarations/types, loader/catalog/localizer/routes, shared composition changes, Rooms schemas/items, native validation/discovery/collections/controls, Astro dispatch/list/detail/contact, manifest and Worker acceptance. Also inspected the second-domain tests, Rooms/native/publication/enquiry tests, real native/Worker/public/build harnesses, cleanup fault tests, canonical snapshot/showcase changes, extension/authoring documentation and current plan/ledger. Historical copied task reports were treated as supporting history rather than newly authored product code.

Named-risk dependencies inspected include publication helpers, existing Page identity/composition validation, collection save wrapper, media source syntax/server adapter boundary, content watcher/Astro refresh and ownership helpers as consumed by C. Reviewed realistic edge handling for malformed dormant inputs, missing locale/index, independent schedules, unsafe/colliding paths, unknown contexts, nested membership, immutable identity, failed restorers and shutdown failures. No new actionable runtime defect was established.

Retained evidence inspected includes:

- Native `run-LparIL` acceptance and `final-restoration.json`: four Room mutations plus the two separate Page mutations, rejected-save coverage, retained physical uploads on reference removal, exact restoration and unchanged schema claim. The test source establishes the request/schema/serializer ownership procedure; pure tests separately cover object identity.
- Worker `worker-pNUWzP/worker-proof.json` and `cleanup.json`: Offering/Room 202, idempotent retry, draft/unknown/disabled 400, two scalar-text inquiry rows and local captures/jobs, zero recorded outbound calls, sending false, and all final restoration/shutdown flags true.
- Task 6 `public-XJMKoU/public-proof.json`, corrected `pure-matrix-xMQARZ/matrix.json`, final global-gate command ledger/raw test totals, and showcase `run-UoeEIl/evidence.json`. These support the bounded public coverage, twelve pure combinations, seven passed global gates, 640 root + 21 site tests with one opt-in skip, and showcase restoration/exclusion claims.

No test or build was rerun merely to reconfirm retained green results. The six passing full/public tests plus corrected focused pure test remain segmented acceptance; the failed combined entry is not relabeled successful. Task 2's original historical stdout was not retained, so its exact historical baseline equality cannot be independently reconstructed from that missing output. Final gates and readable regression coverage support the current candidate, without replacing the historical limitation.

HEAD resolved to the requested candidate. Sandbox restrictions prevented a normal Git working-tree status check (including an explicit work-tree retry); this review therefore does not independently certify checkout cleanliness. Inspection commands and this report are the only actions taken. The controller should use its authorized closeout inventory to establish final cleanliness.

## Recommendations

Accept the product implementation and proceed with the already planned local closeout. Address the plan wording during final documentation; the readability and stronger no-JS assertions can remain explicitly tracked nonblocking follow-ups or receive one tightly scoped fix wave. Any behavioral change made after this review needs appropriate focused verification and scoped rereview, not another unrelated full replay.

Preserve the final review/ruling archive and the evidence limitations before cleaning the verified C-owned scratch directory. Final stack restart and endpoint verification remain controller closeout work. Known SQLite experimental and FORCE_COLOR/NO_COLOR advisories are not new product failures and do not justify dependency changes here.

## Declined to judge

- Bookings, physical inventory/availability, prices/payment, customer accounts and business presets/initialization: explicitly excluded from Composition C.
- Hosted Tina/Cloudflare/provider readiness, real delivery and deployment/release behavior: not exercised or authorized; local capture-only evidence does not establish them.
- Optimized derivatives/srcsets and a universal original-image loading budget: explicitly deferred; current source bounds and known direct-original performance limitations are documented.
- Accessibility certification, all browsers/assistive technologies, and exhaustive image payload verification: beyond the bounded acceptance evidence; no such claims are approved.
- Atomic multi-editor locking or protection against a concurrent write between an ownership comparison and write: existing best-effort ownership contract explicitly retains unknown edits and discloses this limitation; no transactional locking redesign is in scope.
- External add-only published JSON dev freshness and guaranteed skip-link active-element transfer: disclosed inherited limitations, not introduced by the reviewed C changes.
- Exact historical Task 2 command output that was not retained: unavailable evidence; no fabricated reconstruction or claim of independent verification.
- Final scratch cleanup, final working-tree cleanliness, permanent final-review archival and restarted endpoint readiness: subsequent controller closeout gates, not completed by this read-only review.

## Assessment

**Ready to merge? Yes — technical approval with nonblocking minor follow-ups.** Actual merge/push/tag/deploy remains outside authorization; this verdict approves the candidate for the planned local completion.

The implementation meets Composition C's functional and ownership requirements, and the retained acceptance evidence is credible within its expressly stated scope. No Critical or Important finding blocks acceptance; final administrative closeout and local restart checks must still be completed and recorded.
