### Task 4: Browser acceptance, extension documentation and closeout

**Files:** Create `e2e/motion.spec.ts`, `scripts/verify-motion.mjs`, `docs/MOTION.md`, `docs/superpowers/plans/2026-10-20-starter-v2-motion-evidence.md`; modify `package.json` for `test:motion`, `docs/{ARCHITECTURE,QUICKSTART,DESIGN_SYSTEM_SHOWCASE}.md`. Use existing guarded fixture/owned-command helpers where compatible; keep browser evidence ignored under `.generated/motion/` and reports under a task-specific reviews directory.

**Interfaces:** `pnpm test:motion` invokes a project-owned acceptance driver, starts only isolated/owned listeners on explicitly chosen free ports, records its source/config inventory, commands/exit codes and screenshot paths, and exits nonzero on any required failed check. Use detached fixtures for motion on/off, custom parameters, Composition B and Rooms. Any in-place fixture must use known expected bytes before claim; foreign writes are preserved and reported, never restored or regenerated over.

- [ ] Add actual-browser cases for EN/EL at 375, 768 and 1440 px covering Home, Contact, an Offering and Article detail, a composed page with FAQ/steps/media/gallery, and enabled Rooms. On normal motion, scroll below-fold targets and inspect real animation timings/opacity/translation; scroll back and re-enter to prove no replay. With custom tokens 950/32/120/240, assert computed CSS and actual keyframe/timing values; do not treat screenshots as proof of timing.
- [ ] Add off, reduced, dynamic preference and JavaScript-disabled cases. Assert content is visible/readable before controller execution and after forced API failure/disposal; no controller request in off mode; hero/H1/form/error/legal/skip remain unanimated. Preserve focus and direct EN/EL encoded/invalid hash navigation; test a pre-existing transform remains unchanged and touch hover does not stick. All cases assert no horizontal overflow.
- [ ] Exercise showcase on/off, theme/language changes, reset and back/forward; check no hidden-language target animates and keyboard focus is recovered before hiding its sample. Assert configured motion and canonical content hashes are unchanged by preview use. Run representative accessibility scans and manual visual/keyboard review, recording scope and limitations.
- [ ] Write English documentation with actual config examples/defaults, semantic token ownership, marker/group extension contract, reduced/no-JS/disabled behaviour, lack of persistence and practical initial-viewport limitations. Update current guides; mark no hosted/provider/launch verification as completed.
- [ ] Stop the exact owned stack, then run sequentially `pnpm check`, `pnpm test`, `pnpm build`, `pnpm worker:check`, `pnpm cms:local-build`, `pnpm test:static-routing`, `pnpm test:showcase-builds`, `pnpm test:motion`. Record explicit completion/exit codes. Never run lifecycle-owning commands against an already running main stack. Restore proven fixtures before the next command; stop on ownership conflicts.
- [ ] Commit `test(motion): verify shared effects and document extension contract`. Author checks requirement coverage, actual computed values, fallback failures and cleanup ownership; repair and rerun affected evidence before the whole-branch review.

## Final review and local handoff

- [ ] Whole-branch review against the approved spec and Task 1 baseline: no Critical/Important findings remain. Resolve findings with targeted regressions and rerun appropriate final gates. Preserve separate task review reports and a coverage matrix; do not reframe failed attempts as accepted evidence.
- [ ] Confirm only the deliberate `project.design.motion.enabled:true` local demonstration change persists; canonical content/themes, source repositories and unrelated local data remain unchanged.
- [ ] Restart `pnpm dev:cms`, record exact owned session/PIDs and verify Home/Contact EN/EL, CMS and indexed Tina query readiness. Report commit IDs, test outcomes, local links and any measured limitations. No push/merge/deployment/tag is part of this plan.

## Plan self-review

All approved design sections map to Tasks 1–4: config/tokens (1), safe lifecycle/fallback (2), explicit renderers/interactions/showcase (3), actual computed-value/browser/failure checks and docs (4). The five Review Focus cases have named owner tasks and assertions. Shared API names and defaults match across tasks. This is a proposed implementation plan, not a claim that effects are implemented or tested.

Execution method: inline implementation, per-task checks and commits, one independent final review. Written plan and revised execution method approved by the user on 2026-10-20.
