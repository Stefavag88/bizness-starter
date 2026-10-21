import {it,expect} from 'vitest';import {observedEnvironment} from './helpers/metered-runtime';
import {jobStatement} from '../worker/db';import {deliver} from '../worker/delivery';import {createBudgetScope,meterEnvironment} from '../worker/budget';import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
it('does not claim an email unless its full completion and failure path fits',async()=>{const f=observedEnvironment('enquiries');try{
 await jobStatement(f.env,'one','inquiry',{name:'Example',email:'e@example.com',message:'Hello'}).run();
 const id=String(f.database.prepare('SELECT id FROM email_job').get()?.id),scope=createBudgetScope('queue',resolveRuntimePolicy('enquiries'));
 const used=scope.tryReserve('prior',{sqlStatements:35,externalCalls:0,internalCalls:0})!;used.consume({sqlStatements:35,externalCalls:0,internalCalls:0});used.releaseUnused();
 expect(await deliver(f.env,id,{scope,at:Date.now()})).toMatchObject({outcome:'deferred'});
 expect(f.database.prepare('SELECT state FROM email_job').get()?.state).toBe('pending');expect(f.database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(0);
 }finally{f.database.close();}});
it('records a durable outcome once for duplicate queue delivery',async()=>{const f=observedEnvironment('enquiries');try{
 await jobStatement(f.env,'one','inquiry',{name:'Example',email:'e@example.com',message:'Hello'}).run();
 const id=String(f.database.prepare('SELECT id FROM email_job').get()?.id),scope=createBudgetScope('queue',resolveRuntimePolicy('enquiries'));
 expect(await deliver(f.env,id,{scope,at:Date.now()})).toMatchObject({outcome:'accepted'});
 expect(await deliver(f.env,id,{scope,at:Date.now()})).toMatchObject({outcome:'noop'});expect(scope.snapshot().outcomes.accepted).toBe(1);
 expect(f.database.prepare('SELECT COUNT(*) n FROM email_capture').get()?.n).toBe(1);
 }finally{f.database.close();}});
