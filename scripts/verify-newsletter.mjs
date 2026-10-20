import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {runOwnedCommand} from './owned-command.mjs';
const inventory=()=>Object.fromEntries(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean).sort().map(path=>[path,existsSync(path)?createHash('sha256').update(readFileSync(path)).digest('hex'):'deleted']));
mkdirSync('.generated/newsletter',{recursive:true});const directory=mkdtempSync(resolve('.generated/newsletter/acceptance-'));const before=inventory();writeFileSync(join(directory,'inputs.json'),JSON.stringify(before,null,2));
const command={args:['test','e2e/newsletter.spec.ts','e2e/newsletter-cms.spec.ts',...(process.argv.includes('--public-only')?['--grep','public']:process.argv.includes('--preferences-only')?['--grep','live-tab']:process.argv.includes('--lifecycle-only')?['--grep','cached navigation']:[])],started:new Date().toISOString(),pid:null,ended:null,exitCode:null};let failure;
try{await runOwnedCommand(process.execPath,[resolve('node_modules/@playwright/test/cli.js'),...command.args],{timeoutMs:1200000,env:{...process.env,NEWSLETTER_DIRECTORY:directory,PLAYWRIGHT_BROWSERS_PATH:resolve('.generated/browsers')},onStart:pid=>command.pid=pid,onOutput:text=>process.stdout.write(text)});command.exitCode=0;}catch(error){failure=error;command.exitCode=1;}
finally{command.ended=new Date().toISOString();writeFileSync(join(directory,'command.json'),JSON.stringify(command,null,2));const after=inventory();writeFileSync(join(directory,'inputs-after.json'),JSON.stringify(after,null,2));if(JSON.stringify(before)!==JSON.stringify(after))failure??=Error('Source inventory changed during acceptance');}
console.log('Newsletter evidence: '+directory);if(failure)throw failure;
