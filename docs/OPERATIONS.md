# Delivery operations

These are investigation rules and preparation steps. Hosted resources and operator procedures have not been exercised, and production remains blocked. See [production readiness](PRODUCTION_READINESS.md).

## Read-only diagnostics

Authenticated administrators can query `/api/operations/overview`. It includes job state counts and oldest timestamps, recent enquiries, a bounded list of unknown/failed/expired-lease delivery metadata, and enrollment state counts. Delivery metadata contains job ID, kind, attempts, error code, provider message ID and timestamps; it excludes message payloads, recipient addresses and action tokens. Existing recent-enquiry output remains administrator-only personal data.

Correlate an enquiry's request key with its `inquiry:<requestKey>` job dedupe key. The email job ID is sent as the SES `job_id` tag; SNS feedback records the provider message ID. Scheduler failures include a schedule ID and task name, without logging message bodies.

## Unknown delivery outcome

An unknown outcome means the provider might have accepted the message. Do not retry the job, create a replacement intent, or resend a campaign simply to clear a warning.

1. Record the job ID, provider ID when present, error code, attempts and time window from protected diagnostics.
2. Check provider delivery/feedback evidence using the provider ID or job_id tag. A missing immediate event does not prove nonacceptance.
3. Keep ambiguous outcomes quarantined. Resolve only after independently sufficient evidence and a reviewed operator decision; no public or automatic unknown-to-pending override is shipped.
4. Before any separately approved retry, check current consent, subscriber generation, campaign state and deduplication guarantees. Preserve the investigation record and provider evidence.

The reconciliation UI/command and evidence requirements for changing unknown states remain a hosted-operations prerequisite. The current improvement is actionable read-only visibility, not an unsafe retry button.

## Pause, cancellation and feedback

Outside local capture, MARKETING_ENABLED=false pauses eligible marketing intents in pending state with their payload retained; it does not cancel them. Their next eligible time is deferred by an hour, so enabling marketing does not promise immediate delivery. Confirmation and transactional enquiry jobs keep their separate rules. Loss of consent or a stale generation skips an intent and clears its payload. Turning off SENDING_ENABLED remains a distinct sending guard; do not treat it as the marketing pause control.

Complaint and permanent-bounce feedback suppress the associated email address even if the correlated job belongs to an older subscription generation. This is the explicit conservative address-level policy; reconsenting cannot bypass complaint suppression. Suppressed subscribers cannot self-reactivate. Event IDs gate replay side effects inside the same transaction. No administrative suppression reset is provided.

Eligibility is refreshed just before provider submission, but no ordinary database check can retract a request already in flight.

## Workflow reconciliation

Pending and running enrollments have independent bounded batches: at most three pending and five running records per invocation. Durable cursors rotate each set, including records with failed platform lookups, so old waiting instances cannot starve new enrollments. Migration 0002 adds those cursors. These bounds reduce this task's query usage; they are not a guarantee that the entire application fits every Cloudflare plan's invocation limits.

Platform complete/errored/terminated states map to completed/failed/cancelled. Inactive or superseded subscriber generations cancel. Terminal records are not automatically restarted. Investigate a failure using its enrollment ID and platform instance status before any separately reviewed repair. Unknown platform status remains visible as an error. Scheduled tasks run independently; the invocation still reports aggregate failure after attempting the others.

## Hosted recovery procedures still to rehearse

- **DLQ:** identify the original job, inspect its current terminal state and provider evidence, and confirm duplicate processing is harmless before controlled replay. Never bulk replay unknown jobs.
- **Database migration:** verify the target environment/database identity, preserve a tested recovery point, review the forward migration, apply in staging, then rehearse recovery against a disposable clone. Do not rewrite applied migration history.
- **Deployment rollback:** retain the previous artifact and its compatible schema/configuration; assess database compatibility before rollback. A code rollback does not undo a migration.
- **Alerts:** define an operator, severity and thresholds for pending age, unknown outcomes, DLQ depth, repeated scheduled failures, feedback failures and failed enrollments. Avoid personal data in alert payloads.
- **Data requests:** implement the owner-approved retention/access/deletion policy across records, payloads, captures, logs and backups. No retention durations are assumed here.

These steps must become concrete, tested account-specific runbooks before hosted sending. No hosted procedure is certified by the local tests.
