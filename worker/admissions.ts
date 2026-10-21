import {parseRuntimeBudget} from '../packages/config/runtime-budgets.mjs';
import {meterEnvironment,type BudgetScope} from './budget';
import type {Env} from './types';
export const utcDay=(at:number)=>new Date(at).toISOString().slice(0,10);
export interface AdmissionSnapshot{configured:boolean;limit:number|null;reserve:number;used:number;marketingUsed:number;remaining:number|null}
export async function reserveAdmission(env:Env,scope:BudgetScope,lane:'transactional'|'marketing',at:number){
 const cfg=parseRuntimeBudget(env.RUNTIME_BUDGET);if(cfg.dailyDispatchLimit===null)return null;
 const marketing=Number(lane==='marketing'),limit=cfg.dailyDispatchLimit,cap=limit-cfg.transactionalReserve;
 const row=await meterEnvironment(env,scope).DB.prepare(`INSERT INTO runtime_admission_day(day,total,marketing)
 SELECT ?,1,? WHERE ?>0 AND (?=0 OR ?>0)
 ON CONFLICT(day) DO UPDATE SET total=total+1,marketing=marketing+excluded.marketing
 WHERE total<? AND (excluded.marketing=0 OR marketing<?) RETURNING total`)
 .bind(utcDay(at),marketing,limit,marketing,cap,limit,cap).first();
 return row?{day:utcDay(at),lane}:null;
}
export async function readAdmissionDay(env:Env,at:number):Promise<AdmissionSnapshot>{
 const c=parseRuntimeBudget(env.RUNTIME_BUDGET);
 const r=await env.DB.prepare('SELECT total,marketing FROM runtime_admission_day WHERE day=?').bind(utcDay(at)).first<{total:number;marketing:number}>();
 const used=r?.total??0;
 return {configured:c.dailyDispatchLimit!==null,limit:c.dailyDispatchLimit,reserve:c.transactionalReserve,used,marketingUsed:r?.marketing??0,remaining:c.dailyDispatchLimit===null?null:Math.max(0,c.dailyDispatchLimit-used)};
}
