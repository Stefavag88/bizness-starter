import type { Env } from './types';
export const now = () => Date.now();
export function jobStatement(
  env: Env,
  key: string,
  kind: string,
  payload: Record<string, unknown>,
  subscriberId: string | null = null,
  generation: number | null = null,
  campaignId: string | null = null,
  availableAt = now(),
) {
  return env.DB.prepare(
    `INSERT OR IGNORE INTO email_job
 (id,dedupe_key,kind,payload_json,subscriber_id,generation,campaign_id,available_at,created_at)
 VALUES(?,?,?,?,?,?,?,?,?)`,
  ).bind(
    crypto.randomUUID(),
    key,
    kind,
    JSON.stringify(payload),
    subscriberId,
    generation,
    campaignId,
    availableAt,
    now(),
  );
}
export async function rateLimit(env: Env, key: string, max: number) {
  const hour = Math.floor(now() / 3600000);
  const bucket = `${key}:${hour}`;
  const result = await env.DB.prepare(
    `INSERT INTO rate_limit(key,count,expires_at) VALUES(?,1,?)
 ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count`,
  )
    .bind(bucket, (hour + 2) * 3600000, max)
    .first();
  return !!result;
}
