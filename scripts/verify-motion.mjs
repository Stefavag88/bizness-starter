import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {runOwnedCommand} from './owned-command.mjs';
const root=process.cwd();
export function motionInventory(){
 const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString().split('\0').filter(Boolean).sort();
 return Object.fromEntries(files.map(path=>[path,createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')]));
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('scripts/verify-motion.mjs')){
 mkdirSync('.generated/motion',{recursive:true});const directory=mkdtempSync(resolve('.generated/motion/acceptance-'));
 const before=motionInventory();writeFileSync(join(directory,'inputs.json'),JSON.stringify(before,null,2));
 const command={args:['test','e2e/motion.spec.ts'],started:new Date().toISOString(),pid:null,ended:null,exitCode:null};
 let failure;
 try{await runOwnedCommand(process.execPath,[resolve('node_modules/@playwright/test/cli.js'),...command.args],{timeoutMs:600000,env:{...process.env,MOTION_DIRECTORY:directory,PLAYWRIGHT_BROWSERS_PATH:resolve('.generated/browsers')},onStart:pid=>command.pid=pid,onOutput:text=>process.stdout.write(text)});command.exitCode=0;}
 catch(error){failure=error;command.exitCode=1;}
 finally{command.ended=new Date().toISOString();writeFileSync(join(directory,'command.json'),JSON.stringify(command,null,2));const after=motionInventory();writeFileSync(join(directory,'inputs-after.json'),JSON.stringify(after,null,2));if(JSON.stringify(before)!==JSON.stringify(after))failure??=Error('Source inventory changed during detached acceptance');}
 console.log('Motion evidence: '+directory);if(failure)throw failure;
}
