import {readAdmissionDay} from './admissions';
import {environmentIdentity} from './budget';
import {parseRuntimeBudget} from '../packages/config/runtime-budgets.mjs';
import {HttpError} from './security';
import type {UsageSnapshot,MetricReading} from './usage-contracts';
import project from '../project.json';
import {utcDay} from './admissions';
import {meterEnvironment,type BudgetScope} from './budget';
import type {UsageObservation} from './usage-contracts';
import type {Env} from './types';
export async function persistUsage(env:Env,scope:BudgetScope,observation:UsageObservation):Promise<void>{
 const hold=scope.tryReserve(scope.kind==='scheduled'?'maintenance':'telemetry',{sqlStatements:1,externalCalls:0,internalCalls:1});
 if(!hold){console.error(JSON.stringify({error:'usage_persistence_failed',reason:'budget'}));return;}
 try{
 const s=scope.snapshot();
 await meterEnvironment(env,scope,hold).DB.prepare(`INSERT INTO runtime_usage_day(day,entrypoint,observations,sql_statements,external_calls,internal_calls,queue_admissions,deferred,accepted,failed,unknown,last_observed_at) VALUES(?,?,1,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(day,entrypoint) DO UPDATE SET observations=observations+1,sql_statements=sql_statements+excluded.sql_statements,external_calls=external_calls+excluded.external_calls,internal_calls=internal_calls+excluded.internal_calls,queue_admissions=queue_admissions+excluded.queue_admissions,deferred=deferred+excluded.deferred,accepted=accepted+excluded.accepted,failed=failed+excluded.failed,unknown=unknown+excluded.unknown,last_observed_at=MAX(last_observed_at,excluded.last_observed_at)`)
 .bind(utcDay(observation.at),observation.entrypoint,s.attempted.sqlStatements-(observation.baseline?.sqlStatements??0)+1,s.attempted.externalCalls-(observation.baseline?.externalCalls??0),s.attempted.internalCalls-(observation.baseline?.internalCalls??0)+1,observation.queueAdmissions??0,s.outcomes.deferred,s.outcomes.accepted,s.outcomes.failed,s.outcomes.unknown,observation.at).run();
 }catch{console.error(JSON.stringify({error:'usage_persistence_failed'}));}finally{hold.releaseUnused();}
}

const snapshotCache=new WeakMap<object,Map<string,{at:number;snapshot:UsageSnapshot}>>();
export function usageWindow(at:number){return {from:utcDay(at-6*86400000),to:utcDay(at)};}
function validateWindow(window:{from:string;to:string}){
 const parse=(date:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new HttpError(400,'Use UTC dates in YYYY-MM-DD format.');const n=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(n)||utcDay(n)!==date)throw new HttpError(400,'Invalid date.');return n;};
 const from=parse(window.from),to=parse(window.to);if(to<from||to-from>6*86400000)throw new HttpError(400,'Select a window of at most seven days.');return {from,to};
}
export async function readUsageSnapshot(env:Env,window:{from:string;to:string},at:number):Promise<UsageSnapshot>{
 const bounds=validateWindow(window),config=parseRuntimeBudget(env.RUNTIME_BUDGET),identity=environmentIdentity(env),key=env.ENVIRONMENT+':'+window.from+':'+window.to;
 let cache=snapshotCache.get(identity);if(!cache){cache=new Map();snapshotCache.set(identity,cache);}const cached=cache.get(key);
 if(cached&&at>=cached.at&&at-cached.at<300000)return structuredClone(cached.snapshot);
 const admission=await readAdmissionDay(env,at).catch(()=>({configured:config.dailyDispatchLimit!==null,limit:config.dailyDispatchLimit,reserve:config.transactionalReserve,used:null,marketingUsed:null,remaining:null,status:'unavailable' as const}));
 const rows=await env.DB.prepare('SELECT * FROM runtime_usage_day WHERE day>=? AND day<=? ORDER BY day,entrypoint').bind(window.from,window.to).all<Record<string,any>>().catch(()=>({results:[] as Record<string,any>[]}));
 const has=rows.results.length>0,last=has?Math.max(...rows.results.map(r=>Number(r.last_observed_at))):null;
 const app=(id:string,column:string,unit='count'):MetricReading=>({id,value:has?rows.results.reduce((sum,r)=>sum+Number(r[column]),0):null,unit,source:'application',scope:'deployment',window,updatedAt:last===null?null:new Date(last).toISOString(),status:has?'partial':'unavailable'});
 const application=[app('recorded_sql_statements','sql_statements','statements'),app('observed_delivery_acceptances','accepted'),app('observed_failed_deliveries','failed'),app('observed_uncertain_deliveries','unknown'),app('deferred_work_units','deferred'),app('observed_queue_publications','queue_admissions'),app('recorded_external_attempts','external_calls')];
 const backlog={} as UsageSnapshot['backlog'];
 for(const state of ['pending','queued','failed','unknown'] as const){
  try{const row=await env.DB.prepare('SELECT COUNT(*) n FROM(SELECT id FROM email_job WHERE state=? LIMIT 1001)').bind(state).first<{n:number}>();const n=row?.n??0;backlog[state]={count:Math.min(n,1000),exact:n<=1000};}
  catch{backlog[state]={count:0,exact:false};}
 }
 const providerIds=['worker_requests_site','worker_requests_account','cpu_p99_ms','d1_rows_read','d1_rows_written','d1_storage_bytes','queue_operations','queue_backlog','workflow_steps'];
 const metrics:MetricReading[]=providerIds.map(id=>({id,value:null,unit:id.endsWith('_bytes')?'bytes':id==='cpu_p99_ms'?'ms':'count',source:'provider',scope:id==='worker_requests_account'?'account':'deployment',window,updatedAt:null,status:'not_configured'}));
 const history=[];for(let day=bounds.from;day<=bounds.to;day+=86400000){const date=utcDay(day),items=rows.results.filter(r=>r.day===date);const sum=(column:string)=>items.length?items.reduce((n,r)=>n+Number(r[column]),0):null;history.push({day:date,accepted:sum('accepted'),deferred:sum('deferred'),sqlStatements:sum('sql_statements')});}
 const snapshot:UsageSnapshot={generatedAt:new Date(at).toISOString(),window,deployment:{name:project.name,environment:env.ENVIRONMENT},admission,application,provider:{status:'not_configured',updatedAt:null,metrics},forecasts:[],backlog,history,warningPercent:config.warningPercent,criticalPercent:config.criticalPercent};
 if(cache.size>=8)cache.delete(cache.keys().next().value!);cache.set(key,{at,snapshot:structuredClone(snapshot)});return snapshot;
}
