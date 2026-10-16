import {createOwnedFileEdit,cleanupOwnedEdit} from './owned-file-edit.mjs';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {resolvePorts} from './ports.mjs';
const ports=resolvePorts();const base=`http://127.0.0.1:${ports.site}`,worker=`http://127.0.0.1:${ports.worker}`;
const edit=createOwnedFileEdit('content/articles/sample-article.json','.generated/smoke-backups');
const original=edit.original;
const digest=b=>createHash('sha256').update(b).digest('hex');
let output='',failure;const evidence={ports,checks:[],sourceBefore:digest(original)};
const child=spawn(process.execPath,['scripts/dev.mjs'],{stdio:['pipe','pipe','pipe'],env:process.env,windowsHide:true});
child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
const exited=new Promise(r=>child.once('exit',r));
const assert=(condition,label)=>{if(!condition)throw Error(label);evidence.checks.push(label);};
async function until(check,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await check())return;}catch{}if(child.exitCode!==null)throw Error(output);await delay(150);}throw Error('Timed out\n'+output);}
const html=async path=>{const response=await fetch(base+path);if(!response.ok)throw Error(path+' '+response.status);return response.text();};
try{
 await until(async()=>(await fetch(base+'/api/health')).ok);
 assert((await fetch(worker+'/api/health')).status===200,'Direct and proxied health serve successfully');
 assert((await fetch(worker+'/',{redirect:'manual'})).status===302,'Worker root redirects to the default locale');
 const manifest=JSON.parse(readFileSync('.generated/manifest.json','utf8'));
 for(const route of manifest.routes){const text=await html(route.path);assert((text.match(/<h1\b/g)||[]).length===1,route.path+' has one H1');let open=false;for(const tag of text.match(/<\/?a\b[^>]*>/g)||[]){if(tag.startsWith('</'))open=false;else {if(open)throw Error(route.path+' has nested anchors');open=true;}}assert(true,route.path+' has no nested anchors');}
 const greek=await html('/el/contact');assert(greek.includes('Ξεκινήστε μια συζήτηση')&&greek.includes('name="privacyAccepted"'),'Greek contact has localized content and required consent');
 for(const locale of ['en','el']){const rss=await html('/'+locale+'/feed.xml');assert(rss.includes('<description>')&&!rss.includes('**useful outcome**'),locale+' RSS uses plain descriptions');}
 const response=await fetch(base+'/api/contact',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:JSON.stringify({requestKey:crypto.randomUUID(),name:'Task 4 local smoke',email:'smoke@example.com',message:'A local fixture enquiry for Task 4 verification.',privacyAccepted:true,turnstileToken:'local-preview'})});assert(response.status===202,'Contact persists a local fixture enquiry');
 assert((await fetch(base+'/api/contact',{method:'POST',headers:{origin:'https://evil.test','Content-Type':'application/json'},body:'{}'})).status===403,'Contact rejects remote origin');
 const missing=await fetch(worker+'/el/does-not-exist');assert(missing.status===404&&(await missing.text()).includes('Η σελίδα δεν βρέθηκε'),'Worker preserves localized Greek 404');
 const devMissing=await fetch(base+'/el/does-not-exist');assert(devMissing.status===404&&(await devMissing.text()).includes('Η σελίδα δεν βρέθηκε'),'Astro preserves localized Greek 404');
 const cms=readFileSync('.generated/cms.json','utf8');const record=JSON.parse(original.toString('utf8'));record.seoDescription='Task 4 live publication freshness proof';edit.replace(Buffer.from(JSON.stringify(record,null,2)+'\n'));
 await until(async()=>{const m=JSON.parse(readFileSync('.generated/manifest.json','utf8'));return m.articles[0].description===record.seoDescription&&(await html('/en/insights/a-useful-first-question')).includes(record.seoDescription);},15000);
 assert(true,'Canonical save updates public page and backend manifest without restart');assert(readFileSync('.generated/cms.json','utf8')===cms,'Copy-only save keeps CMS descriptor bytes unchanged');
 edit.restore();
 await until(async()=>!JSON.parse(readFileSync('.generated/manifest.json','utf8')).articles[0].description.includes('Task 4')&&!(await html('/en/insights/a-useful-first-question')).includes(record.seoDescription),15000);
 assert(digest(readFileSync('content/articles/sample-article.json'))===digest(original),'Canonical source restored byte-for-byte');
 evidence.sourceAfter=digest(readFileSync('content/articles/sample-article.json'));
 }catch(error){failure=error;}finally{
 try{
  await cleanupOwnedEdit(edit,async()=>{
   if(child.exitCode===null){child.stdin.write(Buffer.from([3]));await Promise.race([exited,delay(10000).then(()=>{throw Error('Launcher failed to stop');})]);}
  });
 }catch(error){failure??=error;}
 evidence.ownedPids=[...output.matchAll(/Owned (\w+) process (\d+)/g)].map(m=>({name:m[1],pid:Number(m[2])}));
 for(const {pid}of evidence.ownedPids){let alive=true;try{process.kill(pid,0);}catch{alive=false;}if(alive)failure??=Error('Owned process '+pid+' did not stop');else evidence.checks.push('Owned process '+pid+' stopped');}
 evidence.originalBackup=edit.backupPath;
 evidence.unexpectedSnapshot=edit.conflictPath;
 try{evidence.sourceAfter=digest(readFileSync('content/articles/sample-article.json'));}catch{evidence.sourceAfter='missing';}
 if(failure)evidence.error=failure.message;
 writeFileSync('.generated/task4-smoke.json',JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence,null,2));
}
if(failure)throw failure;
