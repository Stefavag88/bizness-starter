import {z} from 'zod';
const count=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const account=z.strictObject({requests:count.default(0),rowsRead:count.default(0),rowsWritten:count.default(0),queueOperations:count.default(0),workflowSteps:count.default(0)});
export const workloadSchema=z.strictObject({initialDailyUsage:z.strictObject({total:count.default(0),marketing:count.default(0)}).prefault({}),profile:z.enum(['enquiries','newsletter','nurture']),days:z.number().int().min(1).max(30).default(7),dailyDispatchLimit:count.positive().nullable().default(null),transactionalReserve:count.default(0),enquiries:count.default(0),signups:count.default(0),confirmations:count.default(0),withdrawals:count.default(0),nurtureMessages:count.default(0),otherWorkerRequests:count.default(0),adminRequests:count.default(0),retryRate:z.number().min(0).max(3).default(0),republishRate:z.number().min(0).max(3).default(0),duplicateRate:z.number().min(0).max(3).default(0),providerDailyLimit:count.positive().nullable().default(null),providerPerSecond:z.number().positive().nullable().default(null),accountUsage:account.prefault({}),campaigns:z.array(z.strictObject({audience:count,startDay:count.default(0)})).max(1000).default([]),nurtureCohorts:z.array(z.strictObject({subscribers:count,startDay:count.default(0)})).max(1000).default([])}).superRefine((w,c)=>{if(w.initialDailyUsage.marketing>w.initialDailyUsage.total)c.addIssue({code:'custom',message:'Invalid initial daily use'});if(w.transactionalReserve>(w.dailyDispatchLimit??0))c.addIssue({code:'custom',message:'Invalid transactional reserve'});if(w.profile==='enquiries'&&(w.signups||w.confirmations||w.nurtureMessages||w.campaigns.length||w.nurtureCohorts.length))c.addIssue({code:'custom',message:'Marketing requires a newsletter profile'});});
export function calculateCapacity(input,evidence,policy){
 evidence=z.object({profile:z.enum(['enquiries','newsletter','nurture']),qualification:z.enum(['local','hosted']),dataset:z.string().optional(),sourceArtifact:z.string().min(1).optional(),cpuP99Ms:z.number().nonnegative().nullable().optional(),cpuMaxMs:z.number().nonnegative().nullable().optional(),samples:count.optional(),costs:z.record(z.string(),z.object({sqlStatements:z.number().nonnegative().nullable().optional(),rowsRead:z.number().nonnegative().nullable().optional(),rowsWritten:z.number().nonnegative().nullable().optional()})).optional()}).parse(evidence);
 const w=workloadSchema.parse(input);if(evidence.profile!==w.profile)throw Error('Cost evidence profile mismatch');
 const missing=new Set();if(evidence.qualification!=='hosted')missing.add('hosted_measurements_pending');
 if(w.dailyDispatchLimit===null)missing.add('daily_allowance_not_configured');if(w.providerDailyLimit===null||w.providerPerSecond===null)missing.add('provider_quota_not_configured');
 if(evidence.cpuP99Ms==null||evidence.cpuMaxMs==null)missing.add('cpu_measurements_pending');
 const costs=evidence.costs??{};const rows=(amounts,field)=>{let total=0;for(const [op,n]of Object.entries(amounts)){if(n===0)continue;const value=costs[op]?.[field];if(!Number.isFinite(value)||value<0){missing.add(field+'_measurements_pending');return null;}total+=n*value;}return total;};
 const available={requests:Math.max(0,80000-w.accountUsage.requests),rowsRead:Math.max(0,4000000-w.accountUsage.rowsRead),rowsWritten:Math.max(0,80000-w.accountUsage.rowsWritten),queueOperations:Math.max(0,8000-w.accountUsage.queueOperations),workflowSteps:Math.max(0,2400-w.accountUsage.workflowSteps)};
 const attemptFactor=1+w.retryRate+w.republishRate,queueCost=3+2*w.duplicateRate;
 const tickJobs=Math.max(0,Math.min(policy.maxDispatchJobs,Math.floor((policy.scheduledSqlAllowances.dispatch-7)/2)));
 let txPending=0,marketingPending=0;const days=[];
 for(let day=0;day<w.days;day++){
  let nurture=w.nurtureMessages,steps=0,workflowInvocations=0;
  for(const cohort of w.nurtureCohorts){const age=day-cohort.startDay;if([3,7,14].includes(age))nurture+=cohort.subscribers;if([0,3,7,14].includes(age)){steps+=cohort.subscribers*(age===0?1:2);workflowInvocations+=cohort.subscribers;}}
  txPending+=w.enquiries+w.signups;marketingPending+=w.confirmations+nurture+w.campaigns.filter(c=>c.startDay===day).reduce((n,c)=>n+c.audience,0);
  const baseRequests=1440+w.enquiries+w.signups+w.confirmations+w.withdrawals+w.otherWorkerRequests+w.adminRequests+workflowInvocations;
  const caps={daily_allowance:Math.max(0,(w.dailyDispatchLimit??0)-(day===0?w.initialDailyUsage.total:0)),queue_operations:Math.floor(available.queueOperations/queueCost),scheduler_throughput:tickJobs*1440,worker_requests:Math.floor(Math.max(0,available.requests-baseRequests)/2),provider_quota:w.providerDailyLimit??Infinity,provider_rate:w.providerPerSecond===null?Infinity:Math.floor(w.providerPerSecond*86400)};
  const limitingResource=Object.entries(caps).sort((a,b)=>a[1]-b[1])[0][0],attemptCap=Math.min(...Object.values(caps));
  const transactionalAdmitted=Math.min(txPending,Math.floor(attemptCap/attemptFactor));txPending-=transactionalAdmitted;
  const remainingAttempts=attemptCap-Math.ceil(transactionalAdmitted*attemptFactor);
  const marketingAttemptCap=Math.min(remainingAttempts,Math.max(0,(w.dailyDispatchLimit??0)-w.transactionalReserve-(day===0?w.initialDailyUsage.marketing:0)));
  const marketingAdmitted=Math.min(marketingPending,Math.floor(marketingAttemptCap/attemptFactor));marketingPending-=marketingAdmitted;
  const attempts=Math.ceil((transactionalAdmitted+marketingAdmitted)*attemptFactor);
  const amounts={scheduler:1440,contact:w.enquiries,signup:w.signups,confirmation:w.confirmations,withdrawal:w.withdrawals,delivery:attempts,feedback:attempts,admin:w.adminRequests,workflow:steps};
  const rowsRead=rows(amounts,'rowsRead'),rowsWritten=rows(amounts,'rowsWritten'),sqlStatements=rows(amounts,'sqlStatements');
  days.push({day,transactionalAdmitted,marketingAdmitted,attempts,queueOperations:attempts*queueCost,workerRequests:baseRequests+attempts*2,rowsRead,rowsWritten,sqlStatements,workflowSteps:steps,nurtureArrivals:nurture,transactionalPending:txPending,marketingPending,limitingResource,fitsKnownAllowances:(rowsRead===null||rowsRead<=available.rowsRead)&&(rowsWritten===null||rowsWritten<=available.rowsWritten)&&steps<=available.workflowSteps});
 }
 if(days.at(-1)?.transactionalPending||days.at(-1)?.marketingPending)missing.add('backlog_beyond_model_horizon');
 const cpuQualified=(evidence.samples??0)>=1000&&evidence.cpuP99Ms<=7&&evidence.cpuMaxMs<=8;
 if(!cpuQualified)missing.add('cpu_qualification_pending');
 const costsKnown=days.every(d=>d.rowsRead!==null&&d.rowsWritten!==null&&d.sqlStatements!==null);
 const qualified=missing.size===0&&cpuQualified&&costsKnown&&days.every(d=>d.fitsKnownAllowances)&&!!evidence.sourceArtifact;
 const qualification=qualified?'hosted_qualified':evidence.sourceArtifact&&costs.scheduler?.sqlStatements!=null?'locally_verified':'not_qualified';
 return {profile:w.profile,qualification,available,days,limitingResource:days[0]?.limitingResource??null,missingMeasurements:[...missing],assumptions:['Queue costs and retry rates are workload projections, not provider readings.','UTC days; one minute scheduler; one Queue message per consumer invocation.','All projected recipients remain eligible; overlapping marketing audiences may wait at least 48 hours.','Provider limits, data size, account sharing and CPU can reduce this envelope.'],sourceArtifact:evidence.sourceArtifact??null};
}
