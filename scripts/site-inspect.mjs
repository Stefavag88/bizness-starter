import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {sectionDefinitions,sectionEnabled} from '../packages/content/section-registry.mjs';
import {SURFACES} from '../packages/content/schemas.mjs';
import {newsletterSettingsSchema} from '../packages/content/newsletter.mjs';
/** Canonical, read-only capability discovery. Never configure or print infrastructure. */
export function inspectSite(root=process.cwd()){
 root=resolve(root);const project=parseProject(JSON.parse(readFileSync(join(root,'project.json'),'utf8'))),content=readContent(root,project);
 const definitions=sectionDefinitions.filter(d=>sectionEnabled(d,project));
 const newsletter=newsletterSettingsSchema.parse(content.settings.newsletterPrompt??{}),available=project.profile!=='enquiries'&&project.modules.newsletterPrompt;
 return {application:project.name,environment:project.environment,languages:project.languages.map(l=>l.code),defaultLanguage:project.locale,profile:project.profile,modules:project.modules,
  inventories:{release:'scripts/deployment/release-files.json',initializer:existsSync(join(root,'scripts/initialize/export-manifest.json'))?'scripts/initialize/export-manifest.json':null},
  theme:{id:project.design.theme,file:'packages/design-system/themes/'+project.design.theme+'.json',exists:existsSync(join(root,'packages/design-system/themes',project.design.theme+'.json'))},
  owners:{identity:{file:'content/settings/site.json',field:'brand'},phone:{file:'content/settings/site.json',field:'contact.phone'},social:{file:'content/settings/site.json',field:'social'},navigation:{file:'content/settings/site.json',field:'navigation'},newsletter:{file:'content/settings/site.json',field:'newsletterPrompt'},features:{file:'project.json',field:'profile/modules/interests'},configurationMap:'docs/CONFIGURATION_MAP.md'},
  choices:{surfaces:[...SURFACES],sections:definitions.map(d=>({type:d.type,variants:[...d.variants]}))},
  pages:content.pages.map(p=>({id:p.contentId,slug:p.slug,template:p._template,status:p.status,sections:p.sections.map(s=>({id:s.id,type:s._template,variant:s.variant,enabled:s.enabled,surface:s.appearance.surface,variants:[...sectionDefinitions.find(d=>d.type===s._template).variants]}))})),
  newsletter:{available,enabled:available&&newsletter.enabled,modalEnabled:newsletter.modalEnabled,footerMode:newsletter.footerMode,footerModes:[...newsletterSettingsSchema.shape.footerMode.unwrap().options],configuredInterests:project.interests.map(i=>i.id),interestId:newsletter.interestId},
  scripts:Object.keys(JSON.parse(readFileSync(join(root,'package.json'),'utf8')).scripts??{}),
  note:'Read-only canonical inspection. Publication, protection, consent and delivery readiness have additional validated prerequisites; available is not authorization to enable sending.'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){try{if(process.argv.slice(2).filter(v=>v!=='--').length)throw Error('site:inspect accepts no arguments');console.log(JSON.stringify(inspectSite(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
