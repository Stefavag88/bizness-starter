import {projectDomains} from './domain-publication.mjs';
import {getDisabledDomainPages} from './domain-registry.mjs';
import {sectionDefinitions,sectionEnabled} from './section-registry.mjs';
import { activeRecords, requiredPage, joinPath } from './publication.mjs';

export function localizeContent(source,locale,project,registry) {
 if(!project.languages.some(l=>l.code===locale))throw new Error('Unconfigured locale: '+locale);
 const {translations,...baseSettings}=source.settings;
 const translation=translations[locale];
 if(locale!==project.locale&&!translation)throw new Error('Missing required settings translation for locale '+locale);
 const settings=structuredClone(locale===project.locale?baseSettings:{
  brand:{...baseSettings.brand,...translation.brand},legal:{...baseSettings.legal,...translation.legal},
  contact:{...baseSettings.contact,...translation.contact},social:baseSettings.social,
  navigation:baseSettings.navigation.map(item=>({...item,label:translation.navigation[item.pageId]})),
 });
 const disabledIds=new Set(getDisabledDomainPages(project,registry).map(page=>page.contentId));
 source={...source,pages:source.pages.filter(page=>!disabledIds.has(page.contentId))};
 const active=activeRecords(source,locale,project);
 for(const page of source.pages) {
  if(requiredPage(page,project)&&!active.pages.some(p=>p.contentId===page.contentId))
   throw new Error('Required page '+page.contentId+' has no published translation for locale '+locale);
 }
 const availableIds=new Set(active.pages.map(p=>p.contentId));
 settings.navigation=settings.navigation.filter(item=>availableIds.has(item.pageId));
 const indexSlug=template=>source.pages.find(p=>p._template===template)?.slug;
 const pathFor=(kind,record,language)=>kind==='page'?joinPath(language,record.slug):kind==='person'?joinPath(language,'people',record.slug):joinPath(language,indexSlug(kind==='offering'?'offerings':'insights'),record.slug);
 const availability=new Map(project.languages.map(l=>[l.code,activeRecords(source,l.code,project)]));
 const routeRecord=(kind,record)=>({
  ...record,path:pathFor(kind,record,locale),
  alternates:project.languages.filter(l=>availability.get(l.code)[kind==='page'?'pages':kind==='offering'?'offerings':kind==='person'?'people':'articles'].some(r=>r.contentId===record.contentId))
   .map(l=>({locale:l.code,path:pathFor(kind,record,l.code)})),
 });
 const localizedPages=language=>availability.get(language).pages.map(page=>{
  const {copy,sections,...rest}=page;
  return {...routeRecord('page',rest),path:pathFor('page',rest,language),sections:sections.filter(s=>s.enabled && copy.sections[s.id]!==undefined && sectionEnabled(sectionDefinitions.find(d=>d.type===s._template),project))
   .map(section=>{const localized=structuredClone(copy.sections[section.id]);if(section.items)localized.items=section.items.map(item=>localized.items.find(entry=>entry.id===item.id));return {...section,copy:localized};})};
 });
 const pagesByLocale=new Map(project.languages.map(language=>[language.code,localizedPages(language.code)]));
 const pages=pagesByLocale.get(locale);
 const domains=projectDomains(source,locale,project,pagesByLocale,registry);
 return {locale,settings,pages,domains,offerings:active.offerings.map(r=>routeRecord('offering',r)),people:active.people.map(r=>routeRecord('person',r)),articles:active.articles.map(r=>routeRecord('article',r)),
  feedPath:project.articles?joinPath(locale,'feed.xml').replace(/\/$/,''):null};
}
