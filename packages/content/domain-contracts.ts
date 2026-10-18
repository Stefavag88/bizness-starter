import type { ZodType } from 'zod';
import type { ProjectConfig } from '../config/project.mjs';
import type { LocalizedPage, Page, RouteFields } from './types';
/** Augmented by domain-owned type modules; no runtime framework imports. */
export interface DomainRecordMap {}
export interface LocalizedDomainRecordMap {}
export type DomainRecords = {[K in keyof DomainRecordMap]?:DomainRecordMap[K][]};
export type LocalizedDomainRecords = {[K in keyof LocalizedDomainRecordMap]?:LocalizedDomainRecordMap[K][]};
export interface OwnedDomainPage {readonly filename:string;readonly template:string;readonly contentId:string}
export interface DomainContext {project:ProjectConfig;locale:string;now:string;pages:readonly LocalizedPage[]}
export interface CatalogContext {project:ProjectConfig;now:string;pages:readonly Page[];recordIds:ReadonlySet<string>}
export interface DomainDefinition<R=unknown,L=unknown> {
 readonly key:string;readonly collectionName:string;readonly directory:string;readonly schema:ZodType<R>;
 readonly ownedPages:readonly OwnedDomainPage[];
 readonly enabled:(project:ProjectConfig)=>boolean;
 readonly richFields:readonly {readonly path:readonly string[];readonly inline:boolean}[];
 readonly projectRecord:(record:R,context:DomainContext)=>Omit<L,keyof RouteFields>|null;
 readonly routePath:(record:Omit<L,keyof RouteFields>,context:DomainContext)=>string;
 readonly validate:(records:readonly R[],context:CatalogContext)=>void;
 readonly enquiry:boolean;
}
/** Heterogeneous callbacks are erased only at this generic registry boundary. */
export interface DomainRegistry {readonly definitions:readonly DomainDefinition<any,any>[]}
