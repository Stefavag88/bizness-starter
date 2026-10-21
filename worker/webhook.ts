import {chargeExternal} from './budget';
import { X509Certificate, createVerify } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import { z } from 'zod';
import type { Env } from './types';
import { HttpError } from './security';
import { now } from './db';
const envelopeSchema = z.object({
  Type: z.string().min(1).max(64),
  Message: z.string().min(1).max(262144),
  MessageId: z.string().min(1).max(2048),
  Timestamp: z.string().min(1).max(128),
  TopicArn: z.string().min(1).max(2048),
  Subject: z.string().max(2048).optional(),
  Token: z.string().min(1).max(8192).optional(),
  SubscribeURL: z.string().min(1).max(8192).optional(),
  Signature: z.string().min(1).max(8192),
  SignatureVersion: z.string().min(1).max(16),
  SigningCertURL: z.string().min(1).max(2048),
});
const payloadSchema = z.object({
  eventType: z.string().min(1).max(128).optional(),
  notificationType: z.string().min(1).max(128).optional(),
  mail: z.object({
    messageId: z.string().min(1).max(2048),
    tags: z.object({ job_id: z.array(z.string().min(1).max(2048)).min(1).max(100).optional() }).optional(),
  }),
  bounce: z.object({ bounceType: z.string().max(128).optional() }).optional(),
});
export async function sesWebhook(env: Env, input: unknown) {
  const parsed = envelopeSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(400, 'Invalid notification envelope.');
  const e = parsed.data;
  if (e.Type === 'SubscriptionConfirmation' && (!e.Token || !e.SubscribeURL))
    throw new HttpError(400, 'Invalid notification envelope.');
  if (e.TopicArn !== env.SNS_TOPIC_ARN || !env.SNS_TOPIC_ARN || e.SignatureVersion !== '2')
    throw new HttpError(403, 'Invalid event source.');
  if (!['Notification', 'SubscriptionConfirmation'].includes(e.Type))
    throw new HttpError(400, 'Unsupported notification.');
  const time = Date.parse(e.Timestamp);
  if (!Number.isFinite(time) || Math.abs(now() - time) > 3 * 86400000)
    throw new HttpError(403, 'Expired notification.');
  let url: URL;
  try {
    url = new URL(e.SigningCertURL);
  } catch {
    throw new HttpError(403, 'Invalid signing certificate.');
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== `sns.${env.SES_REGION}.amazonaws.com` ||
    url.port ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    !/^\/SimpleNotificationService-[a-zA-Z0-9_-]+\.pem$/.test(url.pathname)
  )
    throw new HttpError(403, 'Invalid signing certificate.');
  let pem: string;
  try {
    chargeExternal(env);
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new HttpError(503, 'Certificate unavailable.');
    pem = await response.text();
  } catch {
    throw new HttpError(503, 'Certificate unavailable.');
  }
  if (pem.length > 16384) throw new HttpError(403, 'Invalid certificate.');
  let certificate: X509Certificate;
  try {
    certificate = new X509Certificate(pem);
  } catch {
    throw new HttpError(403, 'Invalid certificate.');
  }
  if (Date.parse(certificate.validFrom) > now() || Date.parse(certificate.validTo) < now())
    throw new HttpError(403, 'Expired certificate.');
  const fields =
    e.Type === 'Notification'
      ? ['Message', 'MessageId', ...(e.Subject ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
  const canonical = fields.map((key) => `${key}\n${String(e[key as keyof typeof e])}\n`).join('');
  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(canonical);
    if (!verifier.verify(certificate.publicKey, e.Signature, 'base64'))
      throw new Error('Signature mismatch');
  } catch {
    throw new HttpError(403, 'Invalid signature.');
  }
  if (e.Type === 'SubscriptionConfirmation') {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY)
      throw new HttpError(503, 'SNS confirmation credentials missing.');
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.SES_REGION,
      service: 'sns',
      retries: 0,
    });
    chargeExternal(env);
    const confirmed = await aws.fetch(`https://sns.${env.SES_REGION}.amazonaws.com/`, {
      method: 'POST',
      body: new URLSearchParams({
        Action: 'ConfirmSubscription',
        Version: '2010-03-31',
        TopicArn: e.TopicArn,
        Token: e.Token!,
      }),
    });
    if (!confirmed.ok) throw new HttpError(503, 'SNS confirmation failed.');
    return;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(e.Message);
  } catch {
    throw new HttpError(400, 'Invalid event payload.');
  }
  const parsedPayload = payloadSchema.safeParse(payload);
  if (!parsedPayload.success) throw new HttpError(400, 'Invalid event payload.');
  const data = parsedPayload.data;
  const type = data.eventType || data.notificationType;
  const messageId = data.mail?.messageId;
  if (typeof type !== 'string' || typeof messageId !== 'string')
    throw new HttpError(400, 'Invalid event payload.');
  const jobId = data.mail?.tags?.job_id?.[0];
  const permanent =
    type === 'Complaint' || (type === 'Bounce' && data.bounce?.bounceType === 'Permanent');
  await env.DB.batch([
    // D1 batch is transactional: check replay before suppression, then record the event.
    // SNS can arrive before send completion. Correlation tag works in that window.
    ...(permanent
      ? [
          env.DB.prepare(
            `UPDATE subscriber SET status='suppressed',generation=generation+1
   WHERE status!='suppressed' AND NOT EXISTS (SELECT 1 FROM email_event WHERE id=?)
   AND id IN (SELECT subscriber_id FROM email_job WHERE provider_message_id=? OR id=?)`,
          ).bind(e.MessageId, messageId, jobId || ''),
        ]
      : []),
    env.DB.prepare(
      'INSERT OR IGNORE INTO email_event(id,provider_message_id,event_type,received_at) VALUES(?,?,?,?)',
    ).bind(e.MessageId, messageId, type, now()),
  ]);
}
