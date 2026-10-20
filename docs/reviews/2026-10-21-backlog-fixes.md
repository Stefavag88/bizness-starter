# Confirmed backlog fixes

Date: 2026-10-21. Baseline: 3e2c7cb. This follows the [55-item assessment](2026-10-20-engineering-backlog-assessment.md). The owner explicitly deferred hosted resources and retention decisions, requesting production remain blocked.

## Implemented

- **4/20:** Contact opt-in is validated before persistence, and enquiry, notification, subscriber, token, consent and confirmation intent commit together. Subscriber identity/generation is acquired within the SQL transaction instead of a stale JavaScript read. The unique operation token gates dependent statements. Same consent request keys do not rotate tokens on retry. Unsent obsolete confirmation jobs are skipped when a legitimate fresh request replaces a token.
- **8/51:** Scheduled fan-out, enrollment reconciliation, transactional dispatch and cleanup are independently attempted. Failures retain an aggregate failing outcome with a schedule ID and task name; no personal message contents are logged.
- **7/16:** Workflow statuses reconcile to completed/failed/cancelled, inactive or stale generations cancel, and races do not resurrect terminal records. Failed instances do not automatically restart.
- **11/14:** Hosted marketing disablement defers eligible intents without erasing payloads or consuming delivery attempts. Consent/generation and current job state are refreshed before submission. Deferral cannot reopen a quarantined job. This narrows cancellation races; an already in-flight external request cannot be retracted by a database check.
- **10/19/24:** Worker HTML receives nosniff. SNS input uses bounded streaming outer JSON parsing; envelope, inner payload, source, certificate and signature errors receive client/source error codes. Transient certificate retrieval remains a server error. Tests exercise real RSA signatures and synthetic X509 certificates.
- **1/15/21/31:** The conservative existing address-level complaint/permanent-bounce policy is now explicit and regression-tested, including old-generation feedback. Side effects are transactionally gated by event ID, including replay after a later manual status change. Public signup never reactivates a suppressed address. A blanket generation filter was intentionally not added.
- **12/52/54:** Protected overview now includes bounded failed/unknown/expired-lease job metadata and enrollment counts, without delivery payloads, recipient addresses or action tokens. Unknown remains quarantined; a safe provider-evidence-based resolution command is not claimed.
- **22/42:** Manifest article URLs use URL construction and per-locale projections are reused while preserving routing and default-locale offering priority.
- **35/36:** Configure copies every validated ordered migration and owns an exclusive generation lock. Source migration 0001 remains unchanged. Abandoned locks require explicit owner verification, not automatic takeover.
- **46/48:** A checked-in CI workflow runs check/test/build/Worker dry-run sequentially; optional guarded build suites use a fresh runner and remain serial. The profile driver now enumerates all three profiles with articles both enabled and disabled.
- **55:** Added [operations preparation](../OPERATIONS.md) and [production prerequisites](../PRODUCTION_READINESS.md). They distinguish real implemented diagnostics from hosted recovery procedures not yet rehearsed.

## Final independent review

One read-only final reviewer inspected the integrated diff and found one Important issue: scanning all running Workflow enrollments every minute could exhaust an invocation budget. No other important regression was reported in the reviewed paths.

The finding was reproduced with 351 running lookups, then corrected: independent pending/running batches are bounded to three/five, with durable round-robin cursors. A regression confirms bounded calls, progress for pending records, and a disjoint next running batch. Migration 0002 adds the operational cursor table without rewriting subscriber/enquiry records; test databases apply the complete migration chain. This is the controller's tested correction of the original finding, not a claimed second independent review. The bounded reconciliation is not a guarantee that the entire application fits every Cloudflare plan limit.

The first full-suite attempt overlapped the delivery implementer's final race tests and failed two quarantined-job deferral assertions. Those tests were fixed before the final frozen verification; the final full run is green. The earlier missing configure-helper declaration was also corrected before final checks.

## Verification

- Focused new tests observed failing behavior before fixes and passing behavior afterward.
- `pnpm check`: passed; Astro reports zero errors, warnings or hints.
- `pnpm test`: **1,053 root tests plus 41 site tests passed**, with one existing optional root skip.
- `pnpm build`: passed, static output built.
- `pnpm worker:check`: passed dry-run only; no deployment.
- `git diff --check`: passed. Canonical content and project.json have no tracked changes.
- Actual Wrangler local D1 proof used a separate persistence directory, separate local port and dummy addresses; it never used the project's local DB. Concurrent canonical identity, one confirmation token/job, same-key retry, forced mid-batch rollback and combined contact/opt-in acceptance passed all ten assertions. [Raw result](2026-10-21-backlog-fixes-d1.json). The owned proof Worker was stopped.
- `pnpm deploy:check`: intentionally failed with production prerequisites, confirming the release gate remains closed.

The final full six-combination browser/build matrix, hosted GitHub Actions execution, real SES/Turnstile/Tina/Access integrations and hosted Workflow behavior were not exercised. Workflow unit tests mock the unavailable platform entrypoint class while exercising actual state logic; signed SNS tests substitute certificate HTTP transport only. The synthetic test private key/certificate are public test fixtures, never usable deployment credentials.

## Still deferred explicitly

Environment/customer resource isolation and runtime build-identity enforcement (3/23/43), hosted CMS/Access/Turnstile/SES/SNS and secret provisioning, real provider error-code verification (13), owner-approved retention/deletion (27), account alerts, concrete unknown-outcome resolution and rehearsed remote recovery remain production prerequisites. The existing single-infrastructure configuration is not certified for multi-environment deployment. Production flags remain unchanged and release remains blocked.

General platform enhancements (capability centralization, optional public manifest split, configuration upgrade tooling and repository-wide lint/format adoption) were not treated as mandatory bug fixes. Intentional shared slugs, independent publication dates, strict translated-item validation and existing rendering/authentication protections were preserved.
