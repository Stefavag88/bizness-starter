import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseProject } from '../packages/config/project.mjs';
import { resolvePorts } from './ports.mjs';
const p = parseProject(JSON.parse(readFileSync('project.json','utf8')));
const ports = resolvePorts();
mkdirSync('.generated',{recursive:true});
writeFileSync('.generated/local.json', JSON.stringify({ports,siteUrl:`http://127.0.0.1:${ports.site}`,workerUrl:`http://127.0.0.1:${ports.worker}`,tinaUrl:`http://127.0.0.1:${ports.tina}`,datalayerUrl:`http://127.0.0.1:${ports.datalayer}`},null,2)+'\n');
writeFileSync('wrangler.generated.json',JSON.stringify({name:p.name,main:'worker/index.ts',compatibility_date:'2026-10-07',compatibility_flags:['nodejs_compat'],workers_dev:false,preview_urls:false,vars:{ENVIRONMENT:p.environment,PROFILE:p.profile,SENDING_ENABLED:String(p.infrastructure.sendingEnabled),MARKETING_ENABLED:String(p.infrastructure.marketingEnabled)}},null,2)+'\n');
console.log(`Configured ${p.profile} / ${p.environment}. No cloud resources were created.`);
