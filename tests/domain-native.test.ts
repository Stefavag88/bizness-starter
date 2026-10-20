import {it,expect} from 'vitest';
import {createNativeDomainRegistry,getNativeDomainAdapters,assertDomainIdentity} from '../tina/domain-validation';
import {createDomainRegistry} from '../packages/content/domain-registry.mjs';
import {lessonDomain} from './fixtures/content/domain';
import {project,fixture,editorial} from './fixtures/content/factory';
import {readContent} from '../packages/content/read.mjs';
import {nativeProjection,beforeSubmit,validateCurrentSave} from '../tina/validation';
import {offeringSchema} from '../packages/content/schemas.mjs';
const definition={...lessonDomain(),schema:offeringSchema,ownedPages:[],richFields:[{path:['body'],inline:false},{path:['description'],inline:true}]};
const registry=createDomainRegistry([definition]);
const native=createNativeDomainRegistry([{key:'lessons',allowCreate:true,assertIdentity:assertDomainIdentity}]);
const opts={registry,nativeRegistry:native};
it('discovers all enabled native adapters and rejects duplicate/missing registrations',()=>{
 expect(getNativeDomainAdapters(project,opts).map(a=>[a.key,a.collectionName,a.directory])).toEqual([['lessons','lesson','lessons']]);
 expect(()=>createNativeDomainRegistry([{key:'lessons',allowCreate:true,assertIdentity:assertDomainIdentity},{key:'lessons',allowCreate:true,assertIdentity:assertDomainIdentity}])).toThrow(/Duplicate/);
 expect(()=>getNativeDomainAdapters(project,{registry,nativeRegistry:createNativeDomainRegistry([])})).toThrow(/lessons.*native|native.*lessons/i);
 expect(getNativeDomainAdapters(project,{registry:createDomainRegistry([{...definition,enabled:()=>false}]),nativeRegistry:createNativeDomainRegistry([])})).toEqual([]);
});
it('projects rich ASTs detached and returns original native values after validation',()=>{
 const body={type:'root',children:[{type:'p',children:[{text:'Useful **words**',id:'opaque'}]}]};const value={...editorial(),_collection:'lesson',status:'draft',translations:{},body};
 const projected=nativeProjection(value,project,'lesson',opts);expect(projected.body).toContain('Useful');expect(value.body).toBe(body);
 expect(beforeSubmit(value,'lesson',project,undefined,{operation:'create',relativePath:'one.json'},opts)).toBe(value);expect(value.body).toBe(body);
 const bad={...value,body:{type:'root',children:[{type:'script',children:[]}]}};expect(()=>beforeSubmit(bad,'lesson',project,undefined,{operation:'create',relativePath:'one.json'},opts)).toThrow();
});
it('protects native domain filename/contentId/slug and draft-only creation',()=>{
 const current={...editorial(),status:'draft',translations:{}};const create={operation:'create' as const,relativePath:'one.json'};
 expect(()=>assertDomainIdentity(current,undefined,create)).not.toThrow();expect(()=>assertDomainIdentity({...current,status:'published'},undefined,create)).toThrow(/draft/);
 expect(()=>assertDomainIdentity({...current,slug:'changed'},current,{operation:'update',relativePath:'one.json'})).toThrow(/identity/);
});
it('queries all active collections, skips disabled absent GraphQL collections, and returns original values',async()=>{
 const f=fixture(),source=readContent(f.root,project),queries:string[]=[];
 const values={...editorial('offering','lesson-one'),status:'draft',translations:{},_collection:'lesson'};
 const records:Record<string,any[]>={settings:[JSON.parse(requireRead(f.root+'/content/settings/site.json','utf8'))],page:[],offering:[editorial()],person:[editorial('person','person')],article:[editorial('article','article')],lesson:[]};
 const {readdirSync,readFileSync}=await import('node:fs');records.page=readdirSync(f.root+'/content/pages').map(name=>JSON.parse(readFileSync(f.root+'/content/pages/'+name,'utf8')));
 const cms={api:{tina:{request:async(query:string)=>{const collection=/\{(\w+)Connection/.exec(query)![1];queries.push(collection);if(!(collection in records))throw Error('Absent GraphQL type '+collection);return {[collection+'Connection']:{edges:records[collection].map((v,i)=>({node:{_values:v,_sys:{relativePath:i+'.json'}}})),pageInfo:{hasNextPage:false,endCursor:null}}};}}}};
 expect(await validateCurrentSave(values,'lesson',project,cms,{operation:'create',relativePath:'new.json'},opts)).toBe(values);expect(queries).toEqual(['settings','page','offering','person','article','lesson']);
 queries.length=0;const disabled={registry:createDomainRegistry([{...definition,enabled:()=>false}]),nativeRegistry:native};
 await validateCurrentSave(records.offering[0],'offering',project,cms,{operation:'update',relativePath:'0.json'},disabled);expect(queries).not.toContain('lesson');
});
import {readFileSync as requireRead} from 'node:fs';

it('omits dormant malformed native Page values before projection while retaining navigation references',async()=>{
 const f=fixture(),{readdirSync,readFileSync}=await import('node:fs');
 const data:Record<string,any[]>={settings:[{path:'site.json',value:JSON.parse(readFileSync(f.root+'/content/settings/site.json','utf8'))}],page:readdirSync(f.root+'/content/pages').map(path=>({path,value:JSON.parse(readFileSync(f.root+'/content/pages/'+path,'utf8'))})),offering:[{path:'sample.json',value:editorial()}],person:[{path:'person.json',value:editorial('person','person')}],article:[{path:'article.json',value:editorial('article','article')}]};
 data.settings[0].value.navigation.push({pageId:'lesson_index',label:'Lessons'});data.settings[0].value.translations.el.navigation.push({pageId:'lesson_index',label:'Μαθήματα'});
 let parsed=false;data.page.push({path:'lessons.json',get value(){parsed=true;throw Error('Dormant values must stay unread');}});
 const cms={api:{tina:{request:async(query:string)=>{const kind=/\{(\w+)Connection/.exec(query)![1];return {[kind+'Connection']:{edges:data[kind].map(record=>({node:{get _values(){return record.value;},_sys:{relativePath:record.path}}})),pageInfo:{hasNextPage:false,endCursor:null}}};}}}};
 const disabled={registry:createDomainRegistry([{...lessonDomain(false),ownedPages:[{filename:'lessons.json',template:'lessons',contentId:'lesson_index'}],schema:offeringSchema}]),nativeRegistry:native};
 const value=data.offering[0].value;expect(await validateCurrentSave(value,'offering',project,cms,{operation:'update',relativePath:'sample.json'},disabled)).toBe(value);expect(parsed).toBe(false);
});
it('protects persisted domain identity and rejects missing update targets before saving',async()=>{
 const f=fixture(),{readdirSync,readFileSync}=await import('node:fs');const current={...editorial('offering','lesson-one'),status:'draft',translations:{}};
 const data:Record<string,any[]>={settings:[JSON.parse(readFileSync(f.root+'/content/settings/site.json','utf8'))],page:readdirSync(f.root+'/content/pages').map(path=>JSON.parse(readFileSync(f.root+'/content/pages/'+path,'utf8'))),offering:[editorial()],person:[editorial('person','person')],article:[editorial('article','article')],lesson:[current]};
 const cms={api:{tina:{request:async(query:string)=>{const kind=/\{(\w+)Connection/.exec(query)![1];return {[kind+'Connection']:{edges:data[kind].map(record=>({node:{_values:record,_sys:{relativePath:'saved.json'}}})),pageInfo:{hasNextPage:false,endCursor:null}}};}}}};
 await expect(validateCurrentSave({...current,slug:'changed'},'lesson',project,cms,{operation:'update',relativePath:'saved.json'},opts)).rejects.toThrow(/identity/);
 await expect(validateCurrentSave(current,'lesson',project,cms,{operation:'update',relativePath:'renamed.json'},opts)).rejects.toThrow(/not found/);
 expect(await validateCurrentSave(current,'lesson',project,cms,{operation:'update',relativePath:'saved.json'},opts)).toBe(current);
});

it('hides disabled Page destinations without reading their native values',async()=>{
 const {visibleNativePages}=await import('../tina/fields/navigation');let read=false;
 const edges=[{node:{_sys:{relativePath:'lessons.json'},get _values(){read=true;throw Error('Dormant');}}},{node:{_sys:{relativePath:'about.json'},_values:{contentId:'about',slug:'about'}}}];
 expect(visibleNativePages(edges,['lessons.json'])).toEqual([{contentId:'about',slug:'about'}]);expect(read).toBe(false);
});

import {room as roomFixture} from './fixtures/content/room';
import {roomCollection} from '../tina/domains/rooms/collection';
import {assertOwnedPageIdentity} from '../packages/content/domain-publication.mjs';
it('Rooms index is edit-only at its declared filename/template/contentId; Room identity is flat and draft-only',()=>{
 const enabled={...project,modules:{...project.modules,rooms:true}};
 expect(roomCollection(enabled).ui?.allowedActions).toEqual({create:true,delete:false,createFolder:false,createNestedFolder:false});
 const saved={...roomFixture(),status:'draft',translations:{}};
 for(const relativePath of ['nested/room.json','../room.json','C:room.json'])expect(()=>assertDomainIdentity(saved,undefined,{operation:'create',relativePath})).toThrow(/flat/);
 for(const changed of [{...saved,contentId:'other'},{...saved,slug:'other'}])expect(()=>assertDomainIdentity(changed,saved,{operation:'update',relativePath:'room.json'})).toThrow(/identity/);
 expect(()=>assertDomainIdentity({...saved,translations:{el:{status:'published'}}},undefined,{operation:'create',relativePath:'room.json'})).toThrow(/draft/);
 expect(()=>assertOwnedPageIdentity({_template:'rooms',contentId:'rooms'},'other.json')).toThrow();
 expect(()=>assertOwnedPageIdentity({_template:'standard',contentId:'rooms'},'rooms.json')).toThrow();
 expect(()=>assertOwnedPageIdentity({_template:'rooms',contentId:'other'},'rooms.json')).toThrow();
 expect(()=>assertOwnedPageIdentity({_template:'rooms',contentId:'rooms'},'rooms.json')).not.toThrow();
 const index=pageDocument('rooms','rooms','rooms');expect(()=>beforeSubmit(index,'page',enabled,undefined,{operation:'create',relativePath:'rooms.json'})).toThrow();
});
it('disabled Rooms save catalog never requests roomConnection and preserves malformed dormant bytes',async()=>{
 const {readFileSync,writeFileSync,mkdirSync,readdirSync}=await import('node:fs');const {join}=await import('node:path');
 const f=fixture();mkdirSync(join(f.root,'content/rooms'));const paths=['content/rooms/broken.json','content/pages/rooms.json'].map(p=>join(f.root,p));const bytes=Buffer.from('{ malformed dormant room bytes');paths.forEach(p=>writeFileSync(p,bytes));
 const data:Record<string,any[]>={settings:[JSON.parse(readFileSync(join(f.root,'content/settings/site.json'),'utf8'))],page:readdirSync(join(f.root,'content/pages')).filter(p=>p!=='rooms.json').map(p=>JSON.parse(readFileSync(join(f.root,'content/pages',p),'utf8'))),offering:[editorial()],person:[editorial('person','person')],article:[editorial('article','article')]};
 const queries:string[]=[];const cms={api:{tina:{request:async(query:string)=>{queries.push(query);const kind=/\{(\w+)Connection/.exec(query)![1];if(kind==='room')throw Error('Absent roomConnection must never be queried');return {[kind+'Connection']:{edges:data[kind].map((v:any)=>({node:{_values:v,_sys:{relativePath:'sample.json'}}})),pageInfo:{hasNextPage:false,endCursor:null}}};}}}};
 expect(await validateCurrentSave(data.offering[0],'offering',project,cms,{operation:'update',relativePath:'sample.json'})).toBe(data.offering[0]);expect(queries.some(q=>q.includes('roomConnection'))).toBe(false);paths.forEach(p=>expect(readFileSync(p)).toEqual(bytes));
});
import {pageDocument} from './fixtures/content/factory';
