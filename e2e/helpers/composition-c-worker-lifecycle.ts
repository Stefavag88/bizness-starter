import {Buffer} from 'node:buffer';
import {cleanupCompositionPublic} from './composition-b-cleanup';
import type {OwnedFileEdit} from '../../scripts/owned-file-edit.mjs';
type Action=()=>unknown|Promise<unknown>;
export interface WorkerCleanupState {stoppedWorker:boolean;stoppedSite:boolean;restoredSources:boolean;restoredConfig:boolean;restoredIndex:boolean}
/** Exact-byte ownership includes failed acquisitions; false restoration never establishes safety. */
export function createWorkerEdit(edit:Pick<OwnedFileEdit,'original'|'replace'|'restore'>,read:()=>Buffer) {
 let acquired=false,conflicted=false,restored=false;
 const assertOriginal=()=>{if(Buffer.compare(read(),edit.original)!==0)throw Error('Worker edit original-byte conflict');};
 return {
  replace(value:Uint8Array|string){try{edit.replace(value);acquired=true;}catch(error){conflicted=true;throw error;}},
  restore(){
   if(conflicted)throw Error('Worker edit ownership conflict');
   if(restored||!acquired){assertOriginal();return true;}
   if(!edit.restore()){conflicted=true;throw Error('Worker edit restoration unconfirmed');}
   assertOriginal();restored=true;return true;
  },
 };
}
/** Compose the existing independent-cleanup primitive; do not detach any restoration Promise. */
export function createWorkerLifecycle(options:{stopWorker:Action;stopSite:Action;restoreSources:Action;restoreConfig:()=>boolean|Promise<boolean>;restoreIndex:()=>boolean|Promise<boolean>;assertInputs:(state:WorkerCleanupState)=>unknown|Promise<unknown>;configure:Action;record:(state:WorkerCleanupState)=>unknown}) {
 const state:WorkerCleanupState={stoppedWorker:true,stoppedSite:true,restoredSources:false,restoredConfig:false,restoredIndex:false};
 const stopWorker=async()=>{if(!state.stoppedWorker){await options.stopWorker();state.stoppedWorker=true;}};
 const stopSite=async()=>{if(!state.stoppedSite){await options.stopSite();state.stoppedSite=true;}};
 const stop=()=>cleanupCompositionPublic([stopWorker,stopSite]);
 const restoreConfig=async()=>{state.restoredConfig=false;if(!await options.restoreConfig())throw Error('Worker configuration restoration unconfirmed');state.restoredConfig=true;};
 const restoreIndex=async()=>{state.restoredIndex=false;if(!await options.restoreIndex())throw Error('Worker index restoration unconfirmed');state.restoredIndex=true;};
 const configure=async()=>{if(!state.stoppedWorker||!state.stoppedSite)throw Error('Runtime shutdown unconfirmed; configure refused');await options.assertInputs({...state});await options.configure();};
 return {
  workerStarted(){state.stoppedWorker=false;},siteStarted(){state.stoppedSite=false;},stop,configure,
  async disable(){await stop();await restoreConfig();await configure();},
  cleanup:()=>cleanupCompositionPublic([
   stopWorker,stopSite,
   async()=>{state.restoredSources=false;await options.restoreSources();state.restoredSources=true;},
   restoreConfig,restoreIndex,
   async()=>{if(state.stoppedWorker&&state.stoppedSite&&state.restoredSources&&state.restoredConfig&&state.restoredIndex)await configure();},
   ()=>options.record({...state}),
  ]),
 };
}
