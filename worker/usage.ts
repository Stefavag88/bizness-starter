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
 .bind(utcDay(observation.at),observation.entrypoint,s.attempted.sqlStatements+1,s.attempted.externalCalls,s.attempted.internalCalls+1,observation.queueAdmissions??0,s.outcomes.deferred,s.outcomes.accepted,s.outcomes.failed,s.outcomes.unknown,observation.at).run();
 }catch{console.error(JSON.stringify({error:'usage_persistence_failed'}));}finally{hold.releaseUnused();}
}
