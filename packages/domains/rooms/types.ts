import type {EditorialCopy,RouteFields} from '../../content/types';
import type {MediaReference} from '../../content/media.mjs';
export interface RoomImageCopy {id:string;alt:string;caption?:string}
export interface RoomAmenityCopy {id:string;label:string}
export interface RoomCopy extends EditorialCopy {bedDescription:string;imageCopy:RoomImageCopy[];amenityCopy:RoomAmenityCopy[]}
export interface Room extends RoomCopy {contentId:string;slug:string;maxGuests:number;images:{id:string;media:MediaReference}[];amenities:{id:string}[];translations:Record<string,RoomCopy>}
export interface LocalizedRoom extends Omit<Room,'translations'|'images'|'amenities'|'imageCopy'|'amenityCopy'>,RouteFields {images:({media:MediaReference}&RoomImageCopy)[];amenities:RoomAmenityCopy[]}
declare module '../../content/domain-contracts' {interface DomainRecordMap {rooms:Room} interface LocalizedDomainRecordMap {rooms:LocalizedRoom}}
declare module '../../content/types' {interface PageTemplateMap {rooms:unknown} interface SectionCopyMap {'room-list':{title:string;description:string;emptyMessage:string}}}
