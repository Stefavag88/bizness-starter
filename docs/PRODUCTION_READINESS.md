# Production readiness

Status: **blocked**, as requested by the owner on 2026-10-21. No deployment or real sending is authorized by this checklist. The current project remains a local, enquiries-profile starter with capture-only delivery.

## Required owner and infrastructure inputs

The owner selected **local development + production only** on 2026-10-21. Staging is optional and deferred; it is not a mandatory release prerequisite. Follow [production preparation](DEPLOYMENT.md). This decision does not lift production blockers or authorize provisioning, remote migrations, real sending or deployment.

Before hosted deployment, provide the final site domain, production account ID, application identity, D1 database UUID, Queue/DLQ identities, Workflow when nurture is enabled, and applicable SES region/sender/configuration-set/SNS feedback identities. Use controlled test recipients during commissioning. The optional deployment.production.json provides a strict non-secret target input, derived production resource names and a blocked local-only plan. The normal local configuration remains separate. Build/runtime identity, isolated artifact verification and blocked command plans are implemented; see [release candidates](RELEASES.md). Hosted CMS build, secret/resource verification, upgrade/recovery rehearsal and an authorized remote executor are still required before release. Changing ENVIRONMENT alone is not isolation.

Provide the desired administrator/editor email lists and hosted Tina membership. Verify Access application route coverage, audience and issuer, actual signed login/JWKS behavior, and Tina repository/index/build integration. Local role tests are not hosted certification.

Provision AWS, Turnstile and token-signing secrets through environment-specific secret bindings. Never put them in project.json, CMS content, frontend bundles, logs or source control. Agree a credential rotation and incident procedure. The shared Turnstile client and bounded server verification are implemented locally; configure the real public key/secret and verify hostname/action and failure paths on the intended deployment. A local preview token is not valid hosted protection. See [form security](FORM_SECURITY.md).

Verify SES sender permissions, verified identities, SPF/DKIM/DMARC, account sending restrictions, feedback subscription and configuration-set routing using controlled commissioning recipients before enabling real transactional or marketing delivery. Review provider error codes without automatically retrying ambiguous acceptance.

## Required data decisions

The owner has not yet selected a retention policy. Record the retention period and deletion rules for enquiries, unconfirmed signups, active subscribers, withdrawn/suppressed addresses, consent evidence, email payloads/captures/events, operational logs and backups. Specify who handles access/deletion requests, what must be retained, and how address suppression survives appropriate deletion. Do not introduce arbitrary automatic deletion before those decisions.

The current cleanup expires rate limits and action tokens only. No claim of completed personal-data retention or legal compliance is made. Add and test the agreed deletion mechanism across related records and backup/export copies before real personal-data use.

## Release gates

1. Review the prepared production target and locally verified blocked candidate; complete hosted verification and separately authorize future controlled remote migration/deployment execution. Staging is optional; never reuse production resources for another app or optional test deployment.
2. Complete hosted CMS/Access, form protection and SES/SNS verification with recorded evidence.
3. Review real business content, legal wording, consent policy and version. Existing contentReviewed/legalReviewed flags remain mandatory declarations; they do not replace that review.
4. Complete and rehearse the procedures in [operations](OPERATIONS.md), including uncertain delivery, failed Workflow, DLQ, migration failure and deployment rollback. Configure actionable alerts with an operator and thresholds.
5. Run checks, tests, builds, Worker dry-run and applicable browser/profile suites against the intended immutable artifact. The checked-in CI definition must acquire its own successful hosted run; local verification does not establish that.
6. Replace the unconditional production-readiness blocker only with verified mandatory prerequisites. Keep the nurture sample-content blocker until real nurture messages are implemented and reviewed. No flag alone should authorize release.

## Local migration and generation

Source migrations use unique four-digit ordered names, such as 0001_initial.sql and 0002_workflow_cursor.sql. Configure copies every validated migration into generated input. Never edit an already-applied migration to upgrade an installed database; add a forward migration.

The normal local launcher applies outstanding local migrations. `pnpm db:local` also applies them to the local project database. Migration 0002 adds only operational round-robin cursors; it does not rewrite subscriber or enquiry records. Remote migration and rollback commands remain deferred with hosted deployment.

Configure holds an exclusive `.generated/configure.lock`. Wait for the owner to finish rather than start concurrent generation. If a crashed process leaves a lock, inspect its PID and verify that no owner is running before manually removing the exact lock file. Unexpected replacement locks are preserved. This lock serializes configure execution, not arbitrary edits to canonical files or an entire deployment transaction.

## Scope deliberately preserved

Locale publication dates remain independent; slugs remain shared and immutable. Uncertain delivery stays quarantined, permanent complaints/bounces remain address-level suppressions, and suppressed subscribers cannot reactivate through public signup. The website design, canonical content and default profile remain unchanged.

## Runtime capacity qualification

Local runtime budget verification does not lift the production block. Configure a measured daily allowance/reserve; qualify the actual Free Queue/Workflow entitlement, CPU, D1 rows, provider limits and shared account activity during controlled authorized hosted commissioning before public launch, with sending restricted or disabled. Provider analytics is prepared but actual cloud qualification is pending. See [Runtime budgets](RUNTIME_BUDGETS.md).
