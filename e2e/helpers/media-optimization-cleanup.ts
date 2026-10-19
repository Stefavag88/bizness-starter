import {cleanupCompositionPublic} from './composition-b-cleanup.ts';
type Action=()=>unknown|Promise<unknown>;
export interface MediaRestore {id:string; restore:Action; dependsOn?:string[]}
export interface MediaCleanupLedger {
 stops:{id:string;status:'stopped'|'failed';error?:string}[];
 actions:{id:string;status:'restored'|'failed'|'retained';error?:string}[];
 snapshot:'unchecked'|'matched'|'failed';
 regeneration:{id:string;status:'completed'|'failed'|'skipped';error?:string}[];
}
/** Independent actions are awaited even after failure; dependent media stays with conflicted records. */
export async function cleanupMediaOptimization(options:{stops:{id:string;stop:Action}[];restores:MediaRestore[];assertInputs:Action;regenerate:{id:string;run:Action}[];record:(ledger:MediaCleanupLedger)=>unknown|Promise<unknown>}){
 const ids=[...options.stops,...options.restores].map(action=>action.id);
 if(new Set(ids).size!==ids.length)throw Error('Duplicate acceptance cleanup owner');
 const seen=new Set<string>();
 for(const action of options.restores){for(const id of action.dependsOn??[])if(!seen.has(id))throw Error('Cleanup dependency must precede its dependent: '+id);seen.add(action.id);}
 const ledger:MediaCleanupLedger={stops:[],actions:[],snapshot:'unchecked',regeneration:options.regenerate.map(({id})=>({id,status:'skipped'}))};
 const safe=()=>ledger.stops.every(row=>row.status==='stopped')&&ledger.actions.every(row=>row.status==='restored')&&ledger.snapshot==='matched';
 const restored=new Set<string>();
 async function confirmed(action:Action){if(await action()===false)throw Error('Acceptance owner returned false; restoration/shutdown unconfirmed');}
 await cleanupCompositionPublic([
  ...options.stops.map(({id,stop})=>async()=>{const row:MediaCleanupLedger['stops'][number]={id,status:'failed'};ledger.stops.push(row);try{await confirmed(stop);row.status='stopped';}catch(error){row.error=String(error);throw error;}}),
  ...options.restores.map(({id,restore,dependsOn=[]})=>async()=>{
   const row:MediaCleanupLedger['actions'][number]={id,status:'retained'};ledger.actions.push(row);
   if(dependsOn.some(dependency=>!restored.has(dependency))){row.error='Dependent record restoration unconfirmed';return;}
   row.status='failed';try{await confirmed(restore);row.status='restored';restored.add(id);}catch(error){row.error=String(error);throw error;}
  }),
  async()=>{ledger.snapshot='failed';await confirmed(options.assertInputs);ledger.snapshot='matched';},
  async()=>{
   if(!safe())return;
   for(const [index,{run}] of options.regenerate.entries()){
    const row=ledger.regeneration[index];
    try{ledger.snapshot='failed';await confirmed(options.assertInputs);ledger.snapshot='matched';await confirmed(run);ledger.snapshot='failed';await confirmed(options.assertInputs);ledger.snapshot='matched';row.status='completed';}
    catch(error){row.status='failed';row.error=String(error);throw error;}
   }
  },
  ()=>options.record(ledger),
 ]);
 if(!safe())throw Error('Acceptance cleanup unsafe; regeneration refused');
 return ledger;
}
