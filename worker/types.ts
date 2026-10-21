export interface Env {
  RUNTIME_BUDGET?: string;
  DB: D1Database;
  ASSETS: Fetcher;
  OUTBOUND: Queue<{ id: string }>;
  NURTURE?: Workflow;
  ENVIRONMENT: string;
  PROFILE: string;
  SITE_URL: string;
  LOCAL_ORIGINS: string;
  LOCAL_SITE_URL: string;
  LOCAL_WORKER_URL: string;
  SES_REGION: string;
  SES_SENDER: string;
  NOTIFICATION_EMAIL: string;
  ALLOWED_RECIPIENTS: string;
  SES_CONFIGURATION_SET: string;
  SNS_TOPIC_ARN: string;
  ACCESS_ISSUER: string;
  ACCESS_AUDIENCE: string;
  ADMIN_EMAILS: string;
  EDITOR_EMAILS: string;
  SENDING_ENABLED: string;
  MARKETING_ENABLED: string;
  SEND_INTERVAL_MS: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_SESSION_TOKEN?: string;
  TURNSTILE_SECRET?: string;
  TOKEN_SECRET?: string;
}
export interface Subscriber {
  id: string;
  email: string;
  email_key: string;
  name: string | null;
  status: string;
  generation: number;
  consent_version: string;
  last_requested_at: number;
  last_marketing_sent_at: number | null;
}
export interface EmailJob {
  id: string;
  kind: string;
  subscriber_id: string | null;
  campaign_id: string | null;
  generation: number | null;
  payload_json: string;
  state: string;
  attempts: number;
}
export interface Campaign {
  id: string;
  snapshot_json: string;
  snapshot_hash: string;
  interest_id: string;
  state: string;
  approval_hash: string | null;
  cursor: string;
  cutoff_at: number;
}
