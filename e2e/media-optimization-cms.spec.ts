import {test,expect} from '@playwright/test';
import {readFileSync,existsSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {createCmsSources} from './helpers/cms-source-ownership';
import {createOwnedMedia} from './helpers/owned-media';
import {expectedNativeDocument,type Mutation,type Schema} from './helpers/native-document';
import {createMediaOptimizationFixture} from './helpers/media-optimization-fixture';
import {createMediaAcceptanceRun} from '../scripts/media-optimization-acceptance.mjs';
import {assertCanonicalSnapshot} from '../scripts/composition-c-snapshot.mjs';
import {resolvePorts,assertPortsFree} from '../scripts/ports.mjs';
import {mediaRuntime,cleanupMediaBrowser} from './helpers/media-optimization-runtime';
import {mediaPage,upload,hash,writeEvidence} from './helpers/media-optimization-acceptance';

test('native original selection/clear and live upload lifecycle with pre-dispatch complete ownership',async({browser})=>{
 test.setTimeout(600000);
 const config=createMediaOptimizationFixture({documents:[],media:[]});const directory=config.directory;const ports=resolvePorts();await assertPortsFree(ports);
 let expected={...config.before};const check=()=>assertCanonicalSnapshot(expected);const runtimes:ReturnType<typeof mediaRuntime>[]=[];
 const run=createMediaAcceptanceRun({expected:()=>expected,isStopped:()=>runtimes.every(r=>r.closed())});
 const path='content/pages/media_native_acceptance.json',sources=createCmsSources([path],join(directory,'native-record'),{allowCreate:true});
 const names=['large-photo.jpg','portrait.jpg'];const media=names.map(name=>createOwnedMedia('apps/site/public'+upload(name),join(directory,'originals')));
 const livePath='apps/site/public/uploads/media-live-upload.png',live=createOwnedMedia(livePath,join(directory,'live'));let liveExists=false;
 const document=mediaPage();document.contentId='media_native_acceptance';document.slug='media-native-acceptance';document.sections=document.sections.filter(s=>['intro','media_0'].includes(s.id));document.copy.sections=document.copy.sections.filter(s=>['intro','media_0'].includes(s.id));document.translations.el.copy.sections=document.translations.el.copy.sections.filter(s=>['intro','media_0'].includes(s.id));
 let prior:any=document,pending:any,schema:Schema;const saves:any[]=[];let context:Awaited<ReturnType<typeof browser.newContext>>|undefined;
 try{
  check();names.forEach((name,i)=>{const bytes=readFileSync('tests/fixtures/media-optimization/'+name);media[i].create(bytes);expected['apps/site/public'+upload(name)]=hash(bytes);check();});
  sources.createAbsent(path,document,()=>true);expected[path]=hash(JSON.stringify(document,null,2)+'\n');check();
  await run.configure();await run.build();
  runtimes.push(mediaRuntime(directory,'tina',[resolve('node_modules/@tinacms/cli/bin/tinacms'),'dev','--port',String(ports.tina),'--datalayer-port',String(ports.datalayer),'--noTelemetry']));
  await expect.poll(()=>runtimes[0].output(),{timeout:120000}).toMatch(/TinaCMS Dev Server is active/);
  runtimes.push(mediaRuntime(directory,'astro',[resolve('apps/site/node_modules/astro/bin/astro.mjs'),'dev','--host','127.0.0.1','--port',String(ports.site)],resolve('apps/site')));
  await expect.poll(async()=>{try{return(await fetch('http://127.0.0.1:'+ports.site+'/en/media-native-acceptance')).status;}catch{return 0;}},{timeout:60000}).toBe(200);
  schema=JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8'));writeEvidence(directory,'installed-schema.json',schema);
  const require=createRequire(import.meta.url);const graphqlPath=realpathSync(resolve(dirname(require.resolve('@tinacms/cli')),'../../graphql/dist/index.js'));const graphql=await import(pathToFileURL(graphqlPath).href);expect(typeof graphql.stringifyFile).toBe('function');
  writeEvidence(directory,'installed-serializer.json',{path:graphqlPath,sha256:hash(readFileSync(graphqlPath)),format:'.json',keepTemplateKey:true,bridge:'installed FilesystemBridge.put writes serializer bytes without newline'});
  context=await browser.newContext();const page=await context.newPage();const publicPage=await context.newPage();let liveQueries=0;
  page.on('response',async r=>{if(r.url().endsWith('/graphql')&&r.request().method()==='POST'&&!/(?:create|update)Document/.test(r.request().postData()||'')){if(r.status()===200)liveQueries++;}});
  await page.route('**/graphql',async route=>{const data=route.request().postDataJSON();if(route.request().method()==='POST'&&/(?:create|update)Document/.test(data?.query||'')){
   check();sources.assertUnchanged();const request={...data.variables,operation:data.query.includes('createDocument')?'create':'update'} as Mutation;const complete=await expectedNativeDocument(request,schema,prior);const bytes=graphql.stringifyFile(complete,'.json',true);pending={request,complete,bytes,sha256:hash(bytes)};writeEvidence(directory,'pre-dispatch-'+saves.length+'.json',pending);
  }await route.continue();});
  async function open(){await page.goto('http://127.0.0.1:'+ports.site+'/cms/index.html?media='+Date.now()+'#/collections/edit/page/media_native_acceptance');const enter=page.getByRole('button',{name:'Enter Edit Mode',exact:true});await expect(enter.or(page.getByRole('button',{name:'Save',exact:true})).first()).toBeVisible({timeout:60000});if(await enter.isVisible())await enter.click();await expect(page.locator('[data-section-media=media_0]')).toBeVisible({timeout:30000});sources.assertUnchanged();check();}
  async function save(predicate:(d:any)=>boolean){check();sources.assertUnchanged();pending=undefined;const response=page.waitForResponse(r=>r.request().method()==='POST'&&(r.request().postData()||'').includes('updateDocument'));await page.getByRole('button',{name:'Save',exact:true}).click();expect((await(await response).json()).errors||[]).toEqual([]);expect(pending).toBeTruthy();await sources.captureNative(path,pending.request,schema,predicate);expected[path]=pending.sha256;check();expect(readFileSync(path,'utf8')).toBe(pending.bytes);prior=pending.complete;saves.push(pending);writeEvidence(directory,'native-saves.json',saves);}
  await open();const control=page.locator('[data-section-media=media_0]');await control.locator('button').first().click();await page.getByText('media-acceptance-portrait.jpg',{exact:true}).click();await page.getByRole('button',{name:'Insert',exact:true}).click();
  await save(d=>d.sections.find((s:any)=>s.id==='media_0').media.src===upload('portrait.jpg')&&!JSON.stringify(d).includes('/_media/'));
  await publicPage.goto('http://127.0.0.1:'+ports.site+'/en/media-native-acceptance');const rendered=publicPage.locator('[aria-labelledby=media_0] img');await rendered.scrollIntoViewIfNeeded();await expect.poll(()=>rendered.evaluate((e:HTMLImageElement)=>e.currentSrc)).toContain('/_media/v1/');const oldUrl=await rendered.evaluate((e:HTMLImageElement)=>e.currentSrc);
  const replacement=await sharp({create:{width:800,height:500,channels:3,background:'#427'}}).jpeg().toBuffer();check();media[1].replace(replacement);expected['apps/site/public'+upload('portrait.jpg')]=hash(replacement);check();
  await expect(async()=>{await publicPage.reload();await rendered.scrollIntoViewIfNeeded();await expect.poll(()=>rendered.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);expect(await rendered.evaluate((e:HTMLImageElement)=>e.currentSrc)).not.toBe(oldUrl);}).toPass({timeout:30000});const newUrl=await rendered.evaluate((e:HTMLImageElement)=>e.currentSrc);writeEvidence(directory,'responsive-same-path.json',{oldUrl,newUrl,replacementSha256:hash(replacement)});
  check();media[1].restore();delete expected['apps/site/public'+upload('portrait.jpg')];check();await expect(async()=>{await publicPage.reload();await expect(publicPage.locator('body')).toContainText('Page media_native_acceptance, section media_0: cannot render image');}).toPass({timeout:30000});writeEvidence(directory,'referenced-unlink.json',{contextualVisibleFailure:true,missingSource:upload('portrait.jpg'),note:'Astro development error page can retain streamed HTTP 200; visible contextual failure is the contract'});media[1].create(replacement);expected['apps/site/public'+upload('portrait.jpg')]=hash(replacement);check();await expect(async()=>{expect((await publicPage.reload())!.status()).toBe(200);await rendered.scrollIntoViewIfNeeded();await expect.poll(()=>rendered.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);}).toPass({timeout:30000});
  const astSelected=saves[0].request.params.page.standard.copy.sections.find((s:any)=>s.media_text)?.media_text?.body;
  await open();writeEvidence(directory,'clear-controls.json',await control.locator('button').evaluateAll(es=>es.map(e=>({text:e.textContent,title:e.getAttribute('title'),'aria-label':e.getAttribute('aria-label')}))));
  await control.locator('button').nth(1).click();
  await save(d=>!d.sections.find((s:any)=>s.id==='media_0').media&&d.copy.sections.find((s:any)=>s.id==='media_0').body===prior.copy.sections.find((s:any)=>s.id==='media_0').body&&!JSON.stringify(d).includes('/_media/'));
  const astCleared=saves[1].request.params.page.standard.copy.sections.find((s:any)=>s.media_text)?.media_text?.body;expect(astSelected).toBeTruthy();expect(astCleared).toEqual(astSelected);await open();expect(await control.locator('img').count()).toBe(0);expect(liveQueries).toBeGreaterThan(0);writeEvidence(directory,'native-query-proof.json',{successfulUiQueries:liveQueries,schemaSha256:hash(readFileSync('tina/__generated__/_schema.json')),originalsRetained:media.every(m=>m.owns()),unchangedBodyAst:true});await page.screenshot({path:join(directory,'native-cleared.png'),fullPage:true});
  // The watcher is Astro's actual upload integration; no content mutation is needed to verify upload events.
  const first=await sharp({create:{width:700,height:350,channels:3,background:'#752'}}).png().toBuffer();check();live.create(first);liveExists=true;expected[livePath]=hash(first);check();
  await expect.poll(async()=>{const r=await fetch('http://127.0.0.1:'+ports.site+'/uploads/media-live-upload.png');return r.status===200?hash(Buffer.from(await r.arrayBuffer())):'';}).toBe(hash(first));
  const changed=await sharp({create:{width:900,height:600,channels:3,background:'#275'}}).png().toBuffer();live.replace(changed);expected[livePath]=hash(changed);check();
  await expect.poll(async()=>hash(Buffer.from(await(await fetch('http://127.0.0.1:'+ports.site+'/uploads/media-live-upload.png')).arrayBuffer()))).toBe(hash(changed));
  live.restore();liveExists=false;delete expected[livePath];check();await expect.poll(async()=>(await fetch('http://127.0.0.1:'+ports.site+'/uploads/media-live-upload.png')).status).toBe(404);writeEvidence(directory,'upload-events.json',{add:true,change:true,unlink:true,samePathReplacement:true,first:hash(first),changed:hash(changed)});
 }finally{
  await cleanupMediaBrowser({closeBrowser:()=>context?.close(),stops:runtimes.map((runtime,i)=>({id:'runtime-'+i,stop:()=>runtime.stop()})),restores:[{id:'native-record',restore:()=>sources.restore()},...media.map((m,i)=>({id:'original-'+i,restore:()=>m.restore(),dependsOn:['native-record']})),{id:'live-original',restore:()=>liveExists?live.restore():true},{id:'project',restore:()=>config.cleanup()}],assertInputs:()=>{expected={...config.before};check();},regenerate:[{id:'configure-restored',run:()=>run.configure()}],record:state=>writeEvidence(directory,'native-cleanup.json',state)});run.finish();
 }
});
