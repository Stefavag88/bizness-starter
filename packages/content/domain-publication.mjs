import {domainRegistry,getActiveDomains} from './domain-registry.mjs';

/** One projection per configured locale, using already published/localized base Pages. */
export function projectDomains(source,locale,project,pagesByLocale,registry=domainRegistry) {
 const domains={};
 for(const definition of getActiveDomains(project,registry)) {
  const availability=new Map(project.languages.map(language=>{
   const context={project,locale:language.code,now:source.now,pages:pagesByLocale.get(language.code)};
   const records=(source.domains?.[definition.key]??[]).map(record=>definition.projectRecord(structuredClone(record),context)).filter(record=>record!==null);
   for(const record of records)if(!record||typeof record.contentId!=='string'||typeof record.title!=='string')throw Error('Domain '+definition.key+' must project contentId and title');
   return [language.code,records.map(record=>({...record,path:domainPath(definition,record,context)}))];
  }));
  domains[definition.key]=availability.get(locale).map(record=>({...record,alternates:project.languages.flatMap(language=>{
   const alternate=availability.get(language.code).find(candidate=>candidate.contentId===record.contentId);
   return alternate?[{locale:language.code,path:alternate.path}]:[];
  })}));
 }
 return domains;
}
function domainPath(definition,record,context) {
 const path=definition.routePath(record,context);
 const parts=typeof path==='string'?path.split('/'):[];
 if(parts[1]!==context.locale||parts.length<3||parts.slice(2).some(part=>!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(part)))throw Error('Domain '+definition.key+' returned an invalid public path: '+path);
 if(['404','api','cms','admin','design-system','newsletter'].includes(parts[2])||context.project.languages.some(language=>language.code.toLowerCase()===parts[2].toLowerCase()))throw Error('Domain '+definition.key+' returned a reserved public path: '+path);
 return path;
}
export function getDomainRecords(content,key,registry=domainRegistry) {
 if(!registry.definitions.some(definition=>definition.key===key))throw Error('Unregistered domain key: '+key);
 return content.domains?.[key]??[];
}
/** Validate all three declared identities together, including attempts to occupy a reserved file. */
export function assertOwnedPageIdentity(candidate,filename,registry=domainRegistry) {
 for(const page of registry.definitions.flatMap(definition=>definition.ownedPages)) {
  if(filename===page.filename||candidate._template===page.template||candidate.contentId===page.contentId) {
   if((filename!==undefined&&filename!==page.filename)||candidate._template!==page.template||candidate.contentId!==page.contentId)throw Error('Declared owned Page requires '+page.filename+', template '+page.template+' and contentId '+page.contentId);
  }
 }
}

/** Heterogeneous framework adapter; domain consumers use the keyed API above. */
export function getDomainRouteRecord(content,domain,contentId,registry=domainRegistry) {
 const record=getDomainRecords(content,domain,registry).find(record=>record.contentId===contentId);
 if(!record)throw Error('Public domain record not found: '+domain+'/'+contentId);
 return record;
}
