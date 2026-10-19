import {test,expect,type Browser,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
import sharp from 'sharp';
import {staticOwner,outputDemand,workerFor,photoNames,upload,writeEvidence,walk,hash} from './helpers/media-optimization-acceptance';
import {createMediaSession} from '../packages/media/session.mjs';

test.describe.configure({timeout:900000});
const modes=[
 {environment:'local',theme:'neutral',density:'comfortable',rooms:4,profile:'enquiries',articles:true,enabled:true},
 {environment:'staging',theme:'accommodation',density:'compact',rooms:1,profile:'newsletter',articles:false,enabled:true},
 {environment:'production',theme:'trades',density:'spacious',rooms:2,profile:'nurture',articles:true,enabled:true},
 {environment:'local',theme:'wellness',density:'compact',rooms:3,profile:'enquiries',articles:false,enabled:true},
 {environment:'production',theme:'neutral',density:'spacious',rooms:0,profile:'enquiries',articles:false,enabled:false},
];
async function inspect(page:Page,enabled:boolean,locale:string){
 const rows:any[]=[];
 const itemCounts=new Map<string,number>();
 for(const image of await page.locator('main .section-image img').all()){
  await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
  const row=await image.evaluate((e:HTMLImageElement)=>{
   const source=e.parentElement?.querySelector('source');const sizes=source?.sizes||e.sizes;
   // Split only top-level commas: min()/clamp() contain their own delimiters.
   const rules:string[]=[];let depth=0,start=0;for(let i=0;i<sizes.length;i++){if(sizes[i]==='(')depth++;if(sizes[i]===')')depth--;if(sizes[i]===','&&depth===0){rules.push(sizes.slice(start,i).trim());start=i+1;}}rules.push(sizes.slice(start).trim());
   let expression='';for(const rule of rules){const m=rule.match(/^(\([^)]*\))\s+(.+)$/);if(!m||matchMedia(m[1]).matches){expression=m?m[2]:rule;break;}}
   const ruler=document.createElement('div');ruler.style.cssText='position:fixed;visibility:hidden;box-sizing:content-box;padding:0;border:0;width:'+expression;document.body.append(ruler);const expected=ruler.getBoundingClientRect().width;ruler.remove();
   return {alt:e.alt,caption:e.closest('figure')?.querySelector('figcaption')?.textContent||'',src:e.getAttribute('src'),currentSrc:e.currentSrc,srcset:e.srcset,selectedSrcset:source?.srcset||e.srcset,sizes,expected,frame:e.closest('.image-frame')!.getBoundingClientRect().width,width:e.getAttribute('width'),height:e.getAttribute('height'),naturalWidth:e.naturalWidth,fit:getComputedStyle(e).objectFit,crop:getComputedStyle(e).objectPosition,loading:e.loading,decoding:e.decoding,section:e.closest('section')?.getAttribute('aria-labelledby')||'room-detail'};
  });
  const itemIndex=itemCounts.get(row.section)??0;
  itemCounts.set(row.section,itemIndex+1);
  const gallery=row.section.startsWith('gallery_');
  const mediaIndex=row.section.startsWith('media_')?Number(row.section.slice(6)):undefined;
  const room=mediaIndex===undefined&&!gallery;
  const identity=gallery?'image_'+itemIndex:row.section;
  expect(row.alt).toBe(room?(locale==='el'?'Αφηρημένο τοπίο':'Abstract landscape'):(locale==='el'?'Εικόνα ':'Photo ')+identity);
  expect(row.caption).toBe(row.section==='room_list'?'':room?(locale==='el'?'Λεζάντα':'Caption'):(locale==='el'?'Λεζάντα εικόνας':'Photo caption'));
  const crop=room?'50% 0%':['50% 50%','50% 0%','50% 100%'][(gallery?itemIndex:mediaIndex!)%3];
  expect(row.crop).toBe(crop);
  const dimensions=mediaIndex===undefined?[3840,1725]:[[3840,1725],[300,600],[400,200],[100,50],[3,2],[800,400]][mediaIndex];
  const optimized=enabled&&mediaIndex!==4;
  const width=optimized?Math.min(dimensions[0],1920):dimensions[0];
  const height=Math.round(dimensions[1]*width/dimensions[0]);
  expect(Number(row.width)).toBe(width);
  expect(Math.abs(Number(row.height)-height)).toBeLessThanOrEqual(optimized?1:0);
  if(optimized){
   const selected=new URL(row.currentSrc).pathname;
   const entries=row.selectedSrcset.split(', ').map((entry:string)=>entry.split(' '));
   const candidate=entries.find(([url]:string[])=>url===selected);
   expect(candidate).toBeDefined();
   const selectedWidth=Number(candidate![1].slice(0,-1));
   const metadata=await sharp(readFileSync('apps/site/dist'+selected)).metadata();
   expect(metadata.width).toBe(selectedWidth);
   const intrinsic=await sharp(readFileSync('apps/site/dist'+row.src)).metadata();
   expect(Number(row.width)).toBe(intrinsic.width);
   expect(Number(row.height)).toBe(intrinsic.height);
   expect([320,640,960,1440,1920].filter(w=>w<=dimensions[0]).concat(Math.min(dimensions[0],1920))).toContain(metadata.width);
   expect(Math.abs(metadata.height!-Math.round(dimensions[1]*metadata.width!/dimensions[0]))).toBeLessThanOrEqual(1);
  }
  expect(row.fit).toBe('cover');
  expect(row.loading).toBe('lazy');
  expect(row.decoding).toBe('async');
  const animation=row.section==='media_4';if(enabled&&!animation){expect(row.currentSrc).toContain('/_media/v1/');expect(row.srcset).toContain('w');expect(Math.abs(row.expected-row.frame),JSON.stringify(row)).toBeLessThanOrEqual(1.1);}else {expect(row.currentSrc).toContain('/uploads/');expect(row.srcset).toBe('');}
  rows.push(row);
 }
 expect(rows.length).toBeGreaterThan(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);return rows;
}
for(const [index,mode]of modes.entries())test('real static '+JSON.stringify(mode),async({browser})=>{
 const owner=staticOwner(mode),{fixture,run}=owner;let runtime:Awaited<ReturnType<typeof workerFor>>|undefined;
 try{
  owner.setup();await run.configure();await run.build();
  const inventory=outputDemand();expect(inventory.published).toEqual(inventory.demanded);expect(inventory.published.length>0).toBe(mode.enabled);writeEvidence(run.directory,'publication.json',{mode,...inventory,originals:photoNames.map(name=>({name,persisted:existsSync('apps/site/dist'+upload(name))}))});
  for(const name of photoNames)expect(existsSync('apps/site/dist'+upload(name))).toBe(true);
  if(mode.environment!=='local'){expect(walk('apps/site/dist').some(p=>p.replaceAll('\\','/').includes('/design-system/'))).toBe(false);}
  runtime=await workerFor(run.directory);owner.started();writeEvidence(run.directory,'runtime.json',{port:runtime.port,started:new Date().toISOString()});
  const url='http://127.0.0.1:'+runtime.port;
  const unknown=await runtime.fetch('/_media/v1/'+ '0'.repeat(64)+'.webp');expect(unknown.status).toBe(404);expect(unknown.headers.get('X-Media-Acceptance-Worker')).toBe(null);expect(outputDemand()).toEqual(inventory);
  for(const path of inventory.published){const response=await runtime.fetch(path);expect(response.status).toBe(200);expect(response.headers.get('content-type')).toMatch(/image\/(webp|png|jpeg)/);expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");expect(response.headers.get('X-Media-Acceptance-Worker')).toBe(null);}
  expect((await runtime.fetch('/api/health')).headers.get('X-Media-Acceptance-Worker')).toBe('1');
  const matrix=index===0?['en','el'].flatMap(locale=>[375,640,768,1440].flatMap(width=>[1,2].flatMap(dpr=>[true,false].map(js=>({locale,width,dpr,js}))))):[{locale:index%2?'el':'en',width:640,dpr:2,js:false},{locale:index%2?'en':'el',width:1440,dpr:1,js:true}];
  if(index===0)for(const width of [626,627,767,769])matrix.push({locale:'en',width,dpr:1,js:true});
  const evidence:any[]=[];
  for(const scenario of matrix){const context=await browser.newContext({viewport:{width:scenario.width,height:900},deviceScaleFactor:scenario.dpr,javaScriptEnabled:scenario.js,baseURL:url});try{
   const page=await context.newPage();const requests:any[]=[];page.on('request',r=>requests.push({url:r.url(),method:r.method(),type:r.resourceType()}));
   for(const route of ['/media-acceptance',...(mode.rooms?['/rooms','/rooms/media-acceptance-0']:[])]){expect((await page.goto('/'+scenario.locale+route))!.status()).toBe(200);const rows=await inspect(page,mode.enabled,scenario.locale);evidence.push({...scenario,route,images:rows});
    if(index===0&&scenario.width===375&&scenario.dpr===1&&scenario.js&&route==='/media-acceptance'){const audit=await new AxeBuilder({page}).analyze();writeEvidence(run.directory,'axe-'+scenario.locale+'.json',audit);expect(audit.violations).toEqual([]);await page.screenshot({path:join(run.directory,scenario.locale+'-375.png'),fullPage:true});}
    if(index>0&&scenario.width===1440&&route==='/media-acceptance')await page.screenshot({path:join(run.directory,mode.theme+'-1440.png'),fullPage:true});
   }
   if(!mode.rooms)expect((await page.goto('/'+scenario.locale+'/rooms'))!.status()).toBe(404);
   if(!mode.articles)expect((await page.goto('/'+scenario.locale+'/insights'))!.status()).toBe(404);
   expect(requests.filter(r=>r.type==='image').every(r=>/^https?:\/\/127\.0\.0\.1:\d+\/(?:_media\/v1\/[a-f0-9]+\.(?:webp|png|jpg|jpeg)|uploads\/[^?]+)$/.test(r.url))).toBe(true);writeEvidence(run.directory,'requests-'+scenario.locale+'-'+scenario.width+'-'+scenario.dpr+'-'+scenario.js+'.json',requests);
  }finally{await context.close();}}
  writeEvidence(run.directory,'browser-matrix.json',evidence);
  if(index===0){const session=createMediaSession({root:process.cwd(),policy:{enabled:true,widths:[320,640,960,1440,1920],quality:80},mode:'build'});try{const table=[];for(const name of photoNames){const media=await session.resolve(upload(name));const source=await sharp(readFileSync('tests/fixtures/media-optimization/'+name)).metadata();table.push({name,source:{bytes:statSync('tests/fixtures/media-optimization/'+name).size,width:source.width,height:source.height,sha256:hash(readFileSync('tests/fixtures/media-optimization/'+name))},...media});}writeEvidence(run.directory,'candidate-table.json',table);const photo=table[0];expect(photo.webp.every(c=>c.bytes<photo.source.bytes)).toBe(true);expect(table[4].passthroughReason).toBe('animated-or-multipage');const selected=evidence.flatMap(e=>e.images.filter((i:any)=>i.section.startsWith('gallery_')).map((i:any)=>({src:i.currentSrc,bytes:statSync('apps/site/dist'+new URL(i.currentSrc).pathname).size,original:photo.source.bytes})));expect(selected.every(s=>s.bytes<s.original)).toBe(true);writeEvidence(run.directory,'selected-transfer.json',selected);}finally{await session.close();}}
 }finally{await fixture.cleanup({stops:[{id:'built-worker',stop:async()=>{await runtime?.stop();owner.stopped();writeEvidence(run.directory,'shutdown.json',{confirmed:true,ended:new Date().toISOString()});}}],regenerate:[{id:'configure-restored',run:()=>run.configure()}]});run.finish();}
});

// Scoped final-fix proof: one build and two representative bilingual contexts.
// The historical broad matrix remains attributed to its original source.
test('scoped static WebP responsive preservation and demand equality',async({browser})=>{
 const owner=staticOwner(modes[0]),{fixture,run}=owner;
 let runtime:Awaited<ReturnType<typeof workerFor>>|undefined;
 try {
  owner.setup();
  await run.configure();
  await run.build();
  const inventory=outputDemand();
  expect(inventory.published).toEqual(inventory.demanded);
  writeEvidence(run.directory,'publication.json',inventory);
  runtime=await workerFor(run.directory);
  owner.started();
  for(const scenario of [{locale:'en',width:375,dpr:2},{locale:'el',width:1440,dpr:1}]){
   const context=await browser.newContext({viewport:{width:scenario.width,height:900},deviceScaleFactor:scenario.dpr,baseURL:'http://127.0.0.1:'+runtime.port});
   try {
    const page=await context.newPage();
    expect((await page.goto('/'+scenario.locale+'/media-acceptance'))!.status()).toBe(200);
    const rows=await inspect(page,true,scenario.locale);
    const webp=page.locator('section[aria-labelledby="media_5"] picture');
    await expect(webp).toHaveCount(1);
    await expect(webp.locator('source')).toHaveCount(0);
    await expect(webp.locator('img')).toHaveAttribute('srcset',/320w, .*640w, .*800w/);
    await expect(webp.locator('img')).toHaveAttribute('width','800');
    await expect(webp.locator('img')).toHaveAttribute('height','400');
    const selected=rows.find(row=>row.section==='media_5')!.currentSrc;
    const response=await page.request.get(selected);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/webp');
    const decoded=await sharp(await response.body()).metadata();
    expect(decoded.format).toBe('webp');
    writeEvidence(run.directory,'scoped-'+scenario.locale+'.json',{scenario,rows,selected,decoded});
   } finally {await context.close();}
  }
  expect(outputDemand()).toEqual(inventory);
 } finally {
  await fixture.cleanup({stops:[{id:'built-worker',stop:async()=>{
   await runtime?.stop();owner.stopped();
   writeEvidence(run.directory,'shutdown.json',{confirmed:true,ended:new Date().toISOString()});
  }}],regenerate:[{id:'configure-restored',run:()=>run.configure()}]});
  run.finish();
 }
});
