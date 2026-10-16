import {it,expect} from 'vitest';
import {fixture,project,editorial} from './fixtures/content/factory';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {publicRoutes} from '../packages/content/routes.mjs';
import {createManifest} from '../scripts/manifest.mjs';
it('manifests share active routes and plain default-locale article IDs',()=>{
 const f=fixture(); f.write('articles/future.json',{...editorial('article','future'),publishAt:'2099-01-01T00:00:00Z'});
 f.write('articles/draft.json',{...editorial('article','draft'),status:'draft'});
 const source=readContent(f.root,project,{now:new Date('2026-10-16T00:00:00Z')});
 const localized=localizeContent(source,'en',project);const manifest=createManifest(source,project);
 expect(manifest.articles.map(a=>a.id)).toEqual(localized.articles.map(a=>a.contentId));
 expect(manifest.routes).toEqual(project.languages.flatMap(l=>publicRoutes(localizeContent(source,l.code,project))));
 expect(manifest.articles[0].description).toBe('A useful summary.');
 expect(manifest.articles[0].url).toBe('https://example.com/en/insights/article');
});
it('uses configured offering index and excludes article manifests when disabled',()=>{
 const f=fixture();const source=readContent(f.root,project);const m=createManifest(source,project);
 expect(m.offerings[0].path).toBe('/en/services/sample');
 expect(createManifest(source,{...project,articles:false}).articles).toEqual([]);
});
