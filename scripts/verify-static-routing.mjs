import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync, readdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {unstable_dev} from 'wrangler';

// Acceptance for the current EN/EL enquiries seed, default locale and seeded slugs;
// this is not an arbitrary configured-site verifier.
// A private, disposable asset copy prevents fixtures from touching built/canonical files.
const root=process.cwd();
mkdirSync('.generated/routing',{recursive:true});
const owned=mkdtempSync(resolve('.generated/routing/run-'));
let server;
try {
 const assets=join(owned,'assets');
 cpSync('apps/site/dist',assets,{recursive:true});
 for(const path of ['cms/index.html','admin/index.html','api/health/index.html','newsletter/confirm/index.html']) {
  const file=join(assets,path);mkdirSync(resolve(file,'..'),{recursive:true});writeFileSync(file,'PRIVATE COLLISION');
 }
 const entry=join(owned,'worker.ts');
 writeFileSync(entry,`import real from ${JSON.stringify(resolve('worker/index.ts').replaceAll('\\','/'))};
export default {async fetch(request,env,ctx){
const path=new URL(request.url).pathname;
if(path!=='/'&&!/^\\/(api|admin|cms|newsletter)(\\/|$)/.test(path)) return new Response('Unexpected public Worker invocation',{status:599});
const response=await real.fetch(request,env,ctx);const result=new Response(response.body,response);result.headers.set('X-Owned-Routing-Worker','1');return result;
}};`);
 const config=JSON.parse(readFileSync('wrangler.generated.json','utf8'));
 config.main=entry;config.assets.directory=assets;
 delete config.d1_databases;delete config.queues;delete config.triggers;delete config.workflows;
 const configPath=join(owned,'wrangler.json');writeFileSync(configPath,JSON.stringify(config));
 server=await unstable_dev(entry,{config:configPath,port:0,inspectorPort:0,local:true,persist:false,logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
 const request=async(path,init={})=>server.fetch(path,{redirect:'manual',...init});
 const staticResponse=async(path,status,init={})=>{
  const response=await request(path,init);
  assert.equal(response.status,status,path+' status');assert.equal(response.headers.get('X-Owned-Routing-Worker'),null,path+' invoked Worker');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff',path+' security headers');
  assert.match(response.headers.get('content-security-policy')||'',/default-src 'self'/);
  return response;
 };
 for(const locale of ['en','el']) {
  const title=locale==='el'?'Η σελίδα δεν βρέθηκε':'Page not found';
  for(const headers of [{},{'Sec-Fetch-Mode':'navigate'}]) {
   await staticResponse('/'+locale,200,{headers});
   for(const suffix of ['/about','/contact','/services/planning-session','/people/studio-guide','/insights/a-useful-first-question','/feed.xml']) await staticResponse('/'+locale+suffix,200,{headers});
   for(const suffix of ['/missing','/missing/deeper','/missing.js','/%3Cscript%3E']) {
    const response=await staticResponse('/'+locale+suffix,404,{headers});assert.ok((await response.text()).includes(title),'localized missing '+locale+suffix);
   }
  }
  await staticResponse('/'+locale+'/missing',404,{method:'HEAD'});
  const conditional=await staticResponse('/'+locale+'/missing',404,{headers:{'If-None-Match':'"nonmatching"','If-Modified-Since':'Wed, 21 Oct 2099 07:28:00 GMT'}});
  assert.ok((await conditional.text()).includes(title));
  const page=await staticResponse('/'+locale,200);const etag=page.headers.get('etag');assert.ok(etag);
  await staticResponse('/'+locale,304,{headers:{'If-None-Match':etag}});
  const redirect=await staticResponse('/'+locale+'/',307);assert.equal(redirect.headers.get('location'),'/'+locale);
  const intrinsic=await staticResponse('/'+locale+'/404.html',307);assert.equal(intrinsic.headers.get('location'),'/'+locale+'/404');
  await staticResponse('/'+locale+'/404/index.html',200);
  // Existing explicit 404 route remains addressable as a page; missing paths are 404.
  assert.ok((await (await staticResponse('/'+locale+'/404',200)).text()).includes(title));
 }
 // Existing compiled JS, CSS and fonts use the same asset security boundary.
 const compiled=readdirSync(join(assets,'_astro')).filter(name=>/\.(js|css|woff2)$/.test(name));
 assert.ok(compiled.some(name=>name.endsWith('.js'))&&compiled.some(name=>name.endsWith('.css'))&&compiled.some(name=>name.endsWith('.woff2')));
 for(const name of compiled) await staticResponse('/_astro/'+name,200);
 const post=await request('/el/missing',{method:'POST'});assert.equal(post.status,405);assert.equal(post.headers.get('X-Owned-Routing-Worker'),null);
 // Root 404-page fallback also bypasses the Worker for unknown nonlocale GETs.
 await staticResponse('/unknown-prefix/missing',404);
 await staticResponse('/unknown-prefix/missing',404,{headers:{'Sec-Fetch-Mode':'navigate'}});
 const rootRedirect=await request('/');assert.equal(rootRedirect.status,302);assert.equal(rootRedirect.headers.get('X-Owned-Routing-Worker'),'1');assert.equal(new URL(rootRedirect.headers.get('location')).pathname,'/en');
 for(const [path,status,method] of [['/api/health',200,'GET'],['/api',404,'GET'],['/api/contact',403,'POST'],['/newsletter',404,'GET'],['/newsletter/confirm',404,'GET'],['/admin',404,'GET'],['/admin/campaigns',404,'GET'],['/cms',503,'GET'],['/cms/index.html',503,'GET']]) {
  const response=await request(path,{method});assert.equal(response.status,status,path);assert.equal(response.headers.get('X-Owned-Routing-Worker'),'1',path+' must invoke Worker');assert.notEqual(await response.text(),'PRIVATE COLLISION',path+' exposed collision');
 }
 const localCms=await request('http://127.0.0.1:'+server.port+'/cms');
 assert.equal(localCms.status,200,'local CMS allowed');assert.equal(localCms.headers.get('X-Owned-Routing-Worker'),'1');assert.equal(await localCms.text(),'PRIVATE COLLISION');
 console.log('Built routing acceptance passed: public assets/misses bypass Worker; explicit privileged routes invoke real Worker.');
} finally {
 await server?.stop();
 // Only the unique directory created by this process is removed.
 assert.ok(owned.startsWith(resolve('.generated/routing')+'\\')||owned.startsWith(resolve('.generated/routing')+'/'));
 rmSync(owned,{recursive:true,force:true});
}

