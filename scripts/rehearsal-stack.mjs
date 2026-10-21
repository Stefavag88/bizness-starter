import {spawn,execFileSync} from 'node:child_process';import {join} from 'node:path';import {appendFileSync} from 'node:fs';import {assertPortsFree,resolvePorts} from './ports.mjs';
export async function withRehearsalStack(root,{env=process.env,log,ready='/templates',cms=false},run){
 const ports=resolvePorts(env);await assertPortsFree(ports);
 const child=spawn(process.execPath,[join(root,'scripts/dev.mjs'),...(cms?['--cms']:[])],{cwd:root,env,stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'});
 for(const stream of [child.stdout,child.stderr])stream.on('data',bytes=>appendFileSync(log,bytes));
 let spawnError;child.on('error',error=>spawnError=error);
 try{
  const deadline=Date.now()+180000;
  while(true){if(spawnError)throw spawnError;if(child.exitCode!==null)throw Error('Owned launcher exited: '+child.exitCode);try{if((await fetch('http://127.0.0.1:'+ports.site+ready,{signal:AbortSignal.timeout(1500)})).ok)break;}catch{}if(Date.now()>deadline)throw Error('Owned stack readiness timed out; '+log);await new Promise(resolve=>setTimeout(resolve,500));}
  return await run();
 }finally{
  if(child.pid&&child.exitCode===null){if(process.platform==='win32')execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else process.kill(-child.pid,'SIGTERM');}
 }
}
