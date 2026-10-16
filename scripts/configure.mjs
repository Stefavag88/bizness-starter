import {readFileSync,writeFileSync as writeRaw,mkdirSync,existsSync} from 'node:fs';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {createManifest} from './manifest.mjs';
import {resolvePorts} from './ports.mjs';
import {generateDesign} from './design.mjs';
const writeFileSync=(path,value)=>{const text=Buffer.isBuffer(value)?value.toString('utf8'):value;if(!existsSync(path)||readFileSync(path,'utf8')!==text)writeRaw(path,value);};
const p=parseProject(JSON.parse(readFileSync('project.json','utf8')));
const ports=resolvePorts();
const local={ports,siteUrl:`http://127.0.0.1:${ports.site}`,workerUrl:`http://127.0.0.1:${ports.worker}`,tinaUrl:`http://127.0.0.1:${ports.tina}`,datalayerUrl:`http://127.0.0.1:${ports.datalayer}`};
mkdirSync('.generated/migrations',{recursive:true});
writeFileSync('.generated/local.json',JSON.stringify(local,null,2)+'\n');
const source=readContent(process.cwd(),p);
writeFileSync('.generated/manifest.json',JSON.stringify(createManifest(source,p),null,2)+'\n');
writeFileSync('.generated/migrations/0001_initial.sql',readFileSync('migrations/0001_initial.sql'));
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
const i=p.infrastructure;
const config={name:p.name,main:'worker/index.ts',compatibility_date:'2026-10-07',compatibility_flags:['nodejs_compat'],workers_dev:false,preview_urls:false,
 assets:{directory:'apps/site/dist',binding:'ASSETS',html_handling:'drop-trailing-slash',run_worker_first:['/','/api/*','/admin','/admin/*','/cms','/cms/*','/newsletter/*',...p.languages.map(l=>'/'+l.code+'/*')],not_found_handling:'404-page'},
 d1_databases:[{binding:'DB',database_name:p.name+'-db',database_id:i.databaseId,migrations_dir:'.generated/migrations'}],
 queues:{producers:[{binding:'OUTBOUND',queue:p.name+'-outbound'}],consumers:[{queue:p.name+'-outbound',max_batch_size:10,max_concurrency:1,max_retries:3,dead_letter_queue:p.name+'-dead'}]},
 triggers:{crons:['* * * * *']},
 vars:{ENVIRONMENT:p.environment,PROFILE:p.profile,SITE_URL:p.siteUrl,LOCAL_SITE_URL:local.siteUrl,LOCAL_WORKER_URL:local.workerUrl,LOCAL_ORIGINS:JSON.stringify([local.siteUrl,local.workerUrl]),SES_REGION:i.sesRegion,SES_SENDER:i.sender,NOTIFICATION_EMAIL:i.notificationEmail,ALLOWED_RECIPIENTS:i.allowedRecipients.join(','),SES_CONFIGURATION_SET:i.sesConfigurationSet,SNS_TOPIC_ARN:i.snsTopicArn,ACCESS_ISSUER:i.accessIssuer,ACCESS_AUDIENCE:i.accessAudience,ADMIN_EMAIL:i.adminEmail,SENDING_ENABLED:String(i.sendingEnabled),MARKETING_ENABLED:String(i.marketingEnabled),SEND_INTERVAL_MS:String(i.sendIntervalMs)}};
if(p.profile==='nurture')config.workflows=[{binding:'NURTURE',name:p.name+'-welcome',class_name:'WelcomeWorkflow'}];
writeFileSync('wrangler.generated.json',JSON.stringify(config,null,2)+'\n');
// Keep the explicit configure -> structural CMS descriptor boundary.
await import('./cms-descriptor.mjs');
console.log(`Configured ${p.profile} / ${p.environment}. No cloud resources were created.`);
