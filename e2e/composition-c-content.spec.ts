import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {resolve,join} from 'node:path';
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {unstable_dev} from 'wrangler';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {getEnquiryContexts} from '../packages/content/enquiry-contexts.mjs';
import {acceptanceOwner,publicIndex,publicRoom,astro} from './helpers/composition-c-acceptance';
test.skip(process.env.E2E_COMPOSITION_C!=='1','Owned Composition C acceptance only');
test('EN/EL listing, details, contact, images, text-only, keyboard and no-JS at 375/768/1440',async({browser})=>{
 test.setTimeout(360000);const owner=await acceptanceOwner('public');let runtime:Awaited<ReturnType<typeof unstable_dev>>|undefined;
 try{
  owner.mutate({...owner.base,modules:{rooms:true}},publicIndex(),[publicRoom('task6-suite'),publicRoom('task6-text',false)]);
  const project=parseProject(JSON.parse(readFileSync('project.json','utf8'))),source=readContent(process.cwd(),project);const index=source.pages.find(p=>p.contentId==='rooms')!;index.translations.el.status='draft';const english=localizeContent(source,'en',project),greek=localizeContent(source,'el',project);expect(english.domains.rooms![0].alternates).toEqual([{locale:'en',path:'/en/rooms/task6-suite'}]);expect(greek.domains.rooms).toEqual([]);expect(getEnquiryContexts(greek).some(c=>c.kind==='rooms')).toBe(false);owner.log('unpublished-index-proof.json',{clock:source.now,englishRooms:english.domains.rooms,greekRooms:greek.domains.rooms});
  await owner.command(['scripts/configure.mjs']);await owner.command([astro,'build'],resolve('apps/site'));
  const walk=(path:string):string[]=>readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(path,e.name)):[join(path,e.name)]);owner.log('output-inventory.json',walk('apps/site/dist'));for(const locale of ['en','el'])for(const id of ['task6-suite','task6-text'])expect(existsSync('apps/site/dist/'+locale+'/rooms/'+id+'/index.html')).toBe(true);
  const worker=JSON.parse(readFileSync('wrangler.generated.json','utf8'));worker.main=resolve('worker/index.ts');worker.assets.directory=resolve('apps/site/dist');for(const key of ['d1_databases','queues','triggers','workflows'])delete worker[key];const config=join(owner.directory,'wrangler.json');writeFileSync(config,JSON.stringify(worker));
  runtime=await unstable_dev(worker.main,{config,port:0,inspectorPort:0,local:true,persist:false,logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});owner.started(async()=>{await runtime!.stop();});
  const baseURL='http://127.0.0.1:'+runtime.port;const audits:any[]=[];
  for(const javaScriptEnabled of [true,false]){const context=await browser.newContext({baseURL,javaScriptEnabled});try{
   const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
   for(const locale of ['en','el'])for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const path of ['/rooms','/rooms/task6-suite','/rooms/task6-text']){
     expect((await page.goto('/'+locale+path))!.status()).toBe(200);await expect(page.locator('h1')).toHaveCount(1);for(const other of ['en','el'])await expect(page.locator('link[rel="alternate"][hreflang="'+other+'"]')).toHaveAttribute('href',owner.base.siteUrl+'/'+other+path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
     if(path.endsWith('task6-text'))await expect(page.locator('main img')).toHaveCount(0);
     for(const image of await page.locator('main img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);const info=await image.evaluate((e:HTMLImageElement)=>({w:Number(e.getAttribute('width')),h:Number(e.getAttribute('height')),nw:e.naturalWidth,nh:e.naturalHeight,fit:getComputedStyle(e).objectFit,pos:getComputedStyle(e).objectPosition}));expect(info.w).toBe(info.nw);expect(info.h).toBe(info.nh);expect(info.w).toBeGreaterThan(0);expect(info.fit).toBe('cover');expect(info.pos).toBe('50% 0%');}
     for(const href of await page.locator('main a').evaluateAll(es=>es.map(e=>e.getAttribute('href')!)))expect(href).toMatch(new RegExp('^/'+locale+'(?:/|$)'));
     if(javaScriptEnabled&&width===375){const audit=await new AxeBuilder({page}).analyze();owner.log(locale+path.replaceAll('/','-')+'-axe.json',audit);expect(audit.violations).toEqual([]);await page.screenshot({path:join(owner.directory,locale+path.replaceAll('/','-')+'.png'),fullPage:true});audits.push({locale,path,width,violations:audit.violations.length});}
    }
    await page.goto('/'+locale+'/rooms/task6-suite');const cta=page.getByRole('link',{name:locale==='en'?'Enquire about this room':'Ρωτήστε για αυτό το δωμάτιο'});await cta.focus();await expect(cta).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#contextId option[value="task6-suite"]')).toHaveCount(1);if(javaScriptEnabled)await expect(page.locator('#contextId')).toHaveValue('task6-suite');await expect(page.locator('h1')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   }
   expect(errors).toEqual([]);
  }finally{await context.close();}}
  owner.log('public-proof.json',{locales:['en','el'],widths:[375,768,1440],javascript:[true,false],routes:3,audits});
 }finally{await owner.cleanup();}
});
