import type {Collection} from 'tinacms';
import type {ProjectConfig} from '../../packages/config/project.mjs';
import {getNativeDomainAdapters} from '../domain-validation';
import type {NativeDomainRegistration} from '../domain-validation';
export interface NativeDomainFactory extends NativeDomainRegistration {readonly buildCollection:(project:ProjectConfig)=>Collection}
// Tina-only static factories; never import these from browser-safe content contracts.
export const nativeDomainRegistrations:readonly NativeDomainFactory[]=Object.freeze([]);
export function buildDomainCollections(project:ProjectConfig):Collection[] {
 return getNativeDomainAdapters(project).map(adapter=>{
  const collection=nativeDomainRegistrations.find(entry=>entry.key===adapter.key)!.buildCollection(project);
  if(collection.name!==adapter.collectionName||collection.path!=='content/'+adapter.directory)throw Error('Native domain '+adapter.key+' collection identity must match its content registration');
  return {...collection,ui:{...collection.ui,allowedActions:{...collection.ui?.allowedActions,create:adapter.allowCreate,delete:false,createFolder:false,createNestedFolder:false}}};
 });
}
