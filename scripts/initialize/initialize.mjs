import fs from 'node:fs';import {resolve,join,dirname,relative,sep} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {createPresetBundle,projectPresetBundle} from '../../packages/presets/bundle.mjs';
import {snapshotApplication,createClientPackage,readApplicationInput} from './snapshot.mjs';import {inspectDestination} from './destination.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function initializeProject({source,options,dryRun=false}){
 if(fs.realpathSync(resolve(source))!==fs.realpathSync(fileURLToPath(new URL('../../',import.meta.url))))throw Error('Run the initializer from its own source checkout');
 const ownership=inspectDestination(source,options.destination);const snapshot=snapshotApplication(ownership.source);
 const bundle=createPresetBundle(options.preset,options);projectPresetBundle(bundle,{assetRoot:ownership.source});
 const files=new Map([...snapshot.files].map(([path,file])=>[path,file.bytes]));
 const encode=value=>new TextEncoder().encode(value);
 files.set('package.json',encode(JSON.stringify(createClientPackage(options.name,JSON.parse(new TextDecoder().decode(files.get('package.json')))),null,2)+'\n'));
 files.set('project.json',encode(JSON.stringify(bundle.project,null,2)+'\n'));for(const [path,bytes] of bundle.files)files.set(path,bytes);
 const extras=new Map();
 for(const [input,output] of [['scripts/initialize/client/README.md','README.md'],['scripts/initialize/client/project.test.ts','tests/project.test.ts']]){
  const path=join(ownership.source,input);const bytes=readApplicationInput(ownership.source,input);extras.set(input,digest(bytes));files.set(output,bytes);
 }
 // Snapshot immutable seed inputs too; no unselected credential/configuration files are read.
 for(const name of ['catalog.mjs','bundle.mjs','seeds/common.mjs','seeds/neutral-data.json','seeds/'+options.preset+'.mjs']){
  const path='packages/presets/'+name;extras.set(path,digest(readApplicationInput(ownership.source,path)));
 }
 const assertSource=()=>{snapshot.assertUnchanged();for(const [path,hash] of extras)if(digest(readApplicationInput(ownership.source,path))!==hash)throw Error('Source input changed: '+path);};
 const sourceDigest=digest(snapshot.digest+JSON.stringify([...extras]));
 files.set('starter-provenance.json',encode(JSON.stringify({format:1,starterVersion:'2.0.0-dev',sourceRevision:snapshot.revision,sourceDigest,preset:options.preset,presetVersion:1},null,2)+'\n'));
 const nextCommands=[`cd '${ownership.target.replaceAll("'","''")}'`,'pnpm install --frozen-lockfile','pnpm check','pnpm test','pnpm build','pnpm worker:check','pnpm dev:cms'];
 assertSource();ownership.assertOwned();if(dryRun)return {destination:ownership.target,createdFiles:[],plannedFiles:[...files.keys()],revision:snapshot.revision,nextCommands};
 const createdFiles=[],directories=new Map();
 try{
  ownership.claim();directories.set(ownership.target,fs.lstatSync(ownership.target));
  const checkDirectory=path=>{const identity=directories.get(path),stat=fs.lstatSync(path);if(!identity||!stat.isDirectory()||stat.isSymbolicLink()||identity.ino!==stat.ino||identity.dev!==stat.dev)throw Error('Destination directory changed: '+path);};
  const ensureDirectory=path=>{
   if(directories.has(path)){checkDirectory(path);return;}
   ensureDirectory(dirname(path));fs.mkdirSync(path);directories.set(path,fs.lstatSync(path));
  };
  for(const [path,bytes] of files){
   if(path.split('/').some(part=>!part||part==='..')||path.startsWith('/')||path.includes('\\'))throw Error('Unsafe exported path');
   ownership.assertOwned();if(snapshot.files.has(path)&&digest(readApplicationInput(ownership.source,path))!==snapshot.files.get(path).sha256)throw Error('Source changed during export: '+path);const destination=join(ownership.target,path);ensureDirectory(dirname(destination));
   const fd=fs.openSync(destination,'wx');try{fs.writeFileSync(fd,bytes);}finally{fs.closeSync(fd);}createdFiles.push(path);
  }
  // Compare every owned byte and refuse any competing file before initializing Git.
  for(const [path,bytes] of files)if(!fs.readFileSync(join(ownership.target,path)).equals(Buffer.from(bytes)))throw Error('Created destination changed: '+path);
  const inspect=dir=>{checkDirectory(dir);for(const item of fs.readdirSync(dir)){const path=join(dir,item),stat=fs.lstatSync(path);if(stat.isSymbolicLink())throw Error('Destination link appeared');if(stat.isDirectory())inspect(path);else if(!files.has(relative(ownership.target,path).split(sep).join('/')))throw Error('Unexpected destination file appeared');}};inspect(ownership.target);assertSource();
  const env={...process.env};for(const name of Object.keys(env))if(name.startsWith('GIT_'))delete env[name];
  execFileSync('git',['init','--template=','--',ownership.target],{stdio:'pipe',windowsHide:true,env});
  if(execFileSync('git',['-C',ownership.target,'remote'],{encoding:'utf8',windowsHide:true,env}).trim())throw Error('Unexpected inherited Git remote');
  return {destination:ownership.target,createdFiles,revision:snapshot.revision,nextCommands};
 }catch(error){throw new Error(`Initialization failed; partial destination preserved at ${ownership.target}. Created ${createdFiles.length} files. ${error.message}`,{cause:error});}
}
