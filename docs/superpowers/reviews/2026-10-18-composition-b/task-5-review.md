### Spec Compliance

- ❌ Issues found: Task 5 delivers the requested samples, public matrix, provenance, build inventories and documentation, but its cleanup failure paths do not fully meet the guarded-restoration/safe-rebuild requirement (e2e/composition-b-content.spec.ts:158; e2e/composition-b-builds.spec.ts:80).
- ⚠️ Cannot verify from this diff: unchanged Tasks 1–4 native/schema/media implementation and historical routing/auth behavior remain outside this task-scoped review. The controller should retain their earlier independent proofs and perform the planned final whole-branch review. I did not repeat native saves, full suites, builds or browser runs.

### Strengths

- apps/site/src/components/showcase/Showcase.astro:37 selects the actual registered variant. apps/site/src/components/showcase/samples.ts:24 adds all eight new pairs with localized copy and explicit original sample alt text; registry-exhaustive tests/showcase-samples.test.ts:11 and real Astro assertions in apps/site/tests/showcase.test.ts:19 cover the resulting fourteen pairs and twelve bilingual image instances.
- e2e/composition-b-content.spec.ts:35–155 checks the actual public variants, disclosure keyboard behavior, no-JS text, translation omission, decoded intrinsic dimensions, fixed frames/crops, representative themes/densities, upload replacement and visible errors. Retained run-8qDP0H/live-media.json records unchanged schema hashes, the two expected PNG hashes/dimensions and actual full-reload messages; eight retained axe files contain zero violations. Viewed the retained en-375.png overview; detailed manual visual quality remains the implementer's bounded claim.
- docs/STARTER_SAMPLE_ASSETS.md:3–12 and docs/assets/create-starter-samples.py:29–32 make the original-art provenance, exclusive offline creation, ordinary public availability and original-image performance limits explicit. Actual run-9eHpjU inventories retain both exact PNG hashes in all three environments, zero dedicated preview entries in staging/production and two local dedicated entries. The verifier change preserves existing leakage classification (scripts/verify-showcase-builds.mjs:22).
- e2e/composition-b-builds.spec.ts:78–79 independently attempts Page/project restoration. Retained run-Uu5gHp restoration.json has matching project hashes and full before/after content/upload maps, both owners restored, fixture removed and no cleanup errors; public.json records EN/EL, eight variants, absent article routes/feed and no CSP/runtime errors. These successful-run facts do not exercise the failure paths below.

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- e2e/composition-b-content.spec.ts:158–161 — Independent cleanup is short-circuited. If monitor.close rejects, neither owner is cleaned up. More concretely, if the fixture Page acquires unknown bytes during the upload phase, owner.replace deliberately rejects/revokes its claim and media.restore is never reached. The independently owned PNG can remain in public/uploads and enter later builds, even though its bytes remain safe to remove. The suite-level afterAll only restores the Page, so it cannot recover that PNG. Attempt monitor close, known Page restoration and media restoration independently; aggregate errors after all attempts while preserving the conflicted Page. A focused injected Page-conflict case while the PNG is still owned should prove safe PNG cleanup and preservation of unknown Page bytes.
- e2e/composition-b-builds.spec.ts:73–89 — The restore build is gated only by Page/project restoration. A rejected server.stop is collected at line 74 but configure/build still run at lines 82–83. Likewise the broader canonical/content/upload snapshot is compared only after regeneration (line 89), so an external edit to Home or an upload is consumed by configure/build before the test notices the conflict. This contradicts the stopped-runtime/safe-regeneration boundary. Track confirmed runtime shutdown and compare the restored full source snapshot before either regeneration command; preserve unknown inputs and record a skipped rebuild if either prerequisite fails. Keep the independent owner restoration attempts. Focused shutdown-rejection and external canonical-edit cases should assert that neither command runs.

#### Minor (Nice to Have)

- docs/superpowers/plans/2026-10-18-starter-v2-composition-b-evidence.md:33 — Diagnostic output is not pristine: retained test/install/browser logs report existing SQLite experimental, FORCE_COLOR/NO_COLOR and ignored dependency-script notices. These are disclosed baseline/toolchain notices, not evidence of a new product defect; no dependency change or broad replay is warranted for this task.

### Checks and limits

- Read the supplied brief, implementer report and complete 1,110-line review package. Initial oversized tool output truncated; re-read only those review-package ranges in bounded chunks. No changed source file was recrawled and no Git diff/status command was run.
- Named outside-diff risk: whether ownCompositionBPage can safely overwrite unknown fixture bytes. Inspected e2e/helpers/cms-source-ownership.ts:33–162: it compares complete known records, creates exclusively, revokes conflicts and preserves unknown bytes. Its deliberate rejection confirms the first cleanup finding rather than excusing it.
- Named outside-diff risk: whether independently owned media cleanup can safely run after a Page conflict. Inspected e2e/helpers/owned-media.ts:59–163: exact caller-known buffers, containment checks, permanent revocation and guarded restore make that independent cleanup appropriate.
- Read retained public/build restoration, live-media, inventory, reference-snapshot and acceptance-tail evidence without regenerating it. Public 10/10, built showcase 7/7, articles-disabled 1/1 and Astro render 16/16 tails match the report; final check evidence has 44 files with zero errors/warnings/hints. Reference snapshots record matching start/end HEADs and clean status for both read-only references. These are retained run evidence, not freshly reproduced executions.
- Declined full-suite/native/browser/build replay and unchanged implementation recrawls as instructed. No focused executable test was necessary to establish the two direct cleanup control-flow gaps; the scoped failure-injection tests above are recommended for the fix wave.

### Assessment

**Task quality:** Needs fixes.

**Reasoning:** The showcase/public implementation and retained successful acceptance evidence are substantial and consistent. Two bounded harness cleanup defects need correction so failure/conflict runs uphold the same ownership and rebuild guarantees as the successful runs.

