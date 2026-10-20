import { readFileSync } from 'node:fs';
import { createSign, X509Certificate } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from './db';
import { sesWebhook } from '../worker/webhook';
import { html } from '../worker/pages';

// Synthetic local-only signing identity; never a trusted provider certificate.
const pem = readFileSync('tests/fixtures/sns/test-cert.pem', 'utf8');
const key = readFileSync('tests/fixtures/sns/test-key.pem', 'utf8');
const certificate = new X509Certificate(pem);
const instant = Date.parse(certificate.validFrom) + 86400000;
const topic = 'arn:aws:sns:eu-west-1:123456789012:feedback';
function envelope(message: unknown = { eventType: 'Delivery', mail: { messageId: 'provider-one' } }, overrides = {}) {
  const e = {
    Type: 'Notification', Message: JSON.stringify(message), MessageId: 'sns-one',
    Timestamp: new Date(instant).toISOString(), TopicArn: topic,
    SignatureVersion: '2', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem',
    Signature: '', ...overrides,
  };
  const fields = e.Type === 'Notification'
    ? ['Message', 'MessageId', ...('Subject' in e ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
    : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
  const canonical = fields.map(k => `${k}\n${(e as Record<string, unknown>)[k]}\n`).join('');
  e.Signature = createSign('RSA-SHA256').update(canonical).sign(key, 'base64');
  return e;
}
function setup() {
  const result = environment();
  result.env.SNS_TOPIC_ARN = topic;
  result.env.SES_REGION = 'eu-west-1';
  return result;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(instant);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(pem)));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('SNS signed feedback boundary', () => {
  it('accepts a real signed notification and records it once', async () => {
    const { env, database } = setup();
    await sesWebhook(env, envelope());
    await sesWebhook(env, envelope());
    expect(database.prepare('SELECT COUNT(*) n FROM email_event').get()?.n).toBe(1);
  });
  it.each([null, [], {}, { TopicArn: topic, SignatureVersion: '2', Type: 'Notification' }])('rejects malformed envelope shapes with 400: %j', async input => {
    await expect(sesWebhook(setup().env, input)).rejects.toMatchObject({ status: 400 });
  });
  it.each([{ Message: 4 }, { Signature: {} }, { MessageId: '' }, { Subject: [] }, { Token: [] }, { Message: 'x'.repeat(262145) }])('rejects invalid envelope field types and bounds, case %#', async overrides => {
    await expect(sesWebhook(setup().env, { ...envelope(), ...overrides })).rejects.toMatchObject({ status: 400 });
  });
  it.each([null, [], {}, { eventType: 'Complaint', mail: [] }, { eventType: 'Complaint', mail: { messageId: 'p', tags: { job_id: 'bad' } } }, { eventType: 'Bounce', mail: { messageId: 'p' }, bounce: [] }])('rejects invalid signed inner shapes: %j', async message => {
    await expect(sesWebhook(setup().env, envelope(message))).rejects.toMatchObject({ status: 400 });
  });
  it('classifies signed invalid JSON as 400', async () => {
    await expect(sesWebhook(setup().env, envelope({}, { Message: '{' }))).rejects.toMatchObject({ status: 400 });
  });
  it.each([
    { TopicArn: topic + '-other' }, { SignatureVersion: '1' },
    { Timestamp: new Date(instant - 4 * 86400000).toISOString() },
    { SigningCertURL: 'invalid-url' },
    { SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-test.pem' },
    { SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem?query=1' },
    { SigningCertURL: 'https://user@sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem' },
  ])('rejects untrusted source/expiry/certificate locations: %j', async overrides => {
    await expect(sesWebhook(setup().env, envelope({}, overrides))).rejects.toMatchObject({ status: 403 });
  });
  it('accepts signed Subject and legacy notificationType fields', async () => {
    const { env, database } = setup();
    await sesWebhook(env, envelope({ notificationType: 'Delivery', mail: { messageId: 'legacy' } }, { Subject: 'Feedback' }));
    expect(database.prepare('SELECT provider_message_id FROM email_event').get()?.provider_message_id).toBe('legacy');
  });
  it('validates confirmation fields before certificate work', async () => {
    await expect(sesWebhook(setup().env, envelope({}, { Type: 'SubscriptionConfirmation' }))).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('verifies subscription confirmation signatures before checking confirmation credentials', async () => {
    const signed = envelope({}, { Type: 'SubscriptionConfirmation', Token: 'token', SubscribeURL: 'https://example.com/confirmation' });
    await expect(sesWebhook(setup().env, signed)).rejects.toMatchObject({ status: 503, message: 'SNS confirmation credentials missing.' });
  });
  it('rejects a certificate which is not yet valid', async () => {
    vi.setSystemTime(Date.parse(certificate.validFrom) - 86400000);
    await expect(sesWebhook(setup().env, envelope({}, { Timestamp: new Date(Date.now()).toISOString() }))).rejects.toMatchObject({ status: 403 });
  });
  it('keeps upstream certificate HTTP failures retryable', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 503 }));
    await expect(sesWebhook(setup().env, envelope())).rejects.toMatchObject({ status: 503 });
  });
  it('rejects an invalid PEM with 403', async () => {
    vi.stubGlobal('fetch', async () => new Response('invalid pem'));
    await expect(sesWebhook(setup().env, envelope())).rejects.toMatchObject({ status: 403 });
  });
  it('rejects an expired certificate with 403', async () => {
    vi.setSystemTime(Date.parse(certificate.validTo) + 86400000);
    await expect(sesWebhook(setup().env, envelope({}, { Timestamp: new Date(Date.now()).toISOString() }))).rejects.toMatchObject({ status: 403 });
  });
  it('rejects a tampered signature with 403', async () => {
    await expect(sesWebhook(setup().env, { ...envelope(), Message: '{}' })).rejects.toMatchObject({ status: 403 });
  });
  it('keeps network failures retryable as 503', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('network unavailable'); });
    await expect(sesWebhook(setup().env, envelope())).rejects.toMatchObject({ status: 503 });
  });
  it('rolls suppression back if event recording fails', async () => {
    const { env, database } = setup();
    database.prepare(`INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,consent_version) VALUES('s','reader@example.com','reader@example.com','active',1,0,0,'1')`).run();
    database.prepare(`INSERT INTO email_job(id,dedupe_key,kind,subscriber_id,generation,payload_json,provider_message_id,available_at,created_at) VALUES('job','job','welcome','s',1,'{}','provider-one',0,0)`).run();
    database.exec(`CREATE TRIGGER reject_event BEFORE INSERT ON email_event BEGIN SELECT RAISE(ABORT, 'event storage failed'); END`);
    await expect(sesWebhook(env, envelope({ eventType: 'Complaint', mail: { messageId: 'provider-one' } }))).rejects.toThrow('event storage failed');
    expect(database.prepare('SELECT status,generation FROM subscriber').get()).toEqual({ status: 'active', generation: 1 });
    expect(database.prepare('SELECT COUNT(*) n FROM email_event').get()?.n).toBe(0);
    database.exec('DROP TRIGGER reject_event');
    await sesWebhook(env, envelope({ eventType: 'Complaint', mail: { messageId: 'provider-one' } }));
    expect(database.prepare('SELECT status FROM subscriber').get()?.status).toBe('suppressed');
  });
  it('records transient bounces without suppressing', async () => {
    const { env, database } = setup();
    database.prepare(`INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,consent_version) VALUES('s','reader@example.com','reader@example.com','active',1,0,0,'1')`).run();
    database.prepare(`INSERT INTO email_job(id,dedupe_key,kind,subscriber_id,generation,payload_json,provider_message_id,available_at,created_at) VALUES('job','job','welcome','s',1,'{}','provider-one',0,0)`).run();
    await sesWebhook(env, envelope({ eventType: 'Bounce', mail: { messageId: 'provider-one' }, bounce: { bounceType: 'Transient' } }));
    expect(database.prepare('SELECT status,generation FROM subscriber').get()).toEqual({ status: 'active', generation: 1 });
    expect(database.prepare('SELECT COUNT(*) n FROM email_event').get()?.n).toBe(1);
  });
  it.each(['Complaint', 'Bounce'])('suppresses old-generation %s once, including tag correlation and replay after reset', async type => {
    const { env, database } = setup();
    database.prepare(`INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,consent_version) VALUES('s','reader@example.com','reader@example.com','active',3,0,0,'1')`).run();
    database.prepare(`INSERT INTO email_job(id,dedupe_key,kind,subscriber_id,generation,payload_json,available_at,created_at) VALUES('job','job','welcome','s',1,'{}',0,0)`).run();
    const event = envelope({ eventType: type, mail: { messageId: 'provider-one', tags: { job_id: ['job'] } }, bounce: { bounceType: 'Permanent' } });
    await sesWebhook(env, event);
    await sesWebhook(env, event);
    expect(database.prepare('SELECT status,generation FROM subscriber').get()).toEqual({ status: 'suppressed', generation: 4 });
    // Simulates a future operator repair; an already processed event must have no new effect.
    database.prepare("UPDATE subscriber SET status='active'").run();
    await sesWebhook(env, event);
    expect(database.prepare('SELECT status,generation FROM subscriber').get()).toEqual({ status: 'active', generation: 4 });
    expect(database.prepare('SELECT COUNT(*) n FROM email_event').get()?.n).toBe(1);
  });
});
it('sets nosniff on generated HTML', () => {
  expect(html('Title', '<p>Body</p>').headers.get('X-Content-Type-Options')).toBe('nosniff');
});
