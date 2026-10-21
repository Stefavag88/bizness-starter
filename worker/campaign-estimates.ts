import type {Env,Campaign} from './types';import {HttpError} from './security';
import {workContext,meterEnvironment,type WorkContext} from './budget';import {readAdmissionDay,type AdmissionSnapshot} from './admissions';
import {parseRuntimeBudget} from '../packages/config/runtime-budgets.mjs';import {calculateCapacity} from '../packages/runtime-capacity/model.mjs';
export interface CampaignEstimate{eligible:{count:number;exact:boolean};remaining:{count:number;exact:boolean};generatedAt:string;earliestStart:string|null;completionFrom:string|null;completionTo:string|null;conditional:boolean;constraints:string[];dailyAllowance:AdmissionSnapshot}
export async function estimateCampaign(env:Env,id:string,context:WorkContext=workContext(env)):Promise<CampaignEstimate>{
 const hold=context.scope.tryReserve('estimate',{sqlStatements:7,externalCalls:0,internalCalls:7});if(!hold)throw new HttpError(503,'Estimate capacity is temporarily unavailable.');
 const e=meterEnvironment(env,context.scope,hold,context.at),at=context.at;
 try{
 const c=await e.DB.prepare('SELECT * FROM campaign WHERE id=?').bind(id).first<Campaign>();if(!c)throw new HttpError(404,'Campaign not found.');
 const dailyAllowance=await readAdmissionDay(e,at),cfg=parseRuntimeBudget(env.RUNTIME_BUDGET);
 let prior=await e.DB.prepare('SELECT * FROM runtime_campaign_estimate WHERE campaign_id=?').bind(id).first<{cutoff_at:number;cursor:string;matched:number;delayed:number;next_eligible_at:number|null;complete:number;generated_at:number}>();
 if(prior&&at-prior.generated_at>300000)prior=null;
 const cutoff=c.cutoff_at??prior?.cutoff_at??at,position=prior?.cursor??'';
 let count=prior?.matched??0,delayed=prior?.delayed??0,nextEligible=prior?.next_eligible_at??at,complete=!!prior?.complete;
 if(!complete){
 const rows=await e.DB.prepare("SELECT s.id,s.last_marketing_sent_at FROM subscriber s JOIN subscriber_interest i ON i.subscriber_id=s.id WHERE i.interest_id=? AND s.status='active' AND s.confirmed_at<=? AND s.id>? ORDER BY s.id LIMIT 500").bind(c.interest_id,cutoff,position).all<{id:string;last_marketing_sent_at:number|null}>();
 count+=rows.results.length;for(const row of rows.results){const ready=(row.last_marketing_sent_at??0)+172800000;if(row.last_marketing_sent_at&&ready>at){delayed++;nextEligible=Math.max(nextEligible,ready);}}
 complete=rows.results.length<500;
 await e.DB.prepare('INSERT INTO runtime_campaign_estimate(campaign_id,cutoff_at,cursor,matched,delayed,next_eligible_at,complete,generated_at)VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(campaign_id)DO UPDATE SET cutoff_at=excluded.cutoff_at,cursor=excluded.cursor,matched=excluded.matched,delayed=excluded.delayed,next_eligible_at=excluded.next_eligible_at,complete=excluded.complete,generated_at=excluded.generated_at').bind(id,cutoff,rows.results.at(-1)?.id??position,count,delayed,nextEligible,Number(complete),prior?.generated_at??at).run();
 }
 const backlog=await e.DB.prepare("SELECT COUNT(*) n FROM(SELECT id FROM email_job WHERE state IN ('pending','queued') LIMIT 1001)").first<{n:number}>();
 const report=calculateCapacity({profile:env.PROFILE as 'newsletter'|'nurture',days:30,initialDailyUsage:{total:dailyAllowance.used,marketing:dailyAllowance.marketingUsed},dailyDispatchLimit:cfg.dailyDispatchLimit,transactionalReserve:cfg.transactionalReserve,campaigns:[{audience:count+(backlog?.n??0)}]},{profile:env.PROFILE,qualification:'local'},context.scope.policy);
 const constraints=[...report.missingMeasurements];if(!complete)constraints.push('audience_count_incomplete');if(delayed)constraints.push('shared_48_hour_marketing_interval');if(c.state==='paused')constraints.push('campaign_paused');if(backlog?.n)constraints.push('aggregate_backlog_assumption');if((backlog?.n??0)>1000)constraints.push('backlog_count_capped');
 const done=report.days.find(d=>d.marketingPending===0),earliestStart=cfg.dailyDispatchLimit!==null?new Date(at).toISOString():null;
 // A planning lower bound is useful; an unqualified model never supplies an exact upper date.
 return {eligible:{count,exact:complete},remaining:{count:['draft','approved'].includes(c.state)?count:0,exact:complete&&['draft','approved'].includes(c.state)},generatedAt:new Date(at).toISOString(),earliestStart,completionFrom:c.state!=='paused'&&done&&earliestStart?new Date(Math.max(at,nextEligible)+done.day*86400000).toISOString():null,completionTo:null,conditional:true,constraints,dailyAllowance};
 }finally{hold.releaseUnused();}
}
