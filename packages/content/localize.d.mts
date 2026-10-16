import type { ProjectConfig } from '../config/project.mjs';
import type { ContentSnapshot,LocalizedContent } from './types';
export type { LocalizedContent,LocalizedPage,LocalizedSection,LocalizedOffering,LocalizedPerson,LocalizedArticle } from './types';
export function localizeContent(source:ContentSnapshot,locale:string,project:ProjectConfig):LocalizedContent;
