import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseProject} from '../packages/config/project.mjs';
import {parseRuntimeBudget,resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
const seed=JSON.parse(readFileSync('project.json','utf8'));
it('keeps old projects safely unconfigured instead of enabling unlimited sending',()=>{
 expect(parseProject(seed).infrastructure.runtimeBudget).toEqual({policyId:'cloudflare-free-v1',dailyDispatchLimit:null,transactionalReserve:0,warningPercent:70,criticalPercent:85});
 expect(parseRuntimeBudget(undefined).dailyDispatchLimit).toBeNull();
 expect(()=>parseRuntimeBudget('{broken')).toThrow();
});
it.each([{dailyDispatchLimit:null,transactionalReserve:1},{dailyDispatchLimit:10,transactionalReserve:11},{dailyDispatchLimit:0},{warningPercent:85,criticalPercent:70},{criticalPercent:100},{policyId:'unlimited'}])('rejects unsafe runtime policy settings %j',value=>{
 expect(()=>parseRuntimeBudget(value)).toThrow();
});
it.each([['enquiries',32,0,0,28],['newsletter',24,10,0,20],['nurture',12,10,14,8]] as const)('allocates %s within the common statement ceiling',(profile,dispatch,campaign,enrollment,jobs)=>{
 const policy=resolveRuntimePolicy(profile);
 expect(policy.scheduledSqlAllowances).toEqual({dispatch,campaign,enrollment,maintenance:4});
 expect(policy.maxDispatchJobs).toBe(jobs);
 expect(Object.values(policy.scheduledSqlAllowances).reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(40);
 expect(()=>{policy.maxDispatchJobs=999;}).toThrow();
});
