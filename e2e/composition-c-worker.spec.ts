import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {DatabaseSync,backup} from 'node:sqlite';
import {unstable_dev} from 'wrangler';
import {createOwnedFileEdit} from '../scripts/owned-file-edit.mjs';
import {runOwnedCommand} from '../scripts/owned-command.mjs';
import {assertPortsFree,resolvePorts} from '../scripts/ports.mjs';
import {createCmsSources} from './helpers/cms-source-ownership';
import {cleanupCompositionPublic} from './helpers/composition-b-cleanup';

// Node-owned public fixtures; no native authoring, schema migration or external delivery.
test('shared localized contexts select safely and capture once in an owned local Worker/D1',async({page})=>{
 test.setTimeout(180000);
 const ports=resolvePorts();await assertPortsFree({site:ports.site,worker:ports.worker});
 const directory=mkdtempSync(resolve('.generated/composition-c-task5/worker-'));
 const log=(name:string,value:unknown)=>writeFileSync(join(directory,name),typeof value==='string'?value:JSON.stringify(value,null,2));
 const env={...process.env,WRANGLER_SEND_METRICS:'false',ASTRO_TELEMETRY_DISABLED:'1',XDG_CONFIG_HOME:resolve('.wrangler/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs')};
 const command=async(args:string[])=>runOwnedCommand(process.execPath,args,{env,timeoutMs:90000,onOutput:text=>{requireLog+=text;}});
 let requireLog='',server:Awaited<ReturnType<typeof unstable_dev>>|undefined,site:ReturnType<typeof spawn>|undefined;
 const configEdit=createOwnedFileEdit('project.json',directory),indexEdit=createOwnedFileEdit('content/pages/rooms.json',directory);
 const paths=['content/rooms/task5-suite.json','content/rooms/task5-draft.json'];const sources=createCmsSources(paths,directory,{allowCreate:true});
 for(const path of paths)expect(sources.originalState(path).exists).toBe(false);
 const project=JSON.parse(configEdit.original.toString());const next=structuredClone(project);next.modules={...next.modules,rooms:true};
 const index=JSON.parse(indexEdit.original.toString());index.status='published';index.translations.el.status='published';
 const room=(id:string,status:string)=>({contentId:id,slug:id,status,title:'Worker Suite',description:'A public room.',body:'Room details.',seoDescription:'',maxGuests:2,bedDescription:'Double bed',images:[],amenities:[],imageCopy:[],amenityCopy:[],translations:{el:{status,title:'Σουίτα δοκιμής',description:'Δημόσιο δωμάτιο.',body:'Λεπτομέρειες.',seoDescription:'',bedDescription:'Διπλό κρεβάτι',imageCopy:[],amenityCopy:[]}}});
 const suite=room('task5-suite','published'),draft=room('task5-draft','draft');
 const state=join(directory,'state'),d1=join(state,'v3/d1/miniflare-D1DatabaseObject');mkdirSync(d1,{recursive:true});
 // Snapshot already initialized local D1 through SQLite backup (including committed WAL).
 const sourceD1=resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
 for(const file of readdirSync(sourceD1).filter(file=>file.endsWith('.sqlite'))){const db=new DatabaseSync(join(sourceD1,file),{readOnly:true});try{await backup(db,join(d1,file));}finally{db.close();}}
 const databasePath=readdirSync(d1).filter(file=>file.endsWith('.sqlite')).map(file=>join(d1,file)).find(file=>{const db=new DatabaseSync(file,{readOnly:true});try{return !!db.prepare("SELECT name FROM sqlite_master WHERE name='inquiry'").get();}finally{db.close();}});expect(databasePath).toBeTruthy();
 const sql=(query:string,...values:any[])=>{const db=new DatabaseSync(databasePath!,{readOnly:true});try{return db.prepare(query).all(...values);}finally{db.close();}};
 const startWorker=async()=>{const config=JSON.parse(readFileSync('wrangler.generated.json','utf8'));const entry=join(directory,'worker-proof.ts');writeFileSync(entry,`import real from ${JSON.stringify(resolve('worker/index.ts').replaceAll('\\','/'))};
const outboundCalls=[];globalThis.fetch=async(...args)=>{outboundCalls.push(String(args[0]));throw Error('Task5 outbound network forbidden');};
export default {fetch(request,env,ctx){if(new URL(request.url).pathname==='/api/__task5-proof')return Response.json({outboundCalls,sendingEnabled:env.SENDING_ENABLED});return real.fetch(request,env,ctx);}};`);config.main=entry;config.assets.directory=resolve('apps/site/dist');delete config.queues;delete config.triggers;const configPath=join(directory,'wrangler.json');writeFileSync(configPath,JSON.stringify(config));server=await unstable_dev(config.main,{config:configPath,port:ports.worker,inspectorPort:0,local:true,persist:true,persistTo:state,logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});};
 const proof:any={responses:[],requests:[],localD1:databasePath,sendingEnabled:false};
 const request=async(contextId:string,requestKey=crypto.randomUUID())=>{const response=await fetch('http://127.0.0.1:'+ports.worker+'/api/contact',{method:'POST',headers:{origin:'http://127.0.0.1:'+ports.site,'Content-Type':'application/json'},body:JSON.stringify({contextId,requestKey,name:'Task Five',email:'task5@example.com',message:'A local capture-only question about this context.',privacyAccepted:true,turnstileToken:'local'})});proof.responses.push({contextId,requestKey,status:response.status,body:await response.json()});proof.requests.push(requestKey);return response.status;};
 let stoppedSite=false,stoppedWorker=false,restoredSources=false,restoredConfig=false,restoredIndex=false;
 try{
  configEdit.replace(JSON.stringify(next,null,2)+'\n');indexEdit.replace(JSON.stringify(index,null,2)+'\n');sources.createAbsent(paths[0],suite,d=>d.contentId===suite.contentId);sources.createAbsent(paths[1],draft,d=>d.contentId===draft.contentId);
  await command(['scripts/configure.mjs']);const manifest=JSON.parse(readFileSync('.generated/manifest.json','utf8'));log('manifest-enabled.json',manifest);expect(manifest.enquiryContexts).toContainEqual({id:'task5-suite',kind:'rooms'});
  await startWorker();
  site=spawn(process.execPath,[resolve('apps/site/node_modules/astro/bin/astro.mjs'),'dev','--host','127.0.0.1','--port',String(ports.site)],{cwd:resolve('apps/site'),env,stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'});site.stdout!.on('data',d=>requireLog+=d);site.stderr!.on('data',d=>requireLog+=d);proof.sitePid=site.pid;
  await expect.poll(async()=>{try{return (await fetch('http://127.0.0.1:'+ports.site+'/en/contact')).status;}catch{return 0;}},{timeout:45000}).toBe(200);
  for(const [locale,title] of [['en','Worker Suite'],['el','Σουίτα δοκιμής']]){
   await page.goto('http://127.0.0.1:'+ports.site+'/'+locale+'/rooms/task5-suite');await page.getByRole('link',{name:locale==='en'?'Enquire about this room':'Ρωτήστε για αυτό το δωμάτιο'}).click();await expect(page.locator('#contextId')).toHaveValue('task5-suite');await expect(page.locator('#contextId option[value="task5-suite"]')).toHaveText(title);
   await page.goto('http://127.0.0.1:'+ports.site+'/'+locale+'/contact?contextId=unknown%3Cscript%3E');await expect(page.locator('#contextId')).toHaveValue('');
   await page.goto('http://127.0.0.1:'+ports.site+'/'+locale+'/contact?contextId=task5-draft');await expect(page.locator('#contextId')).toHaveValue('');
  }
  const offering=manifest.offerings[0].id;await page.goto('http://127.0.0.1:'+ports.site+'/en/contact?contextId='+offering);await expect(page.locator('#contextId')).toHaveValue(offering);
  const offeringKey=crypto.randomUUID(),roomKey=crypto.randomUUID();expect(await request(offering,offeringKey)).toBe(202);expect(await request('task5-suite',roomKey)).toBe(202);expect(await request('task5-suite',roomKey)).toBe(202);expect(await request('task5-draft')).toBe(400);expect(await request('unknown')).toBe(400);
  await expect.poll(()=>sql('SELECT COUNT(*) n FROM email_capture c JOIN email_job j ON j.id=c.job_id WHERE j.dedupe_key IN (?,?)','inquiry:'+offeringKey,'inquiry:'+roomKey)[0].n).toBe(2);
  proof.inquiries=sql('SELECT request_key,context_id,typeof(context_id) storage FROM inquiry WHERE request_key IN (?,?)',offeringKey,roomKey);expect(proof.inquiries).toHaveLength(2);expect(proof.inquiries.map((r:any)=>r.context_id).sort()).toEqual([offering,'task5-suite'].sort());expect(proof.inquiries.every((r:any)=>r.storage==='text')).toBe(true);
  proof.jobs=sql('SELECT id,dedupe_key,state,provider_message_id FROM email_job WHERE dedupe_key IN (?,?)','inquiry:'+offeringKey,'inquiry:'+roomKey);expect(proof.jobs.every((r:any)=>r.state==='accepted'&&r.provider_message_id==='local-'+r.id)).toBe(true);
  proof.captures=sql('SELECT c.job_id,c.recipient,c.subject FROM email_capture c JOIN email_job j ON j.id=c.job_id WHERE j.dedupe_key IN (?,?)','inquiry:'+offeringKey,'inquiry:'+roomKey);expect(proof.captures).toHaveLength(2);
  proof.network=await (await fetch('http://127.0.0.1:'+ports.worker+'/api/__task5-proof')).json();expect(proof.network).toEqual({outboundCalls:[],sendingEnabled:'false'});
  await server!.stop();server=undefined;
  expect(configEdit.restore()).toBe(true);restoredConfig=true;await command(['scripts/configure.mjs']);await startWorker();expect(await request('task5-suite')).toBe(400);proof.rejectedRows=sql('SELECT request_key FROM inquiry WHERE request_key IN (?,?,?)',proof.requests[3],proof.requests[4],proof.requests[5]);expect(proof.rejectedRows).toEqual([]);proof.disabledManifest=JSON.parse(readFileSync('.generated/manifest.json','utf8')).enquiryContexts;
 }finally{
  await cleanupCompositionPublic([
   async()=>{if(server){await server.stop();server=undefined;}stoppedWorker=true;},
   async()=>{if(site&&site.exitCode===null){const exited=new Promise(r=>site!.once('exit',r));if(process.platform==='win32')await promisify(execFile)('taskkill',['/PID',String(site.pid),'/T','/F'],{windowsHide:true});else process.kill(-site.pid!,'SIGTERM');await exited;}stoppedSite=true;},
   ()=>{sources.restore();restoredSources=true;},
   ()=>{if(!restoredConfig){configEdit.restore();restoredConfig=true;}},
   ()=>{indexEdit.restore();restoredIndex=true;},
   async()=>{if(stoppedSite&&stoppedWorker&&restoredSources&&restoredConfig&&restoredIndex)await command(['scripts/configure.mjs']);},
   ()=>{log('worker-proof.json',proof);log('commands.log',requireLog);log('cleanup.json',{stoppedSite,stoppedWorker,restoredSources,restoredConfig,restoredIndex});},
  ]);
 }
});
