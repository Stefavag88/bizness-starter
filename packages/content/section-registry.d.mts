import type { ZodType } from 'zod';
import type { Link,SectionType,SectionCopyMap } from './types';
export const LIMITS:Readonly<{title:200;seoDescription:300;description:10000;body:100000}>;
export const SECTION_TYPES:readonly SectionType[];
export const linkSchema:ZodType<Link>;
export const sectionCopySchemas:{readonly [K in SectionType]:ZodType<SectionCopyMap[K]>};
export type SectionDefinition = {[K in SectionType]:{readonly type:K;readonly nativeName:string;readonly copySchema:ZodType<SectionCopyMap[K]>;readonly variants:readonly ['default'];readonly defaultCopy:()=>SectionCopyMap[K]}}[SectionType];
export const sectionDefinitions:readonly SectionDefinition[];
