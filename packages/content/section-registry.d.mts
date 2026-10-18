import type { ProjectConfig } from '../config/project.mjs';
import type { ZodType } from 'zod';
import type { Link,SectionType,SectionCopyMap } from './types';
export {LIMITS} from './limits.mjs';
export const SECTION_TYPES:readonly SectionType[];
export const linkSchema:ZodType<Link>;
export const sectionCopySchemas:{readonly [K in SectionType]:ZodType<SectionCopyMap[K]>};
export type SectionDefinition = {[K in SectionType]:{readonly enabled?:(project:ProjectConfig)=>boolean;readonly type:K;readonly nativeName:string;readonly copySchema:ZodType<SectionCopyMap[K]>;readonly variants:readonly string[];readonly referenceFields:Record<string,any>;readonly defaultReference:()=>Record<string,unknown>;readonly richFields:readonly {path:readonly string[];inline:boolean}[];readonly itemCopySchema?:ZodType<any>;readonly defaultItemCopy?:()=>Record<string,string>;readonly defaultCopy:()=>SectionCopyMap[K]}}[SectionType];
export const sectionDefinitions:readonly SectionDefinition[];

export function createSectionRegistry(definitions:readonly SectionDefinition[]):readonly SectionDefinition[];
export function sectionEnabled(definition:SectionDefinition,project:ProjectConfig):boolean;
