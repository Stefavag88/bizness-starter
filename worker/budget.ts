import {resolveRuntimePolicy,type OperationCost,type RuntimePolicy} from '../packages/config/runtime-budgets.mjs';
import type {Env} from './types';
export type {OperationCost,RuntimePolicy};
export type OutcomeCounts=Record<'accepted'|'failed'|'unknown'|'deferred',number>;
export interface BudgetSnapshot{kind:string;attempted:OperationCost;reserved:OperationCost;remaining:OperationCost;lanes:Record<string,OperationCost>;outcomes:OutcomeCounts}
const fields=['sqlStatements','externalCalls','internalCalls'] as const;
const zero=():OperationCost=>({sqlStatements:0,externalCalls:0,internalCalls:0});
function valid(c:OperationCost){if(fields.some(k=>!Number.isSafeInteger(c[k])||c[k]<0))throw Error('Invalid operation cost');}
export class BudgetExceeded extends Error{constructor(){super('Runtime budget exhausted');}}
export class BudgetScope{
 private attempted=zero();private reserved=zero();private lanes:Record<string,OperationCost>={};private holds:Record<string,OperationCost>={};
 private outcomes:OutcomeCounts={accepted:0,failed:0,unknown:0,deferred:0};
 constructor(readonly kind:string,readonly policy:RuntimePolicy){}
 tryReserve(lane:string,cost:OperationCost):BudgetReservation|null{
  valid(cost);const limit=this.kind==='scheduled'?(this.policy.scheduledSqlAllowances as Record<string,number>)[lane]:this.policy.ceilings.sqlStatements;
  if(limit===undefined||fields.some(k=>this.attempted[k]+this.reserved[k]+cost[k]>this.policy.ceilings[k])||(this.lanes[lane]?.sqlStatements??0)+(this.holds[lane]?.sqlStatements??0)+cost.sqlStatements>limit)return null;
  this.holds[lane]??=zero();for(const k of fields){this.reserved[k]+=cost[k];this.holds[lane][k]+=cost[k];}
  let left={...cost},closed=false;
  return {remaining:()=>({...left}),consume:(part:OperationCost)=>{valid(part);if(closed||fields.some(k=>part[k]>left[k]))throw new BudgetExceeded();this.lanes[lane]??=zero();for(const k of fields){left[k]-=part[k];this.reserved[k]-=part[k];this.holds[lane][k]-=part[k];this.attempted[k]+=part[k];this.lanes[lane][k]+=part[k];}},releaseUnused:()=>{if(closed)return;closed=true;for(const k of fields){this.reserved[k]-=left[k];this.holds[lane][k]-=left[k];left[k]=0;}}};
 }
 charge(lane:string,cost:OperationCost){const r=this.tryReserve(lane,cost);if(!r)throw new BudgetExceeded();r.consume(cost);r.releaseUnused();}
 snapshot():BudgetSnapshot{const remaining=zero();for(const k of fields)remaining[k]=this.policy.ceilings[k]-this.attempted[k]-this.reserved[k];return structuredClone({kind:this.kind,attempted:this.attempted,reserved:this.reserved,remaining,lanes:this.lanes,outcomes:this.outcomes});}
 recordOutcome(outcome:keyof OutcomeCounts){this.outcomes[outcome]++;}
}
export interface BudgetReservation{remaining():OperationCost;consume(cost:OperationCost):void;releaseUnused():void}
export const createBudgetScope=(kind:'http'|'scheduled'|'queue'|'workflow',policy:RuntimePolicy)=>new BudgetScope(kind,policy);
const rawStatement=Symbol('raw-statement'),contextKey=Symbol('budget-context'),sourceKey=Symbol('source-environment');
export interface WorkContext{scope:BudgetScope;at:number;reservation?:BudgetReservation}
export interface WorkResult{processed:number;deferred:boolean}
export function workContext(env:Env,kind:'http'|'scheduled'|'queue'|'workflow'='http',at=Date.now()):WorkContext{
 return (env as any)[contextKey]??{scope:createBudgetScope(kind,resolveRuntimePolicy(env.PROFILE||'enquiries')),at};
}
export function chargeExternal(env:Env){const c=(env as any)[contextKey] as WorkContext|undefined;if(c){const cost={sqlStatements:0,externalCalls:1,internalCalls:0};if(c.reservation)c.reservation.consume(cost);else c.scope.charge('external',cost);}}
export function meterEnvironment(env:Env,scope:BudgetScope,reservation?:BudgetReservation,at=Date.now()):Env{
 if((env as any)[contextKey]?.scope===scope&&!reservation)return env;
 env=(env as any)[sourceKey]??env;
 const charge=(sqlStatements=0,internalCalls=1)=>{const cost={sqlStatements,internalCalls,externalCalls:0};if(reservation)reservation.consume(cost);else scope.charge('request',cost);};
 const wrapStatement=(s:any):any=>new Proxy(s,{get(target,key){if(key===rawStatement)return target;if(key==='bind')return(...args:any[])=>wrapStatement(target.bind(...args));if(['run','all','first','raw'].includes(String(key)))return async(...args:any[])=>{charge(1);return target[key](...args);};const v=Reflect.get(target,key);return typeof v==='function'?v.bind(target):v;}});
 const db=new Proxy(env.DB,{get(target,key){if(key==='prepare')return(sql:string)=>wrapStatement(target.prepare(sql));if(key==='batch')return async(statements:any[])=>{charge(statements.length);return target.batch(statements.map(s=>s[rawStatement]??s));};if(key==='exec'||key==='withSession')return()=>{throw Error('Use metered prepared D1 statements');};const v=Reflect.get(target,key);return typeof v==='function'?v.bind(target):v;}});
 const wrapInstance=(instance:any):any=>new Proxy(instance,{get(target,key){const v=Reflect.get(target,key);return typeof v==='function'?(...args:any[])=>{charge();return v.apply(target,args);}:v;}});
 const wrapWorkflow=env.NURTURE?new Proxy(env.NURTURE,{get(target,key){const fn=Reflect.get(target,key);if(typeof fn!=='function')return fn;return(...args:any[])=>{charge();const v=fn.apply(target,args);return v&&typeof v.then==='function'?v.then(wrapInstance):wrapInstance(v);};}}):undefined;
 const queue=env.OUTBOUND?new Proxy(env.OUTBOUND,{get(target,key){const v=Reflect.get(target,key);return typeof v==='function'?(...args:any[])=>{charge();return v.apply(target,args);}:v;}}):env.OUTBOUND;
 return new Proxy(env,{get(target,key){if(key===sourceKey)return target;if(key===contextKey)return {scope,at,reservation};if(key==='DB')return db;if(key==='OUTBOUND')return queue;if(key==='NURTURE')return wrapWorkflow;return Reflect.get(target,key);}});
}
