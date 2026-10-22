import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync,cpSync,lstatSync} from 'node:fs';
import {resolve,join,dirname,basename,extname,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {initializeProject} from './initialize/initialize.mjs';
import {runOwnedCommand} from './owned-command.mjs';
import {sanitizedBuildEnv,regularBytes,sha256} from './deployment/release-inputs.mjs';
import {verifyReleaseArtifact} from './deployment/release-artifact.mjs';
import {planReleaseCommand} from './deployment/release-command.mjs';
import {deploymentIdentity} from '../packages/config/deployment-identity.mjs';
const root=process.cwd(),evidence=resolve('.generated/evidence/releases');mkdirSync(evidence,{recursive:true});
if(process.argv.slice(2).filter(v=>v!=='--').length)throw Error('Release rehearsal accepts no arguments');
const pnpm=process.env.npm_execpath;if(!pnpm)throw Error('Use pnpm test:release');
const destination=resolve(root,'..','.release-client-'+randomUUID().replaceAll('-',''));
if(dirname(destination)!==resolve(root,'..')||!basename(destination).startsWith('.release-client-'))throw Error('Invalid owned release fixture destination');
const before=sha256(readFileSync('project.json'));
const report={format:1,destination,passed:false,commands:[],browser:[],artifact:null};const save=()=>writeFileSync(join(evidence,'report.json'),JSON.stringify(report,null,2)+'\n');save();
await initializeProject({source:root,options:{preset:'neutral',name:'release-rehearsal',destination,languages:['en','el'],defaultLanguage:'en'}});
console.log('Independent release fixture created: '+destination);
const env=sanitizedBuildEnv(process.env,destination);for(const dir of [env.HOME,env.APPDATA,env.LOCALAPPDATA,env.XDG_CONFIG_HOME,env.TEMP])mkdirSync(dir,{recursive:true});writeFileSync(env.npm_config_userconfig,'');writeFileSync(env.npm_config_globalconfig,'');
const command=async(name,args)=>{const log=join(evidence,name+'.log');writeFileSync(log,'');const {appendFileSync}=await import('node:fs');const result=await runOwnedCommand(process.execPath,[pnpm,...args],{cwd:destination,env,timeoutMs:900000,onOutput:text=>appendFileSync(log,text)});report.commands.push({name,args,passed:true});save();return result;};
try{
 await command('client-install',['install','--frozen-lockfile']);await command('client-test',['test']);
 const target=JSON.parse(readFileSync(join(destination,'deployment.production.example.json'),'utf8'));target.siteUrl='https://δοκιμή.example/';target.infrastructure.turnstileSiteKey='public-key';writeFileSync(join(destination,'rehearsal-target.json'),JSON.stringify(target,null,2)+'\n');
 const built=await command('candidate',['release:build','--','--target','production','--config','rehearsal-target.json']);
 const match=built.stdout.match(/"artifact":\s*"((?:\\.|[^"\\])*)"/);assert.ok(match,'Build must print its artifact path');const artifact=JSON.parse('"'+match[1]+'"');report.artifact=artifact;save();
 assert.ok(artifact.startsWith(join(destination,'.generated/releases')+sep));
 const manifest=verifyReleaseArtifact(artifact);assert.equal(manifest.status,'blocked');assert.equal(manifest.cms,'not_built');assert.equal(manifest.sourceRevision,null);
 assert.ok(!existsSync(join(artifact,'assets/cms'))&&!existsSync(join(artifact,'assets/templates'))&&!existsSync(join(artifact,'assets/design-system')));
 await command('candidate-verify',['release:verify','--','--artifact',artifact]);
 const options={target:'production',artifact,accountId:manifest.accountId,databaseId:manifest.databaseId};
 for(const operation of ['deploy','migrate']){const plan=planReleaseCommand(operation,options);assert.equal(plan.executable,false);writeFileSync(join(evidence,operation+'-plan.json'),JSON.stringify(plan,null,2));}
 assert.throws(()=>planReleaseCommand('deploy',{...options,execute:true}),/blocked/);
 const corrupt=join(evidence,'corrupt-'+randomUUID());cpSync(artifact,corrupt,{recursive:true,errorOnExist:true,force:false});writeFileSync(join(corrupt,'worker/index.js'),'corrupted fixture');assert.throws(()=>verifyReleaseArtifact(corrupt),/integrity/);report.corruptionRejected=true;save();
 const assets=join(artifact,'assets'),project=JSON.parse(readFileSync(join(artifact,'project.json'),'utf8')),identity=deploymentIdentity(project);
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml'};
 const server=createServer((request,response)=>{try{const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);let file=resolve(assets,'.'+pathname);if(!file.startsWith(assets+sep))throw Error('outside');if(lstatSync(file).isDirectory())file=join(file,'index.html');const path=file.slice(assets.length+1).split(sep).join('/');response.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});response.end(regularBytes(assets,path));}catch{response.writeHead(404).end();}});
 let browser;await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{
  if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync(resolve('.generated/browsers')))process.env.PLAYWRIGHT_BROWSERS_PATH=resolve('.generated/browsers');const {chromium}=await import('@playwright/test');browser=await chromium.launch({headless:true});
  const base='http://127.0.0.1:'+server.address().port;
  for(const locale of ['en','el'])for(const width of [375,1440]){
   const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   for(const path of ['/'+locale,'/'+locale+'/contact']){assert.equal((await page.goto(base+path)).status(),200);assert.deepEqual(JSON.parse(await page.locator('meta[name="starter-deployment"]').getAttribute('content')),identity);assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),new URL(path,project.siteUrl).href);assert.ok(await page.locator('h1').isVisible());}
   await page.screenshot({path:join(evidence,locale+'-'+width+'.png'),fullPage:true});assert.deepEqual(errors,[]);report.browser.push({locale,width,passed:true});await page.close();save();
  }
 }finally{if(browser)await browser.close();await new Promise((done,reject)=>server.close(error=>error?reject(error):done()));}
 assert.equal(sha256(readFileSync(join(root,'project.json'))),before);report.passed=true;save();console.log('Release rehearsal passed: '+artifact);
}catch(error){report.error=error.message;save();throw error;}
