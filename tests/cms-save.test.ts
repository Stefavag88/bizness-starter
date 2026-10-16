import { it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseProject } from '../packages/config/project.mjs';
import { readContent } from '../packages/content/read.mjs';
const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));
const offering=()=>JSON.parse(readFileSync('content/offerings/sample-service.json','utf8'));
const ast=(text='Hello')=>({type:'root',children:[{type:'p',children:[{text}]}]});
it('validates detached native ASTs and returns the original values',async()=>{
 const {beforeSubmit}=await import('../tina/validation');const values=offering();values.body=ast();values.description=ast();values.seoDescription=null;
 expect(beforeSubmit(values,'offering',project)).toBe(values);expect(typeof values.body).toBe('object');expect(values.seoDescription).toBeNull();
});
it('rejects malformed IDs, oversized Markdown, unsafe links, unknown nodes and inline headings',async()=>{
 const {validateNativeSave}=await import('../tina/validation');
 for(const patch of [{contentId:'Bad ID'},{title:'x'.repeat(201)},{body:ast('*'.repeat(60000))},{body:{type:'root',children:[{type:'a',url:'javascript:alert(1)',children:[{text:'x'}]}]}},{body:{type:'root',children:[{type:'html',children:[{text:'<x>'}]}]}},{description:{type:'root',children:[{type:'h2',children:[{text:'x'}]}]}}])expect(()=>validateNativeSave({...offering(),...patch},'offering',project)).toThrow();
});
it('protects page identity, structure, required sections and unknown templates',async()=>{
 const {validateNativeSave}=await import('../tina/validation');const page=JSON.parse(readFileSync('content/pages/home.json','utf8'));
 for(const change of [(p:any)=>p.slug='changed',(p:any)=>p.sections.reverse(),(p:any)=>p.sections[0].enabled=false,(p:any)=>p._template='alien']){const p=structuredClone(page);change(p);expect(()=>validateNativeSave(p,'page',project,page)).toThrow();}
});
it('normalizes regional serialized locale keys at save and loader boundaries without mutation',async()=>{
 const {validateNativeSave}=await import('../tina/validation');const p={...project,languages:[...project.languages,{code:'pt-BR',label:'Portuguese'}]};const value=offering();value.translations.pt_BR=structuredClone(value.translations.el);
 expect(()=>validateNativeSave(value,'offering',p)).not.toThrow();expect(value.translations.pt_BR).toBeDefined();
 value.translations['pt-BR']=value.translations.pt_BR;expect(()=>validateNativeSave(value,'offering',p)).toThrow(/alias|duplicate/i);
});
it('accepts native parser ASTs for every offered rich-text control without mutation',async()=>{
 const {parseMDX}=await import('@tinacms/mdx');const {beforeSubmit}=await import('../tina/validation');
 const values=offering();
 values.description=parseMDX('A **bold** and *italic* [link](/en/contact "Contact").',{name:'description',type:'rich-text',templates:[]},u=>u);
 values.body=parseMDX('## Heading\n\n### Subheading\n\n- First\n- Second\n\n1. Ordered\n2. Ordered again\n\n> A quotation.\n\nA line.  \nAnother line.',{name:'body',type:'rich-text',templates:[]},u=>u);
 const original=structuredClone(values);expect(beforeSubmit(values,'offering',project)).toBe(values);expect(values).toEqual(original);
});

it('requires current page context and protects identity independently of descriptor contents',async()=>{
 const {validateNativeSave,beforeSubmit}=await import('../tina/validation');const current=JSON.parse(readFileSync('content/pages/home.json','utf8'));
 expect(()=>validateNativeSave(current,'page',project)).toThrow(/Current native page record/);
 expect(beforeSubmit(current,'page',project,current)).toBe(current);
 for(const change of [(p:any)=>p.contentId='changed',(p:any)=>p.sections[1].id='changed',(p:any)=>{p.sections[1]._template='cta';p.copy.sections[1]={id:p.sections[1].id,_template:'cta',title:'Contact',description:'',link:{label:'Contact',href:'/contact'}};p.translations={};}]){const p=structuredClone(current);change(p);expect(()=>validateNativeSave(p,'page',project,current)).toThrow();}
 const newIdentity=structuredClone(current);newIdentity.contentId='current_catalog_only';newIdentity.slug='current-catalog-only';
 expect(()=>validateNativeSave(newIdentity,'page',project,newIdentity)).not.toThrow();
});
it('normalizes typed native aliases and regional locales on detached rich AST projections',async()=>{
 const {beforeSubmit,nativeProjection}=await import('../tina/validation');const current=JSON.parse(readFileSync('content/pages/about.json','utf8'));const p={...project,languages:[...project.languages,{code:'pt-BR',label:'Portuguese'}]};
 const values=structuredClone(current);values.translations.pt_BR=structuredClone(values.translations.el);
 for(const c of [values.copy,...Object.values(values.translations).map((t:any)=>t.copy)] as any[])for(const entry of c.sections){entry._template=entry._template.replaceAll('-','_');if(entry.body!==undefined)entry.body=ast('Typed body');}
 values.sections.forEach((s:any)=>s._template=s._template.replaceAll('-','_'));
 const before=structuredClone(values);expect(beforeSubmit(values,'page',p,current)).toBe(values);expect(values).toEqual(before);expect(nativeProjection(values,p).translations['pt-BR']).toBeDefined();
 values.translations['pt-BR']=values.translations.pt_BR;expect(()=>beforeSubmit(values,'page',p,current)).toThrow(/Duplicate.*alias/);
});
it('permits optional add/reorder/remove at save while preserving exact native ASTs and current identity',async()=>{
 const {beforeSubmit}=await import('../tina/validation');const current=JSON.parse(readFileSync('content/pages/about.json','utf8'));
 const values=structuredClone(current);const body=ast('New native body');
 values.sections.splice(1,0,{id:'extra',_template:'rich_text',variant:'default',enabled:false,appearance:{surface:'default'}});
 values.copy.sections.push({id:'extra',_template:'rich_text',title:'Extra',body});
 expect(beforeSubmit(values,'page',project,current)).toBe(values);expect(values.copy.sections.at(-1).body).toBe(body);
 const removed=structuredClone(current);const id=removed.sections.pop().id;removed.copy.sections=removed.copy.sections.filter((e:any)=>e.id!==id);for(const t of Object.values(removed.translations) as any[])t.copy.sections=t.copy.sections.filter((e:any)=>e.id!==id);
 expect(beforeSubmit(removed,'page',project,current)).toBe(removed);
});
it('rejects privacy region removal/hiding/retyping through save and document boundaries',async()=>{
 const {beforeSubmit}=await import('../tina/validation');const {normalizePageDocument}=await import('../packages/content/documents.mjs');const current=JSON.parse(readFileSync('content/pages/privacy.json','utf8'));
 for(const change of [(p:any)=>{p.sections.pop();p.copy.sections.pop();p.translations.el.copy.sections.pop();},(p:any)=>p.sections[1].enabled=false,(p:any)=>{p.sections[1]._template='people-list';for(const c of [p.copy,p.translations.el.copy])c.sections[1]={id:'privacy_details',_template:'people-list',title:'People',description:''};}]){
 const values=structuredClone(current);change(values);expect(()=>beforeSubmit(values,'page',project,current)).toThrow();expect(()=>normalizePageDocument(values)).toThrow();
 }
});
it('uses the current relativePath record for composition identity and fails closed when absent',async()=>{
 const {validateCurrentSave}=await import('../tina/validation');const {readdirSync}=await import('node:fs');
 const folders:Record<string,string>={settings:'settings',page:'pages',offering:'offerings',person:'people',article:'articles',campaign:'campaigns'};
 const request=async(query:string)=>{
 const collection=/\{(\w+)Connection/.exec(query)![1];const folder=folders[collection];
 return {[collection+'Connection']:{edges:readdirSync('content/'+folder).filter(file=>file.endsWith('.json')).map(file=>({node:{_values:JSON.parse(readFileSync('content/'+folder+'/'+file,'utf8')),_sys:{relativePath:file}}})),pageInfo:{hasNextPage:false,endCursor:null}}};
 };
 const cms={api:{tina:{request}}};const values=JSON.parse(readFileSync('content/pages/about.json','utf8'));
 [values.sections[1],values.sections[2]]=[values.sections[2],values.sections[1]];
 expect(await validateCurrentSave(values,'page',project,cms,'about.json')).toBe(values);
 await expect(validateCurrentSave({...values,contentId:'home'},'page',project,cms,'about.json')).rejects.toThrow(/identity.*protected/i);
 await expect(validateCurrentSave(values,'page',project,cms,'absent.json')).rejects.toThrow(/current native record.*not found/i);
});
