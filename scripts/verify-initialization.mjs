import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
import {initializeProject} from './initialize/initialize.mjs';import {snapshotApplication} from './initialize/snapshot.mjs';import {runOwnedCommand} from './owned-command.mjs';import {assertPresetArtifacts} from './verify-presets.mjs';
export const initializationCases=Object.freeze([
 {preset:'neutral',languages:['en','el'],defaultLanguage:'en'},
 {preset:'professional-services',languages:['el'],defaultLanguage:'el',articles:false},
 {preset:'trades',languages:['en','el'],defaultLanguage:'el'},
 {preset:'accommodation',languages:['en','el'],defaultLanguage:'en'},
 {preset:'studio',languages:['en'],defaultLanguage:'en',articles:false},
]);
export async function verifyInitialization({root=process.cwd()}={}){
 root=resolve(root);const source=snapshotApplication(root);
 const directory=mkdtempSync(join(dirname(root),'.starter-rehearsal-'));
 const report={directory,started:new Date().toISOString(),clients:[],passed:false};
 const proof=()=>writeFileSync(join(directory,'evidence.json'),JSON.stringify(report,null,2)+'\n');proof();
 const pnpm=process.env.npm_execpath;if(!pnpm||!existsSync(pnpm))throw Error('Run this verifier using pnpm test:initialization');
 try{
 for(const scenario of initializationCases){
  source.assertUnchanged();const destination=join(directory,scenario.preset);
  const client={...scenario,destination,commands:[],passed:false};report.clients.push(client);proof();
  await initializeProject({source:root,options:{...scenario,name:'rehearsal-'+scenario.preset,destination}});
  assert.equal(execFileSync('git',['-C',destination,'remote'],{encoding:'utf8'}),'');assert.equal(execFileSync('git',['-C',destination,'rev-list','--all'],{encoding:'utf8'}),'');
  for(const denied of ['.starter-tools.json','packages/presets','scripts/create-project.mjs','apps/site/src/presets','.env','.dev.vars','.wrangler'])assert.equal(existsSync(join(destination,denied)),false,denied);
  const project=JSON.parse(readFileSync(join(destination,'project.json'),'utf8'));assert.equal(project.environment,'local');assert.equal(project.profile,'enquiries');assert.equal(project.infrastructure.sendingEnabled,false);assert.equal(project.legalReviewed,false);assert.equal(project.contentReviewed,false);
  for(const args of [['install','--frozen-lockfile'],['check'],['test'],['build'],['worker:check']]){
   const entry={args,passed:false};client.commands.push(entry);proof();
   const result=await runOwnedCommand(process.execPath,[pnpm,...args],{cwd:destination,timeoutMs:300000,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'},onOutput:text=>process.stdout.write(text)});
   writeFileSync(join(directory,scenario.preset+'-'+args[0]+'.log'),result.stdout+result.stderr);entry.passed=true;proof();
   if(args[0]==='test'&&scenario.preset==='neutral'){
    const path=join(destination,'project.json'),original=readFileSync(path),configured=JSON.parse(original);
    configured.infrastructure.runtimeBudget={dailyDispatchLimit:10,transactionalReserve:2};const next=Buffer.from(JSON.stringify(configured,null,2)+'\n');writeFileSync(path,next);
    const allowance={args:['test','positive-allowance'],passed:false};client.commands.push(allowance);proof();
    try{const positive=await runOwnedCommand(process.execPath,[pnpm,'test'],{cwd:destination,timeoutMs:300000,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'},onOutput:text=>process.stdout.write(text)});writeFileSync(join(directory,'neutral-positive-allowance.log'),positive.stdout+positive.stderr);allowance.passed=true;proof();}
    finally{assert.ok(readFileSync(path).equals(next),'Client configuration changed concurrently');writeFileSync(path,original);}
   }
  }
  assertPresetArtifacts(join(destination,'apps/site/dist'),false);source.assertUnchanged();client.passed=true;proof();
 }
 report.passed=true;return report;
 }catch(error){report.error=String(error);throw error;}finally{source.assertUnchanged();proof();console.log('Independent-project evidence (retained): '+directory);}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await verifyInitialization();
