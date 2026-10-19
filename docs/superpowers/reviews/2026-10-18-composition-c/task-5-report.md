# Composition C Task 5 report

Status: implementation and bounded Worker/browser evidence complete; independent controller review remains required. Base: 7e9bdb8398ca7f6422bfd20addf0615275d920f4. Branch: codex/starter-v2-composition-c.

## Changes and API handoff

- Added browser-safe packages/content/enquiry-contexts.mjs and matching declarations. getEnquiryContexts(content) returns {id,kind,title,path}[] from existing public localized offerings plus registered domain datasets whose definition.enquiry is true. It consumes getDomainRecords without reimplementing publication, module enablement or Rooms index eligibility. Offering kind remains offering; extension kinds are their registered keys. Duplicate localized IDs and conflicting cross-locale kinds reject.
- getAcceptedEnquiryContexts(contents) returns the deduplicated locale union {id,kind}[]. createManifest adds enquiryContexts using that projection. Legacy offerings/articles/campaigns/routes shapes and behavior remain unchanged.
- ContactForm renders localized titles from the same projection. Its existing external Astro script selects only a matching option for the existing contextId query parameter. Unknown, unpublished or unsafe query values remain unselected; there is no injected markup, storage or client locale authority.
- Worker validates the existing bounded scalar contextId against manifest.enquiryContexts. There is no Rooms-specific backend switch or D1 schema change. Origin, consent, Turnstile, access-role, idempotency, profile and sending boundaries are unchanged. Updated docs/ARCHITECTURE.md describes the new shared boundary.

## RED and GREEN

Raw output directory: .generated/composition-c-task5/.

- red.log: missing projection module and absent manifest.enquiryContexts fail before implementation.
- red-worker.log: actual Node Worker fetch for a Room fails 400 versus expected 202 under the old Offering-only validator; this pins the changed validation behavior separately from the missing API.
- green.log: 6 focused test files, 24 tests passed. Covers localized Offering/Room choices, EN-only/EL-only Room eligibility, future index schedules, disabled datasets, collisions, legacy manifest fields, unknown/draft/disabled/oversized requests, scalar storage, retry capture and existing backend/security regressions. Two further per-locale scheduled-index cases are included in the final full run.
- The new collision test initially used an incorrectly typed Offering-shaped Room fixture; the check rejected it. It now constructs the collision from a real localized Room and the final check passes without casts.

## Actual Worker, D1 and browser proof

Command: PLAYWRIGHT_BROWSERS_PATH=.generated/browsers pnpm exec playwright test e2e/composition-c-worker.spec.ts.

Final raw output: .generated/composition-c-task5/e2e-verified.log: 1 passed in 11.7 seconds. Successful run: .generated/composition-c-task5/worker-q3ZPMr/.

- manifest-enabled.json retains the generated projection used by the actual Worker.
- worker-proof.json retains all six HTTP statuses/bodies/request keys, queried D1 rows/jobs/captures, rejected-row absence, disabled manifest and observed network state.
- Valid legacy Offering and Room return 202; retry with the same Room key returns 202. Draft, unknown and then module-disabled Room return 400.
- Exactly two targeted inquiry rows exist: sample-service and task5-suite. Both context_id values have SQLite typeof text. The repeated Room key creates no extra inquiry, job or capture. Invalid/draft/disabled keys have no rows.
- Exactly two targeted capture rows and two accepted jobs exist, with local- provider IDs. A generated-only wrapper blocks and records global outbound fetch; observed outboundCalls is empty and the running Worker reports SENDING_ENABLED=false. No provider credentials, remote API, external email, migration or cloud setup was used.
- D1 started from a SQLite backup of already initialized local D1 into a unique private evidence directory, including committed WAL data. The original database was opened read-only and was not used by the Worker. No migration was run. This harness requires that initialized local D1 and the existing static asset baseline; it fails if they are absent.
- Actual Chromium checks EN and EL Room-detail CTA navigation, matching localized option titles, Room preselection, unknown/unsafe and draft query values remaining blank, and legacy Offering preselection. This is a focused contact integration proof, not the Task 6 viewport/accessibility/public matrix.

## Ownership and cleanup

cleanup.json records stoppedSite, stoppedWorker, restoredSources, restoredConfig and restoredIndex all true. Existing ownership helpers compare exact predetermined config/index bytes and complete Node-owned fixture records, preserve unexpected edits, and restore independent resources even after failure. Only the spawned site PID tree and unstable_dev instance are stopped. Regeneration runs only after successful process stop and all independent restorations.

project.json and content/pages/rooms.json are byte-exact restored; Rooms remains default-disabled and its index remains dormant draft. Both newly created fixture Room records are absent. No media was created or changed. Home/settings were not mutated. All configured lifecycle ports were rechecked free before final full testing. No unknown edits or ownership conflicts occurred.

Superseded harness outputs remain in e2e.log, e2e-green.log, e2e-final.log and e2e-pass.log with their unique run directories. Corrections were: use the real loopback listener instead of unstable_dev.fetch's request origin; use installed Wrangler persistTo rather than putting a path into boolean persist; assert the established accepted job state and dedupe_key; place the generated diagnostic under the existing API-first route. Each attempt restored owned content/config/index and stopped owned processes. Superseded reports are not final no-send or acceptance evidence.

## Final verification

- pnpm check: exit 0, 50 Astro files, zero errors/warnings/hints. Raw check.log.
- pnpm test: exit 0, 64 test files passed and one skipped; 621 tests passed and one skipped. Footer suite: 6 files and 21 tests passed. Raw full-test.log. The existing conditional skip is tests/cms-native-query.test.ts, requiring a live native GraphQL URL; no native authoring replay was needed here.
- pnpm build: exit 0, 23 default local pages built. Raw build.log. Restored Rooms-disabled canonical content was used.
- git diff --check: clean, apart from normal Git CRLF conversion notices.

Self-review found no remaining implementation seam gap. Existing security behavior is exercised by the focused backend/security regression files and full suite. No unrelated newsletter lifecycle replay, source-repository mutation, dependency change, deployment, merge, push, tag or subagent/reviewer was used. Task 6 retains the broad public/build matrix. Independent controller review remains pending.


## Independent review repair 1

Reviewed head: 41f356fa94100e15a7d0bfa1739405926b0454cb. Addressed Important I1-I3 without changing product/runtime code.

- Extracted e2e/helpers/composition-c-worker-lifecycle.ts, composing the existing cleanupCompositionPublic primitive rather than copying an error collector. All source restoration Promises are awaited. Each restore flag starts false and is set only after success; a later failed restore clears prior success. False config/index restoration is an error and never establishes a safe regeneration state.
- Wrapped owned configuration/index edits with acquisition tracking. A failed initial replacement remains conflicted, even if bytes later equal the original. An edit never acquired by the harness is safe only after exact-original comparison; an acquired edit requires a true restore result and exact original bytes. Independent restorers and the evidence recorder still run after failure.
- The disabled phase now awaits both owned Worker and Astro shutdown before configuration restoration/configure. Every configure call passes through a confirmed-runtime-stop and input-snapshot gate. Final regeneration additionally requires all source/config/index restoration flags. Post-restoration source checks compare the initially absent Room files with original absence, because the existing native ownership helper retains its retired owned-byte map after restoration.
- Added tests/composition-c-worker-cleanup.test.ts. Failure injections cover asynchronously rejected source restoration, false config/index returns, Worker/site shutdown failure, independent restoration after failure, stale successful flags, real pre-write revoked config/index ownership preserving external bytes, no configure on conflict, and exact source absence after actual async restoration.

Repair evidence under .generated/composition-c-task5/:

- review1-red.log: initial missing helper RED. review1-regression-red.log: after extraction, temporarily reinstated the reviewed missing-await/ignored-false/Worker-only-stop defects; the new assertions failed with exit 1. Exact fixed helper bytes were restored before GREEN. The detached rejection in this deliberate reproduction is not presented as a passing run.
- review1-green.log: six focused cleanup/context/manifest/Worker test files, 37 tests passed.
- review1-check.log: pnpm check exit 0; 50 Astro files; zero errors, warnings or hints. Explicit Buffer.compare follows repository conventions under the mixed Worker/Node type environment.
- review1-e2e.log: one actual Worker/D1/browser test passed in 13.3 seconds. Final repaired proof directory worker-pNUWzP contains worker-proof.json, manifest-enabled.json, commands.log and cleanup.json. Offering/Room/retry acceptance, draft/unknown/disabled rejection, two scalar-text inquiry rows, two accepted local jobs/captures, no rejected-key rows and outboundCalls=[] with sending disabled remain verified. All runtime-stop and exact-restoration flags are true. Configured ports were independently confirmed free afterward.
- review1-e2e-superseded.log and worker-aUZF96 retain the first repaired attempt: all processes stopped and all sources restored, but the pre-save source assertion falsely rejected the expected deleted fixture after restoration. Regeneration was refused by that safety check; the final original-absence check fixes it and is regression-tested. No external bytes were overwritten.

Known warning ledger: Node 24 emits the documented experimental node:sqlite warning; Playwright/Astro emit the inherited FORCE_COLOR/NO_COLOR warning. These messages are retained in raw logs; no dependency, global environment, warning suppression or product change was introduced. They do not represent failed assertions. Focused tests and the actual lifecycle proof were rerun because harness lifecycle behavior changed. The prior full-suite/build results remain valid product evidence; no full-suite replay was performed merely to reconfirm unchanged app code. Controller independent rereview remains required.
