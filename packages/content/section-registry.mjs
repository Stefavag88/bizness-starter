import { z } from 'zod';
import { isSafeLink, isSafeMarkdown, plainText } from './rich-text.mjs';
export const LIMITS = Object.freeze({title:200,seoDescription:300,description:10000,body:100000});
export const SECTION_TYPES = Object.freeze(['hero','rich-text','offering-list','people-list','article-list','cta','faq','steps']);
const title = z.string().trim().min(1).max(LIMITS.title);
const richSummary = z.string().max(LIMITS.description).refine(value=>isSafeMarkdown(value,true),'Description allows safe inline emphasis and links only');
const richBody = z.string().max(LIMITS.body).refine(value=>isSafeMarkdown(value),'Body allows safe Markdown with H2/H3 only');
export const linkSchema = z.strictObject({label:title,href:z.string().refine(isSafeLink,'Link must use a safe supported URL')});
const itemId = z.string().regex(/^[a-z][a-z0-9_]{0,79}$/);
const meaningfulBody = richBody.refine(value=>plainText(value).trim().length>0,'Item prose must contain text');
const itemSchemas = {faq:z.strictObject({id:itemId,question:title,answer:meaningfulBody}),steps:z.strictObject({id:itemId,title,body:meaningfulBody})};
export const sectionCopySchemas = Object.freeze({
 hero:z.strictObject({title,description:richSummary,link:linkSchema.optional()}),
 'rich-text':z.strictObject({title,body:richBody}),
 'offering-list':z.strictObject({title,description:richSummary}),
 'people-list':z.strictObject({title,description:richSummary}),
 'article-list':z.strictObject({title,description:richSummary}),
 faq:z.strictObject({title,description:richSummary,items:z.array(itemSchemas.faq)}),
 steps:z.strictObject({title,description:richSummary,items:z.array(itemSchemas.steps)}),
 cta:z.strictObject({title,description:richSummary,link:linkSchema}),
});

export const sectionDefinitions = Object.freeze(SECTION_TYPES.map(type=>Object.freeze({
 type, nativeName:type.replaceAll('-','_'), copySchema:sectionCopySchemas[type], variants:Object.freeze(type==='faq'?['default','expanded']:type==='steps'?['default','cards']:['default']),
 referenceFields:itemSchemas[type]?{items:z.array(z.strictObject({id:itemId}))}:{},
 defaultReference:()=>itemSchemas[type]?{items:[]}:{},
 richFields:Object.freeze([...(type==='rich-text'?[{path:['body'],inline:false}]:[{path:['description'],inline:true}]),...(itemSchemas[type]?[{path:['items','*',type==='faq'?'answer':'body'],inline:false}]:[])]),
 ...(itemSchemas[type]?{itemCopySchema:itemSchemas[type],defaultItemCopy:()=>type==='faq'?{question:'New question',answer:'New answer'}:{title:'New step',body:'Describe this step'}}:{}),
 defaultCopy:()=>({title:'New section',...(type==='rich-text'?{body:''}:{description:''}),...(itemSchemas[type]?{items:[]}:{}),...(type==='cta'?{link:{label:'Contact us',href:'/contact'}}:{})}),
})));
