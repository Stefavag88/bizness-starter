import {expect,it} from 'vitest';
import {createBudgetScope,meterEnvironment} from '../worker/budget';
import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
import {observedEnvironment} from './helpers/metered-runtime';
const cost=(sqlStatements=0,externalCalls=0,internalCalls=0)=>({sqlStatements,externalCalls,internalCalls});
it('blocks the forty-first database statement before it executes',async()=>{
 const f=observedEnvironment();try{
 const scope=createBudgetScope('http',resolveRuntimePolicy('newsletter')); const env=meterEnvironment(f.env,scope);
 const statement=env.DB.prepare('SELECT 1');expect(f.observed.statements).toBe(0);
 for(let n=0;n<40;n++)await statement.first();
 await expect(statement.first()).rejects.toThrow(/budget/i);
 expect(f.observed.statements).toBe(40);expect(scope.snapshot().attempted.sqlStatements).toBe(40);
 }finally{f.database.close();}
});
it('consumes explicit reservations once, releases only unused capacity, and keeps failures charged',async()=>{
 const f=observedEnvironment();try{
 const scope=createBudgetScope('http',resolveRuntimePolicy('newsletter'));const reservation=scope.tryReserve('request',cost(4,0,2))!;
 const env=meterEnvironment(f.env,scope,reservation);
 await env.DB.prepare('SELECT 1').first();
 await expect(env.DB.prepare('SELECT * FROM missing_table').all()).rejects.toThrow();
 reservation.releaseUnused();
 expect(scope.snapshot().attempted.sqlStatements).toBe(2);expect(scope.snapshot().reserved.sqlStatements).toBe(0);
 expect(scope.tryReserve('request',cost(38))).not.toBeNull();expect(scope.tryReserve('request',cost(1))).toBeNull();
 }finally{f.database.close();}
});
it('charges transactional batch elements once even when the database rolls them back',async()=>{
 const f=observedEnvironment();try{
 f.database.exec('CREATE TABLE probe(id INTEGER PRIMARY KEY)');
 const scope=createBudgetScope('http',resolveRuntimePolicy('newsletter'));const env=meterEnvironment(f.env,scope);
 await expect(env.DB.batch([env.DB.prepare('INSERT INTO probe VALUES(1)'),env.DB.prepare('INSERT INTO probe VALUES(1)')])).rejects.toThrow();
 expect(scope.snapshot().attempted).toEqual(cost(2,0,1));expect(f.observed).toEqual({statements:2,bindingCalls:1});
 expect(f.database.prepare('SELECT COUNT(*) n FROM probe').get()?.n).toBe(0);
 }finally{f.database.close();}
});
it('never lends another lane or another invocation a consumed budget',()=>{
 const a=createBudgetScope('scheduled',resolveRuntimePolicy('nurture')),b=createBudgetScope('scheduled',resolveRuntimePolicy('nurture'));
 const r=a.tryReserve('dispatch',cost(12))!;r.consume(cost(12));r.releaseUnused();
 expect(a.tryReserve('dispatch',cost(1))).toBeNull();expect(b.tryReserve('dispatch',cost(12))).not.toBeNull();
 expect(a.tryReserve('campaign',cost(10))).not.toBeNull();
});
