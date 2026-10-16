import { describe, expect, it } from 'vitest';
import { pageSchema, offeringSchema, personSchema, articleSchema } from '../packages/content/schemas.mjs';
import { page, editorial } from './fixtures/content/factory';
describe('strict canonical records',()=>{
 it('accepts rich strings and normalizes native optional SEO',()=>{
  for(const value of [null,'  ',undefined]) expect(offeringSchema.parse({...editorial(),seoDescription:value}).seoDescription).toBe('');
  expect(pageSchema.parse(page()).copy.sections.intro).toEqual({title:'Hello',description:'A **clear** introduction.'});
  expect(personSchema.parse(editorial('person')).status).toBe('published');
  expect(articleSchema.parse(editorial('article')).authorId).toBeUndefined();
 });
 it.each([
  ['paragraph arrays',(p:any)=>p.copy.sections.details.body=['legacy']],
  ['unknown page key',(p:any)=>p.unknown=true],
  ['unknown section type',(p:any)=>p.sections[1]._template='custom'],
  ['unknown variant',(p:any)=>p.sections[1].variant='custom'],
  ['unknown surface',(p:any)=>p.sections[1].appearance.surface='orange'],
  ['appearance override',(p:any)=>p.translations.el.sections=[]],
  ['duplicate section IDs',(p:any)=>p.sections.push(p.sections[1])],
  ['missing default copy',(p:any)=>delete p.copy.sections.details],
  ['stale translated ID',(p:any)=>p.translations.el.copy.sections.stale={title:'Stale',body:'Text'}],
  ['wrong copy for section type',(p:any)=>p.copy.sections.details={title:'Title',description:'Wrong'}],
  ['disabled required hero',(p:any)=>p.sections[0].enabled=false],
  ['missing hero',(p:any)=>{p.sections.shift();delete p.copy.sections.intro;delete p.translations.el.copy.sections.intro;}],
  ['oversize page title',(p:any)=>p.meta.title='x'.repeat(201)],
 ])('rejects %s',(_name,change)=>{const p=page();change(p);expect(()=>pageSchema.parse(p)).toThrow();});
 it.each([['title',201],['seoDescription',301],['description',10001],['body',100001]])('limits %s',(key,size)=>expect(()=>offeringSchema.parse({...editorial(),[key]:'x'.repeat(size)})).toThrow());
 it('rejects unknown translations and missing explicit person status',()=>{expect(()=>personSchema.parse({...editorial('person'),status:undefined})).toThrow();expect(()=>offeringSchema.parse({...editorial(),translations:{el:{...editorial().translations.el,slug:'override'}}})).toThrow();});
});

it('normalizes cleared optional relationships while requiring valid supplied IDs',()=>{
 for(const value of [undefined,null,'','   '])expect(articleSchema.parse({...editorial('article'),authorId:value,offeringId:value}).authorId).toBeUndefined();
 expect(()=>articleSchema.parse({...editorial('article'),authorId:'invalid ID'})).toThrow();
});
it('requires explicit article publication timestamps and validates updated dates',()=>{
 const article=editorial('article');
 expect(()=>articleSchema.parse({...article,publishAt:undefined})).toThrow();
 expect(()=>articleSchema.parse({...article,updatedAt:'2024-01-01T00:00:00Z'})).toThrow();
 expect(()=>articleSchema.parse({...article,translations:{el:{...article.translations.el,publishAt:undefined}}})).toThrow();
 expect(articleSchema.parse({...article,updatedAt:'2025-01-03T00:00:00Z'}).updatedAt).toBe('2025-01-03T00:00:00Z');
});
it('accepts GraphQL-safe stable page/section map IDs without an implicit codec',()=>{
 const p=page('extra_page','standard','extra-page');p.sections[1].id='extra_section';p.copy.sections={intro:p.copy.sections.intro,extra_section:p.copy.sections.details} as any;p.translations.el.copy.sections={intro:p.translations.el.copy.sections.intro,extra_section:p.translations.el.copy.sections.details} as any;
 expect(pageSchema.parse(p).contentId).toBe('extra_page');
});
it('rejects hyphenated page IDs and section map keys while keeping hyphenated slugs',()=>{
 expect(()=>pageSchema.parse(page('extra-page','standard','extra-page'))).toThrow();
 const p=page();p.sections[1].id='extra-section';(p.copy.sections as any)['extra-section']=p.copy.sections.details;delete (p.copy.sections as any).details;(p.translations.el.copy.sections as any)['extra-section']=p.translations.el.copy.sections.details;delete (p.translations.el.copy.sections as any).details;
 expect(()=>pageSchema.parse(p)).toThrow();
});
