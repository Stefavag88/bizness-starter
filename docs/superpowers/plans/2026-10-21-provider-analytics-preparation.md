# Provider analytics preparation

**Status:** Local preparation implemented and verified through `b72d52b`. Hosted qualification remains pending.

Approved scope: the existing milestone 8 integration contract; the owner selected local integration and setup guide first because isolated staging/resources/token do not exist. This prepares code, not hosted qualification.

1. Add disabled-by-default developer configuration and a read-only collector. Bind current Worker/database identities on the server; optional Queue ID and opt-in account request total. Keep token secret. Query only documented Worker requests, D1 rows/storage and Queue billable operations. CPU quantile units/aggregation, Queue backlog naming and Workflow billable-step semantics require live discovery; leave those readings unavailable with explanations.
2. Add bounded five-minute caching, single-flight, timeouts, response limits, no inline retries, failure backoff and at-most-one-hour labeled stale data. Each external attempt is charged to the existing request budget. Validate <=7 UTC days; no client endpoint/account/query inputs.
3. Connect to authenticated usage snapshots without observer writes. Export runtime dependencies to clients, reset defaults safely and document exact setup, dataset discovery and remaining hosted gates.
4. RED/GREEN focused tests, full check/test/build/Worker check, actual local admin browser proof. One independent final review after implementation. Restart owned CMS stack; no hosted calls, provisioning or sends.

The public design, current cloud placeholder IDs, default allowance and email roles remain unchanged. No production gate is lifted.
