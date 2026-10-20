import {it,expect} from 'vitest';
import {roomsDomain} from '../packages/domains/rooms/contract.mjs';
import {projectDomains} from '../packages/content/domain-publication.mjs';
import {createDomainRegistry} from '../packages/content/domain-registry.mjs';
import {project} from './fixtures/content/factory';
import {room} from './fixtures/content/room';
it('requires published localized index and room, joins by ID and supplies generic alternates',()=>{
 const p={...project,modules:{...project.modules,rooms:true}},now='2026-10-18T00:00:00Z';const index:any={contentId:'rooms',_template:'rooms',slug:'rooms',status:'published'};
 const pages=new Map([['en',[index]],['el',[index]]]);const source:any={now,domains:{rooms:[room()]}};
 const get=()=>projectDomains(source,'el',p,pages).rooms!;
 expect(get()[0].path).toBe('/el/rooms/suite');expect(get()[0].images[0].alt).toBe('Παράθυρο');expect(get()[0].alternates).toHaveLength(2);
 pages.set('el',[]);expect(get()).toEqual([]);pages.set('el',[{...index,status:'draft'}]);expect(get()).toEqual([]);pages.set('el',[{...index,publishAt:'2027-01-01T00:00:00Z'}]);expect(get()).toEqual([]);pages.set('el',[index]);
 source.domains.rooms[0].translations.el.publishAt='2027-01-01T00:00:00Z';expect(get()).toEqual([]);
 delete source.domains.rooms[0].translations.el;expect(get()).toEqual([]);
 expect(projectDomains(source,'en',{...p,modules:{...project.modules,rooms:false}},pages)).toEqual({});
 const reserved={...room(),slug:'admin'};expect(()=>roomsDomain.validate([reserved as any],{project:p,now,pages:[],recordIds:new Set()})).toThrow(/reserved/i);
});

import {fixture} from './fixtures/content/factory';
import {readContent} from '../packages/content/read.mjs';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
it('excludes actual dormant Rooms files and owned index before parsing',()=>{
 const f=fixture();mkdirSync(join(f.root,'content/rooms'));writeFileSync(join(f.root,'content/rooms/broken.json'),'{broken');writeFileSync(join(f.root,'content/pages/rooms.json'),'{broken index');
 expect(readContent(f.root,project).domains).toEqual({});expect(readFileSync(join(f.root,'content/pages/rooms.json'),'utf8')).toBe('{broken index');expect(()=>readContent(f.root,{...project,modules:{...project.modules,rooms:true}})).toThrow();
});
it('joins localized image copy in shared order rather than localized array position',()=>{
 const r:any=room();r.images.push({id:'bath',media:{src:'/uploads/bath.png',crop:'center'}});r.imageCopy.push({id:'bath',alt:'Bath'});r.translations.el.imageCopy.unshift({id:'bath',alt:'Μπάνιο'});
 const p={...project,modules:{...project.modules,rooms:true}},pages:any=[{contentId:'rooms',_template:'rooms',slug:'rooms',status:'published'}];const result=roomsDomain.projectRecord(r,{project:p,locale:'el',now:'2026-10-18T00:00:00Z',pages})!;expect(result.images.map(i=>i.alt)).toEqual(['Παράθυρο','Μπάνιο']);
});

import {isPublished} from '../packages/content/publication.mjs';
it.each(['en','el'])('keeps %s future schedule independent from the immediately published other locale',scheduledLocale=>{
 const p={...project,modules:{...project.modules,rooms:true}},now='2026-10-18T00:00:00Z',future='2027-01-01T00:00:00Z';
 const record:any=room(),index:any={contentId:'rooms',_template:'rooms',slug:'rooms',status:'published'};
 (scheduledLocale==='en'?record:record.translations.el).publishAt=future;
 const immediateLocale=scheduledLocale==='en'?'el':'en',pages=new Map([['en',[index]],['el',[index]]]),source:any={now,domains:{rooms:[record]}};
 const immediate=projectDomains(source,immediateLocale,p,pages).rooms!;
 expect(immediate).toHaveLength(1);expect(immediate[0].publishAt).toBeUndefined();expect(isPublished(immediate[0],now)).toBe(true);
 expect(immediate[0].path).toBe('/'+immediateLocale+'/rooms/suite');expect(immediate[0].alternates).toEqual([{locale:immediateLocale,path:'/'+immediateLocale+'/rooms/suite'}]);
 expect(projectDomains(source,scheduledLocale,p,pages).rooms).toEqual([]);
 const later={...source,now:future};const scheduled=projectDomains(later,scheduledLocale,p,pages).rooms!;
 expect(scheduled).toHaveLength(1);expect(scheduled[0].publishAt).toBe(future);expect(isPublished(scheduled[0],future)).toBe(true);expect(scheduled[0].alternates).toEqual([{locale:'en',path:'/en/rooms/suite'},{locale:'el',path:'/el/rooms/suite'}]);
 expect(record.translations.el.publishAt).toBe(scheduledLocale==='el'?future:undefined);
});
