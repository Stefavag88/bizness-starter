import {it,expect,vi,afterEach} from 'vitest';
import {environment} from './db';
import {subscribe} from '../worker/newsletter';
import worker from '../worker/index';
import * as campaigns from '../worker/campaigns';
import {jobStatement} from '../worker/db';
vi.mock('../worker/workflow',()=>({startEnrollments:async()=>{},WelcomeWorkflow:class{}}));
afterEach(()=>vi.restoreAllMocks());
const signup=(requestKey=crypto.randomUUID())=>({requestKey,email:'race@example.com',consent:true,interest:'updates',turnstileToken:'local'});
function serialBatches(env:any){
 const batch=env.DB.batch.bind(env.DB);let pending=Promise.resolve();
 env.DB.batch=(statements:any)=>{const next=pending.then(()=>batch(statements));pending=next.catch(()=>{});return next;};
}
const request=(data:unknown)=>new Request('http://127.0.0.1:8899/api/contact',{method:'POST',headers:{origin:'http://127.0.0.1:4433','Content-Type':'application/json'},body:JSON.stringify(data)});
const enquiry=()=>({...signup(),name:'Someone',message:'A useful enquiry to discuss.',privacyAccepted:true,marketingConsent:true,consent:undefined});
function contact(){const {consent,...data}=enquiry();return data;}
it('serializes simultaneous first signup requests onto one subscriber identity and confirmation',async()=>{
 const {env,database}=environment();serialBatches(env);
 try{await Promise.all([subscribe(env,signup()),subscribe(env,signup())]);
 expect(database.prepare('SELECT COUNT(*) n FROM subscriber').get()!.n).toBe(1);
 expect(database.prepare('SELECT COUNT(*) n FROM action_token').get()!.n).toBe(1);
 expect(database.prepare('SELECT COUNT(*) n FROM email_job').get()!.n).toBe(1);
 }finally{database.close();}
});
it('does not rotate a token or duplicate an intent when the same request is retried after cooldown',async()=>{
 const {env,database}=environment(),data=signup();try{
 await subscribe(env,data);const token=database.prepare('SELECT token_hash FROM action_token').get()!.token_hash;
 database.prepare('UPDATE subscriber SET last_requested_at=0').run();await subscribe(env,data);
 expect(database.prepare('SELECT token_hash FROM action_token').get()!.token_hash).toBe(token);
 expect(database.prepare('SELECT COUNT(*) n FROM email_job').get()!.n).toBe(1);
 }finally{database.close();}
});
it.each([undefined,'missing'])('rejects invalid opt-in interest before saving the enquiry (%s)',async interest=>{
 const {env,database}=environment();try{
 const response=await worker.fetch(request({...contact(),interest}),env,{waitUntil:()=>{}} as any);
 expect(response.status).toBe(400);expect(database.prepare('SELECT COUNT(*) n FROM inquiry').get()!.n).toBe(0);
 }finally{database.close();}
});
it('rolls back enquiry and notification when subscription persistence fails',async()=>{
 const {env,database}=environment();const original=env.DB.batch.bind(env.DB);
 env.DB.batch=(async(statements:any[])=>{if(statements.some(s=>s.sql.includes('INSERT INTO subscriber')))return original([...statements.slice(0,3),env.DB.prepare('INSERT INTO missing_table(id) VALUES(1)'),...statements.slice(3)]);return original(statements);}) as any;
 try{const response=await worker.fetch(request(contact()),env,{waitUntil:()=>{}} as any);
 expect(response.status).toBe(500);expect(database.prepare('SELECT COUNT(*) n FROM inquiry').get()!.n).toBe(0);
 expect(database.prepare('SELECT COUNT(*) n FROM email_job').get()!.n).toBe(0);
 }finally{database.close();}
});
it('dispatches transactional work even when scheduled marketing fails',async()=>{
 const {env,database}=environment();try{
 await jobStatement(env,'scheduled-inquiry','inquiry',{}).run();
 vi.spyOn(campaigns,'fanOut').mockRejectedValue(Error('marketing fault'));
 const send=vi.fn(async()=>{});env.OUTBOUND={send} as any;const promises:Promise<unknown>[]=[];
 await worker.scheduled({} as any,env,{waitUntil:(p:Promise<unknown>)=>promises.push(p)} as any);
 await Promise.allSettled(promises);expect(send).toHaveBeenCalledTimes(1);
 }finally{database.close();}
});
it('returns 400 for malformed outer webhook JSON',async()=>{
 const {env,database}=environment();try{
 const response=await worker.fetch(new Request('http://localhost:8899/api/webhooks/ses',{method:'POST',body:'{'}),env,{} as any);
 expect(response.status).toBe(400);
 }finally{database.close();}
});
