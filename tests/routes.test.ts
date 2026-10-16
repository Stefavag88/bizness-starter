import { validateCatalog } from '../packages/content/catalog.mjs';
import { expect,it } from 'vitest';
import { readContent } from '../packages/content/read.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { publicRoutes } from '../packages/content/routes.mjs';
import { fixture,project,page,editorial } from './fixtures/content/factory';
it('builds stable explicit routes and reciprocal published alternates',()=>{
 const f=fixture();f.write('offerings/sample.json',{...editorial(),translations:{}});
 const en=publicRoutes(localizeContent(readContent(f.root,project),'en',project));
 expect(en.find(r=>r.contentId==='home')).toEqual({kind:'page',contentId:'home',locale:'en',path:'/en',alternates:[{locale:'en',path:'/en'},{locale:'el',path:'/el'}]});
 expect(en.find(r=>r.contentId==='sample')!.alternates).toEqual([{locale:'en',path:'/en/services/sample'}]);
});
it.each(['home','contact','privacy','services','insights'])('requires protected %s page',async id=>{
 const f=fixture();const {unlinkSync}=await import('node:fs');unlinkSync(f.root+'/content/pages/'+id+'.json');expect(()=>readContent(f.root,project)).toThrow();
});
it.each(['404','api','cms','admin','design-system','newsletter','el','en'])('rejects reserved/prefix slug %s',slug=>{const f=fixture();f.write('pages/extra.json',page('extra','standard',slug));expect(()=>readContent(f.root,project)).toThrow(/slug|route/i);});
it('rejects duplicate home, misplaced home, and duplicate active slugs',()=>{
 const f=fixture();f.write('pages/extra.json',page('extra','home',''));expect(()=>readContent(f.root,project)).toThrow();
 f.write('pages/extra.json',page('extra','standard','about'));expect(()=>readContent(f.root,project)).toThrow(/slug|route/i);
 f.write('pages/extra.json',page('extra','home','extra'));expect(()=>readContent(f.root,project)).toThrow();
});
it('omits disabled article routes and allows drafts to share inactive URLs',()=>{
 const f=fixture();f.write('pages/draft.json',{...page('draft','standard','about'),status:'draft',translations:{}});
 const p={...project,articles:false};const routes=publicRoutes(localizeContent(readContent(f.root,p),'en',p));expect(routes.some(r=>r.kind==='article'||r.contentId==='insights')).toBe(false);
});

it('includes person detail routes and detects page/detail URL collisions',()=>{
 const f=fixture();let content=readContent(f.root,project);
 const routes=publicRoutes(localizeContent(content,'en',project));
 expect(routes.find(r=>r.kind==='person')).toEqual({kind:'person',contentId:'person',locale:'en',path:'/en/people/person',alternates:[{locale:'en',path:'/en/people/person'},{locale:'el',path:'/el/people/person'}]});
 f.write('pages/extra.json',page('extra','standard','services/sample'));expect(()=>readContent(f.root,project)).toThrow(/route/i);
});

it('rejects an existing About candidate at the system 404 route in the shared catalog',()=>{
 const f=fixture();const source=readContent(f.root,project);source.pages.find(p=>p.contentId==='about')!.slug='404';
 expect(()=>validateCatalog(source,project)).toThrow(/reserved slug 404/);
});
