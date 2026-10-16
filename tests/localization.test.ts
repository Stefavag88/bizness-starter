import { expect, it } from 'vitest';
import { readContent } from '../packages/content/read.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { fixture,project,page,editorial,settings } from './fixtures/content/factory';
it('resolves stable IDs after reorder and never mutates sources or other projections',()=>{
 const f=fixture();const p=page();p.sections.reverse();f.write('pages/home.json',p);
 const source=readContent(f.root,project);const before=structuredClone(source);
 const el=localizeContent(source,'el',project);expect(el.pages.find(p=>p.contentId==='home')!.sections[0].copy).toEqual({title:'Περισσότερα',body:'Μια παράγραφος.'});
 el.pages[0].sections[0].copy.title='Changed';localizeContent(source,'en',project);expect(source).toEqual(before);
});
it('omits optional sections with no translated copy and never falls back editorial translations',()=>{
 const f=fixture();const p=page();delete (p.translations.el.copy.sections as any).details;f.write('pages/home.json',p);
 f.write('offerings/sample.json',{...editorial(),translations:{}});
 const source=readContent(f.root,project);expect(localizeContent(source,'el',project).pages.find(p=>p.contentId==='home')!.sections.map(s=>s.id)).toEqual(['intro']);
 expect(localizeContent(source,'el',project).offerings).toEqual([]);
});
it.each(['settings','home','contact','privacy','services','insights'])('fails clearly for missing required %s translation',id=>{
 const f=fixture();if(id==='settings')f.write('settings/site.json',{...settings(),translations:{}});else {const templates:Record<string,string>={home:'home',contact:'contact',privacy:'standard',services:'offerings',insights:'insights'};f.write('pages/'+id+'.json',{...page(id,templates[id],id==='home'?'':id),translations:{}});}
 expect(()=>localizeContent(readContent(f.root,project),'el',project)).toThrow(/translation|locale/i);
});
it('rejects unconfigured and underscore translation keys',()=>{const f=fixture();f.write('offerings/sample.json',{...editorial(),translations:{en_US:editorial().translations.el}});expect(()=>readContent(f.root,project)).toThrow(/locale|translation/i);});

it('keeps identity, consent version and contact destinations shared across languages',()=>{
 const f=fixture();const raw=settings();f.write('settings/site.json',raw);
 const el=localizeContent(readContent(f.root,project),'el',project).settings;
 expect(el.brand.name).toBe('Example Studio');expect(el.legal.businessName).toBe('Example Studio');expect(el.legal.privacyVersion).toBe('sample-v1');
 expect(el.contact.email).toBe('hello@example.com');expect(el.navigation.map(n=>n.pageId)).toEqual(['home','insights']);expect(el.navigation[0].label).toBe('Αρχική');
});
it.each([['brand','name'],['legal','businessName'],['legal','privacyVersion'],['contact','email'],['contact','phone']])('rejects translated shared %s.%s',(group,key)=>{
 const f=fixture();const raw=settings();(raw.translations.el as any)[group][key]='Override';f.write('settings/site.json',raw);expect(()=>readContent(f.root,project)).toThrow();
});
it('rejects translated navigation structure and stale label IDs',()=>{
 const f=fixture();const raw=settings();(raw.translations.el.navigation as any).unknown='Stale';f.write('settings/site.json',raw);expect(()=>readContent(f.root,project)).toThrow();
});

it('can project frozen snapshots in either locale without sharing mutable output references',()=>{
 const f=fixture(),source=readContent(f.root,project),before=structuredClone(source);
 function freeze(value:any){if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}}
 freeze(source);
 for(const locale of ['en','el']){
  const output=localizeContent(source,locale,project);output.offerings[0].title='Changed';output.settings.brand.name='Changed';output.pages[0].sections.reverse();
  expect(source).toEqual(before);
 }
});
