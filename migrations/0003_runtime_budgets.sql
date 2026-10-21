-- Operational admission and observations only; no personal-data retention changes.
CREATE TABLE runtime_admission_day(day TEXT PRIMARY KEY,total INTEGER NOT NULL CHECK(total>=0),marketing INTEGER NOT NULL CHECK(marketing>=0 AND marketing<=total));
CREATE TABLE runtime_cursor(key TEXT PRIMARY KEY,position TEXT NOT NULL);
CREATE TABLE runtime_usage_day(day TEXT NOT NULL,entrypoint TEXT NOT NULL,observations INTEGER NOT NULL DEFAULT 0,sql_statements INTEGER NOT NULL DEFAULT 0,external_calls INTEGER NOT NULL DEFAULT 0,internal_calls INTEGER NOT NULL DEFAULT 0,queue_admissions INTEGER NOT NULL DEFAULT 0,deferred INTEGER NOT NULL DEFAULT 0,accepted INTEGER NOT NULL DEFAULT 0,failed INTEGER NOT NULL DEFAULT 0,unknown INTEGER NOT NULL DEFAULT 0,last_observed_at INTEGER NOT NULL,PRIMARY KEY(day,entrypoint));
CREATE TABLE runtime_campaign_estimate(campaign_id TEXT PRIMARY KEY REFERENCES campaign(id),cutoff_at INTEGER NOT NULL,cursor TEXT NOT NULL DEFAULT '',matched INTEGER NOT NULL DEFAULT 0 CHECK(matched>=0),delayed INTEGER NOT NULL DEFAULT 0 CHECK(delayed>=0),next_eligible_at INTEGER,complete INTEGER NOT NULL DEFAULT 0 CHECK(complete IN (0,1)),generated_at INTEGER NOT NULL);
CREATE INDEX expired_rate ON rate_limit(expires_at,key);
CREATE INDEX expired_token ON action_token(expires_at,token_hash);
CREATE INDEX jobs_lease ON email_job(state,lease_until,id);
CREATE INDEX jobs_order ON email_job(state,available_at,created_at,id);
CREATE INDEX enrollment_cursor ON automation_enrollment(state);
