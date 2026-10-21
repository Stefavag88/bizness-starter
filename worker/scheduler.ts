import type {Env} from './types';
import {createBudgetScope,meterEnvironment,type BudgetSnapshot} from './budget';
import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
import {dispatch} from './delivery';import {fanOut} from './campaigns';import {startEnrollments} from './workflow';import {persistUsage} from './usage';
export interface ScheduledResult{deferred:boolean;failures:number;usage:BudgetSnapshot}
export async function runScheduled(env:Env,at:number):Promise<ScheduledResult>{
 const policy=resolveRuntimePolicy(env.PROFILE),scope=createBudgetScope('scheduled',policy),context={scope,at};
 let failures=0,deferred=false;
 const run=async(task:string,fn:()=>Promise<any>)=>{try{const r=await fn();if(r?.deferred){deferred=true;scope.recordOutcome('deferred');}return r;}catch{failures++;console.error(JSON.stringify({task,error:'scheduled_task_failed'}));}};
 await run('delivery_dispatch',()=>dispatch(env,context));
 if(env.PROFILE!=='enquiries'){await run('campaign_fanout',()=>fanOut(env,context));await run('enrollments',()=>startEnrollments(env,context));}
 if(Math.floor(at/60000)%policy.cleanupEveryMinutes===0){await run('cleanup',async()=>{
  const hold=scope.tryReserve('maintenance',{sqlStatements:3,externalCalls:0,internalCalls:3});if(!hold)return {deferred:true};
  const e=meterEnvironment(env,scope,hold,at);try{
   const window=String(Math.floor(at/900000));
   const claim=await e.DB.prepare("INSERT INTO runtime_cursor(key,position)VALUES('cleanup-window',?) ON CONFLICT(key)DO UPDATE SET position=excluded.position WHERE CAST(position AS INTEGER)<CAST(excluded.position AS INTEGER) RETURNING position").bind(window).first();
   if(!claim)return;
   await e.DB.prepare('DELETE FROM rate_limit WHERE key IN (SELECT key FROM rate_limit WHERE expires_at<? ORDER BY expires_at,key LIMIT 100)').bind(at).run();
   await e.DB.prepare('DELETE FROM action_token WHERE token_hash IN (SELECT token_hash FROM action_token WHERE expires_at<? ORDER BY expires_at,token_hash LIMIT 100)').bind(at-86400000).run();
  }finally{hold.releaseUnused();}
 });}
 await persistUsage(env,scope,{entrypoint:'scheduled',at,queueAdmissions:scope.snapshot().queuePublications});
 return {deferred,failures,usage:scope.snapshot()};
}
