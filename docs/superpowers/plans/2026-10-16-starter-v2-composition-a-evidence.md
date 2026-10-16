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

### Task 1 independent review fix round 1

Addressed I1/I2. Conflicts detected by assertUnchanged/restore now permanently revoke ownership before evidence writes, including restore read/write failures. Repeated restore after a created file returns to its former owned bytes preserves the file and rejects again. Three new ownership regressions first observed stale owns=true, then passed after the fix.

The probe retains PID and bounded stdout/stderr live through backward-compatible owned-command callbacks. Command/teardown errors are recorded separately, runner.json is attempted after failed closed-port validation, and the original command error is preserved. Real failure regressions cover exit 7, bounded streams and an actual occupied teardown port with stopped=false. Existing timeout/tree-cleanup coverage verifies the start PID. Touched safety flow is formatted into ordinary blocks.

Final focused pass: 41 tests. Required pnpm check passed with zero diagnostics; pnpm test passed 243 tests with one existing optional skip plus two footer tests. One actual success probe rerun passed, 19.6-second UI / 20.9-second total. New proof: `.generated/composition-probe/run-G9v0HA/evidence/`; CLI PID 37740 exited, port/PID checks passed, error=null, teardownErrors=[], stopped=true, and the new file returned to original absence. Product schema/content and pinned dependencies remain unchanged. Known SQLite/DEP0190/color notices remain documented. No broad product suites were run.

## Task 2 — typed document boundary and static native fields (2026-10-17)

Base: `e4981be61cf8bc88a17d678a96a03c669a99499a`. Project schemaVersion is now exactly 2; starterVersion remains `2.0.0-dev`. Only this starter's neutral Page/Settings seeds and explicit test fixtures were rewritten. The normalized Page/Settings map interfaces, public publication/routes/feed/manifest behavior and pinned dependencies remain unchanged. No migration or alternate disk reader was added.

The browser-safe registry owns six canonical section types, unique native aliases, copy constraints, default variants and detached honest copy factories. `schemas.mjs` imports/re-exports registry contracts; the registry never imports schemas. Strict PageDocument/SettingsDocument validators accept typed copy/label lists and reject duplicate/stale/mismatched IDs, missing required copy, old maps and unknown fields. Detached normalizers produce the existing ID maps. Native projection serializes rich ASTs and normalizes aliases/locales only on a detached value. Save hooks return the original object and ASTs. Existing-page identity and the complete Foundation structural lock compare the current native catalog record matched by relativePath, with public direct helpers rejecting missing page context.

Static native typed copy templates include all six types even with articles disabled, using supported canonical nameOverride aliases. Fixed native child-field rendering preserves installed rich-text controls and provides no independent structural controls. Navigation labels use static fixed object lists. Pages creation stays false. The descriptor retains only project metadata and articlePageFiles; a real descriptor-generation regression confirms adding Standard page/section/nav IDs leaves its bytes unchanged.

Red/green: document tests initially observed undefined ID-map values and acceptance of invalid lists (3 failures); static native tests initially observed list=false for both copy and labels (2 failures). After integration, focused public/document/static tests passed 48/48; current-page/native safety tests passed 22/22; the expanded static registry/descriptor/destination suite passed 5/5. An early full run exposed one stale test requiring identity rejection before native catalog access; it now supplies the current relativePath record and checks the protected identity. No guard was relaxed.

Final required gates:

- `pnpm check`: exit 0, TypeScript and 29 Astro files with zero errors/warnings/hints.
- `pnpm test`: exit 0, 254 unit tests passed / one ordinary optional native-query skip; footer suite 2 passed.
- `pnpm build`: exit 0, 22 static pages.
- Bounded `runOwnedCommand(process.execPath, ['scripts/dev.mjs', '--cms-build'], { timeoutMs: 180000 })`: exit 0. This uses the approved isolated-build-only skip-indexing mode; no watcher was active.
- `CMS_QUERY_URL=http://localhost:4010/graphql pnpm exec vitest run tests/cms-native-query.test.ts`: exit 0, actual full-indexed read-only native query/catalog/collection-hook validation passed across all five collections.
- `pnpm worker:check`: exit 0, local dry-run only, sending/marketing false.
- `git diff --check`: exit 0.

Bounded real browser verification used the owned fully indexed dev:cms stack and installed project-local Chromium, without saves. `.generated/task2-native-read.mjs` verified English/Greek About typed copy titles/prose, English/Greek Settings labels, and public About/Contact at 375/1440 (eight views) with expected text, one H1 and no overflow. Result: zero page errors, zero native write mutations and unchanged SHA-256 hashes for every canonical content file. Retained evidence: `.generated/task2-read/result.json`, four native screenshots and two public mobile screenshots. Harness-only discoveries were Slate paragraph text spacing, the prefixed translated-copy button label and lowercase Settings translations label; final assertions use the actual native UI. An initial native query attempt preceded Tina readiness and returned ECONNREFUSED; rerunning after full indexing passed.

A separate read-only comparison against the base commit (`.generated/task2-baseline.mjs`) confirmed deep equality for all normalized seed records: six Pages, Settings, one Offering, one Person and one Article. Thus this encoding change preserves the complete existing content baseline, beyond the representative browser assertions.

Owned dev children 44268 (watcher), 50744 (Tina), 26156 (Worker) and 47776 (Astro) stopped through the launcher. All configured ports 4330/8790/4010/9010 were subsequently free, and the recorded child PIDs were absent. Both read-only sources retained clean status and original revisions: `7473c0839dca8fadb7d7a8f9cc459cab79aba94f` and `0e1e5988dcdcba508300099ccab2643daedf1aad`.

Limits: this is the static read/editor checkpoint. No product native save/create proof is claimed in Task 2; Task 1 already proved installed aliases and serialization. Custom composition operations, Standard creation and navigation operations remain Tasks 3–5. The full 33-view/profile acceptance remains later work. Known experimental SQLite and local scheduled-Worker notices remain. No real delivery, provider provisioning, deployment, push or tag occurred. Task-level independent review remains the root's gate.

## Task 3 — immutable composition operations and capability guards (2026-10-17)

Base: `66dc7bb7af3213769e233ea842fc0080f954a9ce`. The pure `packages/content/composition.mjs` layer and declarations now export `addSection(values, { type, id, afterId, copy })`, `moveSection(values, id, direction)`, `setSectionEnabled(values, id, enabled)`, `removeSection(values, id)`, `addTranslationCopy(values, localeKey, sectionId, copy)`, `assertPageCapabilities(candidate)` and `assertExistingPageIdentity(candidate, previous)`.

`CompositionDraft` retains the typed-list Page document shape and opaque copy fields/native ASTs. Operations shallow-copy only changed containers; existing rich ASTs and unrelated references stay identical. Callers supply page-local IDs and explicit copy. Add accepts registered optional types, inserts after a real shared instance and starts hidden. Canonical/native copy aliases are compared through the registry without rewriting retained values. Hide preserves all copy; reorder changes references only and keeps the hero first; removal prunes default and every existing translation copy. Explicit translation copy requires existing locale metadata and a shared instance, accepts empty editor drafts, and invents no prose, metadata or publication state. Complete scalar/prose/publication validation still occurs on the detached save projection.

`assertPageCapabilities` protects exactly one enabled first hero and the known `privacy.privacy_details` enabled rich-text instance. Existing-record validation protects contentId, slug, template, hero ID and every retained old section ID/type pair. Optional add/reorder/remove is deliberately allowed. The Page document boundary applies capability checks, and the current-catalog save path uses the new identity guard with the record at the normalized relativePath. Missing context remains closed. Original editor values and ASTs are returned exactly; native metadata/aliases are normalized only on the detached boundary. The catalog check remains best effort, without a transactional concurrency claim.

Red evidence: initially the new module import failed as absent; placeholder operations/no-op guards then produced ten expected behavior failures. Save regressions independently failed the old whole-structure lock and exposed missing privacy document protection (two failures). The explicit empty CTA translation test separately failed scalar draft validation before that path was fixed. Early test fixture assumptions about About having two sections and TypeScript string/tuple inference were corrected from actual seed data and check output.

The first full suite found 43 failures across cms-locales, manifest, publication, localization, foundation-authoring-boundaries, cms-campaign, routes, cms-static-schema, offering-contact and cms-campaign-eligibility. Root cause: shared privacy fixtures used the formerly generic `details` ID, and the old localization reorder fixture moved the hero last. With root approval, fixture IDs/copies now use `privacy_details` for privacy, and the localization regression reorders two optional references while checking both Greek copy associations and the fixed hero position. The final suite has no failures.

Verified commands:

- `pnpm exec vitest run tests/composition.test.ts tests/page-capabilities.test.ts tests/cms-save.test.ts`: 23 passed.
- `pnpm check`: TypeScript and 29 Astro files, zero errors/warnings/hints.
- `pnpm test`: 270 passed, one existing optional native-query skip; footer: two passed.
- `pnpm build`: passed, 22 static pages.
- Final focused run including `tests/localization.test.ts`: 40 passed after strengthening both reordered copy assertions.
- `git diff --check`: passed.
- Both read-only references remain clean at `7473c0839dca8fadb7d7a8f9cc459cab79aba94f` and `0e1e5988dcdcba508300099ccab2643daedf1aad`.

No native UI or create/navigation features, schema regeneration contract changes, dependencies, new types, media or URLs were introduced. Page Create remains disabled and structure/copy controls remain fixed for Task 4. A new Standard draft is capability-valid, but actual Page saves still require existing current context at this checkpoint, so special-template creation also fails closed. No live stack, native saves/build, profile run, Worker dry-run, deployment, push or tag was performed in this pure task. The existing SQLite experimental warning remains. No new independent native-query/UI claim is made; Task 2's prior native evidence is preserved. Detailed handoff: `.superpowers/sdd/2026-10-16-starter-v2-composition-a/task-3-report.md`. Root independent review follows the implementation commit.
