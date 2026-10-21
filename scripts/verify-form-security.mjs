import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,join,extname,sep,dirname,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {initializeProject} from './initialize/initialize.mjs';
import {runOwnedCommand} from './owned-command.mjs';
import {publicAssetHeaders} from '../packages/config/security-headers.mjs';
import {copy} from '../tests/fixtures/newsletter-copy.ts';
const root=process.cwd(),evidence=resolve('.generated/evidence/form-security');mkdirSync(evidence,{recursive:true});
const args=process.argv.slice(2).filter(value=>value!=='--');if(args.some(value=>value!=='--resume-browser')||args.length>1)throw Error('Unsupported verifier arguments');
const resumed=args.includes('--resume-browser')?JSON.parse(readFileSync(join(evidence,'report.json'),'utf8')):null;
const destination=resumed?.destination??resolve(root,'..','.form-security-client-'+randomUUID().replaceAll('-',''));
if(dirname(destination)!==resolve(root,'..')||!basename(destination).startsWith('.form-security-client-'))throw Error('Unexpected disposable client path');
const report=resumed??{destination,commands:[],browser:[],passed:false};report.passed=false;report.browser=[];const save=()=>writeFileSync(join(evidence,'report.json'),JSON.stringify(report,null,2));save();
const pnpm=process.env.npm_execpath;if(!pnpm)throw Error('Run using pnpm test:form-security');
if(!resumed){
await initializeProject({source:root,options:{preset:'neutral',name:'form-security-client',destination,languages:['en','el'],defaultLanguage:'en'}});
for(const args of [['install','--frozen-lockfile'],['check'],['test'],['build'],['worker:check']]){
 const result=await runOwnedCommand(process.execPath,[pnpm,...args],{cwd:destination,timeoutMs:300000,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'},onOutput:()=>{}});
 writeFileSync(join(evidence,'client-'+args[0]+'.log'),result.stdout+result.stderr);report.commands.push({args,passed:true});save();
}
// Only this newly created disposable client is mutated. The source and user applications stay untouched.
const projectPath=join(destination,'project.json'),project=JSON.parse(readFileSync(projectPath,'utf8'));
Object.assign(project,{profile:'newsletter',environment:'production',siteUrl:'https://client.test'});Object.assign(project.modules,{newsletterPrompt:true,visitorPreferences:true});project.infrastructure.turnstileSiteKey='public-key';writeFileSync(projectPath,JSON.stringify(project,null,2));
const settingsPath=join(destination,'content/settings/site.json'),settings=JSON.parse(readFileSync(settingsPath,'utf8'));
settings.newsletterPrompt={...copy,enabled:true,modalEnabled:true,autoOpen:false,footerMode:'inline',interestId:'updates'};settings.translations.el.newsletterPrompt={...copy,title:'Χρήσιμες ενημερώσεις'};writeFileSync(settingsPath,JSON.stringify(settings,null,2));
for(const args of [['build'],['worker:check']]){const result=await runOwnedCommand(process.execPath,[pnpm,...args],{cwd:destination,timeoutMs:300000,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'},onOutput:()=>{}});writeFileSync(join(evidence,'hosted-'+args[0]+'.log'),result.stdout+result.stderr);report.commands.push({args,hostedFixture:true,passed:true});save();}
}
const fixtureProject=JSON.parse(readFileSync(join(destination,'project.json'),'utf8'));if(fixtureProject.name!=='form-security-client'||fixtureProject.environment!=='production'||fixtureProject.infrastructure.turnstileSiteKey!=='public-key')throw Error('Disposable fixture identity changed');
const assets=join(destination,'apps/site/dist');assert.ok(!existsSync(join(assets,'design-system'))&&!existsSync(join(assets,'templates')));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml'};
const headers=Object.fromEntries(publicAssetHeaders(true).trim().split('\n').slice(1).map(line=>{const at=line.indexOf(':');return [line.slice(0,at).trim(),line.slice(at+1).trim()];}));
const server=createServer((request,response)=>{
 const path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);let file=resolve(assets,'.'+path);
 if(file!==assets&&!file.startsWith(assets+sep)){response.writeHead(404).end();return;}
 if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
 if(!existsSync(file)){response.writeHead(404).end();return;}
 response.writeHead(200,{...headers,'Content-Type':types[extname(file)]??'application/octet-stream'});response.end(readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.generated/browsers');const {chromium}=await import('@playwright/test');let browser;
const providerScript=`window.__widgets={};window.__sequence=0;window.__challengeMode??='success';window.turnstile={
 render(element,options){const id='widget-'+(++window.__sequence);window.__widgets[id]={element,options};element.textContent='Security check';return id;},
 remove(id){const widget=window.__widgets[id];if(widget)widget.element.textContent='';delete window.__widgets[id];},
 execute(id){const {options}=window.__widgets[id];if(window.__challengeMode==='wait')return;setTimeout(()=>{if(window.__challengeMode==='expired')options['expired-callback']();else if(window.__challengeMode==='error')options['error-callback']();else options.callback('token-'+options.action+'-'+id);},10);}
};`;
try{
 browser=await chromium.launch({headless:true});
 for(const locale of ['en','el'])for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();const payloads=[],errors=[];let scripts=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://challenges.cloudflare.com/**',route=>{scripts++;return route.fulfill({status:200,contentType:'text/javascript',body:providerScript});});
  await page.route('**/api/contact',route=>{payloads.push({kind:'contact',...route.request().postDataJSON()});return route.fulfill({status:202,contentType:'application/json',body:JSON.stringify({message:'Received'})});});
  await page.route('**/api/newsletter/subscribe',route=>{payloads.push({kind:'subscribe',...route.request().postDataJSON()});return route.fulfill({status:202,contentType:'application/json',body:'{}'});});
  const response=await page.goto(base+'/'+locale+'/contact');assert.match(response.headers()['content-security-policy'],/script-src 'self' https:\/\/challenges.cloudflare.com/);
  await page.locator('#name').fill('Test visitor');await page.locator('#email').fill('visitor@example.com');await page.locator('#message').fill('A useful question about your available services.');await page.locator('#privacyAccepted').check();
  await page.evaluate(()=>{window.__challengeMode='expired';});await page.locator('#contact-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#form-status').textContent.includes(document.documentElement.lang==='el'?'έλεγχος':'security check'));
  assert.equal(payloads.length,0);assert.equal(await page.locator('#name').inputValue(),'Test visitor');
  await page.evaluate(()=>{window.__challengeMode='success';});await page.locator('#contact-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#contact-form').getAttribute('aria-busy')==='false'&&document.querySelector('#name').value==='');
  assert.equal(payloads.length,1);assert.match(payloads[0].turnstileToken,/^token-contact-/);assert.equal(payloads[0].privacyAccepted,true);
  // The real modal form has its own challenge state; fail it without accepting a signup.
  await page.locator('[data-newsletter-dialog]').evaluate(dialog=>dialog.showModal());await page.locator('#newsletter-modal-email').fill('modal@example.com');await page.locator('#newsletter-modal-consent').check();await page.evaluate(()=>{window.__challengeMode='error';});await page.locator('[data-newsletter-dialog] button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-newsletter-dialog] form').getAttribute('aria-busy')==='false');assert.equal(payloads.length,1);await page.locator('[data-newsletter-dialog] [data-dialog-close]').click();
  await page.locator('#newsletter-footer-email').fill('footer@example.com');await page.locator('#newsletter-footer-consent').check();await page.evaluate(()=>{window.__challengeMode='wait';});
  await page.locator('#newsletter-footer-email').evaluate(input=>{const form=input.closest('form');form.requestSubmit();form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  await page.waitForFunction(()=>Object.values(window.__widgets).some(widget=>widget.options.action==='subscribe'));assert.equal(payloads.length,1);
  await page.evaluate(()=>{const widget=Object.values(window.__widgets).find(widget=>widget.options.action==='subscribe');widget.options.callback('token-subscribe-footer');});await page.waitForFunction(()=>!document.querySelector('#newsletter-footer-email').closest('form').querySelector('[data-newsletter-receipt]').hidden);
  assert.equal(payloads.length,2);assert.equal(payloads[1].turnstileToken,'token-subscribe-footer');assert.equal(payloads[1].consent,true);assert.equal(scripts,1);assert.equal(errors.length,0,errors.join(' '));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  await page.screenshot({path:join(evidence,locale+'-'+width+'.png'),fullPage:true});report.browser.push({locale,width,passed:true});save();await context.close();
 }
 report.passed=true;save();console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(done=>server.close(done));console.log('Disposable client and evidence retained at '+destination);}
