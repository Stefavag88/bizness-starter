import {appendFileSync,mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {canonicalSnapshot,assertCanonicalSnapshot} from './composition-c-snapshot.mjs';
import {runOwnedCommand} from './owned-command.mjs';
import {assertPortsFree,resolvePorts} from './ports.mjs';
/** Owns only subprocesses created here, with timeout cleanup delegated to runOwnedCommand. */
export function createMediaAcceptanceRun({root=process.cwd(),expected,isStopped=()=>true,checkPorts=()=>assertPortsFree(resolvePorts())}={}){
 root=resolve(root);const before=canonicalSnapshot(root);expected??=()=>before;
 const parent=join(root,'.generated/media-optimization');mkdirSync(parent,{recursive:true});const directory=mkdtempSync(join(parent,'acceptance-'));
 const commands=[],log=(name,value)=>writeFileSync(join(directory,name),JSON.stringify(value,null,2)+'\n');
 log('canonical-before.json',before);log('commands.json',commands);
 const assertInputs=()=>assertCanonicalSnapshot(expected(),root);
 let active=false;
 async function command(args,{cwd=root,timeoutMs=1800000,env={}}={}){
  if(active||!isStopped())throw Error('Owned runtime shutdown unconfirmed; command refused');
  assertInputs();await checkPorts();assertInputs();
  const row={executable:process.execPath,args,cwd,started:new Date().toISOString(),ended:null,pid:null,passed:false,log:`command-${commands.length+1}.log`};commands.push(row);log('commands.json',commands);active=true;
  try{await runOwnedCommand(process.execPath,args,{cwd,timeoutMs,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:join(directory,'config'),WRANGLER_LOG_PATH:join(directory,'wrangler-logs'),...env},onStart:pid=>{row.pid=pid;log('commands.json',commands);},onOutput:text=>{appendFileSync(join(directory,row.log),text);process.stdout.write(text);}});assertInputs();row.passed=true;}
  catch(error){row.error=String(error);throw error;}
  finally{active=false;row.ended=new Date().toISOString();log('commands.json',commands);}
 }
 return {directory,assertInputs,command,configure:()=>command(['scripts/configure.mjs']),build:(args=[])=>command(['apps/site/scripts/build.mjs',...args]),finish(){const after=canonicalSnapshot(root),unchanged=isDeepStrictEqual(before,after);log('restoration.json',{before,after,unchanged,commands});if(active||!isStopped())throw Error('Owned runtime shutdown unconfirmed');if(!unchanged)throw Error('Full canonical project/content/uploads snapshot conflict; acceptance failed');return {directory,unchanged};}};
}
/** Task 6 supplies real static/native matrix implementations; unavailable phases cannot false-pass. */
export async function verifyMediaOptimization({phase='pure',root=process.cwd(),checkPorts}={}){
 if(!['pure','smoke'].includes(phase))throw Error(`Media acceptance phase ${phase} not implemented; refused before mutation`);
 const run=createMediaAcceptanceRun({root,checkPorts});let failure;
 try{if(phase==='pure')await run.command(['node_modules/vitest/vitest.mjs','run','tests/media-optimization-cleanup.test.ts']);else await run.command(['-e',"console.log('Media acceptance no-mutation smoke')"]);}
 catch(error){failure=error;}
 const result=run.finish();if(failure)throw failure;return result;
}
