import type {ProjectConfig} from '../../../packages/config/project.mjs';
import {collection} from '../../collections/common';
import {assertDomainIdentity} from '../../domain-validation';
import {nativeRichText} from '../../fields/rich-text';
import {roomFields} from './fields';
export function assertRoomIdentity(candidate:any,current:any,submission:Parameters<typeof assertDomainIdentity>[2]):void {assertDomainIdentity(candidate,current,submission);}
export function roomCollection(project:ProjectConfig){const result=collection('room','content/rooms',roomFields(project),project);return {...result,ui:{...result.ui,allowedActions:{create:true,delete:false,createFolder:false,createNestedFolder:false},defaultItem:{status:'draft',title:'New Room',description:nativeRichText(''),body:nativeRichText(''),seoDescription:'',maxGuests:2,bedDescription:'Describe the beds',images:[],amenities:[],imageCopy:[],amenityCopy:[],translations:{}}}};}
