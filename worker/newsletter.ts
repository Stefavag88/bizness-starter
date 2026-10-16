import { emailKey, hash, randomToken, signupSchema } from '../packages/contracts';
import project from '../project.json';
import settings from '../content/settings/site.json';
import type { Env, Subscriber } from './types';
import { jobStatement, now, rateLimit } from './db';
import { HttpError, readToken } from './security';

export async function subscribe(env: Env, input: unknown) {
  const data = signupSchema.parse(input);
  if (!project.interests.some((i) => i.id === data.interest))
    throw new HttpError(400, 'Unknown interest.');
  if (!(await rateLimit(env, `email:${await hash(emailKey(data.email))}`, 3))) return;
  const existing = await env.DB.prepare('SELECT * FROM subscriber WHERE email_key=?')
    .bind(emailKey(data.email))
    .first<Subscriber>();
  if (existing && ['active', 'suppressed'].includes(existing.status)) return;
  if (existing && now() - existing.last_requested_at < 60000) return;
  const id = existing?.id || crypto.randomUUID();
  const generation = existing
    ? existing.generation + (existing.status === 'unsubscribed' ? 1 : 0)
    : 1;
  const raw = randomToken();
  const tokenHash = await hash(raw);
  const timestamp = now();
  const statements = [
    env.DB.prepare(
      `INSERT INTO subscriber(id,email,email_key,name,status,generation,created_at,last_requested_at,source_article,consent_version)
 VALUES(?,?,?,?,'pending',?,?,?,?,?) ON CONFLICT(email_key) DO UPDATE SET status='pending',
 generation=?,last_requested_at=?,consent_version=? WHERE status IN ('pending','unsubscribed')`,
    ).bind(
      id,
      data.email,
      emailKey(data.email),
      data.name || null,
      generation,
      timestamp,
      timestamp,
      data.sourceArticle || null,
      settings.legal.privacyVersion,
      generation,
      timestamp,
      settings.legal.privacyVersion,
    ),
    env.DB.prepare('DELETE FROM action_token WHERE subscriber_id=?').bind(id),
    env.DB.prepare(
      "INSERT OR IGNORE INTO subscriber_interest(subscriber_id,interest_id) SELECT id,? FROM subscriber WHERE id=? AND status='pending'",
    ).bind(data.interest, id),
    env.DB.prepare(
      "INSERT INTO action_token(token_hash,subscriber_id,generation,expires_at) SELECT ?,id,generation,? FROM subscriber WHERE id=? AND status='pending'",
    ).bind(tokenHash, timestamp + 48 * 3600000, id),
    env.DB.prepare(
      "INSERT OR IGNORE INTO consent_record(id,subscriber_id,action,version,created_at,source) SELECT ?,id,'requested',?,?,? FROM subscriber WHERE id=? AND status='pending'",
    ).bind(data.requestKey, settings.legal.privacyVersion, timestamp, data.sourceArticle || 'signup', id),
    jobStatement(
      env,
      `confirm:${tokenHash}`,
      'confirmation',
      { to: data.email, token: raw },
      id,
      generation,
    ),
  ];
  await env.DB.batch(statements);
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
