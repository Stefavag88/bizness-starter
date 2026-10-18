import type { ZodType } from 'zod';
import type { Campaign,Page,Offering,Person,Article,Settings,Meta,Link,SectionReference,SectionCopyMap,PageTemplate,SectionType,Surface } from './types';
export type * from './types';
export {LIMITS} from './limits.mjs';
export const PAGE_TEMPLATES:readonly PageTemplate[];
export const SECTION_TYPES:readonly SectionType[];
export const SURFACES:readonly Surface[];
export const linkSchema:ZodType<Link>;
export const metaSchema:ZodType<Meta>;
export const sectionSchema:ZodType<SectionReference>;
export const sectionCopySchemas:{readonly [K in SectionType]:ZodType<SectionCopyMap[K]>};
export const pageSchema:ZodType<Page>;
export const offeringSchema:ZodType<Offering>;
export const personSchema:ZodType<Person>;
export const articleSchema:ZodType<Article>;
export const settingsSchema:ZodType<Settings>;

export const campaignSchema:ZodType<Campaign>;

export { sectionDefinitions } from './section-registry.mjs';
