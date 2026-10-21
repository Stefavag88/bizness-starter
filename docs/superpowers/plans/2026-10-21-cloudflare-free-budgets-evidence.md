# Local runtime budget implementation evidence

Status: **Local implementation verified. Hosted qualification pending.** Branch: `codex/free-runtime-budgets`. Product implementation through `cb6646c`; this record contains the final verification results. No deployment, account configuration, real sending, provider credentials or administrator-list changes took place.

## Versions and checks

Node 24.12.0, pnpm 10.13.1, Astro 7.3.6, TinaCMS 3.14.3 / CLI 4.0.1, Wrangler 4.148.0, Vitest 5.0.3 and Playwright 1.63.0. Existing lockfile and dependencies retained.

| Check | Result |
| --- | --- |
| `pnpm check` | 75 Astro files; no errors, warnings or hints |
| `pnpm test` after final fixes | 1,153 main tests passed; one existing skipped; 44 site tests passed |
| `pnpm build`, `pnpm worker:check` | Public build and local Worker dry-run passed |
| `pnpm test:runtime-budgets` after final fixes | All three profiles, 16 ticks each across four admission days; native D1/Queue checks passed |
| `pnpm test:static-routing` | Public assets/misses bypass Worker; privileged routes invoke it; read-only missing-D1 regression fixed and accepted |
| `pnpm test:profiles` | All six profile/article combinations passed CMS build, public build, Worker dry-run, local migrations and browser check |
| `pnpm test:initialization` after final fixes | Five independent preset clients installed, checked, tested, built and Worker-bundled; neutral passed both default and positive allowance |
| Admin Playwright `e2e/admin-usage.spec.ts` | Three local desktop/mobile/threshold checks passed; no browser exceptions or narrow overflow |
| `pnpm report:capacity` | Generated `capacity-final.json` remains honestly `not_qualified` with missing measurements listed |

The profile/CMS matrix preceded the final runtime fixes; the full suite, native three-profile D1/Queue acceptance, Worker bundle and all five independent clients were rerun afterward. Public templates/styles and profile configuration did not change. Final static routing and local browser checks run again at handoff. Initialized-client checks retain preexisting unused-import and dependency build-script notices; they contain no new failures.

## Dataset and provenance

Native runtime fixture: ten enquiries per profile, eight interested subscribers and one campaign in newsletter/nurture, one nurture reconciliation fixture, four UTC admission days, allowance six/reserve two used only in disposable fixtures. This is a safety test dataset, **not a supported production sending allowance**.

| Profile | Scheduled SQL max | Local rows read max | Local rows written max |
| --- | ---: | ---: | ---: |
| enquiries | 24 | 67 | 47 |
| newsletter | 29 | 73 | 79 |
| nurture | 31 | 72 | 64 |

Telemetry's own upsert is included in SQL counts. Seed and diagnostic fixture writes are separate. Row metadata comes from local Wrangler/workerd D1 results, **not Cloudflare billing**. Queue duplicates did not resend; synthetic preclaim exhaustion requested retry; uncertain sending leases stayed unknown. Workflow reconciliation binding is substituted in this harness: actual hosted Workflow/CPU qualification remains pending. Unit datasets additionally cover 500/5,000/50,000-member audiences, sparse/inactive candidates, atomic allowances, whole-tick lanes, cold JWT verification, failures and lifecycle races.

Raw reproducible native traces: `.generated/evidence/runtime-budgets/`; full owned verification logs archived under its `logs/` directory. Independent client evidence and generated rehearsal clients are intentionally retained by the existing verifier at `C:/Projects/.starter-rehearsal-NY5aIL`. The expected-failure positive-allowance rehearsal is retained at `C:/Projects/.starter-rehearsal-D8KkRA`. Native temporary D1/Queue resources and all temporary runtime processes are cleaned; the original local CMS stack is restarted at handoff. Canonical project configuration and the independent architecture audit are preserved.

## Independent review and fixes

One fresh read-only whole-change review examined `e9e8e02..c85de29`. All six actionable findings were reproduced and corrected in a single fix pass:

1. Sparse dispatch lane scans: additive migration 0005 and actual-query plan regressions select partial transactional/marketing due indexes.
2. Post-filter audience scans: indexed interest-ID candidate pages, eligibility filtering within that page, cursor progress over rejected candidates; no false completion on an empty eligible page.
3. Worker request overrun: the 101,440-versus-80,000 case cannot qualify; all modeled allowances are checked and exceeded dimensions are reported.
4. Estimate cache truth: actual observation timestamp retained, cached eligibility disclosed before SEND, changed cutoff invalidates the scan.
5. Partial dispatch failure: known successful publications recorded before subsequent failures; ambiguous attempts still retain consumed daily reservations.
6. Client configuration: a real initialized client reproduced failure at allowance ten; omission defaults are now tested on an explicit fixture and configured clients pass.

No deferred minor review findings. Hosted CPU/billing/entitlements/account metrics/live Access, the provider adapter, preexisting administrator queries and separately scoped architecture/CMS/Turnstile/isolation/retention work remain unqualified; local evidence does not lift production blockers. See [Runtime budgets](../../RUNTIME_BUDGETS.md) and [Usage & Capacity](../../USAGE_CAPACITY.md).

## Execution ledger and decisions

The chronological ledger includes corrections and the implementation rulings. Local-only choices do not certify cloud costs or performance.

```text
# SDD ledger — plan: docs/superpowers/plans/2026-10-21-cloudflare-free-budgets.md

Execution: native, one independent final review. User approved proceeding; hosted actions remain excluded.
Base: e9e8e02. Approved plan/spec committed separately; independent architecture audit remains untracked.
Ruling: work in the existing independently initialized C:/Projects/bizness-starter-v2 checkout on new codex/free-runtime-budgets branch — preserves the current local application path and avoids silently relocating a live CMS checkout; no main branch changes, merge or push — cost: branch isolation shares the checkout, so stop only its owned launcher before lifecycle checks.
Owned launcher session 20177 stopped with Ctrl+C before tests. Restart dev:cms after local verification.
Pre-flight 1->2/3/4: policy and scope shared; reservations must be consumed through explicit adapters, never double-charged.
Pre-flight 2->3/5/6: persistent schema must include estimate state before any runtime acceptance; daily admissions are attempts, not delivered email counts.
Pre-flight 3->4: all direct helper callers must preserve a shared scope; backwards direct test/local calls receive a bounded helper context only at a genuine entry boundary.
Pre-flight 4->6: telemetry is best effort and covered by the same SQL ceiling; read-only and rejected HTTP paths must not persist observations.
Pre-flight 5->6/7: qualification and provider metrics remain conditional/unconfigured locally; no fake cloud totals.
Pre-flight 1..6->7: new files must enter explicit client export inventory, production readiness remains blocked.
Task 1: in progress.
Task 1: complete (0ce1bf2..HEAD). RED missing modules observed; GREEN 79 tests, TypeScript verification recorded. Scope/failed/batch/isolation assertions passed. Baseline full suite passed before implementation.

Task 1: Correction: initial tsc found Object.fromEntries type loss; prior completion recorded before reviewing command status. Fixed using a typed accumulator. Added red/green double-meter regression; preserved original environment for helper reservations. Native command exit checks are mandatory before subsequent commits.
Task 2: complete (97ff534..HEAD). RED missing modules; GREEN 13 focused tests plus tsc. Atomic 10/3 allowance, first-insert guard, UTC rollover and telemetry failure covered. No source data changed.

Task 3: Ruling: expose reservation.remaining() to preflight whole dispatch units — prevents running out between a daily reservation, Queue publication and state persistence.
Task 3: Ruling: migration 0004 adds selection indexes instead of revising committed migration 0003. Existing multi-record Workflow failure test now checks the next tick, matching the approved one-running-record cap.
Task 3: Ruling: cleanup uses the maintenance lane's spare statement for an atomic per-window claim (3 SQL plus 1 telemetry); duplicate ticks cannot double the planned cleanup volume. Empty dispatch probes avoid fairness queries when no work exists.
Task 3: complete (01201d1..HEAD). Whole nurture tick, 500/5000/50000 audience bounded cursor, repeated-window cleanup, legacy lifecycle tests: 39 pass; tsc passed. Hosted allowance remains null.

Task 4: complete (62c17ee..HEAD). RED missing outcomes/observations; GREEN 115 tests plus tsc. Full delivery reservation prevents partial claims; indexed final-state read reports durable outcomes without rewriting critical claim/send logic. No double-count on duplicate delivery.
Task 4: Ruling: delivery uses one additional indexed final-state read inside its ten-statement unit, rather than replacing reviewed consent/race branches. Existing unknown-outcome tests passed.
Task 4: Ruling: jose customFetch+jwksCache preserve trusted cached key data while metering each invocation's actual certificate fetch. SNS retries set to zero so owned HTTP attempts are explicit.
Task 4: Ruling: Workflow metrics are step deltas under a conservative logical-run guard. Read-only/rejected requests add no D1 telemetry. Proxy ExecutionContext to retain new native tracing/abort/props exports while collecting owned waitUntil work.
Next: Task 5 capacity/estimate; Task 6 admin UI; Task 7 acceptance/export/docs/review. Owned launcher 20177 stopped; restart dev:cms at handoff. Hosted actions/admin email lists remain untouched.
Task 5: complete (7f7b271..HEAD). RED missing modules + existing-day usage regression; GREEN 8 focused tests, tsc, CLI produced honestly not_qualified report. Audience estimates inspect <=500 candidates per request, never return email addresses; pre-send preview remains conditional. Forecasts include initial daily usage and aggregate competing backlog; no exact provider/date promises.
Task 6: complete. Signed-JWT and failed-card/zero/null/window/backlog coverage: 49 focused tests plus tsc; actual local Worker Playwright desktop/mobile/70-85 threshold checks: 3 pass. Provider readings remain Not configured; no telemetry writes per view.

Task 7: export RED missing modules/CLI observed, GREEN 5 tests. Disposable native D1/Queue fixture covers 16 ticks/profile across four admission days: max SQL 24/29/31, duplicate Queue publications do not resend, preclaim exhaustion requests retry, unknown lease outcomes preserved. Initial harness incorrectly advanced a simulated day while a real Queue consumer was still sending; fixed fixture to await consumer settlement before advancing time, preserving runtime semantics. Workflow reconciliation binding is explicitly substituted, not hosted Workflow proof. Owned Worker CLI PID36548 (session from Task6) stopped by its verified exact command before lifecycle suites.
Task 7: full check clean (75 Astro files); main suite 1145 passed/1 preexisting skipped plus 44 site tests. Build and Worker dry-run passed. Native harness passed again. Routing caught missing-DB proxy construction on read-only requests; regression RED then GREEN plus actual static routing acceptance. Profile/client lifecycle checks continuing; implementation snapshot committed for the single final review.
Final review package: review-package helper is absent in installed skill; wrote equivalent immutable SHA/requirements/evidence handoff directly.
Final review: six findings verified. Sparse dispatch/index plans, sparse audience pages, capacity request overrun, cached estimate/cutoff invalidation and partial publication telemetry reproduce RED (six failing assertions). Client configuration assertion verified in source; replacing the weak source-string check with an actual independently initialized positive-allowance run. Profile matrix finished successfully in all six configurations (three profiles x articles on/off), canonical project.json restored.
Final: Ruling: reviewer-declined hosted CPU/billing/entitlements/account/live Access, provider analytics, preexisting administrator queries, architecture-audit/CMS/Turnstile/isolation/retention issues remain outside this approved local change; profile/client results are independently verified here — cost if wrong: these remain launch blockers and must not be inferred from local test success.
Final fix pass: six findings reproduced (bounded lanes, bounded candidates in both paths, excess Worker requests, cached time/cutoff, known publications after later failure, actual initialized client positive allowance). Replaced source-text assertion with real client regression: C:/Projects/.starter-rehearsal-D8KkRA/neutral failed pnpm test with positive limit10, as expected; source/fixture bytes restored. First five runtime fixes GREEN 24 tests; client default fixture fixed, full independent rerun pending. Added migration0005 for lane partial indexes and exported it; no applied migration rewritten.
Final: fixed sparse lane scans — actual dispatch query-plan regression RED→GREEN with additive migration0005.
Final: fixed post-filter audience scans — inactive candidate cursor regressions RED→GREEN for fanout and estimates.
Final: fixed qualification with excess baseline requests — 101440-versus-80000 regression RED→GREEN, every modeled allowance checked and exceeded dimensions reported.
Final: fixed cached observation time/cutoff — cached suppression/cutoff and pre-SEND observation display regressions RED→GREEN.
Final: fixed lost known publications after later ambiguous failure — scheduler telemetry regression RED→GREEN; daily reservation remains spent.
Final: fixed initialized-client positive allowance — actual independent neutral client failed with limit10 before fix, then passed both default/positive after fix.
Final suite after the fix pass: 1153 main tests pass, 1 preexisting skip, 44 site tests pass. Check: 75 Astro files, no diagnostics. Worker dry-run and native D1/Queue acceptance pass across all three profiles again. No second reviewer dispatched; no deferred minor findings.
Task 7 independent-client rehearsal: C:/Projects/.starter-rehearsal-NY5aIL; five preset clients being built with exact source snapshot and positive-allowance regression on neutral. Owned native runtime fixture cleaned, independent client evidence retained by existing verifier.
Task 7: complete. Five independent clients passed all stages (neutral also positive allowance); final check/routing/local index verification and 3 browser tests pass. Source project.json unchanged; architecture audit SHA256 2BA1467FE4B83E45827042938E3E20DD63548E072D91486C248FB9FE63C5E05A preserved. Original local dev:cms stack restarted in owned PTY37035; site4330, Worker8790, Tina4010. Actual /en,/el,/cms/index.html,/admin/usage,/api/health return200; actual provider status not_configured and allowance null. Hosted milestone8 remains pending.

```
