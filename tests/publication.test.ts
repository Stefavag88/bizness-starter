import { expect, it } from 'vitest';
import { readContent } from '../packages/content/read.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { fixture,project,editorial,pageDocument as page } from './fixtures/content/factory';
it('omits drafts/future records and filters relationships separately per locale',()=>{
 const f=fixture();f.write('offerings/sample.json',{...editorial(),translations:{el:{...editorial().translations.el,status:'draft'}}});
 f.write('articles/article.json',{...editorial('article','article'),offeringId:'sample'});
 f.write('people/future.json',{...editorial('person','future'),publishAt:'2099-01-01T00:00:00Z'});
 f.write('people/draft.json',{...editorial('person','draft'),status:'draft'});
 const source=readContent(f.root,project,{now:new Date('2026-01-01T00:00:00Z')});
 expect(localizeContent(source,'en',project).articles.map(a=>a.contentId)).toEqual(['article']);
 expect(localizeContent(source,'el',project).articles).toEqual([]);
 expect(localizeContent(source,'en',project).people.map(a=>a.contentId)).toEqual(['person']);
});
it('allows optional relationships, but rejects supplied missing IDs even on drafts',()=>{
 const f=fixture();expect(readContent(f.root,project).articles).toHaveLength(1);
 f.write('articles/article.json',{...editorial('article','article'),status:'draft',authorId:'absent'});
 expect(()=>readContent(f.root,project)).toThrow(/authorId.*absent/);
});
it('does not read disabled article folders or require the index, and filters nav/feed',()=>{
 const f=fixture();f.write('articles/article.json',{malformed:true});f.write('pages/insights.json',{malformed:true,_template:'insights'});
 // Disabled index file is recognized by reserved singleton filename before parsing.
 const p={...project,articles:false};const source=readContent(f.root,p);const result=localizeContent(source,'en',p);
 expect(result.articles).toEqual([]);expect(result.pages.some(p=>p._template==='insights')).toBe(false);expect(result.settings.navigation.map(n=>n.pageId)).toEqual(['home']);expect(result.feedPath).toBeNull();
});
it('allows enabled empty editorial folders',()=>{const f=fixture();f.write('articles/article.json',null);/* remove only this fixture file */return import('node:fs').then(({unlinkSync})=>{unlinkSync(f.root+'/content/articles/article.json');expect(readContent(f.root,project).articles).toEqual([]);});});

it('uses translated schedules without inheriting default-locale schedules',()=>{
 const f=fixture();f.write('offerings/sample.json',{...editorial(),publishAt:'2099-01-01T00:00:00Z'});
 const source=readContent(f.root,project,{now:new Date('2026-01-01T00:00:00Z')});
 expect(localizeContent(source,'en',project).offerings).toEqual([]);
 expect(localizeContent(source,'el',project).offerings.map(r=>r.contentId)).toEqual(['sample']);
});

it('compares publication timestamps as instants across offsets',()=>{
 const f=fixture();f.write('articles/article.json',{...editorial('article','article'),publishAt:'2026-01-01T11:00:00+02:00',updatedAt:'2026-01-01T09:30:00Z'});
 const source=readContent(f.root,project,{now:new Date('2026-01-01T09:00:00Z')});
 expect(localizeContent(source,'en',project).articles.map(a=>a.contentId)).toEqual(['article']);
 f.write('articles/article.json',{...editorial('article','article'),publishAt:'2026-01-01T09:01:00Z'});
 expect(localizeContent(readContent(f.root,project,{now:new Date('2026-01-01T11:00:00+02:00')}),'en',project).articles).toEqual([]);
});
