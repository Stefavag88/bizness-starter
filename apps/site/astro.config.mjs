import { defineConfig } from 'astro/config';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import { readFileSync } from 'node:fs';
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
const target=`http://127.0.0.1:${ports.worker}`;
export default defineConfig({site:project.siteUrl,output:'static',build:{inlineStylesheets:'never'},trailingSlash:'never',server:{port:ports.site,host:'127.0.0.1'},vite:{build:{assetsInlineLimit:0},define:{__PROJECT_ROOT__:JSON.stringify(projectRoot)},plugins:[contentRefresh],server:{strictPort:true,proxy:{'/api':target,'/newsletter':target,'/admin':target}}}});
