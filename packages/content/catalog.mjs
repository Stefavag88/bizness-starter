import { localizeContent } from './localize.mjs';
import { activeRecords } from './publication.mjs';
import { publicRoutes } from './routes.mjs';
const reserved=new Set(['api','cms','admin','design-system','newsletter']);
export function validateCatalog(source,project) {
 for(const campaign of source.campaigns??[]) {
  if(!project.interests.some(interest=>interest.id===campaign.interest))throw Error('Campaign references missing interest '+campaign.interest);
  if(campaign.articleId&&!activeRecords(source,project.locale,project).articles.some(article=>article.contentId===campaign.articleId))throw Error('Campaign references unavailable published article '+campaign.articleId);
 }
 const records=[...source.pages,...source.offerings,...source.people,...source.articles,...(source.campaigns??[])];
 const ids=new Set();
 for(const record of records) {
  if(ids.has(record.contentId))throw new Error('Duplicate contentId: '+record.contentId);
  ids.add(record.contentId);
  for(const locale of Object.keys(record.translations??{}))if(!project.languages.some(l=>l.code===locale)||locale===project.locale)throw new Error(record.contentId+': unexpected translation locale '+locale);
  if(record.slug) {
   const first=record.slug.split('/')[0];
   if(reserved.has(first)||project.languages.some(l=>l.code.toLowerCase()===first.toLowerCase()))throw new Error(record.contentId+': reserved slug '+record.slug);
  }
 }
 for(const locale of Object.keys(source.settings.translations))if(!project.languages.some(l=>l.code===locale)||locale===project.locale)throw new Error('Settings: unexpected translation locale '+locale);
 const requireOne=(template)=>{
  const pages=source.pages.filter(p=>p._template===template);
  if(pages.length!==1)throw new Error('Require exactly one '+template+' page');
  return pages[0];
 };
 if(requireOne('home').slug!=='')throw new Error('Home slug must be empty');
 if(requireOne('contact').slug!=='contact')throw new Error('Contact slug must be contact');
 requireOne('offerings');if(project.articles)requireOne('insights');
 const privacy=source.pages.find(p=>p.contentId==='privacy');
 if(!privacy||privacy._template!=='standard'||privacy.slug!=='privacy')throw new Error('Protected privacy standard page is required');
 for(const page of source.pages)if(page._template!=='home'&&page.slug==='')throw new Error('Only Home may have an empty slug');
 for(const article of source.articles)for(const [field,list] of [['authorId',source.people],['offeringId',source.offerings]])
  if(article[field]&&!list.some(r=>r.contentId===article[field]))throw new Error(article.contentId+': '+field+' references missing ID '+article[field]);
 for(const nav of source.settings.navigation)
  if(!source.pages.some(p=>p.contentId===nav.pageId)&&!(nav.pageId==='insights'&&!project.articles))throw new Error('Navigation references missing pageId '+nav.pageId);
 // The same pipeline validates all publication/URL decisions, regardless of consumer.
 for(const language of project.languages)publicRoutes(localizeContent(source,language.code,project));
}
