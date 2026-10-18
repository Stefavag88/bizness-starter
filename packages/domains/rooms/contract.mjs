import {z} from 'zod';
import {LIMITS} from '../../content/limits.mjs';
import {isSafeMarkdown} from '../../content/rich-text.mjs';
import {mediaReferenceSchema} from '../../content/media.mjs';
import {isPublished,joinPath} from '../../content/publication.mjs';
const id=z.string().regex(/^[a-z][a-z0-9_]{0,79}$/);
const title=z.string().trim().min(1).max(LIMITS.title);
const summary=z.string().max(LIMITS.description).refine(v=>isSafeMarkdown(v,true),'Use safe inline Markdown');
const body=z.string().max(LIMITS.body).refine(v=>isSafeMarkdown(v),'Use safe Markdown');
const publication={status:z.enum(['draft','published']),publishAt:z.iso.datetime({offset:true}).optional()};
export const imageCopySchema=z.strictObject({id,alt:title,caption:summary.optional()});
export const amenityCopySchema=z.strictObject({id,label:title});
const copy={...publication,title,description:summary,body,seoDescription:z.preprocess(v=>v==null?'':v,z.string().trim().max(LIMITS.seoDescription)),bedDescription:z.string().max(LIMITS.title).default(''),imageCopy:z.array(imageCopySchema).max(20),amenityCopy:z.array(amenityCopySchema).max(40)};
export const roomSchema=z.strictObject({contentId:z.string().regex(/^[a-z][a-z0-9-]{0,79}$/),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),...copy,maxGuests:z.number().int().min(1).max(100),images:z.array(z.strictObject({id,media:mediaReferenceSchema})).max(20),amenities:z.array(z.strictObject({id})).max(40),translations:z.record(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),z.strictObject(copy)).default({})}).superRefine((room,ctx)=>{
 for(const [shared,localized] of [['images','imageCopy'],['amenities','amenityCopy']]){
  const expected=room[shared].map(i=>i.id);
  if(new Set(expected).size!==expected.length)ctx.addIssue({code:'custom',path:[shared],message:'Duplicate shared item ID'});
  for(const [value,path] of [[room,[]],...Object.entries(room.translations).map(([locale,t])=>[t,['translations',locale]])]){
   const actual=value[localized].map(i=>i.id);
   if(new Set(actual).size!==actual.length||actual.length!==expected.length||actual.some(id=>!expected.includes(id)))ctx.addIssue({code:'custom',path:[...path,localized],message:'Item IDs must exactly match shared items'});
  }
 }
});
export const roomListDefinition=Object.freeze({type:'room-list',nativeName:'room_list',copySchema:z.strictObject({title,description:summary,emptyMessage:z.string().trim().min(1).max(300)}),variants:Object.freeze(['default']),referenceFields:{},defaultReference:()=>({}),richFields:Object.freeze([{path:['description'],inline:true}]),defaultCopy:()=>({title:'New section',description:'',emptyMessage:'No rooms are currently available to view.'}),enabled:project=>project.modules.rooms});
export const roomsDomain=Object.freeze({key:'rooms',collectionName:'room',directory:'rooms',schema:roomSchema,ownedPages:[{filename:'rooms.json',template:'rooms',contentId:'rooms'}],enabled:project=>project.modules.rooms,richFields:[{path:['description'],inline:true},{path:['body'],inline:false},{path:['imageCopy','*','caption'],inline:true}],enquiry:true,
 projectRecord(record,context){
  const index=context.pages.find(p=>p.contentId==='rooms'&&p._template==='rooms');
  const copy=context.locale===context.project.locale?record:record.translations[context.locale];
  if(!index||!isPublished(index,context.now)||!isPublished(copy,context.now))return null;
  const {translations,images,amenities,imageCopy,amenityCopy,...shared}=record;
  const {imageCopy:localizedImages,amenityCopy:localizedAmenities,...localized}=copy;
  delete localized.translations;delete localized.images;delete localized.amenities;
  return {...shared,...localized,publishAt:copy.publishAt,images:images.map(item=>({...item,...localizedImages.find(c=>c.id===item.id)})),amenities:amenities.map(item=>({...item,...localizedAmenities.find(c=>c.id===item.id)}))};
 },
 routePath(record,context){return joinPath(context.locale,context.pages.find(p=>p.contentId==='rooms').slug,record.slug);},
 validate(records,context){for(const room of records){roomSchema.parse(room);if(['404','api','cms','admin','design-system','newsletter'].includes(room.slug)||context.project.languages.some(l=>l.code.toLowerCase()===room.slug))throw Error('Room slug is reserved: '+room.slug);}}
});
