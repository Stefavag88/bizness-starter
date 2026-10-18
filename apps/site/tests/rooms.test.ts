import {it,expect} from 'vitest';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import RoomDetail from '../src/templates/domains/rooms/RoomDetail.astro';
import RoomList from '../src/templates/domains/rooms/RoomList.astro';
it('renders text-only room with one H1, localized guest copy and safe contact CTA',async()=>{
 const c=await AstroContainer.create();const record={contentId:'suite',title:'Σουίτα',description:'**Περιγραφή**',body:'## Λεπτομέρειες',maxGuests:2,bedDescription:'Διπλό κρεβάτι',amenities:[{id:'wifi',label:'Δίκτυο'}],images:[]};
 const html=await c.renderToString(RoomDetail,{props:{record,content:{locale:'el',pages:[{_template:'contact',path:'/el/contact'}]}}});
 expect(html.match(/<h1>/g)).toHaveLength(1);expect(html).toContain('Διπλό κρεβάτι');expect(html).toContain('Δίκτυο');expect(html).toContain('href="/el/contact?contextId=suite"');expect(html).not.toContain('<img');
 const empty=await c.renderToString(RoomList,{props:{section:{id:'list',appearance:{surface:'default'},copy:{title:'Δωμάτια',description:'',emptyMessage:'Δεν υπάρχουν δωμάτια.'}},content:{domains:{rooms:[]}},locale:'el'}});expect(empty).toContain('Δεν υπάρχουν δωμάτια.');expect(empty).not.toContain('<h1');
});

import {createRequire} from 'node:module';
import {writeFileSync,readFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {domainRenderer,assertDomainRendererCoverage,createDomainRendererRegistry} from '../src/templates/domains';
import {project} from '../../../tests/fixtures/content/factory';
it('registers initialized Rooms renderer without a content-adapter cycle and requires active coverage',()=>{
 expect(domainRenderer('rooms')).toBe(RoomDetail);
 expect(()=>assertDomainRendererCoverage({...project,modules:{rooms:true}},undefined,createDomainRendererRegistry([]))).toThrow(/rooms.*renderer|renderer.*rooms/i);
 expect(()=>assertDomainRendererCoverage(project,undefined,createDomainRendererRegistry([]))).not.toThrow();
});
it('uses first shared image as thumbnail and source dimensions/crop for detail',async()=>{
 const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('astro/package.json'))('sharp');const dir=fileURLToPath(new URL('../public/uploads/',import.meta.url));mkdirSync(dir,{recursive:true});const name='rooms_'+crypto.randomUUID()+'.png',path=dir+name;const bytes=await sharp({create:{width:6,height:4,channels:3,background:'#336699'}}).png().toBuffer();writeFileSync(path,bytes,{flag:'wx'});
 try{
  const c=await AstroContainer.create(),src='/uploads/'+name;const first={id:'one',media:{src,crop:'bottom'},alt:'First image',caption:'**Caption**'},second={id:'two',media:{src,crop:'top'},alt:'Second image'};
  const record={contentId:'suite',path:'/el/rooms/suite',title:'Suite',description:'Summary',body:'## Details',maxGuests:2,bedDescription:'',images:[first,second],amenities:[]};const content={locale:'el',pages:[],domains:{rooms:[record]}};
  const detail=await c.renderToString(RoomDetail,{props:{record,content}});expect(detail).toContain('width="6"');expect(detail).toContain('height="4"');expect(detail).toContain('crop-bottom');expect(detail).toContain('crop-top');expect(detail).toContain('loading="lazy"');expect(detail).toContain('<strong>Caption</strong>');
  const list=await c.renderToString(RoomList,{props:{section:{id:'list',appearance:{surface:'default'},copy:{title:'Rooms',description:'',emptyMessage:'Empty'}},content,locale:'el'}});expect(list).toContain('alt="First image"');expect(list).not.toContain('alt="Second image"');expect(list).toContain('frame-landscape');expect(list).toContain('width="6"');expect(list).not.toMatch(/srcset=|style=/);
 }finally{if(readFileSync(path).equals(bytes))unlinkSync(path);else throw Error('Owned Room image changed; preserved');}
});
