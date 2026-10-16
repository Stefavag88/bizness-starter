import { serializeMDX } from '@tinacms/mdx';
import type { ProjectConfig } from '../packages/config/project.mjs';
import { settingsSchema,pageSchema,offeringSchema,personSchema,articleSchema,campaignSchema } from '../packages/content/schemas.mjs';
import { isSafeLink } from '../packages/content/rich-text.mjs';
import { normalizeNativeLocales } from '../packages/content/native-locales.mjs';
import { validateCatalog } from '../packages/content/catalog.mjs';
import { normalizePageDocument, normalizeSettingsDocument } from '../packages/content/documents.mjs';
import { sectionDefinitions } from '../packages/content/section-registry.mjs';
const schemas={settings:settingsSchema,page:pageSchema,offering:offeringSchema,person:personSchema,article:articleSchema,campaign:campaignSchema};
function markdown(value:unknown,inline:boolean):string {
 if(typeof value==='string')return value;
 function visit(node:any,depth=0):void {
  if(!node||typeof node!=='object'||depth>40)throw Error('Invalid rich text node');
  if(typeof node.text==='string'){if((node.type!==undefined&&node.type!=='text')||Object.keys(node).some(k=>!['type','text','bold','italic'].includes(k)))throw Error('Unsupported rich text mark');return;}
  const allowed=inline?['root','p','a','break']:['root','p','a','break','h2','h3','ul','ol','li','lic','blockquote'];
  if(!allowed.includes(node.type)||!Array.isArray(node.children))throw Error('Unsupported rich text node');
  if(node.type==='a'&&(node.title!=null&&typeof node.title!=='string'))throw Error('Invalid link title');
  if(node.type==='a'&&!isSafeLink(node.url))throw Error('Unsafe rich text link');
  if(Object.keys(node).some(k=>!['type','children','url','id',...(node.type==='a'?['title']:[])].includes(k)))throw Error('Unsupported rich text attribute');
  node.children.forEach((child:any)=>visit(child,depth+1));
 }
 visit(value);if((value as any).type!=='root')throw Error('Rich text must have a root');
 const result=serializeMDX(value as Parameters<typeof serializeMDX>[0],{name:'body',type:'rich-text',templates:[]},url=>url);
 if(typeof result!=='string')throw Error('Rich text could not be serialized');return result;
}
export function nativeProjection(values:Record<string,unknown>,project:ProjectConfig):Record<string,any> {
 const copy:any=normalizeNativeLocales(values,project);
 if(copy._collection!=='page'&&copy._template===copy._collection)delete copy._template;
 delete copy._collection;
 function prose(record:any):void {
  if(!record||typeof record!=='object')return;
  for(const key of ['body','description'])if(Object.hasOwn(record,key))record[key]=markdown(record[key],key==='description');
  if(record.legal&&Object.hasOwn(record.legal,'notice'))record.legal.notice=markdown(record.legal.notice,false);
  if(record.copy?.sections)for(const section of Object.values(record.copy.sections))prose(section);
 }
 const sectionLists=[copy.sections,copy.copy?.sections,
  ...Object.values(copy.translations||{}).map((translation:any)=>translation.copy?.sections)];
 for(const list of sectionLists) {
  if(!Array.isArray(list))continue;
  for(const section of list) {
   const definition=sectionDefinitions.find(definition=>definition.nativeName===section._template);
   if(definition)section._template=definition.type;
  }
 }
 prose(copy);
 for(const translation of Object.values(copy.translations||{}))prose(translation);
 return copy;
}

// Only this internal helper performs format validation without existing-record protection.
function parseNative(values:Record<string,unknown>,kind:string,project:ProjectConfig):any {
 if(kind==='campaign'&&project.profile==='enquiries')throw Error('Campaign copy is disabled');
 const schema=schemas[kind as keyof typeof schemas];
 if(!schema)throw Error('Unknown collection');
 const projected=nativeProjection(values,project);
 if(kind==='page')return normalizePageDocument(projected);
 if(kind==='settings')return normalizeSettingsDocument(projected);
 return schema.parse(projected);
}

export function validateNativeSave(values:Record<string,unknown>,kind:string,project:ProjectConfig,currentPage?:unknown):void {
 const parsed=parseNative(values,kind,project);
 if(kind!=='page')return;
 if(!currentPage)throw Error('Current native page record is required to protect Foundation page identity/structure');
 const original=parseNative(currentPage as Record<string,unknown>,'page',project);
 if(parsed.contentId!==original.contentId||parsed.slug!==original.slug||parsed._template!==original._template||parsed.sections.length!==original.sections.length) {
  throw Error('Foundation page identity/structure is protected');
 }
 parsed.sections.forEach((section:any,index:number)=>{
  const old=original.sections[index];
  if(section.id!==old.id||section._template!==old._template||section.variant!==old.variant||(old._template==='hero'&&!section.enabled)) {
   throw Error('Foundation section structure is protected');
  }
 });
}

export function beforeSubmit(values:Record<string,unknown>,kind:string,project:ProjectConfig,currentPage?:unknown) {
 validateNativeSave(values,kind,project,currentPage);
 return values;
}

// Read the complete current data layer before validating the candidate catalog.
export async function validateCurrentSave(values:Record<string,unknown>,kind:string,project:ProjectConfig,cms:any,relativePath:string) {
 if(!relativePath||relativePath.includes('/')||relativePath.includes('\\')||!relativePath.endsWith('.json')) {
  throw Error('Foundation uses flat collection files; save documents directly in their collection folder.');
 }
 parseNative(values,kind,project);
 const source:any={pages:[],offerings:[],people:[],articles:[],campaigns:[],now:new Date().toISOString()};
 const target=(collection:string)=>collection==='page'?'pages':collection==='person'?'people':collection+'s';
 const collections=['settings','page','offering','person',...(project.articles?['article']:[]),...(project.profile==='enquiries'?[]:['campaign'])];
 for(const collection of collections) {
  let after:string|null=null;
  let more=true;
  let replaced=false;
  while(more) {
   const response:any=await cms.api.tina.request(`query Catalog($after:String){${collection}Connection(first:100,after:$after){edges{node{... on Document{_values _sys{relativePath}}}}pageInfo{hasNextPage endCursor}}}`,{variables:{after}});
   const result=response[collection+'Connection'];
   for(const edge of result.edges) {
    const matches=collection===kind&&edge.node._sys.relativePath===relativePath;
    if(matches) {
     replaced=true;
     // Match the persisted filename, never the candidate's editable identity or an old descriptor.
     validateNativeSave(values,kind,project,edge.node._values);
    }
    const record=parseNative(matches?values:edge.node._values,collection,project);
    if(collection==='settings')source.settings=record;
    else source[target(collection)].push(record);
   }
   more=result.pageInfo.hasNextPage;
   after=result.pageInfo.endCursor;
  }
  if(collection===kind&&!replaced&&kind==='page') {
   throw Error('Foundation existing page identity is protected; current native record was not found');
  }
  if(collection===kind&&!replaced&&kind!=='settings')source[target(collection)].push(parseNative(values,collection,project));
 }
 validateCatalog(source,project);
 return values;
}
