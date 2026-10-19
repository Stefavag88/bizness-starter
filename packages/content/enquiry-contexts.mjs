import {domainRegistry} from './domain-registry.mjs';
import {getDomainRecords} from './domain-publication.mjs';

/** Content is already canonical, localized and publication-filtered. */
export function getEnquiryContexts(content) {
 const contexts=content.offerings.map(record=>({id:record.contentId,kind:'offering',title:record.title,path:record.path}));
 for(const definition of domainRegistry.definitions)if(definition.enquiry) {
  for(const record of getDomainRecords(content,definition.key))contexts.push({id:record.contentId,kind:definition.key,title:record.title,path:record.path});
 }
 const ids=new Set();
 for(const context of contexts) {
  if(ids.has(context.id))throw Error('Duplicate enquiry context: '+context.id);
  ids.add(context.id);
 }
 return contexts;
}

/** Acceptance is the locale union; the request supplies no trusted locale. */
export function getAcceptedEnquiryContexts(contents) {
 const accepted=new Map();
 for(const content of contents)for(const {id,kind} of getEnquiryContexts(content)) {
  if(accepted.has(id)&&accepted.get(id).kind!==kind)throw Error('Duplicate enquiry context: '+id);
  if(!accepted.has(id))accepted.set(id,{id,kind});
 }
 return [...accepted.values()];
}
