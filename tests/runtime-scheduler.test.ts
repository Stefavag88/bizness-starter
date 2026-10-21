import {it,expect,vi} from 'vitest';
import {observedEnvironment} from './helpers/metered-runtime';
import {runScheduled} from '../worker/scheduler';
vi.mock('cloudflare:workers',()=>({WorkflowEntrypoint:class{}}));
function seed(){const f=observedEnvironment('nurture');f.env.RUNTIME_BUDGET=JSON.stringify({dailyDispatchLimit:10,transactionalReserve:3});
 const s=f.database.prepare("INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,confirmed_at,consent_version)VALUES(?,?,?,'active',1,0,0,0,'v1')");
 for(let n=0;n<20;n++){s.run('s'+n,'s'+n+'@example.com','s'+n+'@example.com');f.database.prepare('INSERT INTO subscriber_interest VALUES(?,?)').run('s'+n,'updates');}
 for(let n=0;n<5;n++)f.database.prepare("INSERT INTO campaign(id,request_key,snapshot_json,snapshot_hash,interest_id,state,cutoff_at,created_at)VALUES(?,?,?,'h','updates','dispatching',1,0)").run('c'+n,'c'+n,'{"subject":"Hello","text":"Copy"}');
 for(let n=0;n<50;n++)f.database.prepare("INSERT INTO email_job(id,dedupe_key,kind,payload_json,available_at,created_at)VALUES(?,?,?,'{}',0,0)").run('j'+n,'j'+n,n%2?'inquiry':'welcome');
 for(let n=0;n<8;n++)f.database.prepare("INSERT INTO automation_enrollment(id,subscriber_id,generation,version,state)VALUES(?,'s0',1,?,?)").run('e'+n,'v'+n,n%2?'running':'pending');
 f.env.OUTBOUND={send:async()=>{}} as any;f.env.NURTURE={create:async()=>({status:async()=>({status:'waiting'})}),get:async()=>({status:async()=>({status:'waiting'})})} as any;return f;}
it('bounds every enabled lane together including daily admission, cleanup and telemetry',async()=>{const f=seed();try{
 const r=await runScheduled(f.env,Date.parse('2026-10-21T10:00:00Z'));
 expect(r.failures).toBe(0);expect(f.observed.statements).toBeLessThanOrEqual(40);expect(r.usage.attempted.sqlStatements).toBe(f.observed.statements);
 expect(f.database.prepare("SELECT COUNT(*) n FROM email_job WHERE state='queued'").get()?.n).toBeGreaterThan(0);
 expect(f.database.prepare("SELECT COUNT(*) n FROM automation_enrollment WHERE state='running'").get()?.n).toBeGreaterThan(4);
 expect(f.database.prepare('SELECT COUNT(*) n FROM runtime_usage_day').get()?.n).toBe(1);
 }finally{f.database.close();}});
it('keeps future work in D1 when the hosted daily allowance is unconfigured',async()=>{const f=seed();try{f.env.ENVIRONMENT='staging';delete f.env.RUNTIME_BUDGET;
 const r=await runScheduled(f.env,Date.parse('2026-10-21T10:01:00Z'));expect(r.failures).toBe(0);
 expect(f.database.prepare("SELECT COUNT(*) n FROM email_job WHERE state='queued'").get()?.n).toBe(0);
 }finally{f.database.close();}});

it('claims each cleanup window once and bounds deletions to a hundred rows',async()=>{const f=observedEnvironment('enquiries');try{
 for(let n=0;n<250;n++)f.database.prepare('INSERT INTO rate_limit VALUES(?,1,0)').run('r'+n);
 const at=Date.parse('2026-10-21T10:00:00Z');await runScheduled(f.env,at);await runScheduled(f.env,at);
 expect(f.database.prepare('SELECT COUNT(*) n FROM rate_limit').get()?.n).toBe(150);
 await runScheduled(f.env,at+900000);expect(f.database.prepare('SELECT COUNT(*) n FROM rate_limit').get()?.n).toBe(50);
 }finally{f.database.close();}});
