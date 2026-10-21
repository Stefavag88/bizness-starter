import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {unstable_dev} from 'wrangler';
// Unique in-memory resources and a loopback-only diagnostic wrapper. No cloud commands.
const directory=resolve('.generated/evidence/runtime-budgets');mkdirSync(directory,{recursive:true});
const owned=mkdtempSync(resolve('.generated/runtime-budget-'));const token=randomUUID(),report={provenance:'local Wrangler/workerd D1 metadata, not Cloudflare billing or CPU qualification',profiles:[],errors:[],cleanedUp:false};
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
let server;
try{
 for(const profile of ['enquiries','newsletter','nurture']){
  const identity='budget-'+profile+'-'+randomUUID().slice(0,8),entry=resolve('scripts/runtime-budget-fixture.ts');
  const config={name:identity,main:entry,compatibility_date:'2026-10-07',compatibility_flags:['nodejs_compat'],vars:{FIXTURE_TOKEN:token,ENVIRONMENT:'local',PROFILE:profile,SENDING_ENABLED:'false',MARKETING_ENABLED:'false',SITE_URL:'https://example.com',NOTIFICATION_EMAIL:'owner@example.com',TOKEN_SECRET:'owned-local-runtime-fixture-secret',RUNTIME_BUDGET:JSON.stringify({dailyDispatchLimit:6,transactionalReserve:2})},d1_databases:[{binding:'DB',database_name:identity,database_id:randomUUID()}],queues:{producers:[{binding:'OUTBOUND',queue:identity}],consumers:[{queue:identity,max_batch_size:1,max_batch_timeout:1,max_concurrency:1}]}};
  const configPath=join(owned,profile+'.json');writeFileSync(configPath,JSON.stringify(config));
  server=await unstable_dev(entry,{config:configPath,port:0,inspectorPort:0,local:true,persist:false,ip:'127.0.0.1',logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
  const request=async(path,data)=>{const r=await server.fetch('http://127.0.0.1:'+server.port+path,{method:data?'POST':'GET',headers:{'x-fixture-token':token,'content-type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});assert.equal(r.status,200,path+' status');return r.json();};
  const seed=statements=>request('/seed',{statements}),query=async sql=>(await request('/query',{sql})).results;
  for(const file of readdirSync('migrations').filter(n=>/^\d{4}_.*\.sql$/.test(n)).sort()){
   const sql=readFileSync('migrations/'+file,'utf8').replace(/^--.*$/gm,'');await seed(sql.split(';').map(s=>s.trim()).filter(s=>s&&!s.startsWith('PRAGMA')));
  }
  await seed(['CREATE TABLE fixture_queue_trace(json TEXT NOT NULL)']);
  const at=Date.now(),day=Math.floor(at/86400000)*86400000,ticks=[];
  await seed(Array.from({length:10},(_,i)=>`INSERT INTO email_job(id,dedupe_key,kind,payload_json,available_at,created_at) VALUES('j${i}','j${i}','inquiry','{"name":"Fixture","email":"fixture@example.com","message":"Local only"}',0,0)`));
  if(profile!=='enquiries'){
   for(let i=0;i<8;i++)await seed([`INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,confirmed_at,consent_version) VALUES('s${i}','s${i}@example.com','s${i}@example.com','active',1,0,0,0,'v1')`,`INSERT INTO subscriber_interest VALUES('s${i}','updates')`]);
   await seed([`INSERT INTO campaign(id,request_key,snapshot_json,snapshot_hash,approval_hash,interest_id,state,cutoff_at,created_at) VALUES('c','c','{"subject":"Local","text":"Capture only"}','h','h','updates','dispatching',${at},0)`]);
  }
  if(profile==='nurture')await seed(["INSERT INTO automation_enrollment(id,subscriber_id,generation,version,state) VALUES('enrollment','s0',1,'fixture','pending')"]);
  const tick=async time=>{const t=await request('/tick',{at:time});ticks.push(t);assert.equal(t.result.failures,0);assert.ok(t.trace.statements<=40);assert.equal(t.trace.statements,t.result.usage.attempted.sqlStatements);assert.ok(t.result.usage.attempted.externalCalls<=40);assert.ok(t.result.usage.attempted.internalCalls<=800);await wait(async()=>Number((await query("SELECT COUNT(*) n FROM email_job WHERE state IN ('queued','sending')"))[0].n)===0);return t;};
  const wait=async predicate=>{const until=Date.now()+15000;while(Date.now()<until){if(await predicate())return;await delay(100);}writeFileSync(join(directory,profile+'-failure.json'),JSON.stringify({ticks,jobs:await query('SELECT id,state,error_code FROM email_job'),admissions:await query('SELECT * FROM runtime_admission_day'),queue:await query('SELECT json FROM fixture_queue_trace')},null,2));throw Error('Local Queue did not settle');};
  for(let i=0;i<4;i++)await tick(at+i*60000);
  await wait(async()=>Number((await query('SELECT COUNT(*) n FROM email_capture'))[0].n)===6);
  const first=(await query('SELECT * FROM runtime_admission_day ORDER BY day'))[0];assert.equal(first.total,6);assert.ok(first.marketing<=4);
  const admitted=await query("SELECT id FROM email_job WHERE state='accepted' LIMIT 1");const before=Number((await query('SELECT COUNT(*) n FROM fixture_queue_trace'))[0].n);
  await request('/publish',{id:admitted[0].id});await wait(async()=>Number((await query('SELECT COUNT(*) n FROM fixture_queue_trace'))[0].n)>before);assert.equal(Number((await query('SELECT COUNT(*) n FROM email_capture'))[0].n),6,'duplicate publication must not resend');
  await seed(["INSERT INTO email_job(id,dedupe_key,kind,payload_json,available_at,created_at) VALUES('retry','retry','inquiry','{}',0,0)"]);
  const retry=await request('/retry-cut',{id:'retry'});assert.equal(retry.retried,true);assert.equal(retry.acked,false);assert.equal((await query("SELECT state FROM email_job WHERE id='retry'"))[0].state,'pending');
  await seed(["DELETE FROM email_job WHERE id='retry'",`INSERT INTO email_job(id,dedupe_key,kind,payload_json,state,lease_until,available_at,created_at) VALUES('uncertain','uncertain','inquiry','{}','sending',${at-1},0,0)`]);
  // Jump the admission clock without waiting for midnight; native Queue delivery remains local.
  for(let d=1;d<=3;d++)for(let i=0;i<4;i++)await tick(day+d*86400000+3600000+i*60000);
  await wait(async()=>Number((await query("SELECT COUNT(*) n FROM email_job WHERE state='queued'"))[0].n)===0);
  assert.equal((await query("SELECT state FROM email_job WHERE id='uncertain'"))[0].state,'unknown');
  assert.equal(Number((await query("SELECT COUNT(*) n FROM email_capture WHERE job_id='uncertain'"))[0].n),0);
  const admissions=await query('SELECT * FROM runtime_admission_day ORDER BY day');for(const row of admissions){assert.ok(row.total<=6);assert.ok(row.marketing<=4);}
  const campaign=profile==='enquiries'?null:(await query("SELECT state,cursor FROM campaign WHERE id='c'"))[0];if(campaign)assert.equal(campaign.state,'completed');
  const queue=await query('SELECT json FROM fixture_queue_trace');const queueTraces=queue.map(r=>JSON.parse(r.json));assert.ok(queueTraces.every(t=>t.statements<=40));
  const result={profile,resource:identity,fixture:{inquiries:10,subscribers:profile==='enquiries'?0:8,days:4},ticks,admissions,queueTraces,retry,unknownPreserved:true,campaign,workflow:'reconciliation binding substituted; hosted execution/CPU not qualified',providerQualification:'pending'};
  report.profiles.push(result);writeFileSync(join(directory,profile+'.json'),JSON.stringify(result,null,2));
  await server.stop();server=undefined;console.log(profile+': '+ticks.length+' ticks; SQL max '+Math.max(...ticks.map(t=>t.trace.statements))+'; native Queue, rollover, duplicate and uncertainty checks passed.');
 }
}catch(error){report.errors.push(error.stack||String(error));process.exitCode=1;console.error(error);}
finally{await server?.stop();assert.ok(owned.startsWith(resolve('.generated')+sep+'runtime-budget-'));rmSync(owned,{recursive:true,force:true});report.cleanedUp=true;writeFileSync(join(directory,'summary.json'),JSON.stringify(report,null,2));}
