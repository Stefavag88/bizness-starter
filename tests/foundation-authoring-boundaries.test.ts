import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {validateCatalog} from '../packages/content/catalog.mjs';
import {validateCurrentSave} from '../tina/validation';
import {buildCollections} from '../tina/collections';
import {fixture,project,editorial} from './fixtures/content/factory';
it('protects canonical relationship targets from native deletion',()=>{
 const p=parseProject(JSON.parse(readFileSync('project.json','utf8')));
 for(const kind of ['offering','person','article'])expect(buildCollections(p).find(c=>c.name===kind)?.ui?.allowedActions?.delete).toBe(false);
 const source=readContent('.',p);
 for(const [key,id] of [['people','sample-person'],['offerings','sample-service']] as const){
  const candidate=structuredClone(source);if(key==='people')candidate.people=candidate.people.filter(r=>r.contentId!==id);else candidate.offerings=candidate.offerings.filter(r=>r.contentId!==id);
  expect(()=>validateCatalog(candidate,p)).toThrow(/references missing ID/);
 }
});
it('disables both native folder controls on every collection, including protected Pages',()=>{
 for(const p of [project,{...project,profile:'newsletter' as const}])for(const collection of buildCollections(p))
  expect(collection.ui?.allowedActions).toMatchObject({createFolder:false,createNestedFolder:false});
});
it.each(['nested/sample.json','nested\\sample.json','../sample.json'])('rejects nested native save path %s before data-layer access or mutation',async relativePath=>{
 const values=editorial();const original=structuredClone(values);
 const cms={get api(){throw Error('Unexpected data-layer access');}};
 await expect(validateCurrentSave(values,'offering',project,cms,relativePath)).rejects.toThrow(/flat|directly.*collection/i);
 expect(values).toEqual(original);
});
it.each(['pages','offerings','people','articles','settings'])('fails actionably for nested active %s content',folder=>{
 const f=fixture();f.write(folder+'/nested/document.json',{malformed:true});
 expect(()=>readContent(f.root,project)).toThrow(/nested.*content|flat.*collection/i);
});
it('rejects nested campaigns when active, but ignores dormant article and campaign folders',()=>{
 const f=fixture();f.write('articles/nested/bad.json',{malformed:true});f.write('campaigns/nested/bad.json',{malformed:true});
 expect(()=>readContent(f.root,{...project,articles:false})).not.toThrow();
 expect(()=>readContent(f.root,{...project,articles:false,profile:'newsletter'})).toThrow(/nested.*content|flat.*collection/i);
});

it('rejects nested paths through the actual generated collection save hook without changing native values',async()=>{
 const values=editorial();const original=structuredClone(values);const offering=buildCollections(project).find(c=>c.name==='offering')!;
 await expect(offering.ui!.beforeSubmit!({values,cms:{get api(){throw Error('Unexpected data-layer access');}},form:{path:'content/offerings/nested/sample.json'}})).rejects.toThrow(/flat collection/);
 expect(values).toEqual(original);
});
it('rejects an About native save candidate with slug 404 before persistence',async()=>{
 const p=parseProject(JSON.parse(readFileSync('project.json','utf8')));const values=JSON.parse(readFileSync('content/pages/about.json','utf8'));values.slug='404';const original=structuredClone(values);
 await expect(validateCurrentSave(values,'page',p,{get api(){throw Error('Unexpected data-layer access');}},'about.json')).rejects.toThrow(/protected|reserved/);
 expect(values).toEqual(original);
});
