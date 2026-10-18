# Task 4 report: native Composition B authoring and binary ownership

Date: 2026-10-18. Branch: codex/starter-v2-composition-b. Base: 45cf603865071714557975f1a9b242566d2b8f08.
Status: implemented, self-reviewed and verified. Independent review remains controller-owned.

## Deliverables and native behavior

Added e2e/composition-b-cms.spec.ts, e2e/helpers/owned-media.ts and tests/owned-media.test.ts. The native suite uses actual CMS controls, keyboard editing, the installed media library/card/Insert flow and real createDocument/updateDocument responses. It never sends raw write requests.

The final passing native run is .generated/composition-b-cms/run-U2sQCT. The protected-region run is .generated/composition-b-cms/protected-go3D27. The final command log is .generated/task4-evidence/native-final.log. Both native tests passed in 1.9 minutes.

The canonical fixture was composition-b-1792303028475.json. Through actual UI it:

- Created a unique Standard draft, saved it, reloaded, and verified read-only saved contentId/slug and protected hero controls.
- Added two FAQ sections, a steps section, optional media/text and a gallery. Every newly added section was initially hidden, then explicitly enabled. Added two FAQ items, another FAQ item, two steps and two gallery references.
- Explicitly initialized Greek section/item copy and metadata. Both locales used actual nested question/answer/body/alt/caption editors. Answers, bodies and captions were formatted with bold and safe links through the installed rich editor and link dialog. Media/text CTA fields were also authored.
- Chose both PNG sources through the real native media manager, selected expanded/cards/reversed/featured variants, set shared crop, reordered nested FAQ/steps/gallery items and whole sections, and exercised hide/show without losing copy.
- Intentionally attempted Save with an empty nested English answer and missing Greek gallery alt. The first actionable alert included both paths. After correcting the actual answer editor, a second Save identified the remaining localized alt. Each rejection had mutationsBefore=1 and mutationsAfter=1, with identical canonical Page bytes. The unrelated unsaved linked/bold media bodies remained present in both locales. The actual localized alt editor was reachable after the failed save and corrected in place.
- Saved the corrected bilingual draft and reloaded successfully. Complete saved-record ownership was proved from the actual request, active generated schema and installed CLI serializer before optional diagnostic writes.
- Clicked actual Cancel item removal and Cancel section removal. The item/section remained, Save remained disabled, native requests increased by zero and Page bytes stayed exact. This completes the deferred Task 1 actual-Cancel ruling.
- Published both locales through UI, saved/reloaded, and verified public section ID/type/copy associations, whole-section order, reordered FAQ/steps prose, gallery item ID/source/alt association and localized safe caption links in EN/EL.
- Replaced a retained gallery image source through the picker, cleared the optional media/text image with the installed clear button, confirmed gallery reference removal and confirmed one repeated FAQ section removal. Saved/reloaded the result, verified image/media omission and preserved body/CTA in both locales, text-only public media/text output and the changed retained gallery source.
- Verified both source files remained byte-exact after reference clear/removal. Physical file cleanup was a separate ownership operation after Page restoration.

The second native test opened actual Home, Privacy and Contact editors and proved hero visibility/removal/move protections, required privacy_details visibility/removal protections, immutable saved identity fields and the Contact template-owned public form. It made zero native mutations and retained exact seed bytes. Existing save-hook regressions independently enforce immutable saved section identity/type and required-region policies.

## Binary media ownership

createOwnedMedia(path, backupRoot, {uploadsRoot?}) snapshots original presence and Buffer bytes before mutation. Its default explicit upload boundary is apps/site/public/uploads; temporary test roots explicitly supply their corresponding upload destination. It verifies lexical containment, the real parent and existing file paths, rejects file symlinks/nonfiles, and detects a parent replaced by an escaping junction before subsequent operations. Backup directories use mkdtemp per guard, with manifest, original.bin when present, expected.bin and conflict evidence.

- create(bytes) requires an initially absent destination and performs an exclusive wx write. A concurrently appearing file produces EEXIST evidence, revokes ownership permanently and is preserved.
- capture(bytes) compares complete caller-known literal bytes before claiming them.
- replace(bytes) compares the last owned Buffer before writing another known Buffer.
- restore() compares exact owned bytes before restoring exact original bytes or deleting an initially absent owned fixture. Unclaimed unchanged originals are left alone.
- Changed, missing, unreadable or escaped sources permanently revoke ownership before diagnostic I/O. A later return to matching bytes or a new capture call cannot reset that refusal.
- Ownership is established before optional expected-byte evidence writes. Tests deliberately fail that I/O after capture, replace and exclusive creation, then prove safe exact restoration/removal.

The canonical images were Node-owned predetermined literal 1x1 PNG bytes (68 bytes each), under unique names ending -a.png and -b.png. Both hashes were b7d5a7a945461b974a6e2cf43dd9809ec5aaedd91f642cabc6b5c39b41ac84fc. The two files intentionally share literal bytes while having different sources, sufficient for native source-association proof. They were selected through the native picker. This is not native upload coverage or same-path pixel replacement coverage.

Native JSON ownership helpers were reused unchanged. No newly observed disk record or media bytes became an expected model. Final cleanup restored/deleted the owned Page before removing either owned image. A Page restore conflict prevents subsequent media deletion. The test checks exact Home, Privacy, Contact and Settings bytes and leaves unknown bytes untouched. No rejected guard was manually reset.

## Demonstrated compatibility bug and focused fix

The real UI initially rejected an installed-editor-created link with Unsupported rich text attribute. A separate bounded probe used the installed exported MdxFieldPluginExtendible, public Tina Form, installed public Final Form context and FieldsBuilder; no canonical save was performed. The observed node is retained in .generated/task4-inspect/native-link-ast.json and the probe sources remain beside it.

The actual link owns target: undefined, and its nested text leaf owns an opaque string id. Ordinary JSON output would conceal the undefined attribute, so the diagnostic serialization explicitly marks undefined own values. The probe also observed numeric paragraph editor IDs, already permitted by validation.

Added a focused cms-save regression before changing validation. The minimal fix permits only the demonstrated undefined-valued target on link nodes and opaque string/finite-number text-leaf editor IDs. Safe href validation, permitted node/mark lists, plain-text/Markdown validation and unknown-attribute rejection remain. Nonempty targets (including _blank), unsafe targets, onclick/style and malformed leaf IDs still reject. beforeSubmit returns the original values, body, link and leaf objects by identity; only the detached projection is serialized. No target behavior, HTML capability or general unknown-attribute bypass was added.

## TDD and verification evidence

Ownership RED:

1. pnpm exec vitest run tests/owned-media.test.ts initially reported the missing helper import.
2. A nonfunctional interface stub then produced 13/13 expected failed ownership tests with Owned media guard not implemented before guard implementation.
3. The implemented guard passed 13/13. Additional diagnostic-failure/unclaimed-original cases bring final ownership coverage to 16 tests, all passing in the full/focused runs.

Link compatibility RED/GREEN:

- Added two cms-save tests against the observed node. RED: 1 failed / 11 passed, Unsupported rich text attribute at validation.ts:82.
- After the narrow fix, the sole remaining test assertion mismatch was the installed serializer's emphasis placement: **[Native link](/contact)** rather than [**Native link**](/contact). The expected Markdown was corrected to the observed installed serialization without changing production behavior.
- GREEN: cms-save plus Composition B media regressions, 30/30 passing. Final focused ownership/hook/control/item/media run: 6 files, 96/96 passing.

Final commands and results:

| Command | Result |
| --- | --- |
| CMS_QUERY_URL=http://localhost:4010/graphql pnpm exec vitest run tests/cms-native-query.test.ts | 1/1 passing against fully indexed owned dev:cms |
| E2E_CMS_URL=http://127.0.0.1:4330 pnpm exec playwright test e2e/composition-b-cms.spec.ts | 2/2 passing, 1.9 minutes |
| pnpm check | TypeScript passes; Astro 44 files, 0 errors/warnings/hints |
| pnpm test | Root 53 files passed, 1 skipped; 529 tests passed, 1 skipped. Astro 4 files / 16 tests passed |
| Focused final Vitest run | 6 files / 96 tests passing |
| pnpm exec tsc --noEmit --project .generated/task4-evidence/tsconfig.json | Passes, including the new E2E/helper source |
| git diff --check | Passes; existing LF/CRLF conversion advisories only |

The full-suite skip is the existing native query opt-in, intentionally unset after stopping the stack; the actual indexed query was separately run and passed. Existing Node experimental SQLite, Vitest performance, Wrangler local-scheduler/update and browser NO_COLOR/FORCE_COLOR advisories were observed. No novel failing warning remains. No static build, CMS isolated build or Task 5 matrix is claimed or required by this brief.

## Actual save/request/byte evidence

The final native test sent exactly four native Page mutations and retained their actual requests and complete base64 persisted bytes in saves.json, with last-native-mutation.json and guarded Page backups. Failed Save attempts sent zero additional mutations. Protected-region inspection sent zero mutations.

| Save | Persisted bytes | SHA-256 |
| --- | --- | --- |
| Native draft create | 597 | aaa65a66fc1a905abffaa9b6a3be5c7780703e0d86627aa1d6eb8ecd84e1902d |
| Corrected authored draft update | 8167 | 0a48833886f625ac14e2af91585ef333063426b25dc379efe7cc9c1a36b1e1db |
| EN/EL publish update | 8175 | 981cbe70023af1900c01e45f7844bda564838ba65dd59003f20c702281fec560 |
| Source change, clear and removal update | 6136 | 1e7581a23e4877424a5f3b60d97172dce2435bb9b6ab6e71f8ce0de581f11758 |

Schema and descriptor bytes remained unchanged by instance/item IDs. Baseline and native final hashes:

- tina/__generated__/_schema.json: d1b3ecec0f6279d82ae71cc1a4992063bcf6e766ff0a367353ea89481668559b.
- .generated/cms.json: acf8686c4cb470b32a1b2df6d3a6b8ebd2786365446e1ce18c00bce8153a3eaf.

Retained run evidence includes incomplete-answer.json/png, missing-localized-alt.json/png, cancel.json, acceptance.json, EN/EL native/public screenshots, saves.json, original/expected backup manifests and restoration.json. Final restoration records pageAbsent=true, mediaAbsent=true and seedsByteExact=true. Original media bytes remain available as expected.bin in their unique guard directories.

## Process ownership, restoration and costs

Owned launcher session: 30001. Created child PIDs: content 30784, Tina 13240, Worker 28260, site 20392. It used defaults 4330/8790/4010/9010 and the installed .generated/browsers Chromium. No browser download or dependency installation occurred.

After native acceptance, Ctrl+C stopped this exact launcher and its own child trees. All four owned PIDs are absent; all four ports have no listeners and passed the repository's actual bind-based assertPortsFree check. The first OS listener snapshot briefly contained a closing port row with OwningProcess=0; a second snapshot and bind check confirmed complete shutdown before pnpm check/test. Evidence: .generated/task4-evidence/teardown.json. The stack remains stopped for Task 5. All bounded probe browser/Vite resources closed in finally blocks.

There were six canonical native-flow iterations: keyboard timing failure, duplicate hidden/active link-dialog textbox selection, the genuine native metadata bug, one watcher-rebuild interruption caused by formatting validation during a running test, translation status selector correction, and the final 2/2 passing run. All six runs have safe restoration evidence; no fixture was blindly reset. Observed DOM inspection was batched in bounded unsaved probes. The watcher interruption was avoided thereafter by freezing watched source during native authoring. Earlier substantive failure screenshots/traces are retained in run-mM35yG and run-nGYFcl; final screenshots/logs live in the final run/evidence directories. Early selector-only failures were superseded by later evidence; their backup/restoration records remain.

Verification cost: one final strict project check, one full stopped-server suite, focused RED/GREEN iterations, one indexed query, bounded unsaved DOM/plugin probes and the six native-flow iterations above. No token/currency measurement is available to this worker.

## Self-review and limits

Changed source is confined to the three requested acceptance/ownership files, tests/cms-save.test.ts and the small tina/validation.ts compatibility fix. Existing routing and access-role implementation remains untouched. The new E2E file intentionally follows existing native acceptance patterns and keeps request ownership, UI authoring and cleanup visible together; no extra abstraction or broad implementation rewrite was introduced.

Ownership comparisons and realpath checks are best-effort checks, not atomic multi-editor filesystem locks. Native canonical proof uses the two configured EN/EL locales; existing focused item/media/hook regressions retain three-locale and opaque AST identity coverage. Actual media upload/deletion UI, same-path live image replacement, responsive/a11y/no-JS/CSP/build-exclusion matrices remain Task 5 or later coverage. Physical file deletion remains distinct from clearing/removing references.

Read-only sources were inspected only for status/revision and remained clean: starter 7473c0839dca8fadb7d7a8f9cc459cab79aba94f; financial 0e1e5988dcdcba508300099ccab2643daedf1aad. No installs, builds, saves, process stops or secret reads occurred in either source. No external sending, cloud resources, dependency changes, deployment, push, merge or tag occurred. No child implementer or reviewer was spawned.

## Changed files

- e2e/composition-b-cms.spec.ts
- e2e/helpers/owned-media.ts
- tests/owned-media.test.ts
- tests/cms-save.test.ts
- tina/validation.ts

Report and scratch evidence are ignored and will not be staged or force-added. The controller supplies fresh independent review after this report.

## Final commit and clean state

Committed b3fec11 - test: prove composition b native authoring. git status --short is empty. git diff HEAD^ HEAD --check passes. Final schema/descriptor hashes were rechecked after pnpm configure/full tests and remained exact. All six canonical run directories retain restoration.json. A final bind-based check confirms ports 4330/8790/4010/9010 remain free. No additional code changes followed the passing verification.
