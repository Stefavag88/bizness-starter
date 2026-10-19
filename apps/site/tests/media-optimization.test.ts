import {it,expect,beforeEach,afterEach} from 'vitest';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import SectionImage from '../src/components/ui/SectionImage.astro';
import Gallery from '../src/templates/sections/Gallery.astro';
import RoomList from '../src/templates/domains/rooms/RoomList.astro';
import RoomDetail from '../src/templates/domains/rooms/RoomDetail.astro';
import MediaText from '../src/templates/sections/MediaText.astro';
import {beginMediaSession,endMediaSession,getMediaSession} from '../../../packages/media/session.mjs';
import {imageSizes} from '../../../packages/media/layout.mjs';
import {fileURLToPath} from 'node:url';
import {writeFileSync,readFileSync,unlinkSync} from 'node:fs';
import sharp from 'sharp';
const root=fileURLToPath(new URL('../../../',import.meta.url));
beforeEach(()=>{beginMediaSession({root,policy:{enabled:true,widths:[320,640],quality:80},mode:'dev'});});
afterEach(async()=>{await endMediaSession(root);});
const candidate=(format:'png'|'webp',width:number)=>({src:`/_media/v1/${format}${width}.${format}`,width,height:width/2,format,bytes:100});
const media={src:'/uploads/original.png',width:1600,height:800,format:'png',fingerprint:'fixture',fallback:[candidate('png',320),candidate('png',640)],webp:[candidate('webp',320),candidate('webp',640)]};
const props={media,layout:'gallery',itemCount:2,alt:'A & B',caption:'**Caption** [Contact](/contact) <script>bad()</script>',crop:'bottom',ratio:'gallery',locale:'el'};
it('renders picture families with largest fallback, safe localized caption and retained frame/crop/loading',async()=>{
 const c=await AstroContainer.create(),html=await c.renderToString(SectionImage,{props});
 expect(html).toContain('<picture>');expect(html).toContain('type="image/webp"');
 expect(html).toContain('srcset="/_media/v1/webp320.webp 320w, /_media/v1/webp640.webp 640w"');
 expect(html).toContain('src="/_media/v1/png640.png"');expect(html).toContain('srcset="/_media/v1/png320.png 320w, /_media/v1/png640.png 640w"');
 expect(html).toContain(`sizes="${imageSizes('gallery',2)}"`);expect(html).toContain('width="640" height="320"');
 expect(html).toContain('alt="A &amp; B"');expect(html).toContain('crop-bottom');expect(html).toContain('frame-gallery');expect(html).toContain('loading="lazy" decoding="async"');
 expect(html).toContain('<strong>Caption</strong>');expect(html).toContain('href="/el/contact"');expect(html).not.toContain('<script>');
});
it('uses only one family for WebP originals and keeps passthrough original dimensions',async()=>{
 const c=await AstroContainer.create();
 const name='final-fix-'+crypto.randomUUID()+'.webp';
 const path=root+'apps/site/public/uploads/'+name;
 const bytes=await sharp({create:{width:800,height:400,channels:4,background:'#33669980'}}).webp().toBuffer();
 writeFileSync(path,bytes,{flag:'wx'});
 try {
  const actual=await getMediaSession(root).resolve('/uploads/'+name);
  expect(actual.fallback).toEqual([]);
  expect(actual.webp.map(c=>[c.width,c.height])).toEqual([[320,160],[640,320]]);
  const webp=await c.renderToString(SectionImage,{props:{...props,media:actual}});
  expect(webp).not.toContain('<source');
  expect(webp).toContain('src="'+actual.webp[1].src+'"');
  expect(webp).toContain('srcset="'+actual.webp.map(c=>c.src+' '+c.width+'w').join(', ')+'"');
  expect(webp).toContain('width="640" height="320"');
  expect(webp).toContain('sizes="'+imageSizes('gallery',2)+'"');
 } finally {
  if(readFileSync(path).equals(bytes))unlinkSync(path);else throw Error('Owned WebP fixture changed; preserved');
 }
 for(const reason of ['disabled','animated-or-multipage']){const html=await c.renderToString(SectionImage,{props:{...props,media:{...media,fallback:[],webp:[],passthroughReason:reason}}});expect(html).not.toMatch(/<picture|srcset=|sizes=/);expect(html).toContain('src="/uploads/original.png" width="1600" height="800"');}
});
it('actual section renderers pass exact roles and rendered counts, including text-only Room cards',async()=>{
 const name=`task4_${crypto.randomUUID()}.png`,path=root+'apps/site/public/uploads/'+name,src='/uploads/'+name;
 const bytes=await sharp({create:{width:8,height:4,channels:3,background:'#336699'}}).png().toBuffer();writeFileSync(path,bytes,{flag:'wx'});
 try{
 const c=await AstroContainer.create();const image={id:'one',media:{src,crop:'top'},alt:'Photo',caption:''};
 for(const count of [1,2,3,4]){const items=Array.from({length:count},(_,i)=>({...image,id:'image_'+i}));
 for(const variant of ['default','featured']){const html=await c.renderToString(Gallery,{props:{section:{id:'gallery',variant,appearance:{surface:'default'},items,copy:{title:'Gallery',description:'',items}},locale:'en'}});const sizes=[...html.matchAll(/<img[^>]+sizes="([^"]+)"/g)].map(m=>m[1]);expect(sizes).toEqual(items.map((_,i)=>imageSizes(variant==='default'?'gallery':i===0?'gallery-featured-lead':'gallery-featured-item',count)));}
 const rooms=items.map((_,i)=>({contentId:'room-'+i,path:'/en/rooms/'+i,title:'Room',description:'',maxGuests:2,images:i===0?[image]:[]}));
 const html=await c.renderToString(RoomList,{props:{section:{id:'rooms',appearance:{surface:'default'},copy:{title:'Rooms',description:'',emptyMessage:'Empty'}},content:{domains:{rooms}},locale:'en'}});expect(html).toContain(`sizes="${imageSizes('room-card',count)}"`);
 }
 const record={contentId:'suite',title:'Suite',description:'',body:'',maxGuests:2,bedDescription:'',amenities:[],images:[image]};const content={locale:'en',pages:[]};
 expect(await c.renderToString(RoomDetail,{props:{record,content}})).toContain(`sizes="${imageSizes('room-detail',1)}"`);
 const section={id:'media',appearance:{surface:'default'},variant:'default',media:image.media,copy:{title:'Media',body:'Body',image:{alt:'Photo'}}};
 expect(await c.renderToString(MediaText,{props:{section,locale:'en'}})).toContain(`sizes="${imageSizes('media-text',1)}"`);
 const text=await c.renderToString(MediaText,{props:{section:{...section,media:undefined},locale:'en'}});expect(text).not.toMatch(/<img|<picture/);
 }finally{if(readFileSync(path).equals(bytes))unlinkSync(path);else throw Error('Owned Task4 image changed; preserved');}
});
