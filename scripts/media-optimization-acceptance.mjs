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
 async function command(args, {cwd = root, timeoutMs = 1800000, env = {}} = {}) {
  if (active) throw Error('Owned runtime shutdown unconfirmed; command refused');
  // Admission includes asynchronous gates, not only the spawned child lifetime.
  active = true;
  let row;
  try {
   if (!isStopped()) throw Error('Owned runtime shutdown unconfirmed; command refused');
   assertInputs();
   await checkPorts();
   if (!isStopped()) throw Error('Owned runtime shutdown unconfirmed; command refused');
   assertInputs();
   row = {
    executable: process.execPath, args, cwd,
    started: new Date().toISOString(), ended: null, pid: null, exitCode: null, passed: false,
    log: `command-${commands.length + 1}.log`,
   };
   commands.push(row);
   log('commands.json', commands);
   await runOwnedCommand(process.execPath, args, {
    cwd, timeoutMs,
    env: {
     ...process.env, ASTRO_TELEMETRY_DISABLED: '1', WRANGLER_SEND_METRICS: 'false',
     XDG_CONFIG_HOME: join(directory, 'config'),
     WRANGLER_LOG_PATH: join(directory, 'wrangler-logs'), ...env,
    },
    onStart: pid => {
     row.pid = pid;
     log('commands.json', commands);
    },
    onOutput: text => {
     appendFileSync(join(directory, row.log), text);
     process.stdout.write(text);
    },
   });
   assertInputs();
   row.passed = true;
   row.exitCode = 0;
  } catch (error) {
   if (row) { row.error = String(error); const exit = /Command exit (\d+)/.exec(String(error)); if (exit) row.exitCode = Number(exit[1]); }
   throw error;
  } finally {
   try {
    if (row) {
     row.ended = new Date().toISOString();
     log('commands.json', commands);
    }
   } finally {
    active = false;
   }
  }
 }
 return {directory,assertInputs,command,configure:()=>command(['scripts/configure.mjs']),build:(args=[])=>command(['apps/site/scripts/build.mjs',...args]),finish(){const after=canonicalSnapshot(root),unchanged=isDeepStrictEqual(before,after);log('restoration.json',{before,after,unchanged,commands});if(active||!isStopped())throw Error('Owned runtime shutdown unconfirmed');if(!unchanged)throw Error('Full canonical project/content/uploads snapshot conflict; acceptance failed');return {directory,unchanged};}};
}
/** Separate transformed browser phases keep native TS helpers out of the Node import graph. */
export async function verifyMediaOptimization({phase='pure',root=process.cwd(),checkPorts}={}){
 if(!['pure','smoke','static','native'].includes(phase))throw Error(`Unknown media acceptance phase: ${phase}`);
 const run=createMediaAcceptanceRun({root,checkPorts});let failure;
 writeFileSync(join(run.directory,'phase.json'),JSON.stringify({phase,started:new Date().toISOString()},null,2)+'\n');
 try{
  if(phase==='pure')await run.command(['node_modules/vitest/vitest.mjs','run','tests/media-optimization-cleanup.test.ts','tests/media-optimization.test.ts','tests/media-cache.test.ts','tests/media-session.test.ts','tests/media-layout.test.ts','tests/media-runtime.test.ts','tests/media-acceptance-harness.test.ts','tests/media-source.test.ts','tests/media-contract.test.ts','tests/media-integration.test.ts']);
  else if(phase==='smoke')await run.command(['-e',"console.log('Media acceptance no-mutation smoke')"]);
  else await run.command(['node_modules/@playwright/test/cli.js','test',phase==='static'?'e2e/media-optimization.spec.ts':'e2e/media-optimization-cms.spec.ts','--reporter=list','--output='+join(run.directory,'browser-results')],{env:{MEDIA_ACCEPTANCE_PHASE:phase,MEDIA_ACCEPTANCE_DIRECTORY:run.directory,PLAYWRIGHT_BROWSERS_PATH:join(root,'.generated/browsers')}});
 }catch(error){failure=error;}
 const result=run.finish();if(failure)throw failure;return result;
}
