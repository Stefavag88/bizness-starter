import {describe,it,expect} from 'vitest';
import {sectionDefinitions} from '../packages/content/section-registry.mjs';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {fixture,project} from './fixtures/content/factory';
import {createShowcaseSamples} from '../apps/site/src/components/showcase/samples';
describe('detached showcase samples',()=>{
 it.each(['en','el'])('renders every default-enabled registered type/variant with unique %s instance IDs and available destinations',locale=>{
  const {root}=fixture();const input=localizeContent(readContent(root,project),locale,project);const before=structuredClone(input);
  const samples=createShowcaseSamples(input);
  expect(samples.sections.map(s=>s._template+'/'+s.variant).sort()).toEqual(sectionDefinitions.filter(d=>!d.enabled||d.enabled(project)).flatMap(d=>d.variants.map(v=>d.type+'/'+v)).sort());
  expect(new Set(samples.sections.map(s=>s.id)).size).toBe(14);
  expect(samples.sections.every(s=>s.id.startsWith('showcase-'+locale+'-'))).toBe(true);
  const paths=input.pages.map(p=>p.path);
  for(const records of [samples.content.offerings,samples.content.people,samples.content.articles]) for(const record of records) expect(paths).toContain(record.path);
  samples.content.settings.brand.name='Detached';samples.sections[0].copy.title='Changed';expect(input).toEqual(before);
  expect(createShowcaseSamples(input)).toEqual(createShowcaseSamples(input));
 });
 it('keeps an explicitly synthetic article example when articles are disabled',()=>{
  const {root}=fixture();const config={...project,articles:false};
  const input=localizeContent(readContent(root,config),'el',config);const samples=createShowcaseSamples(input);
  expect(input.articles).toEqual([]);expect(samples.content.articles).toHaveLength(1);
  expect(samples.content.articles[0].path).toBe(input.pages.find(p=>p._template==='contact')!.path);
  expect(samples.content.articles[0].title).toContain('Δείγμα');
  expect(samples.sections.find(s=>s._template==='article-list')!.copy.title).toContain('ArticleList');
 });
});
