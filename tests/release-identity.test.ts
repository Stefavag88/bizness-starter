vi.mock('cloudflare:workers',()=>({WorkflowEntrypoint:class{}}));
import {it,expect,vi} from 'vitest';import {parseProject} from '../packages/config/project.mjs';import source from '../project.json';
it('has no local identity and stable nonlocal identity from the selected public configuration',async()=>{
 const {deploymentIdentity,identityText}=await import('../packages/config/deployment-identity.mjs');const p=parseProject(source);expect(deploymentIdentity(p)).toBeNull();const hosted={...p,environment:'production' as const,siteUrl:'https://client.gr',infrastructure:{...p.infrastructure,turnstileSiteKey:'public-key'}};const identity=deploymentIdentity(hosted);expect(identity).toEqual({format:1,application:p.name,environment:'production',siteUrl:'https://client.gr',profile:p.profile,turnstileSiteKey:'public-key'});expect(identityText(identity)).toBe(JSON.stringify(identity));expect(identityText(null)).toBe('');
});
it('refuses mixed compiled/runtime bindings and preserves unconfigured local compatibility',async()=>{
 const {validateDeploymentIdentity}=await import('../worker/deployment');const {deploymentIdentity,identityText}=await import('../packages/config/deployment-identity.mjs');const p=parseProject({...source,environment:'production'}),built=deploymentIdentity(p)!;const env:any={DEPLOYMENT_IDENTITY:identityText(built),ENVIRONMENT:'production',SITE_URL:p.siteUrl,PROFILE:p.profile,TURNSTILE_SITE_KEY:p.infrastructure.turnstileSiteKey};expect(()=>validateDeploymentIdentity(built,env)).not.toThrow();expect(()=>validateDeploymentIdentity(null,{} as any)).not.toThrow();
 for(const patch of [{ENVIRONMENT:'local'},{SITE_URL:'https://other.test'},{PROFILE:'nurture'},{TURNSTILE_SITE_KEY:'other'},{DEPLOYMENT_IDENTITY:''}])expect(()=>validateDeploymentIdentity(built,{...env,...patch})).toThrow(/identity/i);expect(()=>validateDeploymentIdentity(null,env)).toThrow(/identity/i);
});

it('rejects mixed entrypoints before database, assets, background work or message acknowledgements',async()=>{

 const {default:worker}=await import('../worker/index');
 const accessed=vi.fn(()=>{throw Error('side effect');});
 const env:any=new Proxy({DEPLOYMENT_IDENTITY:'unexpected'},{get(target:any,key){if(key==='DEPLOYMENT_IDENTITY')return target[key];accessed();}});
 const waitUntil=vi.fn(),ack=vi.fn(),retry=vi.fn();
 expect((await worker.fetch(new Request('http://localhost/api/contact',{method:'POST'}),env,{waitUntil} as any)).status).toBe(503);
 await expect(worker.queue({messages:[{body:{id:'job'},ack,retry}]} as any,env)).rejects.toThrow(/identity/i);
 await expect(worker.scheduled({} as any,env,{waitUntil} as any)).rejects.toThrow(/identity/i);
 expect(accessed).not.toHaveBeenCalled();expect(waitUntil).not.toHaveBeenCalled();expect(ack).not.toHaveBeenCalled();expect(retry).not.toHaveBeenCalled();
});

it('rejects a nurture Workflow identity mismatch before step scheduling or database work',async()=>{
 const {WelcomeWorkflow}=await import('../worker/workflow');
 const accessed=vi.fn(()=>{throw Error('side effect');});
 const env:any=new Proxy({DEPLOYMENT_IDENTITY:'unexpected'},{get(target:any,key){if(key==='DEPLOYMENT_IDENTITY')return target[key];return accessed();}});
 const sleep=vi.fn(),perform=vi.fn();
 await expect(WelcomeWorkflow.prototype.run.call({env} as any,{payload:{subscriberId:'s',generation:1}} as any,{sleep,do:perform} as any)).rejects.toThrow(/identity/i);
 expect(accessed).not.toHaveBeenCalled();expect(sleep).not.toHaveBeenCalled();expect(perform).not.toHaveBeenCalled();
});

it('accepts compiled UTF-8 identities for Unicode origins against the matching runtime bindings',async()=>{
 const {deploymentIdentity,identityText}=await import('../packages/config/deployment-identity.mjs');
 const p=parseProject({...source,environment:'production',siteUrl:'https://δοκιμή.gr'}),identity=deploymentIdentity(p)!;
 const marker=Buffer.from(identityText(identity),'utf8').toString('base64');
 vi.resetModules();vi.doMock('../.generated/deployment-identity-text.json',()=>({default:marker}));
 try{
  const {validateRuntimeDeployment}=await import('../worker/deployment');
  expect(()=>validateRuntimeDeployment({DEPLOYMENT_IDENTITY:identityText(identity),ENVIRONMENT:p.environment,SITE_URL:p.siteUrl,PROFILE:p.profile,TURNSTILE_SITE_KEY:p.infrastructure.turnstileSiteKey})).not.toThrow();
 }finally{vi.doUnmock('../.generated/deployment-identity-text.json');vi.resetModules();}
});
