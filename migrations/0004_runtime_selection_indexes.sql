CREATE INDEX campaign_dispatch ON campaign(state,id);
CREATE INDEX jobs_kind_due ON email_job(state,kind,available_at,created_at,id);
