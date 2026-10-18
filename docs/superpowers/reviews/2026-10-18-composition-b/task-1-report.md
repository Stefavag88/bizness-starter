# Task 1: FAQ and steps vertical slice

Status: DONE. Worktree: `C:/Projects/bizness-starter-v2`, branch `codex/starter-v2-composition-b`, starting HEAD `9ce61a23695e5cb46d5bcb9d5f1eb329d3dfd73c`.

## Implementation

- Registered `faq` (`default`, `expanded`) and `steps` (`default`, `cards`) through reference/copy schemas, declarations, static native fields, renderer registry and production components. Existing six types retain default-only variants. New references start hidden and receive fresh `items: []` defaults.
- Added registry `referenceFields`, `defaultReference`, `richFields`, optional `itemCopySchema` and `defaultItemCopy` metadata. Reference schemas use registered discriminated types and exact variants. Domain validation rejects duplicate/missing/stale item membership, unsupported variants, unsafe prose and enabled empty sections; hidden empty sections remain valid.
- Added opaque native item operations for add, move, remove, explicit localized initialization and variant selection. Equal item IDs in separate sections remain scoped by section ID. Moving changes shared references only. Removal prunes every supplied locale. New containers preserve unrelated object/AST identity. Malformed default item membership is rejected before structural edits. FAQ/steps media arguments are rejected.
- Extended detached native projection and draft shape checks to registered nested rich paths (`items.*.answer`, `items.*.body`). Bold/link serialization is validated without changing the original editor values, and unsupported AST/HTML remains rejected. `beforeSubmit` returns the original values object.
- Added shared item controls with one Final Form batch, bounded moves, confirmation/cancel, immutable hidden IDs and real fresh native AST defaults. Translation editors expose registered fixed copy children and explicit missing-item initialization, without source/order controls or automatic translated prose.
- Bound nested rich editors to actual dotted field paths under default and translated section copy. Existing recursive Page correction field wiring preserves those fixed list components and supports correction navigation after rejection.
- Added semantic native `details`/`summary` FAQ, expanded FAQ, and ordered vertical/card steps using shared surface, typography, prose, spacing/density, radius and focus behavior. No JavaScript dependency or canonical Home demonstration sections were added.

## TDD evidence

1. Added `tests/section-items.test.ts` and `tests/composition-b-contracts.test.ts` before implementation. Initial combined run exposed the missing section-items module and one incorrect test fixture import. Corrected the fixture import before treating the behavioral run as RED.
2. RED: `pnpm exec vitest run tests/composition-b-contracts.test.ts` -> 2 failing tests. The contract test reported unregistered `faq`, unsupported `expanded`, unrecognized `items` and missing discriminator; nested native answer serialization failed because the projected value remained an AST rather than containing `**Bold**`. Both failures were the expected missing feature.
3. GREEN: `pnpm exec vitest run tests/section-items.test.ts tests/composition-b-contracts.test.ts tests/composition.test.ts` -> 14 passing tests after the domain/operation implementation.
4. RED: added actual Astro variant tests, then ran `pnpm test:footer` -> all four new render cases failed with `Unsupported section faq/default`, `faq/expanded`, `steps/default`, `steps/cards`. The native fixed-editor contract also failed because its module did not exist yet.
5. GREEN: after native/render implementation, the focused native/domain suite passed and `pnpm test:footer` passed all 9 tests, including all four actual production render variants.
6. RED: added malformed default membership tests -> `rejects missing, stale and duplicate default item copies before structural edits` failed (`expected [Function] to throw an error`). Added the scoped membership guard; focused item/contracts run -> 9 passing tests.

## Final verification

All commands ran with the owned dev/CMS stack stopped, sequentially. No reference repository was built, installed, saved or stopped.

- Focused: `pnpm exec vitest run tests/cms-static-schema.test.ts tests/section-items.test.ts tests/composition-b-contracts.test.ts tests/cms-composition-controls.test.ts tests/renderer-registry.test.ts` -> 38 passed.
- Actual Astro: `pnpm test:footer` -> 9 passed across footer, showcase and Composition B suites. FAQ/steps regressions cover H2/item semantics, all four variants, localized safe links/emphasis, escaped raw HTML and absence of nested anchors/scripts/H1.
- `pnpm check` -> exit 0; Astro checked 39 files with 0 errors, 0 warnings, 0 hints. Log: `task-1-check.log`.
- First full suite -> 431 passed, 2 failed, 1 optional skip. Both failures were stale six-type expectations in `tests/cms-static-schema.test.ts`: `declares six static typed copy templates including canonical native aliases with fixed copy membership` and `uses one registry with unique GraphQL-safe aliases and detached honest copy defaults`. Updated those affected exhaustive expectations to eight types. Original log: `task-1-test.log`.
- Final `pnpm test` -> exit 0; root suite 433 passed, 1 skipped (optional `tests/cms-native-query.test.ts` without a running query server); site render suite 9 passed. Log: `task-1-test-final.log`.
- `pnpm build` -> exit 0; 23 static pages built. Log: `task-1-build.log`.
- `git diff --check` -> clean.

Baseline advisory separation: full tests retain Node's known SQLite `ExperimentalWarning`. Vitest prints its transform-cache performance suggestion. The final static build reported no warnings/deprecations, and `pnpm check` reported no warnings. No new warning issue was observed.

## Changed files

- `packages/content/section-registry.mjs`, `section-registry.d.mts`, `schemas.mjs`, `types.ts`, `composition.mjs`, `localize.mjs`.
- New `packages/content/section-items.mjs`, `section-items.d.mts`.
- `tina/validation.ts`, `fields/composition.tsx`, `fields/section-copy.ts`, `fields/rich-text.ts`, `sections/index.ts`; new `fields/section-items.tsx`.
- `apps/site/src/templates/section-registry.ts`, `sections.ts`, new `sections/Faq.astro`, `sections/Steps.astro`, and shared `styles/global.css`.
- New `tests/section-items.test.ts`, `tests/composition-b-contracts.test.ts`, `apps/site/tests/composition-b.test.ts`; affected `tests/cms-composition-controls.test.ts`, `tests/cms-static-schema.test.ts`, `apps/site/vitest.config.ts`.

The existing documents and remaining declarations derive their registry/types and needed no redundant modifications.

## Self-review, decisions and limits

- Read the scoped implementation diff, checked registered variants/copy paths/aliases, retained canonical shared `_template` scalar names, default-hidden behavior, required hero/privacy protections and AST identity boundaries. No broad registry redesign or ownership change was introduced.
- Cancellation inspection: the Cancel handler only clears local pending React state and never calls the mutation operation or batch. Pure operations and the one-batch boundary are covered. Per the controller's explicit ruling, actual Cancel-click/zero-mutation proof remains required in Task 4's real native suite; no DOM runtime/dependency was introduced solely for this check.
- This task claims model/binding/render coverage, not a real Tina save/reload, invalid-save browser recovery or browser accessibility acceptance. Those remain Task 4/5 responsibilities. The native query skip is deliberate because the stack is stopped.
- Used only installed tooling, including the already present Prettier executable to format new modules/tests. No installs, upgrades, downloads, child agents, hosted operations, real sending, pushes, merges or tags. No generated files, logs or ignored scratch reports are included in the task commit.
- Cost/decision discipline: focused tests during iteration; one initial full suite revealed stale exhaustive tests, followed by one amended final full suite after fixing them. Final check and static build ran once after the amendment. No unresolved implementation concern.

Commit: d7909f6 feat: add authorable faq and process sections. Post-commit git status is clean. Git emitted its configured LF-to-CRLF checkout advisories for five new files during staging; these are line-ending notices, separate from check/test/build diagnostics.
