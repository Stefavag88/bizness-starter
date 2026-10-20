import {it,expect} from 'vitest';
import {environment} from './db';
import {jobStatement} from '../worker/db';
import {overview} from '../worker/operations';
it('exposes actionable quarantined jobs without message bodies or recipients',async()=>{
 const {env,database}=environment();try{
 await jobStatement(env,'unknown-job','inquiry',{email:'private@example.com',message:'Private message'}).run();
 database.prepare("UPDATE email_job SET state='unknown',error_code='send_state_unknown',attempts=2").run();
 const result=await overview(env);
 expect(result).toMatchObject({deliveries:[{state:'unknown',error_code:'send_state_unknown',attempts:2}],enrollments:[]});
 const details=JSON.stringify((result as any).deliveries);
 expect(details).not.toContain('private@example.com');expect(details).not.toContain('Private message');
 expect(details).not.toContain('payload_json');
 }finally{database.close();}
});
