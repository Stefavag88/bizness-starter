-- Each dispatch lane can select due work without scanning the opposite lane.
CREATE INDEX jobs_transactional_due ON email_job(state,available_at,created_at,id) WHERE kind IN ('inquiry','test','confirmation');
CREATE INDEX jobs_marketing_due ON email_job(state,available_at,created_at,id) WHERE kind NOT IN ('inquiry','test','confirmation');
