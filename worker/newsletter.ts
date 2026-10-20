import { emailKey, hash, randomToken, signupSchema } from '../packages/contracts';
import project from '../project.json';
import settings from '../content/settings/site.json';
import type { Env, Subscriber } from './types';
import { jobStatement, now, rateLimit } from './db';
import { HttpError, readToken } from './security';

/** Statements must execute together, immediately in this order, in one D1 batch.
 * changes() gates token creation on this batch's subscriber insert/update; later
 * statements use that unique token as the operation marker, never a stale JS read.
 */
export async function subscriptionStatements(env: Env, input: unknown): Promise<D1PreparedStatement[]> {
  const data = signupSchema.parse(input);
  if (!project.interests.some(i => i.id === data.interest)) throw new HttpError(400, 'Unknown interest.');
  if (!(await rateLimit(env, `email:${await hash(emailKey(data.email))}`, 3))) return [];
  const timestamp = now(), raw = randomToken(), tokenHash = await hash(raw), key = emailKey(data.email);
  return [
    env.DB.prepare(`INSERT INTO subscriber(id,email,email_key,name,status,generation,created_at,last_requested_at,source_article,consent_version)
 SELECT ?,?,?,?,'pending',1,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM consent_record WHERE id=?)
 ON CONFLICT(email_key) DO UPDATE SET status='pending',
 generation=subscriber.generation+CASE WHEN subscriber.status='unsubscribed' THEN 1 ELSE 0 END,
 last_requested_at=excluded.last_requested_at,consent_version=excluded.consent_version
 WHERE subscriber.status IN ('pending','unsubscribed') AND subscriber.last_requested_at<=?
 AND NOT EXISTS(SELECT 1 FROM consent_record WHERE id=?)`).bind(
      crypto.randomUUID(),data.email,key,data.name||null,timestamp,timestamp,data.sourceArticle||null,
      settings.legal.privacyVersion,data.requestKey,timestamp-60000,data.requestKey),
    env.DB.prepare(`INSERT INTO action_token(token_hash,subscriber_id,generation,expires_at)
 SELECT ?,id,generation,? FROM subscriber WHERE email_key=? AND status='pending' AND changes()=1`)
      .bind(tokenHash,timestamp+48*3600000,key),
    env.DB.prepare(`DELETE FROM action_token WHERE subscriber_id=(SELECT subscriber_id FROM action_token WHERE token_hash=?) AND token_hash!=?`)
      .bind(tokenHash,tokenHash),
    env.DB.prepare(`INSERT OR IGNORE INTO subscriber_interest(subscriber_id,interest_id)
 SELECT subscriber_id,? FROM action_token WHERE token_hash=?`).bind(data.interest,tokenHash),
    env.DB.prepare(`INSERT OR IGNORE INTO consent_record(id,subscriber_id,action,version,created_at,source)
 SELECT ?,s.id,'requested',?,?,? FROM subscriber s JOIN action_token t ON t.subscriber_id=s.id WHERE t.token_hash=?`)
      .bind(data.requestKey,settings.legal.privacyVersion,timestamp,data.sourceArticle||'signup',tokenHash),
    env.DB.prepare(`UPDATE email_job SET state='skipped',payload_json='{}',lease_until=NULL
 WHERE kind='confirmation' AND state IN ('pending','queued') AND subscriber_id=(SELECT subscriber_id FROM action_token WHERE token_hash=?)`)
      .bind(tokenHash),
    env.DB.prepare(`INSERT OR IGNORE INTO email_job(id,dedupe_key,kind,payload_json,subscriber_id,generation,available_at,created_at)
 SELECT ?,?,'confirmation',?,subscriber_id,generation,?,? FROM action_token WHERE token_hash=?`)
      .bind(crypto.randomUUID(),`confirm:${tokenHash}`,JSON.stringify({to:data.email,token:raw}),timestamp,timestamp,tokenHash),
  ];
}
export async function subscribe(env: Env, input: unknown) {
  const statements = await subscriptionStatements(env,input);
  if (statements.length) await env.DB.batch(statements);
}
export async function confirm(env: Env, raw: string) {
  const tokenHash = await hash(raw);
  const token = await env.DB.prepare(
    `SELECT t.*,s.status FROM action_token t JOIN subscriber s ON s.id=t.subscriber_id
 WHERE token_hash=? AND t.generation=s.generation`,
  )
    .bind(tokenHash)
    .first<{
      subscriber_id: string;
      generation: number;
      expires_at: number;
      consumed_at: number | null;
      status: string;
    }>();
  if (!token || token.expires_at < now() || !['pending', 'active'].includes(token.status))
    throw new HttpError(400, 'This confirmation link has expired. Please sign up again.');
  if (token.consumed_at) return;
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE subscriber SET status='active',confirmed_at=? WHERE id=? AND status='pending' AND generation=?
 AND EXISTS(SELECT 1 FROM action_token WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?)`,
    ).bind(timestamp, token.subscriber_id, token.generation, tokenHash, timestamp),
    env.DB.prepare(
      `UPDATE action_token SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL
 AND EXISTS(SELECT 1 FROM subscriber WHERE id=? AND status='active' AND generation=?)`,
    ).bind(timestamp, tokenHash, token.subscriber_id, token.generation),
    env.DB.prepare(
      `INSERT OR IGNORE INTO consent_record(id,subscriber_id,action,version,created_at,source)
 SELECT ?,id,'confirmed',consent_version,?,'double-opt-in' FROM subscriber WHERE id=? AND status='active' AND generation=?`,
    ).bind(
      `confirmed:${token.subscriber_id}:${token.generation}`,
      timestamp,
      token.subscriber_id,
      token.generation,
    ),
    jobStatement(
      env,
      `welcome:${token.subscriber_id}:${token.generation}`,
      'welcome',
      {},
      token.subscriber_id,
      token.generation,
    ),
    ...(env.PROFILE === 'nurture'
      ? [
          env.DB.prepare(
            `INSERT OR IGNORE INTO automation_enrollment(id,subscriber_id,generation,version)
 SELECT ?,id,generation,'v1' FROM subscriber WHERE id=? AND status='active' AND generation=?`,
          ).bind(
            `welcome-${token.subscriber_id}-${token.generation}`,
            token.subscriber_id,
            token.generation,
          ),
        ]
      : []),
  ]);
}
export async function unsubscribe(env: Env, token: string) {
  const { id, generation } = await readToken(env, token, 'unsubscribe');
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO consent_record(id,subscriber_id,action,version,created_at,source)
 SELECT ?,id,'withdrawn',consent_version,?,'unsubscribe' FROM subscriber WHERE id=? AND generation=? AND status IN ('active','pending')`,
    ).bind(`withdraw:${id}:${generation}`, timestamp, id, generation),
    env.DB.prepare(
      "UPDATE subscriber SET status='unsubscribed',generation=generation+1 WHERE id=? AND generation=? AND status IN ('pending','active')",
    ).bind(id, generation),
    env.DB.prepare(
      "UPDATE automation_enrollment SET state='cancelled' WHERE subscriber_id=? AND generation=?",
    ).bind(id, generation),
  ]);
}
