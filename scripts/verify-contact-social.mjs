import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createMediaAcceptanceRun} from './media-optimization-acceptance.mjs';
import {join} from 'node:path';
const args=process.argv.slice(2).filter(x=>x!=='--');
if(args.length!==1||!['--public','--native'].includes(args[0]))throw Error('Usage: pnpm test:contact-social -- --public|--native');
const run=createMediaAcceptanceRun();let failure;const invocation={executable:process.execPath,args:process.argv.slice(1),cwd:process.cwd(),pid:process.pid,started:new Date().toISOString(),ended:null,exitCode:null};writeFileSync(join(run.directory,'invocation.json'),JSON.stringify(invocation,null,2));
const walk=p=>existsSync(p)?readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name)]):[];
const inputs=['package.json','pnpm-lock.yaml','project.json',...['packages','apps/site/src','tina/collections','tina/fields','scripts','tests','e2e'].flatMap(walk)].filter(p=>!/(__generated__|node_modules)/.test(p));
writeFileSync(join(run.directory,'source-hashes.json'),JSON.stringify(Object.fromEntries(inputs.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),null,2));
try{await run.command(['node_modules/@playwright/test/cli.js','test',args[0]==='--public'?'e2e/contact-social.spec.ts':'e2e/contact-social-cms.spec.ts','--reporter=list','--output='+join(run.directory,'browser-results')],{env:{CONTACT_ACCEPTANCE_DIRECTORY:run.directory,PLAYWRIGHT_BROWSERS_PATH:join(process.cwd(),'.generated/browsers')}});}catch(error){failure=error;}
try{run.finish();}catch(error){failure??=error;}invocation.ended=new Date().toISOString();invocation.exitCode=failure?1:0;writeFileSync(join(run.directory,'invocation.json'),JSON.stringify(invocation,null,2));console.log('Contact/social evidence: '+run.directory);if(failure)throw failure;
