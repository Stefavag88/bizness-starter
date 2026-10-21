# Provider analytics preparation evidence

Status: **Local integration prepared and verified; hosted qualification pending.** Product commits: `9a14fa8`, `b72d52b`; historical architecture audit committed as `822ee49`. Branch: `codex/free-runtime-budgets`.

The owner explicitly selected preparation before obtaining staging/account IDs/token. Existing approved provider-integration requirements govern this scope. No cloud resources, live analytics calls, credentials, sends or deployments were involved. Public design/content and production gates remain unchanged.

## Verification

- Focused provider/auth/snapshot checks: 24 passed after the final boundary fix.
- `pnpm check`: 75 Astro files, zero errors/warnings/hints.
- `pnpm test`: 1,164 main tests passed, one existing skipped; 44 site tests passed after the fix.
- `pnpm build`: 416 public pages built after the fix.
- `pnpm worker:check`: dry-run passed after the fix.
- `e2e/admin-usage.spec.ts`: three local desktop/mobile/threshold checks passed through port 4330 after restart.
- An independently generated neutral EN/EL client installed, checked, tested, built and Worker-bundled successfully. Its disabled provider defaults and reset Worker/database bindings were verified at `C:/Projects/.provider-client-d8e030ef71064e38a675f3d6df17889a`. This run preceded the cache-age fix, which changes no import/configuration contract; its runtime regression and final full source gates passed afterward.
- Local site/CMS HTTP and Tina GraphQL query root are responsive. Actual provider response remains `not_configured` with null readings. The owned CMS launcher remains running.

Node 24.12.0, pnpm 10.13.1, Wrangler 4.148.0, Vitest 5.0.3 and Playwright 1.63.0; existing lockfile retained. Raw verification logs are archived under `.generated/evidence/provider-analytics-preparation/`.

## Independent review

A single fresh read-only reviewer examined `822ee49..9a14fa8`. Its first attempt was interrupted by account usage limits; the same reviewer completed after the owner resumed. One P2 issue, no minors: cache hits could serve a stale reading older than one hour while respecting a longer retry backoff. Two regressions (all-stale and mixed-age) were observed failing, then passing. The fix expires each old reading and recomputes snapshot status/timestamp without fetching early or discarding newer metrics. The final full suite/build gates passed; no second reviewer was dispatched.

Review did not certify live GraphQL schema/entitlements/aggregation/units, the deferred CPU/backlog/Workflow mappings, hosted CPU/quota behavior, existing deployment-isolation/Access/CMS/form gates, or independently reported tests. The executor verified the local checks above. Those cloud/release prerequisites remain pending.

## Remaining hosted work

Follow [Provider analytics setup](../../PROVIDER_ANALYTICS.md): establish isolated staging, configure a read-only account analytics token as a Worker secret, discover actual dataset access/schema/limits, validate controlled metric deltas, complete the unavailable mappings and measure profile CPU/row/Queue/Workflow envelopes. The prepared code reports partial/null/stale values honestly; it does not establish Free-plan or production qualification.

## Execution ledger

```text
# Ledger — docs/superpowers/plans/2026-10-21-provider-analytics-preparation.md

Base: architecture audit commit after 565c633; existing codex/free-runtime-budgets checkout reused. User authorized next milestone and selected local integration/setup first; existing approved spec/provider contract governs. No staging data or analytics token configured; no cloud calls will be made. Inline execution plus one final review. Milestone8 qualification remains pending.

Verified owned launcher37035 PID30416, children only this checkout. Initial Ctrl-C auto-review rejection resolved by proving ownership plus AGENTS.md's explicit stop-before-config/test rule and retrying the same graceful stop; no workaround used. Stack will restart.
RED: missing collector module. GREEN: 22 focused auth/snapshot/provider tests and tsc. Default disabled/local/no-token no calls; real-zero/empty/malformed, cache credential-window isolation/singleflight, rate-limit/backoff/stale expiry, permission failure, response cap, timeout and shared external-attempt accounting covered.
Ruling: implement documented request/row/storage/Queue-operation mappings with partial coverage; CPU, Queue backlog and Workflow billing semantics remain unavailable until account discovery — avoids inferring quantiles/billing from ambiguous examples — cost if wrong: these cards await hosted mapping work rather than showing an unreliable number.
No account/resources/token exist, and no provider API call has been made. All fetch tests use explicit fixtures; enabled staging configuration remains owner-supplied.

Independent client: C:/Projects/.provider-client-d8e030ef71064e38a675f3d6df17889a, all install/check/test/build/Worker dry-run stages passed; disabled analytics and reset resource bindings verified. Initial CLI retry only corrected PowerShell quoting of en,el; no source change needed.
Final review initially failed due to account usage limit, then completed on user continuation with the same read-only reviewer. One P2 finding, no minors: stale cache hits could cross the one-hour data limit during Retry-After backoff. Both all-stale and mixed-age regressions observed RED then GREEN (24 focused tests); currentView expires each old metric and recomputes status/timestamp without resetting retry backoff. One fix pass; no second review.
Ruling: reviewer-declined live schema/filter/entitlement/aggregation/sampling/retention/units, unimplemented CPU/backlog/Workflow mappings, hosted CPU/quota/production readiness and preexisting deployment/Access/CMS/form issues remain pending as authorized by the owner; reported local suites/client checks are independently verified here — cost if wrong: these remain launch blockers, never certified by fixture success.

Final: stale-age fix verified in full suite: 1164 main tests pass, 1 existing skipped; 44 site tests pass. 75 Astro files clean. Public build 416 pages and Worker dry-run pass after fix. Three admin Playwright checks pass on the restarted public dev URL. Site/CMS/usage HTTP200 and Tina Query root verified via launcher-advertised http://localhost:4010/graphql (initial 127.0.0.1 probe refused; final readiness probe uses terminating errors and the advertised URL). Actual provider status remains not_configured. Owned dev:cms session47568 remains running. No deferred minor findings.
Local preparation complete; hosted milestone8 remains pending. No staging/account/token configured, no live Cloudflare analytics calls, no sends/deployment or readiness changes. Final product commit b72d52b.

```
