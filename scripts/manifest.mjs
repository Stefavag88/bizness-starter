import {localizeContent} from '../packages/content/localize.mjs';
import {publicRoutes} from '../packages/content/routes.mjs';
import {plainText} from '../packages/content/rich-text.mjs';
export function createManifest(source,project){
 const content=localizeContent(source,project.locale,project);
 return {offerings:content.offerings.map(r=>({id:r.contentId,slug:r.slug,title:r.title,path:r.path})),
 articles:project.articles?content.articles.map(r=>({id:r.contentId,title:r.title,description:r.seoDescription||plainText(r.description,300),url:project.siteUrl+r.path})):[],
 campaigns:project.profile==='enquiries'?[]:source.campaigns.map(r=>({...r,id:r.contentId})),
 routes:project.languages.flatMap(l=>publicRoutes(localizeContent(source,l.code,project)))};
}
