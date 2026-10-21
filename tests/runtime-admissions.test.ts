import {it,expect} from 'vitest';
import {environment} from './db';
import {createBudgetScope} from '../worker/budget';
import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
import {reserveAdmission,readAdmissionDay} from '../worker/admissions';
const at=Date.parse('2026-10-21T23:59:59Z');
const scope=()=>createBudgetScope('http',resolveRuntimePolicy('newsletter'));
it('atomically protects transactionals while campaigns and nurture share the daily pool',async()=>{
 const f=environment();try{f.env.RUNTIME_BUDGET=JSON.stringify({dailyDispatchLimit:10,transactionalReserve:3});
 const marketing=await Promise.all(Array.from({length:12},()=>reserveAdmission(f.env,scope(),'marketing',at)));
 expect(marketing.filter(Boolean)).toHaveLength(7);
 const transactional=await Promise.all(Array.from({length:5},()=>reserveAdmission(f.env,scope(),'transactional',at)));
 expect(transactional.filter(Boolean)).toHaveLength(3);expect((await readAdmissionDay(f.env,at)).remaining).toBe(0);
 expect(await reserveAdmission(f.env,scope(),'marketing',at+2000)).not.toBeNull();expect((await readAdmissionDay(f.env,at+2000)).used).toBe(1);
 }finally{f.database.close();}
});
it('keeps a null allowance closed and blocks a first marketing reservation when all capacity is reserved',async()=>{
 const f=environment();try{expect(await reserveAdmission(f.env,scope(),'marketing',at)).toBeNull();
 f.env.RUNTIME_BUDGET=JSON.stringify({dailyDispatchLimit:2,transactionalReserve:2});expect(await reserveAdmission(f.env,scope(),'marketing',at)).toBeNull();
 expect((await readAdmissionDay(f.env,at)).used).toBe(0);expect(await reserveAdmission(f.env,scope(),'transactional',at)).not.toBeNull();
 }finally{f.database.close();}
});
it('persists consumed attempts across scopes and never offers a post-publication refund',async()=>{
 const f=environment();try{f.env.RUNTIME_BUDGET=JSON.stringify({dailyDispatchLimit:1});
 expect(await reserveAdmission(f.env,scope(),'marketing',at)).not.toBeNull();
 expect(await reserveAdmission(f.env,scope(),'marketing',at)).toBeNull();expect((await readAdmissionDay(f.env,at)).used).toBe(1);
 }finally{f.database.close();}
});
