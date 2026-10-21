import {readFileSync,lstatSync,existsSync,readdirSync,mkdirSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {parseProject} from '../../packages/config/project.mjs';
import {readContent} from '../../packages/content/read.mjs';
import {withConfigureLock} from '../configure-safety.mjs';
import {createWorkerConfig} from '../worker-config.mjs';
import {parseProductionTarget,productionIssues} from './production.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function plainFile(path){const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe input file: '+path);return readFileSync(path);}
function fingerprints(root){
 const result={};
 const walk=relative=>{
  const path=join(root,relative),stat=lstatSync(path);
  if(stat.isSymbolicLink())throw Error('Input links are unsupported: '+relative);
  if(stat.isDirectory()){for(const name of readdirSync(path).sort())walk(relative+'/'+name);}
  else if(stat.isFile())result[relative]=hash(readFileSync(path));else throw Error('Unsupported input: '+relative);
 };
 for(const path of ['project.json','content','packages/design-system/themes','apps/site/public/uploads'])if(existsSync(join(root,path)))walk(path);
 return result;
}
export function parsePreparationArgs(args){
 const options={};const values=args[0]==='--'?args.slice(1):args;
 for(let i=0;i<values.length;i+=2){
  const key=values[i],value=values[i+1];
  if(!['--target','--config'].includes(key)||!value||value.startsWith('--')||Object.hasOwn(options,key))throw Error('Unsupported or duplicate preparation argument: '+key);
  options[key]=value;
 }
 if(options['--target']!=='production')throw Error('An explicit --target production is required');
 if(!options['--config'])throw Error('An explicit --config FILE is required');
 return {target:'production',config:options['--config']};
}
export async function prepareProduction(root,args){
 const options=parsePreparationArgs(args);root=resolve(root);
 const configPath=resolve(root,options.config),targetBytes=plainFile(configPath),sourceBytes=plainFile(join(root,'project.json'));
 const source=parseProject(JSON.parse(sourceBytes)),target=parseProductionTarget(JSON.parse(targetBytes),source);
 const before=fingerprints(root);
 if(hash(sourceBytes)!==before['project.json'])throw Error('Project input changed during preparation');
 // Validate the current application's content under production publication rules.
 readContent(root,target.project);
 const worker=createWorkerConfig(target.project,{siteUrl:'',workerUrl:'',tinaUrl:''},target);
 const plan={format:1,application:source.name,target:'production',status:'blocked',deployable:false,
  note:'Preparation only. Not a built release artifact, cloud verification, migration approval or deployment authorization.',
  accountId:target.accountId,siteUrl:target.project.siteUrl,profile:target.project.profile,
  targetFingerprint:hash(targetBytes),fingerprints:before,worker,issues:productionIssues(target)};
 await withConfigureLock(root,async()=>{
  if(!plainFile(configPath).equals(targetBytes)||JSON.stringify(fingerprints(root))!==JSON.stringify(before))throw Error('Preparation inputs changed; report was not replaced');
  const directory=join(root,'.generated/deployment');
  if(!existsSync(directory))mkdirSync(directory);
  const stat=lstatSync(directory);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Unsafe report directory');
  const output=join(directory,'production-plan.json');
  if(existsSync(output))plainFile(output);
  const temporary=join(directory,'production-plan-'+randomUUID()+'.tmp');
  try{writeFileSync(temporary,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});renameSync(temporary,output);}
  finally{if(existsSync(temporary))unlinkSync(temporary);}
 });
 return plan;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{
  const plan=await prepareProduction(process.cwd(),process.argv.slice(2));
  console.log('Production preparation written to .generated/deployment/production-plan.json');
  console.error('Release remains blocked:\n'+plan.issues.map(issue=>'- '+issue).join('\n'));
  process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
