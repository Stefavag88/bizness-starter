import {mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isAbsolute,join,relative,resolve,sep} from 'node:path';
import {createOwnedFileEdit} from '../../scripts/owned-file-edit.mjs';
import {createWorkerEdit} from './composition-c-worker-lifecycle';
import {createCmsSources} from './cms-source-ownership';
import {createOwnedMedia} from './owned-media';
import {canonicalSnapshot,assertCanonicalSnapshot} from '../../scripts/composition-c-snapshot.mjs';
import {cleanupMediaOptimization,type MediaRestore} from './media-optimization-cleanup';
/** Static fixture writes use caller-known bytes. Native saves remain captureNative/request-schema-serializer owned. */
export function createMediaOptimizationFixture(options:{root?:string;documents?:string[];media?:{path:string;documents:string[]}[]}){
 const root=resolve(options.root??process.cwd()),before=canonicalSnapshot(root);
 const parent=join(root,'.generated/media-optimization');mkdirSync(parent,{recursive:true});
 const directory=mkdtempSync(join(parent,'acceptance-fixture-'));
 const log=(name:string,data:unknown)=>writeFileSync(join(directory,name),JSON.stringify(data,null,2)+'\n');
 log('canonical-before.json',before);
 let expected={...before};
 const check=()=>assertCanonicalSnapshot(expected,root);
 function contained(path:string,prefix:string){
  const full=resolve(root,path);
  const relativePath=relative(join(root,prefix),full);
  if(!relativePath||relativePath==='..'||relativePath.startsWith('..'+sep)||isAbsolute(relativePath)){
   throw Error('Fixture path outside '+prefix);
  }
  return full;
 }
 const documents=new Map((options.documents??[]).map(path=>[path,createCmsSources([contained(path,'content')],directory,{allowCreate:true})]));
 const documentEdits=new Map(Array.from(documents,([path,source])=>{const full=resolve(root,path);return [path,source.originalState(full).exists?createWorkerEdit(createOwnedFileEdit(full,directory),()=>readFileSync(full)):undefined];}));
 const media=new Map((options.media??[]).map(({path,documents:dependencies})=>{
  for(const dependency of dependencies)if(!documents.has(dependency))throw Error('Unknown media document dependency: '+dependency);
  return [path,{owner:createOwnedMedia(contained(path,'apps/site/public/uploads'),directory,{uploadsRoot:join(root,'apps/site/public/uploads')}),dependencies}];
 }));
 const projectPath=join(root,'project.json'),project=createWorkerEdit(createOwnedFileEdit(projectPath,directory),()=>readFileSync(projectPath));
 function update(path:string,bytes:Uint8Array|string){
  expected={...expected,[path]:createHash('sha256').update(bytes).digest('hex')};
  log('canonical-expected.json',expected);
  check();
 }
 return {
  directory,before,assertInputs:check,expectedSnapshot:()=>({...expected}),
  replaceProject(bytes:string){check();project.replace(bytes);update('project.json',bytes);},
  createDocument(path:string,value:unknown){check();const source=documents.get(path);if(!source)throw Error('Unregistered fixture document');const bytes=JSON.stringify(value,null,2)+'\n';source.createAbsent(resolve(root,path),value,()=>true);update(path,bytes);},
  replaceDocument(path:string,bytes:string){check();const edit=documentEdits.get(path);if(!edit)throw Error('Static replacement requires registered existing document');edit.replace(bytes);update(path,bytes);},
  createMedia(path:string,bytes:Buffer){check();const item=media.get(path);if(!item)throw Error('Unregistered fixture media');item.owner.create(bytes);update(path,bytes);},
  replaceMedia(path:string,bytes:Buffer){check();const item=media.get(path);if(!item)throw Error('Unregistered fixture media');item.owner.replace(bytes);update(path,bytes);},
  async cleanup(options:{stops?:{id:string;stop:()=>unknown|Promise<unknown>}[];regenerate?:{id:string;run:()=>unknown|Promise<unknown>}[]}={}){
   const restores:MediaRestore[]=[
    {id:'project.json',restore:()=>project.restore()},
    ...Array.from(documents,([id,source])=>({id,restore:async()=>{
     documentEdits.get(id)?.restore();
     await source.restore();
    }})),
    ...Array.from(media,([id,{owner,dependencies}])=>({
     id,restore:()=>owner.restore(),dependsOn:dependencies,
    })),
   ];
   return cleanupMediaOptimization({stops:options.stops??[],restores,assertInputs:()=>{assertCanonicalSnapshot(before,root);expected={...before};},regenerate:options.regenerate??[],record:ledger=>{log('cleanup.json',ledger);log('restoration.json',{before,after:canonicalSnapshot(root)});}});
  },
 };
}
