import { AwsClient } from 'aws4fetch';
import type { Message } from '../packages/email';
import { message } from '../packages/email';
import { scopedToken } from './security';
import type { Env, EmailJob, Subscriber, Campaign } from './types';
import { now } from './db';
import settings from '../content/settings/site.json';

export class DeliveryError extends Error {
  constructor(
    public category: 'retryable' | 'permanent' | 'unknown',
    public code: string,
  ) {
    super(code);
  }
}
export function eligibility(
  job: Pick<EmailJob, 'generation' | 'kind'>,
  subscriber: Subscriber | null,
  marketingEnabled: boolean,
) {
  if (!subscriber) return ['inquiry', 'test'].includes(job.kind);
  if (subscriber.generation !== job.generation) return false;
  if (job.kind === 'confirmation') return subscriber.status === 'pending';
  return subscriber.status === 'active' && marketingEnabled;
}
async function send(env: Env, job: EmailJob, email: Message) {
  if (env.ENVIRONMENT === 'local') {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO email_capture(id,job_id,recipient,subject,text,html,created_at) VALUES(?,?,?,?,?,?,?)',
    )
      .bind(`local-${job.id}`, job.id, email.to, email.subject, email.text, email.html, now())
      .run();
    return `local-${job.id}`;
  }
  if (env.SENDING_ENABLED !== 'true') throw new DeliveryError('permanent', 'sending_disabled');
  if (env.ENVIRONMENT !== 'production' && !env.ALLOWED_RECIPIENTS.split(',').includes(email.to))
    throw new DeliveryError('permanent', 'recipient_not_allowed');
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY)
    throw new DeliveryError('permanent', 'credentials_missing');
  const client = new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN,
    service: 'ses',
    region: env.SES_REGION,
    retries: 0,
  });
  const headers = email.unsubscribe
    ? [
        { Name: 'List-Unsubscribe', Value: `<${email.unsubscribe}>` },
        { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
      ]
    : [];
  const input = {
    FromEmailAddress: env.SES_SENDER,
    Destination: { ToAddresses: [email.to] },
    ReplyToAddresses: email.replyTo ? [email.replyTo] : undefined,
    ConfigurationSetName: env.SES_CONFIGURATION_SET,
    EmailTags: [{ Name: 'job_id', Value: job.id }],
    Content: {
      Simple: {
        Subject: { Data: email.subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: email.text, Charset: 'UTF-8' },
          Html: { Data: email.html, Charset: 'UTF-8' },
        },
        Headers: headers,
      },
    },
  };
  let response: Response;
  try {
    response = await client.fetch(
      `https://email.${env.SES_REGION}.amazonaws.com/v2/email/outbound-emails`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    throw new DeliveryError('unknown', 'provider_outcome_unknown');
  }
  if (!response.ok) {
    if (response.status === 429) throw new DeliveryError('retryable', 'provider_throttled');
    // 5xx can follow acceptance; quarantine rather than risk duplicate delivery.
    throw new DeliveryError(
      response.status >= 500 ? 'unknown' : 'permanent',
      `provider_${response.status}`,
    );
  }
  const data = (await response.json()) as { MessageId?: string };
  if (!data.MessageId) throw new DeliveryError('unknown', 'missing_message_id');
  return data.MessageId;
}
// Consent loss is terminal; an operational marketing switch only pauses the intent.
async function deliveryAllowed(env: Env, job: EmailJob, subscriber: Subscriber | null) {
  if (!eligibility(job, subscriber, true)) {
    await env.DB.prepare(
      "UPDATE email_job SET state='skipped',payload_json='{}',lease_until=NULL WHERE id=? AND state='sending'",
    ).bind(job.id).run();
    return false;
  }
  if (
    subscriber &&
    job.kind !== 'confirmation' &&
    env.ENVIRONMENT !== 'local' &&
    env.MARKETING_ENABLED !== 'true'
  ) {
    await env.DB.prepare(
      "UPDATE email_job SET state='pending',available_at=?,lease_until=NULL,attempts=attempts-1 WHERE id=? AND state='sending'",
    ).bind(now() + 3600000, job.id).run();
    return false;
  }
  return true;
}
export async function deliver(env: Env, id: string) {
  const timestamp = now();
  const job = await env.DB.prepare(
    `UPDATE email_job SET state='sending',lease_until=?,attempts=attempts+1
 WHERE id=? AND state IN ('pending','queued') AND available_at<=? RETURNING *`,
  )
    .bind(timestamp + 60000, id, timestamp)
    .first<EmailJob>();
  if (!job) return;
  const subscriber = job.subscriber_id
    ? await env.DB.prepare('SELECT * FROM subscriber WHERE id=?')
        .bind(job.subscriber_id)
        .first<Subscriber>()
    : null;
  if (!(await deliveryAllowed(env, job, subscriber))) return;
  const payload = JSON.parse(job.payload_json) as Record<string, string>;
  let email: Message;
  if (job.kind === 'inquiry')
    email = message(
      env.NOTIFICATION_EMAIL,
      'New website enquiry',
      `${payload.name}\n${payload.email}\n${payload.phone || ''}\n\n${payload.message}`,
      undefined,
      payload.email,
    );
  else if (job.kind === 'test')
    email = message(payload.to, `[TEST] ${payload.subject}`, payload.text);
  else if (job.kind === 'confirmation') {
    const origin = env.ENVIRONMENT === 'local' ? env.LOCAL_WORKER_URL : env.SITE_URL;
    email = message(
      subscriber!.email,
      'Please confirm your updates',
      `Confirm your subscription to ${settings.brand.name}. This link expires in 48 hours.\n${origin}/newsletter/confirm?token=${payload.token}\nIf you did not request this, you can ignore this email.`,
    );
  } else {
    if (
      subscriber!.last_marketing_sent_at &&
      timestamp - subscriber!.last_marketing_sent_at < 48 * 3600000
    ) {
      await env.DB.prepare(
        "UPDATE email_job SET state='pending',available_at=?,lease_until=NULL WHERE id=? AND state='sending'",
      )
        .bind(subscriber!.last_marketing_sent_at + 48 * 3600000, id)
        .run();
      return;
    }
    if (job.campaign_id) {
      const campaign = await env.DB.prepare('SELECT * FROM campaign WHERE id=?')
        .bind(job.campaign_id)
        .first<Campaign>();
      if (!campaign || !['dispatching', 'completed'].includes(campaign.state)) {
        await env.DB.prepare("UPDATE email_job SET state='pending',available_at=?,lease_until=NULL WHERE id=? AND state='sending'")
          .bind(timestamp + 3600000, id)
          .run();
        return;
      }
    }
    const origin = env.ENVIRONMENT === 'local' ? env.LOCAL_WORKER_URL : env.SITE_URL;
    const unsub = `${origin}/api/newsletter/unsubscribe?token=${await scopedToken(env, subscriber!.id, subscriber!.generation, 'unsubscribe')}`;
    email = message(
      subscriber!.email,
      payload.subject || `Welcome to ${settings.brand.name}`,
      payload.text ||
        `${settings.brand.tagline}\n${env.SITE_URL}\n${settings.legal.businessName}`,
      unsub,
    );
  }
  // Composition and token signing await other work. Refresh consent immediately before submission.
  const currentJob = await env.DB.prepare('SELECT state FROM email_job WHERE id=?')
    .bind(job.id).first<{ state: string }>();
  if (currentJob?.state !== 'sending') return;
  const currentSubscriber = job.subscriber_id
    ? await env.DB.prepare('SELECT * FROM subscriber WHERE id=?').bind(job.subscriber_id).first<Subscriber>()
    : null;
  if (!(await deliveryAllowed(env, job, currentSubscriber))) return;
  try {
    const providerId = await send(env, job, email);
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE email_job SET state='accepted',provider_message_id=?,accepted_at=?,payload_json='{}',lease_until=NULL WHERE id=?",
      ).bind(providerId, now(), id),
      ...(subscriber && job.kind !== 'confirmation'
        ? [
            env.DB.prepare(
              'UPDATE subscriber SET last_marketing_sent_at=? WHERE id=? AND generation=?',
            ).bind(now(), subscriber.id, subscriber.generation),
          ]
        : []),
    ]);
  } catch (error) {
    const failure =
      error instanceof DeliveryError ? error : new DeliveryError('unknown', 'send_state_unknown');
    const state =
      failure.category === 'retryable' && job.attempts < 4
        ? 'pending'
        : failure.category === 'unknown'
          ? 'unknown'
          : 'failed';
    await env.DB.prepare(
      'UPDATE email_job SET state=?,error_code=?,available_at=?,lease_until=NULL WHERE id=?',
    )
      .bind(state, failure.code, now() + Math.min(3600000, 30000 * 2 ** job.attempts), id)
      .run();
  }
}
export async function drainLocal(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT id FROM email_job WHERE state IN ('pending','queued') AND available_at<=? ORDER BY created_at LIMIT 20",
  )
    .bind(now())
    .all<{ id: string }>();
  for (const job of results) await deliver(env, job.id);
}
export async function dispatch(env: Env) {
  await env.DB.prepare(
    "UPDATE email_job SET state='unknown',error_code='expired_sending_lease' WHERE state='sending' AND lease_until<?",
  )
    .bind(now())
    .run();
  // Queued jobs are republished after ten minutes; claims/terminal states handle duplicates.
  await env.DB.prepare(
    "UPDATE email_job SET state='pending' WHERE state='queued' AND lease_until<?",
  )
    .bind(now())
    .run();
  const { results } = await env.DB.prepare(
    "SELECT id FROM email_job WHERE state='pending' AND available_at<=? ORDER BY created_at LIMIT 50",
  )
    .bind(now())
    .all<{ id: string }>();
  for (const job of results) {
    await env.OUTBOUND.send({ id: job.id });
    await env.DB.prepare(
      "UPDATE email_job SET state='queued',lease_until=? WHERE id=? AND state='pending'",
    )
      .bind(now() + 600000, job.id)
      .run();
  }
}
