# Composition A final whole-branch review

Date: 2026-10-17. Reviewed BASE 28a0f4d1cce59decf1d7d73b1a4460d2337a32a9 through HEAD f49deb78f348d27184b7d8766627d054b8e1a6a5 using the supplied seven-commit review package. Read-only review; no subagents, source changes, native writes, builds or suite reruns. This report is the only requested output file.

## Strengths

- The single schemaVersion 2 wire format consistently reaches filesystem loading, native detached validation, static template declarations and explicit test factories. Public Page/Settings maps and static renderers retain their established contracts.
- Shared reference scalars remain canonical while typed-copy aliases use the installed serializer contract. Structural operations retain existing native AST references, change only necessary containers and batch related form updates. Current filename-based identity validation avoids trusting candidate IDs or stale descriptors.
- Creation is explicitly Standard/draft, flat-path and collision guarded, without implicit navigation or translated publication. Required hero/privacy structure and Contact's template-owned form remain protected. Navigation owns shared order and membership while publication remains locale-specific.
- Ownership proof is derived from actual request/schema/serializer inputs, with permanent conflict revocation and diagnostic-failure coverage. Settings restoration precedes destination removal. The isolated probe stays outside ordinary browser runs.
- Acceptance evidence separates actual native saves, read-only inspection, public fixtures, isolated builds, profiles and known failures. Checked concrete Task 4 acceptance hashes, Task 5 eight-save acceptance/restoration, Task 6 gate timestamps, read-only native hashes and final invariant records. The recorded broad checks are substantial; I did not rerun them simply to reconfirm reported results.

## Issues

### Critical (Must Fix)

None found.

### Important (Should Fix)

**I1. Preserve a correction path after an incomplete Page save is rejected.**

- Location: `tina/fields/composition.tsx:106`, `tina/fields/composition.tsx:303`, and `tina/collections/page.ts:40`.
- Reproduction: open a saved Standard page without Greek copy, use Initialize Greek copy, then press Save at the root before filling the new localized metadata/hero. Initialization deliberately creates empty required titles. Validation throws, but those fields can only be reached through nested native object editors. The installed Tina Group refuses to open those editors while the form is invalid. Pages have no equivalent of the same-state correction controls added to Settings. New Standard creation with incomplete nested metadata has the same exposure.
- Evidence: installed `node_modules/tinacms/dist/index.js:3556` catches the beforeSubmit rejection and returns FORM_ERROR; the Group click handler at line 6799 checks `state.invalid` and returns with "Cannot navigate away from an invalid form." A read-only in-memory invocation of the installed Final Form confirmed invalid=true after the rejected submission and still true after an unrelated root edit. Task 5's actual discovery and permanent decision document corroborate this exact installed behavior. Page controls expose no root-level editor for the missing localized titles and no safe correction/reset mechanism. The successful Page native test fills all required nested fields before Save, so it does not cover this failure path.
- Impact: an ordinary early Save traps the editor outside the fields needed to fix the error; reloading/discarding loses unsaved work. This is a recoverability requirement of the newly enabled creation/translation workflow, not a future-stage feature.
- Fix: provide a correction path to the actual invalid nested Page fields while preserving current form values and ASTs. Do not weaken required-field validation, swallow save errors, fabricate translated text, or silently discard edits. Add a targeted real-native regression: initialize an incomplete locale, reject Save with zero mutation, reach/correct its metadata and hero, save successfully, reload and prove exact owned restoration. Also cover incomplete create metadata with the chosen common recovery mechanism.

### Minor (Nice to Have)

**M1. Enforce initially absent fixtures before the first direct write.**

- Location: `e2e/composition-content.spec.ts:21` and `e2e/composition-content.spec.ts:63`; same direct-write pattern at `e2e/composition-cms.spec.ts:358`.
- Timestamp naming plus allowCreate does not establish absence: createCmsSources also accepts an existing file and backs it up. The public test can therefore temporarily overwrite an existing timestamp-named file, and later asserts absence despite restoring that original. The separately Node-owned collision fixture has the same assumption. This is low probability and restoration remains guarded, so it is nonblocking, but the advertised absent-source fixture contract should be explicit.
- Assert originalState(path).exists is false before writing; preferably use an exclusive first write so a file appearing between the check and creation is preserved. Keep normal guarded update/restoration behavior afterward.

**M2. Validate translated navigation membership with own IDs at the wire boundary.**

- Location: `packages/content/documents.mjs:74` and `packages/content/documents.mjs:80` (delegating to `packages/content/schemas.mjs`'s inherited-property membership check).
- A valid shared pageId of `constructor` with no matching translated list entry passes normalizeSettingsDocument. The projected ordinary object inherits constructor, so the domain check using `id in translation.navigation` treats it as present. Read-only reproduction returned accepted=true, ownTranslatedLabel=false and lookupType="function".
- The complete catalog still rejects this malformed candidate when localization attempts to clone the function; this is **not** a bad-save bypass and is not a second Important finding. It nevertheless violates the strict standalone document boundary and yields a misleading clone error instead of the missing-label error.
- Compare exact own IDs/sets at the document boundary, or use Object.hasOwn in the normalized membership validator, with a regression for constructor. Keep valid IDs supported rather than silently reserving this word.

**M3. Expand compressed boundary tests when next touching them.**

- Location: `tests/content-documents.test.ts:6` and `tests/cms-static-schema.test.ts:4`.
- Several independent mutations/assertions occupy single long lines. This makes failures and future schema review harder to isolate. Use ordinary blocks and named cases; no functional rewrite or broad formatting sweep is needed. This confirms the earlier Task 2 minor triage.

## Known limitations assessed

- **Externally added already-published files and dev freshness:** this remains a real, documented development limitation. The accepted draft-create then publish-update fixture exercises the supported native lifecycle and is legitimate acceptance for that workflow; it does not fix or prove add-only invalidation. I do not make it an additional Composition A blocker because the implemented native creation path always supplies the publication update and the limitation is explicit with restart/edit recovery. Retain it as follow-up work, including add/unlink tests when changed; do not broaden claims to universal content-add freshness.
- **Skip fragment versus active-element transfer:** the current tests prove focused-link outline and fragment activation, not focus on main or the complete post-activation tab sequence. Absence of main tabindex alone is insufficient to conclude that every browser's sequential keyboard navigation is broken. The narrowed documented claim is accurate and is not accessibility certification. Keep active-focus transfer/post-skip navigation explicitly unverified rather than claiming this issue fixed.
- **Windows native UNKNOWN/open failure:** retained failure evidence and one unchanged passing targeted retry do not establish a production reliability fix. No production retry was added; the disclosed observation does not outweigh the successful scoped native proof or require speculative changes here.
- **SQLite experimental, CLI deprecation, color and line-ending notices:** nonblocking known toolchain notices. No dependency upgrade is required for this review.
- **Best-effort catalog/ownership concurrency:** comparisons are not transactions; the implementation and documentation consistently state that limit. No atomic cross-editor guarantee is inferred.

## Recommendations

Address I1 in the planned batched fix wave and verify the concrete rejected-save recovery through the installed native UI. M1 and M2 are narrow hardening changes suitable for the same wave; M3 may remain deferred. Reuse existing broad green evidence unless the fix changes a boundary that warrants rerunning it, then obtain a scoped rereview of the fixes.

## Declined to judge

- Composition B/C section libraries, Rooms/domain registration, media/social/motion and visitor modules: explicitly deferred to later approved increments.
- Stage 4 presets, destination initialization, migration tooling and release tagging: explicitly outside this increment; no legacy disk-reader compatibility was required.
- Hosted CMS/provider verification, real delivery, provisioning, deployment and production release approval: no such actions or claims belong to this local branch acceptance.
- Exhaustive accessibility certification and cross-browser assistive-technology behavior: representative checks are explicitly bounded; the particular skip/focus limitation is assessed above, not silently excluded.
- Transactional simultaneous-editor locking and relationship-aware destructive CRUD/redirect workflows: explicitly deferred; current restrictions and best-effort guards were reviewed instead.

## Assessment

**Ready to merge? With fixes.**

Composition A is coherent across the six task boundaries, and the reported native/public/profile evidence supports most of its intended behavior. I1 is an actionable normal-workflow recovery defect and should be fixed before accepting this increment; the three minor findings do not independently block it. This verdict is technical review only and authorizes no merge, deployment or release.

Review limitation: git rev-parse returned the expected HEAD. git status in this restricted review environment returned "this operation must be run in a work tree", even with explicit git-dir/work-tree arguments; I therefore rely on the controller's clean-status evidence and make no independent fresh clean-worktree assertion. The review itself issued no mutation except writing this report.
