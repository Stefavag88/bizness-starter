# Runtime budgets

The application uses Astro static assets, a Cloudflare Worker, D1, Queues and optional Workflows. Public built pages and assets bypass the Worker. Business writes, protected administration and background work invoke it. Runtime policy is defined in `packages/config/runtime-budgets.mjs`; `worker/budget.ts` shares one scope across an entrypoint and its owned nested operations.

## Configuration and admission

Set `infrastructure.runtimeBudget` in `project.json`. Defaults are deliberately unqualified:

```json
{"dailyDispatchLimit": null, "transactionalReserve": 0, "warningPercent": 70, "criticalPercent": 85}
```

A hosted null allowance pauses dispatch and campaign fanout. Local capture-only simulation can run without a configured limit. A positive limit counts Queue admission **attempts**, including ambiguous/failed publication; it is never refunded after a possible external action. The reserve must not exceed the limit. Marketing can use at most limit minus reserve; enquiries, test messages and confirmations can use the remaining total. Choose values from measured account/provider capacity, not these fixture examples.

`runtime_admission_day` atomically records each UTC day's total and marketing admissions. Midnight creates a new allowance; pending work stays in D1. One campaign has no fixed audience cap: indexed interest-ID candidate chunks and unique recipient dedupe keys spread it across ticks and days. Inactive/nonmatching candidates still advance the cursor; an empty eligible page is not audience completion. Separate partial due indexes select transactional and marketing jobs without scanning the opposite lane. Existing consent/generation checks, approvals, pause controls, 48-hour marketing spacing, pre-send claims and uncertain-result handling remain in force. No second Cron is added.

## Per-entrypoint guardrails

| Policy | enquiries | newsletter | nurture |
| --- | ---: | ---: | ---: |
| Whole invocation SQL ceiling | 40 | 40 | 40 |
| Scheduled dispatch SQL lane | 32 | 24 | 12 |
| Campaign fanout SQL lane | 0 | 10 | 10 |
| Enrollment reconciliation SQL lane | 0 | 0 | 14 |
| Maintenance including observation | 4 | 4 | 4 |
| Inspected fanout candidates per tick | 0 | 4 | 4 |

There are also ceilings of 40 owned external attempts and 800 internal binding operations. These are conservative application limits, not a statement of Cloudflare entitlements. D1 batch statements count individually. Failed attempted calls remain charged; reservations for work that never started can be released. All enabled lanes share one scope. A delivery reserves a complete ten-statement unit before claiming a job. Queue consumers use batch size/concurrency one. Retry, cleanup and lease recovery stay bounded; cleanup deletes at most 100 records/table per 15-minute window. Expired sending leases become unknown and are never silently resent.

The dispatch `maxDispatchJobs` value is only an upper bound: recovery, selection, daily admission and cursor costs usually stop work earlier. Empty scans still cost statements. The fair cursor alternates transactional and marketing work; separate lane budgets preserve enrollment and maintenance progress. Normal exhaustion is a defer, not an error or a lost job.

## Observations and limits

One best-effort D1 upsert records an owned background/business-write observation. It is included in the statement ceiling; a telemetry failure must not undo a successful send or retry it. Read-only pages and denied requests do not persist observations. Workflow step observations use deltas from their logical-run scope; they are not a count of platform invocations. Actual external calls include Turnstile, Access JWKS, SES and SNS verification; SDK automatic retries are disabled at owned provider callsites.

SQL **statements**, D1 **rows read/written**, binding operations, Queue billing operations, Worker requests and CPU milliseconds are distinct. Local Wrangler metadata can support a local comparison; it does not certify production D1 row billing, Free Queue/Workflow entitlement, CPU or account-wide usage. Traffic outside instrumented business paths is not represented by application rollups. The admission allowance protects this dispatch path; it is not an account spending circuit breaker or DDoS control.

## Capacity planning

Create workload and evidence JSON files (matching the project's profile). An explicitly unqualified example is:

```json
{"profile":"nurture","days":7,"dailyDispatchLimit":100,"transactionalReserve":10,"campaigns":[{"audience":500}]}
```

```json
{"profile":"nurture","qualification":"local","dataset":"planning-only"}
```

Save those as `workload.json` and `evidence.json`, then run:

```sh
pnpm report:capacity --workload workload.json --evidence evidence.json --output capacity-new.json
```

The source repository also provides a disposable acceptance command (excluded from initialized clients):

```sh
pnpm test:runtime-budgets
```

The CLI requires all three file arguments; existing output files are never overwritten. The pure model considers dispatch limits/reserve, Cron throughput, Queue retry/duplicate work, account sharing, provider rate/daily limits, nurture cohorts, telemetry and optional measured row/CPU costs. Unknown evidence remains unknown. A date is a conditional estimate, not a delivery guarantee. The pre-send campaign estimate counts up to 500 audience candidates/request without returning addresses and includes current day use and competing backlog. Repeated estimates continue incrementally; incomplete audience counts are labeled. Cached audience counts keep their original observation timestamp, disclose possible eligibility changes and restart when the campaign cutoff changes. Known publications are counted immediately after successful Queue publication, so later failures do not erase them from telemetry.

The local verifier creates disposable D1/Queue resources and removes them. It records per-profile traces in `.generated/evidence/runtime-budgets/`; never run remote commands to reproduce it. The source-only fixture wrapper must never enter a client export or hosted configuration. Hosted analytics and qualification are separately authorized work: actual provider metrics, account aggregation, row accounting, at least 1,000 observations per CPU-sensitive path, candidate p99 <=7 ms/max <=8 ms, cold/warm behavior and no runtime-limit errors. Other production blockers still apply.
