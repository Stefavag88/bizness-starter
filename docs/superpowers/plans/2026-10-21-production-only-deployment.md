# Production-only deployment preparation plan

Spec: ../specs/2026-10-21-production-only-deployment-design.md
Execution: inline, one final independent review. No cloud actions. Existing analytics edits are excluded. Reuse current feature checkout; do not move the active CMS to another checkout.

## Global constraints

English Markdown; no design/content changes; production remains blocked; no credentials or resource creation. Source-only optional staging. Canonical project.json stays local. All new runtime/config dependencies must be exported to independent clients. Never edit generated outputs manually.

### Task 1: Explicit production target and shared configuration

Files: scripts/deployment/production.mjs and .d.mts; scripts/worker-config.mjs and .d.mts; scripts/configure.mjs; tests/production-deployment.test.ts.

Interfaces: parseProductionTarget(raw, project) returns strict production project projection and account identity. createWorkerConfig(project, local, identity?) returns Wrangler configuration; getProductionPlan(root, raw) returns blocked plan with fingerprints and issues.

1. Write tests for target identity, non-inherited infrastructure, placeholders, unsupported target/secret fields, generated account/domain/resource bindings and no source mutation.
2. Run pnpm exec vitest run tests/production-deployment.test.ts; expect missing implementation failure.
3. Implement pure target/config functions; extract configure's existing generation without changing local output. Production has empty local origins and derived environment-specific resource names; account/analytics ID mismatch blocks.
4. Run focused tests plus project config/configure/initializer boundaries; expect pass.
5. Record completion and verification in evidence. Do not commit unrelated analytics edits.

### Task 2: Local preparation and remote-command guards

Files: scripts/deployment/prepare.mjs and .d.mts; scripts/deployment/wrangler-policy.mjs and .d.mts; scripts/wrangler.mjs; tests/production-deployment.test.ts.

Interfaces: prepareProduction(root,args) writes .generated/deployment/production-plan.json after strict argument/content validation under the existing configure lock; returns plan. assertLocalWranglerArgs(args) throws for everything except exact owned local/dry-run shapes. Shared Task 1 target/config functions supply the plan.

1. Add failing tests for no-target/unknown/duplicate args, valid fixture reports with input fingerprints, invalid config preserves report, linked output refusal and remote/option injection rejection.
2. Implement strict no-shell CLI and wrapper guard. Always return blocked readiness; no remote execution or release override exists.
3. Run focused tests. Validate ordinary worker:check and db:local shapes against policy.
4. Record completion/evidence.

### Task 3: Client exports and production-only documentation

Files: package.json; scripts/initialize/snapshot.mjs; scripts/initialize/export-manifest.json; deployment.production.example.json; docs/DEPLOYMENT.md; docs/PRODUCTION_READINESS.md; docs/OPERATIONS.md; docs/PROVIDER_ANALYTICS.md; tests/initializer-export.test.ts; README.md.

Interfaces: root and generated client expose deploy:prepare. Example is inert placeholders, never provisioned or copied as configured resources. Existing deploy:check remains fail-closed.

1. Add export/CLI contract regressions and run red.
2. Add script/inventory and English setup guide, update current readiness/recovery/provider guidance to local+production with optional staging. Retain historical audit/evidence.
3. Run focused tests, pnpm check, pnpm test, pnpm build, pnpm worker:check. Prepare an actual independent generated client and run its check/test/build/dry-run and blocked sample plan.
4. One final independent review, one verified fix pass if needed; record evidence and restart owned CMS/site.

## Review focus

- No local D1, account, recipient or Access configuration leaks into a production projection.
- A successful preparation process does not falsely authorize a release; source hashes are not a verified build artifact.
- Wrapper aliases and option overrides cannot turn an owned local operation into a remote mutation.
- Independent generated clients contain every runtime dependency and no account credentials.
- Failure never overwrites canonical project/content or unknown generated links.
