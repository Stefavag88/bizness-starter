import { z } from 'zod';
import { isSafeMarkdown } from './rich-text.mjs';
import { LIMITS, SECTION_TYPES, linkSchema, sectionCopySchemas, sectionDefinitions } from './section-registry.mjs';
export { LIMITS, SECTION_TYPES, linkSchema, sectionCopySchemas, sectionDefinitions } from './section-registry.mjs';
export const PAGE_TEMPLATES = Object.freeze(['home','about','contact','standard','offerings','insights']);
export const SURFACES = Object.freeze(['default','muted','accent']);
const title = z.string().trim().min(1).max(LIMITS.title);
const richSummary = z.string().max(LIMITS.description).refine(value=>isSafeMarkdown(value,true),'Description allows safe inline emphasis and links only');
const richBody = z.string().max(LIMITS.body).refine(value=>isSafeMarkdown(value),'Body allows safe Markdown with H2/H3 only');
const identifier = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
// Stable page-local IDs; kept GraphQL-safe for native authoring controls.
const fieldId = z.string().regex(/^[a-z][a-z0-9_]{0,79}$/);
const slug = z.string().regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$|^$/);
const seo = z.preprocess(value => value == null ? '' : value, z.string().trim().max(LIMITS.seoDescription));
const publication = {status:z.enum(['draft','published']),publishAt:z.iso.datetime({offset:true}).optional()};
const translations = schema => z.record(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),schema).default({});
export const metaSchema = z.strictObject({title,seoDescription:seo});
export const sectionSchema = z.discriminatedUnion('_template',sectionDefinitions.map(d=>z.strictObject({
 id:fieldId,_template:z.literal(d.type),variant:z.enum(d.variants),enabled:z.boolean().default(true),
 appearance:z.strictObject({surface:z.enum(SURFACES)}),...d.referenceFields,
})));
const copy = z.strictObject({sections:z.record(fieldId,z.unknown())});
const pageTranslation = z.strictObject({...publication,meta:metaSchema,copy});
export const pageSchema = z.strictObject({
 contentId:fieldId,_template:z.enum(PAGE_TEMPLATES),slug,...publication,meta:metaSchema,
 sections:z.array(sectionSchema).min(1),copy,translations:translations(pageTranslation),
}).superRefine((page,ctx)=>{
 const ids=new Set();
 for(const section of page.sections) {
  if(ids.has(section.id))ctx.addIssue({code:'custom',path:['sections'],message:'Duplicate section ID: '+section.id});
  ids.add(section.id);
  if(section.items){const itemIds=section.items.map(i=>i.id);if(new Set(itemIds).size!==itemIds.length)ctx.addIssue({code:'custom',path:['sections',page.sections.indexOf(section),'items'],message:'Duplicate item ID'});if(section.enabled&&!itemIds.length)ctx.addIssue({code:'custom',path:['sections',page.sections.indexOf(section),'items'],message:'Enabled sections require items'});}
 }
 const heroes=page.sections.filter(s=>s._template==='hero');
 if(heroes.length!==1 || !heroes[0].enabled)ctx.addIssue({code:'custom',path:['sections'],message:'Each template requires exactly one enabled hero/H1'});
 const validateCopy=(values,path,required)=>{
  for(const id of Object.keys(values))if(!ids.has(id))ctx.addIssue({code:'custom',path:[...path,id],message:'Stale section ID: '+id});
  for(const section of page.sections) {
   const value=values[section.id];
   if(value===undefined) {
    if(required || section._template==='hero')ctx.addIssue({code:'custom',path:[...path,section.id],message:'Missing section copy: '+section.id});
    continue;
   }
   if(section.items && Array.isArray(value.items)){const expected=section.items.map(i=>i.id),actual=value.items.map(i=>i.id);if(new Set(actual).size!==actual.length || actual.length!==expected.length || actual.some(id=>!expected.includes(id)))ctx.addIssue({code:'custom',path:[...path,section.id,'items'],message:'Item IDs must exactly match shared items'});}
   const parsed=sectionCopySchemas[section._template].safeParse(value);
   if(!parsed.success)for(const issue of parsed.error.issues)ctx.addIssue({...issue,path:[...path,section.id,...issue.path]});
  }
 };
 validateCopy(page.copy.sections,['copy','sections'],true);
 for(const [locale,translation] of Object.entries(page.translations))validateCopy(translation.copy.sections,['translations',locale,'copy','sections'],false);
});
const prose={title,description:richSummary,body:richBody,seoDescription:seo};
const editorial = extra => z.strictObject({
 contentId:identifier,slug:slug.refine(value=>value.length>0,'Editorial slug cannot be empty'),...publication,...prose,...extra.shared,
 translations:translations(z.strictObject({...publication,...prose,...extra.localized})),
});
export const offeringSchema=editorial({shared:{},localized:{}});
export const personSchema=editorial({shared:{role:title},localized:{role:title}});
const optionalId=z.preprocess(value=>value==null || (typeof value==='string'&&!value.trim())?undefined:value,identifier.optional());
const articleDates={publishAt:z.iso.datetime({offset:true}),updatedAt:z.iso.datetime({offset:true}).optional()};
export const articleSchema=editorial({shared:{authorId:optionalId,offeringId:optionalId,...articleDates},localized:articleDates}).superRefine((article,ctx)=>{
 for(const [value,path] of [[article,[]],...Object.entries(article.translations).map(([locale,translation])=>[translation,['translations',locale]])])
  if(value.updatedAt&&Date.parse(value.updatedAt)<Date.parse(value.publishAt))ctx.addIssue({code:'custom',path:[...path,'updatedAt'],message:'updatedAt must not precede publishAt'});
});
const settingsCopy = {
 brand:z.strictObject({name:title,tagline:z.string().max(300)}),
 legal:z.strictObject({businessName:title,privacyVersion:z.string().trim().min(1).max(80),notice:richBody}),
 contact:z.strictObject({email:z.email(),phone:z.string().max(100),address:z.string().max(1000)}),
 navigation:z.array(z.strictObject({label:title,pageId:fieldId})),
};
const localizedSettingsCopy = {
 brand:z.strictObject({tagline:z.string().max(300)}),
 legal:z.strictObject({notice:richBody}),
 contact:z.strictObject({address:z.string().max(1000)}),
 navigation:z.record(fieldId,title),
};
export const settingsSchema=z.strictObject({...settingsCopy,translations:translations(z.strictObject(localizedSettingsCopy))}).superRefine((settings,ctx)=>{
 const ids=settings.navigation.map(n=>n.pageId);
 if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:['navigation'],message:'Navigation page IDs must be unique'});
 for(const [locale,translation] of Object.entries(settings.translations)) {
  for(const id of ids)if(!Object.hasOwn(translation.navigation,id))ctx.addIssue({code:'custom',path:['translations',locale,'navigation',id],message:'Missing translated navigation label'});
  for(const id of Object.keys(translation.navigation))if(!ids.includes(id))ctx.addIssue({code:'custom',path:['translations',locale,'navigation',id],message:'Stale translated navigation page ID'});
 }
});

// Draft copy only. Delivery and campaign lifecycle live in the backend.
export const campaignSchema=z.strictObject({contentId:identifier,subject:z.string().refine(value=>!/[\r\n]/.test(value),'Subject cannot contain CR/LF').trim().min(1).max(150),intro:z.string().max(2000),articleId:optionalId,interest:z.string().min(1).max(40)});
