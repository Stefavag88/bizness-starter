import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,appendFileSync,mkdtempSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createOwnedFileEdit} from './owned-file-edit.mjs';
import {runOwnedCommand} from './owned-command.mjs';
import {resolvePorts,assertPortsFree} from './ports.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function files(path){return existsSync(path)?readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(path,entry.name)):[join(path,entry.name)]):[];}
function assertOutput(root,local){
 const dist=join(root,'apps/site/dist');
 if(existsSync(join(dist,'design-system'))!==local)throw Error('Unexpected showcase output for '+(local?'local':'nonlocal')+' build');
 if(local&&!existsSync(join(dist,'design-system/index.html')))throw Error('Missing local showcase index');
 const manifest=join(root,'.generated/manifest.json');
 if(!existsSync(manifest)||readFileSync(manifest,'utf8').includes('design-system'))throw Error('Missing or leaked showcase manifest');
 for(const file of files(dist).filter(file=>/\.(html|xml|json)$/.test(file)&&!file.includes(join('dist','design-system')))){
  if(readFileSync(file,'utf8').includes('/design-system'))throw Error('Showcase navigation/feed output leaked: '+file);
 }
}
export async function verifyShowcaseBuilds({path='project.json',backupRoot='.generated/showcase-builds',run,refresh}={}){
 path=resolve(path);backupRoot=resolve(backupRoot);const root=dirname(path);
 const original=readFileSync(path),base=JSON.parse(original);let conflict=false;
 mkdirSync(backupRoot,{recursive:true});const evidenceDirectory=mkdtempSync(join(backupRoot,'run-'));
 writeFileSync(join(evidenceDirectory,'original.json'),original,{flag:'wx'});
 const evidence={originalHash:hash(original),stages:[],commands:[],restored:false,conflict:false};
 const proof=()=>{const value=JSON.stringify(evidence,null,2)+'\n';writeFileSync(join(evidenceDirectory,'evidence.json'),value);writeFileSync(join(backupRoot,'evidence.json'),value);};
 const command=async(args,cwd=root)=>{
  const timeoutMs=Number(process.env.SHOWCASE_BUILD_TIMEOUT_MS||120000);
  const record={args,cwd,timeoutMs,pid:null,passed:false};evidence.commands.push(record);proof();
  await runOwnedCommand(process.execPath,args,{cwd,timeoutMs,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},onStart:pid=>{record.pid=pid;proof();},onOutput:text=>{appendFileSync(join(evidenceDirectory,'commands.log'),text);process.stdout.write(text);}});record.passed=true;proof();
 };
 const build=async()=>{await command(['scripts/configure.mjs']);await command([join(root,'apps/site/node_modules/astro/bin/astro.mjs'),'build'],join(root,'apps/site'));};
 try{
  for(const environment of ['staging','production']){
   if(!existsSync(path)||!readFileSync(path).equals(original)){conflict=true;throw Error('Showcase source ownership conflict before mutation; original backup: '+join(evidenceDirectory,'original.json'));}
   const edit=createOwnedFileEdit(path,backupRoot);const next=structuredClone(base);next.environment=environment;
   try{edit.replace(JSON.stringify(next,null,2)+'\n');await (run??build)(environment);assertOutput(root,false);evidence.stages.push(environment);}
   finally{try{edit.restore();}catch(error){conflict=true;throw error;}}
  }
 }catch(error){evidence.error=error.message;throw error;}
 finally{
  if(!existsSync(path)||!readFileSync(path).equals(original))conflict=true;
  evidence.conflict=conflict;evidence.restored=!conflict;
  try{if(!conflict){await (refresh??build)();if(!existsSync(path)||!readFileSync(path).equals(original)){evidence.conflict=true;evidence.restored=false;throw Error('Showcase source ownership conflict during final local build; preserved current source and original backup: '+join(evidenceDirectory,'original.json'));}assertOutput(root,true);evidence.stages.push('local');evidence.finalHash=hash(readFileSync(path));}}finally{proof();}
 }
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){await assertPortsFree(resolvePorts());await verifyShowcaseBuilds();}
