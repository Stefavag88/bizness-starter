# Task 6 report — real responsive media acceptance

## Candidate status and scope

Implemented from accepted base `6e1d254`, on `codex/starter-v2-media-optimization`. Candidate commit is recorded after verification below. Real pure/static/native phases and documentation are implemented; the controller owns independent task review, final branch review, archival, verified scratch cleanup and eventual launcher restart. This report does not mark the whole-branch gate complete.

No production media/renderer/Worker behavior changed. The only existing helper adjustment outside the new media harness is a type-safe spread at the two legacy Composition C port-check call sites, made newly reachable through the new tests' imports. No dependency, reference-repository, deployment, sending, migration, push/tag/remote operation or final user launcher operation occurred. Scratch/raw artifacts remain retained.

## Implemented interfaces and behavior

- `scripts/media-optimization-acceptance.mjs` retains the reviewed runner API and command/snapshot admission. Real static/native phases dispatch their respective Playwright-transformed TS graphs, never direct Node TS imports. Per-run phase identity, browser results/traces, explicit child exit codes, PID/times and command logs are retained. Pure covers 10 focused test files. Matching declaration documents real browser phases. Unavailable-phase tests now prove actual child execution failure, retained command/final comparison and unchanged canonical inputs in isolated roots; no placeholder skips were introduced.
- `e2e/helpers/media-optimization-acceptance.ts` builds known bilingual fixtures through reviewed static owners, with setup inside the test try/finally. It defines photographic/PNG/animation use, default/featured gallery counts1–4, Rooms1–4, independent rendered-output inventory and actual Worker object ownership. It uses the supported site build wrapper. Static configs remove source DB/queue/trigger/workflow bindings; final supported persistence is `persist:true,persistTo:<run>/runtime`.
- `e2e/media-optimization.spec.ts` performs actual built-Worker MIME/CSP/runtime-bypass checks, unknown identity refusal, complete published-vs-rendered demand equality, browser geometry/currentSrc/srcset/sizes/load/crop/alt/caption/intrinsic/lazy/async/overflow checks, representative axe/screenshots and candidate/selected resource byte tables. Original uploads remain present and legitimate.
- `e2e/helpers/media-optimization-runtime.ts` owns exact spawned child identities, records executable/args/cwd/PID/start/close/end and positively awaits close after exact-tree shutdown. `cleanupMediaBrowser` inserts browser close as an independent reviewed cleanup stop action. Browser rejection cannot bypass owned runtime/source restoration or allow regeneration.
- `e2e/media-optimization-cms.spec.ts` owns a single `createCmsSources` for the native-saved record, outside static fixture.documents. Actual UI select/clear requests are intercepted before dispatch; installed request/schema/rich serializer projection establishes complete expected AST/document and installed GraphQL stringifyFile establishes complete serialized bytes/hash before dispatch. The same owner captures both saves, and full canonical expected hashes advance only from preflight known bytes. There is no observed-disk expectation adoption or raw mutation API. It proves unchanged unrelated body AST, originals retained, no generated saved URLs,19 successful UI read queries, responsive URL refresh after same-path replacement, actual referenced unlink visible error/recreation recovery and unreferenced upload add/change/unlink delivery.
- `tests/media-acceptance-harness.test.ts` and `tests/media-runtime.test.ts` add real temporary-root partial setup and rejecting browser-close failure proof plus exact owned child close. Reviewed helper fault tests remain active. All fail-closed conditions retain independent restoration/diagnostics.
- `docs/MEDIA_OPTIMIZATION.md`, active architecture/content/authoring/quickstart/domain/Rooms docs and `docs/superpowers/plans/2026-10-19-starter-v2-media-optimization-evidence.md` document defaults/rebuilds, limits/formats/orientation/rounding, layout-CSS coupling, source/cache/publication ownership, dev/static Worker behavior, storage/build costs, AVIF/animation limitations, exact scopes and known limits.

## Exact public/browser matrix and performance

Final public static outer run: `.generated/media-optimization/acceptance-Gj7Zeq`, 5 tests passing in2.6minutes, 14:07:46.860–14:10:25.292UTC, PID23656.

1. Local neutral/comfortable enquiries, articles on, Rooms4, optimization on: EN/EL ×375/640/768/1440 ×DPR1/2 ×JS/noJS, plus EN/DPR1/JS at626/627/767/769. All contexts inspect media fixture, Room index and Room detail. Raw `.generated/media-optimization/acceptance-SAvATG`.
2. Warm-cache staging accommodation/compact newsletter, articles off, Rooms1:640/DPR2/noJS EL and1440/DPR1/JS EN. Raw `acceptance-WDKLA4`.
3. Warm-cache production trades/spacious nurture, articles on, Rooms2:640/DPR2/noJS EN and1440/DPR1/JS EL. Raw `acceptance-1o4tpi`.
4. Local wellness/compact enquiries, articles off, Rooms3:640/DPR2/noJS EL and1440/DPR1/JS EN. Raw `acceptance-pJhP40`.
5. Production neutral/spacious enquiries, articles/Rooms off, optimization off:640/DPR2/noJS EN and1440/DPR1/JS EL. Raw `acceptance-ddPY0L`.

44 contexts/128 route inspections; representative designs, not all12 theme/density combinations. All normal/featured gallery itemcounts are present in the media fixture; Room itemcounts use1/2/3/4 actual published records. Six sizing roles include featured lead/item. Width tolerance1.1CSSpx;626/627 brackets the39.130435rem auto-fit threshold,767/769 brackets featured768. Room cards intentionally omit captions. Representative EN/EL axe results have zero violations. Screenshots were inspected; screenshots/automated scans are not general accessibility certification. Installed Chromium revision1243 was used, with no browser download.

Local rendered demand publishes24variants, warm staging/production18each, wellness local24, disabled0. Full output HTML demand exactly matches published files. Cache inventory never authorizes publication. Every test original remains in built uploads, including legitimate ordinary samples. Worker public assets bypass real Worker execution; protected health still invokes it. Requests show ordinary static image delivery, never runtime transformation.

The3840×1725photo original is1,610,954bytes; actual JPEG/WebP candidates (width×height; JPEG/WebP bytes):320×14310,205/8,940;640×28736,702/31,722;960×43180,283/69,668;1440×647178,379/155,210;1920×863314,123/275,784.720browser gallery selections choose8,940–275,784byte payloads,82.88%–99.45% below that original. Exact currentSrc/payload mapping is `acceptance-SAvATG/selected-transfer.json`. Source/provenance/checksums remain `tests/fixtures/media-optimization/README.md` and `candidate-table.json`.

Small/PNG exceptions are explicit: small PNG fallback remains238bytes; alpha400×200fallback remains2,291bytes. Portrait normalizes600×300orientation6 to300×600 (JPEG1,351/WebP416bytes). Animated202byte WebP has no candidates and passes through with `animated-or-multipage`. No universal savings/network timing/AVIF/fallback-engine claim.

## Native exact evidence and source timing

Final public native invocation: `.generated/media-optimization/acceptance-SADg9D`,1pass43.8seconds,14:07:01.782–14:07:46.284UTC, PID33780. Native request/schema/installed serializer/full expected bytes/hashes/AST/source restoration and separate Tina/Astro process evidence: `.generated/media-optimization/acceptance-fixture-QzojLe`.19successful UI queries, original retention and unchanged body AST are explicit in `native-query-proof.json`; two pre-dispatch complete save expectations are retained. No source D1 migration ran.

After these full native/static invocations, self-review found two cleanup-only harness risks: eager setup outside try/finally and browser.close rejection before cleanup. These were fixed, then specifically regressed against the final shared gateway/temporary-root helper. `task-6-red-cleanup-guards.log`:2expected failures with guards removed; `task-6-green-cleanup-guards.log`:32passing focused tests with guards restored, including actual child shutdown and fail-closed regeneration. Full earlier phase invocations are not claimed at this later harness source.

The first final check exposed newly reachable legacy port types and incorrect typed Wrangler persist path usage. Narrow spread plus supported persist:true/persistTo fixed these. `task-6-types-corrected.log` explicitly exited0. One actual staging/build/Worker/browser case passed at corrected source in `task-6-static-persist-focused.log` (14.6seconds), raw `acceptance-zFS1xo`; no repeated broad matrix was needed for unchanged product assertions. Final-source pure: `.generated/media-optimization/acceptance-qJjQd0`,134pass/10files. Final seven gates include all final cleanup/type harness changes.

## Failure/diagnostic ledger

- `task-6-red-phases.log`: expected phase-dispatch safety RED; `task-6-green-phases.log`: GREEN.
- `task-6-static-attempt-1.log`:4test expectation failures/1pass. Room cards omit captions by design; no product fix. `task-6-static-attempt-2.log`:5pass. First root Playwright screenshot paths were superseded by the next run; command logs/cleanup remain; subsequent browser results use unique directories.
- Native attempt1: incorrect readiness marker timed out120seconds. Exact owned Tina stop, independent restoration and full snapshot succeeded before retry. Attempt2 passed actual UI/live checks. Attempt3 added referenced unlink but incorrectly demanded HTTP500; actual Astro streamed200with visible contextual error. Screenshot/runtime log proves actionable source failure. Assertion changed to the actual contract; native-final and native-public-final passed, with successful image recreation recovery in final public source.
- `task-6-pure-overlap-refused.log`: attempted pure phase while native live was rejected by port admission before child spawn; not a green invocation.
- Earlier `task-6-types-initial.log`, `task-6-types-native.log`, `task-6-types-final.log` contained errors. Trailing PowerShell log reads masked exit status, and earlier progress reports incorrectly called tsc green. These claims are corrected; only explicit-exit corrected TypeScript and final check are green proof.
- Seven-gate attempt1: `.generated/media-optimization/acceptance-kvgUMD`, check exit2, no later gates attempted, canonical restoration true. Retained separately as `task-6-seven-gates-attempt-1.log`.

## Pinned persistence isolation investigation

`task-6-persistence-audit.json` and its `.mjs` retain pinned Wrangler CLI SHA-256/source excerpts, exact prior absolute private config paths/hashes, command cwd, actual private state file metadata and removed source DB bindings across every static run. Pinned unstable_dev forwards options.persist/options.persistTo separately, and maps dev.persist to `args.persist === false ? false : args.persistTo`. Previous string persist plus undefined persistTo therefore chose getLocalPersistencePath's default anchored to dirname(private userConfigPath)/.wrangler/state, not the checkout root. Actual private state inventories corroborate the run-local location. Final supported options explicitly select `<run>/runtime` and the corrected focused case passed.

No unknown source `.wrangler`/D1 state was removed/restored. Source `.wrangler` was outside canonical baseline, so byte-for-byte absence of unrelated state changes there is not claimed. Static configs removed business DB bindings; private internal Miniflare asset state is not a source D1 migration. The Node-owned Tina/Astro native stack never invokes the general dev launcher's source migration path.

## Final checkout gates and restoration

All seven passed sequentially at final code source in `.generated/media-optimization/acceptance-u70xHM`, backed by complete snapshots before/after every command and final finish. Raw inventory has executable/arguments/cwd/PID/start/end/explicit exit/log. `task-6-seven-gates.log` is the successful sequence; earlier failed sequence stays separate. `task-6-gates.mjs` records gate orchestration.

Full tests:737passed/1opt-in skipped in root;24passed in site suite. Explicit separate live native query proof above covers the conditional boundary. No unrelated broad native/capture suite was replayed. Supported build wrapper remains the public build entry.

`task-6-canonical-final.json`: all16canonical hashes exactly match original `canonical-before.json` (SHA-25611cd8ff23ef9bd1f07af86bd538a394771332d33fa5db47bf78262dcd418bf5c). `task-6-process-final.json`:[]; no owned checkout runtime remains. All fixture restorations report complete baseline and every owned runtime positive close. No scratch removal, final user launcher restart or whole-branch approval was performed.

## Limits and review handoff

Chromium/WebP only; representative themes/densities beyond default matrix; local Worker/CMS evidence rather than hosted certification. Transfer figures measure selected payload artifact lengths rather than connection timing. Native clear/select covers shared optional media/text boundary and exact unrelated body ASTs; unchanged broad Room/capture workflows were not replayed. Local streamed error status is not guaranteed500. Canonical full snapshots are best-effort comparison rather than a filesystem lock. Independent Task6/whole-branch review remains required and controller-owned.

| Gate | PID | Start UTC | End UTC | Exit | Raw log |
| --- | ---: | --- | --- | ---: | --- |
| check | 36052 | 2026-10-19T14:13:24.628Z | 2026-10-19T14:13:42.456Z | 0 | command-1.log |
| test | 5108 | 2026-10-19T14:13:42.471Z | 2026-10-19T14:14:05.299Z | 0 | command-2.log |
| build | 34464 | 2026-10-19T14:14:05.314Z | 2026-10-19T14:14:11.129Z | 0 | command-3.log |
| worker:check | 16720 | 2026-10-19T14:14:11.146Z | 2026-10-19T14:14:14.618Z | 0 | command-4.log |
| cms:local-build | 14280 | 2026-10-19T14:14:14.632Z | 2026-10-19T14:14:56.240Z | 0 | command-5.log |
| test:static-routing | 28928 | 2026-10-19T14:14:56.258Z | 2026-10-19T14:15:05.870Z | 0 | command-6.log |
| test:showcase-builds | 40540 | 2026-10-19T14:15:05.889Z | 2026-10-19T14:15:19.234Z | 0 | command-7.log |

Candidate commit: `01504ed686233b969d1001597632a43ae4a46b4e` — `test: verify responsive media delivery and document ownership`.

Post-commit `git status --short` is empty and the full canonical baseline comparison passed again. Candidate is ready for controller-dispatched independent Task 6 review. Whole-branch approval remains pending.

## Fix round 1 — pre-dispatch native target admission

Review: `.superpowers/sdd/2026-10-19-starter-v2-media-optimization/task-6-review.md`, Important finding at native handler lines 41–45. Base candidate: `01504ed`.

Added `e2e/helpers/media-optimization-native-admission.ts`, consumed by the actual native route. It admits exactly one updateDocument operation, requires collection page, and compares nativeDocumentPath(request,schema) with resolve(the backed-up fixture path) before snapshot/schema/serializer expectation work. The handler now aborts rejected writes before diagnostic output and clears pending expectations; unexpected writes cannot reach route.continue or advance expected hashes. Expanded only the touched handler. No product behavior, crop/dimension assertions, unrelated dense blocks or static matrix scope changed.

TDD: `task-6-fix1-red.log` has 5 expected failures / 1 pass before guard implementation. `task-6-fix1-green.log` has all 6 passing. The actual route's admission helper is exercised for wrong target, same-directory wrong collection, create, delete and multiple writes. Each refusal has zero dispatch, unchanged pending state and expected hash, and exact unchanged owned/unrelated source bytes. Positive helper admission accepts only the intended update/Page/exact path.

Real final-source native phase: `.generated/media-optimization/acceptance-6HyVRJ`, 1 passed / 43.7 seconds; raw outer log `task-6-fix1-native.log`. Fixture evidence `.generated/media-optimization/acceptance-fixture-jA1YvL`: exactly two saves, both operation update, collection page, relativePath media_native_acceptance.json; 19 successful UI queries; exact known serialized bytes and source/hash proof, upload refresh/error/recovery and both positive runtime shutdown records. This is the new native result after the guard, not an inference from the earlier candidate.

Final-source `pnpm check` and full `pnpm test` each ran once sequentially through `.generated/media-optimization/acceptance-mkR7p6`, both exit 0, complete snapshot comparisons unchanged. Root tests: 743 passed / 1 opt-in skipped; site: 24 passed. `task-6-fix1-check-test.log` plus commands.json retain separate arguments/PIDs/start/end/exits/raw logs. Pinned SQLite ExperimentalWarning output remains visible; no unrelated warning suppression.

Earlier seven-gate evidence `acceptance-u70xHM` applies to base candidate 01504ed. No static/five-mode/seven-gate rerun was performed for this admission-only fix. Deferred crop-exactness/positive-only intrinsic dimensions and unrelated formatting remain final-review triage items. No subagents/reviewer, final launcher restart, unknown canonical restoration, deployment or remote operation occurred. Controller owns scoped re-review and whole-branch approval.

Fix round 1 candidate: `7a6420ea5faee7dd317b0fcd12bc4d9011032b8d` — `test: admit only owned native media updates before dispatch`.

Post-commit worktree status is clean. `task-6-fix1-canonical.json` confirms all 16 baseline hashes; `task-6-fix1-process-final.json` is `[]`. Ready for scoped independent re-review of the Important pre-dispatch target-admission correction. No whole-branch completion claim.
