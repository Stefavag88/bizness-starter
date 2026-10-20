import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync,appendFileSync} from 'node:fs';
const {runOwnedCommand}=await import(pathToFileURL(resolve('scripts/owned-command.mjs')).href);
const folder=resolve('.superpowers/sdd/2026-10-20-starter-v2-motion');const rows=[];
for(const name of ['check','test','build','worker:check','cms:local-build','test:static-routing','test:showcase-builds','test:motion']){
 const row={name,started:new Date().toISOString(),pid:null,ended:null,exitCode:null};rows.push(row);
 const save=()=>writeFileSync(join(folder,'gates.json'),JSON.stringify(rows,null,2));save();
 const log=join(folder,'gate-'+name.replaceAll(':','-')+'.log');writeFileSync(log,'');
 try{await runOwnedCommand(process.execPath,['C:/Users/Vag/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs',name],{timeoutMs:600000,onStart:pid=>{row.pid=pid;save();},onOutput:text=>appendFileSync(log,text)});row.exitCode=0;console.log(name+': PASS');}
 catch(error){row.exitCode=1;console.log(name+': FAIL; see '+log);throw error;}
 finally{row.ended=new Date().toISOString();save();}
}
