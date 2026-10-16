import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseProject } from '../packages/config/project.mjs';
const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));
describe('native CMS collections',()=>{
 it('exposes profile-safe collections with protected pages and a settings singleton',async()=>{
  const {buildCollections}=await import('../tina/collections/index');
  const collections=buildCollections(project);
  expect(collections.map(c=>c.name)).toEqual(['settings','page','offering','person','article']);
  expect(collections.find(c=>c.name==='page')?.ui).toMatchObject({allowedActions:{create:false,delete:false}});
  expect(collections.find(c=>c.name==='settings')?.match).toEqual({include:'site'});
  expect(buildCollections({...project,articles:false}).map(c=>c.name)).not.toContain('article');
  expect(JSON.stringify(collections)).not.toMatch(/databaseId|sesRegion|notificationEmail/);
 });
 it('encodes regional native locale names only',async()=>{
  const {withTranslations}=await import('../tina/i18n');
  const fields=withTranslations([{name:'title',type:'string'}],{...project,languages:[{code:'en',label:'English'},{code:'pt-BR',label:'Portuguese'}]},['title']);
  expect(JSON.stringify(fields)).toContain('pt_BR');expect(JSON.stringify(fields)).not.toContain('"name":"pt-BR"');
 });
});
