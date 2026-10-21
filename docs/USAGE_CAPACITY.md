# Usage & Capacity administration

Open `/admin/usage` or fetch `/api/operations/usage?from=YYYY-MM-DD&to=YYYY-MM-DD`. Dates are inclusive UTC with at most seven days. Unknown query parameters are rejected; clients cannot select arbitrary Cloudflare account or database IDs.

## Access

Both routes require the Worker **administrator** role in every profile. Add normalized email addresses to `infrastructure.adminEmails` in `project.json`, configure the Access issuer/audience and its matching application policy, regenerate and deploy through the approved hosted process. The Worker verifies a signed Access JWT and its issuer, audience, expiry and listed email. A trusted-looking email header is insufficient. `editorEmails` grants CMS access only. Local bypass applies only to genuine loopback requests with `ENVIRONMENT=local`; local evidence is not proof of hosted Access configuration. Tina Cloud's own editorial permissions/seats remain separate.

## Reading the dashboard

- **Today's dispatch allowance**: exact application admission ledger, current UTC day, used/remaining and transactional reserve. This is not successful delivery count or an account-wide quota.
- **Recorded application activity**: partial observations from background and business-write paths, including observer SQL cost. An observed zero is zero; no observation is unavailable. Defer events are work units, not unique recipients.
- **Delivery backlog**: current D1 job states. Each query inspects at most 1,001 records; 1,000+ is a bounded lower count. A failed card is unavailable, without hiding other valid data.
- **History**: up to seven daily rollups, with gaps shown as missing rather than zero.
- **Cloudflare readings**: Worker requests, CPU, D1 rows/storage, Queue operations/backlog and Workflow steps. They remain **Not configured** with null values until the separately approved provider adapter is qualified. Local UI never invents these values from SQL statement counts.

Sources, deployment/account scope, snapshot time and partial/unavailable/stale status travel with readings. Application SQL is not billed rows; Queue publications are not all billed Queue operations. The application snapshot cache lasts up to five minutes, is bounded per deployment/window, and is consulted only after authorization. Manual refresh has a 60-second client cooldown; it does not bypass the cache or write a usage observation. There is no unbounded polling. Default warning/critical thresholds are 70%/85% of a configured daily allowance; unavailable readings produce no percentage.

Campaign administration includes a conditional capacity estimate before final SEND. No audience or personal record is exposed by the usage response. Estimates remain conditional when provider/account/CPU/row evidence is missing. See [Runtime budgets](RUNTIME_BUDGETS.md) for the policy and qualification boundary.

## Hosted follow-up

Provider integration requires server-owned resource IDs, read-only secret analytics permissions, isolated authorized staging, bounded fetch timeouts/backoff, stale-cache behavior and comparison with controlled account workloads. The browser will not receive a provider token or arbitrary query surface. No real credentials, account changes, deployment or email sending are part of this local implementation.

## Prepared provider integration

The read-only collector is prepared and defaults disabled. Its selected Worker/D1/Queue mappings remain partial until actual staging capability and measurements are checked; CPU, Queue backlog and Workflow billing mappings remain unavailable. Follow [Provider analytics setup](PROVIDER_ANALYTICS.md). Local mode never calls Cloudflare analytics.
