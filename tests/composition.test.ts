import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { addSection, moveSection, setSectionEnabled, removeSection, addTranslationCopy } from '../packages/content/composition.mjs';
const draft=():any=>JSON.parse(readFileSync('content/pages/about.json','utf8'));
const ast={type:'root',children:[{type:'p',children:[{text:'Retained'}]}]};
const copy=(id='extra',type:string='rich-text'):any=>({id,_template:type,title:'Extra',body:ast});
it('adds repeated types with supplied page-local IDs, explicit copy and hidden references after the selection',()=>{
 const source=draft();const id=source.sections[1].id;source.copy.sections[1].body=ast;
 const next=addSection(source,{type:'rich-text',id:'extra',afterId:id,copy:copy()});
 expect(next.sections.map((s:any)=>s.id)).toEqual(['intro',id,'extra','people_preview']);
 expect(next.sections[2]).toEqual({id:'extra',_template:'rich-text',variant:'default',enabled:false,appearance:{surface:'default'}});
 expect(next.copy.sections.at(-1)).toBeDefined();expect(next.copy.sections[1].body).toBe(ast);
 expect(next).not.toBe(source);expect(next.sections).not.toBe(source.sections);expect(next.translations).toBe(source.translations);
 expect(source.sections).toHaveLength(3);expect(next.translations.el.copy.sections).toHaveLength(3);
 expect(addSection(draft(),{type:'rich-text',id:'extra',afterId:'intro',copy:copy()}).sections[1].id).toBe('extra');
});
it('rejects invalid IDs, unknown types/selections, hero additions and mismatched or incomplete copies',()=>{
 for(const options of [{id:'Bad ID'},{id:'intro'},{type:'unknown'},{type:'hero'},{afterId:'missing'},{copy:copy('wrong')},{copy:copy('extra','cta')},{copy:{id:'extra',_template:'rich-text'}},{copy:{...copy(),unknown:true}}])
 expect(()=>addSection(draft(),{type:'rich-text',id:'extra',afterId:'intro',copy:copy(),...options} as any)).toThrow();
});
it('accepts canonical and native aliases without rewriting retained copies or native ASTs',()=>{
 for(const alias of ['rich-text','rich_text']){
 const source=draft();source.sections[1]._template=alias;source.copy.sections[1]._template=alias;source.copy.sections[1].body=ast;
 const next=addSection(source,{type:'rich-text',id:'extra',afterId:'intro',copy:copy('extra',alias)});
 expect(next.copy.sections[1]).toBe(source.copy.sections[1]);expect(next.copy.sections[1].body).toBe(ast);expect(next.copy.sections.at(-1)?._template).toBe(alias);
 }
});
it('moves only optional references while keeping the hero first and preserving every copy container',()=>{
 const source=addSection(draft(),{type:'rich-text',id:'extra',afterId:'intro',copy:copy()});
 const next=moveSection(source,'extra','down');expect(next.sections.map(s=>s.id)).toEqual(['intro','approach','extra','people_preview']);
 expect(next.copy).toBe(source.copy);expect(next.translations).toBe(source.translations);expect(source.sections[1].id).toBe('extra');
 expect(moveSection(next,'extra','up').sections[1].id).toBe('extra');
 for(const [id,direction] of [['intro','down'],['extra','up'],['missing','up'],['extra','sideways']])expect(()=>moveSection(source,id,direction as any)).toThrow();
});
it('hides shared optional sections while retaining every localized copy and protecting required regions',()=>{
 const source=draft();const next=setSectionEnabled(source,source.sections[1].id,false);
 expect(next.sections[1].enabled).toBe(false);expect(next.copy).toBe(source.copy);expect(next.translations).toBe(source.translations);expect(source.sections[1].enabled).toBe(true);
 expect(setSectionEnabled(next,next.sections[1].id,true).sections[1].enabled).toBe(true);
 expect(()=>setSectionEnabled(source,'intro',false)).toThrow();expect(()=>setSectionEnabled(source,'missing',false)).toThrow();
 const privacy=JSON.parse(readFileSync('content/pages/privacy.json','utf8'));expect(()=>setSectionEnabled(privacy,'privacy_details',false)).toThrow();expect(()=>removeSection(privacy,'privacy_details')).toThrow();
});
it('removes shared references and all EN/EL/pt_BR copies atomically without touching surviving AST identity',()=>{
 const source=addSection(draft(),{type:'rich-text',id:'extra',afterId:'intro',copy:copy()});
 source.translations.pt_BR=structuredClone(source.translations.el);source.translations.pt_BR.copy.sections.push(copy());source.translations.el.copy.sections.push(copy());
 source.copy.sections[0].description=ast;const next=removeSection(source,'extra');
 expect(next.sections).toHaveLength(3);expect(next.copy.sections).toHaveLength(3);expect(next.copy.sections[0].description).toBe(ast);
 for(const key of ['el','pt_BR'])expect(next.translations[key].copy.sections.some((e:any)=>e.id==='extra')).toBe(false);
 expect(source.translations.el.copy.sections).toHaveLength(4);expect(()=>removeSection(source,'intro')).toThrow();expect(()=>removeSection(source,'missing')).toThrow();
});
it('adds only explicitly supplied translation copy to existing locale metadata and shared instances',()=>{
 const source=addSection(draft(),{type:'rich-text',id:'extra',afterId:'intro',copy:copy()});source.translations.pt_BR=structuredClone(source.translations.el);
 const next=addTranslationCopy(source,'pt_BR','extra',copy());expect(next.translations.pt_BR.copy.sections.at(-1)?.body).toBe(ast);
 expect(next.copy).toBe(source.copy);expect(next.sections).toBe(source.sections);expect(next.translations.el).toBe(source.translations.el);
 expect(next.translations.pt_BR.meta).toBe(source.translations.pt_BR.meta);expect(next.translations.pt_BR.status).toBe('published');
 for(const [locale,id,entry] of ([['missing','extra',copy()],['el','missing',copy()],['el','intro',copy('intro','hero')],['el','extra',copy('wrong')],['el','extra',copy('extra','cta')]] as [string,string,any][]))expect(()=>addTranslationCopy(source,locale,id,entry)).toThrow();
});


it('keeps the same supplied ID independent across pages and registered optional types',()=>{
 const first=addSection(draft(),{type:'rich-text',id:'extra',afterId:'intro',copy:copy()});
 const second=addSection(draft(),{type:'people-list',id:'extra',afterId:'intro',copy:{id:'extra',_template:'people_list',title:'People',description:''}});
 expect(first.sections[1]._template).toBe('rich-text');expect(second.sections[1]._template).toBe('people-list');
});
it('accepts explicit empty translation drafts without inventing prose or publication metadata',()=>{
 const source=addSection(draft(),{type:'cta',id:'extra',afterId:'intro',copy:{id:'extra',_template:'cta',title:'Contact',description:'',link:{label:'Contact',href:'/contact'}}});
 const supplied={id:'extra',_template:'cta' as const,title:'',description:'',link:{label:'',href:''}};
 const next=addTranslationCopy(source,'el','extra',supplied);
 expect(next.translations.el.copy.sections.at(-1)).toBe(supplied);expect(next.translations.el.meta).toBe(source.translations.el.meta);expect(next.translations.el.status).toBe(source.translations.el.status);
});
