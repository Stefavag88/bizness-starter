import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { settingsSchema,pageSchema,offeringSchema,personSchema,articleSchema } from './schemas.mjs';
import { localizeContent } from './localize.mjs';
import { publicRoutes } from './routes.mjs';

const reserved=new Set(['api','cms','admin','design-system','newsletter']);
function json(file,schema) {
 try {return schema.parse(JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,'')));}
 catch(error){throw new Error(file+': '+error.message,{cause:error});}
}
export function readContent(root,project,options={}) {
 const directory=resolve(root,'content');
 const now=options.now??new Date();
 if(!Number.isFinite(now.getTime()))throw new Error('Invalid publication clock');
 const readFolder=(name,schema)=>{
  const folder=join(directory,name);
  if(!existsSync(folder))return [];
  return readdirSync(folder).filter(name=>name.endsWith('.json')).sort()
   .filter(file=>!(name==='pages'&&!project.articles&&file==='insights.json'))
   .map(file=>json(join(folder,file),schema));
 };
 const source={
  settings:json(join(directory,'settings/site.json'),settingsSchema),
  pages:readFolder('pages',pageSchema).filter(p=>project.articles||p._template!=='insights'),
  offerings:readFolder('offerings',offeringSchema),people:readFolder('people',personSchema),
  articles:project.articles?readFolder('articles',articleSchema):[],now:now.toISOString(),
 };
 const records=[...source.pages,...source.offerings,...source.people,...source.articles];
 const ids=new Set();
 for(const record of records) {
  if(ids.has(record.contentId))throw new Error('Duplicate contentId: '+record.contentId);
  ids.add(record.contentId);
  for(const locale of Object.keys(record.translations))if(!project.languages.some(l=>l.code===locale)||locale===project.locale)throw new Error(record.contentId+': unexpected translation locale '+locale);
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
 return source;
}
