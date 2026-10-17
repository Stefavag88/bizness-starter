# Composition A final review fix report

Date: 2026-10-17 (Europe/Athens). Checkout: C:/Projects/bizness-starter-v2. Branch: codex/starter-v2-composition. Base: f49deb78f348d27184b7d8766627d054b8e1a6a5. One batched implementation wave for final-review.md findings I1/M1/M2/M3. No subagents or reviewer were started; the root owns the scoped rereview.

## I1: rejected Page saves remain correctable

Verified the installed tinacms 3.14.3 API before choosing the mechanism. node_modules/tinacms/dist/index.js Group (around 6799) rejects entry when Final Form is invalid. FormBreadcrumbs (around 15689) uses cms.dispatch with forms:set-active-field-name without resetting the form. The action is declared in dist/toolkit/tina-state.d.ts:42, and its reducer (around 16445) retains each original tinaForm while updating activeFieldName and breadcrumbs. This is the installed native navigation API, rather than an invented form-reset/error-clear mechanism.

PageObjectControls opens the actual registered native object editor through that action. pageCorrectionFields binds it to Page non-list object fields recursively, including metadata, copy, both translation levels and hero/CTA links inside static typed-copy templates. Field names, labels, native child controls and persistence fields stay the same. The wrapper has no form-value, initial-value or error-state mutation. Existing SectionControls/SectionCopyControls membership controls remain installed. Complete required-copy validation, the original thrown rejection, and detached beforeSubmit validation/original object and AST return remain intact. No translated prose, implicit publication, discarded changes or duplicate correction data store is introduced.

Covering regressions check exact native destinations, unchanged complete values and retained AST reference, every Page template's metadata/copy/translation navigation bindings, and nested link bindings. The initial focused red run showed the missing correction function; the final bindings and real-native test exercise the actual integrated behavior.

Actual native acceptance: command below passed in 9.8 seconds (10.7 seconds total), evidence .generated/composition-recovery/run-vp60gk and Playwright output .generated/composition-recovery/native-complete-paths.

```text
PLAYWRIGHT_BROWSERS_PATH=C:/Projects/bizness-starter-v2/.generated/browsers
E2E_CMS_URL=http://127.0.0.1:4330
pnpm exec playwright test e2e/composition-cms.spec.ts --grep "native rejected incomplete" --output .generated/composition-recovery/native-complete-paths
```

The test performs these real UI transitions:

- Start a new Standard draft, set identity/filename, Save with missing metadata, see the actual native error, and prove zero create/update requests and original file absence. Close the native dialog, enter metadata through its actual editor, return by breadcrumb, verify retained slug and save through native createDocument.
- Reload the saved Standard without Greek copy. Enter unrelated unsaved English hero text and bold rich copy. Explicitly initialize Greek, Save with its empty metadata/hero, observe the error, and prove no additional mutation plus byte-identical previously saved source.
- While still invalid, reach default copy and verify the unsaved English title/bold text; enter the nested hero link and return by breadcrumb. Reach Greek through Translations/Ελληνικά, fill actual metadata and hero fields, add Greek bold rich copy, and save through native updateDocument.
- Derive both complete expected persisted documents from actual request variables, active generated schema and the installed serializer before claiming ownership or writing optional diagnostics. Reload and verify the English and Greek text/rich formatting and Greek metadata. Check Settings unchanged before guarded Page removal; verify original Page absence afterward.

incomplete-create-rejected.json records mutations 0 -> 0; initialized-locale-rejected.json records 1 -> 1. acceptance.json records exactly two successful native saves/two mutations and reloadVerified=true. restoration.json records original.exists=false, existsAfter=false and settingsUnchanged=true. Settings was never edited. Native-query verification separately passed against localhost:4010 and verifies original beforeSubmit values/ASTs without saving.

Schema SHA256 during the final native proof was 4f5e925c3de987df56699a3b0c3063e45390f2b1bd93d77a82f3b833beff21da; descriptor SHA256 was acf8686c4cb470b32a1b2df6d3a6b8ebd2786365446e1ce18c00bce8153a3eaf. Both were unchanged across those saves. The custom UI binding changes schema UI metadata relative to the prior branch; no persisted field was added. Native selectors were inspected together in .generated/composition-recovery/selectors.json and the actual failure snapshots; the final test exercises those observed nested paths.

## M1: absent-only Node fixtures use exclusive first creation

The public composition fixture and the separately Node-owned cross-page collision fixture now assert originalState(path).exists=false before first writing. createCmsSources.createAbsent independently enforces initial absence, writes with flag wx, and captures only the exact expected complete record. Existing guarded update/restoration and permanent conflict revocation remain unchanged. No timestamp collision can temporarily overwrite an existing original; a concurrent file appearing after the snapshot produces EEXIST and remains unclaimed/preserved.

Three regressions cover existing originals, a concurrent file between snapshot and exclusive write, and successful first creation/owned removal. The EEXIST regression specifically verifies the exclusive write, preservation and rejected cleanup. Existing concurrent modification, evidence-failure and permanent-revocation tests still pass. The initial red run failed on the missing absent-only API.

Ran one concrete public fixture lifecycle because that setup changed, without repeating the public matrix:

```text
E2E_COMPOSITION_FIXTURE=1
pnpm exec playwright test e2e/composition-content.spec.ts --grep "en/home composition at 375" --output .generated/composition-recovery/public-fixture
```

Observed one pass in 2.0 seconds (3.9 seconds total). .generated/composition-content/run-7rQMZc/restoration.json records originalAbsent=true and ownedRemoved=true. The fixture still models draft creation then an owned publication update; it does not claim add-only refresh support.

## M2: translated membership uses own IDs

Changed the shared normalized Settings validator from inherited-property membership to Object.hasOwn. The strict document boundary delegates to that same validator, so a shared valid constructor ID now requires its own translated label and produces the missing-label error. A matching own constructor translation is accepted and returned as text. No reserved-word exclusion was added. The regression first failed because the missing label was accepted, then passed after this one-line production change.

## M3: named, readable boundary cases

Expanded only tests/content-documents.test.ts and tests/cms-static-schema.test.ts from compressed statements into ordinary blocks. Page-copy rejection and Settings-label rejection mutations now have individually named parameterized cases. Existing descriptor/static-registry contracts and assertions remain. A strict-check failure exposed recursive contextual inference for unannotated table callbacks; explicit callback return annotations resolved it. No production change was needed for that test-only issue. New regression blocks were formatted without a broad repository formatting sweep.

## Verification observed after production fixes

- Focused command: pnpm exec vitest run tests/content-documents.test.ts tests/cms-static-schema.test.ts tests/cms-composition-controls.test.ts tests/cms-ownership.test.ts tests/cms-evidence.test.ts tests/native-document.test.ts. Final output: six files, 77 tests passed.
- pnpm check: passed. Strict TypeScript and 29 Astro files; zero errors, warnings or hints. Reran after fixing the named-case callback annotations.
- pnpm test: passed, 317 ordinary tests plus two footer tests. One existing optional native-query case skipped in this ordinary invocation; it passed separately with CMS_QUERY_URL=http://localhost:4010/graphql via pnpm exec vitest run tests/cms-native-query.test.ts.
- Targeted native rejected-save test and single changed public fixture lifecycle: passed as recorded above.
- pnpm cms:local-build: passed, output "Tina build complete". Ran only after the exact owned dev tree stopped and default ports were confirmed free. The isolated build created only its own Tina process 35628, then stopped it on completion.
- pnpm build: passed, 22 static pages.
- git diff --check: passed, with only known Windows LF/CRLF notices.

The dev launcher was node scripts/dev.mjs --cms, tool session 55977. It created content/Tina/Worker/site PIDs 1288/33828/14700/5892 and was stopped through its own Ctrl+C handler. .generated/composition-recovery/teardown.json records no remaining owned PIDs or listeners on 4330/8790/4010/9010 before the isolated build. Final port checks were empty. No processes were selected by name/port for stopping. Installed Node 24.12.0, pnpm 10.13.1 and checkout-local Chromium were reused; nothing was installed or downloaded.

Both reference repositories remain read-only and clean at their original pinned revisions: bizness-starter 7473c0839dca8fadb7d7a8f9cc459cab79aba94f and financial-consulting-example 0e1e5988dcdcba508300099ccab2643daedf1aad. No build, install, save or process stop occurred in them.

## Native discovery incident and independent recovery ruling

The first native attempt stopped at the installed error modal, before writes; the observed Close button was added to the test. Evidence remains under native-proof/run-v3xXfk. A subsequent attempt reached both successful native saves, but its test predicate incorrectly assumed serialized rich Markdown lacked a trailing newline. The ordinary source helper correctly revoked ownership permanently and preserved recovery-1792239028691.json (run-omDXcQ). The test now checks semantic expected rich text with trim, while the unchanged ownership helper still requires exact complete serializer-derived equality.

Ruling: do not revive or reset the rejected owner. A distinct one-off cleanup may use the actual successful update request/response from its retained Playwright trace, active installed schema/serializer, independently rederived prior proven create, and original-absence manifest to prove the complete current document. Recheck exact current bytes immediately before removal; any mismatch preserves the file and evidence. Cost if wrong is deletion of concurrent editor content, so the complete independent proof and final byte guard are mandatory. These comparisons remain best effort rather than a transaction.

That independent proof passed and removed only the proven fixture. Retained inputs/command/result: .generated/composition-recovery/independent-request.json, independent-cleanup.mjs, independently-proven-document.json and independent-cleanup.json. Command: node .generated/composition-recovery/independent-cleanup.mjs. Output: "Independent complete request/schema/serializer proof passed; exact owned fixture removed." The ordinary rejected owner was never reused. The ruling also appears in the workspace integration-notes.md. No production retry, error swallow, general cleanup exception or ownership relaxation was added. The next unchanged targeted acceptance passed (run-xkG2SS); the final strengthened nested-link acceptance passed (run-vp60gk).

## Remaining scope and limits

All four review findings are addressed for scoped rereview. Prior Task 6 broad profile/Worker/full-public evidence is retained; profiles and the full viewport/public matrix were not repeated without a related change. Add-only external-file development freshness, unverified main active-focus transfer/post-skip tab sequence, best-effort catalog/ownership concurrency and the prior Windows UNKNOWN/open writer observation remain unchanged and disclosed. Known SQLite experimental, CLI/color and line-ending notices remain. No dependency, new section, Stage B/C feature, hosting, delivery, remote write, deployment, merge, push or tag is included. This report makes no release/merge approval claim.
