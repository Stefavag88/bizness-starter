# Final whole-branch review — design-system showcase

Range: d820c718889caadefa94e0d67e75b0cd423beed2..e62a8316d1a11556b1ebc0bc258f4ef0d6ea6524.

Reviewed the approved design/plan, ledger, four-commit package, tracked evidence, changed implementation/tests, and focused producer/consumer dependencies. No builds, tests, process stops, CMS saves, or implementation changes were performed by this reviewer. Existing evidence is credited without claiming a fresh rerun. Root additionally reports fresh 376+5 passing tests (one optional skip) and 36-file strict check with zero diagnostics after stopping its owned stack.

## Strengths

- Pure URL state preserves unrelated parameters/hash and resolves duplicate/invalid values using explicit allowlists. The browser controller imports only pure state and generated metadata, uses textContent, and restores focus before hiding language groups.
- Detached samples reuse actual registered renderers/shared components and valid required Contact destinations. Render/browser evidence covers no-JavaScript defaults, unique IDs, one H1, language visibility, and read-only behavior.
- Theme records retain supported fonts and unchanged validation. Shared responsive density preserves the documented Hero/component exceptions and Comfortable baseline.
- Owned verification retains originals/evidence and refuses detected competing edits/deletions. Supported external asset packaging preserves existing CSP. The approved best-effort concurrency limitation is disclosed.

## Issues

### Critical

None.

### Important

**I1 / P2 — Exclude showcase assets as well as HTML and verify that boundary.**

Files: `apps/site/src/pages/design-system/[...index].astro:2-5`, `apps/site/src/layouts/ShowcaseLayout.astro:12`, `scripts/verify-showcase-builds.mjs:10-18`.

The route always imports ShowcaseLayout, which imports showcase CSS and contains the bundled preview script. Empty getStaticPaths suppresses page HTML, not the client build graph. Installed Astro collects every route in `dist/core/build/page-data.js`, discovers the layout script in `plugins/plugin-analyzer.js:62-69`, and builds discoveredScripts as client entrypoints in `static-build.js` before generatePages evaluates static paths. The current route gate therefore does not exclude the preview executable asset from staging/production builds.

assertOutput checks the route directory and HTML/XML/JSON only, never emitted JS/CSS/client entrypoints. The ten verifier tests also cannot catch an asset-only leak. Retained nonlocal evidence establishes 22-page HTML exclusion, not asset exclusion. Current local output identifies dedicated `ShowcaseLayout.astro_astro_type_script_index_0_lang.BojS7CWA.js` and showcase CSS; no nonlocal asset inventory was retained for direct inspection. This finding is based on the installed build pipeline and verification gap, not a fresh nonlocal rebuild.

This violates explicit plan Review Focus 3: a development tool must not remain deployed as an asset after its route disappears. It is an isolation/acceptance defect, not a claim of exposed secrets or remote execution.

Fix the nonlocal build graph using the installed Astro's supported mechanism so showcase-only script/style assets are excluded. Add a verifier regression with only leaked preview JS/CSS and retain a real staging/production asset inventory. Expected artifacts: no preview controller/ShowcaseLayout script or showcase-only CSS; shared theme/global CSS and normal business assets remain. Run only affected artifact/CSP checks afterward; native CMS saves need no replay.

### Minor

**M1 / P3 — Make verifier/browser workflows readable.**

Files: `scripts/verify-showcase-builds.mjs:20-44`, `e2e/design-system.spec.ts:22-49`.

Ownership checks, restoration, evidence recording, and browser assertions are compressed into long lines. This obscures error precedence and coverage changes. Format into readable phases and extract obvious repetition without broad refactoring. Existing coverage makes this nonblocking. This confirms the already deferred Task 4 minor rather than adding an overlapping issue.

## Declined to judge

- Composition B/C sections, presets, media/social/visitor modules, hosted deployment: explicitly deferred roadmap.
- Atomic protection between filesystem comparison and replacement: accepted existing best-effort contract; detected conflicts are preserved and limitations documented.
- Universal accessibility/all possible color combinations: acceptance promises existing validator requirements and representative checks, not certification.
- Performance cost of globally external assets: explicitly approved compiler settings with recorded packaging/request cost; no measured regression or budget established.
- Existing SQLite/environment color warnings: not introduced functional failures.
- Native CMS/profile/save and reference-repository runtime behavior: unchanged contract/read-only scope; unnecessary revalidation avoided.

## Technical verdict

**Ready for acceptance: With fixes.** Otherwise aligned with the approved increment and supported by strong focused evidence. Resolve I1 with actual nonlocal asset exclusion and a regression gate before claiming complete production exclusion. M1 may remain documented. No merge, push, deployment, or release approval is implied.
