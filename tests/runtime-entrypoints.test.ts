import {it,expect,vi} from 'vitest';import worker from '../worker/index';import {environment} from './db';
vi.mock('../worker/workflow',()=>({startEnrollments:async()=>{},WelcomeWorkflow:class{}}));
it('records bounded form and local-delivery work but not read-only or rejected traffic',async()=>{
 const f=environment('enquiries'),pending:Promise<unknown>[]=[],ctx={waitUntil:(p:Promise<unknown>)=>pending.push(p)} as any;
 try{const req=(payload:any)=>new Request('http://127.0.0.1:8899/api/contact',{method:'POST',headers:{origin:'http://127.0.0.1:4433','Content-Type':'application/json'},body:JSON.stringify(payload)});
 await worker.fetch(new Request('http://127.0.0.1:8899/api/health'),f.env,ctx);
 await worker.fetch(new Request('https://public.test/api/operations/overview'),f.env,ctx);await Promise.all(pending);
 expect(f.database.prepare('SELECT COUNT(*) n FROM runtime_usage_day').get()?.n).toBe(0);
 const r=await worker.fetch(req({requestKey:crypto.randomUUID(),name:'Visitor',email:'visitor@example.com',message:'A meaningful message here.',privacyAccepted:true,marketingConsent:false,turnstileToken:'local'}),f.env,ctx);await Promise.all(pending);
 expect(r.status).toBe(202);const stats=f.database.prepare("SELECT * FROM runtime_usage_day WHERE entrypoint='contact'").get()!;
 expect(stats.sql_statements).toBeLessThanOrEqual(40);expect(stats.accepted).toBe(1);
 }finally{f.database.close();}});
