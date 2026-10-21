import {readFileSync,writeFileSync as writeRaw,mkdirSync,existsSync} from 'node:fs';
import {createWorkerConfig} from './worker-config.mjs';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {createManifest} from './manifest.mjs';
import {resolvePorts} from './ports.mjs';
import {generateDesign} from './design.mjs';
import {syncMigrations,withConfigureLock} from './configure-safety.mjs';
const writeFileSync=(path,value)=>{const text=Buffer.isBuffer(value)?value.toString('utf8'):value;if(!existsSync(path)||readFileSync(path,'utf8')!==text)writeRaw(path,value);};
await withConfigureLock(process.cwd(),async()=>{
const p=parseProject(JSON.parse(readFileSync('project.json','utf8')));
const ports=resolvePorts();
const local={ports,siteUrl:`http://127.0.0.1:${ports.site}`,workerUrl:`http://127.0.0.1:${ports.worker}`,tinaUrl:`http://127.0.0.1:${ports.tina}`,datalayerUrl:`http://127.0.0.1:${ports.datalayer}`};
mkdirSync('.generated/migrations',{recursive:true});
writeFileSync('.generated/local.json',JSON.stringify(local,null,2)+'\n');
const source=readContent(process.cwd(),p);
writeFileSync('.generated/manifest.json',JSON.stringify(createManifest(source,p),null,2)+'\n');
syncMigrations(process.cwd());
generateDesign(p.design);
mkdirSync('apps/site/public',{recursive:true});
const cmsConnect=p.environment==='local'?' '+local.tinaUrl+' '+local.tinaUrl.replace('127.0.0.1','localhost'):'';
writeFileSync('apps/site/public/_headers',`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
/cms/*
  X-Robots-Tag: noindex, nofollow
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.tina.io; connect-src 'self'${cmsConnect} https://*.tina.io https://*.tinajs.io; frame-src https://*.tina.io; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
`);
const config=createWorkerConfig(p,local);
writeFileSync('wrangler.generated.json',JSON.stringify(config,null,2)+'\n');
// Keep the explicit configure -> structural CMS descriptor boundary.
const {createCmsDescriptor}=await import('./cms-descriptor.mjs');
writeFileSync('.generated/cms.json',JSON.stringify(createCmsDescriptor(process.cwd(),p)));
console.log(`Configured ${p.profile} / ${p.environment}. No cloud resources were created.`);
});
