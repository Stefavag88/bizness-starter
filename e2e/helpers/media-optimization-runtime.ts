import {cleanupMediaOptimization} from './media-optimization-cleanup';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {appendFileSync} from 'node:fs';
import {join} from 'node:path';
import {writeEvidence} from './media-optimization-acceptance';
/** Long-lived children are retained by actual ChildProcess identity until close is observed. */
export function mediaRuntime(directory:string,label:string,args:string[],cwd=process.cwd()){
 const row:any={executable:process.execPath,args,cwd,started:new Date().toISOString(),pid:null,closed:false,shutdownConfirmed:false};
 const child=spawn(process.execPath,args,{cwd,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe'],env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:join(directory,'config'),WRANGLER_LOG_PATH:join(directory,'wrangler-logs')}});
 let text='';const record=()=>writeEvidence(directory,'runtime-'+label+'.json',row);row.pid=child.pid;record();
 for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{text+=String(b);appendFileSync(join(directory,'runtime-'+label+'.log'),b);});
 const closed=new Promise<void>((res,rej)=>{child.once('error',rej);child.once('close',(code,signal)=>{row.closed=true;row.code=code;row.signal=signal;row.ended=new Date().toISOString();record();res();});});
 return {pid:child.pid,closed:()=>row.closed,output:()=>text,async stop(){if(!row.closed){if(process.platform==='win32')await promisify(execFile)('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true});else process.kill(-child.pid!,'SIGTERM');await closed;}row.shutdownConfirmed=true;record();return true;}};
}
/** Browser rejection is an independent stop, so it cannot bypass owned child/source cleanup. */
export function cleanupMediaBrowser(options:Parameters<typeof cleanupMediaOptimization>[0]&{closeBrowser:()=>unknown|Promise<unknown>}){
 const {closeBrowser,...rest}=options;
 return cleanupMediaOptimization({...rest,stops:[{id:'browser',stop:closeBrowser},...rest.stops]});
}
