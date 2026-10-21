# Local development and production

The supported initial workflow is **local development + one production deployment per application**. Staging is optional and deferred. This milestone prepares a reviewable production plan; it does not publish a website or make this starter production-ready.

## Configuration ownership

Keep canonical project.json in local mode for development. Create a developer-owned deployment.production.json from deployment.production.example.json. Set application to exactly project.name. Initialized clients receive an inert example with their own application name. Fill in the account ID, final HTTPS origin and production infrastructure; these values are non-secret configuration. Never include tokens, secret keys or passwords. The input schema rejects unknown fields, including credential fields. Production infrastructure resolves from closed defaults, not from the local project's infrastructure. Explicitly configure every required production value.

Resource names derive from the application plus -production: Worker APPLICATION-production, D1 APPLICATION-production-db, Queue APPLICATION-production-outbound, DLQ APPLICATION-production-dead, and APPLICATION-production-welcome for the nurture Workflow. The database UUID must identify the actual production database. Queue and Workflow names are binding references, not resources created by this tool. The account ID and a custom-domain route are explicitly included in the plan. Hosted analytics, if enabled, must use that account and the same Worker/database identity. Account-wide limits may still be shared with other applications.

## Prepare locally

Stop this checkout's owned dev launcher before changing module/configuration or running the complete checks.

```powershell
Copy-Item deployment.production.example.json deployment.production.json
# Edit deployment.production.json for this application, then:
pnpm deploy:prepare -- --target production --config deployment.production.json
```

The command requires an explicit target and file. It validates the current content against the production projection and writes .generated/deployment/production-plan.json. The result contains target/resource bindings, canonical project/content/theme/upload SHA-256 fingerprints and the target-file hash. It does not modify canonical project.json, content, local Worker configuration or local D1. It does not run a build, create resources, read secrets, apply migrations or call Cloudflare.

**Exit 1 is expected while release is blocked**, including after a valid plan was written. A written report is identified in command output; malformed configuration instead fails before replacing the report. Old reports may therefore remain after a failed attempt: do not interpret their existence as proof of the latest command's success. Fingerprints are diagnostic input snapshots, not a signed artifact or an atomic lock on a future deployment. The plan is never an executable Wrangler configuration.

The legacy pnpm deploy:check checks canonical project.json and remains blocked. Do not change canonical environment just to make it pass. Neither command has an override that grants release approval.

## Per-application setup still needed

1. Provision the application's production Worker identity, D1, Queue/DLQ, and optional Workflow; record the real IDs and final domain. Nothing is provisioned by preparation.
2. Verify Cloudflare Access coverage for CMS/admin/API operations, issuer/audience, admin/editor roles and actual signed login. Configure the hosted Tina project, correct repository/content branch and rebuild publication flow. With production only, main is a reasonable chosen content branch; that choice still needs explicit hosted configuration.
3. Verify the implemented CMS/public header separation and shared Turnstile client/server setup on the real hostname; see [form security](FORM_SECURITY.md). Configure secrets through reviewed secret bindings, outside source control and CMS.
4. Agree and implement data retention/deletion; review actual content, legal copy and consent language. Configure operator alerts and recovery ownership.
5. Keep sending/marketing disabled until sender authentication, feedback, allowed test recipients and ambiguous-delivery handling are verified. Commission the hosted deployment with controlled test data and no public launch announcement. Enabling sending is a separate reviewed step.
6. Qualify the selected profile's actual cloud capacity and provider analytics using controlled workloads. Local statement counts and dry-run output are not hosted CPU/row/entitlement evidence.

These are still mandatory release gates. A production-only choice removes the staging requirement; it does not waive technical readiness or authorize a public launch. The next hosted milestone must supply a reviewed build/runtime identity contract, immutable artifact packaging, secret/resource verification and guarded remote migration/deployment commands. This milestone deliberately blocks remote mutations instead of offering premature commands.

## Checks and recovery before release

Run pnpm check, pnpm test, pnpm build and pnpm worker:check with the owned launcher stopped. These verify the local source, not a production-target build. Before actual release tooling is introduced, verify the production build in an isolated release workspace, including exclusion of local showcase/templates, matching site origins and matching runtime bindings. Rebuild static content after approved CMS changes.

Rehearse each forward migration against disposable local D1 with the relevant prior schema and test data. Before applying anything remotely, verify account and database UUID, inspect pending migrations and preserve a tested recovery point. Use only additive migrations while preparing compatible code rollouts where practical. Retain the prior code artifact and understand its database compatibility: code rollback does not undo SQL migrations. Never use real customer records for ordinary local tests.

## Command guard boundary

The owned scripts/wrangler.mjs wrapper permits only the exact documented worker:check dry-run, db:local migration and loopback local-dev shapes. It rejects remote operations, deployment aliases, environment overrides and extra flags. Existing internal verification harnesses also invoke pinned Wrangler directly with their own explicit local/dry-run arguments; they are not general deployment interfaces. Direct raw Wrangler or Cloudflare dashboard actions are outside this guard. This is an accidental-command safeguard, not account-level authorization or a sandbox for arbitrary shell access.

## Add staging later

Add a separately reviewed target configuration with independent account/resource references, domain, secrets, content branch and restricted sending policy. Reuse the shared Worker configuration builder rather than changing Page, content or CMS ownership. Staging support will require implementation and validation; no hidden staging resources or automatic branch deployments are created now.
