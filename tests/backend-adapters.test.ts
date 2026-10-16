import {it,expect} from 'vitest';
import {environment} from './db';
import {requireOrigin} from '../worker/security';
import {campaignSchema} from '../packages/contracts';
import {subscribe} from '../worker/newsletter';
import {drainLocal} from '../worker/delivery';
it('permits only configured local origins on actual loopback requests',()=>{
 const {env}=environment();
 for(const origin of ['http://127.0.0.1:4433','http://127.0.0.1:8899','https://example.com'])expect(()=>requireOrigin(new Request('http://127.0.0.1:8899/api/contact',{headers:{origin}}),env)).not.toThrow();
 for(const origin of ['https://evil.test','http://127.0.0.1:4321','http://127.0.0.1:8787'])expect(()=>requireOrigin(new Request('http://127.0.0.1:8899/api/contact',{headers:{origin}}),env)).toThrow();
 expect(()=>requireOrigin(new Request('https://public.test/api/contact',{headers:{origin:'http://127.0.0.1:4433'}}),env)).toThrow();
 env.LOCAL_ORIGINS='["https://evil.test"]';
 expect(()=>requireOrigin(new Request('http://localhost:8899/api/contact',{headers:{origin:'https://evil.test'}}),env)).toThrow();
});
it.each(['\nNote','Note\r','\r\nNote\r\n','One\nTwo'])('rejects raw subject line breaks %j',subject=>{
 expect(campaignSchema.safeParse({subject,requestKey:crypto.randomUUID(),intro:'Useful note',interest:'updates'}).success).toBe(false);
});
it('captures confirmation links using the configured nondefault Worker port and canonical brand',async()=>{
 const {env,database}=environment();
 await subscribe(env,{requestKey:crypto.randomUUID(),email:'sample@example.com',consent:true,interest:'updates',turnstileToken:'local'});
 await drainLocal(env);
 const email=String(database.prepare('SELECT text FROM email_capture').get()!.text);
 expect(email).toContain('http://127.0.0.1:8899/newsletter/confirm?token=');expect(email).toContain('Example Studio');expect(email).not.toContain('[object Object]');
});
