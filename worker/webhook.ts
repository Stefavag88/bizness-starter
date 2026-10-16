import { X509Certificate, createVerify } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import type { Env } from './types';
import { HttpError } from './security';
import { now } from './db';
interface Envelope {
  Type: string;
  Message: string;
  MessageId: string;
  Timestamp: string;
  TopicArn: string;
  Subject?: string;
  Token?: string;
  SubscribeURL?: string;
  Signature: string;
  SignatureVersion: string;
  SigningCertURL: string;
}
export async function sesWebhook(env: Env, input: unknown) {
  const e = input as Envelope;
  if (!e || e.TopicArn !== env.SNS_TOPIC_ARN || !env.SNS_TOPIC_ARN || e.SignatureVersion !== '2')
    throw new HttpError(403, 'Invalid event source.');
  if (!['Notification', 'SubscriptionConfirmation'].includes(e.Type))
    throw new HttpError(400, 'Unsupported notification.');
  const time = Date.parse(e.Timestamp);
  if (!Number.isFinite(time) || Math.abs(now() - time) > 3 * 86400000)
    throw new HttpError(403, 'Expired notification.');
  const url = new URL(e.SigningCertURL);
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
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new HttpError(503, 'Certificate unavailable.');
  const pem = await response.text();
  if (pem.length > 16384) throw new HttpError(403, 'Invalid certificate.');
  const certificate = new X509Certificate(pem);
  if (Date.parse(certificate.validFrom) > now() || Date.parse(certificate.validTo) < now())
    throw new HttpError(403, 'Expired certificate.');
  const fields =
    e.Type === 'Notification'
      ? ['Message', 'MessageId', ...(e.Subject ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
  const canonical = fields.map((key) => `${key}\n${String(e[key as keyof Envelope])}\n`).join('');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(canonical);
  if (!verifier.verify(certificate.publicKey, e.Signature, 'base64'))
    throw new HttpError(403, 'Invalid signature.');
  if (e.Type === 'SubscriptionConfirmation') {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY)
      throw new HttpError(503, 'SNS confirmation credentials missing.');
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.SES_REGION,
      service: 'sns',
    });
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
  const data = JSON.parse(e.Message);
  const type = data.eventType || data.notificationType;
  const messageId = data.mail?.messageId;
  if (typeof type !== 'string' || typeof messageId !== 'string')
    throw new HttpError(400, 'Invalid event payload.');
  const jobId = data.mail?.tags?.job_id?.[0];
  const permanent =
    type === 'Complaint' || (type === 'Bounce' && data.bounce?.bounceType === 'Permanent');
  await env.DB.batch([
    env.DB.prepare(
      'INSERT OR IGNORE INTO email_event(id,provider_message_id,event_type,received_at) VALUES(?,?,?,?)',
    ).bind(e.MessageId, messageId, type, now()),
    // SNS can arrive before send completion. Correlation tag works in that window.
    ...(permanent
      ? [
          env.DB.prepare(
            `UPDATE subscriber SET status='suppressed',generation=generation+1
   WHERE status!='suppressed' AND id IN (SELECT subscriber_id FROM email_job WHERE provider_message_id=? OR id=?)`,
          ).bind(messageId, jobId || ''),
        ]
      : []),
  ]);
}
