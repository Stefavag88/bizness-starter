import {readFileSync,readdirSync,existsSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createMediaOptimizationFixture} from './media-optimization-fixture';
import {createMediaAcceptanceRun} from '../../scripts/media-optimization-acceptance.mjs';
import {publicIndex,publicRoom} from './composition-c-acceptance';
export const photoNames=['large-photo.jpg','portrait.jpg','alpha.png','small.png','animated.webp'];
export const upload=(name:string)=>'/uploads/media-acceptance-'+name;
export const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export const walk=(path:string):string[]=>existsSync(path)?readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(path,e.name)):[join(path,e.name)]):[];
export function writeEvidence(directory:string,name:string,value:unknown){writeFileSync(join(directory,name),JSON.stringify(value,null,2)+'\n');}
export function mediaPage(){
 const sections:any[]=[{id:'intro',_template:'hero',variant:'default',enabled:true,appearance:{surface:'default'}}];
 for(const variant of ['default','featured'])for(let count=1;count<=4;count++)sections.push({id:'gallery_'+variant+'_'+count,_template:'gallery',variant,enabled:true,appearance:{surface:'default'},items:Array.from({length:count},(_,i)=>({id:'image_'+i,media:{src:upload('large-photo.jpg'),crop:['center','top','bottom'][i%3]}}))});
 for(const [i,name]of photoNames.entries())sections.push({id:'media_'+i,_template:'media-text',variant:i%2?'reversed':'default',enabled:true,appearance:{surface:'default'},media:{src:upload(name),crop:['center','top','bottom'][i%3]}});
 const copy=(el=false)=>({sections:sections.map(s=>({id:s.id,_template:s._template,...(s._template==='hero'?{title:el?'Δοκιμή εικόνων':'Media acceptance',description:''}:s._template==='gallery'?{title:s.id,description:'',items:s.items.map((item:any)=>({id:item.id,alt:(el?'Εικόνα ':'Photo ')+item.id,caption:el?'Λεζάντα **εικόνας**':'Photo **caption**'}))}:{title:s.id,body:el?'Κείμενο **δοκιμής**.':'Retained **body**.',image:{alt:(el?'Εικόνα ':'Photo ')+s.id,caption:el?'Λεζάντα **εικόνας**':'Photo **caption**'}})}))});
 return {contentId:'media_acceptance',_template:'standard',slug:'media-acceptance',status:'published',meta:{title:'Media acceptance',seoDescription:''},sections,copy:copy(),translations:{el:{status:'published',meta:{title:'Δοκιμή εικόνων',seoDescription:''},copy:copy(true)}}};
}
export function staticOwner(mode:{environment:string;theme:string;density:string;rooms:number;profile:string;articles:boolean;enabled:boolean},{root=process.cwd()}:{root?:string}={}){
 const page='content/pages/media_acceptance.json',roomPaths=Array.from({length:mode.rooms},(_,i)=>'content/rooms/media-acceptance-'+i+'.json');
 const documents=[page,'content/pages/rooms.json',...roomPaths];
 const fixture=createMediaOptimizationFixture({root,documents,media:photoNames.map(name=>({path:'apps/site/public'+upload(name),documents:[page,...roomPaths]}))});
 const base=JSON.parse(readFileSync(join(root,'project.json'),'utf8'));
 let stopped=true;
 const run=createMediaAcceptanceRun({root,expected:fixture.expectedSnapshot,isStopped:()=>stopped});
 function setup(){
 for(const name of photoNames)fixture.createMedia('apps/site/public'+upload(name),readFileSync('tests/fixtures/media-optimization/'+name));
 fixture.createDocument(page,mediaPage());fixture.replaceDocument('content/pages/rooms.json',JSON.stringify(publicIndex(),null,2)+'\n');
 roomPaths.forEach((path,i)=>{const room=publicRoom('media-acceptance-'+i);room.images[0].media.src=upload('large-photo.jpg');fixture.createDocument(path,room);});
 fixture.replaceProject(JSON.stringify({...base,environment:mode.environment,profile:mode.profile,articles:mode.articles,modules:{...base.modules,rooms:mode.rooms>0},design:{theme:mode.theme,density:mode.density},media:{optimization:{enabled:mode.enabled}}},null,2)+'\n');
 }
 return {fixture,run,setup,started(){stopped=false;},stopped(){stopped=true;}};
}
export function outputDemand(){const html=walk('apps/site/dist').filter(p=>p.endsWith('.html'));const demanded=[...new Set(html.flatMap(p=>readFileSync(p,'utf8').match(/\/_media\/v1\/[a-f0-9]+\.(?:webp|png|jpg|jpeg)/g)||[]))].sort();const published=walk('apps/site/dist/_media').map(p=>'/'+p.replaceAll('\\','/').replace('apps/site/dist/','')).sort();return {demanded,published};}
export async function workerFor(directory:string){
 const {unstable_dev}=await import('wrangler');
 const entry=join(directory,'static-worker.ts');
 writeFileSync(entry,`import real from ${JSON.stringify(resolve('worker/index.ts').replaceAll('\\','/'))};\nexport default {async fetch(request,env,ctx){const response=await real.fetch(request,env,ctx);const out=new Response(response.body,response);out.headers.set('X-Media-Acceptance-Worker','1');return out;}};`);
 const config=JSON.parse(readFileSync('wrangler.generated.json','utf8'));config.main=entry;config.assets.directory=resolve('apps/site/dist');for(const key of ['d1_databases','queues','triggers','workflows'])delete config[key];writeEvidence(directory,'static-worker.json',config);
 return unstable_dev(entry,{config:join(directory,'static-worker.json'),port:0,inspectorPort:0,local:true,persist:true,persistTo:join(directory,'runtime'),logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
}
