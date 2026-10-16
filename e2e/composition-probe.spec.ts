import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createCmsSources} from './helpers/cms-source-ownership';
import {createCmsEvidence} from './helpers/cms-evidence';
const prose=(language:string,id:string)=>language==='el'?'Ελληνικό '+id+' κείμενο':'English '+id+' prose';
async function top(page:Page){await page.getByRole('navigation',{name:'breadcrumb'}).getByRole('button').nth(1).click();}
async function add(page:Page,label:string,template:string){await page.getByText(label,{exact:true}).locator('../..').getByRole('button').click();await page.getByRole('dialog').getByRole('button',{name:template,exact:true}).click();await page.getByRole('button',{name:template+' NEW',exact:true}).click();}
async function shared(page:Page,index:number,id:string){await add(page,'Shared sections','Shared rich text');await page.locator(`[name="sections.${index}.id"]`).fill(id);await top(page);}
async function copy(page:Page,language:string,index:number,id:string){
 if(language==='en')await page.getByRole('button',{name:'English copy',exact:true}).click();else{await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Greek copy',exact:true}).click();}
 await add(page,language==='en'?'English sections':'Greek sections','Rich text');const prefix=language==='en'?'copy':'translations.el';await page.locator(`[name="${prefix}.sections.${index}.id"]`).fill(id);await page.locator(`[name="${prefix}.sections.${index}.title"]`).fill(language+' '+id);
 const editor=page.locator('[contenteditable=true]');await editor.click();await editor.focus();await expect(editor).toBeFocused();await page.waitForTimeout(400);await page.keyboard.type(prose(language,id),{delay:20});await page.keyboard.press('Home');await page.keyboard.press('Shift+End');await page.waitForTimeout(250);await page.getByRole('radio',{name:'format bold',exact:true}).click();await expect(editor.locator('strong')).toHaveText(prose(language,id));await top(page);
}
test('native typed lists, create hook, canonical aliases and owned teardown',async({page})=>{
 const root=process.env.COMPOSITION_PROBE_ROOT!;expect(root).toBeTruthy();const path=join(root,'content/pages/probe.json');const evidence=createCmsEvidence(join(root,'evidence'));const sources=createCmsSources([path],join(root,'backups'),{allowCreate:true});const schema=JSON.parse(readFileSync(join(root,'tina/__generated__/_schema.json'),'utf8'));for(const collection of schema.collections)collection.path=join(root,collection.path);
 try{
 await page.goto('/cms/index.html#/collections/page');const enter=page.getByRole('button',{name:'Enter Edit Mode',exact:true});await expect(enter).toBeVisible();await enter.click();await page.getByRole('button',{name:'Create New',exact:true}).click();await page.getByText('Standard',{exact:true}).click();
 await page.locator('[name=contentId]').fill('probe');await page.locator('[name=slug]').fill('probe');await page.getByRole('combobox',{name:'Status'}).selectOption('draft');await page.getByRole('textbox',{name:'My_Document'}).fill('probe');
 await shared(page,0,'first');await shared(page,1,'second');for(const language of ['en','el'])for(const [index,id] of ['first','second'].entries())await copy(page,language,index,id);
 const saves:any[]=[];
 async function save(operation:'create'|'update',ids:string[]){
  await expect(page.getByRole('button',{name:'Save',exact:true})).toBeEnabled();sources.assertUnchanged();const prior=existsSync(path)?readFileSync(path,'utf8'):null;
  const responsePromise=page.waitForResponse(r=>r.request().method()==='POST'&&(r.request().postData()||'').includes(operation+'Document'));
  await page.getByRole('button',{name:'Save',exact:true}).click();const response=await responsePromise;
  const mutation={...response.request().postDataJSON().variables,operation};
  await evidence.captureNative(sources,path,mutation,schema,d=>d.status==='draft'&&d.sections.map((x:any)=>x.id).join(',')===ids.join(','));
  const saved=JSON.parse(readFileSync(path,'utf8'));const hooks=JSON.parse(readFileSync(join(root,'evidence/hooks.json'),'utf8'));const hook=hooks.at(-1);
  expect((await response.json()).errors||[]).toEqual([]);expect(hook.crudType).toBe(operation);expect(hook.path).toBe('content/pages/probe.json');expect(hook.priorBytes).toBe(prior);expect(hook.priorExists).toBe(prior!==null);
  expect(hook.filename).toBe(operation==='create'?'probe':undefined);expect(mutation.params.page.standard).not.toHaveProperty('filename');expect(saved).not.toHaveProperty('filename');
  for(const entry of saved.sections)expect(entry._template).toBe('rich-text');
  for(const [language,copies] of [['en',saved.copy.sections],['el',saved.translations.el.sections]] as const){
   expect(copies.map((x:any)=>x.id).sort()).toEqual([...ids].sort());
   for(const entry of copies){expect(entry._template).toBe('rich-text');expect(entry.body).toBe('**'+prose(language,entry.id)+'**\n');}
   const nativeCopies=language==='en'?hook.values.copy.sections:hook.values.translations.el.sections;
   const wireCopies=language==='en'?mutation.params.page.standard.copy.sections:mutation.params.page.standard.translations.el.sections;
   for(const [index,entry] of nativeCopies.entries())expect(wireCopies[index].rich_text.body).toEqual(entry.body);
  }
  saves.push({operation,mutation,hook,saved});writeFileSync(join(root,'evidence/saves.json'),JSON.stringify(saves,null,2));
 }
 async function reload(){await page.goto('/cms/index.html?reload='+saves.length+'#/collections/edit/page/probe');await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Save',exact:true})).toBeDisabled();}
 await save('create',['first','second']);await reload();
 // Installed Tina binds pointer listeners to the leading handle (100ms activation delay).
 const from=await page.getByRole('button',{name:'first',exact:true}).locator(':scope > div').first().boundingBox();const to=await page.getByRole('button',{name:'second',exact:true}).boundingBox();expect(from).toBeTruthy();expect(to).toBeTruthy();
 await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await page.mouse.down();await page.waitForTimeout(150);await page.mouse.move(to!.x+15,to!.y+to!.height/2,{steps:10});await page.mouse.up();await expect(page.getByRole('button',{name:'Save',exact:true})).toBeEnabled();
 await save('update',['second','first']);await reload();
 await page.locator('[data-test="delete-item-sections.1"]').click();
 await page.getByRole('button',{name:'English copy',exact:true}).click();await page.locator('[data-test="delete-item-copy.sections.0"]').click();await top(page);
 await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Greek copy',exact:true}).click();await page.locator('[data-test="delete-item-translations.el.sections.0"]').click();await top(page);
 await save('update',['second']);await reload();await expect(page.getByRole('button',{name:'second',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'first',exact:true})).toHaveCount(0);
 for(const language of ['en','el']){
  if(language==='en')await page.getByRole('button',{name:'English copy',exact:true}).click();else{await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Greek copy',exact:true}).click();}
  await page.getByRole('button',{name:'second',exact:true}).click();await expect(page.locator('[contenteditable=true] strong')).toHaveText(prose(language,'second'));await top(page);
 }

 }finally{await sources.restore();expect(existsSync(path)).toBe(false);writeFileSync(join(root,'evidence/restoration.json'),JSON.stringify({originalState:sources.originalState(path),existsAfter:existsSync(path),backup:sources.backup},null,2));}
});
