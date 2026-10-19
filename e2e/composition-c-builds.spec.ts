import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {unstable_dev} from 'wrangler';
import {acceptanceOwner,publicIndex,publicRoom,astro} from './helpers/composition-c-acceptance';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {getEnquiryContexts} from '../packages/content/enquiry-contexts.mjs';
import {createCmsDescriptor} from '../scripts/cms-descriptor.mjs';
import {buildDomainCollections} from '../tina/domains';
import {availableSections} from '../tina/fields/composition';
import {normalizePageDocument} from '../packages/content/documents.mjs';

test.skip(process.env.E2E_COMPOSITION_C!=='1','Owned Composition C acceptance only');
test('all 12 pure module/profile/article combinations preserve native and public metadata',async()=>{
 const owner=await acceptanceOwner('pure-matrix');try{const rows=[];for(const rooms of [false,true])for(const profile of ['enquiries','newsletter','nurture'])for(const articles of [false,true]){
 const project=parseProject({...owner.base,modules:{rooms},profile,articles});const content=readContent(process.cwd(),project);const dormant=publicIndex();dormant._template='standard';dormant.contentId='task6_dormant';dormant.slug='task6-dormant';const saved=structuredClone(dormant);const normalized=normalizePageDocument(dormant);expect(dormant).toEqual(saved);content.pages.push(normalized);expect(availableSections(articles,project).some(d=>d.type==='room-list')).toBe(rooms);const descriptor=createCmsDescriptor(process.cwd(),project);expect(buildDomainCollections(project).some(c=>c.name==='room')).toBe(rooms);expect(descriptor.domainPageFiles.includes('rooms')).toBe(!rooms);for(const locale of ['en','el']){const localized=localizeContent(content,locale,project);expect(getEnquiryContexts(localized).some(c=>c.kind==='rooms')).toBe(false);expect(localized.pages.some(p=>p._template==='rooms')).toBe(false);expect(localized.pages.find(p=>p.contentId==='task6_dormant')!.sections.some(s=>s._template==='room-list')).toBe(rooms);expect(localized.settings.navigation.some(n=>n.pageId==='rooms')).toBe(false);}rows.push({rooms,profile,articles,passed:true});}owner.log('matrix.json',rows);expect(rows).toHaveLength(12);}finally{await owner.cleanup();}
});
for(const [rooms,profile,articles] of [[false,'enquiries',true],[true,'enquiries',true],[true,'enquiries',false],[true,'newsletter',true],[true,'nurture',true]] as const)test(`owned full build/CMS/Worker rooms=${rooms} ${profile} articles=${articles}`,async({browser})=>{
 test.setTimeout(360000);const owner=await acceptanceOwner('build-'+rooms+'-'+profile+'-'+articles);let runtime:Awaited<ReturnType<typeof unstable_dev>>|undefined;
 try{
  const index=publicIndex();owner.mutate({...owner.base,modules:{rooms},profile,articles},rooms?index:'{ malformed dormant index',rooms?[]:[{malformed:'disabled record'}]);
  await owner.command(['scripts/configure.mjs']);await owner.command(['scripts/dev.mjs','--cms-build']);const nativeSchema=readFileSync('tina/__generated__/schema.gql','utf8');expect(/roomConnection\s*\(/.test(nativeSchema)).toBe(rooms);owner.log('native-schema.gql',nativeSchema);await owner.command([astro,'build'],resolve('apps/site'));await owner.command(['scripts/wrangler.mjs','deploy','--dry-run','--config','wrangler.generated.json']);
  const manifest=JSON.parse(readFileSync('.generated/manifest.json','utf8'));expect(manifest.enquiryContexts.some((c:any)=>c.kind==='rooms')).toBe(false);
  const walk=(path:string):string[]=>readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(path,e.name)):[join(path,e.name)]);owner.log('output-inventory.json',walk('apps/site/dist'));
  for(const locale of ['en','el']){expect(existsSync('apps/site/dist/'+locale+'/rooms/index.html')).toBe(rooms);if(!articles){expect(existsSync('apps/site/dist/'+locale+'/insights')).toBe(false);expect(existsSync('apps/site/dist/'+locale+'/feed.xml')).toBe(false);}}
  const worker=JSON.parse(readFileSync('wrangler.generated.json','utf8'));worker.main=resolve('worker/index.ts');worker.assets.directory=resolve('apps/site/dist');for(const key of ['d1_databases','queues','triggers','workflows'])delete worker[key];const config=join(owner.directory,'wrangler.json');owner.log('wrangler.json',worker);runtime=await unstable_dev(worker.main,{config,port:0,inspectorPort:0,local:true,persist:false,logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});owner.started(async()=>{await runtime!.stop();});
  const context=await browser.newContext({baseURL:'http://127.0.0.1:'+runtime.port});try{const page=await context.newPage();expect((await runtime!.fetch('/api/health')).status).toBe(200);for(const locale of ['en','el'])for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});const response=await page.goto('/'+locale+'/rooms');expect(response!.status()).toBe(rooms?200:404);if(rooms){await expect(page.locator('h1')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByText(locale==='en'?'No rooms are currently available to view.':'Δεν υπάρχουν δωμάτια διαθέσιμα για προβολή.')).toBeVisible();await page.screenshot({path:join(owner.directory,locale+'-'+width+'-empty.png'),fullPage:true});}}}finally{await context.close();}
 }finally{await owner.cleanup();}
});
