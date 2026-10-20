# Starter v2 Shared Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver opt-in, configurable entrance and interaction motion across the static starter while preserving readable, accessible fallback output.

**Architecture:** Validated `project.design.motion` produces external semantic CSS through the existing configure pipeline. A lazy native observer/animation controller enhances explicit renderer targets, and shared CSS handles interaction feedback. The local-only showcase uses the same controller and markers.

**Tech Stack:** Existing Node 22.x or 24.x, pnpm 10.13.1, Zod, Astro, TypeScript, Vitest and Playwright; native IntersectionObserver/Web Animations; no added dependency.

**Spec:** [Approved motion design](../specs/2026-10-20-starter-v2-motion-design.md), approved by the user on 2026-10-20.

## Global Constraints

- Do not change page composition, typography, colours, content ownership or routing. Project Markdown is English; public control copy is EN/EL.
- `enabled: false`; `durationMs: 600` (integer 100–1200); `distancePx: 18` (integer 0–48); `staggerMs: 70` (integer 0–150); `interactionMs: 180` (integer 0–400). Maximum total group delay is 300 ms.
- Motion is developer configuration, not a CMS field, functional profile or section template. Missing configuration defaults safely; strict nested validation rejects unknown keys.
- No hidden/pending CSS state, animation library, persistence, cookies, tracking, external requests, parallax or scroll hijacking.
- Primary hero/H1, header navigation, footer legal content, contact fields/errors and skip links are excluded. Focus and fragment destinations appear immediately; reduced motion takes priority.
- `pnpm configure` owns generated CSS. No manual edits to generated artifacts, unsafe inline configuration, provider setup, deployment or sending changes.
- Stop the exact owned local stack before configuration/CMS changes or lifecycle-owning tests. Both original source repositories remain read-only. Preserve unknown local editor bytes.
- Preserve the requested method: one fresh implementer and independent reviewer per task, sequential dependencies, then whole-branch review. Do not start until the user reviews this written plan. Use the existing agreed medium implementation setting; do not change model settings without authorization or the applicable skill.

## Review Focus

1. Deep links with encoded/malformed fragment IDs: no selector exception, hidden destination or blocked navigation (Tasks 2 and 4).
2. Nested targets, large groups and multiple observer callbacks: no duplicate animations, compounded movement or delay above 300 ms (Tasks 2 and 3).
3. APIs that exist but throw/reject, teardown during animation and repeated initialization: readable output and no leaked listeners or unhandled promises (Task 2).
4. Theme/language preview switches and focus in a sample being hidden: stale sample observers are disposed; existing focus recovery remains intact (Tasks 3 and 4).
5. Existing transforms, sticky touch hover and disabled-project bundles: interaction/entrance effects coexist, touch remains usable and the entrance controller is not requested when disabled (Tasks 3 and 4).

## File responsibilities and handoff

- `packages/config/project.mjs` / `.d.mts`: strict schema and normalized `MotionConfig` type.
- New `packages/design-system/motion.mjs` / `.d.mts`: pure validated token emission, `motionCSS(motion: MotionConfig): string`.
- `scripts/design.mjs`: append motion CSS through existing `generateDesign(design)`; no new standalone generation command.
- `apps/site/src/styles/foundations.css`: semantic fallback/easing and group-delay tokens; new `motion.css`: disabled/reduced overrides and interaction presentation.
- New `apps/site/src/scripts/motion.ts`: reusable browser lifecycle; new `motion-entry.ts`: tiny conditional dynamic import bootstrap. The entry may be shared, but disabled pages must not download the controller chunk.
- `Layout.astro`, section renderers and shared UI components: explicit `data-motion`/group/reveal markers and one bootstrap registration; no ad hoc per-page scripts.
- Showcase layout/component/script: transient on/off demonstration using the actual controller; preserve current theme/density/language contracts.
- `tests/motion-config.test.ts`, `tests/motion-runtime.test.ts`: meaningful configuration and lifecycle regressions; a new scoped browser acceptance spec and driver prove actual rendering under fixtures.
- New `docs/MOTION.md`: configuration, tokens, marker/extension convention, fallback and known limits; update current architecture/quickstart/showcase guides.

### Task 1: Configuration and generated semantic tokens

**Files:** Modify `packages/config/project.mjs`, `packages/config/project.d.mts`, `scripts/design.mjs`, `apps/site/src/styles/foundations.css`, affected expectations in `tests/project-config.test.ts`; create `packages/design-system/motion.mjs`, `.d.mts`, `tests/motion-config.test.ts`.

**Interfaces:** Export `MotionConfig {enabled:boolean;durationMs:number;distancePx:number;staggerMs:number;interactionMs:number}` and make `ProjectConfig.design.motion` normalized/required after parsing. Export `motionCSS(motion: MotionConfig): string`; its numeric input is validated before interpolation. Generated CSS emits `--motion-duration`, `--motion-distance`, `--motion-stagger`, `--motion-interaction-duration`; foundation owns `--motion-max-delay:300ms`, `--motion-ease:cubic-bezier(.22,1,.36,1)` and `--motion-interaction-ease:ease-out`.

- [ ] Write configuration tests with existing `project` fixture: `expect(parseProject(raw).design.motion).toEqual({enabled:false,durationMs:600,distancePx:18,staggerMs:70,interactionMs:180})`; missing `design` and partial `motion` normalize without changing input. Tables reject strings, null, fractional/out-of-range numbers, non-boolean enablement and unknown nested keys. Explicit zero distance/stagger/interaction and all inclusive bounds pass. Update previous exact design-equality tests to include the normalized default, preserving their original assertions.
- [ ] Run `pnpm exec vitest run tests/project-config.test.ts tests/motion-config.test.ts`; observe the new assertions fail against the current schema, not only an import/collection error.
- [ ] Add strict nested schema defaults, declaration type and pure token emitter. An absent motion object is normalized once by `parseProject`; the emitter consumes that normalized result. Have `generateDesign` append emitted values to the same ignored generated CSS. Keep theme registry output and CMS/editor content unchanged.
- [ ] Add assertions for custom `{durationMs:950,distancePx:32,staggerMs:120,interactionMs:240}` emitting `950ms`, `32px`, `120ms`, `240ms`, with deterministic output and no arbitrary string interpolation. Run focused tests and `pnpm exec tsc --noEmit`; inspect an actual `pnpm configure` output, then retain canonical project bytes unchanged in this task.
- [ ] Commit `feat(motion): add validated project settings and semantic tokens`. Independent reviewer checks config compatibility, safe CSS generation and absence of manual generated edits; resolve findings before Task 2.

### Task 2: Fail-open entrance lifecycle

**Files:** Create `apps/site/src/scripts/motion.ts`, `tests/motion-runtime.test.ts` and a focused test-only DOM/API fixture under `tests/fixtures/motion/`. No new runtime/test dependency.

**Interfaces:** Export `initMotion(root: Document | HTMLElement): () => void`. The owning root carries `data-motion="on"` or `"off"`. Targets use `[data-motion-reveal]`; repeated siblings share `[data-motion-group]`. Read computed token values from the root, using its document/window, without importing server adapters. Repeated init on the same active root returns its existing disposer; disposal removes its registration so an explicit later re-init is possible.

- [ ] Write deterministic lifecycle assertions using a small injected document/window fixture and captured observer/media listeners: off, reduced and missing APIs call animate zero times; initially visible/focused/hash-containing targets call animate zero times; crossing an offscreen eligible target calls animate once even with duplicate callbacks and re-entry. Expected delays for ten siblings at 70 ms are `[0,70,140,210,280,300,300,300,300,300]`.
- [ ] Run `pnpm exec vitest run tests/motion-runtime.test.ts` and observe genuine assertion failures for the missing lifecycle before implementation. Record RED/GREEN in the task report; collection failure alone is insufficient.
- [ ] Implement one shared observer per root and one completed-target set. Filter nested reveal markers so an animated target never contains another independently animated target. Use keyframes from opacity 0 to 1 and individual `translate` from `0 <distance>` to `0 0`, with fill `none`; preserve existing `transform`. If a target already has a non-none individual translate, use fade-only keyframes. Use configured duration/easing and bounded direct sibling indices. Unobserve consumed targets and release completed/cancelled handles.
- [ ] Test focusin, initial hash, hashchange, encoded IDs and malformed percent escapes using safe decoding and ID lookup rather than interpolated selectors. Fragment navigation cancels relevant handles and skips newly reached destinations/ancestors. Reduced-motion changes cancel active handles immediately and block further animation while active. A focused target is consumed without movement.
- [ ] Test throwing observer/animate/style APIs, rejected `finished`, preference changes mid-animation and double disposal: cancellation leaves default visible styles, disconnects owned observers and removes listeners; no rejection is left unhandled. Do not use persistent inline styles, hide classes or `commitStyles`.
- [ ] Run focused lifecycle/config tests and TypeScript; commit `feat(motion): add accessible fail-open entrance controller`. Independent reviewer checks all five lifecycle failure paths before Task 3.

### Task 3: Renderer integration, interaction polish and showcase

**Files:** Modify `apps/site/src/layouts/Layout.astro`, `ShowcaseLayout.astro`, `templates/sections/{Hero,RichText,OfferingList,PeopleList,ArticleList,Cta,Faq,Steps,MediaText,Gallery}.astro`, `templates/domains/rooms/RoomList.astro`, `components/ui/{Button,Card,SocialLinks}.astro` as required, `components/showcase/Showcase.astro`, `scripts/design-preview.ts`, `styles/showcase.css`; create `scripts/motion-entry.ts`, `styles/motion.css`, focused render regression tests in `apps/site/tests/` following the existing Vitest config. Enable `project.design.motion.enabled` explicitly in `project.json` only after the integration passes.

**Interfaces:** Public layout emits `data-motion={project.design.motion.enabled ? 'on' : 'off'}`. Bootstrap reads that attribute and dynamically imports `./motion` only for on; initializes once and disposes on page teardown. No inline configuration script. Showcase uses a dedicated root with the same attribute/markers and an explicit EN/EL labelled checkbox, initially matching project config; turning off disposes its controller, turning on initializes it. Preview changes never persist.

- [ ] Add renderer assertions: no reveal marker on the primary hero/H1, form/errors/skip/header/footer; eligible heading/copy wrappers and list items have explicit markers and stable groups; shared card markers do not create nested reveal targets. Use actual Astro render tests rather than snapshotting source text. Run focused render tests and confirm the new assertions fail.
- [ ] Apply markers without changing DOM semantics, IDs, section membership or source copy. Non-primary headings/copy may be grouped in existing containers. MediaText animates copy only; Gallery animates text/captions, not image/background surfaces; FAQ animates heading/intro, not expandable answer controls. Steps and list cards animate bounded items; Rooms follows its existing feature gate. Plain editorial body paragraphs remain untouched.
- [ ] Wire the conditional bootstrap and shared CSS. Interaction rules target `.button`, `.card h3 a` and `.social-link`, use only colour/border/opacity plus at most 2 px of decorative movement, and never `transition: all`. Use hover/fine-pointer media queries. Apply decorative movement to inner links/buttons so an entrance target is not also their moving surface. Preserve immediate static focus indication and disable movement/stagger under reduced or off modes.
- [ ] Add the local showcase example and on/off control. Dispose before theme/language preview swaps, retain existing language focus recovery, then initialize only currently visible sample roots. Ordinary browser back/forward and reset keep the existing preview contract; the motion checkbox is ephemeral and resetting returns to configured state. Do not extend persisted query/config/content schemas for this checkbox.
- [ ] Verify built HTML/bundle references for off mode: no request/import execution of the entrance-controller chunk. A small non-animating conditional bootstrap is allowed. Run focused render tests, `pnpm check`, `pnpm build`; inspect default example after explicit local enablement. Commit `feat(motion): integrate shared effects and local showcase`; independent reviewer approves integration, exclusions, bundle gating and no canonical-content changes.

### Task 4: Browser acceptance, extension documentation and closeout

**Files:** Create `tests/e2e/motion.spec.ts`, `scripts/verify-motion.mjs`, `docs/MOTION.md`, `docs/superpowers/plans/2026-10-20-starter-v2-motion-evidence.md`; modify `package.json` for `test:motion`, `docs/{ARCHITECTURE,QUICKSTART,DESIGN_SYSTEM_SHOWCASE}.md`. Use existing guarded fixture/owned-command helpers where compatible; keep browser evidence ignored under `.generated/motion/` and reports under a task-specific reviews directory.

**Interfaces:** `pnpm test:motion` invokes a project-owned acceptance driver, starts only isolated/owned listeners on explicitly chosen free ports, records its source/config inventory, commands/exit codes and screenshot paths, and exits nonzero on any required failed check. Use detached fixtures for motion on/off, custom parameters, Composition B and Rooms. Any in-place fixture must use known expected bytes before claim; foreign writes are preserved and reported, never restored or regenerated over.

- [ ] Add actual-browser cases for EN/EL at 375, 768 and 1440 px covering Home, Contact, an Offering and Article detail, a composed page with FAQ/steps/media/gallery, and enabled Rooms. On normal motion, scroll below-fold targets and inspect real animation timings/opacity/translation; scroll back and re-enter to prove no replay. With custom tokens 950/32/120/240, assert computed CSS and actual keyframe/timing values; do not treat screenshots as proof of timing.
- [ ] Add off, reduced, dynamic preference and JavaScript-disabled cases. Assert content is visible/readable before controller execution and after forced API failure/disposal; no controller request in off mode; hero/H1/form/error/legal/skip remain unanimated. Preserve focus and direct EN/EL encoded/invalid hash navigation; test a pre-existing transform remains unchanged and touch hover does not stick. All cases assert no horizontal overflow.
- [ ] Exercise showcase on/off, theme/language changes, reset and back/forward; check no hidden-language target animates and keyboard focus is recovered before hiding its sample. Assert configured motion and canonical content hashes are unchanged by preview use. Run representative accessibility scans and manual visual/keyboard review, recording scope and limitations.
- [ ] Write English documentation with actual config examples/defaults, semantic token ownership, marker/group extension contract, reduced/no-JS/disabled behaviour, lack of persistence and practical initial-viewport limitations. Update current guides; mark no hosted/provider/launch verification as completed.
- [ ] Stop the exact owned stack, then run sequentially `pnpm check`, `pnpm test`, `pnpm build`, `pnpm worker:check`, `pnpm cms:local-build`, `pnpm test:static-routing`, `pnpm test:showcase-builds`, `pnpm test:motion`. Record explicit completion/exit codes. Never run lifecycle-owning commands against an already running main stack. Restore proven fixtures before the next command; stop on ownership conflicts.
- [ ] Commit `test(motion): verify shared effects and document extension contract`. Independent reviewer checks requirement coverage, actual computed values, fallback failures and cleanup ownership; repair and rerun affected evidence before the whole-branch review.

## Final review and local handoff

- [ ] Whole-branch review against the approved spec and Task 1 baseline: no Critical/Important findings remain. Resolve findings with targeted regressions and rerun appropriate final gates. Preserve separate task review reports and a coverage matrix; do not reframe failed attempts as accepted evidence.
- [ ] Confirm only the deliberate `project.design.motion.enabled:true` local demonstration change persists; canonical content/themes, source repositories and unrelated local data remain unchanged.
- [ ] Restart `pnpm dev:cms`, record exact owned session/PIDs and verify Home/Contact EN/EL, CMS and indexed Tina query readiness. Report commit IDs, test outcomes, local links and any measured limitations. No push/merge/deployment/tag is part of this plan.

## Plan self-review

All approved design sections map to Tasks 1–4: config/tokens (1), safe lifecycle/fallback (2), explicit renderers/interactions/showcase (3), actual computed-value/browser/failure checks and docs (4). The five Review Focus cases have named owner tasks and assertions. Shared API names and defaults match across tasks. This is a proposed implementation plan, not a claim that effects are implemented or tested.

Execution method is already supplied: subagent-driven implementation with a separate review per task. Await user review of this document before creating the execution checkout/branch or changing product code.
