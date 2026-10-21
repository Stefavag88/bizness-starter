import { defineConfig } from 'astro/config';
import {presetToolsEnabled} from '../../scripts/preset-tools.mjs';
import mediaIntegration from './src/integrations/media.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import { readFileSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { parseProject } from '../../packages/config/project.mjs';
import { resolvePorts } from '../../scripts/ports.mjs';
const project=parseProject(JSON.parse(readFileSync(new URL('../../project.json',import.meta.url),'utf8')));
const ports=resolvePorts();
const projectRoot=fileURLToPath(new URL('../../',import.meta.url));
const normalize=path=>path.replaceAll('\\','/');
const isContentInput=file=>{const path=normalize(file),root=normalize(projectRoot);return path.startsWith(root+'content/')||path===root+'project.json'||path.startsWith(root+'packages/design-system/themes/');};
const contentRefresh={
 name:'canonical-content-refresh',
 configureServer(server){server.watcher.add([resolve(projectRoot,'content'),resolve(projectRoot,'project.json'),resolve(projectRoot,'packages/design-system/themes')]);},
 handleHotUpdate(context){if(isContentInput(context.file)){context.server.moduleGraph.invalidateAll();context.server.ws.send({type:'full-reload'});return [];}}
};
// Watch the stable public parent so a first upload directory is discovered.
// Canonical content's existing refresh behavior remains separate.
const uploadRefresh={
 name:'section-upload-refresh',
 configureServer(server){
  const uploads=normalize(resolve(projectRoot,'apps/site/public/uploads'));
  server.watcher.add(resolve(projectRoot,'apps/site/public'));
  const refresh=file=>{const path=normalize(file);if(path===uploads||path.startsWith(uploads+'/')){server.moduleGraph.invalidateAll();server.ws.send({type:'full-reload'});}};
  for(const event of ['add','change','unlink','addDir'])server.watcher.on(event,refresh);
 },
};
// Register before Astro discovers the client graph. An empty getStaticPaths
// still emits the route's scripts/styles in nonlocal builds.
const localShowcase={
 name:'local-design-system-showcase',
 hooks:{
  'astro:config:setup':({injectRoute})=>{
   if(project.environment==='local') injectRoute({
    pattern:'/design-system',
    entrypoint:new URL('./src/showcase/DesignSystem.astro',import.meta.url),
    prerender:true,
   });
  },
 },
};
const localPresets={name:'local-business-presets',hooks:{'astro:config:setup':({injectRoute})=>{
 if(!presetToolsEnabled(projectRoot,project.environment))return;
 injectRoute({pattern:'/templates',entrypoint:new URL('./src/presets/Gallery.astro',import.meta.url),prerender:true});
 injectRoute({pattern:'/templates/[preset]/[theme]/[locale]/[...path]',entrypoint:new URL('./src/presets/Preview.astro',import.meta.url),prerender:true});
}}};
// Workers Static Assets selects the nearest literal 404.html for missing paths.
// Astro's directory format otherwise emits locale/404/index.html.
const localizedNotFound={
 name:'localized-static-not-found',
 hooks:{'astro:build:done':async({dir})=>{
  await Promise.all(project.languages.map(({code})=>copyFile(
   new URL(code+'/404/index.html',dir),new URL(code+'/404.html',dir),
  )));
 }},
};
const target=`http://127.0.0.1:${ports.worker}`;
export default defineConfig({site:project.siteUrl,output:'static',integrations:[mediaIntegration({root:projectRoot,policy:project.media.optimization}),localShowcase,localPresets,localizedNotFound],build:{inlineStylesheets:'never'},trailingSlash:'never',server:{port:ports.site,host:'127.0.0.1'},vite:{build:{assetsInlineLimit:0},define:{__PROJECT_ROOT__:JSON.stringify(projectRoot)},plugins:[contentRefresh,uploadRefresh],server:{strictPort:true,proxy:{'/api':target,'/newsletter':target,'/admin':target}}}});
