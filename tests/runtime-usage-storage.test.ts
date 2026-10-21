import {it,expect,vi} from 'vitest';
import {environment} from './db';
import {createBudgetScope,meterEnvironment} from '../worker/budget';
import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
import {persistUsage} from '../worker/usage';
it('counts its single telemetry write without recursively writing observations',async()=>{
 const f=environment();try{const scope=createBudgetScope('http',resolveRuntimePolicy('enquiries'));const env=meterEnvironment(f.env,scope);
 await env.DB.prepare('SELECT 1').first();scope.recordOutcome('accepted');
 await persistUsage(env,scope,{entrypoint:'contact',at:Date.parse('2026-10-21T10:00:00Z')});
 const row=f.database.prepare('SELECT * FROM runtime_usage_day').get()!;
 expect(row.sql_statements).toBe(2);expect(row.observations).toBe(1);expect(row.accepted).toBe(1);expect(scope.snapshot().attempted.sqlStatements).toBe(2);
 }finally{f.database.close();}
});
it('does not change successful business state or throw when telemetry is unavailable',async()=>{
 const f=environment();const log=vi.spyOn(console,'error').mockImplementation(()=>{});try{
 f.database.exec("CREATE TABLE outcome(state TEXT);INSERT INTO outcome VALUES('accepted');DROP TABLE runtime_usage_day;");
 const scope=createBudgetScope('http',resolveRuntimePolicy('enquiries'));
 await expect(persistUsage(f.env,scope,{entrypoint:'queue',at:Date.now()})).resolves.toBeUndefined();
 expect(f.database.prepare('SELECT state FROM outcome').get()?.state).toBe('accepted');expect(log).toHaveBeenCalledWith(expect.stringContaining('usage_persistence_failed'));
 }finally{log.mockRestore();f.database.close();}
});
