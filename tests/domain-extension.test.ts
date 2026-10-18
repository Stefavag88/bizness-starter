import type {NativeSectionName} from '../packages/content/composition.mjs';
import {it,expect,expectTypeOf,vi} from 'vitest';
expectTypeOf<NativeSectionName<'lesson-list'>>().toEqualTypeOf<'lesson_list'>();
vi.mock('../packages/content/module-extensions.mjs',async()=>{const {z}=await import('zod');const {LIMITS}=await import('../packages/content/limits.mjs');const {isSafeMarkdown}=await import('../packages/content/rich-text.mjs');return {modulePageTemplates:['lessons'],moduleSectionDefinitions:[{type:'lesson-list',nativeName:'lesson_list',copySchema:z.strictObject({title:z.string().max(LIMITS.title),description:z.string().max(LIMITS.description).refine(value=>isSafeMarkdown(value,true))}),variants:['default'],referenceFields:{},defaultReference:()=>({}),richFields:[{path:['description'],inline:true}],defaultCopy:()=>({title:'Lessons',description:''}),enabled:(p:any)=>p.modules.lessons===true}]};});
import {normalizePageDocument} from '../packages/content/documents.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {availableSections} from '../tina/fields/composition';
import {assertOwnedPageIdentity} from '../packages/content/domain-publication.mjs';
import {createDomainRegistry} from '../packages/content/domain-registry.mjs';
import {lessonDomain} from './fixtures/content/domain';
import {readContent} from '../packages/content/read.mjs';
import {fixture,project,pageDocument} from './fixtures/content/factory';
it('accepts module-owned Page templates and round-trips dormant section copy while hiding output/chooser',()=>{
 const doc:any=pageDocument('learning','lessons','learning');doc.sections.push({id:'lessons',_template:'lesson-list',variant:'default',enabled:true,appearance:{surface:'default'}});doc.copy.sections.push({id:'lessons',_template:'lesson-list',title:'Lessons',description:'Dormant copy'});
 const parsed=normalizePageDocument(doc);expect(parsed.copy.sections.lessons).toEqual({title:'Lessons',description:'Dormant copy'});
 const f=fixture(),source=readContent(f.root,project);source.pages.push(parsed);expect(localizeContent(source,'en',project).pages.at(-1)!.sections.some(s=>s.id==='lessons')).toBe(false);
 expect(availableSections(true,project).some(d=>String(d.type)==='lesson-list')).toBe(false);expect(availableSections(true,{...project,modules:{lessons:true}} as any).some(d=>String(d.type)==='lesson-list')).toBe(true);
});
it('enforces declared module index filename/template/contentId on native updates',()=>{
 const registry=createDomainRegistry([lessonDomain()]);const value={contentId:'lesson-index',_template:'lessons'};
 expect(()=>assertOwnedPageIdentity(value,'lessons.json',registry)).not.toThrow();
 expect(()=>assertOwnedPageIdentity(value,'arbitrary.json',registry)).toThrow(/owned Page/);
 expect(()=>assertOwnedPageIdentity({...value,contentId:'wrong'},'lessons.json',registry)).toThrow(/owned Page/);
 expect(()=>assertOwnedPageIdentity({_template:'standard',contentId:'another'},'lessons.json',registry)).toThrow(/owned Page/);
});

it('exposes independent shared limits while preserving the existing schema export',async()=>{
 const {LIMITS}=await import('../packages/content/limits.mjs');const schemas=await import('../packages/content/schemas.mjs');
 expect(schemas.LIMITS).toBe(LIMITS);const definition=schemas.sectionDefinitions.find(d=>String(d.type)==='lesson-list')!;
 expect(definition.copySchema.safeParse({title:'x'.repeat(201),description:''}).success).toBe(false);expect(definition.copySchema.safeParse({title:'Lesson',description:'[Unsafe](javascript:bad)'}).success).toBe(false);
});
