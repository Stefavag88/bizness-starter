# Cloudflare Free runtime budgets — proposed design

Date: 2026-10-21. Source snapshot: `e9e8e02` on `codex/starter-v2-presets`.
Status: **consolidated design for implementation-plan review; implementation has not started**.

## Intent and success criteria

The owner wants optimized backend budgets and an explicit account of what fits Cloudflare Free. Cover enquiries, newsletter and nurture, preserving the public design, content model and existing delivery/consent guarantees.

Success means bounded work per invocation, useful progress across invocations, measured resource cost by workload, and a reproducible Free-plan capacity report. It does not mean a universal number of visitors or emails that remains valid for every database, account, payload and retry pattern.

The owner additionally approved unrestricted campaign audience size, a configurable daily sending allowance and an estimated completion time before sending on 2026-10-21. This approves the campaign-pacing direction; it does not certify any numeric Free capacity or authorize implementation/deployment.

The owner approved adding an administrator Usage & Capacity dashboard on 2026-10-21: application statistics first, with Cloudflare analytics connected during separately authorized hosted setup.

Assumptions: Free is a supported target to investigate, not an automatic Paid upgrade; resources may share an account; configuration remains developer-owned; all Markdown stays English. Hosted accounts and retention inputs remain unavailable. Planning and local implementation must be possible without them; hosted certification remains a separate gate.

## Alternatives considered

| Approach | Benefit | Limitation |
| --- | --- | --- |
| Reduce existing batch constants only | Small initial change | Does not protect combined work, retries, SQL scans or future additions. |
| Shared policy, bounded work units and evidence-based capacity model | Covers the real invocation boundary; supports all profiles without more scheduled resources | Needs instrumentation, progress/fairness tests and cloud measurement. |
| Separate schedulers/Workers per task | Independent invocation budgets | More routing, bindings, operational coordination and potentially more account-level scheduled resources. |

Recommend the second approach. Keep one Cron and the existing outbox/queue/Workflow architecture. Add only the application-scoped daily admission accounting required for campaign pacing. Do not introduce another queue, external scheduler, Durable Object, global account billing controller or provider abstraction for this change.

## Verified platform constraints

These are provider limits, not application defaults. Recheck them when producing hosted evidence.

| Dimension | Documented Free allowance | Application planning rule |
| --- | --- | --- |
| D1 queries per invocation | 50 | Conservatively count each attempted SQL statement, including every batch element; normal ceiling 40. |
| External subrequests | 50 per invocation | Track separately; normal ceiling 40. |
| Internal-service subrequests | 1,000 per invocation | Track separately; normal ceiling 800. |
| Connections waiting for headers | 6 simultaneously | Keep background work sequential initially; any parallelism must be bounded. |
| CPU | 10 ms for Free HTTP/Cron; Workflow CPU also constrained | Use hosted CPU measurements, not wall-clock time. Verify the queue handler's actual Free entitlement separately. |
| Workers requests | 100,000/day | Include account sharing and Workflow usage; static-first public assets stay outside Worker execution. |
| D1 daily usage | 5 million rows read; 100,000 written | Include index maintenance, cleanup, retries and diagnostics. |
| Queues | 10,000 operations/day; 24-hour retention | Count messages, retries, republishing, expiry and DLQ activity. |
| Workflow usage | 3,000 steps/day; 1 GB-month state | Include cohort timing, waiting instances and terminal retention. |
| Account resource counts | 5 Cron Triggers; 10 D1 databases | Count customer/environment deployments and other account users. |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/), [Workflow pricing](https://developers.cloudflare.com/workflows/reference/pricing/).

D1's documented query limit and Workers' internal-service accounting are different dimensions. Do not collapse SQL statements, binding calls, batch round trips, rows and subrequests into one counter. Cloudflare documents `DB.batch` as one database call containing transactional statements. Our statement ceiling deliberately remains conservative regardless of how a batch is charged against a particular platform counter. Record the verified cloud accounting in the evidence report. See [D1 batch semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/).

The Queues limits page describes a consumer default of 30 seconds, while the general Workers Free model describes 10 ms CPU. Do not silently choose the more generous interpretation; verify the deployed plan and measured behavior. Until then, the candidate consumer is designed for the tighter CPU envelope. See [Queues limits](https://developers.cloudflare.com/queues/platform/limits/).

## Current issues to address

1. Dispatch attempts `3 + N` D1 statements for up to 50 jobs; cleanup adds two in the same invocation. Newsletter/nurture schedule more work before dispatch.
2. Queue consumers accept 10 messages per invocation. Delivery has different costs for transactional, confirmation, campaign, deferred, suppressed and failed jobs.
3. Cleanup deletes all eligible rows, without expiry indexes. A small statement count does not bound row scans or writes.
4. Campaign selection lacks a durable round-robin cursor. Small limits alone can starve later campaigns.
5. Existing workflow cursors rotate progress, but their wrap and failure paths also consume resources.
6. Local in-memory SQLite tests preserve transactions but do not reproduce Cloudflare CPU, row accounting or quota enforcement.
7. Local `drainLocal` and action-triggered background work differ from the hosted queue path. They must not be mistaken for a cloud-budget proof.

## Policy ownership and accounting

Use one versioned developer-owned policy, `cloudflare-free-v1`, shared by configuration, Worker entry points, tests and the capacity report. Make the selected policy explicit in project infrastructure configuration, with a backward-compatible Free default for existing projects and initialized clients. Do not expose runtime safety ceilings in TinaCMS or allow arbitrary JSON overrides above reviewed limits.

The policy contains invocation ceilings, profile lane allocations, job/recipient batch caps, maintenance chunk size/cadence and report headroom. Do not add a pretend Paid policy before measuring and reviewing it.

Each HTTP request, scheduled event, queue batch and Workflow execution context gets its own accounting scope. Propagate that scope across helper calls and `waitUntil` work belonging to the same invocation. Reset only at a genuine platform boundary; calling another function is not a new invocation. Shared module-global counters must not leak between concurrent requests.

Track attempted SQL statements, binding calls, external fetches and internal service operations separately. Count failed calls, rollback attempts and implicit client retries; charge a batch's entire statement count before submitting it. A prepared statement does not consume the execution budget until executed. Body/JSON processing, signing and certificate verification also belong in the CPU evidence.

Before starting a work unit, reserve its worst-case completion/failure cost. If it cannot fit, stop before claiming or externally publishing anything. Budget exhaustion is normal deferral, not a generic scheduled failure. Real provider/database errors remain errors. Executed work never receives a budget refund; only unused reservations can be released.

CPU cannot be hard-capped by a JavaScript ledger. Bound loops and payloads, then qualify the candidate constants with hosted measurements. Row metrics observed after a query cannot undo an oversized scan; query plans, indexes and chunks must bound work first.

## Candidate scheduled allocations

All figures below are **proposed ceilings to test**, not certified Free throughput. Lane allowances are not automatically lent to another lane in the first version.

| Profile | Dispatch SQL allowance | Campaign allowance | Enrollment allowance | Maintenance/telemetry allowance | Total allocated |
| --- | ---: | ---: | ---: | ---: | ---: |
| enquiries | 32 | 0 | 0 | 4 | 36 |
| newsletter | 24 | 10 | 0 | 4 | 38 |
| nurture | 12 | 10 | 14 | 4 | 40 |

Initial dispatch candidates are 28, 20 and 8 jobs respectively: the existing `3 + N` path uses 31, 23 and 11 statements. These caps must also satisfy service-operation and CPU gates; reduce them if measurements require it. The baseline arithmetic excludes the new daily-admission reservation and fairness costs: include those costs and lower the candidate caps as needed before accepting the implementation. Each individual error/recovery path must remain inside the relevant reservation.

Campaign candidate: one campaign per tick, at most four recipients, within ten SQL statements including durable campaign rotation and recipient cursor updates. A cursor advances only after its corresponding transactional writes succeed. Completion checks are included in the allowance. Later campaigns must progress even when an earlier campaign fails.

Enrollment candidate: one pending plus one running record per tick. Preserve both existing durable cursors and generation/consent checks. Their maximum wrap path uses eight selection/reset/cursor statements in total; two active record paths use at most six additional statements. Reserve separate Workflow service calls, including create-failure/get/status recovery. Re-derive these costs after any implementation changes.

Allocate dispatch progress before optional campaign/enrollment work. Reserve maintenance and telemetry separately so a full marketing backlog cannot suppress cleanup. The four-statement lane includes at most two cleanup deletes, one aggregate telemetry upsert and one spare statement; profile limits must include this overhead. Failed telemetry is logged without retrying completed business work. Newly generated marketing work can wait until a following tick. Transactional versus marketing selection must give both bounded progress when both are due; retain deterministic ordering within each class and durable rotation. No new sending priority may bypass existing consent, eligibility or campaign approval checks.

Keep the existing one-minute Cron. Do not claim that a per-minute maximum is sustainable for every minute of the day: daily allowances are an independent constraint.

## Campaign audiences, daily pacing and completion estimates

### Audience and eligibility

Do not add a fixed total-recipient cap to a campaign. Process its selected interest group incrementally, retaining the existing confirmation cutoff, approval snapshot, unsubscribe/suppression checks and durable recipient cursor. A batch-size limit controls one tick, not the total campaign audience. Storage, account allocations and provider capabilities still bound practical scale.

Keep the existing minimum 48-hour interval between marketing emails to one subscriber. Campaigns, welcome marketing and nurture share that interval; confirmation and enquiry notifications retain their separate behavior. A campaign estimate must account for recipients whose next eligible time is later. Enabling nurture does not start one new Workflow per campaign recipient.

### Configurable application allowance

Add developer-owned configuration for the daily dispatch allowance and its reserved transactional portion. Validate positive integer limits, reserve not exceeding the total, and consistency with the reviewed policy/capacity model. Expose the effective allowance read-only in campaign administration; do not expose platform safety ceilings or infrastructure editing through Tina. The eventual numeric defaults must come from the measured capacity report, not from the theoretical 10,000/3 Queue calculation.

For this feature, the daily allowance counts **queue-admission attempts**, including retries and republishing, rather than unique audience members or successfully delivered emails. Label this distinction clearly wherever the allowance is displayed. It controls how much work the application releases into delivery; it is not a hard guarantee of accepted-email counts, provider billing or complete account quota protection.

Use a UTC calendar-day window. The campaign, welcome and nurture paths share the remaining marketing allocation; protect the transactional reserve and provide bounded fair progress across campaigns and nurture. Do not let concurrent campaigns each assume they own the entire day's capacity. Initially, marketing does not borrow unused transactional reserve. If transactional work also exhausts its allocation, retain it durably and expose the delay operationally rather than bypassing the budget.

Persist atomic admission reservations in D1 by day and lane so overlapping scheduled events, restarts and multiple invocations cannot spend the same allocation. Include their statements/index writes in invocation and daily budgets. Count a reservation as spent once publication may have occurred; never refund an ambiguous Queue result. Expire no pending job merely because the day changes. Counter maintenance is bounded and independent of the undecided personal-data retention policy.

This is a per-deployment allowance. Shared Cloudflare account allocation remains explicit input; a local D1 ledger does not observe another deployment's spending automatically. Provider rolling sending quotas can differ from the application's UTC day and must constrain the report separately.

### Multi-day campaigns and queue lifetime

Keep future audience work behind the campaign cursor, and keep generated but deferred jobs in the D1 outbox. Release only bounded, budget-admitted work into Queues. **Do not enqueue a multi-day audience and rely on messages surviving until later days.**

When daily capacity is exhausted, leave the campaign dispatching and resume after the next window without recreating completed recipient intents. Duplicate ticks, day-boundary races and restarts must not duplicate sends or reset recipient progress. Distinguish all recipient intents generated from all delivery outcomes completed; neither a drained audience cursor nor the existing campaign completed state proves every email reached its recipient.

If consumption must be deferred, persist the safe recoverable outbox state before acknowledging the queue message. Preserve leases, idempotency and unknown-outcome quarantine. Forecast backlog age and show capacity stalls; an ETA must not assume it is safe to retry an ambiguous provider outcome.

### Pre-send estimate

Before the existing SEND confirmation, campaign administration shows:

- Eligible audience at the recorded estimate time, remaining audience and existing competing backlog.
- Configured daily allowance, remaining marketing capacity today and reserved transactional capacity.
- The earliest scheduling start and estimated completion window, including spreading across days when necessary.
- The limiting factor: invocation throughput, daily allocation, nurture/campaign sharing, per-recipient 48-hour eligibility, provider quota or an unqualified runtime path.

Recompute the admission decision when sending starts; the estimate is a snapshot, not a reservation of the entire audience. Derive it from the same policy and workload model as the capacity report. Budget and index any audience/eligibility queries; do not introduce an unbounded browser download of subscribers or one query per recipient to calculate a date.

Call the result **Estimated completion**, with clear assumptions and time zone. Recalculate after material backlog/configuration changes. Where provider limits or hosted measurements are unavailable, show a conditional estimate or that no reliable estimate is available; never invent a precise guaranteed date. Existing administrator authorization, approval hashes and explicit SEND confirmation remain mandatory.

## Consumer, API and Workflow behavior

For the initial Free candidate, use one message per queue invocation and keep consumer concurrency at one. Retain configured provider pacing. Reserve the complete delivery unit, including final state persistence and failure handling, before claiming a job. The increased invocation count belongs in the daily request model; a smaller batch does not reduce per-message Queue operations.

Inventory every delivery branch and pin its maximum statement/fetch count in tests. Preserve duplicate handling, consent refresh immediately before submission, suppression, marketing pause, campaign state checks, backoff and unknown-outcome quarantine. A budget stop must never strand an owned sending lease, acknowledge an unrecorded outcome or turn an ambiguous send into an automatic resend.

Apply accounting to contact, signup/confirmation/unsubscribe, campaign administration, Access authorization, SNS feedback and diagnostics as well. Cold JWKS/certificate fetches and real cryptographic verification belong in the measured paths. Keep authentication and origin validation intact. The existing local capture path remains convenient development behavior but must be bounded and separately labeled.

Every durable Workflow step needs its own cost model consistent with actual platform execution boundaries. Do not reset a budget merely on entering a helper or assume an entire sleeping multi-day workflow is one ordinary HTTP invocation. Existing sample nurture content remains a production blocker independent of budget qualification.

## Bounded SQL work and migrations

Use additive migration `0003_runtime_budgets.sql` for reviewed indexes, campaign fairness state and daily-admission accounting; never rewrite applied migrations. Verify candidate indexes with `EXPLAIN QUERY PLAN` and actual D1 row metrics. Cover expiration cleanup, due jobs/lease recovery, enrollment state/cursor selection and operational lookups where their measured scans justify an index. Account for extra index writes.

Cleanup candidate: at most 100 expired records from each of `rate_limit` and `action_token`, once per fifteen-minute UTC window, with bounded indexed key selection inside each delete. Preserve the current token expiry/grace predicate. Duplicate or missed ticks must remain safe. Skip ordinary cleanup outside its window; do not add a database query merely to discover the current minute.

Recovery updates and diagnostic queries also need review: a single unlimited `UPDATE`, `COUNT` or `GROUP BY` can scan many rows. Chunk lease recovery within the dispatch reservation, and document any remaining dataset-dependent diagnostic cost. If this changes the dispatch statement formula, update the policy candidates and evidence together before acceptance. Do not change delivery semantics to save a query.

Cleanup drains at most 400 records/hour/table with these initial values. The workload model must show whether this exceeds the expected expiry arrival rate; reduce cadence or increase the reviewed chunk if it does not. No arbitrary enquiry/subscriber retention deletion is introduced.

## Daily capacity model

Produce a reproducible offline report from measured operation costs and an explicit workload file. Inputs include:

- Client/environment count, other account usage and account allowance allocation.
- Enquiries, subscription requests, confirmations, withdrawals, campaigns and campaign audience sizes.
- Transactional/marketing mix, provider retries, duplicate queue delivery, republishing, DLQ and feedback events.
- Scheduler ticks, API/admin/root traffic, maintenance volume and operator polling.
- Dataset cardinality/payload size, index/storage footprint and available provider sending quota.
- Nurture cohort schedule, executed steps, active/waiting instances and retained state when enabled.

For a first capacity claim, use 80% of finite daily service allowances: 80,000 Worker requests, 4,000,000 D1 rows read, 80,000 rows written and 8,000 Queue operations. Shared-account usage is subtracted before allocating this application's portion. Use corresponding explicit Workflow headroom when relevant.

A normal small Queue message usually requires write/read/delete, so 8,000/3 is approximately 2,666 normal deliveries before any retry, DLQ or other activity. This is arithmetic, not a promise of 2,666 successful emails. Queue batching does not change that calculation. Provider quotas and the other resource dimensions can impose a lower ceiling.

Cost model: daily resource use equals scheduler baseline plus the sum of operation counts multiplied by their measured costs, including failure/retry paths. Report the limiting dimension and projected drain time. Model rows with actual cardinality-sensitive evidence, not a constant invented from returned rows. Include multi-day backlog and nurture scenarios rather than only one empty starting day.

Output each profile as **locally verified**, **hosted-qualified for the stated envelope**, or **not qualified**, with exact versions, dataset, assumptions and remaining measurements. There is no automatic Paid upgrade and no promise to prevent malicious traffic from consuming quotas. The application daily-admission guard constrains this deployment's released work only; this model is not a global account-wide billing circuit breaker.

## Administrator Usage & Capacity dashboard

### Scope and access

Add `/admin/usage` and `/api/operations/usage` for administrators in all three profiles, including enquiries. Authorize these routes before the campaign-only profile gate. Editors and unauthenticated remote users remain denied. Keep existing actual-loopback-only development access; no new authentication bypass. Add a link from campaign administration and document the direct URL for enquiries administrators. Do not change public navigation.

The dashboard uses the existing protected Worker HTML/CSP model, readable cards, accessible progress indicators and a small seven-day application history. It is not a Tina content collection or a new public page. Display statistics and operational identifiers without enquiry details, subscriber addresses, message bodies, tokens or another customer's named resources.

### Three distinct sources

1. **Application records:** atomic daily admission use/remaining/reserve; campaign/nurture/transactional activity; deferred work and persisted job outcomes. Label admission attempts separately from accepted deliveries and provider-confirmed delivery events.
2. **Provider readings:** Cloudflare Worker request/CPU metrics, D1 scanned/written rows and storage, Queue operations/backlog and available Workflow usage. Show deployment and account scope separately; never describe one site's share as the whole account's remaining quota.
3. **Forecasts:** projected capacity and campaign completion derived from the reviewed workload model, with assumptions and qualification state.

Every reading carries source, scope, unit, time window, timestamp, freshness and coverage. Missing values are null with an explicit not-configured/unavailable/stale state, never zero or a fabricated percentage. Application query counters do not masquerade as billable rows or provider totals. Provider availability/history and sampled/delayed statistics must be represented honestly.

### Local implementation first

Add bounded daily application rollups for background invocations and business-write paths, recording counts, deferrals and statement/service-attempt observations. One aggregate upsert per metered invocation is the normal maximum. Preserve raw business state for diagnostics; rollups are observations, not the source of sending eligibility or consent.

Include telemetry's own statement/write overhead in the invocation/capacity model. Its persistence is best effort: log a telemetry failure without changing a completed enquiry/delivery outcome or causing resend. Track coverage and last successful observation; missing observations cannot become proof of zero activity.

Do not add a D1 telemetry write for ordinary assets, health checks, CMS reads, denied authentication/origin requests or each dashboard refresh. These request totals belong to provider analytics. Do not recursively count dashboard reads by writing more dashboard telemetry. Explicitly label the application's counter coverage instead of claiming a complete account meter.

Keep numeric daily sending defaults unconfigured (`null`) until selected from evidence; a missing hosted allowance defers dispatch and appears as Not configured. Local capture remains available as bounded simulation. Proposed developer settings are `infrastructure.runtimeBudget` with `policyId`, `dailyDispatchLimit`, `transactionalReserve`, `warningPercent` (default 70) and `criticalPercent` (default 85). Require warning below critical below 100, reserve no larger than a configured limit, and zero reserve when the limit is null. Expose effective values read-only in the dashboard. A configured limit alone does not remove hosted-readiness gates.

Warning/critical thresholds refer to consumption of a named allowance, not a guaranteed cloud cost ceiling. Report snapshot failure without hiding other valid cards. Validate date windows and bound history to seven days initially; use rollups/indexed state queries rather than repeatedly scanning the full email history.

### Cloudflare connection during hosted setup

The local dashboard includes typed provider-usage states and displays Not configured. Implementing and exercising actual Cloudflare collection is a separately authorized hosted integration milestone, not a hidden requirement to complete local development.

Use least-privilege read-only credentials in Worker secret bindings, never canonical configuration, Tina, HTML or browser scripts. Resolve allowed account/resource identities on the server; the client cannot submit arbitrary account IDs or GraphQL queries. A website administrator sees only authorized project/environment readings, with sanitized shared-account totals where allowed.

Use on-demand cached collection with a five-minute target freshness and bounded timeouts/backoff; add no second Cron. Provider errors retain labeled stale data where available. Check the actual account's dataset permissions, time windows, sampling and API limits. Do not promise every metric before availability is tested. Warn before history is incomplete or usage is aggregated across unrelated resources.

Cloudflare sources: [D1 analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/), [Queue metrics](https://developers.cloudflare.com/queues/observability/metrics/), [Worker metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/), [Analytics API limits](https://developers.cloudflare.com/analytics/graphql-api/limits/).

## Evidence and acceptance

### Deterministic local proof

- A metered test database preserves transactional execution while recording single/batch attempts, failures and rollback behavior. A separate observation counter must catch ledger bypasses.
- Whole-invocation tests fill all enabled scheduler lanes simultaneously. Test 39/40/41 statement boundaries, reservations, no refunds after failed attempts and independent concurrent invocations.
- Repeat ticks with more jobs/campaigns/enrollments than the caps. Every eligible lane progresses; cursors rotate across failures; no duplicate logical intents or skipped recipients occur.
- Exercise queue duplicates, publish ambiguity, provider 429/5xx/timeout, failed final persistence, consent changes and stale generations. Preserve unknown-outcome quarantine.
- Test daily admission with overlapping campaigns and nurture, a protected transactional reserve, concurrent ticks, restart and UTC rollover. Count retries/republishing and retain reservations after ambiguous publication; never exceed the configured allocation.
- Exercise 500-, 5,000- and 50,000-recipient audience fixtures within the stated storage envelope, spreading work over days without eager full-audience enqueueing. Prove no skipped or duplicate logical recipients and include the 48-hour marketing interval.
- Test pre-send estimates with competing backlog, exhausted capacity, changing consent, a paused campaign, missing provider quotas and an unqualified profile. Estimates stay conditional when evidence is missing and preserve approval/SEND requirements.
- Test cleanup above its chunk size, missed/duplicate windows, selective query plans, recovery backlogs, maximum supported payloads and diagnostic scan costs.
- Run real local Wrangler/D1/Queue boundary tests against disposable fixtures. No canonical content edits, external sends or production bypasses.
- Verify administrator access in enquiries/newsletter/nurture, editor/remote denial, seven-day windows, threshold boundaries, missing/stale/partial metrics, secret/resource isolation and telemetry-failure behavior. Opening the dashboard repeatedly must not write one telemetry row per request.
- Cover native configuration defaults, generated consumer settings and all initialized client presets. New runtime files and the migration must be included in the explicit client export inventory.

### Hosted qualification, separately authorized

Measure cold and warm invocation CPU, p95/p99/max, D1 rows and latency, service calls, request/queue operation deltas and Workflow steps/state. Use controlled fixtures and safe external test responses; do not disable production verification or send bulk real emails for benchmarking.

Candidate CPU acceptance: p99 at or below 7 ms and observed maximum at or below 8 ms in at least 1,000 invocations of each CPU-sensitive path against the stated dataset, with no runtime-limit errors. This is a qualification envelope, not a mathematical worst-case guarantee. If it fails, tune or restructure the relevant work unit and rerun; mark the affected profile unqualified rather than claiming Free support.

Include representative and high-cardinality fixtures: 1,000 and 10,000 subscribers plus 10,000 and 100,000 jobs where the complete fixture stays within Free storage. Use source-schema maximum payloads separately from compact large-cardinality fixtures. Record all fixture sizes so a successful tiny-payload run cannot certify large messages.

Hosted acceptance must include the real Free entitlement and runtime accounting. Local tests cannot certify cloud CPU or account quotas. Where external inputs are missing, publish the local report with the hosted gates still pending.

## Delivery sequence and ownership

1. **Resource inventory and measurement baseline.** Inspect existing operations, map platform accounting and build metered tests/cost fixtures. Expected ownership: `tests/db.ts`, new budget tests/harness and evidence documentation.
2. **Shared policy and safe invocation accounting.** Add versioned pure policy/configuration, scoped reservation/accounting, configurable daily admission/reserve settings and generated settings. Expected ownership: `packages/config`, `worker` budget helper/types/entry points, `scripts/configure.mjs` and config tests.
3. **Bounded scheduler and indexed maintenance.** Apply profile allocations, atomic daily admission, recovery chunks, campaign/nurture fairness, multi-day progress and the additive migration. Expected ownership: delivery/campaign/workflow scheduler code, migration and fairness/recovery tests.
4. **Consumer/API/Workflow qualification.** Bound consumers/local drains and include all failure/authentication/feedback branches. Preserve semantics with focused regression tests and disposable runtime proof.
5. **Capacity report and client handoff.** Add the workload-driven report, pre-send campaign completion estimate and administrator Usage & Capacity dashboard with local statistics/provider placeholders, limits/operations documentation, CI regression gate and export-inventory/default coverage. Record local results and explicit hosted pending items.
6. **Authorized hosted evidence and final review.** Connect read-only Cloudflare analytics with the actual authorized account, run the Free-plan qualification and publish supported envelopes per profile. Perform an independent whole-change review of local implementation before local handoff, and review hosted changes/evidence when that milestone is authorized. No deployment or external account action is authorized by this design.

A detailed implementation plan with exact interfaces, test cases and commands follows user review of this design. Implementation should remain one cohesive budget optimization effort; it does not include the separate CMS CSP, hosted Turnstile or deployment-isolation fixes from the architecture audit.

## Constraints preserved

Use Node 22.x or 24.x, pnpm 10.13.1 and the existing pinned stack. Preserve EN/EL copy, design tokens, routes and canonical content. No additional product dependency is required by this proposal. Do not modify the two read-only source repositories or generated artifacts directly. Stop owned launchers before lifecycle/profile tests and restart only owned processes afterward.

Do not remove production-readiness blockers, configure accounts, send real messages, select retention periods or deploy. Secrets stay outside canonical configuration and logs. Metrics contain invocation/lane counts and operational IDs only, never message bodies, emails or tokens.

Planning verification: official sources and the listed code paths were inspected. No product code changed and no new application tests/builds or hosted measurements were run. This document's candidate allocations remain subject to review and implementation evidence.
