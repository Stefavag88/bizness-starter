import {it,expect,afterEach} from 'vitest';
import {readFileSync,writeFileSync,mkdirSync,existsSync,symlinkSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {parseProject} from '../packages/config/project.mjs';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {fixture} from './fixtures/content/factory';
import source from '../project.json';
const roots=ownedTempRoots('production-preparation-');afterEach(()=>roots.cleanup());
const target=()=>({format:1,application:source.name,target:'production',accountId:'1234567890abcdef1234567890abcdef',siteUrl:'https://client-business.gr',infrastructure:{databaseId:'d7e657ef-3f0f-46eb-b482-c9117a724359',accessIssuer:'https://client.cloudflareaccess.com',accessAudience:'production-audience',adminEmails:['admin@client-business.gr']}});
const local={ports:{site:4330,worker:8790,tina:4010,datalayer:9010},siteUrl:'http://127.0.0.1:4330',workerUrl:'http://127.0.0.1:8790',tinaUrl:'http://127.0.0.1:4010',datalayerUrl:'http://127.0.0.1:9010'};
it('projects explicit production configuration without inheriting local infrastructure or mutating source',async()=>{
 const {parseProductionTarget}=await import('../scripts/deployment/production.mjs');
 const input=parseProject({...source,infrastructure:{databaseId:'11111111-1111-4111-8111-111111111111',sendingEnabled:true,allowedRecipients:['local@example.com'],editorEmails:['local@example.com']}}),before=structuredClone(input),raw=target();
 const resolved=parseProductionTarget(raw,input);expect(input).toEqual(before);expect(raw).toEqual(target());
 expect(resolved.project).toMatchObject({environment:'production',siteUrl:raw.siteUrl,infrastructure:{sendingEnabled:false,marketingEnabled:false,allowedRecipients:[],editorEmails:[],databaseId:raw.infrastructure.databaseId,providerAnalytics:{enabled:false}}});
 expect(resolved.application).toBe(source.name);expect(resolved.accountId).toBe(raw.accountId);
});
it('rejects wrong app, unsupported targets, malformed origins and credential fields',async()=>{
 const {parseProductionTarget}=await import('../scripts/deployment/production.mjs');const p=parseProject(source);
 for(const patch of [{application:'someone-else'},{target:'staging'},{target:'local'},{accountId:'bad'},{siteUrl:'http://client.gr'},{siteUrl:'https://client.gr/path'},{token:'SECRET'},{infrastructure:{CF_ANALYTICS_TOKEN:'SECRET'}}])expect(()=>parseProductionTarget({...target(),...patch},p)).toThrow();
});
it('builds one production resource set and strips local runtime origins',async()=>{
 const {parseProductionTarget}=await import('../scripts/deployment/production.mjs');const {createWorkerConfig}=await import('../scripts/worker-config.mjs');
 const t=parseProductionTarget(target(),parseProject(source)),config=createWorkerConfig(t.project,local,t);
 expect(config.name).toBe(source.name+'-production');expect(config.account_id).toBe(t.accountId);expect(config.routes).toEqual([{pattern:'client-business.gr',custom_domain:true}]);
 expect(config.d1_databases[0]).toMatchObject({binding:'DB',database_name:source.name+'-production-db',database_id:target().infrastructure.databaseId});
 expect(config.queues.producers[0].queue).toBe(source.name+'-production-outbound');expect(config.queues.consumers[0].dead_letter_queue).toBe(source.name+'-production-dead');expect(config.workflows).toBeUndefined();
 expect(config.vars).toMatchObject({ENVIRONMENT:'production',LOCAL_ORIGINS:'[]',LOCAL_SITE_URL:'',LOCAL_WORKER_URL:''});expect(JSON.stringify(config)).not.toContain('staging');expect(JSON.stringify(config)).not.toContain('127.0.0.1');
 expect(JSON.parse(config.vars.PROVIDER_ANALYTICS).workerName).toBe(config.name);
 const nurture=createWorkerConfig({...t.project,profile:'nurture'},local,t);expect(nurture.workflows[0].name).toBe(source.name+'-production-welcome');
});
it('keeps the existing local Worker configuration unchanged',async()=>{
 const {createWorkerConfig}=await import('../scripts/worker-config.mjs');const p=parseProject(source),config=createWorkerConfig(p,local);
 expect(config.name).toBe(p.name);expect(config.account_id).toBeUndefined();expect(config.routes).toBeUndefined();expect(config.vars.LOCAL_ORIGINS).toBe(JSON.stringify([local.siteUrl,local.workerUrl]));expect(config.d1_databases[0].database_name).toBe(p.name+'-db');
});
it('reports identity issues and permanently blocked readiness without requiring staging',async()=>{
 const {productionIssues}=await import('../scripts/deployment/production.mjs');const {parseProductionTarget}=await import('../scripts/deployment/production.mjs');
 const configured=parseProductionTarget(target(),parseProject(source));expect(productionIssues(configured)).not.toEqual(expect.arrayContaining([expect.stringMatching(/staging.*required/i)]));
 const missing=parseProductionTarget({...target(),accountId:'0'.repeat(32),siteUrl:'https://example.com',infrastructure:{}},parseProject(source));const issues=productionIssues(missing).join(' ');expect(issues).toMatch(/account/i);expect(issues).toMatch(/database/i);expect(issues).toMatch(/domain/i);expect(issues).toMatch(/hosted CMS/i);
 const mismatch=parseProductionTarget({...target(),infrastructure:{...target().infrastructure,providerAnalytics:{enabled:true,accountId:'a'.repeat(32)}}},parseProject(source));expect(productionIssues(mismatch).join(' ')).toMatch(/analytics.*account/i);
});

it('prepares a blocked, fingerprinted production plan without changing canonical inputs',async()=>{
 const {prepareProduction}=await import('../scripts/deployment/prepare.mjs');const f=fixture(),project={...source,name:'test'};writeFileSync(join(f.root,'project.json'),JSON.stringify(project));const input=join(f.root,'production.json'),raw={...target(),application:'test'};writeFileSync(input,JSON.stringify(raw));
 const before=readFileSync(join(f.root,'project.json'),'utf8');const plan=await prepareProduction(f.root,['--target','production','--config',input]);
 expect(plan).toMatchObject({format:1,application:'test',target:'production',status:'blocked',deployable:false});expect(plan.worker.name).toBe('test-production');expect(plan.fingerprints['project.json']).toMatch(/^[a-f0-9]{64}$/);expect(plan.fingerprints['content/settings/site.json']).toMatch(/^[a-f0-9]{64}$/);expect(plan.targetFingerprint).toMatch(/^[a-f0-9]{64}$/);
 expect(readFileSync(join(f.root,'project.json'),'utf8')).toBe(before);expect(readFileSync(input,'utf8')).toBe(JSON.stringify(raw));expect(JSON.parse(readFileSync(join(f.root,'.generated/deployment/production-plan.json'),'utf8'))).toEqual(plan);
 expect(existsSync(join(f.root,'wrangler.generated.json'))).toBe(false);
 const old=readFileSync(join(f.root,'.generated/deployment/production-plan.json'),'utf8');writeFileSync(input,JSON.stringify({...raw,token:'PRIVATE'}));await expect(prepareProduction(f.root,['--target','production','--config',input])).rejects.toThrow();expect(readFileSync(join(f.root,'.generated/deployment/production-plan.json'),'utf8')).toBe(old);
});
it('refuses invalid CLI arguments before any filesystem or process effects',async()=>{
 const {prepareProduction}=await import('../scripts/deployment/prepare.mjs');const root=roots.create();
 for(const args of [[],['--target','staging','--config','file'],['--target','production'],['--target','production','--config','file','--execute'],['--target','production','--target','production','--config','file'],['--target','production','--config','file','--remote']])await expect(prepareProduction(root,args)).rejects.toThrow(/argument|target|config/i);
 expect(existsSync(join(root,'.generated'))).toBe(false);
});
it('refuses linked report directories without touching the destination',async()=>{
 const {prepareProduction}=await import('../scripts/deployment/prepare.mjs');const f=fixture();writeFileSync(join(f.root,'project.json'),JSON.stringify({...source,name:'test'}));const input=join(f.root,'production.json');writeFileSync(input,JSON.stringify({...target(),application:'test'}));mkdirSync(join(f.root,'.generated'));const outside=roots.create(),link=join(f.root,'.generated/deployment');symlinkSync(outside,link,'junction');
 try{await expect(prepareProduction(f.root,['--target','production','--config',input])).rejects.toThrow(/link|directory|safe/i);expect(existsSync(join(outside,'production-plan.json'))).toBe(false);}finally{unlinkSync(link);}
});
it('permits only exact local or dry-run Wrangler shapes, refusing override and remote aliases',async()=>{
 const {assertLocalWranglerArgs}=await import('../scripts/deployment/wrangler-policy.mjs');
 for(const args of [['deploy','--dry-run','--config','wrangler.generated.json'],['d1','migrations','apply','DB','--local','--config','wrangler.generated.json'],['dev','--local','--ip','127.0.0.1','--port','8790','--inspector-port','0','--config','wrangler.generated.json']])expect(()=>assertLocalWranglerArgs(args)).not.toThrow();
 for(const args of [['deploy'],['deploy','--dry-run=false'],['deploy','--dry-run','--config','wrangler.generated.json','--dry-run=false'],['deploy','--dry-run','--env','production','--config','wrangler.generated.json'],['d1','migrations','apply','DB','--remote','--config','wrangler.generated.json'],['d1','migrations','apply','DB','--local','--config','wrangler.generated.json','--remote'],['publish','--config','wrangler.generated.json'],['queues','delete','anything'],['deploy','--dry-run','--config','elsewhere.json'],['dev','--remote'],['secret','put','TOKEN']])expect(()=>assertLocalWranglerArgs(args)).toThrow(/blocked|unsupported/i);
});

it('rejects origins that cannot match the planned production custom domain',async()=>{
 const {parseProductionTarget}=await import('../scripts/deployment/production.mjs');
 for(const siteUrl of ['https://client-business.gr:8443','https://127.0.0.1','https://[::1]','https://intranet'])expect(()=>parseProductionTarget({...target(),siteUrl},parseProject(source))).toThrow(/domain/i);
});

it('rejects target/report path aliases before writing and preserves the target bytes',async()=>{
 const {prepareProduction}=await import('../scripts/deployment/prepare.mjs');const f=fixture();writeFileSync(join(f.root,'project.json'),JSON.stringify({...source,name:'test'}));mkdirSync(join(f.root,'.generated/deployment'),{recursive:true});const output=join(f.root,'.generated/deployment/production-plan.json'),bytes=JSON.stringify({...target(),application:'test'});writeFileSync(output,bytes);
 await expect(prepareProduction(f.root,['--target','production','--config',output])).rejects.toThrow(/input.*output|target.*report|alias/i);expect(readFileSync(output,'utf8')).toBe(bytes);
 if(process.platform==='win32'){await expect(prepareProduction(f.root,['--target','production','--config',output.toUpperCase()])).rejects.toThrow(/input.*output|target.*report|alias/i);expect(readFileSync(output,'utf8')).toBe(bytes);}
 const parent=roots.create(),link=join(parent,'alias');symlinkSync(f.root,link,'junction');
 try{await expect(prepareProduction(f.root,['--target','production','--config',join(link,'.generated/deployment/production-plan.json')])).rejects.toThrow(/input.*output|target.*report|alias/i);expect(readFileSync(output,'utf8')).toBe(bytes);}finally{unlinkSync(link);}
});
