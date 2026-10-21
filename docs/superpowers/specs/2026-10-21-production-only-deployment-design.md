# Production-only deployment preparation

## Intent and authorization

The owner approved local development plus production only on 2026-10-21, postponing staging. Prepare reusable explicit deployment configuration and safeguards now; do not provision resources, connect credentials, migrate remote databases or deploy. Preserve design, content and local development. Implement inline with one final independent review, following the existing workflow.

## Design

An optional developer-owned deployment.production.json selects a single production target for this application. It declares format 1, application name, target production, Cloudflare account ID, HTTPS site origin and production infrastructure. Infrastructure uses the existing strict project schema and defaults from an empty object, never inherited local resource IDs, Access identities, sending or analytics configuration. Worker, database, Queue/DLQ and conditional Workflow names derive from application name plus production. No staging resources or Git branch are required.

A pure Worker configuration builder is shared by ordinary configure and the production plan. Local output remains equivalent. Production output explicitly binds account ID, custom domain and independent resource names, removes local-origin variables, and aligns analytics resource identity. Existing direct nonlocal configure remains unsupported for release.

A local-only prepare command requires --target production and --config FILE. It validates strict input, validates current content against the production projection and writes an ignored JSON plan under .generated/deployment. It records reviewed target configuration, canonical-input SHA-256 fingerprints, planned Worker configuration, outstanding identity/setup issues and blocked release status. It never runs Wrangler, loads secrets or copies local credentials. A plan is not a built/deployable artifact or certification, and input hashes are diagnostic, not an atomic release lock. Invalid schema fails without writing a new plan. Valid placeholder configuration can produce an honest blocked plan with a nonzero exit.

The existing Wrangler wrapper allows only documented local development, local D1 operations and Worker dry-run commands. Remote mutations are blocked while mandatory hosted prerequisites remain unresolved. No generic argument pass-through, --remote, --env or option overrides may silently select a cloud target. Direct use of Wrangler outside the wrapper is outside this guard and is explicitly documented.

## Release boundary and optional staging

Production-only is supported as a workflow choice, not as a claim of launch readiness. Keep hosted CMS/Access, Turnstile, secrets, sending/feedback, owner-approved data retention, content/legal review, capacity and recovery evidence blocked. Replace staging-only requirements in current runbooks with disposable local database rehearsal plus controlled production commissioning. Historical evidence/plans remain historical. Code rollback does not reverse database migrations. Future staging can add an independent target and resource set without changing content ownership or this target's schema.

## Acceptance

Tests cover unknown/secret target fields, target/application mismatch, missing and placeholder identities, production-only resources without staging, no inherited local settings, name collisions across Queue/DLQ, analytics/account alignment, source immutability, plan hashes, invalid CLI options, no remote process execution, wrapper bypass attempts, local compatibility and initializer exports. Run focused tests red/green, full check/test/build and Worker dry-run. Final independent review assesses only this change; preserve pre-existing analytics edits.
