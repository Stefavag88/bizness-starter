import {it,expect,vi,afterEach} from 'vitest';
import {parseProject} from '../packages/config/project.mjs';
import {environment} from './db';
import worker from '../worker/index';
import {verifyTurnstile} from '../worker/security';
import source from '../project.json';
vi.mock('cloudflare:workers',()=>({WorkflowEntrypoint:class{}}));
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('defaults public key empty, accepts a key and rejects credential-like invalid values',()=>{
 expect(parseProject(source).infrastructure).toHaveProperty('turnstileSiteKey','');expect(parseProject({...source,infrastructure:{turnstileSiteKey:'0x4AAAA-valid_public-key'}}).infrastructure.turnstileSiteKey).toBe('0x4AAAA-valid_public-key');
 for(const turnstileSiteKey of ['<script>','bad key',12,null,'x'.repeat(101)])expect(()=>parseProject({...source,infrastructure:{turnstileSiteKey}})).toThrow();
});
it('projects local, hosted and unavailable protection without exposing a secret',async()=>{
 const {formProtection}=await import('../packages/config/form-protection.mjs');const p=parseProject(source);
 expect(formProtection(p)).toEqual({mode:'local',siteKey:''});expect(formProtection(p,true).mode).toBe('unavailable');expect(formProtection({...p,environment:'production'}).mode).toBe('unavailable');expect(formProtection({...p,environment:'production',infrastructure:{...p.infrastructure,turnstileSiteKey:'public-key'}})).toEqual({mode:'turnstile',siteKey:'public-key'});
});
it('has one public CSP and permits only Turnstile script/frame origins when configured',async()=>{
 const {publicAssetHeaders}=await import('../packages/config/security-headers.mjs');const plain=publicAssetHeaders(false),enabled=publicAssetHeaders(true);
 expect(plain.match(/Content-Security-Policy:/g)).toHaveLength(1);expect(plain).not.toContain('/cms/*');expect(plain).not.toContain('unsafe-inline');expect(plain).not.toContain('challenges.cloudflare.com');expect(enabled).toContain("script-src 'self' https://challenges.cloudflare.com");expect(enabled).toContain('frame-src https://challenges.cloudflare.com');
});
it('replaces inherited CMS policies on every CMS path after authentication',async()=>{
 const f=environment();try{f.env.ASSETS={fetch:vi.fn(async()=>new Response('editor',{headers:{'Content-Security-Policy':"default-src 'self', default-src 'self'; script-src 'unsafe-inline'"}}))} as any;
 for(const path of ['/cms','/cms/','/cms/index.html','/cms/assets/app.js']){const response=await worker.fetch(new Request('http://127.0.0.1'+path),f.env,{waitUntil(){}} as any);expect(response.status).toBe(200);const csp=response.headers.get('Content-Security-Policy')!;expect(csp).not.toContain(',');expect(csp).toContain("script-src 'self' 'unsafe-inline' blob:");expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');}
 f.env.ENVIRONMENT='production';const calls=(f.env.ASSETS.fetch as any).mock.calls.length;expect((await worker.fetch(new Request('https://example.com/cms'),f.env,{waitUntil(){}} as any)).status).not.toBe(200);expect(f.env.ASSETS.fetch).toHaveBeenCalledTimes(calls);
 }finally{f.database.close();}
});
it('allows validated Tina loopback connections only in local CMS policies',async()=>{
 const {cmsResponse}=await import('../packages/config/security-headers.mjs');const origins=JSON.stringify(['http://127.0.0.1:4010','http://localhost:4010','https://evil.test',"http://localhost:4010; script-src *"]);
 const local=cmsResponse(new Response('cms'),{ENVIRONMENT:'local',CMS_LOCAL_ORIGINS:origins}).headers.get('content-security-policy')!;expect(local).toContain('http://localhost:4010');expect(local).not.toContain('evil.test');
 expect(cmsResponse(new Response('cms'),{ENVIRONMENT:'production',CMS_LOCAL_ORIGINS:origins}).headers.get('content-security-policy')).not.toContain('localhost');
});

it('validates hosted Turnstile action/hostname strictly and refuses preview tokens',async()=>{
 const f=environment();try{f.env.ENVIRONMENT='production';f.env.TURNSTILE_SECRET='secret-sentinel';const request=new Request('https://example.com/api/contact');const fetcher=vi.fn(async(_url:unknown,_init?:RequestInit)=>Response.json({success:true,hostname:'example.com',action:'contact'}));vi.stubGlobal('fetch',fetcher);
 await verifyTurnstile(request,f.env,'real-token','contact');expect(fetcher).toHaveBeenCalledOnce();const init=fetcher.mock.calls[0][1] as any;expect(init.redirect).toBe('error');expect(init.signal).toBeInstanceOf(AbortSignal);expect(init.body.get('secret')).toBe('secret-sentinel');
 await expect(verifyTurnstile(request,f.env,'local-preview','contact')).rejects.toMatchObject({status:400});expect(fetcher).toHaveBeenCalledOnce();
 for(const data of [{success:true,hostname:'evil.test',action:'contact'},{success:true,hostname:'example.com',action:'subscribe'},{success:'true',hostname:'example.com',action:'contact'},{success:false}]){vi.stubGlobal('fetch',async()=>Response.json(data));await expect(verifyTurnstile(request,f.env,'real-token','contact')).rejects.toMatchObject({status:400});}
 }finally{f.database.close();}
});
it('sanitizes upstream failures and times out without retrying or leaking secrets',async()=>{
 const f=environment();try{f.env.ENVIRONMENT='production';f.env.TURNSTILE_SECRET='secret-sentinel';const request=new Request('https://example.com/api/contact');
 for(const response of [()=>new Response('private detail',{status:503}),()=>new Response('not json'),()=>Response.json(null)]){vi.stubGlobal('fetch',async()=>response());await expect(verifyTurnstile(request,f.env,'real-token','contact')).rejects.toMatchObject({status:503,message:'Form protection is temporarily unavailable. Please try again.'});}
 vi.useFakeTimers();const fetcher=vi.fn((_url:any,init:any)=>new Promise<Response>((_,reject)=>init.signal.addEventListener('abort',()=>reject(Error('private')))));vi.stubGlobal('fetch',fetcher);const promise=verifyTurnstile(request,f.env,'real-token','contact');const expectation=expect(promise).rejects.toMatchObject({status:503});await vi.advanceTimersByTimeAsync(4001);await expectation;expect(fetcher).toHaveBeenCalledOnce();
 }finally{f.database.close();}
});
