# Production release packaging implementation plan

Execution: inline with one final independent review. Spec: ../specs/2026-10-21-production-release-packaging-design.md.

## Global constraints

No cloud actions/credentials. English Markdown. Preserve public design/content, current local configuration and unrelated analytics edits. Stop owned launcher before configure/full suites and restart at handoff. Export every runtime release dependency to independent clients. Retain failed isolated workspaces. Candidate packages always remain blocked pending hosted gates.

## Task 1: Shared deployment identity

Files: packages/config/deployment-identity.mjs and .d.mts; scripts/configure.mjs; scripts/worker-config.mjs; worker/deployment.ts; worker/types.ts; worker/index.ts; Layout.astro; tests/release-identity.test.ts.

Produces: deploymentIdentity(project) returns null locally or stable {format,application,environment,siteUrl,profile,turnstileSiteKey}; identityText(identity) canonical JSON. Configure generates .generated/deployment-identity.json and exact DEPLOYMENT_IDENTITY binding. validateDeploymentIdentity(built,env) throws on mismatches; wrapper rejects before DB/Queue/HTTP side effects. Nonlocal frontend emits meta starter-deployment with canonical identity text.

Write RED tests for matching/null/mismatched identities and runtime entry-point fail-closed behavior. Implement and run focused config/runtime tests GREEN. Preserve normal local/auth behavior. Record completion.

## Task 2: Frozen inputs and artifact verification

Files: scripts/deployment/release-files.json; release-inputs.mjs/.d.mts; release-artifact.mjs/.d.mts; tests/release-artifact.test.ts.

Produces: snapshotReleaseInputs(root) map of exact contained regular bytes+hashes and assertUnchanged; sanitizedBuildEnv(env,workspace) allowlisted process necessities only; sealReleaseArtifact(root,metadata) creates exact file inventory/checksum; verifyReleaseArtifact(root,expectedTarget) rechecks inventory, hashes, relative paths, identities and required checks, returning blocked manifest. No credential/runtime state copying. Runtime inventory includes the new release modules and itself, separate from source-only tools.

Test RED/GREEN: known source inputs only, secret/untracked/generated exclusions, link/traversal refusal, actual copied input mutation, target mismatch, extra/missing/tampered files, manifest checksum, frontend/bundle identity markers. Rulings explicit if packaging has no native CMS build.

## Task 3: Isolated build and guarded command planning

Files: release-build.mjs/.d.mts; release-command.mjs/.d.mts; tests/release-commands.test.ts; package scripts/client script projection; export inventory.

Produces: buildProductionRelease(root,args) owns unique run workspace/artifact, copies snapshot and projected production project, fixed sanitized install/check/build/local-migrate/bundle and no-bundle dry-run commands, packages and verifies candidate, rechecks source. CLI prints artifact path, returns success for locally verified blocked candidate (readiness stays blocked). Strict args only. planReleaseCommand(operation,options) verifies artifact/explicit account+DB and returns blocked structured plan; execute always throws before runner/spawn. CLI planning exits1 while blocked.

Write RED/GREEN tests for strict args and blocked execution without a remote runner, copied input/source preservation and export contracts. Run a real isolated package build from inert sample configuration and verify package identity/public marker/snapshot/local migration/dry-runs. Test corrupted copy in owned fixtures; never mutate the verified candidate or source to simulate corruption.

## Task 4: CI rehearsal, runbook and final acceptance

Files: docs/RELEASES.md; current deployment/readiness/operations docs; source-only verify-release.mjs; CI guarded-build job; evidence.

Add secret-free manual CI rehearsal and operator commands. Document candidate-vs-ready, missing hosted CMS, integrity-vs-signature, environment sanitation, exact target selection, migration/recovery/rollback order and remote execution block. Run focused tests, check/full suites/build/Worker dry-run and a generated-client release rehearsal; one final review, verified fix pass, archive evidence, restart site/CMS. No merge/push/deploy.

## Review focus

Strict production config survives serialization without credentials; isolated source export works in generated clients; source cannot change silently while building; artifact path/config cannot reference outside package; file inventory/link/case/extra/tamper checks fail closed; compiled/browser/runtime identities match; failures never produce a valid success manifest; no command enables remote side effects or lifts hosted blockers.
