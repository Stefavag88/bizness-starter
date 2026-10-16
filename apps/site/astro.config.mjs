import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { parseProject } from '../../packages/config/project.mjs';
import { resolvePorts } from '../../scripts/ports.mjs';
const project=parseProject(JSON.parse(readFileSync(new URL('../../project.json',import.meta.url),'utf8')));
const ports=resolvePorts();
const target=`http://127.0.0.1:${ports.worker}`;
export default defineConfig({site:project.siteUrl,output:'static',trailingSlash:'never',server:{port:ports.site,host:'127.0.0.1'},vite:{server:{strictPort:true,proxy:{'/api':target,'/newsletter':target,'/admin':target}}}});
