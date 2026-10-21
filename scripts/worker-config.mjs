/** Shared source for local configuration and non-deployable production plans. */
export function createWorkerConfig(p,local,identity){
const i=p.infrastructure;
const resourceName=identity?identity.application+'-production':p.name;
const config={name:resourceName,main:'worker/index.ts',compatibility_date:'2026-10-07',compatibility_flags:['nodejs_compat'],workers_dev:false,preview_urls:false,
 assets:{directory:'apps/site/dist',binding:'ASSETS',html_handling:'drop-trailing-slash',run_worker_first:['/','/api','/api/*','/admin','/admin/*','/cms','/cms/*','/newsletter','/newsletter/*',...p.languages.flatMap(l=>['!/'+l.code,'!/'+l.code+'/*'])],not_found_handling:'404-page'},
 d1_databases:[{binding:'DB',database_name:resourceName+'-db',database_id:i.databaseId,migrations_dir:'.generated/migrations'}],
 queues:{producers:[{binding:'OUTBOUND',queue:resourceName+'-outbound'}],consumers:[{queue:resourceName+'-outbound',max_batch_size:1,max_concurrency:1,max_retries:3,dead_letter_queue:resourceName+'-dead'}]},
 triggers:{crons:['* * * * *']},
 vars:{PROVIDER_ANALYTICS:JSON.stringify({...i.providerAnalytics,workerName:resourceName,databaseId:i.databaseId}),RUNTIME_BUDGET:JSON.stringify(i.runtimeBudget),ENVIRONMENT:p.environment,PROFILE:p.profile,SITE_URL:p.siteUrl,LOCAL_SITE_URL:local.siteUrl,LOCAL_WORKER_URL:local.workerUrl,LOCAL_ORIGINS:JSON.stringify([local.siteUrl,local.workerUrl]),SES_REGION:i.sesRegion,SES_SENDER:i.sender,NOTIFICATION_EMAIL:i.notificationEmail,ALLOWED_RECIPIENTS:i.allowedRecipients.join(','),SES_CONFIGURATION_SET:i.sesConfigurationSet,SNS_TOPIC_ARN:i.snsTopicArn,ACCESS_ISSUER:i.accessIssuer,ACCESS_AUDIENCE:i.accessAudience,ADMIN_EMAILS:JSON.stringify(i.adminEmails),EDITOR_EMAILS:JSON.stringify(i.editorEmails),SENDING_ENABLED:String(i.sendingEnabled),MARKETING_ENABLED:String(i.marketingEnabled),SEND_INTERVAL_MS:String(i.sendIntervalMs)}};
if(p.profile==='nurture')config.workflows=[{binding:'NURTURE',name:resourceName+'-welcome',class_name:'WelcomeWorkflow'}];
if(identity){
 if(identity.application!==p.name||p.environment!=='production')throw Error('Production Worker identity does not match its project');
 config.account_id=identity.accountId;
 config.routes=[{pattern:new URL(p.siteUrl).hostname,custom_domain:true}];
 config.vars.LOCAL_SITE_URL='';config.vars.LOCAL_WORKER_URL='';config.vars.LOCAL_ORIGINS='[]';
}
return config;
}
