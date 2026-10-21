import {html} from './pages';
export function renderUsagePage():Response{
 return html('Usage & Capacity',`
 <p class="usage-intro">Application activity, dispatch capacity and provider readings. All date windows use UTC.</p>
 <nav aria-label="Administration"><a href="/">Public website</a></nav>
 <form id="usage-window"><label>From<input type="date" name="from" required></label><label>To<input type="date" name="to" required></label><button id="refresh" type="submit">Refresh statistics</button></form>
 <p id="usage-status" role="status" aria-live="polite">Loading statistics…</p><p id="usage-meta"></p>
 <section aria-labelledby="dispatch-heading"><h2 id="dispatch-heading">Today's dispatch allowance</h2><div id="admission" class="usage-grid"></div></section>
 <section aria-labelledby="activity-heading"><h2 id="activity-heading">Recorded application activity</h2><p>Background and business-write observations only. Counts are partial observations, not Cloudflare billing totals.</p><div id="activity" class="usage-grid"></div></section>
 <section aria-labelledby="backlog-heading"><h2 id="backlog-heading">Delivery backlog</h2><div id="backlog" class="usage-grid"></div></section>
 <section aria-labelledby="history-heading"><h2 id="history-heading">Application history</h2><div class="usage-table"><table><thead><tr><th scope="col">UTC day</th><th scope="col">Observed acceptances</th><th scope="col">Deferred work</th><th scope="col">Recorded SQL</th></tr></thead><tbody id="history"></tbody></table></div></section>
 <section aria-labelledby="provider-heading"><h2 id="provider-heading">Cloudflare readings</h2><p id="provider-status">Not configured. Connect read-only analytics during hosted setup.</p><div id="provider" class="usage-grid"></div></section>
 <p>Admission attempts differ from successful deliveries. Estimates and quotas depend on the selected workload, account sharing and provider limits.</p>`,
 `
 const $=id=>document.getElementById(id),format=new Intl.NumberFormat(),labels={recorded_sql_statements:'Recorded SQL statements',observed_delivery_acceptances:'Observed email acceptances',observed_failed_deliveries:'Observed failures',observed_uncertain_deliveries:'Uncertain outcomes',deferred_work_units:'Deferred work units',observed_queue_publications:'Observed Queue publications',recorded_external_attempts:'Recorded external attempts',worker_requests_site:'Worker requests · this website',worker_requests_account:'Worker requests · account',cpu_p99_ms:'CPU p99',d1_rows_read:'D1 rows read',d1_rows_written:'D1 rows written',d1_storage_bytes:'D1 storage',queue_operations:'Queue operations',queue_backlog:'Queue backlog',workflow_steps:'Workflow steps'};
 function element(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
 function card(target,title,value,note){const article=element('article');article.append(element('h3',title),element('strong',value===null?'Unavailable':typeof value==='number'?format.format(value):value),element('p',note));$(target).append(article);return article;}
 function reading(target,m){const value=m.status==='not_configured'?'Not configured':m.value;card(target,labels[m.id]||m.id,value,m.source+' · '+m.scope+' · '+m.status+(m.updatedAt?' · '+new Date(m.updatedAt).toISOString():''));}
 function render(data){for(const id of ['admission','activity','backlog','history','provider'])$(id).replaceChildren();
 $('usage-meta').textContent=data.deployment.name+' · '+data.deployment.environment+(data.deployment.environment==='local'?' · Local simulation; no cloud usage is being measured.':'')+' · Snapshot '+data.generatedAt+' · Cache up to five minutes.';
 const a=data.admission,available=a.status!=='unavailable';
 card('admission','Daily limit',available&&a.configured?a.limit:null,a.configured?'Application dispatch-attempt allowance':'Not configured');
 const used=card('admission','Used today',available?a.used:null,'Application ledger · current UTC day');
 card('admission','Remaining today',available?a.remaining:null,'Application allowance; excludes other account usage');
 card('admission','Transactional reserve',a.reserve,'Marketing cannot borrow this reserve');
 if(available&&a.configured&&a.limit>0&&a.used!==null){const percent=a.used/a.limit*100,progress=element('progress');progress.max=100;progress.value=Math.min(100,percent);progress.setAttribute('aria-label','Daily dispatch allowance consumed');used.append(progress,element('p',percent.toFixed(1)+'% used'));used.dataset.level=percent>=data.criticalPercent?'critical':percent>=data.warningPercent?'warning':'normal';}
 data.application.forEach(m=>reading('activity',m));
 for(const [state,count]of Object.entries(data.backlog))card('backlog',state,count.exact?count.count:count.count>0?format.format(count.count)+'+':null,count.exact?'Current persisted job state':count.count>0?'Bounded lower count':'Unavailable or incomplete');
 for(const row of data.history){const tr=element('tr');for(const value of [row.day,row.accepted,row.deferred,row.sqlStatements])tr.append(element('td',value===null?'—':String(value)));$('history').append(tr);}
 $('provider-status').textContent=data.provider.status==='not_configured'?'Not configured. Provider totals are unavailable until hosted analytics is connected.':'Provider readings: '+data.provider.status;
 data.provider.metrics.forEach(m=>reading('provider',m));$('usage-status').textContent='Statistics loaded. Missing readings are unavailable, not zero.';
 }
 const today=new Date().toISOString().slice(0,10),from=new Date(Date.now()-6*86400000).toISOString().slice(0,10);$('usage-window').elements.from.value=from;$('usage-window').elements.to.value=today;
 let busy=false,nextRefresh=0;
 async function load(manual=false){if(busy)return;if(manual&&Date.now()<nextRefresh){$('usage-status').textContent='Please wait before refreshing again.';return;}busy=true;$('refresh').disabled=true;
 try{const values=new FormData($('usage-window')),params=new URLSearchParams({from:String(values.get('from')),to:String(values.get('to'))});const response=await fetch('/api/operations/usage?'+params);const data=await response.json();if(!response.ok)throw Error(data.message||'Statistics are unavailable.');render(data);nextRefresh=Date.now()+60000;}
 catch(error){$('usage-status').textContent=error.message||'Statistics are unavailable. Existing cards may be stale.';}finally{busy=false;$('refresh').disabled=false;}}
 $('usage-window').addEventListener('submit',event=>{event.preventDefault();void load(true);});void load();
 `,
 `main{max-width:1200px}h2{margin-top:2.5rem}h3{font-size:.95rem;margin:0 0 .75rem}.usage-intro{max-width:65ch}.usage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:1rem}.usage-grid article{margin:0;padding:1.25rem;border-radius:3px;min-width:0}.usage-grid strong{display:block;font-size:1.65rem;font-weight:600}.usage-grid p{font-size:.8rem;overflow-wrap:anywhere;opacity:.8}.usage-grid progress{width:100%;margin-top:1rem}.usage-grid [data-level=warning]{border-color:#986800}.usage-grid [data-level=critical]{border-color:#a92d2d}#usage-window{display:flex;gap:1rem;align-items:end;flex-wrap:wrap;margin-top:1.5rem}#usage-window label{margin:0}#usage-window input{display:block;margin-bottom:0}.usage-table{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:.75rem;border-bottom:1px solid #ccd2c1}#usage-meta{font-size:.85rem;overflow-wrap:anywhere}@media(max-width:600px){main{margin:20px auto;padding:16px}h1{font-size:2rem}#usage-window{display:block}#usage-window input{width:100%}.usage-grid{grid-template-columns:1fr}}`);
}
