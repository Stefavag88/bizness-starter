import { createElement as h } from 'react';
import type { TinaField } from 'tinacms';
import { text,object,link } from '../fields/common';
import { rich } from '../fields/rich-text';
export function sectionCopy(type:string):TinaField[] {
 return [text('title'),type==='rich-text'?rich('body'):rich('description',true),...(['hero','cta'].includes(type)?[link]:[])];
}
export const references:TinaField={name:'sections',label:'Section visibility and appearance',type:'object',list:true,ui:{component:SectionControls},fields:[text('id',true),text('_template',true),{name:'variant',type:'string',options:['default']},{name:'enabled',type:'boolean'},object('appearance',[{name:'surface',type:'string',options:['default','muted','accent']}])]};

// A fixed list of controls: no list add/remove/reorder affordances in Foundation.
function SectionControls({input}:any) {
 const values=input.value||[];
 const update=(index:number,patch:any)=>input.onChange(values.map((v:any,i:number)=>i===index?{...v,...patch}:v));
 return h('div',{},...values.map((v:any,i:number)=>h('fieldset',{key:v.id},h('legend',{},v.id.replaceAll('_',' ')),h('label',{},h('input',{type:'checkbox',checked:v.enabled!==false,disabled:v._template==='hero',onChange:(e:any)=>update(i,{enabled:e.target.checked})}),' Show section'),h('label',{},' Surface ',h('select',{value:v.appearance.surface,onChange:(e:any)=>update(i,{appearance:{surface:e.target.value}})},...['default','muted','accent'].map(surface=>h('option',{key:surface,value:surface},surface)))))));
}
