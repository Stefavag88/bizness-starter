import type {ProjectConfig} from '../config/project.mjs';
import type {ContentSnapshot,LocalizedContent,LocalizedPage,RouteFields} from './types';
import type {DomainRegistry,LocalizedDomainRecordMap,LocalizedDomainRecords} from './domain-contracts';
export function getDomainRecords<K extends keyof LocalizedDomainRecordMap>(content:LocalizedContent,key:K,registry?:DomainRegistry):readonly LocalizedDomainRecordMap[K][];
export function projectDomains(source:ContentSnapshot,locale:string,project:ProjectConfig,pagesByLocale:ReadonlyMap<string,readonly LocalizedPage[]>,registry?:DomainRegistry):LocalizedDomainRecords;
export function assertOwnedPageIdentity(candidate:{_template:string;contentId:string},filename?:string,registry?:DomainRegistry):void;

export interface DomainRouteRecord extends RouteFields {contentId:string;title:string;description?:string;seoDescription?:string}
export function getDomainRouteRecord(content:LocalizedContent,domain:string,contentId:string,registry?:DomainRegistry):DomainRouteRecord;
