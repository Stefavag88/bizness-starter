import {it,expect} from 'vitest';
import {offeringSchema} from '../packages/content/schemas.mjs';
import {createDomainRegistry} from '../packages/content/domain-registry.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {getDomainRecords} from '../packages/content/domain-publication.mjs';
import {localizedValue,isPublished,joinPath} from '../packages/content/publication.mjs';
import {publicRoutes} from '../packages/content/routes.mjs';
import {validateCatalog} from '../packages/content/catalog.mjs';
import {readContent} from '../packages/content/read.mjs';
import {fixture,project,editorial,normalizedPage} from './fixtures/content/factory';
import type {Offering,LocalizedOffering} from '../packages/content/types';
import type {DomainDefinition} from '../packages/content/domain-contracts';
declare module '../packages/content/domain-contracts' {interface DomainRecordMap{workshops:Offering} interface LocalizedDomainRecordMap{workshops:LocalizedOffering}}
export const workshopDomain=(enabled=true):DomainDefinition<Offering,LocalizedOffering>=>({
 key:'workshops',collectionName:'workshop',directory:'workshops',schema:offeringSchema,
 ownedPages:[{filename:'workshops.json',template:'workshops',contentId:'workshop_index'}],enabled:()=>enabled,
 richFields:[{path:['body'],inline:false},{path:['description'],inline:true}],enquiry:true,
 projectRecord(record,context){const value=localizedValue(record,context.locale,context.project);return context.pages.some(p=>p.contentId==='workshop_index')&&isPublished(value,context.now)?value:null;},
 routePath(record,context){return joinPath(context.locale,context.pages.find(p=>p.contentId==='workshop_index')!.slug,record.slug);},validate:()=>{},
});
export function sample(){const f=fixture(),source=readContent(f.root,project,{now:new Date('2026-01-01T00:00:00Z')});source.pages.push(normalizedPage('workshop_index','workshops','learn') as any);source.domains.workshops=[offeringSchema.parse(editorial('offering','workshop-one'))];return source;}
const registry=createDomainRegistry([workshopDomain()]);
it('projects a typed registered domain with reciprocal alternatives at the captured source clock',()=>{
 const source=sample(),en=localizeContent(source,'en',project,registry),el=localizeContent(source,'el',project,registry);
 const records=getDomainRecords(en,'workshops',registry);expect(records[0].title).toBe('A sample');expect(records[0].path).toBe('/en/learn/workshop-one');
 expect(records[0].alternates).toEqual([{locale:'en',path:'/en/learn/workshop-one'},{locale:'el',path:'/el/learn/workshop-one'}]);
 expect(getDomainRecords(el,'workshops',registry)[0].alternates).toEqual(records[0].alternates);
 expect(publicRoutes(en).find(r=>r.kind==='domain')).toEqual({kind:'domain',domain:'workshops',contentId:'workshop-one',locale:'en',path:'/en/learn/workshop-one',alternates:records[0].alternates});
});
it('requires localized index publication and never falls back for missing record translation',()=>{
 const source=sample();source.pages.at(-1)!.translations.el.status='draft';
 expect(getDomainRecords(localizeContent(source,'el',project,registry),'workshops',registry)).toEqual([]);
 expect(getDomainRecords(localizeContent(source,'en',project,registry),'workshops',registry)[0].alternates).toEqual([{locale:'en',path:'/en/learn/workshop-one'}]);
 source.pages.at(-1)!.translations.el.status='published';source.domains.workshops![0].translations={};
 expect(getDomainRecords(localizeContent(source,'el',project,registry),'workshops',registry)).toEqual([]);
});
it('uses the same clock for domain and index schedules',()=>{
 const source=sample();source.domains.workshops![0].publishAt='2026-01-01T00:00:01Z';expect(localizeContent(source,'en',project,registry).domains.workshops).toEqual([]);
 source.domains.workshops![0].publishAt=source.now;source.pages.at(-1)!.publishAt='2026-01-01T00:00:01Z';expect(localizeContent(source,'en',project,registry).domains.workshops).toEqual([]);
});
it('returns empty registered absent/disabled data and rejects unregistered keys',()=>{
 const source=sample(),off=createDomainRegistry([workshopDomain(false)]),content=localizeContent(source,'en',project,off);
 expect(getDomainRecords(content,'workshops',off)).toEqual([]);expect(()=>getDomainRecords(content,'missing' as any,registry)).toThrow(/registered/);
});
it('includes domains in global IDs, translation locales, reserved paths and active URL collisions',()=>{
 const source=sample();source.domains.workshops![0].contentId='home';expect(()=>validateCatalog(source,project,registry)).toThrow(/Duplicate contentId/);
 source.domains.workshops![0].contentId='workshop-one';source.domains.workshops![0].translations.en=source.domains.workshops![0].translations.el;expect(()=>validateCatalog(source,project,registry)).toThrow(/unexpected translation/);
 delete source.domains.workshops![0].translations.en;source.domains.workshops![0].slug='api';expect(()=>validateCatalog(source,project,registry)).toThrow(/reserved/);
 source.domains.workshops![0].slug='workshop-one';source.pages.push(normalizedPage('collision','standard','learn/workshop-one') as any);expect(()=>validateCatalog(source,project,registry)).toThrow(/Duplicate active route/);
});
it('validates domain relationships with complete global IDs and preserves legacy output',()=>{
 const source=sample();let called=false;const reg=createDomainRegistry([{...workshopDomain(),validate(records,context){expect(context.recordIds.has('home')).toBe(true);expect(context.recordIds.has('workshop-one')).toBe(true);expect(context.now).toBe('2026-01-01T00:00:00.000Z');called=records.length===1;}}]);
 validateCatalog(source,project,reg);expect(called).toBe(true);
 const baseline=localizeContent({...source,domains:{},pages:source.pages.slice(0,-1)},'en',project);expect(publicRoutes(baseline).map(r=>r.path)).toEqual(['/en/about','/en/contact','/en','/en/insights','/en/privacy','/en/services','/en/services/sample','/en/insights/article','/en/people/person']);
});
it('allows declared disabled navigation IDs while still rejecting unknown destinations',()=>{
 const source=sample(),off=createDomainRegistry([workshopDomain(false)]);source.pages.pop();source.settings.navigation.push({pageId:'workshop_index',label:'Learn'});source.settings.translations.el.navigation.workshop_index='Μάθετε';
 expect(()=>validateCatalog(source,project,off)).not.toThrow();expect(localizeContent(source,'en',project,off).settings.navigation.some(n=>n.pageId==='workshop_index')).toBe(false);
 source.settings.navigation.push({pageId:'unknown',label:'Unknown'});expect(()=>validateCatalog(source,project,off)).toThrow(/missing pageId unknown/);
});

it('rejects overlapping domain index prefixes and built-in detail-prefix ownership even for drafts',()=>{
 const source=sample();source.pages.at(-1)!.status='draft';source.pages.at(-1)!.slug='people';expect(()=>validateCatalog(source,project,registry)).toThrow(/prefix/);
 source.pages.at(-1)!.slug='learn';source.pages.push({...normalizedPage('other_index','sessions','learn/advanced'),status:'draft'} as any);
 const other={...workshopDomain(),key:'sessions',collectionName:'session',directory:'sessions',ownedPages:[{filename:'sessions.json',template:'sessions',contentId:'other_index'}]};
 expect(()=>validateCatalog(source,project,createDomainRegistry([workshopDomain(),other]))).toThrow(/prefix/);
});
it('rejects callback routes into system or configured locale prefixes',()=>{
 const source=sample();for(const prefix of ['api','el']){const reg=createDomainRegistry([{...workshopDomain(),routePath:(_record,context)=>'/'+context.locale+'/'+prefix+'/one'}]);expect(()=>validateCatalog(source,project,reg)).toThrow(/reserved/);}
});
