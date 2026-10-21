import {providerBindingSchema,type ProviderAnalyticsBinding} from '../packages/config/provider-analytics.mjs';
import {chargeExternal} from './budget';import type {Env} from './types';import type {MetricReading,UsageSnapshot} from './usage-contracts';
type Window={from:string;to:string};type Provider=UsageSnapshot['provider'];
const ids=['worker_requests_site','worker_requests_account','cpu_p99_ms','d1_rows_read','d1_rows_written','d1_storage_bytes','queue_operations','queue_backlog','workflow_steps'];
function empty(window:Window,status:MetricReading['status'],note:string):MetricReading[]{return ids.map(id=>({id,value:null,unit:id.endsWith('_bytes')?'bytes':id==='cpu_p99_ms'?'ms':'count',source:'provider',scope:id==='worker_requests_account'?'account':'deployment',window,updatedAt:null,status,note}));}
function dates(window:Window){const parse=(s:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Invalid UTC window');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)throw Error('Invalid UTC window');return n;};const from=parse(window.from),to=parse(window.to);if(to<from||to-from>6*86400000)throw Error('Select at most seven UTC days');return {start:new Date(from).toISOString(),end:new Date(to+86400000-1).toISOString()};}
interface Task{query:string;metrics:{id:string;group:'sum'|'max';field:string;note:string}[]}
function tasks(c:ProviderAnalyticsBinding,w:Window):Task[]{const d=dates(w),q=JSON.stringify;const wrap=(node:string,filter:string,fields:string)=>`query UsageRead { viewer { accounts(filter:{accountTag:${q(c.accountId)}}){ readings:${node}(limit:2,filter:{${filter}}){${fields}} } } }`;
 const time=`datetime_geq:${q(d.start)},datetime_leq:${q(d.end)}`;
 const result:Task[]=[{query:wrap('workersInvocationsAdaptive',`${time},scriptName:${q(c.workerName)}`,'sum{requests}'),metrics:[{id:'worker_requests_site',group:'sum',field:'requests',note:'Provider aggregate; coverage and hosted qualification pending.'}]},
 {query:wrap('d1AnalyticsAdaptiveGroups',`date_geq:${q(w.from)},date_leq:${q(w.to)},databaseId:${q(c.databaseId)}`,'sum{rowsRead rowsWritten}'),metrics:[{id:'d1_rows_read',group:'sum',field:'rowsRead',note:'Provider rows read aggregate; qualification pending.'},{id:'d1_rows_written',group:'sum',field:'rowsWritten',note:'Provider rows written aggregate; qualification pending.'}]},
 {query:wrap('d1StorageAdaptiveGroups',`date_geq:${q(w.from)},date_leq:${q(w.to)},databaseId:${q(c.databaseId)}`,'max{databaseSizeBytes}'),metrics:[{id:'d1_storage_bytes',group:'max',field:'databaseSizeBytes',note:'Peak reported database size in the selected window.'}]}];
 if(c.includeAccountTotals)result.push({query:wrap('workersInvocationsAdaptive',time,'sum{requests}'),metrics:[{id:'worker_requests_account',group:'sum',field:'requests',note:'Shared account aggregate; includes other Workers.'}]});
 if(c.queueId)result.push({query:wrap('queueMessageOperationsAdaptiveGroups',`${time},queueId:${q(c.queueId)}`,'sum{billableOperations}'),metrics:[{id:'queue_operations',group:'sum',field:'billableOperations',note:'Provider billable Queue operations; capability must be verified in staging.'}]});return result;}
const cache=new Map<string,{next:number;value:Provider;flight?:Promise<Provider>}>();
function currentView(value:Provider,at:number):Provider{
 const result=structuredClone(value);
 for(const metric of result.metrics)if(metric.value!==null&&metric.updatedAt&&at-Date.parse(metric.updatedAt)>3600000){metric.value=null;metric.status='unavailable';metric.updatedAt=null;metric.note='Last provider observation expired; waiting for retry.';}
 const known=result.metrics.filter(metric=>metric.value!==null);
 result.status=known.length?(known.every(metric=>metric.status==='stale')?'stale':'partial'):'unavailable';
 result.updatedAt=known.length?known.map(metric=>metric.updatedAt!).sort().at(-1)!:null;
 return result;
}

async function boundedJson(response:Response){if(!response.body)throw Error('Empty response');const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>262144)throw Error('Response too large');chunks.push(value);}}catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(body));}
export async function collectProviderUsage(env:Env,window:Window,at:number):Promise<Provider>{
 dates(window);const blank=(status:Provider['status'],note:string):Provider=>({status,updatedAt:null,metrics:empty(window,status==='not_configured'?'not_configured':'unavailable',note)});
 if(env.ENVIRONMENT==='local')return blank('not_configured','Local simulation; cloud collection disabled.');
 let config:ProviderAnalyticsBinding;try{config=providerBindingSchema.parse(JSON.parse(env.PROVIDER_ANALYTICS??'{}'));}catch{return blank('not_configured','Provider configuration is missing or invalid.');}
 if(!config.enabled||!env.CF_ANALYTICS_TOKEN)return blank('not_configured','Enable server-owned analytics and configure its secret token.');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([config,env.CF_ANALYTICS_TOKEN,window,env.ENVIRONMENT])));const key=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 let entry=cache.get(key);if(entry?.flight)return currentView(await entry.flight,at);if(entry&&at<entry.next)return currentView(entry.value,at);
 if(!entry){if(cache.size>=16)cache.delete(cache.keys().next().value!);entry={next:0,value:blank('unavailable','No provider observation yet.')};cache.set(key,entry);}
 const current=entry;const flight=(async()=>{
 const metrics=empty(window,'unavailable','Metric requires verified dataset availability, units and aggregation in staging.');
 if(!config.includeAccountTotals)metrics.find(m=>m.id==='worker_requests_account')!.note='Account-wide totals disabled.';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);let failed=false,backoff=60000;
 try{await Promise.all(tasks(config,window).map(async task=>{try{
  chargeExternal(env);const response=await fetch('https://api.cloudflare.com/client/v4/graphql',{method:'POST',redirect:'error',headers:{authorization:'Bearer '+env.CF_ANALYTICS_TOKEN,'content-type':'application/json'},body:JSON.stringify({query:task.query}),signal:controller.signal});
  if(!response.ok){if(response.status===429){const seconds=Number(response.headers.get('retry-after'));if(Number.isFinite(seconds))backoff=Math.max(backoff,Math.min(300000,seconds*1000));}await response.body?.cancel();throw Error('Provider unavailable');}
  const data=await boundedJson(response),accounts=data?.data?.viewer?.accounts;if(data.errors?.length||!Array.isArray(accounts)||accounts.length!==1||!Array.isArray(accounts[0].readings)||accounts[0].readings.length!==1)throw Error('Incomplete provider response');
  const row=accounts[0].readings[0];for(const definition of task.metrics){const metric=metrics.find(m=>m.id===definition.id)!,value=row?.[definition.group]?.[definition.field];if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Invalid metric');Object.assign(metric,{value,status:'partial',updatedAt:new Date(at).toISOString(),note:definition.note});}
 }catch{failed=true;for(const definition of task.metrics){const metric=metrics.find(m=>m.id===definition.id)!,prior=current.value.metrics.find(m=>m.id===definition.id);if(prior?.value!==null&&prior?.updatedAt&&at-Date.parse(prior.updatedAt)<=3600000)Object.assign(metric,prior,{status:'stale',note:'Collection failed; last successful reading retained.'});}}}));}finally{clearTimeout(timer);}
 const known=metrics.filter(m=>m.value!==null),allStale=known.length>0&&known.every(m=>m.status==='stale');const result:Provider={status:allStale?'stale':known.length?'partial':'unavailable',updatedAt:known.length?known.map(m=>m.updatedAt!).sort().at(-1)!:null,metrics};current.value=result;current.next=at+(failed?backoff:300000);return result;
 })();current.flight=flight;try{return currentView(await flight,at);}finally{current.flight=undefined;}
}
