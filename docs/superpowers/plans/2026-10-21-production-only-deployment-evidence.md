# Production-only preparation evidence

Date: 2026-10-21. Source implementation: 35f874b on codex/free-runtime-budgets. Scope is local production preparation only; no remote resources, credentials, migration, deployment, email sending or release readiness claim.

## Completed work

- Explicit strict production target, empty-default infrastructure projection, environment-derived Worker/D1/Queue/DLQ/Workflow identities and custom-domain/account bindings.
- Shared configuration generation preserves local behavior and strips local origins from production plans.
- Local-only deploy:prepare validates content and writes a blocked review report with canonical-input/target hashes without changing project/content/local configuration.
- Owned Wrangler wrapper permits exact existing local/dry-run command shapes and rejects extra/remote/environment flags.
- Generated clients contain tooling, guide and inert app-specific example configuration.
- Current readiness/operations/provider guides use local + production with optional staging; historical plans/evidence remain historical.

## Verification

- Task 1 RED: 5 missing implementation failures; GREEN 68/68 across deployment/project/configure-safety boundaries.
- Task 2 RED: 4 missing implementation failures; GREEN 9/9, including old-report preservation, invalid args, output link rejection and wrapper argument bypass checks.
- Export contract RED: 1 missing export failure; GREEN 28/28 across deployment/export/initializer suites.
- Custom-domain RED: origin/port mismatch accepted; GREEN final focused 16/16 after rejecting IPs, single-label names and nonstandard ports.
- pnpm check: 75 Astro files, zero errors/warnings/hints. Final repeat recorded separately after the custom-domain import change.
- pnpm test: 1,175 main passed, one pre-existing skipped; 44 site tests passed. All source changes were present in this run.
- pnpm build: 416 local pages built successfully.
- pnpm worker:check: successful dry-run through the guarded wrapper; no deployment.
- Actual deploy:prepare against the inert example wrote a blocked report and exited 1 as specified. No cloud invocation.
- Independent client C:/Projects/.production-client-99efcf46d17548caa77bb3039101942c: frozen install, check, test, build and Worker dry-run all passed; app-specific example retains placeholder account ID, blocked preparation emits matching production resource names.
- Initial independent harness attempt stopped after client export because pnpm exec did not provide npm_execpath. Corrected harness to use the installed verified pnpm runtime; no application fix was required. Initial unused fixture retained at C:/Projects/.production-client-7d6805f9eab3430e8def428bf248eb16.
- Pre-existing worker/provider-usage.ts and tests/provider-usage.test.ts edits were excluded from this implementation commit and preserved byte-for-byte. Full-suite results describe the working tree including those existing edits, not a clean-checkout-only proof of HEAD.

## Review and limits

One independent final review of 5a403bd..35f874b found one Important issue: a target input at the generated report path could be overwritten. No Critical or separate Minor findings. The reviewer excluded the existing analytics edits and performed source inspection only. A new regression reproduced the overwrite (RED); the fix rejects direct, Windows case-equivalent and parent-junction aliases before writes and rechecks under the configure lock (GREEN). The output check also refuses dangling links. Final fix-pass verification is recorded below.

An attempted live-wrapper negative test was rejected by automatic approval review before execution: if the guard were defective, the unqualified deployment command could cause unauthorized remote effects. It was not retried or worked around. The isolated policy unit tests exercise the negative argument cases without remote execution; worker:check verifies the permitted actual wrapper path. There is no live negative-deployment test claim.

No production-target build artifact is produced by preparation. Fingerprints are diagnostic and not an atomic release lock. Hosted CMS, Access, Turnstile, secret/provider setup, retention, capacity and recovery qualification remain unresolved mandatory gates. Staging is optional, not a substitute for these checks.

Raw local logs: .generated/production-*.log and .generated/evidence/production-only/. Plan workspace: .superpowers/sdd/2026-10-21-production-only-deployment/ (archive and remove only this owned workspace after closeout).

## Final fix-pass verification and handoff

- Alias regression: RED reproduced successful overwrite; GREEN 17/17 focused deployment/export tests. Direct path, Windows case-equivalent spelling and parent-junction alias all reject while preserving target bytes.
- Final pnpm check: 75 Astro files, zero errors/warnings/hints.
- Final pnpm test: 1,176 main passed, one pre-existing skipped; 44 site passed. Logs: .generated/production-fix-check.log and .generated/production-fix-tests.log.
- The fix changes only the local preparation script and regression tests; public/runtime code and shared configuration generator are unchanged from the verified 416-page build and Worker dry-run. No extra bundle rebuild was needed for that script-only fix. The restarted launcher built the local site again successfully.
- Independent client received the exact reviewed preparation-script fix after verifying its prior source differed from committed input only in Windows CRLF normalization. Its check, tests and real blocked preparation passed again. Raw post-review logs are retained beside the original full independent build/dry-run evidence.
- Restarted owned dev:cms stack: session 61593; child PIDs content 35572, Tina 26900, Worker 8452, Astro 5132. EN, EL, CMS, admin usage and Worker health returned HTTP 200; Tina localhost:4010/graphql returned Query.
- Existing analytics edits remain byte-for-byte preserved and uncommitted. The current feature branch is retained; no merge/push/release action was taken.

## Archived execution rulings

- Proceeded within the explicitly approved production-only preparation scope; no additional authorization for cloud effects was inferred.
- Reused the existing feature checkout and left unrelated analytics changes intact.
- No preparation result is a production build artifact or release authorization; actual remote commands remain blocked pending hosted prerequisites.
- Per-task commits were consolidated into the verified implementation commit; the final review/fix and evidence are a separate follow-up. This did not change the single-review workflow or test-first verification.
- The disposable-client verifier needed an explicit installed pnpm runtime rather than assuming pnpm exec sets npm_execpath; no application change was needed.
- A live unqualified-wrapper negative test was rejected before execution and not retried; safe argument-policy tests cover those negative cases. No required remote test remains pending.
