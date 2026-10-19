import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createOwnedFileEdit} from '../../scripts/owned-file-edit.mjs';
import {createWorkerEdit,createWorkerLifecycle} from './composition-c-worker-lifecycle';
import {canonicalSnapshot,assertCanonicalSnapshot} from '../../scripts/composition-c-snapshot.mjs';
import {runOwnedCommand} from '../../scripts/owned-command.mjs';
import {assertPortsFree,resolvePorts} from '../../scripts/ports.mjs';
import {createCmsSources} from './cms-source-ownership';
export async function acceptanceOwner(label:string) {
 await assertPortsFree(resolvePorts());
 mkdirSync('.generated/composition-c-task6',{recursive:true});const directory=mkdtempSync(resolve('.generated/composition-c-task6/'+label+'-'));
 const before=canonicalSnapshot(),base=JSON.parse(readFileSync('project.json','utf8'));
 const edits=['project.json','content/pages/rooms.json'].map(path=>{const edit=createOwnedFileEdit(path,directory);return {path,edit,owner:createWorkerEdit(edit,()=>readFileSync(path))};});
 const paths=['content/rooms/task6-suite.json','content/rooms/task6-text.json','content/rooms/task6-malformed.json'];
 const sources=createCmsSources(paths,directory,{allowCreate:true});for(const path of paths)if(sources.originalState(path).exists)throw Error('Task6 fixture exists');
 let expected=before,stop=async()=>{},stopped=true;const commands:any[]=[];
 const log=(name:string,value:any)=>writeFileSync(join(directory,name),typeof value==='string'?value:JSON.stringify(value,null,2));
 const command=async(args:string[],cwd=process.cwd())=>{await assertPortsFree(resolvePorts());if(!stopped)throw Error('Owned runtime shutdown unconfirmed');assertCanonicalSnapshot(expected);const record:any={args,cwd,started:new Date().toISOString(),passed:false};commands.push(record);log('commands.json',commands);await runOwnedCommand(process.execPath,args,{cwd,timeoutMs:180000,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:resolve('.wrangler/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs')},onStart:pid=>record.pid=pid,onOutput:text=>appendFileSync(join(directory,'commands.log'),text)});record.passed=true;record.ended=new Date().toISOString();assertCanonicalSnapshot(expected);log('commands.json',commands);};
 const lifecycle=createWorkerLifecycle({stopWorker:async()=>{await stop();stopped=true;},stopSite:async()=>{},restoreSources:()=>sources.restore(),restoreConfig:()=>edits[0].owner.restore(),restoreIndex:()=>edits[1].owner.restore(),assertInputs:()=>assertCanonicalSnapshot(before),configure:async()=>{expected=before;await command(['scripts/configure.mjs']);},record:state=>log('cleanup.json',{...state,before,after:canonicalSnapshot(),commands})});
 return {directory,base,paths,sources,log,command,
  mutate(project:any,index:any,rooms:any[]=[]){assertCanonicalSnapshot(before);edits[0].owner.replace(JSON.stringify(project,null,2)+'\n');edits[1].owner.replace(typeof index==='string'?index:JSON.stringify(index,null,2)+'\n');rooms.forEach((room,i)=>sources.createAbsent(paths[i],room,()=>true));expected=canonicalSnapshot();log('snapshot-mode.json',expected);},
  started(shutdown:()=>Promise<void>){const runtime={started:new Date().toISOString(),stopped:null as string|null,shutdownConfirmed:false};log('runtime.json',runtime);stop=async()=>{await shutdown();runtime.stopped=new Date().toISOString();runtime.shutdownConfirmed=true;log('runtime.json',runtime);};stopped=false;lifecycle.workerStarted();},
  async stop(){await lifecycle.stop();},
  async cleanup(){await lifecycle.cleanup();assertCanonicalSnapshot(before);},
 };
}
export function publicIndex(){const index=JSON.parse(readFileSync('content/pages/rooms.json','utf8'));index.status='published';index.translations.el.status='published';return index;}
export function publicRoom(id:string,images=true){const copy=(el=false)=>({status:'published',title:el?'Σουίτα δοκιμής':'Task Six Suite',description:el?'Δημόσιο **δωμάτιο**.':'A public **room**.',body:el?'Λεπτομέρειες με [επικοινωνία](/contact).':'Details with a safe [contact link](/contact).',seoDescription:'',bedDescription:el?'Διπλό κρεβάτι':'Double bed',imageCopy:images?[{id:'landscape',alt:el?'Αφηρημένο τοπίο':'Abstract landscape',caption:el?'Λεζάντα':'Caption'}]:[],amenityCopy:[{id:'wifi',label:el?'Ασύρματο δίκτυο':'Wi-Fi'}]});return {contentId:id,slug:id,...copy(),maxGuests:2,images:images?[{id:'landscape',media:{src:'/uploads/starter-samples/abstract-landscape.png',crop:'top'}}]:[],amenities:[{id:'wifi'}],translations:{el:copy(true)}};}
export const astro=resolve('apps/site/node_modules/astro/bin/astro.mjs');
