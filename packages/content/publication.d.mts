import type { ProjectConfig } from '../config/project.mjs';
import type { ContentSnapshot,Page,Offering,Person,Article,Publication } from './types';
export function localizedValue<T extends {translations:Record<string,object>}>(record:T,locale:string,project:ProjectConfig):Omit<T,'translations'>|null;
export function isPublished(record:Publication|null,now:string):boolean;
export function requiredPage(page:Page,project:ProjectConfig):boolean;
export function joinPath(locale:string,...parts:string[]):string;
export function activeRecords(source:ContentSnapshot,locale:string,project:ProjectConfig):{pages:Omit<Page,'translations'>[];offerings:Omit<Offering,'translations'>[];people:Omit<Person,'translations'>[];articles:Omit<Article,'translations'>[]};
