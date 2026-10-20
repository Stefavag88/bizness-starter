import { it, expect, vi } from 'vitest';
import { environment } from './db';
import { jobStatement } from '../worker/db';
import { deliver, dispatch } from '../worker/delivery';
import { startEnrollments, WelcomeWorkflow } from '../worker/workflow';
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
vi.mock('cloudflare:workers', () => ({ WorkflowEntrypoint: class {
  env: unknown;
  constructor(_ctx: unknown, env: unknown) { this.env = env; }
} }));
function setup(state = 'pending') {
  const result = environment('nurture');
  result.database.prepare("INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,consent_version) VALUES('s','reader@example.com','reader@example.com','active',1,0,0,'v1')").run();
  result.database.prepare("INSERT INTO automation_enrollment(id,subscriber_id,generation,version,state) VALUES('e','s',1,'v1',?)").run(state);
  return result;
}
const stateOf = (db: ReturnType<typeof setup>['database']) => db.prepare('SELECT state FROM automation_enrollment').get()?.state;
function binding(status: InstanceStatus['status'], failCreate = true, onStatus = () => {}) {
  const instance = { status: async () => { onStatus(); return { status }; } };
  return { create: async () => { if (failCreate) throw Error('already exists'); return instance; }, get: async () => instance } as unknown as Workflow;
}
it.each(['pending', 'running'])('reconciles inactive or stale %s enrollment', async state => {
  for (const update of ["status='suppressed'", 'generation=2']) {
    const { env, database } = setup(state);
    database.exec(`UPDATE subscriber SET ${update}`);
    env.NURTURE = binding('running');
    await startEnrollments(env);
    expect(stateOf(database)).toBe('cancelled');
  }
});
it.each(['pending', 'running'])('maps terminal and live platform states for %s', async state => {
  for (const [status, expected] of [['complete','completed'],['errored','failed'],['terminated','cancelled'],['queued','running'],['running','running'],['waiting','running'],['paused','running'],['waitingForPause','running'],['rollingBack','running']] as const) {
    const { env, database } = setup(state);
    env.NURTURE = binding(status);
    await startEnrollments(env);
    expect(stateOf(database), status).toBe(expected);
  }
});
it('keeps unknown platform state unchanged and surfaces error', async () => {
  const { env, database } = setup(); env.NURTURE = binding('unknown');
  await expect(startEnrollments(env)).rejects.toThrow(); expect(stateOf(database)).toBe('pending');
});
it.each(['cancelled', 'completed', 'failed'])('does not resurrect concurrent %s transition', async state => {
  const { env, database } = setup();
  env.NURTURE = binding('running', false, () => { database.prepare('UPDATE automation_enrollment SET state=?').run(state); });
  await startEnrollments(env); expect(stateOf(database)).toBe(state);
});
it('continues later reconciliation after platform failure', async () => {
  const { env, database } = setup('running');
  database.prepare("INSERT INTO automation_enrollment VALUES('f','s',1,'v2','running')").run();
  env.NURTURE = { get: async (id: string) => { if (id === 'e') throw Error('platform unavailable'); return { status: async () => ({ status: 'complete' }) }; } } as unknown as Workflow;
  await expect(startEnrollments(env)).rejects.toThrow();
  expect(database.prepare("SELECT state FROM automation_enrollment WHERE id='f'").get()?.state).toBe('completed');
});
it.each(['suppressed', 'stale', 'missing', 'unsubscribed'])('workflow exit reconciles %s subscriber', async status => {
  const { env, database } = setup('running');
  if (status === 'stale') database.prepare('UPDATE subscriber SET generation=2').run();
  else if (status === 'missing') { database.exec('PRAGMA foreign_keys=OFF'); database.prepare('DELETE FROM subscriber').run(); }
  else database.prepare('UPDATE subscriber SET status=?').run(status);
  const step = { sleep: async () => {}, do: async (_name: string, callback: () => Promise<unknown>) => callback() } as unknown as WorkflowStep;
  await new WelcomeWorkflow({} as ExecutionContext, env).run({ payload: { subscriberId: 's', generation: 1 } } as WorkflowEvent<{ subscriberId: string; generation: number }>, step);
  expect(stateOf(database)).toBe('cancelled'); expect(database.prepare('SELECT COUNT(*) n FROM email_job').get()?.n).toBe(0);
});
it('retains disabled marketing payload pending and resumes locally', async () => {
  const { env, database } = setup(); env.ENVIRONMENT = 'staging';
  await jobStatement(env, 'welcome', 'welcome', { subject: 'Hello', text: 'Retained copy' }, 's', 1).run();
  const id = String(database.prepare('SELECT id FROM email_job').get()?.id); await deliver(env, id);
  const paused = database.prepare('SELECT * FROM email_job').get()!;
  expect(paused.state).toBe('pending'); expect(JSON.parse(String(paused.payload_json)).text).toBe('Retained copy'); expect(paused.lease_until).toBeNull();
  env.ENVIRONMENT = 'local'; database.prepare('UPDATE email_job SET available_at=0').run(); await deliver(env, id);
  expect(database.prepare('SELECT state FROM email_job').get()?.state).toBe('accepted'); expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(1);
});
it.each(['status', 'generation', 'enablement'])('rechecks %s after initial lookup', async change => {
  const { env, database } = setup();
  await jobStatement(env, 'welcome', 'welcome', { subject: 'Hello', text: 'Copy' }, 's', 1).run();
  const originalPrepare = env.DB.prepare.bind(env.DB); let intercepted = false;
  env.DB = { ...env.DB, prepare(sql: string) {
    const statement = originalPrepare(sql);
    if (sql === 'SELECT * FROM subscriber WHERE id=?' && !intercepted) {
      intercepted = true; const first = statement.first.bind(statement);
      statement.first = (async (...args: Parameters<typeof first>) => {
        const result = await first(...args);
        if (change === 'status') database.prepare("UPDATE subscriber SET status='unsubscribed'").run();
        else if (change === 'generation') database.prepare('UPDATE subscriber SET generation=2').run();
        else { env.ENVIRONMENT = 'staging'; env.TOKEN_SECRET = 'test-secret'; }
        return result;
      }) as typeof statement.first;
    }
    return statement;
  } } as D1Database;
  await deliver(env, String(database.prepare('SELECT id FROM email_job').get()?.id));
  expect(database.prepare('SELECT state FROM email_job').get()?.state).toBe(change === 'enablement' ? 'pending' : 'skipped'); expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(0);
});
it('keeps unknown jobs quarantined through dispatch and direct delivery', async () => {
  const { env, database } = setup(); await jobStatement(env, 'unknown', 'welcome', { text: 'Retain evidence' }, 's', 1).run();
  database.prepare("UPDATE email_job SET state='unknown'").run();
  env.OUTBOUND = { send: async () => { throw Error('unknown job dispatched'); } } as unknown as typeof env.OUTBOUND;
  await dispatch(env); await deliver(env, String(database.prepare('SELECT id FROM email_job').get()?.id));
  expect(database.prepare('SELECT state,payload_json FROM email_job').get()).toMatchObject({ state: 'unknown', payload_json: '{"text":"Retain evidence"}' });
});
it('does not let early running records starve later pending enrollments', async () => {
  const { env, database } = setup('running');
  for (let index = 0; index < 55; index++) database.prepare("INSERT INTO automation_enrollment VALUES(?, 's', 1, ?, 'running')").run(`r-${index}`, `v-${index}`);
  database.prepare("INSERT INTO automation_enrollment VALUES('last','s',1,'last','pending')").run();
  env.NURTURE = binding('waiting', false);
  await startEnrollments(env);
  expect(database.prepare("SELECT state FROM automation_enrollment WHERE id='last'").get()?.state).toBe('running');
});
it('narrows the enablement race after campaign lookup and token composition', async () => {
  const { env, database } = setup();
  database.prepare("INSERT INTO campaign(id,request_key,snapshot_json,snapshot_hash,interest_id,state,created_at) VALUES('c','c','{}','h','updates','dispatching',0)").run();
  await jobStatement(env, 'campaign', 'campaign', { subject: 'Hello', text: 'Copy' }, 's', 1, 'c').run();
  const prepare = env.DB.prepare.bind(env.DB);
  env.DB = { ...env.DB, prepare(sql: string) {
    const statement = prepare(sql);
    if (sql === 'SELECT * FROM campaign WHERE id=?') {
      const first = statement.first.bind(statement);
      statement.first = (async (...args: Parameters<typeof first>) => {
        const result = await first(...args); env.ENVIRONMENT = 'staging'; env.TOKEN_SECRET = 'test-secret'; return result;
      }) as typeof statement.first;
    }
    return statement;
  } } as D1Database;
  await deliver(env, String(database.prepare('SELECT id FROM email_job').get()?.id));
  expect(database.prepare('SELECT state,payload_json FROM email_job').get()).toMatchObject({ state: 'pending', payload_json: '{"subject":"Hello","text":"Copy"}' });
  expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(0);
});
it('does not overwrite cancellation when the workflow exits', async () => {
  const { env, database } = setup('cancelled');
  database.prepare("UPDATE subscriber SET status='unsubscribed'").run();
  const step = { sleep: async () => {}, do: async (_name: string, callback: () => Promise<unknown>) => callback() } as unknown as WorkflowStep;
  await new WelcomeWorkflow({} as ExecutionContext, env).run({ payload: { subscriberId: 's', generation: 1 } } as WorkflowEvent<{ subscriberId: string; generation: number }>, step);
  expect(stateOf(database)).toBe('cancelled');
});
it('records immediate workflow completion before the pending enrollment is marked running', async () => {
  const { env, database } = setup(); env.NURTURE = binding('complete', false);
  await startEnrollments(env); expect(stateOf(database)).toBe('completed');
});
it('quarantines acceptance when persisting the result fails', async () => {
  const { env, database } = setup();
  await jobStatement(env, 'one', 'welcome', { text: 'Copy' }, 's', 1).run();
  env.DB.batch = async () => { throw Error('database unavailable after acceptance'); };
  const id = String(database.prepare('SELECT id FROM email_job').get()?.id);
  await deliver(env, id); await deliver(env, id);
  expect(database.prepare('SELECT state,error_code FROM email_job').get()).toMatchObject({ state: 'unknown', error_code: 'send_state_unknown' });
  expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(1);
});
it('does not submit a job quarantined while composing the message', async () => {
  const { env, database } = setup();
  await jobStatement(env, 'one', 'welcome', { text: 'Copy' }, 's', 1).run();
  const prepare = env.DB.prepare.bind(env.DB); let firstLookup = true;
  env.DB = { ...env.DB, prepare(sql: string) {
    const statement = prepare(sql);
    if (sql === 'SELECT * FROM subscriber WHERE id=?' && firstLookup) {
      firstLookup = false; const first = statement.first.bind(statement);
      statement.first = (async (...args: Parameters<typeof first>) => {
        const result = await first(...args); database.prepare("UPDATE email_job SET state='unknown'").run(); return result;
      }) as typeof statement.first;
    }
    return statement;
  } } as D1Database;
  await deliver(env, String(database.prepare('SELECT id FROM email_job').get()?.id));
  expect(database.prepare('SELECT state FROM email_job').get()?.state).toBe('unknown');
  expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(0);
});
it.each(['frequency', 'campaign'])('does not reopen a quarantined job through %s deferral', async reason => {
  const { env, database } = setup();
  if (reason === 'frequency') database.prepare('UPDATE subscriber SET last_marketing_sent_at=?').run(Date.now());
  else database.prepare("INSERT INTO campaign(id,request_key,snapshot_json,snapshot_hash,interest_id,state,created_at) VALUES('c','c','{}','h','updates','paused',0)").run();
  await jobStatement(env, 'one', 'welcome', { text: 'Copy' }, 's', 1, reason === 'campaign' ? 'c' : null).run();
  const prepare = env.DB.prepare.bind(env.DB); let firstLookup = true;
  env.DB = { ...env.DB, prepare(sql: string) {
    const statement = prepare(sql);
    if (sql === 'SELECT * FROM subscriber WHERE id=?' && firstLookup) {
      firstLookup = false; const first = statement.first.bind(statement);
      statement.first = (async (...args: Parameters<typeof first>) => {
        const result = await first(...args); database.prepare("UPDATE email_job SET state='unknown'").run(); return result;
      }) as typeof statement.first;
    }
    return statement;
  } } as D1Database;
  await deliver(env, String(database.prepare('SELECT id FROM email_job').get()?.id));
  expect(database.prepare('SELECT state FROM email_job').get()?.state).toBe('unknown');
});

it('bounds and fairly rotates hundreds of waiting workflows while starting pending work', async()=>{
 const {env,database}=setup('running');
 for(let index=0;index<350;index++)database.prepare("INSERT INTO automation_enrollment VALUES(?, 's',1,?,'running')").run(`many-${index}`,`many-${index}`);
 database.prepare("INSERT INTO automation_enrollment VALUES('new-pending','s',1,'new-pending','pending')").run();
 const lookedUp:string[]=[];let created=0;
 env.NURTURE={get:async(id:string)=>{lookedUp.push(id);return {status:async()=>({status:'waiting'})};},create:async()=>{created++;return {status:async()=>({status:'waiting'})};}} as any;
 await startEnrollments(env);const first=[...lookedUp];
 expect(first.length).toBeLessThanOrEqual(5);expect(created).toBe(1);
 lookedUp.length=0;await startEnrollments(env);
 expect(lookedUp.length).toBeLessThanOrEqual(5);
 expect(lookedUp.some(id=>first.includes(id))).toBe(false);
 database.close();
});
