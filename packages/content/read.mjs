import { getActiveDomains,getDisabledDomainPages } from './domain-registry.mjs';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { offeringSchema,personSchema,articleSchema,campaignSchema } from './schemas.mjs';
import { normalizePageDocument, normalizeSettingsDocument } from './documents.mjs';
import { normalizeNativeLocales } from './native-locales.mjs';
import { validateCatalog } from './catalog.mjs';

function json(file,schema,project) {
 try {return (typeof schema==='function'?schema:value=>schema.parse(value))(normalizeNativeLocales(JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,'')),project));}
 catch(error){throw new Error(file+': '+error.message,{cause:error});}
}
function flatFiles(folder) {
 const entries=readdirSync(folder,{withFileTypes:true});
 const nested=entries.find(entry=>entry.isDirectory());
 if(nested)throw Error('Nested content is unsupported in Foundation: '+join(folder,nested.name)+'. Move JSON documents directly into the collection folder (flat files).');
 return entries.filter(entry=>entry.isFile()&&entry.name.endsWith('.json')).map(entry=>entry.name).sort();
}
export function readContent(root,project,options={}) {
 const directory=resolve(root,'content');
 const now=options.now??new Date();
 if(!Number.isFinite(now.getTime()))throw new Error('Invalid publication clock');
 const excludedPages=new Set(getDisabledDomainPages(project,options.registry).map(page=>page.filename));
 if(!project.articles)excludedPages.add('insights.json');
 const readFolder=(name,schema)=>{
  const folder=join(directory,name);
  if(!existsSync(folder))return [];
  return flatFiles(folder)
   .filter(file=>name!=='pages'||!excludedPages.has(file))
   .map(file=>json(join(folder,file),schema,project));
 };
 flatFiles(join(directory,'settings'));
 const source={
  settings:json(join(directory,'settings/site.json'),normalizeSettingsDocument,project),
  pages:readFolder('pages',normalizePageDocument).filter(p=>project.articles||p._template!=='insights'),
  offerings:readFolder('offerings',offeringSchema),people:readFolder('people',personSchema),
  campaigns:project.profile==='enquiries'?[]:readFolder('campaigns',campaignSchema),
  articles:project.articles?readFolder('articles',articleSchema):[],
  domains:Object.fromEntries(getActiveDomains(project,options.registry).map(domain=>[domain.key,readFolder(domain.directory,domain.schema)])),now:now.toISOString(),
 };
 validateCatalog(source,project,options.registry);
 return source;
}
