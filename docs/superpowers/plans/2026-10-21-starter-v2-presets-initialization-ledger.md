# SDD ledger — plan: docs/superpowers/plans/2026-10-21-starter-v2-presets-initialization.md

Execution base: 56ea47d. Branch: codex/starter-v2-presets.
Ruling: use the explicitly approved v2 checkout in place on its dedicated branch — the plan specifies this repository and existing installed/runtime tooling — concurrent edits affect this checkout, no other repository is touched.
Pre-flight: Task1→2/3/5 bundle files and project are shared; projectPresetBundle supplies detached projections without source writes. Consistent.
Pre-flight: Task2→3 snapshot exact bytes/ownership and client package transform are shared. Consistent.
Pre-flight: Task3→5 CLI options/display quoting shared. Consistent.
Pre-flight: Task4→5 render context optional default preserves canonical consumers. Consistent.
Pre-flight: Task1-5→6 all client exports, preview routes and native ownership shared. Verify source-only import closure and outputs in generated clients.
Task 1: started at 56ea47d; baseline verification running.

Task 1: Ruling: premature precommit task-done record removed; successful evidence retained in task1.log and task1-full.log; completion recorded after commit.
Task 1: complete (commits 56ea47d..86a1a2e, tests: pnpm exec vitest run tests/preset-bundles.test.ts tests/content-schema.test.ts tests/rooms-publication.test.ts tests/publication.test.ts tests/manifest.test.ts →    Duration  2.37s (tests 47%, import 35%, transform 17%, worker 1%))
Task 2: complete (commits 86a1a2e..038db5e, tests: pnpm exec vitest run tests/initializer-export.test.ts tests/preset-bundles.test.ts →    Duration  2.05s (tests 82%, import 9%, transform 9%))
Task 3: complete (commits 038db5e..5026e0a, tests: pnpm exec vitest run tests/project-initializer.test.ts tests/initializer-export.test.ts tests/preset-bundles.test.ts →    Duration  4.26s (tests 85%, import 8%, transform 6%))
Task 4: complete (commits 5026e0a..f8c7473, tests: pnpm exec vitest run tests/render-context.test.ts tests/public-links.test.ts tests/rich-text.test.ts →    Duration  715ms (import 57%, transform 35%, tests 4%, worker 3%))
Task 5: complete (commits f8c7473..1350a21, tests: pnpm exec vitest run tests/preset-routes.test.ts tests/render-context.test.ts →    Duration  812ms (import 46%, transform 34%, tests 18%, worker 1%))

Task 1: Ruling: use Offerings/People and a Standard timetable for studio — the approved scope excludes bookings and a new Classes domain — richer scheduling requires a separate integration.
Task 2: Ruling: identify reviewed dirty source by exact file digest plus HEAD — a clean working tree is not required by the spec, and the exported bytes are immutable within the operation — HEAD alone cannot reproduce uncommitted bytes.
Task 3: Ruling: add sourceDigest to provenance — it identifies the explicit snapshot in addition to revision/preset versions — consumers must tolerate the documented additional field.
Task 4: Ruling: route safe rich-text links through the Markdown token renderer — preserve escaping and eliminate HTML rewriting while accepting an optional resolver — shared renderer regressions need coverage, supplied by existing link/rich-text tests.
Task 5: Ruling: use a native server import for preset bundles during prerender — bundling import.meta.url filesystem readers relocated theme/media paths into nonexistent output directories — this preview-only adapter requires the source checkout while building and is excluded from clients/nonlocal graphs.
Task 5: Ruling: use installed Chrome via optional E2E_BROWSER_CHANNEL — Playwright's managed Chromium is absent on this machine — evidence covers Chrome on Windows, not every browser.
Task 6: Ruling: retain owned rehearsal client directories and per-command logs — preserves inspectable projects for the real CMS roundtrip and avoids recursive cleanup around pnpm links or unknown edits — uses local disk until the owner removes reviewed directories.
Task 6: Ruling: provide a portable client CMS guide instead of source history — source authoring docs link historical maintainer evidence absent from exports — the concise guide omits maintainer-level details available in the source repository.
Task 6: Finding fixed: disabled Articles inferred empty JSON arrays as never[] in Worker consumers — manifest-types.test.ts RED to GREEN with a contract-typed generated-manifest adapter; independent matrix repeated.
Task 6: complete (commits 1350a21..b614e23, tests: pnpm exec vitest run tests/preset-verification.test.ts tests/preset-bundles.test.ts tests/initializer-export.test.ts tests/project-initializer.test.ts tests/preset-routes.test.ts tests/render-context.test.ts tests/manifest-types.test.ts →    Duration  6.56s (tests 78%, import 12%, transform 10%))

Final review: independent gpt-6-astra, read-only range 56ea47d..b614e23. Three Important findings and two Minor findings; original report archived at closeout.
Final: Ruling: regrade partial-write inventory omission from Minor to Important — a reasonable user recovering a failed export needs every created file, including a truncated one — leaving it unfixed would make recovery reports incomplete.
Final: minor (deferred): dry-run output lacks a resolved selection/reset summary; current output shows planned paths, revision and next commands, and the provided options remain explicit.
Final: Ruling: hosted provisioning/identity/provider/retention readiness stays blocked and outside this local implementation — the owner explicitly deferred resources and retention decisions — the local proofs do not certify hosted production.
Final: Ruling: use fresh Node generation with pre-captured verified inputs — static module caches could generate old seed content with new fingerprints — adds one short local process per initialization, not a client runtime dependency.
Final correction: destination dot-prefix ancestry, late/cached seed/media fingerprints, intermediate junction writes and partial-write inventory all reproduced as five failing tests before changes.

Final: Ruling: give initializer integration tests a file-local 20-second budget — the fresh verified child process plus real disk/Git work took 5.9 seconds under the full parallel suite, while all correctness assertions passed in focused runs — only these integration failures may take longer to report; no global test budget or implementation assertion is weakened.

Final: fixed dot-prefix descendant ancestry — rejects dot-prefixed descendants before destination creation RED to GREEN; full suite 1095 root +44 Astro passed, one pre-existing skipped.
Final: fixed late/cached seed/media snapshots — current cached seed and generation-to-fingerprinting edit regressions RED to GREEN; five-preset project/content/media byte parity passed; full suite 1095+44.
Final: fixed cached intermediate junction writes — moved apps ancestor with external junction RED to GREEN, no additional external package.json written; full suite 1095+44.
Final: fixed incomplete-write inventory — ENOSPC fixture RED to GREEN, newly created partial package.json included; full suite 1095+44.
Final verification: pnpm check zero errors/warnings/hints; post-correction tsc passes; pnpm test 1095 root +44 Astro pass, one skipped; public CLI Greek-only dry-run passes without creating a destination. No application export bytes changed in the correction; Node initializer-only changes therefore use parity/safety regressions rather than repeat five dependency installs and unchanged browser/native suites.
Final closeout: keep the approved local branch in place; no merge/push/tag/deployment requested. Archive this ledger, original review and verification logs before removing only this plan's scratch workspace.
