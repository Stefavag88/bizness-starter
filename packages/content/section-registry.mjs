import {moduleSectionDefinitions} from './module-extensions.mjs';
import { z } from 'zod';
import {mediaReferenceSchema} from './media.mjs';
import { isSafeLink, isSafeMarkdown, plainText } from './rich-text.mjs';
import {LIMITS} from './limits.mjs';
export {LIMITS} from './limits.mjs';
const BUILTIN_SECTION_TYPES = Object.freeze(['hero','rich-text','offering-list','people-list','article-list','cta','faq','steps','media-text','gallery']);
const title = z.string().trim().min(1).max(LIMITS.title);
const richSummary = z.string().max(LIMITS.description).refine(value=>isSafeMarkdown(value,true),'Description allows safe inline emphasis and links only');
const richBody = z.string().max(LIMITS.body).refine(value=>isSafeMarkdown(value),'Body allows safe Markdown with H2/H3 only');
export const linkSchema = z.strictObject({label:title,href:z.string().refine(isSafeLink,'Link must use a safe supported URL')});
const itemId = z.string().regex(/^[a-z][a-z0-9_]{0,79}$/);
const meaningfulBody = richBody.refine(value=>plainText(value).trim().length>0,'Item prose must contain text');
const imageText = z.strictObject({alt:title,caption:richSummary.optional()});
const itemSchemas = {gallery:z.strictObject({id:itemId,alt:title,caption:richSummary.optional()}),faq:z.strictObject({id:itemId,question:title,answer:meaningfulBody}),steps:z.strictObject({id:itemId,title,body:meaningfulBody})};
const builtinCopySchemas = {
 hero:z.strictObject({title,description:richSummary,link:linkSchema.optional()}),
 'rich-text':z.strictObject({title,body:richBody}),
 'offering-list':z.strictObject({title,description:richSummary}),
 'people-list':z.strictObject({title,description:richSummary}),
 'article-list':z.strictObject({title,description:richSummary}),
 faq:z.strictObject({title,description:richSummary,items:z.array(itemSchemas.faq)}),
 steps:z.strictObject({title,description:richSummary,items:z.array(itemSchemas.steps)}),
 'media-text':z.strictObject({title,body:meaningfulBody,image:imageText.optional(),link:linkSchema.optional()}),
 gallery:z.strictObject({title,description:richSummary,items:z.array(itemSchemas.gallery)}),
 cta:z.strictObject({title,description:richSummary,link:linkSchema}),
};

const builtinSectionDefinitions = BUILTIN_SECTION_TYPES.map(type=>Object.freeze({
 type, nativeName:type.replaceAll('-','_'), copySchema:builtinCopySchemas[type], variants:Object.freeze(type==='faq'?['default','expanded']:type==='steps'?['default','cards']:type==='media-text'?['default','reversed']:type==='gallery'?['default','featured']:['default']),
 referenceFields:type==='media-text'?{media:mediaReferenceSchema.optional()}:itemSchemas[type]?{items:z.array(z.strictObject({id:itemId,...(type==='gallery'?{media:mediaReferenceSchema}:{})}))}:{},
 defaultReference:()=>itemSchemas[type]?{items:[]}:{},
 richFields:Object.freeze([...(type==='media-text'?[{path:['body'],inline:false},{path:['image','caption'],inline:true}]:type==='rich-text'?[{path:['body'],inline:false}]:[{path:['description'],inline:true}]),...(itemSchemas[type]?[{path:['items','*',type==='gallery'?'caption':type==='faq'?'answer':'body'],inline:type==='gallery'}]:[])]),
 ...(itemSchemas[type]?{itemCopySchema:itemSchemas[type],defaultItemCopy:()=>type==='gallery'?{alt:'Describe this image',caption:''}:type==='faq'?{question:'New question',answer:'New answer'}:{title:'New step',body:'Describe this step'}}:{}),
 defaultCopy:()=>({title:'New section',...(['rich-text','media-text'].includes(type)?{body:type==='media-text'?'Describe this section':''}:{description:''}),...(itemSchemas[type]?{items:[]}:{}),...(type==='cta'?{link:{label:'Contact us',href:'/contact'}}:{})}),
}));

export function createSectionRegistry(definitions) {
 const types=new Set(),aliases=new Set();
 for(const definition of definitions){if(types.has(definition.type)||aliases.has(definition.nativeName))throw Error('Duplicate section registration: '+definition.type+'/'+definition.nativeName);types.add(definition.type);aliases.add(definition.nativeName);}
 return Object.freeze([...definitions]);
}
export const sectionDefinitions=createSectionRegistry([...builtinSectionDefinitions,...moduleSectionDefinitions]);
export const SECTION_TYPES=Object.freeze(sectionDefinitions.map(definition=>definition.type));
export const sectionCopySchemas=Object.freeze(Object.fromEntries(sectionDefinitions.map(definition=>[definition.type,definition.copySchema])));
export function sectionEnabled(definition,project){return (project.articles||definition.type!=='article-list')&&(!definition.enabled||definition.enabled(project));}
