# Production readiness

Status: **blocked**, as requested by the owner on 2026-10-21. No deployment or real sending is authorized by this checklist. The current project remains a local, enquiries-profile starter with capture-only delivery.

## Required owner and infrastructure inputs

Before implementing hosted deployment, provide a final site domain and distinct staging/production deployment identities, D1 database UUIDs, queue/DLQ names, Workflow names when nurture is enabled, SES region/sender identity/configuration set, SNS feedback topic, and allowed staging recipients. Treat customer identity plus environment as the deployment identity. A different ENVIRONMENT label alone does not isolate today's generated resources.

The existing project infrastructure model contains one resource set. Environment-specific resource mapping, cross-customer ID checks and build/runtime identity verification are still required before using it for staging and production. Do not deploy two environments by changing only ENVIRONMENT or reusing the current D1 UUID.

Provide the desired administrator/editor email lists and hosted Tina membership. Verify Access application route coverage, audience and issuer, actual signed login/JWKS behavior, and Tina repository/index/build integration. Local role tests are not hosted certification.

Provision AWS, Turnstile and token-signing secrets through environment-specific secret bindings. Never put them in project.json, CMS content, frontend bundles, logs or source control. Agree a credential rotation and incident procedure. Implement and test the actual Turnstile client integration; a local preview token is not valid hosted protection.

Verify SES sender permissions, verified identities, SPF/DKIM/DMARC, account sending restrictions, feedback subscription and configuration-set routing using controlled staging recipients before enabling real transactional or marketing delivery. Review provider error codes without automatically retrying ambiguous acceptance.

## Required data decisions

The owner has not yet selected a retention policy. Record the retention period and deletion rules for enquiries, unconfirmed signups, active subscribers, withdrawn/suppressed addresses, consent evidence, email payloads/captures/events, operational logs and backups. Specify who handles access/deletion requests, what must be retained, and how address suppression survives appropriate deletion. Do not introduce arbitrary automatic deletion before those decisions.

The current cleanup expires rate limits and action tokens only. No claim of completed personal-data retention or legal compliance is made. Add and test the agreed deletion mechanism across related records and backup/export copies before real personal-data use.

## Release gates

1. Implement isolated deployment configuration and controlled remote migration commands. Review generated identities and never point staging at a production database.
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

Local runtime budget verification does not lift the production block. Configure a measured daily allowance/reserve; qualify the actual Free Queue/Workflow entitlement, CPU, D1 rows, provider limits and shared account activity in isolated authorized staging. Provider analytics is pending. See [Runtime budgets](RUNTIME_BUDGETS.md).
