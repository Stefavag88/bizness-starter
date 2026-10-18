// Browser-safe static registrations. Domain modules are added here by developers.
import {roomsDomain} from '../domains/rooms/contract.mjs';
const identifier=/^[a-z][a-z0-9_-]{0,63}$/;
const nativeIdentifier=/^[a-z][a-z0-9_]{0,63}$/;
const fieldIdentifier=/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;
const filename=/^[a-z][a-z0-9_-]{0,63}\.json$/;
const builtins=new Set(['settings','page','pages','offering','offerings','person','people','article','articles','campaign','campaigns']);
const pageTemplates=new Set(['home','about','contact','standard','offerings','insights']);
const pageFiles=new Set(['home.json','about.json','contact.json','privacy.json','services.json','insights.json']);
const pageIds=new Set(['home','about','contact','privacy','services','insights']);
function checkIdentifier(value,label,pattern=identifier) {
 if(typeof value!=='string'||!pattern.test(value)||['__proto__','constructor','prototype'].includes(value))throw Error('Invalid domain '+label+': '+value);
}
function validateDefinition(definition) {
 if(!definition||typeof definition!=='object')throw Error('Invalid domain definition');
 for(const field of ['key','collectionName','directory']) {
  checkIdentifier(definition[field],field,field==='collectionName'?nativeIdentifier:identifier);
  if(builtins.has(definition[field]))throw Error('Domain '+field+' collides with built-in collection: '+definition[field]);
 }
 if(!definition.schema||typeof definition.schema.parse!=='function')throw Error('Domain schema must provide parse');
 for(const callback of ['enabled','projectRecord','routePath','validate'])if(typeof definition[callback]!=='function')throw Error('Domain '+callback+' must be a function');
 if(typeof definition.enquiry!=='boolean'||!Array.isArray(definition.ownedPages)||!Array.isArray(definition.richFields))throw Error('Invalid domain ownedPages, richFields or enquiry');
 for(const page of definition.ownedPages) {
  if(!page||!filename.test(page.filename))throw Error('Invalid owned Page filename: '+page?.filename);
  checkIdentifier(page.template,'Page template');checkIdentifier(page.contentId,'Page contentId');
  if(pageFiles.has(page.filename)||pageTemplates.has(page.template)||pageIds.has(page.contentId))throw Error('Domain cannot own a built-in Page: '+page.filename);
 }
 for(const field of definition.richFields)if(!field||!Array.isArray(field.path)||!field.path.length||!field.path.every(part=>typeof part==='string'&&(part==='*'||fieldIdentifier.test(part))&&!['__proto__','constructor','prototype'].includes(part))||typeof field.inline!=='boolean')throw Error('Invalid domain richFields path');
}
export function defineDomain(definition) {
 validateDefinition(definition);
 return Object.freeze({...definition,
  ownedPages:Object.freeze(definition.ownedPages.map(page=>Object.freeze({...page}))),
  richFields:Object.freeze(definition.richFields.map(field=>Object.freeze({...field,path:Object.freeze([...field.path])}))),
 });
}
export function createDomainRegistry(definitions) {
 const seen=Object.fromEntries(['key','collectionName','directory','filename','template','contentId'].map(field=>[field,new Set()]));
 const claim=(field,value)=>{if(seen[field].has(value))throw Error('Duplicate domain '+field+': '+value);seen[field].add(value);};
 const registered=definitions.map(input=>{
  const definition=defineDomain(input);
  for(const field of ['key','collectionName','directory'])claim(field,definition[field]);
  for(const page of definition.ownedPages)for(const field of ['filename','template','contentId'])claim(field,page[field]);
  return definition;
 });
 return Object.freeze({definitions:Object.freeze(registered)});
}
export const domainRegistry=createDomainRegistry([roomsDomain]);
export function getActiveDomains(project,registry=domainRegistry) {return registry.definitions.filter(definition=>definition.enabled(project));}
export function getDisabledDomainPages(project,registry=domainRegistry) {return registry.definitions.filter(definition=>!definition.enabled(project)).flatMap(definition=>definition.ownedPages);}
