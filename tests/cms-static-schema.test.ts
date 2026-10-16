import { it, expect } from 'vitest';
import { buildCollections } from '../tina/collections';
import { project } from './fixtures/content/factory';
it('declares six static typed copy templates including canonical native aliases with composition locked',()=>{const c=buildCollections({...project,articles:false}).find(c=>c.name==='page')!;const template:any=c.templates!.find(t=>typeof t!=='string'&&t.name==='standard');const copy=template.fields.find((f:any)=>f.name==='copy').fields.find((f:any)=>f.name==='sections');expect(copy.list).toBe(true);expect(copy.templates.map((t:any)=>t.nameOverride||t.name)).toEqual(['hero','rich-text','offering-list','people-list','article-list','cta']);expect(copy.templates.find((t:any)=>t.name==='rich_text').nameOverride).toBe('rich-text');expect(typeof copy.ui.component).toBe('function');expect(c.ui?.allowedActions?.create).toBe(false);});
it('declares translated navigation as a static list of label and page ID fields',()=>{const c=buildCollections(project).find(c=>c.name==='settings')!;const translations:any=c.fields!.find(f=>f.name==='translations');const nav=translations.fields[0].fields.find((f:any)=>f.name==='navigation');expect(nav.list).toBe(true);expect(nav.fields.map((f:any)=>f.name)).toEqual(['pageId','label']);expect(typeof nav.ui.component).toBe('function');});
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fixture, pageDocument, settingsDocument } from './fixtures/content/factory';
import { sectionDefinitions } from '../packages/content/section-registry.mjs';
import { readContent } from '../packages/content/read.mjs';
it('keeps descriptor bytes and native declarations independent of standard page, section and navigation IDs',()=>{
 const f=fixture();writeFileSync(join(f.root,'project.json'),JSON.stringify(project));
 const generate=()=>{execFileSync(process.execPath,[resolve('scripts/cms-descriptor.mjs')],{cwd:f.root});return readFileSync(join(f.root,'.generated/cms.json'),'utf8');};
 const before=generate(),schema=JSON.stringify(buildCollections(project));const extra=pageDocument('extra','standard','extra');extra.sections[1].id='another_id';for(const copy of [extra.copy,extra.translations.el.copy])copy.sections[1].id='another_id';f.write('pages/extra.json',extra);
 const settings=settingsDocument();settings.navigation.push({pageId:'extra',label:'Extra'});settings.translations.el.navigation.push({pageId:'extra',label:'Extra Greek'});f.write('settings/site.json',settings);
 expect(generate()).toBe(before);expect(JSON.stringify(buildCollections(project))).toBe(schema);expect(Object.keys(JSON.parse(before))).toEqual(['project','articlePageFiles']);
});
it('uses one registry with unique GraphQL-safe aliases and detached honest copy defaults',()=>{
 expect(sectionDefinitions).toHaveLength(6);expect(new Set(sectionDefinitions.map(d=>d.nativeName)).size).toBe(6);
 for(const definition of sectionDefinitions){expect(definition.nativeName).toMatch(/^[a-z][a-z_]*$/);const a=definition.defaultCopy(),b=definition.defaultCopy();expect(a.title).toBe('New section');expect(definition.copySchema.safeParse(a).success).toBe(true);a.title='Changed';expect(b.title).toBe('New section');}
 expect(sectionDefinitions.find(d=>d.type==='cta')!.defaultCopy()).toEqual({title:'New section',description:'',link:{label:'Contact us',href:'/contact'}});
});
it('rejects navigation destinations absent from the current catalog',()=>{
 const f=fixture();const settings=settingsDocument();settings.navigation.push({pageId:'missing',label:'Missing'});settings.translations.el.navigation.push({pageId:'missing',label:'Missing'});f.write('settings/site.json',settings);expect(()=>readContent(f.root,project)).toThrow(/missing.*page|unknown.*page|navigation/i);
});
