import type { ZodType } from 'zod';
import type { Link,SectionType,SectionCopyMap } from './types';
export const LIMITS:Readonly<{title:200;seoDescription:300;description:10000;body:100000}>;
export const SECTION_TYPES:readonly SectionType[];
export const linkSchema:ZodType<Link>;
export const sectionCopySchemas:{readonly [K in SectionType]:ZodType<SectionCopyMap[K]>};
export type SectionDefinition = {[K in SectionType]:{readonly type:K;readonly nativeName:string;readonly copySchema:ZodType<SectionCopyMap[K]>;readonly variants:readonly string[];readonly referenceFields:Record<string,any>;readonly defaultReference:()=>Record<string,unknown>;readonly richFields:readonly {path:readonly string[];inline:boolean}[];readonly itemCopySchema?:ZodType<any>;readonly defaultItemCopy?:()=>Record<string,string>;readonly defaultCopy:()=>SectionCopyMap[K]}}[SectionType];
export const sectionDefinitions:readonly SectionDefinition[];
