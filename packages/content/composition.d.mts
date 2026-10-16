import type { Page, PageDocument, PageDocumentTranslation, SectionReference, SectionType } from './types';
export type NativeSectionType = SectionType | 'rich_text' | 'offering_list' | 'people_list' | 'article_list';
/** Rich text stays opaque in the editor. Only detached save projections serialize it. */
export interface CompositionCopyEntry { id:string; _template:NativeSectionType; [field:string]:unknown }
export interface CompositionDraft extends Omit<PageDocument,'sections'|'copy'|'translations'> {
 sections:(Omit<SectionReference,'_template'> & {_template:NativeSectionType})[];
 copy:{sections:CompositionCopyEntry[]};
 translations:Record<string,Omit<PageDocumentTranslation,'copy'> & {copy:{sections:CompositionCopyEntry[]}}>;
}
export function addSection(values:CompositionDraft, options:{type:SectionType;id:string;afterId:string;copy:CompositionCopyEntry}):CompositionDraft;
export function moveSection(values:CompositionDraft,id:string,direction:'up'|'down'):CompositionDraft;
export function setSectionEnabled(values:CompositionDraft,id:string,enabled:boolean):CompositionDraft;
export function removeSection(values:CompositionDraft,id:string):CompositionDraft;
export function addTranslationCopy(values:CompositionDraft,localeKey:string,sectionId:string,copy:CompositionCopyEntry):CompositionDraft;
export function assertPageCapabilities(candidate:Page):void;
export function assertExistingPageIdentity(candidate:Page,previous:Page):void;
