import {it,expect} from 'vitest';
import {addRoomItem,moveRoomItem,removeRoomItem,initializeRoomTranslation,initializeRoomItemTranslation} from '../packages/domains/rooms/items.mjs';
import {room} from './fixtures/content/room';
it('moves stable structure without rewriting native copy or unrelated AST identities',()=>{
 const body={type:'root',children:[{type:'opaque',children:[]}]};const v:any={...room(),body};
 const added=addRoomItem(v,'amenities',{id:'desk',copy:{id:'desk',label:'Desk'}});
 expect(added.body).toBe(body);expect(added.translations).toBe(v.translations);
 const moved=moveRoomItem(added,'amenities','desk','up');expect(moved.amenities.map((x:any)=>x.id)).toEqual(['desk','wifi']);expect(moved.amenityCopy).toBe(added.amenityCopy);
 const translated=initializeRoomItemTranslation(moved,'el','amenities','desk',{id:'desk',label:''});expect(translated.translations.el.amenityCopy.at(-1).label).toBe('');expect(translated.body).toBe(body);
 const removed=removeRoomItem(translated,'amenities','wifi');expect(removed.translations.el.amenityCopy.map((x:any)=>x.id)).toEqual(['desk']);expect(removed.body).toBe(body);
 expect(()=>addRoomItem(v,'amenities',{id:'wifi',copy:{id:'wifi',label:'Duplicate'}})).toThrow();
 expect(()=>moveRoomItem(v,'amenities','missing','up')).toThrow();
 expect(()=>addRoomItem(v,'images',{id:'bad',copy:{id:'bad',alt:'Alt'}})).toThrow();
 const init=initializeRoomTranslation({...v,translations:{}},'el');expect(init.translations.el.title).toBe('');expect(init.translations.el.status).toBe('draft');expect(init.translations.el.images).toBeUndefined();expect(init.translations.el.imageCopy[0].alt).toBe('');
});

import {applyRoom} from '../tina/domains/rooms/items';
import {roomCollection} from '../tina/domains/rooms/collection';
import {getNativeDomainAdapters} from '../tina/domain-validation';
import {nativeProjection,beforeSubmit} from '../tina/validation';
import {project} from './fixtures/content/factory';
it('native Rooms controls apply all changed owned fields and reject without mutation',()=>{
 const values:any={...room(),status:'draft',translations:{}};let state=values;const changes:string[]=[];const form={getState:()=>({values:state}),batch:(fn:any)=>fn(),change:(key:string,value:any)=>{changes.push(key);state={...state,[key]:value};}};
 applyRoom(form,v=>addRoomItem(v,'amenities',{id:'desk',copy:{id:'desk',label:'Desk'}}));expect(changes).toEqual(['amenities','amenityCopy']);
 expect(()=>applyRoom(form,v=>addRoomItem(v,'amenities',{id:'desk',copy:{id:'desk',label:'Again'}}))).toThrow();expect(changes).toHaveLength(2);
});
it('registers stable native schemas and returns original rich ASTs after detached save validation',()=>{
 const p={...project,modules:{rooms:true}};expect(getNativeDomainAdapters(project)).toEqual([]);expect(getNativeDomainAdapters(p).map(a=>a.collectionName)).toEqual(['room']);
 const collection=roomCollection(p);expect(collection.ui?.defaultItem).toBeTruthy();expect((collection.ui?.defaultItem as any).body).toMatchObject({type:'root'});expect((collection.ui?.defaultItem as any).description).toMatchObject({type:'root'});expect(JSON.stringify(roomCollection(p))).toBe(JSON.stringify(collection));
 const body={type:'root',children:[{type:'p',children:[{text:'Useful words',id:'kept'}]}]};const values={...room(),body,status:'draft',translations:{}};
 expect(nativeProjection(values,p,'room').body).toContain('Useful words');expect(beforeSubmit(values,'room',p,undefined,{operation:'create',relativePath:'suite.json'})).toBe(values);expect(values.body).toBe(body);
 expect(()=>beforeSubmit({...values,status:'published'},'room',p,undefined,{operation:'create',relativePath:'suite.json'})).toThrow(/draft/i);
});

import {appendSection,initializeTranslationCopy} from '../tina/fields/composition';
import {pageDocument} from './fixtures/content/factory';
import {nativeRichText} from '../tina/fields/rich-text';
it('initializes module-required translation fields blank without default prose or rewriting existing ASTs',()=>{
 const initial:any=pageDocument('about','about','about'),ast=nativeRichText('Original body');initial.translations.el.copy.sections[1].body=ast;initial.sections.forEach((s:any)=>s.enabled=true);
 const values:any=appendSection(initial,'room-list','intro'),id=values.sections[1].id;
 const initialized:any=initializeTranslationCopy(values,'el',id),copy=initialized.translations.el.copy.sections.find((s:any)=>s.id===id);
 expect(copy.emptyMessage).toBe('');expect(copy.description).toMatchObject({type:'root'});expect(initialized.translations.el.copy.sections[1].body).toBe(ast);
 const p={...project,modules:{rooms:true}};expect(()=>beforeSubmit(initialized,'page',p,values,{operation:'update',relativePath:'about.json'})).toThrow();
 copy.title='Δωμάτια';copy.emptyMessage='Δεν υπάρχουν δωμάτια.';expect(beforeSubmit(initialized,'page',p,values,{operation:'update',relativePath:'about.json'})).toBe(initialized);expect(initialized.translations.el.copy.sections[1].body).toBe(ast);
 const missing:any=initializeTranslationCopy({...values,translations:{}},'el',id);expect(missing.translations.el.status).toBe('draft');expect(missing.translations.el.copy.sections.find((s:any)=>s.id===id).emptyMessage).toBe('');
});

it('invalid nested Room copy rejects detached validation and correction preserves opaque AST identity',()=>{
 const p={...project,modules:{rooms:true}},body={type:'root',children:[{type:'p',children:[{text:'Retained native body',id:'opaque-identity'}]}]};
 const original:any={...room(),body,status:'draft',translations:{}};
 const broken=addRoomItem(original,'amenities',{id:'desk',copy:{id:'desk',label:''}});
 expect(()=>beforeSubmit(broken,'room',p,original,{operation:'update',relativePath:'suite.json'})).toThrow();expect(broken.body).toBe(body);expect(original.amenities).toHaveLength(1);
 const corrected={...broken,amenityCopy:broken.amenityCopy.map((c:any)=>c.id==='desk'?{...c,label:'Desk'}:c)};
 expect(beforeSubmit(corrected,'room',p,original,{operation:'update',relativePath:'suite.json'})).toBe(corrected);expect(corrected.body).toBe(body);
});
