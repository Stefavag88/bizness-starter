# Cloudflare provider analytics setup

Status: local integration prepared, disabled by default. No staging account/resources/token exist yet. This does not complete hosted milestone 8 or lift production readiness gates.

## What is prepared

`worker/provider-usage.ts` connects the administrator-only usage snapshot to a fixed Cloudflare GraphQL endpoint. Requests contain server-bound resource filters, never browser-supplied account IDs or queries. The current mappings prepare Worker request counts, optional shared-account request totals, D1 scanned/written rows and peak database size, and optional Queue billable operations. Returned observations remain **partial**: actual account availability, sampling, retention, units and comparison with controlled workloads must still be verified.

CPU p99, Queue backlog and Workflow steps deliberately return unavailable with an explanation. Their aggregation/billing semantics require account-specific discovery. A maximum of grouped p99 values is not a global p99; average backlog is not instantaneous backlog; Workflow lifecycle event counts must not be presented as billed steps. The Queue documentation uses inconsistent backlog dataset/filter spellings in its table/example, and the Workflow examples do not establish billable-step accounting. Do not guess those mappings.

Empty, malformed, truncated or denied results are unavailable, not zero. A returned numeric zero is retained. Per-dataset failures preserve valid other cards. Cached readings that fail refresh are labeled stale for at most one hour. No raw provider errors, resource identifiers or secrets are exposed through the dashboard. Provider data adds no D1 observation write per view.

## Required staging inventory

Record these values through the approved deployment-isolation workflow before enabling collection:

| Value | Ownership |
| --- | --- |
| Cloudflare account ID and actual Workers plan | Owner's staging account; verify analytics dataset access |
| Project/environment identity and Worker name | Distinct from production/customer resources |
| D1 UUID | The database bound to this exact deployment; never the placeholder or production UUID |
| Queue/DLQ IDs and names | Match this deployment's producer/consumer bindings |
| Workflow identity, when enabled | Distinct staging workflow |
| Domain/routes and Access issuer/audience | Protect the hosted administrator surface |
| Dataset permissions, field schema, time ranges, sampling and units | Captured from live Settings/introspection and controlled measurements |

The current generated configuration has one resource set. Changing `environment` is not infrastructure isolation. Prepare and review a distinct staging identity before provisioning or deploying; current production blockers remain mandatory.

## Configuration

Developer-owned `project.json` can include:

```json
{
  "infrastructure": {
    "providerAnalytics": {
      "enabled": false,
      "includeAccountTotals": false
    }
  }
}
```

Merge this fragment into the existing infrastructure object. Later, an enabled configuration requires the intended `accountId` (32 lowercase hexadecimal characters) and a real existing bound D1 UUID. Optional `queueId` uses the queue's 32-character ID, not its display name. Configure derives the Worker name from `project.name` and the database from `infrastructure.databaseId`; analytics cannot silently select a different database. `PROVIDER_ANALYTICS` is generated server configuration. It is not a Tina field or editable generated JSON. Initialized projects default to disabled analytics and do not inherit account credentials.

Create a narrowly scoped API token for the staging account with **Account > Account Analytics > Read**, following [Cloudflare's token guide](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/). Inspect actual dataset permissions; add only a separately justified read scope if the selected product requires one. Do not use an account-wide edit/global API credential. Configure expiry/rotation appropriate to the operator's policy.

Store the token as the Worker secret binding **CF_ANALYTICS_TOKEN** through the reviewed staging deployment configuration. Do not put it in project JSON, CMS, source control, browser variables, logs or a chat message. This guide intentionally supplies no provisioning or secret-update command against the current placeholder configuration. No token is needed for local development: `ENVIRONMENT=local` always disables cloud collection, even if a token exists.

## Capability and meaning checks

Use [GraphQL introspection](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/introspection/) to inspect actual field/filter types and the [Settings node](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/) to verify availability and allowed windows for this account. Introspection alone does not prove entitlement. Save a sanitized capability record with schema/date, account scope, permitted datasets and measurement units; never save credentials or unrelated resource data.

Start with one known controlled interval and one resource per dataset. Compare its result to Cloudflare's dashboard and application observations. Validate no-dimension aggregate behavior and count completeness: the collector rejects multiple aggregate records rather than adding a potentially truncated sample. D1 date windows are inclusive UTC dates; Worker and Queue timestamps use the documented inclusive filters, ending at the last millisecond of the selected UTC day. Confirm exact accepted filters against the staging schema before relying on values. A schema/filter error leaves only that dataset unavailable.

The prepared dataset names are `workersInvocationsAdaptive`, `d1AnalyticsAdaptiveGroups`, `d1StorageAdaptiveGroups` and optional `queueMessageOperationsAdaptiveGroups`. Use [Worker examples](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/), [D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/) and [Queue metrics](https://developers.cloudflare.com/queues/observability/metrics/) as discovery starting points, not account qualification. [Workflow metrics](https://developers.cloudflare.com/workflows/observability/metrics-analytics/) needs a separate verified billable-step mapping. Dataset limits are account-specific; see [API limits](https://developers.cloudflare.com/analytics/graphql-api/limits/).

## Runtime behavior and overhead

Collection is on demand after administrator authentication. There is no additional Cron. Four external attempts cover Worker, D1 rows, D1 storage and an optional Queue; omitting Queue reduces this to three, and enabling account totals adds one. Every actual attempt is charged to the existing request budget. Queries are read-only and independent so one permission failure does not hide other readings.

The bounded cache holds at most 16 credential/resource/window identities. Concurrent identical requests share collection. Successful results have a five-minute TTL; failures back off at least 60 seconds, respecting numeric Retry-After up to five minutes. There is no automatic inline retry. A shared four-second abort bounds collection, redirects are refused and each response is capped at 256 KiB. Last-good values may remain stale for at most one hour. Cache is best effort per isolate, not a durable account meter.

Application rollups retain their own five-minute cache; provider configuration/credential changes are resolved independently, preventing reuse of another resource's cached readings. Provider timestamps represent collection time, not a promise of instantaneous provider data.

## Remaining hosted qualification

1. Validate isolated staging resources and complete the applicable Access/CMS/form protection readiness gates.
2. Configure the secret and discover/record actual permitted schema, sampling, time bounds and units.
3. Verify all prepared queries and compare controlled Worker/D1/Queue deltas, including failures, duplicates, retries and observer overhead.
4. Implement and verify the remaining CPU, Queue backlog and Workflow mappings without inventing billing totals.
5. Measure each profile, including cold authentication/feedback paths, at least 1,000 invocations per CPU-sensitive path. Candidate acceptance remains p99 <=7 ms, max <=8 ms and no runtime-limit errors.
6. Publish a qualified workload envelope only after those checks and independent review. Keep unrelated release blockers intact.

Local tests mock provider responses and exercise authorization separately. They cannot certify these cloud outcomes. `pnpm exec vitest run tests/provider-usage.test.ts tests/admin-usage.test.ts tests/runtime-usage-snapshot.test.ts` verifies the prepared local integration.
