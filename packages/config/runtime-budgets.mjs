import {z} from 'zod';
export const runtimeBudgetSchema=z.strictObject({
 policyId:z.literal('cloudflare-free-v1').default('cloudflare-free-v1'),
 dailyDispatchLimit:z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().default(null),
 transactionalReserve:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
 warningPercent:z.number().int().min(1).max(98).default(70),criticalPercent:z.number().int().min(2).max(99).default(85),
}).superRefine((v,c)=>{if(v.warningPercent>=v.criticalPercent)c.addIssue({code:'custom',message:'Warning must be below critical'});if(v.transactionalReserve>(v.dailyDispatchLimit??0))c.addIssue({code:'custom',message:'Reserve requires and cannot exceed the daily allowance'});});
export function parseRuntimeBudget(raw){return runtimeBudgetSchema.parse(typeof raw==='string'?JSON.parse(raw):raw??{});}
export function resolveRuntimePolicy(profile){
 const allocations={enquiries:[32,0,0,28],newsletter:[24,10,0,20],nurture:[12,10,14,8]}[profile];
 if(!allocations)throw Error('Unknown runtime profile');
 const [dispatch,campaign,enrollment,maxDispatchJobs]=allocations;
 return Object.freeze({ceilings:Object.freeze({sqlStatements:40,externalCalls:40,internalCalls:800}),scheduledSqlAllowances:Object.freeze({dispatch,campaign,enrollment,maintenance:4}),maxDispatchJobs,maxFanoutRecipients:4,consumerBatchSize:1,consumerConcurrency:1,cleanupLimit:100,cleanupEveryMinutes:15,telemetryStatementReserve:1});
}
