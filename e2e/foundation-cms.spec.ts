import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCmsSources} from './helpers/cms-source-ownership';
import {createCmsEvidence} from './helpers/cms-evidence';
const cms=process.env.E2E_CMS_URL;
test.skip(!cms,'Opt in with E2E_CMS_URL pointing to the running site with native CMS.');
test.describe.configure({mode:'serial',timeout:180000});
let visit=0;
let evidence:ReturnType<typeof createCmsEvidence>;
// Initialization must succeed before any native UI edit/save.
test.beforeAll(()=>{evidence=createCmsEvidence();});
async function open(page:Page,path:string){
 await page.goto(cms+'/cms/index.html?visit='+ ++visit+'#/collections/edit/'+path);
 const enter=page.getByRole('button',{name:'Enter Edit Mode',exact:true});
 await expect(page.getByRole('button',{name:/^(Enter Edit Mode|Save)$/}).first()).toBeVisible({timeout:30000});
 if(await enter.isVisible())await enter.click();
 await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible({timeout:30000});
}
async function locale(page:Page,language:string){if(language==='el'){await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();}}
async function bold(page:Page,index:number,text:string){
 const editor=page.locator('[contenteditable=true]').nth(index);await editor.click();await editor.focus();await expect(editor).toBeFocused();await page.waitForTimeout(400);await page.keyboard.press('Control+a');await page.waitForTimeout(400);await page.keyboard.press('Backspace');await expect(editor).toHaveText(/^[\uFEFF\s]*$/);await page.keyboard.type(text,{delay:20});await page.keyboard.press('Home');await page.keyboard.press('Shift+End');await page.waitForTimeout(250);await page.getByRole('radio',{name:'format bold',exact:true}).nth(index).click();await expect(editor.locator('strong')).toHaveText(text);
}
async function save(page:Page,sources:ReturnType<typeof createCmsSources>,path:string,predicate:(data:any)=>boolean){
 const schema=JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8'));
 sources.assertUnchanged();
 const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname==='/graphql'&&r.request().method()==='POST'&&(r.request().postData()||'').includes('updateDocument'));
 await page.getByRole('button',{name:'Save',exact:true}).click();const response=await responsePromise;expect(response.ok()).toBe(true);expect((await response.json()).errors||[]).toEqual([]);
 const mutation={...response.request().postDataJSON().variables,operation:'update' as const};
 // Expected content comes exclusively from this actual native request and active generated schema.
 await evidence.captureNative(sources,path,mutation,schema,predicate);
}
const sha=(bytes:string)=>createHash('sha256').update(bytes).digest('hex');
test('native bilingual offering rich text, cleared SEO, editor reload and public rendering restore exactly',async({page,context})=>{
 const path='content/offerings/sample-service.json',sources=createCmsSources([path]);const site=await context.newPage();const checks:string[]=[];
 try{
  for(const language of ['en','el']){
   const description=language==='en'?'Foundation native description':'Εγγενής περιγραφή υποδομής';const body=language==='en'?'Foundation native body':'Εγγενές περιεχόμενο υποδομής';
   await open(page,'offering/sample-service');await locale(page,language);await bold(page,0,description);await bold(page,1,body);
   const seo=page.locator(`[name="${language==='el'?'translations.el.':''}seoDescription"]`);await seo.fill('Temporary native SEO proof');
   await save(page,sources,path,d=>{const r=language==='en'?d:d.translations.el;return r.description.includes('**'+description+'**')&&r.body.includes('**'+body+'**')&&r.seoDescription==='Temporary native SEO proof';});
   await open(page,'offering/sample-service');await locale(page,language);await expect(page.locator('[contenteditable=true]').nth(0).locator('strong')).toHaveText(description);await expect(page.locator('[contenteditable=true]').nth(1).locator('strong')).toHaveText(body);
   await page.locator(`[name="${language==='el'?'translations.el.':''}seoDescription"]`).fill('');
   await save(page,sources,path,d=>{const r=language==='en'?d:d.translations.el;return !r.seoDescription&&r.description.includes(description)&&r.body.includes(body);});
   await open(page,'offering/sample-service');await locale(page,language);await expect(page.locator(`[name="${language==='el'?'translations.el.':''}seoDescription"]`)).toHaveValue('');
   await site.goto('/'+language+'/services/planning-session');await expect(site.locator('main strong').filter({hasText:description})).toBeVisible();await expect(site.locator('main strong').filter({hasText:body})).toBeVisible();checks.push(language+' rich description/body and cleared SEO persisted, reloaded and rendered');
  }
 }finally{
  await sources.restore(()=>site.close());
  expect(readFileSync(path,'utf8')).toBe(sources.originalBytes(path));writeFileSync('.generated/evidence/native-offering.json',JSON.stringify({checks,backup:sources.backup,before:sha(sources.originalBytes(path)),after:sha(readFileSync(path,'utf8'))},null,2));
 }
});
test('native page hides an optional section but protects the required hero',async({page,context})=>{
 const path='content/pages/home.json',sources=createCmsSources([path]);const site=await context.newPage();
 try{
  await open(page,'page/home');await page.getByRole('checkbox',{name:'Show section'}).nth(1).uncheck();
  await save(page,sources,path,d=>d.sections[0].enabled&&!d.sections[1].enabled);
  await open(page,'page/home');await expect(page.getByRole('checkbox',{name:'Show section'}).nth(1)).not.toBeChecked();
  for(const language of ['en','el']){await site.goto('/'+language);await expect(site.locator('#services_preview')).toHaveCount(0);await expect(site.locator('main h1')).toHaveCount(1);}
  const saved=readFileSync(path,'utf8');await expect(page.getByRole('checkbox',{name:'Show section'}).nth(0)).toBeDisabled();await expect(page.getByRole('checkbox',{name:'Show section'}).nth(0)).toBeChecked();expect(readFileSync(path,'utf8')).toBe(saved);sources.assertUnchanged();
 }finally{await sources.restore(()=>site.close());expect(readFileSync(path,'utf8')).toBe(sources.originalBytes(path));writeFileSync('.generated/evidence/native-page.json',JSON.stringify({backup:sources.backup,before:sha(sources.originalBytes(path)),after:sha(readFileSync(path,'utf8'))},null,2));}
});
