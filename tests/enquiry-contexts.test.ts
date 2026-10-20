import {it,expect} from 'vitest';
import {fixture,project,pageDocument} from './fixtures/content/factory';
import {room} from './fixtures/content/room';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import * as contexts from '../packages/content/enquiry-contexts.mjs';
const enabled={...project,modules:{...project.modules,rooms:true}};
function setup(){const f=fixture();f.write('pages/rooms.json',pageDocument('rooms','rooms','rooms'));f.write('rooms/suite.json',room());return f;}
it('projects localized public Offering and Room choices with stable paths',()=>{
 const f=setup(),source=readContent(f.root,enabled);const en=localizeContent(source,'en',enabled),el=localizeContent(source,'el',enabled);
 expect(contexts.getEnquiryContexts(en)).toEqual([{id:'sample',kind:'offering',title:'A sample',path:'/en/services/sample'},{id:'suite',kind:'rooms',title:'Suite',path:'/en/rooms/suite'}]);
 expect(contexts.getEnquiryContexts(el)[1]).toEqual({id:'suite',kind:'rooms',title:'Σουίτα',path:'/el/rooms/suite'});
 expect(contexts.getAcceptedEnquiryContexts([en,el])).toEqual([{id:'sample',kind:'offering'},{id:'suite',kind:'rooms'}]);
});
it.each(['en','el'])('accepts the locale union for %s-only publication and index schedules',locale=>{
 const f=setup();const record=room();if(locale==='el')record.status='draft';else record.translations.el.status='draft';f.write('rooms/suite.json',record);
 const source=readContent(f.root,enabled,{now:new Date('2026-10-18T00:00:00Z')});const localized=['en','el'].map(l=>localizeContent(source,l,enabled));
 expect(localized.map(c=>contexts.getEnquiryContexts(c).some(r=>r.id==='suite'))).toEqual(locale==='en'?[true,false]:[false,true]);
 expect(contexts.getAcceptedEnquiryContexts(localized)).toContainEqual({id:'suite',kind:'rooms'});
 const index=pageDocument('rooms','rooms','rooms');index.publishAt='2099-01-01T00:00:00Z';index.translations.el.publishAt='2099-01-01T00:00:00Z';f.write('pages/rooms.json',index);
 const future=readContent(f.root,enabled,{now:new Date('2026-10-18T00:00:00Z')});expect(contexts.getAcceptedEnquiryContexts(['en','el'].map(l=>localizeContent(future,l,enabled)))).not.toContainEqual({id:'suite',kind:'rooms'});
});
it('omits disabled datasets and rejects ambiguous context IDs',()=>{
 const f=setup();const source=readContent(f.root,project),content=localizeContent(source,'en',project);
 expect(contexts.getEnquiryContexts(content).map(r=>r.id)).toEqual(['sample']);
 const publicRoom=localizeContent(readContent(f.root,enabled),'en',enabled).domains.rooms![0];
 const collision={...publicRoom,contentId:'sample'};const duplicate={...content,domains:{rooms:[collision]}};
 expect(()=>contexts.getEnquiryContexts(duplicate)).toThrow(/Duplicate enquiry context/);
 expect(()=>contexts.getAcceptedEnquiryContexts([content,{...content,offerings:[],domains:{rooms:[collision]}}])).toThrow(/Duplicate enquiry context/);
});

it.each(['en','el'])('uses the existing localized Rooms index eligibility for a scheduled %s index',scheduled=>{
 const f=setup();const index=pageDocument('rooms','rooms','rooms');if(scheduled==='en')index.publishAt='2099-01-01T00:00:00Z';else index.translations.el.publishAt='2099-01-01T00:00:00Z';f.write('pages/rooms.json',index);
 const source=readContent(f.root,enabled,{now:new Date('2026-10-18T00:00:00Z')});const localized=['en','el'].map(locale=>localizeContent(source,locale,enabled));
 expect(localized.map(c=>contexts.getEnquiryContexts(c).some(r=>r.id==='suite'))).toEqual(scheduled==='en'?[false,true]:[true,false]);expect(contexts.getAcceptedEnquiryContexts(localized)).toContainEqual({id:'suite',kind:'rooms'});
});
