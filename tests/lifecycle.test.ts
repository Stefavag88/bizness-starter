import { describe, it, expect } from 'vitest';
import { environment } from './db';
import { subscribe, confirm, unsubscribe } from '../worker/newsletter';
import { drainLocal, eligibility } from '../worker/delivery';
import { scopedToken } from '../worker/security';
import { createCampaign, campaignAction, fanOut } from '../worker/campaigns';
import { jobStatement } from '../worker/db';
import type { Subscriber } from '../worker/types';
const signup = () => ({
  requestKey: crypto.randomUUID(),
  email: 'reader@example.com',
  consent: true,
  interest: 'updates',
  turnstileToken: 'local',
});
async function pending() {
  const setup = environment();
  await subscribe(setup.env, signup());
  await drainLocal(setup.env);
  const email = setup.database.prepare('SELECT text FROM email_capture').get()!;
  const token = String(email.text).match(/token=([0-9a-f]+)/)![1];
  return { ...setup, token };
}
describe('subscription lifecycle', () => {
  it('persists pending consent and captures confirmation without live email', async () => {
    const { database } = await pending();
    expect(database.prepare('SELECT status FROM subscriber').get()?.status).toBe('pending');
    expect(database.prepare('SELECT action FROM consent_record').get()?.action).toBe('requested');
  });
  it('confirms once and produces one welcome intent', async () => {
    const { env, database, token } = await pending();
    await confirm(env, token);
    await confirm(env, token);
    expect(database.prepare('SELECT status FROM subscriber').get()?.status).toBe('active');
    expect(database.prepare("SELECT COUNT(*) n FROM email_job WHERE kind='welcome'").get()?.n).toBe(
      1,
    );
    expect(
      database.prepare("SELECT COUNT(*) n FROM consent_record WHERE action='confirmed'").get()?.n,
    ).toBe(1);
  });
  it('withdraws without login and blocks already queued marketing', async () => {
    const { env, database, token } = await pending();
    await confirm(env, token);
    const s = database.prepare('SELECT * FROM subscriber').get() as unknown as Subscriber;
    const link = await scopedToken(env, s.id, s.generation, 'unsubscribe');
    await unsubscribe(env, link);
    await unsubscribe(env, link);
    await drainLocal(env);
    expect(database.prepare('SELECT status FROM subscriber').get()?.status).toBe('unsubscribed');
    expect(database.prepare("SELECT state FROM email_job WHERE kind='welcome'").get()?.state).toBe(
      'skipped',
    );
    await expect(confirm(env, token)).rejects.toThrow();
  });
  it('requires fresh confirmation after withdrawal and rejects old unsubscribe generation', async () => {
    const { env, database, token } = await pending();
    await confirm(env, token);
    const s = database.prepare('SELECT * FROM subscriber').get() as unknown as Subscriber;
    const link = await scopedToken(env, s.id, s.generation, 'unsubscribe');
    await unsubscribe(env, link);
    database.prepare('UPDATE subscriber SET last_requested_at=0').run();
    await subscribe(env, signup());
    await unsubscribe(env, link);
    expect(database.prepare('SELECT status FROM subscriber').get()?.status).toBe('pending');
  });
  it('does not add interests or restart active subscriptions', async () => {
    const { env, database, token } = await pending();
    await confirm(env, token);
    await subscribe(env, signup());
    expect(database.prepare('SELECT COUNT(*) n FROM action_token').get()?.n).toBe(1);
  });
  it('suppression prevents reactivation', async () => {
    const { env, database, token } = await pending();
    database.prepare("UPDATE subscriber SET status='suppressed'").run();
    await subscribe(env, signup());
    await expect(confirm(env, token)).rejects.toThrow();
  });
  it('expired tokens cannot confirm', async () => {
    const { env, database, token } = await pending();
    database.prepare('UPDATE action_token SET expires_at=0').run();
    await expect(confirm(env, token)).rejects.toThrow();
  });
});
describe('delivery invariants', () => {
  it('duplicate processing captures one email', async () => {
    const { env, database } = environment();
    await jobStatement(env, 'inquiry:one', 'inquiry', {
      name: 'Example',
      email: 'sender@example.com',
      message: 'A useful enquiry message',
    }).run();
    await drainLocal(env);
    await drainLocal(env);
    expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(1);
  });
  it('unknown jobs are never automatically retried', async () => {
    const { env, database } = environment();
    await jobStatement(env, 'one', 'inquiry', {}).run();
    database.prepare("UPDATE email_job SET state='unknown'").run();
    await drainLocal(env);
    expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(0);
  });
  it('marketing needs current generation, active state and enablement', () => {
    const s = { generation: 2, status: 'active' } as Subscriber;
    expect(eligibility({ generation: 1, kind: 'campaign' }, s, true)).toBe(false);
    expect(eligibility({ generation: 2, kind: 'campaign' }, s, false)).toBe(false);
    expect(eligibility({ generation: 2, kind: 'campaign' }, s, true)).toBe(true);
  });
});
describe('campaign review', () => {
  it('cannot send a draft or stale snapshot; repeated dispatch creates one recipient job', async () => {
    const { env, database, token } = await pending();
    await confirm(env, token);
    const campaign = (await createCampaign(env, {
      requestKey: crypto.randomUUID(),
      subject: 'Useful note',
      intro: 'Some practical guidance',
      interest: 'updates',
      articleId: 'sample-article',
    }))!;
    await expect(
      campaignAction(
        env,
        campaign.id,
        'send',
        { hash: campaign.snapshot_hash, confirmation: 'SEND' },
        'owner',
      ),
    ).rejects.toThrow();
    await expect(
      campaignAction(env, campaign.id, 'approve', { hash: 'stale' }, 'owner'),
    ).rejects.toThrow();
    await campaignAction(env, campaign.id, 'approve', { hash: campaign.snapshot_hash }, 'owner');
    await campaignAction(
      env,
      campaign.id,
      'send',
      { hash: campaign.snapshot_hash, confirmation: 'SEND' },
      'owner',
    );
    await fanOut(env);
    await fanOut(env);
    expect(
      database.prepare("SELECT COUNT(*) n FROM email_job WHERE kind='campaign'").get()?.n,
    ).toBe(1);
  });
  it('tests cannot target a nonallowlisted address', async () => {
    const { env } = environment();
    const c = (await createCampaign(env, {
      requestKey: crypto.randomUUID(),
      subject: 'Note',
      intro: 'Guidance',
      interest: 'updates',
    }))!;
    await expect(
      campaignAction(env, c.id, 'test', { to: 'stranger@example.com' }, 'owner'),
    ).rejects.toThrow();
  });
});
