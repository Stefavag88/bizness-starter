import { readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readContent } from '../packages/content/read.mjs';
import { getDisabledDomainPages } from '../packages/content/domain-registry.mjs';
import { parseProject } from '../packages/config/project.mjs';
/** Validates content, then emits only developer-owned native schema metadata. */
export function createCmsDescriptor(root,project,registry) {
 const {name,starterVersion,schemaVersion,profile,articles,modules,locale,languages,siteUrl,interests}=project;
 const editorProject={name,starterVersion,schemaVersion,profile,articles,modules,locale,languages,siteUrl,interests};
 readContent(root,project,{registry});
 const disabledPages=new Set(getDisabledDomainPages(project,registry).map(page=>page.filename));
 if(!articles)disabledPages.add('insights.json');
 // Preserve legacy custom insights filenames, but never reopen a dormant Page.
 const articlePageFiles=[...new Set(['insights',...readdirSync(join(root,'content/pages'))
  .filter(file=>file.endsWith('.json')&&!disabledPages.has(file))
  .filter(file=>JSON.parse(readFileSync(join(root,'content/pages',file),'utf8').replace(/^\uFEFF/, ''))._template==='insights')
  .map(file=>file.slice(0,-5))])].sort();
 const domainPageFiles=getDisabledDomainPages(project,registry).map(page=>page.filename.slice(0,-5)).sort();
 return {project:editorProject,articlePageFiles,domainPageFiles};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 const root=process.cwd();
 const project=parseProject(JSON.parse(readFileSync(join(root,'project.json'),'utf8')));
 mkdirSync(join(root,'.generated'),{recursive:true});
 const descriptor=JSON.stringify(createCmsDescriptor(root,project));
 const file=join(root,'.generated/cms.json');
 if(!existsSync(file)||readFileSync(file,'utf8')!==descriptor)writeFileSync(file,descriptor);
}
