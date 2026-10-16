PRAGMA foreign_keys = ON;
CREATE TABLE inquiry (
 id TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', context_id TEXT NOT NULL DEFAULT '',
 message TEXT NOT NULL, privacy_version TEXT NOT NULL, marketing_requested INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','closed')),
 created_at INTEGER NOT NULL
);
CREATE TABLE subscriber (
 id TEXT PRIMARY KEY, email TEXT NOT NULL, email_key TEXT NOT NULL UNIQUE, name TEXT,
 status TEXT NOT NULL CHECK(status IN ('pending','active','unsubscribed','suppressed')),
 generation INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, confirmed_at INTEGER,
 last_marketing_sent_at INTEGER, last_requested_at INTEGER NOT NULL, source_article TEXT,
 consent_version TEXT NOT NULL
);
CREATE TABLE subscriber_interest (
 subscriber_id TEXT NOT NULL REFERENCES subscriber(id) ON DELETE CASCADE,
 interest_id TEXT NOT NULL, PRIMARY KEY(subscriber_id,interest_id)
);
CREATE INDEX interest_audience ON subscriber_interest(interest_id,subscriber_id);
CREATE TABLE consent_record (
 id TEXT PRIMARY KEY, subscriber_id TEXT REFERENCES subscriber(id) ON DELETE CASCADE,
 action TEXT NOT NULL CHECK(action IN ('requested','confirmed','withdrawn','preferences')),
 version TEXT NOT NULL, created_at INTEGER NOT NULL, source TEXT NOT NULL
);
CREATE TABLE action_token (
 token_hash TEXT PRIMARY KEY, subscriber_id TEXT NOT NULL REFERENCES subscriber(id) ON DELETE CASCADE,
 generation INTEGER NOT NULL, expires_at INTEGER NOT NULL, consumed_at INTEGER
);
CREATE TABLE campaign (
 id TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, snapshot_json TEXT NOT NULL,
 snapshot_hash TEXT NOT NULL, interest_id TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('draft','approved','dispatching','completed','paused')),
 approved_by TEXT, approved_at INTEGER, approval_hash TEXT,
 cutoff_at INTEGER, cursor TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
);
CREATE TABLE email_job (
 id TEXT PRIMARY KEY, dedupe_key TEXT NOT NULL UNIQUE, kind TEXT NOT NULL,
 subscriber_id TEXT REFERENCES subscriber(id) ON DELETE CASCADE,
 campaign_id TEXT REFERENCES campaign(id), generation INTEGER,
 payload_json TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','queued','sending','accepted','failed','unknown','skipped')),
 available_at INTEGER NOT NULL, lease_until INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
 provider_message_id TEXT UNIQUE, error_code TEXT, created_at INTEGER NOT NULL, accepted_at INTEGER
);
CREATE INDEX jobs_due ON email_job(state,available_at);
CREATE INDEX subscriber_audience ON subscriber(status,id);
CREATE TABLE email_event (
 id TEXT PRIMARY KEY, provider_message_id TEXT NOT NULL, event_type TEXT NOT NULL,
 received_at INTEGER NOT NULL
);
CREATE TABLE email_capture (
 id TEXT PRIMARY KEY, job_id TEXT NOT NULL UNIQUE REFERENCES email_job(id) ON DELETE CASCADE,
 recipient TEXT NOT NULL, subject TEXT NOT NULL, text TEXT NOT NULL, html TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE rate_limit (
 key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE automation_enrollment (
 id TEXT PRIMARY KEY, subscriber_id TEXT NOT NULL REFERENCES subscriber(id) ON DELETE CASCADE,
 generation INTEGER NOT NULL, version TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending',
 UNIQUE(subscriber_id,generation,version)
);
