import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runOwnedCommand} from '../../scripts/owned-command.mjs';
import {mediaRuntime} from './media-optimization-runtime';
import {copy} from '../../tests/fixtures/newsletter-copy';
import {expect} from '@playwright/test';
export async function newsletterFixture(label:string){
 const directory=join(process.env.NEWSLETTER_DIRECTORY!,label);mkdirSync(directory,{recursive:true});const root=join(directory,'fixture');mkdirSync(root);
 const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
 for(const file of files){if(!existsSync(file))continue;const target=join(root,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);}
 symlinkSync(resolve('node_modules'),join(root,'node_modules'),'junction');symlinkSync(resolve('apps/site/node_modules'),join(root,'apps/site/node_modules'),'junction');
 // Detached dev roots share only trusted installed dependencies, not original content.
 const astroConfig=join(root,'apps/site/astro.config.mjs');writeFileSync(astroConfig,readFileSync(astroConfig,'utf8').replace('server:{strictPort:true,proxy',`server:{fs:{allow:[projectRoot,${JSON.stringify(resolve('node_modules'))}]},strictPort:true,proxy`));
 const project=JSON.parse(readFileSync(join(root,'project.json'),'utf8'));Object.assign(project,{profile:'newsletter',modules:{...project.modules,newsletterPrompt:true,visitorPreferences:true},interests:[{id:'updates',label:'Updates'},{id:'guides',label:'Guides'}]});project.design.motion={enabled:true,durationMs:600,distancePx:18,staggerMs:70,interactionMs:180};project.infrastructure.sendingEnabled=false;project.infrastructure.marketingEnabled=false;
 const sourcePath=join(root,'content/settings/site.json');const settings=JSON.parse(readFileSync(sourcePath,'utf8'));settings.newsletterPrompt={...copy,enabled:true,modalEnabled:true,autoOpen:true,footerMode:'inline',delaySeconds:5,dismissDays:30,acceptedDays:180,interestId:'updates'};settings.translations.el.newsletterPrompt={...copy,title:'Χρήσιμες ενημερώσεις',footerPrompt:'Λάβετε **ενημερώσεις**.',emailLabel:'Email',submitLabel:'Εγγραφή',consentLabel:'Συμφωνώ να λαμβάνω ενημερώσεις.',privacyLinkLabel:'Απόρρητο',dismissLabel:'Κλείσιμο',successTitle:'Ελέγξτε το email σας',successBody:'Εάν χρειάζεται, επιβεβαιώστε την εγγραφή μέσω email.'};
 writeFileSync(join(root,'project.json'),JSON.stringify(project,null,2));writeFileSync(sourcePath,JSON.stringify(settings,null,2));
 const commands:any[]=[];
 async function command(args:string[]){const row:any={args,started:Date.now()};commands.push(row);try{const output=await runOwnedCommand(process.execPath,args,{cwd:root,timeoutMs:150000,onStart:pid=>row.pid=pid});row.exitCode=0;return output.stdout;}catch(error){row.exitCode=1;throw error;}finally{row.ended=Date.now();writeFileSync(join(directory,'commands.json'),JSON.stringify(commands,null,2));}}
 let runtime:ReturnType<typeof mediaRuntime>|undefined;let generation=0;
 async function start(){runtime=mediaRuntime(directory,'dev-'+generation++,['scripts/dev.mjs','--cms'],root);await expect.poll(()=>runtime!.output(),{timeout:150000}).toContain('TinaCMS Dev Server is active');await expect.poll(async()=>{try{return(await fetch('http://127.0.0.1:8790/api/health')).status;}catch{return 0;}},{timeout:60000}).toBe(200);await expect.poll(async()=>{try{return(await fetch('http://127.0.0.1:4330/en')).status;}catch{return 0;}},{timeout:60000}).toBe(200);}
 async function stop(){await runtime?.stop();runtime=undefined;}
 async function sql(query:string){const output=await command(['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.generated.json','--command',query,'--json']);return JSON.parse(output)[0].results;}
 return {directory,root,project,settings,sourcePath,command,start,stop,sql,base:'http://127.0.0.1:8790',cms:'http://127.0.0.1:4330'};
}
