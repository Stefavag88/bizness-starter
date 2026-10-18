import type {TinaField} from 'tinacms';
import type {ProjectConfig} from '../../../packages/config/project.mjs';
import {text,prose} from '../../fields/common';
import {rich} from '../../fields/rich-text';
import {withTranslations} from '../../i18n';
import {RoomIdentity,RoomItems,RoomItemCopy,RoomTranslations} from './items';
export const roomListCopyFields=():TinaField[]=>[text('id',true),text('title'),rich('description',true),{name:'emptyMessage',type:'string',required:true}];
export function roomFields(project:ProjectConfig):TinaField[]{
 const fields:TinaField[]=[...['contentId','slug'].map(name=>({...text(name),ui:{component:RoomIdentity}})),...prose,{name:'maxGuests',type:'number',required:true},text('bedDescription'),{name:'images',type:'object',list:true,fields:[text('id',true),{name:'media',type:'object',fields:[{name:'src',type:'image'},{name:'crop',type:'string',options:['center','top','bottom']}]}],ui:{component:RoomItems}},{name:'amenities',type:'object',list:true,fields:[text('id',true)],ui:{component:RoomItems}},{name:'imageCopy',type:'object',list:true,fields:[text('id',true),text('alt'),rich('caption',true)],ui:{component:RoomItemCopy}},{name:'amenityCopy',type:'object',list:true,fields:[text('id',true),text('label')],ui:{component:RoomItemCopy}}];
 const result=withTranslations(fields,project,['status','publishAt','title','description','body','seoDescription','bedDescription','imageCopy','amenityCopy']);result[result.length-1].ui={component:RoomTranslations};return result;
}
