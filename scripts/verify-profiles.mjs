import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {createOwnedFileEdit} from './owned-file-edit.mjs';
import {runOwnedCommand} from './owned-command.mjs';
import {resolvePorts,assertPortsFree} from './ports.mjs';
export async function verifyProfiles({path='project.json',backupRoot='.generated/profile-backups',run=runProfile,refresh=()=>command(['scripts/configure.mjs'])}={}){
 const original=readFileSync(path);const base=JSON.parse(original);let conflict=false;
 try{
  for(const [profile,articles]of [['enquiries',true],['newsletter',true],['nurture',true],['enquiries',false],['newsletter',false],['nurture',false]]){
   if(!readFileSync(path).equals(original))throw Error('Profile source changed before mutation');
   const edit=createOwnedFileEdit(path,backupRoot);const next=structuredClone(base);next.profile=profile;next.articles=articles;next.environment='local';next.infrastructure.sendingEnabled=false;next.infrastructure.marketingEnabled=false;
   edit.replace(JSON.stringify(next,null,2)+'\n');
   try{await run(profile,articles);}finally{try{edit.restore();}catch(error){conflict=true;throw error;}}
  }
 }finally{if(!conflict)await refresh();}
}
const execute=promisify(execFile);
async function command(args,extra={},cwd=process.cwd()){
 mkdirSync('.generated/evidence',{recursive:true});
 const label=args.join(' ');console.log('Profile stage: '+label);
 const timeoutMs=Number(process.env.PROFILE_STAGE_TIMEOUT_MS||120000);
 let indexing=false;
 return runOwnedCommand(process.execPath,args,{cwd,timeoutMs,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:resolve('.wrangler/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs'),...extra},onOutput:text=>{
  appendFileSync('.generated/evidence/profile-commands.log',text);
  if(text.includes('Indexing local files')){if(!indexing)console.log('Native content indexing...');indexing=true;}else process.stdout.write(text);
 }});
}
async function runProfile(profile,articles){
 console.log('Verifying '+profile+', articles='+articles);
 await command(['scripts/configure.mjs']);
 await command(['scripts/dev.mjs','--cms-build']);
 await command([resolve('apps/site/scripts/build.mjs')],{},resolve('apps/site'));
 await command(['scripts/wrangler.mjs','deploy','--dry-run','--config','wrangler.generated.json']);
 if(!articles)for(const lang of ['en','el'])if(existsSync(`apps/site/dist/${lang}/insights`)||existsSync(`apps/site/dist/${lang}/feed.xml`))throw Error('Disabled article outputs leaked');
 await command(['scripts/wrangler.mjs','d1','migrations','apply','DB','--local','--config','wrangler.generated.json']);
 const ports=resolvePorts();await assertPortsFree({worker:ports.worker});
 const child=spawn(process.execPath,['scripts/wrangler.mjs','dev','--local','--ip','127.0.0.1','--port',String(ports.worker),'--inspector-port','0','--config','wrangler.generated.json'],{stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32',env:{...process.env,WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:resolve('.wrangler/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs')}});
 let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);const exited=new Promise(r=>child.once('exit',r));
 try{
  const until=Date.now()+45000;let ready=false;while(Date.now()<until){if(child.exitCode!==null)throw Error(output);try{if((await fetch(`http://127.0.0.1:${ports.worker}/api/health`)).ok){ready=true;break;}}catch{}await delay(150);}if(!ready)throw Error('Profile Worker did not start: '+output);
  await command([resolve('node_modules/@playwright/test/cli.js'),'test','e2e/foundation-profiles.spec.ts'],{E2E_BASE_URL:`http://127.0.0.1:${ports.worker}`,E2E_PROFILE:profile,E2E_ARTICLES:String(articles)});
 }finally{
  if(child.exitCode===null){if(process.platform==='win32')await execute('taskkill',['/PID',String(child.pid),'/T','/F']);else process.kill(-child.pid,'SIGTERM');await exited;}
 }
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 mkdirSync('.generated',{recursive:true});try{await assertPortsFree(resolvePorts());await verifyProfiles();writeFileSync('.generated/profile-verification.json',JSON.stringify({passed:true,profiles:['enquiries','newsletter','nurture'],articlesDisabled:true},null,2));}catch(error){writeFileSync('.generated/profile-verification.json',JSON.stringify({passed:false,error:error.message},null,2));throw error;}
}
