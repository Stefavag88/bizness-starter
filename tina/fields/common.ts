import type { TinaField } from 'tinacms';
import { rich } from './rich-text';
export const text=(name:string,hidden=false):TinaField=>({name,type:'string',ui:hidden?{component:'hidden'}:undefined});
export const object=(name:string,fields:TinaField[],list=false):TinaField=>({name,type:'object',fields,list});
export const publication:TinaField[]=[{name:'status',type:'string',options:['draft','published'],required:true},{name:'publishAt',type:'datetime'}];
export const meta=object('meta',[text('title'),text('seoDescription')]);
export const prose:TinaField[]=[...publication,text('title'),rich('description',true),rich('body'),text('seoDescription')];
export const link=object('link',[text('label'),text('href')]);
