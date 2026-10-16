import { z } from 'zod';
import { isSafeLink, isSafeMarkdown } from './rich-text.mjs';
export const LIMITS = Object.freeze({title:200,seoDescription:300,description:10000,body:100000});
export const SECTION_TYPES = Object.freeze(['hero','rich-text','offering-list','people-list','article-list','cta']);
const title = z.string().trim().min(1).max(LIMITS.title);
const richSummary = z.string().max(LIMITS.description).refine(value=>isSafeMarkdown(value,true),'Description allows safe inline emphasis and links only');
const richBody = z.string().max(LIMITS.body).refine(value=>isSafeMarkdown(value),'Body allows safe Markdown with H2/H3 only');
export const linkSchema = z.strictObject({label:title,href:z.string().refine(isSafeLink,'Link must use a safe supported URL')});
export const sectionCopySchemas = Object.freeze({
 hero:z.strictObject({title,description:richSummary,link:linkSchema.optional()}),
 'rich-text':z.strictObject({title,body:richBody}),
 'offering-list':z.strictObject({title,description:richSummary}),
 'people-list':z.strictObject({title,description:richSummary}),
 'article-list':z.strictObject({title,description:richSummary}),
 cta:z.strictObject({title,description:richSummary,link:linkSchema}),
});

export const sectionDefinitions = Object.freeze(SECTION_TYPES.map(type=>Object.freeze({
 type, nativeName:type.replaceAll('-','_'), copySchema:sectionCopySchemas[type], variants:Object.freeze(['default']),
 defaultCopy:()=>({title:'New section',...(type==='rich-text'?{body:''}:{description:''}),...(type==='cta'?{link:{label:'Contact us',href:'/contact'}}:{})}),
})));
