import {it,expect} from 'vitest';import {calculateCapacity} from '../packages/runtime-capacity/model.mjs';import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
const evidence={profile:'nurture',qualification:'local',dataset:'compact-fixture'};
it('spreads an unrestricted audience over the marketing allocation without borrowing the reserve',()=>{
 const r=calculateCapacity({profile:'nurture',days:3,dailyDispatchLimit:10,transactionalReserve:3,campaigns:[{audience:20,startDay:0}]},evidence,resolveRuntimePolicy('nurture'));
 expect(r.days.map(d=>d.marketingAdmitted)).toEqual([7,7,6]);expect(r.days[2].marketingPending).toBe(0);expect(r.qualification).toBe('not_qualified');
 expect(r.missingMeasurements).toContain('hosted_measurements_pending');
});
it('subtracts account activity and queue retry costs instead of assigning every site the full allowance',()=>{
 const r=calculateCapacity({profile:'nurture',days:1,dailyDispatchLimit:100,accountUsage:{queueOperations:7990},campaigns:[{audience:100}]},evidence,resolveRuntimePolicy('nurture'));
 expect(r.days[0].marketingAdmitted).toBe(3);expect(r.days[0].limitingResource).toBe('queue_operations');
 const retries=calculateCapacity({profile:'nurture',days:1,dailyDispatchLimit:100,duplicateRate:1,accountUsage:{queueOperations:7990},campaigns:[{audience:100}]},evidence,resolveRuntimePolicy('nurture'));
 expect(retries.days[0].marketingAdmitted).toBe(2);
});
it('does not infer cloud qualification from a label with missing row and CPU measurements',()=>{
 const r=calculateCapacity({profile:'nurture',dailyDispatchLimit:10},{...evidence,qualification:'hosted'},resolveRuntimePolicy('nurture'));
 expect(r.qualification).toBe('not_qualified');expect(r.days[0].rowsRead).toBeNull();
});
it('keeps an unconfigured allowance closed and models delayed nurture cohorts',()=>{
 const r=calculateCapacity({profile:'nurture',days:15,nurtureCohorts:[{subscribers:2,startDay:0}]},evidence,resolveRuntimePolicy('nurture'));
 expect(r.days.every(d=>d.marketingAdmitted===0)).toBe(true);expect(r.days[3].nurtureArrivals).toBe(2);expect(r.days[7].nurtureArrivals).toBe(2);expect(r.days[14].nurtureArrivals).toBe(2);
});
it('rejects invalid rates and configurations instead of silently assuming extra capacity',()=>{
 expect(()=>calculateCapacity({profile:'nurture',retryRate:-1},evidence,resolveRuntimePolicy('nurture'))).toThrow();
 expect(()=>calculateCapacity({profile:'nurture',dailyDispatchLimit:2,transactionalReserve:3},evidence,resolveRuntimePolicy('nurture'))).toThrow();
});

it('starts with the day already consumed rather than granting a fresh allowance to every campaign',()=>{
 const r=calculateCapacity({profile:'nurture',days:2,dailyDispatchLimit:10,transactionalReserve:3,initialDailyUsage:{total:8,marketing:6},campaigns:[{audience:10}]},evidence,resolveRuntimePolicy('nurture'));
 expect(r.days.map(d=>d.marketingAdmitted)).toEqual([1,7]);
});

it('cannot qualify a workload whose baseline Worker requests exceed the available allowance',()=>{
 const measured={profile:'nurture',qualification:'hosted',sourceArtifact:'controlled-hosted-fixture',samples:1000,cpuP99Ms:2,cpuMaxMs:3,costs:{scheduler:{sqlStatements:10,rowsRead:10,rowsWritten:1}}};
 const r=calculateCapacity({profile:'nurture',dailyDispatchLimit:10,providerDailyLimit:1000,providerPerSecond:1,otherWorkerRequests:100000},measured,resolveRuntimePolicy('nurture'));
 expect(r.qualification).not.toBe('hosted_qualified');expect(r.days[0].fitsKnownAllowances).toBe(false);expect(r.days[0].exceededAllowances).toContain('worker_requests');
});
