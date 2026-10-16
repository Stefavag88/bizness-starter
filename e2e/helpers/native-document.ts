import {realpathSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
export type Field={name:string;nameOverride?:string;type:string;fields?:Field[];templates?:Template[];list?:boolean;[key:string]:any};
type Template={name:string;nameOverride?:string;fields:Field[]};
export type Schema={collections:{name:string;path:string;fields?:Field[];templates?:Template[]}[]};
export type Mutation={operation:'create'|'update';collection:string;relativePath:string;params:Record<string,any>};
let serializer:Promise<any>|undefined;
function nativeSerializer(){
 if(!serializer){const require=createRequire(import.meta.url);const backend=createRequire(realpathSync(resolve(dirname(require.resolve('@tinacms/cli')),'../../graphql/dist/index.js')));serializer=import(pathToFileURL(backend.resolve('@tinacms/mdx')).href);}
 return serializer;
}
export function nativeDocumentPath(mutation:Mutation,schema:Schema){
 const collection=schema.collections.find(c=>c.name===mutation.collection);
 // Only createDocument's single wire prefix is permitted; never normalize a filesystem path.
 const relative=mutation.operation==='create'&&mutation.relativePath.startsWith('/')?mutation.relativePath.slice(1):mutation.relativePath;
 if(!collection||!relative||!/^[^/\\:]+\.json$/.test(relative)||relative.includes('..'))throw Error('Mutation source does not match a flat collection path');
 return resolve(collection.path,relative);
}
function selectTemplate(values:Record<string,any>,templates:Template[]){
 const keys=Object.keys(values);const template=keys.length===1&&templates.find(t=>t.name===keys[0]);
 if(!template)throw Error('Unsupported native mutation template');
 return {template,body:values[template.name]};
}
async function fields(values:Record<string,any>,schema:Field[]):Promise<Record<string,any>>{
 const result:Record<string,any>={};
 for(const [name,value] of Object.entries(values)){
  const field=schema.find(f=>f.name===name);if(!field)throw Error('Unknown native mutation field: '+name);
  const key=field.nameOverride||name;
  if(Array.isArray(value)&&!value.length){result[key]=[];continue;}
  if(field.type==='rich-text'){const {serializeMDX}=await nativeSerializer();result[key]=serializeMDX(value,field,(url:string)=>url);}
  else if(field.type==='object'){
   const item=async(v:Record<string,any>)=>{if(field.templates){const {template,body}=selectTemplate(v,field.templates);return {...await fields(body,template.fields),_template:template.nameOverride||template.name};}if(!field.fields)throw Error('Missing native mutation schema');return fields(v,field.fields);};
   result[key]=field.list?await Promise.all(value.map(item)):await item(value);
  }else if(field.type==='datetime'){const date=new Date(value);if(Number.isNaN(date.getTime()))throw Error('Invalid native datetime: '+name);result[key]=date.toISOString();}
  else if(['string','number','boolean','image','reference'].includes(field.type))result[key]=structuredClone(value);
  else throw Error('Unsupported native serialization field: '+name);
 }
 return JSON.parse(JSON.stringify(result));
}
export async function expectedNativeDocument(mutation:Mutation,schema:Schema,prior:Record<string,any>={}):Promise<Record<string,unknown>>{
 nativeDocumentPath(mutation,schema);
 const collection=schema.collections.find(c=>c.name===mutation.collection)!;
 let body=mutation.params[collection.name];if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Missing native mutation record');
 let selected=collection.fields,templateName:string|undefined;
 if(collection.templates){const {template,body:record}=selectTemplate(body,collection.templates);selected=template.fields;templateName=template.nameOverride||template.name;body=record;}
 if(!selected)throw Error('Missing native mutation schema');
 if(prior._template&&prior._template!==templateName)throw Error('Mutation template does not match the source');
 const reserved=['_template','_collection','_relativePath','_keepTemplateKey','_id','$_body'];
 const legacy=mutation.operation==='update'?Object.fromEntries(Object.entries(prior).filter(([name])=>!reserved.includes(name)&&!selected!.some(f=>(f.nameOverride||f.name)===name))):{};
 return {...legacy,...await fields(body,selected),...(templateName?{_template:templateName}:{})};
}
