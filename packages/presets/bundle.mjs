import {fileURLToPath} from 'node:url';
import {readPresetMedia} from './media.mjs';
import {parseProject} from '../config/project.mjs';
import {themes} from '../design-system/theme.mjs';
import {normalizePageDocument,normalizeSettingsDocument} from '../content/documents.mjs';
import {offeringSchema,personSchema,articleSchema,campaignSchema} from '../content/schemas.mjs';
import {roomSchema} from '../domains/rooms/contract.mjs';
import {validateCatalog} from '../content/catalog.mjs';
import {localizeContent} from '../content/localize.mjs';
import {publicRoutes} from '../content/routes.mjs';
import {presetCatalog} from './catalog.mjs';
import neutral from './seeds/neutral.mjs';import professional from './seeds/professional-services.mjs';import trades from './seeds/trades.mjs';import accommodation from './seeds/accommodation.mjs';import studio from './seeds/studio.mjs';
const seeds={neutral,'professional-services':professional,trades,accommodation,studio};
function selectedCopy(raw,language,settings=false){
 const {translations,...base}=raw;if(language==='en')return base;
 const copy=translations?.[language];if(!copy)throw Error('Missing seed translation: '+language);
 return settings?{...base,brand:{...base.brand,...copy.brand},legal:{...base.legal,...copy.legal},contact:{...base.contact,...copy.contact},navigation:copy.navigation,...(copy.newsletterPrompt?{newsletterPrompt:{...base.newsletterPrompt,...copy.newsletterPrompt}}:{})}:{...base,...copy,publishAt:copy.publishAt};
}
export function createPresetBundle(id,options){
 const metadata=presetCatalog.find(p=>p.id===id);if(!metadata)throw Error('Unknown preset: '+id);
 const {name,languages,defaultLanguage,theme=metadata.suggestedTheme,articles=true}=options;
 if(!Array.isArray(languages)||!languages.length||languages.some(l=>!['en','el'].includes(l))||!languages.includes(defaultLanguage))throw Error('Choose en and/or el with a selected default language');
 if(!Object.hasOwn(themes,theme))throw Error('Choose an existing design theme');
 const project=parseProject({name,starterVersion:'2.0.0-dev',schemaVersion:2,profile:'enquiries',articles,locale:defaultLanguage,languages:languages.map(code=>({code,label:code==='en'?'English':'Ελληνικά'})),siteUrl:'https://example.com',environment:'local',design:{theme,density:'comfortable'},modules:{rooms:metadata.rooms,newsletterPrompt:false,visitorPreferences:false},infrastructure:{},interests:[{id:'updates',label:'Useful updates'}],legalReviewed:false,contentReviewed:false});
 const files=new Map();
 for(const [path,raw] of Object.entries(seeds[id]())){
  if(!articles&&(path.startsWith('content/articles/')||path==='content/pages/insights.json'))continue;
  const settings=path==='content/settings/site.json';const base=selectedCopy(raw,defaultLanguage,settings);
  base.translations=Object.fromEntries(languages.filter(l=>l!==defaultLanguage).map(l=>[l,l==='en'?Object.fromEntries(Object.entries(raw).filter(([k])=>(settings?['newsletterPrompt','brand','legal','contact','navigation']:['status','publishAt','meta','copy','title','description','body','seoDescription','updatedAt','role','bedDescription','imageCopy','amenityCopy']).includes(k))):raw.translations[l]]));
  if(settings){
   // Shared identity/destinations never become translated overrides when Greek is default.
   if(defaultLanguage==='el'&&base.translations.en)base.translations.en={brand:{tagline:raw.brand.tagline},legal:{notice:raw.legal.notice},contact:{address:raw.contact.address},navigation:raw.navigation,...(raw.newsletterPrompt?{newsletterPrompt:Object.fromEntries(Object.entries(raw.newsletterPrompt).filter(([k])=>['title','body','footerPrompt','emailLabel','submitLabel','consentLabel','privacyLinkLabel','dismissLabel','successTitle','successBody'].includes(k)))}:{})};
   if(!articles){base.navigation=base.navigation.filter(n=>n.pageId!=='insights');for(const t of Object.values(base.translations))t.navigation=t.navigation.filter(n=>n.pageId!=='insights');}
  }
  if(path.startsWith('content/pages/')&&!articles){const remove=d=>{if(d.copy)d.copy.sections=d.copy.sections.filter(s=>s._template!=='article-list');};base.sections=base.sections.filter(s=>s._template!=='article-list');remove(base);for(const t of Object.values(base.translations))remove(t);}
  files.set(path,new TextEncoder().encode(JSON.stringify(base,null,2)+'\n'));
 }
 for(const file of ['abstract-landscape.png','abstract-portrait.png'])files.set('apps/site/public/uploads/starter-samples/'+file,readPresetMedia(fileURLToPath(new URL('../../',import.meta.url)),file));
 return {project,files};
}
export function projectPresetBundle(bundle,{assetRoot,now=new Date()}={}){
 const {project,files}=bundle;
 for(const name of ['abstract-landscape.png','abstract-portrait.png']){const bytes=files.get('apps/site/public/uploads/starter-samples/'+name);if(!bytes||!Buffer.from(readPresetMedia(assetRoot,name)).equals(Buffer.from(bytes)))throw Error('Reviewed preset media changed: '+name);}
 const source={settings:null,pages:[],offerings:[],people:[],articles:[],campaigns:[],domains:{rooms:[]},now:now.toISOString()};
 for(const [path,bytes] of files){if(!path.startsWith('content/'))continue;const raw=JSON.parse(new TextDecoder().decode(bytes));
  if(path==='content/settings/site.json')source.settings=normalizeSettingsDocument(raw);
  else if(path.startsWith('content/pages/')){if(raw._template==='rooms'&&!project.modules.rooms)continue;source.pages.push(normalizePageDocument(raw));}
  else for(const [folder,schema] of [['offerings',offeringSchema],['people',personSchema],['articles',articleSchema],['campaigns',campaignSchema],['rooms',roomSchema]])if(path.startsWith('content/'+folder+'/')){if(folder==='rooms'){if(project.modules.rooms)source.domains.rooms.push(schema.parse(raw));}else source[folder].push(schema.parse(raw));}
 }
 validateCatalog(source,project);const contents=project.languages.map(l=>localizeContent(source,l.code,project));
 return {contents,routes:contents.flatMap(publicRoutes)};
}
