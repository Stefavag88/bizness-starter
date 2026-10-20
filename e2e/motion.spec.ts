import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'node:http';
import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,statSync} from 'node:fs';
import {join,resolve,dirname,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runOwnedCommand} from '../scripts/owned-command.mjs';
import {createCompositionBDocument} from './helpers/composition-b-fixture';
import {publicIndex,publicRoom} from './helpers/composition-c-acceptance';
test.skip(!process.env.MOTION_DIRECTORY,'Owned motion acceptance only');
const evidence=process.env.MOTION_DIRECTORY!;
for(const enabled of [true,false])test('detached motion '+enabled,async({browser})=>{
 test.setTimeout(300000);
 const root=join(evidence,enabled?'on':'off');mkdirSync(root,{recursive:true});
 const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
 for(const file of files){const dest=join(root,file);mkdirSync(dirname(dest),{recursive:true});copyFileSync(file,dest);}
 symlinkSync(resolve('node_modules'),join(root,'node_modules'),'junction');
 symlinkSync(resolve('apps/site/node_modules'),join(root,'apps/site/node_modules'),'junction');
 const foundation=join(root,'apps/site/src/styles/foundations.css');writeFileSync(foundation,readFileSync(foundation,'utf8')+'\n[data-motion-reveal]:has(#text_only){transform:translateX(1px)}\n');
 const p=JSON.parse(readFileSync('project.json','utf8'));p.modules={rooms:true};p.design.motion={enabled,durationMs:950,distancePx:32,staggerMs:120,interactionMs:240};
 writeFileSync(join(root,'project.json'),JSON.stringify(p));
 const write=(path:string,value:any)=>{mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),JSON.stringify(value));};
 write('content/pages/motion_sample.json',createCompositionBDocument('motion_sample'));
 write('content/pages/rooms.json',publicIndex());write('content/rooms/motion-suite.json',publicRoom('motion-suite'));
 const commands:any[]=[];
 for(const args of [['scripts/configure.mjs'],['apps/site/scripts/build.mjs']]){
  const row:any={args,started:Date.now()};commands.push(row);
  try{await runOwnedCommand(process.execPath,args,{cwd:root,timeoutMs:120000,onStart:pid=>row.pid=pid,onOutput:()=>{}});row.exitCode=0;}catch(error){row.exitCode=1;throw error;}finally{row.ended=Date.now();writeFileSync(join(root,'commands.json'),JSON.stringify(commands,null,2));}
 }
 const dist=join(root,'apps/site/dist');
 const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
 const server=createServer((req,res)=>{
  try{let path=resolve(dist,'.'+decodeURIComponent(new URL(req.url!,'http://local').pathname));if(path!==dist&&!path.startsWith(dist+sep))throw Error('outside fixture');if(existsSync(path)&&statSync(path).isDirectory())path=join(path,'index.html');if(!existsSync(path))path=join(path,'index.html');
   res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.setHeader('Content-Security-Policy',"default-src 'self';script-src 'self';style-src 'self';font-src 'self';img-src 'self' data:;connect-src 'self'");res.end(readFileSync(path));
  }catch{res.statusCode=404;res.end('Not found');}
 });
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address() as any;const base='http://127.0.0.1:'+address.port;
 const matrix:any[]=[];
 try{
 for(const locale of ['en','el'])for(const width of [375,768,1440])for(const mode of ['normal','reduced','no-js']){
  const context=await browser.newContext({viewport:{width,height:800},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  const page=await context.newPage();const requests:string[]=[];page.on('request',r=>requests.push(r.url()));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  if(mode!=='no-js')await page.addInitScript(()=>{const OriginalObserver=window.IntersectionObserver;(window as any).__observed=0;window.IntersectionObserver=class extends OriginalObserver{observe(target:Element){super.observe(target);(window as any).__observed++;}};const original=Element.prototype.animate;(window as any).__motion=[];Element.prototype.animate=function(frames,options){const a=original.call(this,frames,options);(window as any).__motion.push({tag:this.tagName,marker:this.hasAttribute('data-motion-reveal'),frames:a.effect?.getKeyframes(),timing:a.effect?.getTiming()});return a;};});
  try{
   const content=localizeContent(readContent(root,parseProject(p)),locale,parseProject(p));
   for(const path of ['', '/contact',content.offerings[0].path.slice(locale.length+1),content.articles[0].path.slice(locale.length+1),'/motion-sample','/rooms','/rooms/motion-suite']){
    await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    const response=await page.goto(base+'/'+locale+path);expect(response?.status(),path).toBe(200);
    await expect(page.locator('h1')).toBeVisible();expect(await page.locator('header [data-motion-reveal],footer [data-motion-reveal],form [data-motion-reveal],h1[data-motion-reveal]').count()).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(path==='/motion-sample'&&mode!=='no-js'){
     const targets=page.locator('[data-motion-reveal]');const target=targets.last();
     if(enabled&&mode==='normal')await expect.poll(()=>page.evaluate(()=>(window as any).__observed)).toBeGreaterThan(0);
     await target.scrollIntoViewIfNeeded();
     if(enabled&&mode==='normal'){
      await expect.poll(()=>page.evaluate(()=>(window as any).__motion.length)).toBeGreaterThan(0);
      const calls=await page.evaluate(()=>(window as any).__motion);expect(calls.every((c:any)=>c.timing.duration===950&&c.timing.delay<=300&&c.marker)).toBe(true);
      expect(calls.some((c:any)=>c.frames[0].translate==='0px 32px'||c.frames[0].translate==='0 32px')).toBe(true);
      const css=await page.locator('html').evaluate(e=>getComputedStyle(e).getPropertyValue('--motion-interaction-duration').trim());expect(css).toMatch(/^(240ms|0?\.24s)$/);
      await expect.poll(()=>page.evaluate(()=>document.getAnimations().length)).toBe(0);const count=calls.length;
      await page.evaluate(()=>scrollTo(0,0));await target.scrollIntoViewIfNeeded();expect((await page.evaluate(()=>(window as any).__motion.length))).toBe(count);
      await page.emulateMedia({reducedMotion:'reduce'});expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
     }else expect(await page.evaluate(()=>(window as any).__motion.length)).toBe(0);
    }
   }
   if(mode!=='no-js'&&width===375){const audit=await new AxeBuilder({page}).analyze();writeFileSync(join(root,`axe-${locale}-${mode}.json`),JSON.stringify(audit));expect(audit.violations).toEqual([]);}
   if(!enabled&&mode!=='no-js')expect(requests.some(url=>/\/motion\.[^/]+\.js/.test(url))).toBe(false);
   expect(errors).toEqual([]);matrix.push({locale,width,mode,noOverflow:true});
   if(mode==='normal'&&width===1440)await page.screenshot({path:join(root,locale+'.png'),fullPage:true});
  }finally{await context.close();}
 }
 if(enabled){
  const context=await browser.newContext();
  try{
   const page=await context.newPage();await page.goto(base+'/design-system');
   const toggle=page.locator('#showcase-motion');await expect(toggle).toBeEnabled();await toggle.uncheck();
   await expect(page.locator('#showcase-main')).toHaveAttribute('data-motion','off');await toggle.check();
   await page.locator('[data-sample-language="en"] .button').first().focus();
   await page.locator('#showcase-language').selectOption('el');
   for(const group of await page.locator('[data-sample-language="en"]').all())await expect(group).toBeHidden();
   await expect(page.locator('#showcase-language')).toBeFocused();
   await page.locator('#showcase-theme').selectOption('trades');await page.goBack();
   await page.locator('#showcase-reset').click();await expect(toggle).toBeChecked();
  }finally{await context.close();}
  for(const fault of ['focus','api-failure','unsupported','hash','touch']){
   const context=await browser.newContext({hasTouch:fault==='touch',viewport:{width:375,height:800}});
   try{
    const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({fault})=>{
     (window as any).__observed=0;(window as any).__attempts=0;
     const IO=window.IntersectionObserver;
     if(fault==='unsupported')(window as any).IntersectionObserver=undefined;
     else window.IntersectionObserver=class extends IO{observe(target:Element){super.observe(target);(window as any).__observed++;}};
     if(fault==='api-failure')Element.prototype.animate=function(){(window as any).__attempts++;throw Error('forced API failure');};
    },{fault});
    await page.goto(base+'/en/motion-sample'+(fault==='hash'?'#text%5Fonly':''));
    const target=page.locator('[data-motion-reveal]').last();
    if(fault==='focus'||fault==='api-failure'){
     await expect.poll(()=>page.evaluate(()=>(window as any).__observed)).toBeGreaterThan(0);
     await target.scrollIntoViewIfNeeded();
     if(fault==='focus'){
      await expect.poll(()=>target.evaluate(e=>e.getAnimations().length)).toBeGreaterThan(0);
      expect(await target.evaluate(e=>getComputedStyle(e).transform)).toBe('matrix(1, 0, 0, 1, 1, 0)');
      await target.locator('a').first().focus();expect(await target.evaluate(e=>e.getAnimations().length)).toBe(0);
     }else await expect.poll(()=>page.evaluate(()=>(window as any).__attempts)).toBeGreaterThan(0);
    }else await target.scrollIntoViewIfNeeded();
    if(fault!=='touch')expect(await target.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
    if(fault==='hash'){await page.goto(base+'/el/motion-sample#%zz');await expect(page.locator('h1')).toBeVisible();}
    if(fault==='touch')expect(await page.evaluate(()=>matchMedia('(hover:hover)').matches)).toBe(false);
    expect(errors).toEqual([]);
   }finally{await context.close();}
  }
 }
 writeFileSync(join(root,'matrix.json'),JSON.stringify(matrix,null,2));
 }finally{server.closeAllConnections();await new Promise<void>((done,reject)=>server.close(e=>e?reject(e):done()));writeFileSync(join(root,'shutdown.json'),JSON.stringify({closed:true,port:address.port,ended:new Date().toISOString()}));}
});
