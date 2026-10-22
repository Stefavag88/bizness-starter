import {readFileSync,lstatSync,realpathSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import inventory from './release-files.json' with {type:'json'};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]])):v);
export function safePath(path){
 if(typeof path!=='string'||!path||path.includes('\\')||path.includes(':')||path.startsWith('/')||path.split('/').some(p=>!p||p==='.'||p==='..'||/[<>|?*\x00-\x1f]/.test(p)||/[ .]$/.test(p)))throw Error('Unsafe relative release path: '+path);
 return path;
}
export function regularBytes(root,path){
 safePath(path);let cursor=root;
 for(const part of path.split('/')){cursor=join(cursor,part);if(lstatSync(cursor).isSymbolicLink())throw Error('Release refuses links: '+path);}
 if(!lstatSync(cursor).isFile()||!realpathSync(cursor).startsWith(root+sep))throw Error('Release input must be a contained regular file: '+path);
 return readFileSync(cursor);
}
export function regularTree(root,prefix=''){
 const result={};const walk=path=>{
  const stat=lstatSync(join(root,path));if(stat.isSymbolicLink())throw Error('Release refuses links: '+path);
  if(stat.isDirectory()){for(const name of readdirSync(join(root,path)).sort())walk(path?path+'/'+name:name);}
  else if(stat.isFile()){safePath(path);result[path]=sha256(regularBytes(root,path));}
  else throw Error('Unsupported release entry: '+path);
 };
 walk(prefix);const folded=Object.keys(result).map(p=>p.toLowerCase());if(new Set(folded).size!==folded.length)throw Error('Case-colliding release inputs');return result;
}
function revision(root){try{return execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']}).trim();}catch{return null;}}
export function snapshotReleaseInputs(source){
 const root=realpathSync(resolve(source));
 const inventoryPath='scripts/deployment/release-files.json';
 if(canonical(JSON.parse(regularBytes(root,inventoryPath)))!==canonical(inventory))throw Error('Release inventory changed since module load');
 const collect=()=>{
  const paths=new Set([...inventory,'project.json']);
  for(const path of ['content','apps/site/public/uploads','packages/design-system/themes'])if(existsSync(join(root,path)))for(const entry of Object.keys(regularTree(root,path))){if(entry.split('/').some(part=>part.startsWith('.')))throw Error('Hidden release content is unsupported: '+entry);paths.add(entry);}
  return new Map([...paths].sort().map(path=>{const bytes=regularBytes(root,path);return [path,{bytes,sha256:sha256(bytes)}];}));
 };
 const files=collect(),sourceRevision=revision(root),fingerprints=map=>Object.fromEntries([...map].map(([p,f])=>[p,f.sha256]));
 const digest=sha256(canonical(fingerprints(files)));
 return {files,sourceRevision,digest,assertUnchanged(){if(revision(root)!==sourceRevision||sha256(canonical(fingerprints(collect())))!==digest)throw Error('Release source inputs changed during build');}};
}
/** Allowlist, not a credential denylist. Config homes remain inside the owned run. */
export function sanitizedBuildEnv(source,workspace){
 const env={};for(const [key,value] of Object.entries(source))if(value!==undefined&&['path','systemroot','windir','comspec','pathext','processor_architecture','number_of_processors'].includes(key.toLowerCase()))env[key]=value;
 Object.assign(env,{HOME:join(workspace,'.build-home'),USERPROFILE:join(workspace,'.build-home'),APPDATA:join(workspace,'.build-home','appdata'),LOCALAPPDATA:join(workspace,'.build-home','local'),XDG_CONFIG_HOME:join(workspace,'.build-home','config'),TEMP:join(workspace,'.build-tmp'),TMP:join(workspace,'.build-tmp'),TMPDIR:join(workspace,'.build-tmp'),npm_config_userconfig:join(workspace,'.build-home','npmrc'),npm_config_globalconfig:join(workspace,'.build-home','global-npmrc'),ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',CI:'true'});
 return env;
}
