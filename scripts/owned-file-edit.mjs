import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

/** Best-effort compare-before-write ownership for a temporary canonical edit. */
export function createOwnedFileEdit(path,backupDirectory){
 const original=readFileSync(path);
 mkdirSync(backupDirectory,{recursive:true});
 const directory=mkdtempSync(join(backupDirectory,'owned-'));
 const backupPath=join(directory,'original.json');
 writeFileSync(backupPath,original,{flag:'wx'});
 let owned=null,conflicted=false,conflictPath=null;
 function requireBytes(expected,operation){
  let current;
  try{current=readFileSync(path);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(current?.equals(expected))return;
  conflicted=true;
  if(current){conflictPath=join(directory,'unexpected-'+randomUUID()+'.json');writeFileSync(conflictPath,current,{flag:'wx'});}
  throw Error('Smoke file ownership conflict before '+operation+'. Preserved current file; original backup: '+backupPath+(conflictPath?'; unexpected bytes: '+conflictPath:'; source is missing.'));
 }
 return {
  original:Buffer.from(original),backupPath,
  get conflictPath(){return conflictPath;},
  replace(value){
   if(owned||conflicted)throw Error('Smoke file ownership is no longer available for mutation. Original backup: '+backupPath);
   requireBytes(original,'initial mutation');
   const next=Buffer.from(value);writeFileSync(path,next);owned=next;
  },
  restore(){
   if(!owned||conflicted)return false;
   requireBytes(owned,'restore');writeFileSync(path,original);owned=null;return true;
  },
 };
}
/** Process cleanup must run even when a restore refuses to overwrite another editor. */
export async function cleanupOwnedEdit(edit,stop){
 let restoreError;
 try{edit.restore();}catch(error){restoreError=error;}
 try{await stop();}catch(error){if(restoreError)throw new AggregateError([restoreError,error],'Smoke restoration conflict and process cleanup failed.');throw error;}
 if(restoreError)throw restoreError;
}
