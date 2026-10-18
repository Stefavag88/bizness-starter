import {Buffer} from 'node:buffer';
import {cleanupCompositionPublic} from './composition-b-cleanup.ts';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
/** Project configuration is independently owned; document ownership is request-derived. */
export function enableCompositionC(){
 mkdirSync('.generated/composition-c-cms',{recursive:true});
 const directory=mkdtempSync('.generated/composition-c-cms/config-');
 const original=readFileSync('project.json');
 const project=JSON.parse(original.toString());project.modules={...project.modules,rooms:true};
 const expected=Buffer.from(JSON.stringify(project,null,2)+'\n');
 writeFileSync(join(directory,'project.original.json'),original);
 if(Buffer.compare(readFileSync('project.json'),original)!==0)throw Error('Project changed before enablement');
 writeFileSync('project.json',expected);
 return {directory,restore(){if(Buffer.compare(readFileSync('project.json'),expected)!==0){writeFileSync(join(directory,'project.conflict.json'),readFileSync('project.json'));throw Error('Project conflict preserved: '+directory);}writeFileSync('project.json',original);}};
}

export interface CompositionCNativeCleanupState {
 recordsRestored: boolean;
 mediaRestored: boolean[];
}
type CleanupAction=()=>unknown|Promise<unknown>;
/** The document must be restored before deleting uploads it may still reference. */
export async function cleanupCompositionCNative(options:{restoreRecords:CleanupAction;restoreMedia:CleanupAction[];record:(state:CompositionCNativeCleanupState)=>unknown|Promise<unknown>}){
 const state:CompositionCNativeCleanupState={recordsRestored:false,mediaRestored:options.restoreMedia.map(()=>false)};
 await cleanupCompositionPublic([
  async()=>{await options.restoreRecords();state.recordsRestored=true;},
  ...options.restoreMedia.map((restore,index)=>async()=>{if(!state.recordsRestored)return;await restore();state.mediaRestored[index]=true;}),
  ()=>options.record(state),
 ]);
}
