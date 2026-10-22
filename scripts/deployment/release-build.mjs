import {tmpdir} from 'node:os';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,lstatSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {parseProject} from '../../packages/config/project.mjs';
import {deploymentIdentity} from '../../packages/config/deployment-identity.mjs';
import {runOwnedCommand} from '../owned-command.mjs';
import {createWorkerConfig} from '../worker-config.mjs';
import {parseProductionTarget} from './production.mjs';
import {parsePreparationArgs} from './prepare.mjs';
import {snapshotReleaseInputs,sanitizedBuildEnv,regularTree,regularBytes,sha256} from './release-inputs.mjs';
import {releaseWorkerConfig,sealReleaseArtifact} from './release-artifact.mjs';
export const parseReleaseBuildArgs=parsePreparationArgs;
export function localMigrationArgs(wrangler,workspace,state){return [wrangler,'d1','migrations','apply','DB','--local','--config',join(workspace,'wrangler.generated.json'),'--persist-to',state];}
function directory(path){if(!existsSync(path))mkdirSync(path);const s=lstatSync(path);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Unsafe release directory: '+path);}
function write(root,path,bytes){const destination=join(root,path);mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,bytes,{flag:'wx'});}
/** Every child command is local. There is deliberately no remote deployment executor. */
export async function buildProductionRelease(source,args){
 const options=parseReleaseBuildArgs(args),root=realpathSync(resolve(source));
 const targetPath=resolve(root,options.config);if(!lstatSync(targetPath).isFile()||lstatSync(targetPath).isSymbolicLink())throw Error('Target must be a regular JSON file');
 const targetBytes=readFileSync(targetPath),snapshot=snapshotReleaseInputs(root);
 const target=parseProductionTarget(JSON.parse(targetBytes),parseProject(JSON.parse(snapshot.files.get('project.json').bytes)));
 const pnpm=process.env.npm_execpath;if(!pnpm||!existsSync(pnpm)||!/^pnpm\.(c?js)$/.test(pnpm.split(/[\\/]/).at(-1)))throw Error('Run release:build through pinned pnpm 10.13.1');
 directory(join(root,'.generated'));directory(join(root,'.generated/releases'));
 const run=join(root,'.generated/releases','run-'+randomUUID()),workspace=join(run,'workspace'),artifact=join(run,'artifact');mkdirSync(run);mkdirSync(workspace);mkdirSync(artifact);mkdirSync(join(run,'logs'));
 // workerd's local SQLite filenames can exceed Windows limits under a nested client.
 const localState=mkdtempSync(join(tmpdir(),'starter-release-'));
 const report={format:1,workspace,artifact,localState,status:'building',commands:[]};const save=()=>writeFileSync(join(run,'build-report.json'),JSON.stringify(report,null,2)+'\n');save();
 try{
  for(const [path,file] of snapshot.files)write(workspace,path,path==='project.json'?JSON.stringify(target.project,null,2)+'\n':file.bytes);
  const env=sanitizedBuildEnv(process.env,workspace);
  for(const dir of [env.HOME,env.APPDATA,env.LOCALAPPDATA,env.XDG_CONFIG_HOME,env.TEMP])mkdirSync(dir,{recursive:true});
  writeFileSync(env.npm_config_userconfig,'');writeFileSync(env.npm_config_globalconfig,'');
  let sequence=0;
  const command=async(name,argv,timeoutMs=300000)=>{
   const log=join(run,'logs',String(++sequence).padStart(2,'0')+'-'+name+'.log');writeFileSync(log,'');
   const {appendFileSync}=await import('node:fs');
   const result=await runOwnedCommand(process.execPath,argv,{cwd:workspace,env,timeoutMs,onOutput:text=>appendFileSync(log,text)});
   report.commands.push({name,argv,passed:true});save();return result;
  };
  const version=await command('pnpm-version',[pnpm,'--version']);if(version.stdout.trim()!=='10.13.1')throw Error('Release requires pnpm 10.13.1');
  await command('install',[pnpm,'install','--frozen-lockfile'],600000);
  await command('typecheck',[pnpm,'check']);
  await command('public-build',[pnpm,'build']);
  // Use the shared generator with the explicit target account/resource naming.
  writeFileSync(join(workspace,'wrangler.generated.json'),JSON.stringify(createWorkerConfig(target.project,{siteUrl:'',workerUrl:'',tinaUrl:''},target),null,2)+'\n');
  const wrangler=join(workspace,'node_modules/wrangler/bin/wrangler.js');
  const wranglerVersion=JSON.parse(readFileSync(join(workspace,'node_modules/wrangler/package.json'),'utf8')).version;if(wranglerVersion!=='4.148.0')throw Error('Unexpected Wrangler version');
  await command('worker-bundle',[wrangler,'deploy','--dry-run','--config',join(workspace,'wrangler.generated.json'),'--outdir',join(run,'bundle')]);
  await command('local-migrations',localMigrationArgs(wrangler,workspace,localState));
  const copyTree=(from,to)=>{for(const path of Object.keys(regularTree(from)))write(artifact,to+'/'+path,regularBytes(from,path));};
  copyTree(join(workspace,'apps/site/dist'),'assets');copyTree(join(run,'bundle'),'worker');copyTree(join(workspace,'.generated/migrations'),'migrations');
  write(artifact,'project.json',JSON.stringify(target.project,null,2)+'\n');write(artifact,'identity.json',JSON.stringify(deploymentIdentity(target.project),null,2)+'\n');write(artifact,'wrangler.json',JSON.stringify(releaseWorkerConfig(target),null,2)+'\n');
  await command('packaged-dry-run',[wrangler,'deploy','--dry-run','--no-bundle','--config',join(artifact,'wrangler.json'),'--outdir',join(run,'verification')]);
  snapshot.assertUnchanged();if(!readFileSync(targetPath).equals(targetBytes))throw Error('Production target changed during release build');
  const manifest=sealReleaseArtifact(artifact,{format:1,application:target.application,target:'production',accountId:target.accountId,databaseId:target.project.infrastructure.databaseId,sourceRevision:snapshot.sourceRevision,inputDigest:snapshot.digest,targetDigest:sha256(targetBytes),checks:{typecheck:true,publicBuild:true,workerBundle:true,localMigrations:true,packagedDryRun:true},tools:{node:process.version,pnpm:version.stdout.trim(),wrangler:wranglerVersion},cms:'not_built'});
  report.status='verified-blocked';report.releaseId=manifest.releaseId;save();return {artifact,run,manifest};
 }catch(error){report.status='failed';report.error=error.message;save();throw Error('Release failed; isolated evidence preserved at '+run+'. '+error.message,{cause:error});}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{const result=await buildProductionRelease(process.cwd(),process.argv.slice(2));console.log(JSON.stringify({artifact:result.artifact,releaseId:result.manifest.releaseId,integrity:'verified',status:'blocked',cms:'not_built',issues:result.manifest.issues},null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
