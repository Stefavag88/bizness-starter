# Cloudflare Free Budgets and Usage Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the owner selects it. Steps use checkbox syntax. Preserve the requested preference for native implementation with one independent whole-change review at local handoff; do not introduce per-task agents/review gates without a new request.

**Goal:** Bound the starter's Free-plan work, pace multi-day campaigns and give administrators accurate, clearly scoped application usage statistics, with provider analytics connected during authorized hosted setup.

**Architecture:** Keep static Astro and the existing Worker/D1/outbox/Queue/Workflow boundaries. Use one pure versioned policy, an invocation-scoped reservation ledger and atomic daily admission records; add bounded telemetry, a shared capacity/estimate model and an administrator-only usage page. Provider metrics remain explicitly unconfigured in local delivery.

**Tech Stack:** Existing pinned TypeScript, Zod, Node SQLite/Vitest, Wrangler, Cloudflare Worker/D1/Queues/Workflows and Playwright; no added product dependencies.

**Spec:** [Consolidated design](../specs/2026-10-21-cloudflare-free-budgets-design.md). Read it alongside this plan. Status: local Tasks 1–7 implemented and verified; hosted milestone 8 pending. Source base: `e9e8e02` on `codex/starter-v2-presets`.

## Global Constraints

- Use Node 22.x or 24.x, pnpm 10.13.1 and the existing pinned stack.
- Preserve EN/EL copy, design tokens, routes and canonical content. Keep project Markdown English.
- Normal invocation ceilings: 40 attempted SQL statements, 40 external subrequests and 800 internal-service operations. Failed attempts and every batch element count conservatively. CPU qualification is separate.
- Scheduler SQL allocations are enquiries 32/0/0/4, newsletter 24/10/0/4 and nurture 12/10/14/4 for dispatch/campaign/enrollment/maintenance-and-telemetry. Their totals are 36/38/40.
- Dispatch job caps 28/20/8 are upper candidates, not guaranteed throughput. Daily reservations, selection/fairness, recovery and telemetry must fit the allocations and can reduce actual admitted work.
- Initial Queue consumer batch/concurrency: one message/one invocation. Preserve the configured minimum provider interval.
- Maintenance: up to 100 expired rows/table per fifteen-minute UTC window, preserving current token grace semantics. No new personal-data retention policy.
- Unlimited campaign audience size means incremental processing, not unlimited resource capacity. Preserve approval hashes, SEND confirmation, consent/generation checks, suppression and the 48-hour per-subscriber marketing interval.
- A null daily allowance means unconfigured: defer hosted admissions, preserve local capture simulation and retain existing production blockers.
- Warning/critical defaults are 70/85 percent, strictly ordered below 100. Provider collection is not part of local implementation; no account/token provisioning, live sends or hosted deployment.
- Never edit generated output or applied migrations. Include runtime additions in the explicit client export inventory.
- Stop owned launchers before lifecycle/profile tests; do not stop other projects' processes. Both original source repositories remain read-only.

## Review Focus

1. Ambiguous Queue publication or SES acceptance must retain consumed reservations/quarantine and never cause an automatic duplicate send. Tests: Tasks 2 and 4.
2. A full campaign backlog, stalled campaign or failing Workflow lookup must not starve transactional work, another campaign or cleanup. Tests: Task 3.
3. Concurrent ticks, UTC rollover and a restart must not overspend a daily lane or reset recipient progress. Tests: Tasks 2 and 3.
4. Missing, stale or partially collected metrics must not appear as zero, complete account usage or a guaranteed completion date. Tests: Tasks 5 and 6.
5. An enquiries administrator must access usage while editors/remote unauthenticated users cannot; resource identifiers, credentials and personal data must not leak. Tests: Task 6.

## File responsibilities

- `packages/config/runtime-budgets.mjs` plus `.d.mts`: immutable policy and configuration parsing, no filesystem/browser side effects.
- `worker/budget.ts`: one-invocation reservations, attempted-operation observations and metered environment adapters.
- `worker/admissions.ts`: atomic daily release allowance and protected transactional capacity.
- `worker/scheduler.ts`: whole-tick lane orchestration; helpers remain in delivery/campaign/workflow modules.
- `worker/usage.ts` and `worker/usage-contracts.ts`: bounded application rollups/snapshots and source/freshness contracts.
- `worker/usage-page.ts`: protected HTML dashboard and client refresh code under the existing nonce CSP.
- `packages/runtime-capacity/model.mjs` plus `.d.mts`: pure workload calculations shared by the offline report and campaign estimates.
- `worker/campaign-estimates.ts`: bounded audience/eligibility observations and pre-send estimate projection.
- `scripts/report-capacity.mjs` and `scripts/verify-runtime-budgets.mjs`: offline reports and owned disposable runtime proof.
- `migrations/0003_runtime_budgets.sql`: additive indexes, daily admission, cursor and rollup state.

## Task 1: Policy and metered execution boundary

**Files:** Create policy files and `worker/budget.ts`; modify `packages/config/project.mjs`, `packages/config/project.d.mts`, `worker/types.ts`, `scripts/configure.mjs`, `tests/db.ts`; create `tests/runtime-budget-policy.test.ts`, `tests/runtime-budget-ledger.test.ts` and `tests/helpers/metered-runtime.ts`.

**Interfaces:**

- `resolveRuntimePolicy(profile: 'enquiries'|'newsletter'|'nurture'): RuntimePolicy` returns the exact ceilings/allocations in Global Constraints and the profile's candidate job cap. Export the `RuntimePolicy` type from the declaration file.
- Project infrastructure adds `runtimeBudget: {policyId:'cloudflare-free-v1'; dailyDispatchLimit:number|null; transactionalReserve:number; warningPercent:number; criticalPercent:number}`. Defaults: Free policy/null/0/70/85. Require positive safe integers when configured, reserve <= limit, and reserve zero when limit is null. Report validation must additionally check the selected workload's capacity; config parsing alone does not certify it.
- Generate a JSON `RUNTIME_BUDGET` Worker variable from parsed configuration. Treat a missing legacy variable as the safe unconfigured default; malformed supplied JSON is an error, not an unlimited fallback.
- `createBudgetScope(kind: 'http'|'scheduled'|'queue'|'workflow', policy: RuntimePolicy): BudgetScope`.
- `BudgetScope.tryReserve(lane: string, cost: OperationCost): BudgetReservation|null`, where `OperationCost = {sqlStatements:number; externalCalls:number; internalCalls:number}`. Reservations expose `consume(cost)`, `releaseUnused()` and scopes expose `snapshot()` with attempted/reserved/remaining totals and named lane observations.
- `meterEnvironment(env: Env, scope: BudgetScope, reservation?: BudgetReservation): Env` intercepts executed D1 methods/batch elements, Queue operations and Workflow binding calls; external fetch accounting is explicit at the owned security/provider call sites. Preparation/bind alone consumes no execution allowance. Do not double-charge an execution after reserving it. A reserved adapter consumes the supplied reservation; an unreserved adapter atomically charges the scope. Never use mutable module-global active-reservation state.
- Define `BudgetSnapshot = {kind:string;attempted:OperationCost;reserved:OperationCost;remaining:OperationCost;lanes:Record<string,OperationCost>;outcomes:OutcomeCounts}` and `OutcomeCounts = {accepted:number;failed:number;unknown:number;deferred:number}`. `BudgetScope.recordOutcome(outcome:keyof OutcomeCounts)` records only durable outcomes. `RuntimePolicy` exposes `ceilings`, `scheduledSqlAllowances` keyed by the four named lanes, `maxDispatchJobs`, `maxFanoutRecipients`, `consumerBatchSize`, `consumerConcurrency`, `cleanupLimit`, `cleanupEveryMinutes` and `telemetryStatementReserve`, with values pinned above (telemetry reserve one).


- [x] **Step 1:** Add failing tests for all three allocations, backward defaults, invalid/null reserve combinations, malformed runtime JSON, 39/40/41 statement boundaries, failed calls, rollback and two interleaved invocations. Assert batches count each executed statement but one binding call, and independent observations detect a bypass.
- [x] **Step 2:** Run `pnpm exec vitest run tests/runtime-budget-policy.test.ts tests/runtime-budget-ledger.test.ts`; expect missing policy/ledger behavior to fail, not an unrelated environment error.
- [x] **Step 3:** Implement the pure policy/config types, generated variable and ledger/metering adapter. Keep explicit reservation and attempted-work accounting distinct; no refunds for calls already attempted. Update the transactional SQLite test helper without changing existing transaction semantics.
- [x] **Step 4:** Rerun the focused tests plus `tests/project-config.test.ts`, `tests/configure-safety.test.ts` and `tests/access-configuration.test.ts`. Expected: existing defaults remain compatible and every new boundary assertion passes.
- [x] **Step 5:** Commit only Task 1 files after reviewing the diff. Suggested message: `feat: define conservative Free runtime budgets`.

A minimal Task 1 boundary assertion (expand with the cases above):

```ts
it('refuses an execution beyond forty attempted statements', () => {
  const scope = createBudgetScope('http', resolveRuntimePolicy('enquiries'));
  const reservation = scope.tryReserve('request', {sqlStatements:40,externalCalls:0,internalCalls:0});
  expect(reservation).not.toBeNull();
  reservation!.consume({sqlStatements:40,externalCalls:0,internalCalls:0});
  expect(scope.tryReserve('request', {sqlStatements:1,externalCalls:0,internalCalls:0})).toBeNull();
  expect(scope.snapshot().attempted.sqlStatements).toBe(40);
});
```

## Task 2: Durable daily admissions and bounded observations

**Files:** Create `migrations/0003_runtime_budgets.sql`, `worker/admissions.ts`, `worker/usage-contracts.ts` and the rollup write portion of `worker/usage.ts`; add `tests/runtime-admissions.test.ts` and `tests/runtime-usage-storage.test.ts`; modify operation types as needed.

**Interfaces:**

- Migration creates `runtime_admission_day(day TEXT PRIMARY KEY,total INTEGER NOT NULL,marketing INTEGER NOT NULL)`, `runtime_cursor(key TEXT PRIMARY KEY,position TEXT NOT NULL)` and `runtime_usage_day` keyed by `(day,entrypoint)` with counters `observations`, `sql_statements`, `external_calls`, `internal_calls`, `queue_admissions`, `deferred`, `accepted`, `failed`, `unknown` plus `last_observed_at`. Also create `runtime_campaign_estimate` keyed by campaign ID with `cutoff_at`, `cursor`, `matched`, `delayed`, nullable `next_eligible_at`, `complete` and `generated_at`; Task 5 owns the progressive observation logic. Use nonnegative constraints. Index existing expiry, due/lease, audience/state/cursor predicates only when query plans demonstrate the benefit.
- `reserveAdmission(env: Env, scope: BudgetScope, lane:'transactional'|'marketing', at:number): Promise<{day:string;lane:'transactional'|'marketing'}|null>`. Use one atomic conditional insert/upsert/returning operation. Enforce total < daily limit and marketing < limit minus reserve, including the first row; no read-then-write race.
- `readAdmissionDay(env: Env, at:number): Promise<{configured:boolean;limit:number|null;reserve:number;used:number;marketingUsed:number;remaining:number|null}>` uses one indexed day lookup.
- `persistUsage(env: Env, scope: BudgetScope, observation: UsageObservation): Promise<void>` uses at most one rollup upsert for the entrypoint/day. Its own SQL overhead is precharged; a write failure produces a sanitized log and does not turn completed business work into a retry.
- `UsageObservation` contains entrypoint, observation timestamp, source/coverage and named outcome counts; no email, body or token. `MetricReading` contains `id`, nullable `value`, `unit`, `source:'application'|'provider'|'estimate'`, `scope:'deployment'|'account'`, time window, `updatedAt` and `status:'available'|'partial'|'stale'|'unavailable'|'not_configured'`.

- [x] **Step 1:** Write failing tests with fixture limit 10/reserve 3: marketing stops at seven while transactionals can use the remaining three; all-marketing first-insert bypass fails; concurrent reservations never exceed ten. Test UTC rollover, restart, republish attempts and no refund after ambiguous publication. Verify migration preserves all existing records.
- [x] **Step 2:** Run `pnpm exec vitest run tests/runtime-admissions.test.ts tests/runtime-usage-storage.test.ts`; expect the new behavior to fail before implementation.
- [x] **Step 3:** Implement the additive migration and atomic reservations. Add observation persistence with a reserved telemetry slot; executed/failed telemetry statements still count. Do not add a reservation refund path after Queue publication may have happened.
- [x] **Step 4:** Assert telemetry persistence failure leaves a previously committed accepted job/enquiry unchanged and logs no personal data. Assert the 40-statement ceiling includes its upsert. Rerun focused tests plus `tests/subscription-correctness.test.ts` and `tests/operations-recovery.test.ts`.
- [x] **Step 5:** Commit the reviewed Task 2 files. Suggested message: `feat: persist daily dispatch admissions and usage observations`.

Task 2 fixture assertions after concurrent admissions with limit 10/reserve 3:

```ts
expect(marketingGranted).toBe(7);
expect(totalGranted).toBe(10);
expect((await readAdmissionDay(env, at)).remaining).toBe(0);
```

## Task 3: Bound the complete scheduled tick and multi-day campaigns

**Files:** Create `worker/scheduler.ts`; modify `worker/index.ts`, `worker/delivery.ts`, `worker/campaigns.ts` and `worker/workflow.ts`; add `tests/runtime-scheduler.test.ts` and `tests/runtime-campaign-pacing.test.ts`; retain existing delivery/workflow/operations tests.

**Interfaces:**

- `runScheduled(env: Env, at:number): Promise<ScheduledResult>` creates one scope and returns `{deferred:boolean;failures:number;usage:BudgetSnapshot}` after independent lane attempts and best-effort telemetry. Real task failures still reach the scheduled error path; normal budget stops do not.
- Background helpers accept a shared `WorkContext = {scope:BudgetScope; at:number}` and return `WorkResult = {processed:number;deferred:boolean}`: `dispatch(env,context)`, `fanOut(env,context)`, `startEnrollments(env,context)`. Keep direct local helper/test call sites explicit rather than accidentally resetting budgets inside helpers.
- Dispatch reserves complete recovery/select/admission/publication/final-state units. Jobs without daily capacity stay pending in D1. A queue publish result that may have succeeded consumes its reservation; existing idempotency/lease logic handles later reconciliation.
- Campaign fan-out handles at most one selected campaign/four recipients per tick within its SQL lane. Persist campaign rotation independently enough for later campaigns to progress after a campaign-specific failure; recipient cursor advances only in the job-insert transaction. Keep the existing approval/cutoff semantics.
- Enrollment selection targets one pending and one running record with existing cursor wrap semantics within 14 statements; reserve create/get/status fallback operations separately.

- [x] **Step 1:** Write a red whole-tick test that fills dispatch, campaigns, pending/running enrollments and cleanup together under nurture. Assert observed total <=40, every lane remains within its allocation, and daily reservations/telemetry are included. Test separate scopes across simultaneous invocations.
- [x] **Step 2:** Add red multi-tick tests for transactional/marketing fairness, one permanently failing campaign among healthy campaigns, failed Workflow lookups, recovery backlog and exhausted daily allowance. Seed 500/5,000/50,000 compact eligible subscribers and advance simulated UTC days without eager full-audience enqueueing or duplicate recipient intents.
- [x] **Step 3:** Implement scheduler ordering: dispatch progress, bounded campaign/enrollment progress, reserved maintenance and telemetry. Keep one minute Cron; consumer batch/concurrency become one. Chunk recovery predicates and fifteen-minute cleanup with indexed key subqueries capped at 100 rows/table, preserving token grace. Recalculate actual jobs/tick from complete reserved work costs; the candidate caps are only upper bounds.
- [x] **Step 4:** Run `pnpm exec vitest run tests/runtime-scheduler.test.ts tests/runtime-campaign-pacing.test.ts tests/delivery-workflow.test.ts tests/operations-recovery.test.ts tests/backend-profiles.test.ts`. Add assertions for duplicate/missed cleanup windows, expiry arrival versus drain rate and no personal-data deletion outside the original cleanup targets.
- [x] **Step 5:** Commit the reviewed Task 3 diff. Suggested message: `feat: pace scheduled work within invocation and daily budgets`.

Task 3 acceptance assertions (independent observation is required):

```ts
expect(observed.sqlStatements).toBeLessThanOrEqual(40);
expect(result.usage.attempted.sqlStatements).toBe(observed.sqlStatements);
expect(duplicateLogicalRecipientIntents).toBe(0);
```

## Task 4: Preserve delivery semantics across metered entry points

**Files:** Modify `worker/index.ts`, `worker/delivery.ts`, `worker/workflow.ts`, `worker/security.ts`, `worker/webhook.ts`, `worker/newsletter.ts`, `worker/campaigns.ts` and budget observation helpers; create `tests/runtime-delivery-budget.test.ts`, `tests/runtime-entrypoints.test.ts`.

**Interfaces:**

- `deliver(env: Env,id:string,context:WorkContext): Promise<DeliveryResult>` reports `{outcome:'accepted'|'failed'|'unknown'|'skipped'|'deferred'|'noop'}` only after the corresponding durable transition. `drainLocal(env,context)` uses the same scope and a bounded simulated capture path.
- HTTP routing creates one request scope; all owned `waitUntil` work shares it. Queue routing creates one scope per actual batch. Raw authentication/origin rejection, asset/health/CMS reads and dashboard reads do not introduce a telemetry write.
- Pass metered environments and explicit external-attempt accounting into existing helpers; signatures that already accept an environment can remain stable. Charge AWS/JWKS/SNS/Turnstile calls, including known client retries, at their actual call sites.
- Workflow metering must remain conservative across actual engine boundaries. Until hosted replay boundaries are verified, retain a shared logical-run guard rather than resetting inside arbitrary callbacks; label per-step observations as such, not exact platform invocation totals. Include step telemetry and finalization in reservations.

- [x] **Step 1:** Add red path-table tests for transactional/confirmation/welcome/campaign/nurture success; suppression, stale generation, 48-hour deferral, marketing pause, provider 429/5xx/timeout and failed acceptance persistence. Assert each path's observed statement/service count fits its complete reservation and capture adds its documented local write.
- [x] **Step 2:** Add red duplicate Queue delivery and ambiguous publication tests. Exhaust a budget immediately before claim and assert no lease/publication; simulate a finalization failure and assert no automatic resend of an unknown outcome. Deferral acknowledges only after safe recoverable state is persisted.
- [x] **Step 3:** Implement consumer/local/API/Workflow integration without changing consent, suppression, approval hashes or payload clearing semantics. Do not wrap already-metered bindings a second time or retry successful business work to repair telemetry.
- [x] **Step 4:** Run `pnpm exec vitest run tests/runtime-delivery-budget.test.ts tests/runtime-entrypoints.test.ts tests/subscription-correctness.test.ts tests/delivery-workflow.test.ts tests/security.test.ts tests/webhook-hardening.test.ts tests/access-roles.test.ts`. Assert invalid remote requests create no new D1 usage write and static page handling is unchanged.
- [x] **Step 5:** Commit reviewed Task 4 files. Suggested message: `feat: meter delivery and API work without weakening lifecycle guarantees`.

Task 4 ambiguity assertions:

```ts
expect(storedJob.state).toBe('unknown');
expect(providerSubmissionCount).toBe(1);
expect(automaticResubmissions).toBe(0);
```

## Task 5: Capacity reports and pre-send campaign estimates

**Files:** Create `packages/runtime-capacity/model.mjs`, `packages/runtime-capacity/model.d.mts`, `scripts/report-capacity.mjs`, `worker/campaign-estimates.ts`, `tests/runtime-capacity.test.ts`, `tests/campaign-estimates.test.ts` and `tests/fixtures/runtime-capacity/*.json`; modify `worker/index.ts` and `worker/pages.ts` for the pre-send preview.

**Interfaces:**

- `calculateCapacity(workload: CapacityWorkload, evidence: CostEvidence, policy: RuntimePolicy): CapacityReport`. `CapacityWorkload` is validated explicit input with daily counts for enquiries/signups/confirmations/withdrawals, campaigns with audience/start date, nurture cohorts, root/admin requests, retries/duplicates and account allocation. `CostEvidence` keys measured operation variants with SQL/service/row costs, provider rate/quota inputs, dataset/version, coverage and qualification provenance. Missing measurements remain null.
- `CapacityReport` includes qualification (`'locally_verified'|'hosted_qualified'|'not_qualified'`), named resource use/remaining, limiting resource, assumptions, missing measurements, and day-by-day pending/admitted work. Do not invent exact rows or CPU from statement counts.
- `estimateCampaign(env: Env,id:string,context:WorkContext): Promise<CampaignEstimate>` returns `{eligible:{count:number;exact:boolean}; remaining:{count:number;exact:boolean}; generatedAt:string; earliestStart:string|null; completionFrom:string|null; completionTo:string|null; conditional:boolean; constraints:string[]; dailyAllowance:AdmissionSnapshot}`. `AdmissionSnapshot` is Task 2's read-admission result. Never return subscriber records.
- Add administrator-only `GET /api/admin/campaigns/:id/estimate`; preserve campaign/profile gates. Use the same model as the CLI. Audience counting is bounded/progressive, with at most 500 inspected candidates per work unit and persisted observation cursor/time; incomplete counts are explicit lower bounds. No full-browser audience download or per-recipient request loop.
- CLI: `pnpm report:capacity --workload <file> --evidence <file> --output <file>` writes a reproducible JSON report. Unqualified inputs produce an explicit unqualified report, not a successful-capacity claim. Fatal malformed input exits nonzero.

- [x] **Step 1:** Write red table tests for shared-account deductions, 80% headroom, retry/republish amplification, zero/unconfigured marketing capacity, provider quotas, UTC rollover and multi-day nurture cohorts. Assert missing CPU/row evidence cannot yield hosted-qualified status.
- [x] **Step 2:** Write red estimate tests for 500/5,000/50,000 audiences, competing campaign/nurture backlog, the 48-hour interval, pause/suppression changes and missing provider quotas. A finite estimate is conditional until required evidence is qualified; partial counts never produce an exact date.
- [x] **Step 3:** Implement the pure model, input schemas/fixtures, CLI and bounded estimate observation/storage. Consume the estimate observation state already defined by Task 2; do not amend an applied migration. If implementation discovers another schema requirement, add a forward migration.
- [x] **Step 4:** Update campaign administration to show Estimated completion before the existing SEND confirmation. Refresh the admission decision at actual send time; an estimate is not an audience-wide reservation. Run `pnpm exec vitest run tests/runtime-capacity.test.ts tests/campaign-estimates.test.ts tests/cms-campaign-eligibility.test.ts` and the CLI against explicit qualified/unqualified fixture inputs. Confirm estimates contain no addresses and do not weaken approval hashes.
- [x] **Step 5:** Commit reviewed Task 5 files. Suggested message: `feat: report Free capacity and estimate paced campaigns`.

Task 5 missing-evidence assertions:

```ts
expect(report.qualification).toBe('not_qualified');
expect(estimate.conditional).toBe(true);
expect(estimate.constraints).toContain('hosted_measurements_pending');
```

## Task 6: Administrator Usage & Capacity dashboard

**Files:** Complete `worker/usage.ts` and `worker/usage-contracts.ts`; create `worker/usage-page.ts`, `tests/admin-usage.test.ts`, `tests/runtime-usage-snapshot.test.ts`, `e2e/admin-usage.spec.ts`; modify `worker/index.ts`, `worker/pages.ts`, `tests/access-roles.test.ts` and docs for local access.

**Interfaces:**

- `readUsageSnapshot(env: Env,window:{from:string;to:string},at:number): Promise<UsageSnapshot>` accepts validated UTC dates with inclusive spans of at most seven days; rejects reversed/invalid/oversized windows with 400 before querying. It does not persist a telemetry observation for the read.
- `UsageSnapshot` has `generatedAt`, `window`, sanitized `deployment:{name,environment}`, `admission:AdmissionSnapshot`, `application:MetricReading[]`, `provider:{status:'not_configured'|'unavailable'|'stale'|'available';updatedAt:string|null;metrics:MetricReading[]}`, `forecasts:MetricReading[]` and `backlog:Record<'pending'|'queued'|'failed'|'unknown',{count:number;exact:boolean}>`. Reuse Task 2's metric contract and Task 5's provenance; do not create incompatible copies.
- Application history reads at most seven days of fixed-entrypoint rollups. Backlog uses indexed queries capped at 1,001 records/state, returning at most 1,000 with exact false if capped; the page shows 1,000+ rather than an invented exact count. Additional counters must remain bounded. Raw D1 database rows/bytes and platform Worker requests are provider metrics, not fabricated from these observations.
- `renderUsagePage(): Response` renders an accessible shell using existing `html()` nonce/CSP behavior. The browser fetches its sanitized snapshot from `GET /api/operations/usage?from=YYYY-MM-DD&to=YYYY-MM-DD` and renders text with safe DOM operations, not raw API HTML.
- `GET /admin/usage` and the operations endpoint require `admin()` in all profiles before the campaign-only gate. Keep protected responses no-store. Add a Usage & Capacity link in campaign administration; enquiries uses the documented direct route.
- Show current day/reserve/used/remaining, accepted/deferred/failed/unknown observations, bounded backlog, seven-day history and conditional completion information. Warning >=70 and critical >=85 use configured thresholds; unavailable readings have no progress percentage. Show local simulation and source/scope/coverage/freshness explicitly.
- Application snapshots may use a bounded best-effort five-minute server cache per deployment/window and manual refresh with a 60-second client cooldown; no unbounded polling and no telemetry write per view. Authorization occurs before cache lookup. Cached timestamps remain visible.
- Local provider values are typed `not_configured` with null values. Do not implement or fetch Cloudflare analytics in this task. Prepare display contracts for available/stale/partial fixtures so the later integration is additive.

- [x] **Step 1:** Add red signed-JWT route tests for administrators in enquiries/newsletter/nurture, editors, missing/expired/wrong-audience tokens and spoofed remote local labels. Assert denied requests query neither usage data nor provider APIs.
- [x] **Step 2:** Add red snapshot/render tests for UTC boundaries, seven-day limits, 70/85 threshold edges, null limits, zero-valued genuine observations, partial/stale/provider-unconfigured fixtures and capped backlog. Assert project data cannot be selected by client-supplied account/database IDs or arbitrary query parameters.
- [x] **Step 3:** Implement snapshots, routes and protected HTML. Keep sources/units distinct: admission use is application activity; actual Queue operations and billable D1 rows belong to provider readings. Never place a provider token, enquiry, subscriber address, message body or signed action link in the response.
- [x] **Step 4:** Run `pnpm exec vitest run tests/admin-usage.test.ts tests/runtime-usage-snapshot.test.ts tests/access-roles.test.ts tests/operations-recovery.test.ts`. Assert repeated view/refresh requests perform no usage upsert and a failed data card does not hide other valid cards.
- [x] **Step 5:** Run `pnpm exec playwright test e2e/admin-usage.spec.ts` against an owned local runtime. Verify keyboard access, readable narrow/desktop layouts, honest Not configured provider cards, timestamps, history and manual refresh. Do not claim hosted Access proof from local bypass. Commit reviewed Task 6 files with `feat: expose administrator usage and capacity statistics`.

Task 6 missing-provider/observer assertions:

```ts
expect(snapshot.provider.status).toBe('not_configured');
expect(snapshot.provider.metrics.every(metric => metric.value === null)).toBe(true);
expect(usageUpsertsDuringRepeatedViews).toBe(0);
```

## Task 7: Local acceptance, independent clients and handoff

**Files:** Create `scripts/verify-runtime-budgets.mjs`, `docs/RUNTIME_BUDGETS.md`, `docs/USAGE_CAPACITY.md`, `docs/superpowers/plans/2026-10-21-cloudflare-free-budgets-evidence.md`; modify `package.json`, `.github/workflows/checks.yml`, `scripts/initialize/export-manifest.json`, `scripts/initialize/client/project.test.ts`, `docs/OPERATIONS.md`, `docs/PRODUCTION_READINESS.md`, `docs/QUICKSTART.md` and applicable initialization/preset tests.

**Interfaces:**

- New commands: `report:capacity` invokes Task 5 CLI; `test:runtime-budgets` invokes the guarded owned-runtime verifier. The verifier creates isolated fixtures/resources, applies local migrations and exercises actual exported Worker handlers and Queue bindings; it never runs remote commands or alters canonical content.
- It emits `.generated/evidence/runtime-budgets/` containing per-profile path counts, row metadata provenance, resource identities, multi-tick results, observed bounds, outcome checks, errors and owned-process cleanup. Local metadata is not relabeled as cloud billing certification.
- New runtime files, pure model/declarations and migrations must be exported to initialized clients. Source-only developer harnesses/gallery remain outside client runtime unless deliberately listed. New settings default safely with no production credentials or allowance claims.

- [x] **Step 1:** Write failing acceptance/export tests for all three profiles, the combined tick budget, multi-day campaign continuation, consumer retries and an independently initialized client that can import/configure the new files. Pin the production gate: missing daily allowance/provider evidence does not become ready.
- [x] **Step 2:** Implement the disposable harness and report commands. Extend CI with deterministic budget/usage tests in the normal suite and the lifecycle verifier only in the existing guarded job. Preserve serialized generation and owned restoration/cleanup.
- [x] **Step 3:** Stop only known owned launchers and run, sequentially: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm worker:check`, `pnpm test:runtime-budgets`, `pnpm test:static-routing`, `pnpm test:profiles` and `pnpm test:initialization`. Expected: zero new failures, observed counts within policy, no remote sends and all temporary processes/fixtures cleaned up. Restart the owned local stack if requested/previously running; browser/E2E proofs run against that explicit instance. Repeat only checks justified by later changes.
- [x] **Step 4:** Publish local evidence and operational documentation: counts versus rows/billing, UTC admissions, unknown outcomes, pause/rollover behavior, telemetry coverage, dashboard access, candidate capacities and hosted prerequisites. Include exact versions/commands/dataset sizes and results. Run one independent whole-change review using the owner's native/final-review preference, resolve findings and rerun affected checks.
- [x] **Step 5:** Commit reviewed local implementation and evidence. Leave production blockers, secrets, real sending, deployment and release tagging unchanged. Handoff states Local implementation verified and Hosted qualification pending; it does not claim all planned cloud metrics exist yet.

## Milestone 8: Hosted analytics and Free-plan qualification — separately authorized

Local provider preparation is now implemented and verified through `b72d52b`, following the owner's choice to prepare code/setup before obtaining staging. See [setup guide](../../PROVIDER_ANALYTICS.md) and [preparation evidence](2026-10-21-provider-analytics-preparation-evidence.md). Selected Worker/D1/Queue mappings are prepared with partial coverage; CPU, Queue backlog and Workflow billing mappings still need live discovery. The hosted checkboxes below remain pending.


This is a genuine external dependency, not a checkbox to mark complete during local handoff. Required inputs: an authorized isolated Cloudflare Free staging account/deployment, final resource identities and read-only analytics permissions, the hosted CMS/form readiness prerequisites, provider-safe test fixtures/allowlisted recipients and the owner's data decisions where real data would be involved.

**Future files:** `worker/provider-usage.ts`, provider contract/fixture tests, environment secret bindings and hosted evidence/runbooks. They are not required for Tasks 1–7 to deliver a usable local dashboard.

**Integration contract:** `collectProviderUsage(env,window,at): Promise<UsageSnapshot['provider']>` resolves server-configured resource IDs; the browser cannot supply an account or query. Keep analytics credentials in secret bindings. Cache five minutes with bounded fetch timeouts/backoff, retain labeled stale data on failure and expose missing permissions/datasets without zero substitution. Add no second Cron. Verify actual Workers/D1/Queue/Workflow metrics, time windows, account aggregation and sampling before labeling a reading available.

- [ ] Obtain separately authorized staging resources and validate isolation; never reuse a production D1 UUID or infer isolation from ENVIRONMENT alone.
- [ ] Implement/read-only-test the provider adapter with explicit least-privilege scopes, project filtering, secret-redaction, timeout/rate-limit and stale-cache tests; connect it to Task 6's existing typed surface.
- [ ] Run cold/warm qualified-path tests: at least 1,000 observations per CPU-sensitive path; candidate p99 <=7 ms, observed max <=8 ms and no runtime-limit errors. Verify actual Free consumer entitlement and D1 batch/subrequest accounting rather than assuming local behavior.
- [ ] Compare provider metrics with application observations across known controlled workloads, including retries, feedback and observer overhead. Qualify each profile separately and tune/retest when the envelope fails.
- [ ] Review hosted changes/evidence, publish the supported workload envelopes and retain all unrelated production blockers until separately fulfilled. Provider metrics are observations, not an account-wide spending circuit breaker.

## Self-review and execution handoff

The design maps to Tasks 1–7 plus the explicit hosted milestone: policy/accounting ->1; admissions/observations/indexes ->2; scheduling/cursors/maintenance ->3; delivery/authentication/Workflow safeguards ->4; capacity/estimate ->5; admin access/provenance/UI ->6; initialized clients/runtime/CI/docs/review ->7; provider data/CPU/account evidence ->8.

The implementer must read both artifacts, preserve independently added audit documentation and verify the actual branch/worktree before changes. Scope remains local budget optimization and application usage visibility; CMS CSP, hosted Turnstile and full deployment isolation are separate work. Review the completed written plan before implementation, then use the preserved native execution method with one independent final review. No per-task user confirmation is needed once the plan is approved; genuine external account actions remain separately authorized.
