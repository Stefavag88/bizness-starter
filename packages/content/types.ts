export type PageTemplate = 'home'|'about'|'contact'|'standard'|'offerings'|'insights';
export type SectionType = 'hero'|'rich-text'|'offering-list'|'people-list'|'article-list'|'cta';
export type Surface = 'default'|'muted'|'accent';
export type Status = 'draft'|'published';
export interface Publication { status:Status; publishAt?:string }
export interface Link { label:string; href:string }
export interface Meta { title:string; seoDescription:string }
export interface SectionCopyMap {
 hero:{title:string;description:string;link?:Link};
 'rich-text':{title:string;body:string};
 'offering-list':{title:string;description:string};
 'people-list':{title:string;description:string};
 'article-list':{title:string;description:string};
 cta:{title:string;description:string;link:Link};
}
export type SectionCopy = SectionCopyMap[SectionType];
export interface SectionReference {id:string;_template:SectionType;variant:'default';enabled:boolean;appearance:{surface:Surface}}
export interface PageCopy {sections:Record<string,SectionCopy>}
export interface PageTranslation extends Publication {meta:Meta;copy:PageCopy}
export interface Page extends Publication {contentId:string;_template:PageTemplate;slug:string;meta:Meta;sections:SectionReference[];copy:PageCopy;translations:Record<string,PageTranslation>}
export interface EditorialCopy extends Publication {title:string;description:string;body:string;seoDescription:string}
export interface Offering extends EditorialCopy {contentId:string;slug:string;translations:Record<string,EditorialCopy>}
export interface PersonCopy extends EditorialCopy {role:string}
export interface Person extends PersonCopy {contentId:string;slug:string;translations:Record<string,PersonCopy>}
export interface ArticleCopy extends EditorialCopy {publishAt:string;updatedAt?:string}
export interface Article extends ArticleCopy {contentId:string;slug:string;authorId?:string;offeringId?:string;translations:Record<string,ArticleCopy>}
export interface NavigationItem {label:string;pageId:string}
export interface SettingsCopy {brand:{name:string;tagline:string};legal:{businessName:string;privacyVersion:string;notice:string};contact:{email:string;phone:string;address:string};navigation:NavigationItem[]}
export interface SettingsTranslation {brand:{tagline:string};legal:{notice:string};contact:{address:string};navigation:Record<string,string>}
export interface Settings extends SettingsCopy {translations:Record<string,SettingsTranslation>}
export interface ContentSnapshot {settings:Settings;pages:Page[];offerings:Offering[];people:Person[];articles:Article[];now:string}
export interface Alternate {locale:string;path:string}
export interface RouteFields {path:string;alternates:Alternate[]}
export type LocalizedSection = {[K in SectionType]:Omit<SectionReference,'_template'> & {_template:K;copy:SectionCopyMap[K]}}[SectionType];
export interface LocalizedPage extends Omit<Page,'translations'|'sections'|'copy'>,RouteFields {sections:LocalizedSection[]}
export type LocalizedOffering = Omit<Offering,'translations'> & RouteFields;
export type LocalizedPerson = Omit<Person,'translations'> & RouteFields;
export type LocalizedArticle = Omit<Article,'translations'> & RouteFields;
export interface LocalizedContent {locale:string;settings:SettingsCopy;pages:LocalizedPage[];offerings:LocalizedOffering[];people:LocalizedPerson[];articles:LocalizedArticle[];feedPath:string|null}
export interface Route {kind:'page'|'offering'|'person'|'article';contentId:string;locale:string;path:string;alternates:Alternate[]}
