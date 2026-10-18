import type {ZodType} from 'zod';
import type {ProjectConfig} from '../packages/config/project.mjs';
import type {DomainRegistry} from '../packages/content/domain-contracts';
import {getActiveDomains} from '../packages/content/domain-registry.mjs';
import type {NativeSubmission} from './validation';
import {nativeDomainRegistrations} from './domains';
export interface NativeDomainRegistration {readonly key:string;readonly allowCreate:boolean;readonly assertIdentity:typeof assertDomainIdentity}
export interface NativeDomainAdapter extends NativeDomainRegistration {readonly collectionName:string;readonly directory:string;readonly schema:ZodType;readonly richFields:readonly {readonly path:readonly string[];readonly inline:boolean}[]}
export interface NativeDomainRegistry {readonly definitions:readonly NativeDomainRegistration[]}
export interface NativeDomainOptions {registry?:DomainRegistry;nativeRegistry?:NativeDomainRegistry}
export function createNativeDomainRegistry(definitions:readonly NativeDomainRegistration[]):NativeDomainRegistry {
 const keys=new Set<string>();
 for(const entry of definitions){if(keys.has(entry.key))throw Error('Duplicate native domain registration: '+entry.key);keys.add(entry.key);if(typeof entry.allowCreate!=='boolean'||typeof entry.assertIdentity!=='function')throw Error('Invalid native domain registration: '+entry.key);}
 return Object.freeze({definitions:Object.freeze(definitions.map(entry=>Object.freeze({...entry})))});
}
export function getNativeDomainAdapters(project:ProjectConfig,options:NativeDomainOptions={}):readonly NativeDomainAdapter[] {
 const native=options.nativeRegistry??createNativeDomainRegistry(nativeDomainRegistrations);
 return getActiveDomains(project,options.registry).map(definition=>{
  const registration=native.definitions.find(entry=>entry.key===definition.key);
  if(!registration)throw Error('Domain '+definition.key+' requires a native registration in tina/domains/index.ts');
  return {...registration,collectionName:definition.collectionName,directory:definition.directory,schema:definition.schema,richFields:definition.richFields};
 });
}
export function assertDomainIdentity(candidate:any,current:any,submission:NativeSubmission):void {
 if(!submission||!['create','update'].includes(submission.operation)||!/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.json$/.test(submission.relativePath))throw Error('Explicit flat native domain submission is required');
 if(submission.operation==='create'){
  if(candidate.status!=='draft'||Object.values(candidate.translations??{}).some((copy:any)=>copy.status!=='draft'))throw Error('Create domain records and supplied translations as drafts');
  return;
 }
 if(!current||candidate.contentId!==current.contentId||candidate.slug!==current.slug)throw Error('Existing domain identity is protected; current record, contentId and slug must match');
}
