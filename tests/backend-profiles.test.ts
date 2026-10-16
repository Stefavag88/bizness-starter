import {it,expect,vi} from 'vitest';
import {environment} from './db';
import worker from '../worker/index';
import {subscribe,confirm} from '../worker/newsletter';
import {drainLocal} from '../worker/delivery';
// Only the platform Workflow class is unavailable in Node; API/DB/email behavior stays real.
vi.mock('../worker/workflow',()=>({startEnrollments:async()=>{},WelcomeWorkflow:class{}}));
const context=()=>{const work:Promise<unknown>[]=[];return {ctx:{waitUntil:(p:Promise<unknown>)=>work.push(p)} as unknown as ExecutionContext,finish:()=>Promise.all(work)};};
it.each(['enquiries','newsletter','nurture'])('gates routes for %s and protects public admin',async profile=>{
 const {env}=environment(profile);const {ctx}=context();
 expect((await worker.fetch(new Request('http://localhost:8899/api/health'),env,ctx)).status).toBe(200);
 expect((await worker.fetch(new Request('http://localhost:8899/api/admin/campaigns'),env,ctx)).status).toBe(profile==='enquiries'?404:200);
 expect((await worker.fetch(new Request('http://localhost:8899/newsletter/confirm'),env,ctx)).status).toBe(profile==='enquiries'?404:200);
 expect((await worker.fetch(new Request('https://public.test/api/local/emails'),env,ctx)).status).toBe(404);
 expect((await worker.fetch(new Request('https://public.test/cms/index.html'),env,ctx)).status).toBe(503);
 expect((await worker.fetch(new Request('https://public.test/api/operations/overview'),env,ctx)).status).toBe(503);
});
it('validates enquiries, preserves idempotency and ignores marketing under enquiries',async()=>{
 const {env,database}=environment('enquiries');const work=context();
 const payload={requestKey:crypto.randomUUID(),name:'Local tester',email:'tester@example.com',message:'A useful local test enquiry.',privacyAccepted:true,marketingConsent:true,turnstileToken:'local'};
 const request=(data:unknown)=>new Request('http://127.0.0.1:8899/api/contact',{method:'POST',headers:{origin:'http://127.0.0.1:4433','Content-Type':'application/json'},body:JSON.stringify(data)});
 expect((await worker.fetch(request({...payload,privacyAccepted:false}),env,work.ctx)).status).toBe(400);
 expect((await worker.fetch(request(payload),env,work.ctx)).status).toBe(202);await work.finish();
 expect((await worker.fetch(request(payload),env,work.ctx)).status).toBe(202);await work.finish();
 expect(database.prepare('SELECT COUNT(*) n FROM inquiry').get()!.n).toBe(1);
 expect(database.prepare('SELECT COUNT(*) n FROM subscriber').get()!.n).toBe(0);
 expect(database.prepare('SELECT privacy_version FROM inquiry').get()!.privacy_version).toBe('sample-v1');
 expect(database.prepare('SELECT COUNT(*) n FROM email_capture').get()!.n).toBe(1);
});
it('nurture confirmation adds one versioned enrollment',async()=>{
 const {env,database}=environment('nurture');
 await subscribe(env,{requestKey:crypto.randomUUID(),email:'nurture@example.com',consent:true,interest:'updates',turnstileToken:'local'});await drainLocal(env);
 const text=String(database.prepare('SELECT text FROM email_capture').get()!.text);const token=text.match(/token=([0-9a-f]+)/)![1];
 await confirm(env,token);await confirm(env,token);
 expect(database.prepare('SELECT COUNT(*) n FROM automation_enrollment').get()!.n).toBe(1);
});
