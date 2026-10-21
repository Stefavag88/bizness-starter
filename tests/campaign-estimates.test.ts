import {it,expect} from 'vitest';import {environment} from './db';import {estimateCampaign} from '../worker/campaign-estimates';import {workContext} from '../worker/budget';
it('counts a large audience progressively and never invents a hosted completion guarantee',async()=>{const f=environment();try{
 f.env.RUNTIME_BUDGET=JSON.stringify({dailyDispatchLimit:100,transactionalReserve:10});
 f.database.prepare("INSERT INTO campaign(id,request_key,snapshot_json,snapshot_hash,interest_id,state,created_at)VALUES('c','c','{}','h','updates','approved',0)").run();
 for(let n=0;n<501;n++){const id=String(n).padStart(6,'0');f.database.prepare("INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,confirmed_at,consent_version)VALUES(?,?,?,'active',1,0,0,0,'v1')").run(id,id+'@example.com',id+'@example.com');f.database.prepare('INSERT INTO subscriber_interest VALUES(?,?)').run(id,'updates');}
 const first=await estimateCampaign(f.env,'c',workContext(f.env));expect(first.eligible).toEqual({count:500,exact:false});expect(first.completionTo).toBeNull();
 const last=await estimateCampaign(f.env,'c',workContext(f.env));expect(last.eligible).toEqual({count:501,exact:true});expect(last.conditional).toBe(true);expect(last.constraints).toContain('hosted_measurements_pending');
 expect(JSON.stringify(last)).not.toContain('@example.com');
 }finally{f.database.close();}});
