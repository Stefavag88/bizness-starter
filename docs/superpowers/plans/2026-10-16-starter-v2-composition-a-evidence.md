# Composition A implementation evidence

## Task 1 — isolated native composition contract (2026-10-17)

Base: `28a0f4d1cce59decf1d7d73b1a4460d2337a32a9`. Product schema/content remain unchanged, including project schemaVersion 1. This fixture is an explicit native serialization proof, not the shipped composition editor.

`node scripts/probe-composition.mjs` passed the real native UI sequence: create a Standard draft, add two shared rich-text instances and English/Greek typed copy entries, edit bold prose, save/reload, reorder only shared references, save/reload, remove one reference and both copies, save/reload, and verify the remaining localized bold editors. All three saves passed complete actual-request/generated-schema/installed-CLI-serializer ownership before optional diagnostics. Exact restoration returned the created record to its original absence.

Observed native create context was `crudType=create`, `form.path=content/pages/probe.json`, `values.filename=probe`, and mutation `relativePath=/probe.json`. The hook completed while the file was absent. Native update context was `crudType=update`, the same form path, no filename, and `relativePath=probe.json`; hook snapshots matched the preceding owned bytes. Native create stripped filename metadata before persistence. Canonical nested `rich-text` aliases, rich ASTs and ID associations survived every save/reload. Reorder saved shared IDs `second,first` while EN/EL copies remained `first,second`; removal left only `second` in all three lists.

Final local proof root: `.generated/composition-probe/run-YXJay6/evidence/`. Retained `saves.json`, `hooks.json`, `last-native-mutation.json`, `restoration.json` and `runner.json` record complete documents/requests, before-persistence evidence and safe teardown. UI result: one test passed in 19.3 seconds (20.6 seconds including worker startup). Owned CLI PID 30760 exited; postconditions verified site 4434, Tina 4024 and datalayer 9024 free. Installed project-local Chromium was reused without download. No Astro/Worker/D1 or source-repository build/save/install was involved.

Ownership red tests covered absent snapshots (initial ENOENT), missing conflict snapshots, and stale ownership after native expectation derivation failed (`owns` incorrectly remained true). All were fixed. A deliberate removal of nested alias application made the contract assertion fail with `rich_text`/`offering_list` instead of canonical names; restoring the implementation returned the focused suite to green.

Final gates:

- Focused native-document/ownership/evidence/probe tests: 34 passed.
- `pnpm check`: passed, 29 Astro files, zero diagnostics.
- `pnpm test`: 238 passed, one existing opt-in native-query skip; footer tests: two passed.
- `pnpm exec playwright test --list`: 34 ordinary tests, isolated probe excluded.
- `git diff --check`: passed.
- Both read-only references retained clean status and original HEADs: bizness-starter `7473c0839dca8fadb7d7a8f9cc459cab79aba94f`; financial-consulting-example `0e1e5988dcdcba508300099ccab2643daedf1aad`.

Known output notices: existing experimental SQLite warning; installed Tina CLI Node DEP0190 shell-option deprecation; Playwright NO_COLOR/FORCE_COLOR notice. No main-stack public/Worker/profile result is claimed for this isolated task. The detailed local implementer report is `.superpowers/sdd/2026-10-16-starter-v2-composition-a/task-1-report.md`; independent task review remains a separate gate.
