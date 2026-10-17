# Composition A Task 5 implementer report

Date: 2026-10-17 (Europe/Athens). Base: `622a9672cb007597b84ca4f389122c9d8f5ef91f`. Branch: `codex/starter-v2-composition`. Task 5 only. No subagents or reviewer were started.

## Delivered behavior and interfaces

- Added immutable `addNavigationItem`, `moveNavigationItem`, `removeNavigationItem` and `setNavigationLabel` operations on native SettingsDocument-shaped lists. `localeKey: null` addresses the default-language shared list; a string addresses an existing native translation key, including regional aliases. Settings values do not carry the project's default locale code, so it is never guessed. Generic declarations preserve the caller's opaque unrelated fields and AST types.
- Shared membership is exact and unique. Add initializes each existing translation's new entry to an explicit empty label. Reorder changes only the shared list; translated lists are resolved by page ID, irrespective of their storage order. Remove prunes the ID from all existing translations without touching Page records. Label editing preserves every unrelated record and AST reference. Operations permit incomplete prose while editing; complete native save validation remains authoritative.
- Native Settings navigation now provides a saved-Page destination chooser, explicit default-language label, keyboard-operable up/down controls, and explicit link removal. It queries all pages with pagination, including drafts, and can refresh the saved catalog. Save still validates against the complete current catalog, so a stale chooser cannot authorize a missing destination. No destination IDs enter the registry/schema.
- Translated navigation editors display fixed shared membership in shared order and edit labels only. The shared control additionally displays the same existing locale label fields. This is required recovery for installed Tina: after a rejected save its form is invalid and blocks nested navigation until successful resubmission. Editors can correct the missing locale label directly and save, then continue using the native nested editors. These are two views of the same canonical Final Form values, with one state owner and no fallback/copy of labels. The cost is additional visible locale inputs in the shared control; no wire/schema fields were added.
- `applyNavigation` batches only changed `navigation` and `translations` containers. It has no Page composition dependency. The native Tina runtime is lazy-loaded to keep collection/schema construction Node-safe. Native Settings parsing now explicitly requires every configured nondefault translation even for direct detached validation; unchanged catalog validation remains responsible for saved destinations and public locale availability.
- Original `beforeSubmit` values/AST identity is preserved. Normalized public Settings maps and every public consumer remain unchanged. No automatic navigation insertion, publication, translated prose or Page deletion is introduced.

## TDD and discoveries

The initial operation module was absent; minimal placeholders then produced five behavioral failures before implementation. Added red/green coverage for required configured Settings translations, atomic Final Form updates, and direct locale-label correction controls. Final focused coverage includes three locales, duplicate/stale IDs, exact label membership, shared versus translated order, legal rich AST reference preservation, missing required labels, current-catalog rejection and EN published/EL draft or missing destination filtering.

Actual native discovery showed Settings uses lowercase `translations`, unlike Pages' `Translations`. All remaining nested Settings selectors were inspected together in a separate read-only browser pass. The first rejected-save flow revealed Tina's invalid-form navigation guard; direct corrective locale editing was added and covered by an observed-red server-render regression. Repeated initial native attempts also caught test-only Page/Settings sequence replacement and one schema recompilation race; those attempts retained evidence and restored only proven owned sources. Immediate public navigation can be aborted by Vite's content-save HMR, so public header assertions use a bounded retry that requires the entire exact expected label sequence and URLs to converge. No production delay/retry behavior was added.

## Verification

- Focused navigation, content documents, native-save and source/evidence ownership regressions: 48 passed. This includes the mandatory evidence-directory and diagnostic/failure-cleanup cases.
- `pnpm check`: passed; strict TypeScript plus 29 Astro files, zero diagnostics.
- Opt-in actual native GraphQL query/save-hook validation against `http://localhost:4010/graphql`: passed. It verifies original return identity with installed native ASTs and explicit submission contexts.
- `pnpm test`: passed, 300 ordinary tests plus two footer tests. The existing optional native-query test is skipped in that ordinary invocation; the actual opt-in run above passed separately.
- `pnpm build`: passed, 22 static pages.
- No isolated CMS build, dependency installation or profile gate was run; the unchanged Settings schema shape and Task 5's focused/native evidence cover this task. Task 6 owns the final broader gate.

## Ownership and boundaries

Evidence is initialized before saving. Every captured save uses the actual native request, installed generated schema and installed serializer to derive the complete expected record. Ownership capture precedes optional diagnostic writes. Separate Settings/Page owners enforce exact Settings restoration before removal of the previously absent owned Standard page; post-test assertions check exact Settings bytes and Page absence. Unknown concurrent content remains protected by the existing unchanged ownership helpers.

Installed local Chromium was reused. The owned launcher was stopped before final broad checks; no source-repository process was stopped. Both read-only repositories remain clean at their pinned HEADs (`bizness-starter`: `7473c0839dca8fadb7d7a8f9cc459cab79aba94f`; `financial-consulting-example`: `0e1e5988dcdcba508300099ccab2643daedf1aad`). No source-repository install, build or save occurred.

No dependencies, new sections, styles, generated tracked assets, raw native mutations, schema migration, hosted changes, deployment, merge, push or tag were added. Catalog freshness remains best effort rather than an atomic filesystem transaction. Known Node SQLite experimental, Tina CLI deprecation, color and line-ending notices remain.

## Final native acceptance and self-review

The final strengthened native suite passed in **18.7 seconds** (19.6 seconds total), with **eight actual native UI saves**, evidence root `.generated/composition-navigation/run-wrJTqy`, Playwright artifacts `.generated/composition-navigation/native-final-retry`. Its final `acceptance.json` is written after exact Settings restoration and owned Page removal assertions, and records both cleanup postconditions as true. It creates Standard through the native UI, publishes EN explicitly, adds shared navigation, proves actual empty-EL validation error and zero mutation, corrects/resubmits the label directly, changes/saves the distinct label through the fixed native Greek editor, verifies missing then draft EL filtering, publishes EL explicitly, verifies correct localized header labels/URLs, reorders with keyboard and removes the link while both Page routes still return 200. The Page file exists after link removal and is deleted only by owned test cleanup after Settings restoration.

Unchanged SHA256 before/after native mutations:

- Schema: `7d168a08f7afd0e9272c4ab007483fcbc9848cead5e2a76c526a656fed097a48`.
- Descriptor: `acf8686c4cb470b32a1b2df6d3a6b8ebd2786365446e1ce18c00bce8153a3eaf`.

An earlier seven-save native acceptance passed in 17.5 seconds (`run-auQw1E`). Final self-review tightened the negative assertion to require the actual `Too small: expected string` error rather than a broad expression that could also match ordinary UI text, and added a distinct persisted edit through the fixed nested Greek editor. The first strengthened run reached seven complete owned saves, then the installed native writer returned `Error in PUT for content/settings/site.json: UNKNOWN: unknown error, open 'C:\Projects\bizness-starter-v2\content\settings\site.json'` on removal. Exact failure trace/screenshot/error context remain under `.generated/composition-navigation/native-final-proof`, with prior successful ownership in `run-f8TJMZ`. The file retained its previous owned bytes, so Settings/Page cleanup succeeded. A single unchanged targeted retry passed all eight saves. No production I/O retry, raw mutation, relaxed assertion or unknown-byte ownership was added; the transient Windows writer failure was not reproduced by that retry.

Owned stack PIDs were first `4772/27712/14584/12724`, then `11484/23808/4664/16136` for the strengthened proof. Both launchers stopped their own process trees; `.generated/composition-navigation/teardown.json` records no remaining observed children. Default ports are free. No isolated CMS build was run beside or after these watchers. Broad suite/build results above precede only final test-assertion/evidence refinements and declaration documentation; production behavior did not change after those gates.

Self-review covered all four operation exports, exact/shared membership, ID-based translated order, original AST identity, same-state correction controls, required configured Settings locales, saved-catalog rejection, no public fallback, no implicit publication/navigation/Page deletion, native complete-record ownership, cleanup ordering and source-repository invariants. `git diff --check` passed before committing. The scoped commit message is `feat: add explicit localized navigation authoring`; independent root review remains outside this implementer task.
