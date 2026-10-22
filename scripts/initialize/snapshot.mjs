import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import inventory from './export-manifest.json' with {type:'json'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function readApplicationInput(root,path){
 if(!/^[a-zA-Z0-9_.@/\[\]-]+$/.test(path)||path.split('/').some(p=>p==='..'||!p))throw Error('Unsafe export path: '+path);
 let cursor=root;for(const part of path.split('/')){cursor=join(cursor,part);if(lstatSync(cursor).isSymbolicLink())throw Error('Export refuses source links: '+path);}
 if(!lstatSync(cursor).isFile()||!realpathSync(cursor).startsWith(root+sep))throw Error('Export source is not a regular contained file: '+path);
 return readFileSync(cursor);
}
export function snapshotApplication(source){
 const root=realpathSync(resolve(source));
 const inventoryPath='scripts/initialize/export-manifest.json',inventoryBytes=readApplicationInput(root,inventoryPath);
 if(JSON.stringify(JSON.parse(new TextDecoder().decode(inventoryBytes)))!==JSON.stringify(inventory))throw Error('Export inventory changed since initializer load');
 const revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim();
 const files=new Map(inventory.map(path=>{const bytes=readApplicationInput(root,path);return [path,{bytes,sha256:hash(bytes)}];}));
 const digest=hash(hash(inventoryBytes)+'\n'+[...files].map(([path,file])=>path+':'+file.sha256).join('\n'));
 return {revision,digest,files,assertUnchanged(){
  if(hash(readApplicationInput(root,inventoryPath))!==hash(inventoryBytes))throw Error('Export inventory changed during initialization');
  if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim()!==revision)throw Error('Source revision changed during initialization');
  for(const [path,file] of files)if(hash(readApplicationInput(root,path))!==file.sha256)throw Error('Source changed during initialization: '+path);
 }};
}
export function createClientPackage(name,source){
 return {...structuredClone(source),name,scripts:{
  configure:'node scripts/configure.mjs',check:'pnpm configure && tsc --noEmit && pnpm --filter @starter/site check',test:'pnpm configure && vitest run',
  build:'pnpm configure && pnpm --filter @starter/site build',dev:'node scripts/dev.mjs','dev:cms':'node scripts/dev.mjs --cms',
  'worker:check':'pnpm configure && node scripts/wrangler.mjs deploy --dry-run --config wrangler.generated.json',
  'db:local':'pnpm configure && node scripts/wrangler.mjs d1 migrations apply DB --local --config wrangler.generated.json',
  'deploy:prepare':'node scripts/deployment/prepare.mjs',
  'release:build':'node scripts/deployment/release-build.mjs',
  'release:verify':'node scripts/deployment/release-artifact.mjs',
  'release:deploy':'node scripts/deployment/release-command.mjs deploy',
  'release:migrate':'node scripts/deployment/release-command.mjs migrate',

  'report:capacity':'node scripts/report-capacity.mjs',doctor:'node scripts/doctor.mjs','deploy:check':'node scripts/doctor.mjs --production',
 }};
}
