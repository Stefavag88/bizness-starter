import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyReleaseArtifact} from './release-artifact.mjs';
export function parseReleaseCommandArgs(args){
 const values=args[0]==='--'?args.slice(1):args,options={};
 for(let i=0;i<values.length;i+=2){const key=values[i],value=values[i+1];
  if(key==='--execute')throw Error('Remote execution is blocked pending hosted qualification; no executor is implemented.');
  if(!['--target','--artifact','--account','--database'].includes(key)||!value||value.startsWith('--')||Object.hasOwn(options,key))throw Error('Unsupported/duplicate release argument: '+key);options[key]=value;
 }
 if(options['--target']!=='production'||!options['--artifact']||!/^[a-f0-9]{32}$/.test(options['--account']??'')||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(options['--database']??''))throw Error('Explicit production artifact, account and database are required');
 return {target:'production',artifact:options['--artifact'],accountId:options['--account'],databaseId:options['--database']};
}
export function planReleaseCommand(operation,options){
 if(!['deploy','migrate'].includes(operation))throw Error('Unsupported release operation');
 if(options.execute)throw Error('Remote execution is blocked; no executor is implemented.');
 // Reuse CLI validation for programmatic callers. No environment overrides are read.
 const selected=parseReleaseCommandArgs(['--target',options.target??'','--artifact',options.artifact??'','--account',options.accountId??'','--database',options.databaseId??'']);
 const artifact=resolve(selected.artifact),manifest=verifyReleaseArtifact(artifact);
 if(selected.accountId!==manifest.accountId||selected.databaseId!==manifest.databaseId)throw Error('Release account/database mismatch');
 const config=join(artifact,'wrangler.json');
 const args=operation==='deploy'?['deploy','--no-bundle','--config',config]:['d1','migrations','apply','DB','--remote','--config',config];
 return {operation,artifact,releaseId:manifest.releaseId,accountId:manifest.accountId,databaseId:manifest.databaseId,target:'production',status:'blocked',executable:false,command:{tool:'wrangler@'+manifest.tools.wrangler,args},issues:manifest.issues,note:'Review plan only. No subprocess or remote executor exists. Reverify the immutable package before a future authorized release.'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{const [operation,...args]=process.argv.slice(2),plan=planReleaseCommand(operation,parseReleaseCommandArgs(args));console.log(JSON.stringify(plan,null,2));process.exitCode=1;}catch(error){console.error(error.message);process.exitCode=1;}
}
