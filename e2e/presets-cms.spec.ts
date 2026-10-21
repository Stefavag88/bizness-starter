import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,appendFileSync,realpathSync,mkdtempSync} from 'node:fs';import {join,resolve,dirname} from 'node:path';import {spawn,execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {createCmsSources} from './helpers/cms-source-ownership';import {expectedNativeDocument,type Schema,type Mutation} from './helpers/native-document';import {coerceContactSettingsVariables} from './helpers/contact-social-native-admission';
import {resolvePorts,assertPortsFree} from '../scripts/ports.mjs';
test.skip(!process.env.PRESET_CLIENT_ROOT,'Owned generated-project rehearsal only');
test('generated bilingual trades project saves Page and Offering with native editors',async({browser})=>{
 test.setTimeout(600000);const root=realpathSync(process.env.PRESET_CLIENT_ROOT!);expect(JSON.parse(readFileSync(join(root,'starter-provenance.json'),'utf8')).preset).toBe('trades');
 const backupRoot=join(root,'.generated/preset-cms');mkdirSync(backupRoot,{recursive:true});const directory=mkdtempSync(join(backupRoot,'run-'));console.log('Native preset evidence: '+directory);
 const env={...process.env,SITE_PORT:'4430',WORKER_PORT:'8890',TINA_PORT:'4110',TINA_DATALAYER_PORT:'9110'};await assertPortsFree(resolvePorts(env));
 const paths=[join(root,'content/pages/home.json'),join(root,'content/offerings/sample-service.json')];const sources=createCmsSources(paths,join(directory,'sources'));
 const child=spawn(process.execPath,[join(root,'scripts/dev.mjs'),'--cms'],{cwd:root,env,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
 for(const stream of [child.stdout,child.stderr])stream.on('data',text=>appendFileSync(join(directory,'launcher.log'),text));
 const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(20000);let schema:Schema,sdl:string,pending:any;let failure:unknown;const saves:any[]=[];
 const require=createRequire(join(root,'package.json'));const serializerPath=realpathSync(resolve(dirname(require.resolve('@tinacms/cli')),'../../graphql/dist/index.js'));const serializer=await import(pathToFileURL(serializerPath).href);
 const graphql=createRequire(serializerPath)('graphql');
 await page.route('**/graphql',async route=>{
 const body=route.request().postDataJSON();if(route.request().method()==='POST'&&/\bmutation\b/.test(body?.query||'')){
  try{
   sources.assertUnchanged();const ast=graphql.parse(body.query);const op=ast.definitions[0],field=op.selectionSet.selections[0];
   if(ast.definitions.length!==1||op.operation!=='mutation'||op.selectionSet.selections.length!==1||field.name.value!=='updateDocument'||field.alias||field.directives.length||op.directives.length)throw Error('Unexpected editor mutation');
   const args=field.arguments;if(args.length!==3||!['collection','relativePath','params'].every(name=>args.some((a:any)=>a.name.value===name&&a.value.kind==='Variable'&&a.value.name.value===name)))throw Error('Unexpected mutation arguments');
   const v=body.variables;if(!((v.collection==='page'&&v.relativePath==='home.json')||(v.collection==='offering'&&v.relativePath==='sample-service.json'))||Object.keys(v.params).length!==1||!v.params[v.collection])throw Error('Unowned mutation destination');
   const mutation:Mutation=coerceContactSettingsVariables(body,sdl) as Mutation;const path=join(root,'content',v.collection==='page'?'pages':'offerings',v.relativePath);const prior=JSON.parse(readFileSync(path,'utf8'));const complete=await expectedNativeDocument(mutation,schema,prior);const keepTemplate=Boolean(schema.collections.find(c=>c.name===mutation.collection)?.templates?.length);const bytes=serializer.stringifyFile(complete,'.json',keepTemplate);
   pending={mutation,path,complete,bytes};writeFileSync(join(directory,'pre-dispatch-'+saves.length+'.json'),JSON.stringify({wire:body,complete,expectedHash:createHash('sha256').update(bytes).digest('hex'),serializerPath},null,2));
  }catch(error){writeFileSync(join(directory,'refused.json'),JSON.stringify({error:String(error),body},null,2));await route.abort('blockedbyclient');return;}
 }
 await route.continue();
 });
 async function open(collection:string,file:string){await page.goto('http://127.0.0.1:4430/cms/index.html?rehearsal='+Date.now()+'#/collections/edit/'+collection+'/'+file);const enter=page.getByRole('button',{name:'Enter Edit Mode',exact:true});await expect(enter.or(page.getByRole('button',{name:'Save',exact:true})).first()).toBeVisible({timeout:120000});if(await enter.isVisible())await enter.click();await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible({timeout:90000});}
 async function save(){pending=undefined;const response=page.waitForResponse(r=>(r.request().postData()||'').includes('updateDocument'));await page.getByRole('button',{name:'Save',exact:true}).click();expect((await(await response).json()).errors||[]).toEqual([]);expect(pending).toBeTruthy();await sources.captureNative(pending.path,pending.mutation,schema,()=>true,pending.bytes);saves.push({path:pending.path,sha256:createHash('sha256').update(pending.bytes).digest('hex')});writeFileSync(join(directory,'saves.json'),JSON.stringify(saves,null,2));}
 try{
 await expect.poll(async()=>{try{return (await fetch('http://127.0.0.1:4430/cms/index.html')).status;}catch{return 0;}},{timeout:180000,intervals:[500,1000]}).toBe(200);
 await expect.poll(async()=>{try{const response=await fetch('http://localhost:4110/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query { page(relativePath: "home.json") { __typename } offering(relativePath: "sample-service.json") { __typename } }'})});const data=await response.json() as any;return Boolean(data.data?.page?.__typename&&data.data?.offering?.__typename&&!data.errors);}catch{return false;}},{timeout:120000,intervals:[500,1000]}).toBe(true);
 const raw=JSON.parse(readFileSync(join(root,'tina/__generated__/_schema.json'),'utf8'));schema={...raw,collections:raw.collections.map((c:any)=>({...c,path:resolve(root,c.path)}))};sdl=readFileSync(join(root,'tina/__generated__/schema.gql'),'utf8');
 await open('page','home');await page.getByRole('button',{name:'Section content',exact:true}).click();
 await page.locator('[name="copy.sections.0.title"]').fill('Native project rehearsal hero');await save();
 await open('page','home');await page.getByRole('button',{name:'Section content',exact:true}).click();await expect(page.locator('[name="copy.sections.0.title"]')).toHaveValue('Native project rehearsal hero');
 const publicPage=await context.newPage();await publicPage.goto('http://127.0.0.1:4430/el');await expect(publicPage.locator('main h1')).toContainText('Native project rehearsal hero');
 await open('offering','sample-service');const editor=page.locator('[contenteditable=true]').last();await editor.click();await editor.focus();await page.keyboard.press('Control+a');await page.keyboard.press('Backspace');await page.keyboard.type('Native visual editor project rehearsal');await save();
 await open('offering','sample-service');await expect(page.locator('[contenteditable=true]').last()).toContainText('Native visual editor project rehearsal');
 const document=JSON.parse(readFileSync(paths[1],'utf8'));await publicPage.goto('http://127.0.0.1:4430/el/services/'+document.slug);await expect(publicPage.locator('main')).toContainText('Native visual editor project rehearsal');
 await publicPage.goto('http://127.0.0.1:4430/en');await expect(publicPage.locator('main h1')).toHaveCount(1);expect(saves).toHaveLength(2);
 }catch(error){failure=error;writeFileSync(join(directory,'failure.json'),JSON.stringify({error:String(error),stack:error instanceof Error?error.stack:undefined},null,2));}finally{
 await page.screenshot({path:join(directory,'last-editor.png'),fullPage:true}).catch(()=>{});await context.close();
 if(child.pid){if(process.platform==='win32')try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true});}catch{}else try{process.kill(-child.pid,'SIGTERM');}catch{}}
 try{await sources.restore();}catch(error){failure=failure?new AggregateError([failure,error],'Native test failed and restoration refused'):error;}
 }
 if(failure)throw failure;
});
