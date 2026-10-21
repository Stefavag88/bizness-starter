// Source-only diagnostic entrypoint. Never exported to a client or deployed.
import real from '../worker/index';
import {runScheduled} from '../worker/scheduler';
import {createBudgetScope,meterEnvironment} from '../worker/budget';
import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
import type {Env} from '../worker/types';
const raw=Symbol('fixture-statement');
function observe(env:Env){
 const trace={statements:0,rowsRead:0,rowsWritten:0,queueSends:0};
 const meta=(r:any)=>{for(const x of Array.isArray(r)?r:[r]){trace.rowsRead+=Number(x?.meta?.rows_read??0);trace.rowsWritten+=Number(x?.meta?.rows_written??0);}return r;};
 const stmt=(s:any):any=>new Proxy(s,{get(t,k){if(k===raw)return t;if(k==='bind')return(...v:any[])=>stmt(t.bind(...v));if(['run','all','first','raw'].includes(String(k)))return async(...v:any[])=>{trace.statements++;if(k==='first'){const r=meta(await t.all());return v[0]?r.results[0]?.[v[0]]:r.results[0]??null;}return meta(await t[k](...v));};const v=Reflect.get(t,k);return typeof v==='function'?v.bind(t):v;}});
 const DB=new Proxy(env.DB,{get(t,k){if(k==='prepare')return(sql:string)=>stmt(t.prepare(sql));if(k==='batch')return async(items:any[])=>{trace.statements+=items.length;return meta(await t.batch(items.map(s=>s[raw]??s)));};const v=Reflect.get(t,k);return typeof v==='function'?v.bind(t):v;}});
 const OUTBOUND={send:async(body:any)=>{trace.queueSends++;await env.OUTBOUND.send(body);}};
 // Reconciliation is observed; hosted Workflow entitlement/steps require milestone 8.
 const NURTURE={create:async()=>({status:async()=>({status:'waiting'})}),get:async()=>({status:async()=>({status:'waiting'})})};
 return {env:{...env,DB,OUTBOUND,NURTURE} as any as Env,trace};
}
export default {
 async fetch(request:Request,env:Env&{FIXTURE_TOKEN:string},ctx:ExecutionContext){
  if(request.headers.get('x-fixture-token')!==env.FIXTURE_TOKEN)return new Response('Forbidden',{status:403});
  const path=new URL(request.url).pathname,body=request.method==='POST'?await request.json() as any:{};
  if(path==='/seed'){for(const sql of body.statements)await env.DB.prepare(sql).run();return Response.json({ok:true});}
  if(path==='/query')return Response.json(await env.DB.prepare(body.sql).all());
  if(path==='/tick'){const observed=observe(env),result=await runScheduled(observed.env,body.at);return Response.json({result,trace:observed.trace});}
  if(path==='/publish'){await env.OUTBOUND.send({id:body.id});return Response.json({ok:true});}
  if(path==='/retry-cut'){
   const scope=createBudgetScope('queue',resolveRuntimePolicy(env.PROFILE));scope.charge('fixture',{sqlStatements:39,externalCalls:0,internalCalls:39});const observed=observe(env);let retried=false,acked=false;
   await real.queue({messages:[{body:{id:body.id},ack(){acked=true;},retry(){retried=true;}}]} as any,meterEnvironment(observed.env,scope));return Response.json({retried,acked,trace:observed.trace});
  }
  return real.fetch(new Request(new URL(path,'http://127.0.0.1'),request),env,ctx);
 },
 async queue(batch:MessageBatch<unknown>,env:Env){const observed=observe(env);await real.queue(batch,observed.env);await env.DB.prepare('INSERT INTO fixture_queue_trace(json) VALUES(?)').bind(JSON.stringify(observed.trace)).run();}
};
