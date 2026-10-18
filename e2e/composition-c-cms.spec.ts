import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createCmsSources} from './helpers/cms-source-ownership';
import {createOwnedMedia} from './helpers/owned-media';
import {expectedNativeDocument,type Mutation,type Schema} from './helpers/native-document';
const cms=process.env.E2E_CMS_URL;
test.skip(!cms,'Requires the owned indexed Rooms-enabled native CMS stack.');
test.describe.configure({mode:'serial',timeout:300000});
async function open(page:Page,path:string){await page.goto(cms+'/cms/index.html?compositionC='+Date.now()+'#/'+path);await expect(page.getByRole('button',{name:/^(Enter Edit Mode|Save|Create New)$/}).or(page.getByRole('link',{name:'Add File',exact:true})).first()).toBeVisible({timeout:45000});const enter=page.getByRole('button',{name:'Enter Edit Mode',exact:true});if(await enter.isVisible())await enter.click();}
async function root(page:Page){await page.getByRole('navigation',{name:'breadcrumb'}).getByRole('button').nth(1).click();}
async function rich(page:Page,editor:Locator,text:string){await editor.click();await editor.focus();await expect(editor).toBeFocused();await page.waitForTimeout(400);await page.keyboard.press('Control+a');await page.waitForTimeout(400);await page.keyboard.press('Backspace');await page.waitForTimeout(400);await editor.click();await editor.focus();await page.keyboard.type(text,{delay:10});await expect(editor).toContainText(text);await page.keyboard.press('Home');await page.keyboard.press('Shift+End');await page.waitForTimeout(250);await page.keyboard.press('Control+b');await expect(editor.locator('strong')).toHaveText(text);}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9S8AAAAASUVORK5CYII=','base64');
test('native Room draft, bilingual nested correction, reorder, publish, cancel and reference removal',async({page})=>{
 page.setDefaultTimeout(15000);mkdirSync('.generated/composition-c-cms',{recursive:true});const directory=mkdtempSync('.generated/composition-c-cms/run-');
 const name='room-proof-'+Date.now(),path='content/rooms/'+name+'.json';const sources=createCmsSources([path],join(directory,'records'),{allowCreate:true});
 const names=[name+'-a.png',name+'-b.png'],media=names.map(n=>createOwnedMedia('apps/site/public/uploads/'+n,join(directory,'media')));
 const schema=JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8')) as Schema;
 writeFileSync(join(directory,'schema-before.json'),JSON.stringify(schema,null,2));
 const requests:Mutation[]=[],expectations:any[]=[];let prior:any={},pending:any;
 await page.route('**/graphql',async route=>{const r=route.request(),data=r.postDataJSON();if(r.method()==='POST'&&/(?:create|update)Document/.test(data?.query||'')){const operation=data.query.includes('createDocument')?'create':'update';const mutation={...data.variables,operation} as Mutation;const expected=await expectedNativeDocument(mutation,schema,prior);pending={mutation,expected};writeFileSync(join(directory,'preflight-'+requests.length+'.json'),JSON.stringify(pending,null,2));requests.push(mutation);}await route.continue();});
 async function save(operation:'create'|'update',predicate:(d:any)=>boolean){console.log('Native Room save',operation);sources.assertUnchanged();pending=undefined;const responsePromise=page.waitForResponse(r=>r.request().method()==='POST'&&(r.request().postData()||'').includes(operation+'Document'));await page.getByRole('button',{name:'Save',exact:true}).click();const response=await responsePromise;expect((await response.json()).errors||[]).toEqual([]);expect(pending).toBeTruthy();await sources.captureNative(path,pending.mutation,schema,predicate);prior=pending.expected;expectations.push(pending);writeFileSync(join(directory,'saves.json'),JSON.stringify(expectations,null,2));}
 async function reload(){await open(page,'collections/edit/room/'+name);await expect(page.locator('[name=title]')).toHaveValue('Native Room proof');sources.assertUnchanged();}
 async function reject(label:string){const count=requests.length,bytes=readFileSync(path);await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('button',{name:'Close',exact:true})).toBeVisible();expect(requests).toHaveLength(count);expect(readFileSync(path)).toEqual(bytes);sources.assertUnchanged();writeFileSync(join(directory,label+'.json'),JSON.stringify({mutationsBefore:count,mutationsAfter:requests.length,bytesUnchanged:true,text:await page.locator('body').innerText()},null,2));await page.screenshot({path:join(directory,label+'.png'),fullPage:true});await page.getByRole('button',{name:'Close',exact:true}).click();}
 async function picker(name:string){await page.getByRole('button',{name:/Drag 'n' drop/}).last().click();await page.getByText(name,{exact:true}).click();await page.getByRole('button',{name:'Insert',exact:true}).click();}
 async function translation(){await page.getByRole('button',{name:'Translations',exact:true}).click();}
 let restored=false;
 try{
  media.forEach(m=>m.create(png));await open(page,'collections/room');await page.getByRole('link',{name:'Add File',exact:true}).click();
  await page.locator('[name=contentId]').fill(name);await page.locator('[name=slug]').fill(name);await page.getByRole('textbox',{name:'My_Document'}).fill(name);await page.locator('[name=title]').fill('Native Room proof');
  await save('create',d=>d.status==='draft'&&d.images.length===0);await reload();
  await expect(page.locator('[name=contentId]')).toHaveAttribute('readonly','');await expect(page.locator('[name=slug]')).toHaveAttribute('readonly','');
  await rich(page,page.locator('[contenteditable=true]').first(),'English rich description');await rich(page,page.locator('[contenteditable=true]').nth(1),'English retained body');
  for(const n of names)await picker(n);let imageIds=await page.locator('[data-room-item-id^=image_]').evaluateAll(es=>es.map(e=>e.getAttribute('data-room-item-id')!));
  await page.getByRole('button',{name:'Add amenity',exact:true}).click();await page.getByRole('button',{name:'Add amenity',exact:true}).click();const amenityIds=await page.locator('[data-room-item-id^=amenity_]').evaluateAll(es=>es.map(e=>e.getAttribute('data-room-item-id')!));
  await page.getByRole('button',{name:'Initialize Ελληνικά Room translation',exact:true}).click();await page.locator('[name="translations.el.title"]').fill('Ελληνικό δωμάτιο');await rich(page,page.getByRole('group',{name:'Ελληνικά',exact:true}).locator('[contenteditable=true]').first(),'Greek rich description');await rich(page,page.getByRole('group',{name:'Ελληνικά',exact:true}).locator('[contenteditable=true]').nth(1),'Greek retained body');
  await page.getByRole('button',{name:'Add amenity',exact:true}).click();const laterId=(await page.locator('[data-room-item-id^=amenity_]').last().getAttribute('data-room-item-id'))!;amenityIds.push(laterId);await page.getByRole('button',{name:'Initialize copy '+laterId,exact:true}).click();
  await reject('incomplete-translated-items');
  for(const locale of ['en','el']){
   
   const prefix=locale==='el'?'translations.el.':'';
   for(let i=0;i<2;i++){await page.locator('[name="'+prefix+'imageCopy.'+i+'.alt"]').fill(locale+' image '+i);await rich(page,page.locator('[name="'+prefix+'imageCopy.'+i+'.alt"]').locator('xpath=ancestor::fieldset[1]').locator('[contenteditable=true]'),locale+' caption '+i);}
   for(let i=0;i<amenityIds.length;i++)await page.locator('[name="'+prefix+'amenityCopy.'+i+'.label"]').fill(locale+' amenity '+i);
  }
  await page.getByRole('button',{name:'Move '+imageIds[1]+' up',exact:true}).click();await page.getByRole('button',{name:'Move '+amenityIds[1]+' up',exact:true}).click();
  await save('update',d=>d.images[0].id===imageIds[1]&&d.amenities[0].id===amenityIds[1]&&d.body.includes('**English retained body**')&&d.translations.el.body.includes('**Greek retained body**'));await reload();
  const bytes=readFileSync(path),count=requests.length;await page.getByRole('button',{name:'Remove '+imageIds[0],exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('[data-room-item-id^=image_]')).toHaveCount(2);expect(readFileSync(path)).toEqual(bytes);expect(requests).toHaveLength(count);writeFileSync(join(directory,'cancel.json'),JSON.stringify({actualCancel:true,mutations:0,bytesUnchanged:true}));
  await page.getByRole('combobox',{name:'status',exact:true}).selectOption('published');await page.getByRole('combobox',{name:'translations.el.status',exact:true}).selectOption('published');await save('update',d=>d.status==='published'&&d.translations.el.status==='published');await reload();
  await page.getByRole('button',{name:'Remove '+imageIds[0],exact:true}).click();await page.getByRole('button',{name:'Confirm removal',exact:true}).click();await page.getByRole('button',{name:'Remove '+amenityIds[0],exact:true}).click();await page.getByRole('button',{name:'Confirm removal',exact:true}).click();await save('update',d=>d.amenities.length===2&&[d,...Object.values(d.translations) as any[]].every(t=>t.amenityCopy.length===2&&!t.amenityCopy.some((c:any)=>c.id===amenityIds[0]))&&d.images.length===1&&[d,...Object.values(d.translations) as any[]].every(t=>t.imageCopy.length===1&&t.imageCopy[0].id===imageIds[1]));await reload();media.forEach(m=>expect(m.owns()).toBe(true));
  await page.screenshot({path:join(directory,'saved-room.png'),fullPage:true});await open(page,'collections/room');await expect(page.getByRole('button',{name:'Delete',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:/Create folder|Create nested folder/})).toHaveCount(0);expect(JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8'))).toEqual(schema);expect(requests).toHaveLength(4);writeFileSync(join(directory,'acceptance.json'),JSON.stringify({name,imageIds,amenityIds,mutations:requests.length,rejectedAttempts:1,physicalMediaPreserved:true},null,2));
 }finally{
  try{await sources.restore();restored=true;}finally{if(restored)media.forEach(m=>m.restore());writeFileSync(join(directory,'restoration.json'),JSON.stringify({recordsRestored:restored,recordAbsent:!existsSync(path),mediaAbsent:names.every(n=>!existsSync('apps/site/public/uploads/'+n)),backup:sources.backup},null,2));}
 }
});





test('module index optional room-list translation rejects blank copy then recovers and publishes',async({page})=>{
 page.setDefaultTimeout(15000);mkdirSync('.generated/composition-c-cms',{recursive:true});const directory=mkdtempSync('.generated/composition-c-cms/index-'),path='content/pages/rooms.json';
 const sources=createCmsSources([path],join(directory,'records')),schema=JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8')) as Schema;
 let prior=JSON.parse(sources.originalBytes(path)),pending:any;const requests:Mutation[]=[];
 writeFileSync(join(directory,'schema-before.json'),JSON.stringify(schema,null,2));
 await page.route('**/graphql',async route=>{const r=route.request(),data=r.postDataJSON();if(r.method()==='POST'&&/(?:create|update)Document/.test(data?.query||'')){const mutation={...data.variables,operation:'update'} as Mutation;pending={mutation,expected:await expectedNativeDocument(mutation,schema,prior)};writeFileSync(join(directory,'preflight-'+requests.length+'.json'),JSON.stringify(pending,null,2));requests.push(mutation);}await route.continue();});
 try{
  await open(page,'collections/edit/page/rooms');
  await page.getByRole('combobox',{name:'Add section after room_list',exact:true}).selectOption('room-list');const id=await page.locator('[data-section-id]').last().getAttribute('data-section-id');
  await page.locator('[data-section-id="'+id+'"]').getByRole('checkbox').check();
  await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();await page.getByRole('button',{name:'translations.el.copy',exact:true}).click();
  await page.getByRole('button',{name:'Add translation copy for '+id,exact:true}).click();
  const copy=page.locator('[data-copy-id="'+id+'"]');await copy.locator('input[name$=".title"]').fill('Πρόσθετα δωμάτια');await root(page);
  const bytes=readFileSync(path);await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('button',{name:'Close',exact:true})).toBeVisible();expect(requests).toHaveLength(0);expect(readFileSync(path)).toEqual(bytes);await page.screenshot({path:join(directory,'blank-translation-rejection.png'),fullPage:true});await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();await page.getByRole('button',{name:'translations.el.copy',exact:true}).click();await copy.locator('[name$=".emptyMessage"]').fill('Δεν υπάρχουν επιπλέον δωμάτια.');await root(page);
  await page.getByRole('combobox',{name:'status',exact:true}).selectOption('published');await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();await page.getByRole('combobox',{name:'translations.el.status',exact:true}).selectOption('published');await root(page);
  sources.assertUnchanged();const responsePromise=page.waitForResponse(r=>(r.request().postData()||'').includes('updateDocument'));await page.getByRole('button',{name:'Save',exact:true}).click();expect((await (await responsePromise).json()).errors||[]).toEqual([]);await sources.captureNative(path,pending.mutation,schema,d=>d.status==='published'&&d.translations.el.status==='published'&&d.translations.el.copy.sections.find((s:any)=>s.id===id).emptyMessage==='Δεν υπάρχουν επιπλέον δωμάτια.');prior=pending.expected;
  await open(page,'collections/edit/page/rooms');sources.assertUnchanged();await page.screenshot({path:join(directory,'saved-index.png'),fullPage:true});writeFileSync(join(directory,'acceptance.json'),JSON.stringify({mutations:requests.length,rejectedAttempts:1,blankRejectionMutations:0,id,expected:prior},null,2));
 }finally{await sources.restore();writeFileSync(join(directory,'restoration.json'),JSON.stringify({byteExact:readFileSync(path,'utf8')===sources.originalBytes(path),backup:sources.backup}));}
});


test('missing Page locale explicitly initializes room-list copy and corrects blank draft before native creation',async({page})=>{
 page.setDefaultTimeout(15000);mkdirSync('.generated/composition-c-cms',{recursive:true});const directory=mkdtempSync('.generated/composition-c-cms/locale-'),name='room-list-proof-'+Date.now(),path='content/pages/'+name+'.json';
 const sources=createCmsSources([path],join(directory,'records'),{allowCreate:true}),schema=JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8')) as Schema;let pending:any;const requests:Mutation[]=[];
 writeFileSync(join(directory,'schema-before.json'),JSON.stringify(schema,null,2));
 await page.route('**/graphql',async route=>{const r=route.request(),data=r.postDataJSON();if(r.method()==='POST'&&(data?.query||'').includes('createDocument')){const mutation={...data.variables,operation:'create'} as Mutation;pending={mutation,expected:await expectedNativeDocument(mutation,schema)};writeFileSync(join(directory,'preflight.json'),JSON.stringify(pending,null,2));requests.push(mutation);}await route.continue();});
 try{
  await open(page,'collections/page');await page.getByRole('button',{name:'Create New',exact:true}).click();await page.getByRole('menuitem',{name:'standard',exact:true}).click();await page.locator('[name=contentId]').fill(name.replaceAll('-','_'));await page.locator('[name=slug]').fill(name);await page.getByRole('textbox',{name:'My_Document'}).fill(name);await page.getByRole('button',{name:'meta',exact:true}).click();await page.locator('[name="meta.title"]').fill('Missing locale proof');await root(page);
  await page.getByRole('combobox',{name:'Add section after intro',exact:true}).selectOption('room-list');const id=await page.locator('[data-section-id]').last().getAttribute('data-section-id');await page.locator('[data-section-id="'+id+'"]').getByRole('checkbox').check();await page.getByRole('button',{name:'Initialize Ελληνικά copy',exact:true}).click();
  await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();await page.getByRole('button',{name:'translations.el.meta',exact:true}).click();await page.locator('[name="translations.el.meta.title"]').fill('Αρχικοποίηση γλώσσας');await root(page);
  await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();await page.getByRole('button',{name:'translations.el.copy',exact:true}).click();await page.locator('[data-copy-id=intro] input[name$=".title"]').fill('Δοκιμή');await page.getByRole('button',{name:'Add translation copy for '+id,exact:true}).click();const copy=page.locator('[data-copy-id="'+id+'"]');await copy.locator('input[name$=".title"]').fill('Δωμάτια');await root(page);
  await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('button',{name:'Close',exact:true})).toBeVisible();expect(requests).toHaveLength(0);expect(existsSync(path)).toBe(false);await page.screenshot({path:join(directory,'blank-initialization.png'),fullPage:true});await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Translations',exact:true}).click();await page.getByRole('button',{name:'Ελληνικά',exact:true}).click();await page.getByRole('button',{name:'translations.el.copy',exact:true}).click();await copy.locator('[name$=".emptyMessage"]').fill('Δεν υπάρχουν δωμάτια.');await root(page);
  sources.assertUnchanged();const responsePromise=page.waitForResponse(r=>(r.request().postData()||'').includes('createDocument'));await page.getByRole('button',{name:'Save',exact:true}).click();expect((await (await responsePromise).json()).errors||[]).toEqual([]);await sources.captureNative(path,pending.mutation,schema,d=>d.status==='draft'&&d.translations.el.status==='draft'&&d.translations.el.copy.sections.find((s:any)=>s.id===id).emptyMessage==='Δεν υπάρχουν δωμάτια.');await open(page,'collections/edit/page/'+name);sources.assertUnchanged();writeFileSync(join(directory,'acceptance.json'),JSON.stringify({mutations:requests.length,rejectedAttempts:1,missingLocaleInitialized:true,blankRejectionMutations:0},null,2));
 }finally{await sources.restore();writeFileSync(join(directory,'restoration.json'),JSON.stringify({absent:!existsSync(path),backup:sources.backup}));}
});
