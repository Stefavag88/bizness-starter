import {openSync,closeSync,readFileSync,writeFileSync,mkdirSync,lstatSync,readdirSync,unlinkSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

function directory(path,{create=false}={}){
 if(create&&!existsSync(path))mkdirSync(path);
 const stat=lstatSync(path);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Unsafe configure directory: '+path);
}
function generatedDirectory(root){
 const path=join(resolve(root),'.generated');directory(path,{create:true});return path;
}

/** Refuse concurrent generation. Abandoned locks require explicit operator recovery. */
export async function withConfigureLock(root,run){
 const path=join(generatedDirectory(root),'configure.lock');
 let fd;
 try{fd=openSync(path,'wx');}catch(error){
  if(error.code==='EEXIST')throw Error('Configure lock already exists at '+path+'. Wait for its owner; if abandoned, verify no configure process is running before removing it.');
  throw error;
 }
 const owner=JSON.stringify({pid:process.pid,token:randomUUID(),createdAt:new Date().toISOString()})+'\n';
 try{
  writeFileSync(fd,owner);closeSync(fd);fd=undefined;
  return await run();
 }finally{
  if(fd!==undefined)closeSync(fd);
  // Preserve an unexpected replacement; never release another owner's lock.
  if(existsSync(path)){
   const stat=lstatSync(path);
   if(stat.isFile()&&!stat.isSymbolicLink()&&readFileSync(path,'utf8')===owner)unlinkSync(path);
  }
 }
}

/** Snapshot and validate every migration before touching generated migration files. */
export function syncMigrations(root){
 const source=join(resolve(root),'migrations');directory(source);
 const versions=new Set();
 const migrations=readdirSync(source).map(name=>{
  const match=/^(\d{4})_[a-z][a-z0-9_]*\.sql$/.exec(name);
  if(!match)throw Error('Invalid migration filename: '+name);
  const version=BigInt(match[1]);
  if(version===0n||versions.has(version))throw Error('Invalid or duplicate migration version: '+name);
  versions.add(version);
  const path=join(source,name);const stat=lstatSync(path);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('Migration must be a regular file: '+name);
  return {name,version,bytes:readFileSync(path)};
 }).sort((a,b)=>a.version<b.version?-1:1);
 if(!migrations.length)throw Error('Migration source must not be empty');
 const target=join(generatedDirectory(root),'migrations');directory(target,{create:true});
 const generated=readdirSync(target).filter(name=>/\.sql$/i.test(name));
 // Validate existing outputs too, before writes or pruning; never traverse links/directories.
 for(const name of generated){
  const stat=lstatSync(join(target,name));
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('Generated migration must be a regular file: '+name);
 }
 for(const {name,bytes} of migrations){
  const path=join(target,name);
  if(!existsSync(path)||!readFileSync(path).equals(bytes))writeFileSync(path,bytes);
 }
 const names=new Set(migrations.map(m=>m.name));
 for(const name of generated)if(!names.has(name))unlinkSync(join(target,name));
 return migrations.map(m=>m.name);
}
