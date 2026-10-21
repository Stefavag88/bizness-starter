import {mkdtempSync,lstatSync,readdirSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,join,resolve} from 'node:path';
/** Test-only roots: exact created paths, verified without following reparse entries. */
export function ownedTempRoots(prefix:string,rootParent?:string){
 const parent=realpathSync(rootParent??tmpdir()),roots=new Map<string,{ino:number;dev:number}>();
 return {
  create(){const path=mkdtempSync(join(parent,prefix));roots.set(path,lstatSync(path));return path;},
  cleanup(preserve=false){
   for(const [path,identity] of roots){
    if(preserve){console.error('Preserved failed-test evidence: '+path);continue;}
    if(resolve(path)!==path||dirname(path)!==parent||!basename(path).startsWith(prefix))throw Error('Unowned temporary root refused');
    const current=lstatSync(path);
    if(!current.isDirectory()||current.isSymbolicLink()||current.ino!==identity.ino||current.dev!==identity.dev)throw Error('Replaced temporary root preserved');
    const verify=(entry:string)=>{
     const stat=lstatSync(entry);
     if(stat.isSymbolicLink())throw Error('Temporary reparse entry preserved: '+entry);
     if(stat.isDirectory())for(const child of readdirSync(entry))verify(join(entry,child));
    };
    verify(path);
    if(realpathSync(path)!==path)throw Error('Replaced temporary root preserved');
    rmSync(path,{recursive:true});
   }
   roots.clear();
  },
 };
}
