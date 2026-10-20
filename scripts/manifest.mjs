import {getAcceptedEnquiryContexts} from '../packages/content/enquiry-contexts.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {publicRoutes} from '../packages/content/routes.mjs';
import {plainText} from '../packages/content/rich-text.mjs';
export function createManifest(source,project){
 const byLocale=new Map(project.languages.map(l=>[l.code,localizeContent(source,l.code,project)]));
 const content=byLocale.get(project.locale);
 // Legacy offerings and generic enquiry acceptance preserve the public locale union.
 const localized=[content,...project.languages.filter(l=>l.code!==project.locale).map(l=>byLocale.get(l.code))];
 const offerings=new Map();
 for(const locale of localized)for(const offering of locale.offerings)if(!offerings.has(offering.contentId))offerings.set(offering.contentId,offering);
 return {enquiryContexts:getAcceptedEnquiryContexts(localized),offerings:[...offerings.values()].map(r=>({id:r.contentId,slug:r.slug,title:r.title,path:r.path})),
 articles:project.articles?content.articles.map(r=>({id:r.contentId,title:r.title,description:r.seoDescription||plainText(r.description,300),url:new URL(r.path,project.siteUrl).href})):[],
 campaigns:project.profile==='enquiries'?[]:source.campaigns.map(r=>({...r,id:r.contentId})),
 routes:project.languages.flatMap(l=>publicRoutes(byLocale.get(l.code)))};
}
