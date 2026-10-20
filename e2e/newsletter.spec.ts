import {test,expect,chromium} from '@playwright/test';
import {writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {newsletterFixture} from './helpers/newsletter-fixture';
import {scopedToken} from '../worker/security';
test.skip(!process.env.NEWSLETTER_DIRECTORY,'Owned newsletter acceptance only');
test('public newsletter surfaces, suppression and real isolated lifecycle',async({browser})=>{
 test.setTimeout(600000);const fixture=await newsletterFixture('public');const rows:any[]=[];
 try{
 await fixture.start();
 for(const locale of ['en','el'])for(const width of [375,768,1440]){
  const context=await browser.newContext({viewport:{width,height:850}});const page=await context.newPage();const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['localhost','127.0.0.1'].includes(new URL(r.url()).hostname))external.push(r.url());});
  try{await page.goto(fixture.base+'/'+locale);const dialog=page.locator('[data-newsletter-dialog]');await expect(dialog).not.toBeVisible();await expect(dialog).toBeVisible({timeout:10000});await expect(page.locator('#newsletter-modal-email')).toBeFocused();expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.locator('.brand')).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.reload();await page.waitForTimeout(5200);await expect(dialog).not.toBeVisible();await page.goto(fixture.base+'/'+(locale==='en'?'el':'en'));await page.waitForTimeout(5200);await expect(dialog).not.toBeVisible();
   await page.locator('[data-preferences-open-footer]').click();await page.locator('[data-prompts-allowed]').uncheck();await page.keyboard.press('Escape');const other=await context.newPage();await other.goto(fixture.base+'/'+locale);await other.waitForTimeout(5200);await expect(other.locator('[data-newsletter-dialog]')).not.toBeVisible();await other.close();
   await page.screenshot({path:join(fixture.directory,`${locale}-${width}.png`),fullPage:true});expect(errors).toEqual([]);expect(external).toEqual([]);rows.push({locale,width,autoDelay:true,escape:true,focusRestore:true,noOverflow:true,sharedLanguageAndTabSuppression:true});
  }finally{await context.close();}
 }
 for(const fault of ['no-js','storage-denied','corrupt','write-denied','import-failure','reduced','form-focus','background','other-dialog','contact','privacy','system']){
  const context=await browser.newContext({javaScriptEnabled:fault!=='no-js',reducedMotion:fault==='reduced'?'reduce':'no-preference'});const page=await context.newPage();
  try{
   if(fault==='storage-denied')await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Denied')}}));
   if(fault==='write-denied')await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Denied')}});
   if(fault==='corrupt')await page.addInitScript(()=>localStorage.setItem('starter:business-starter-v2:visitor:v1','{'));
   if(fault==='import-failure')await page.route('**/*visitor-experience*',route=>route.abort());
   await page.goto(fixture.base+'/en'+(fault==='contact'?'/contact':fault==='privacy'?'/privacy':fault==='system'?'/404':''));
   const dialog=page.locator('[data-newsletter-dialog]');
   if(fault==='form-focus')await page.locator('#newsletter-footer-email').focus();
   if(fault==='background')await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
   if(fault==='other-dialog')await page.locator('[data-preferences-open-footer]').click();
   await page.waitForTimeout(5500);
   if(fault==='reduced'){await expect(dialog).toBeVisible();expect(await dialog.evaluate(e=>e.getAnimations().length)).toBe(0);await page.keyboard.press('Escape');}
   else await expect(dialog).not.toBeVisible();
   if(fault==='no-js'||fault==='import-failure'){await expect(page.locator('[data-newsletter-fallback]')).toBeVisible();await expect(page.locator('.newsletter-footer form')).not.toBeVisible();}
   if(fault==='form-focus'){await page.locator('.brand').focus();await expect(dialog).toBeVisible();}
   if(fault==='background'){await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});await expect(dialog).toBeVisible({timeout:10000});}
   if(fault==='other-dialog'){await page.keyboard.press('Escape');await expect(dialog).toBeVisible();}
   rows.push({fault,passed:true});
  }finally{await context.close();}
 }
 // Actual footer submission, captured local confirmation and state transition. No intercepted API.
 const context=await browser.newContext();const page=await context.newPage();try{
 await page.goto(fixture.base+'/en');await page.locator('#newsletter-footer-email').fill('newsletter-proof@example.com');await page.locator('#newsletter-footer-consent').check();const accepted=page.waitForResponse(r=>r.url().endsWith('/api/newsletter/subscribe'));await page.locator('.newsletter-footer [data-newsletter-form] button[type=submit]').click();expect((await accepted).status()).toBe(202);await expect(page.locator('.newsletter-footer [data-newsletter-receipt]')).toBeVisible();
 const stored=await page.evaluate(()=>Object.entries(localStorage));expect(JSON.stringify(stored)).not.toContain('newsletter-proof');expect(JSON.stringify(stored)).not.toContain('requestKey');const subscribers=await fixture.sql('SELECT id,status,generation FROM subscriber');expect(subscribers).toHaveLength(1);expect(subscribers[0].status).toBe('pending');
 const mail=await(await fetch(fixture.base+'/api/local/emails')).json() as any;const captured=mail.emails.find((m:any)=>m.recipient==='newsletter-proof@example.com');expect(captured).toBeTruthy();const token=captured.text.match(/confirm\?token=([^\s]+)/)[1];const confirmed=await fetch(fixture.base+'/api/newsletter/confirm',{method:'POST',headers:{Origin:fixture.base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})});expect(confirmed.status).toBe(200);expect((await fixture.sql('SELECT status FROM subscriber'))[0].status).toBe('active');
 const duplicate=await fetch(fixture.base+'/api/newsletter/subscribe',{method:'POST',headers:{Origin:fixture.base,'Content-Type':'application/json'},body:JSON.stringify({requestKey:crypto.randomUUID(),email:'newsletter-proof@example.com',consent:true,interest:'updates',turnstileToken:'local-preview'})});expect(duplicate.status).toBe(202);
 const unsubscribe=await scopedToken({ENVIRONMENT:'local'} as any,subscribers[0].id,subscribers[0].generation,'unsubscribe');expect((await fetch(fixture.base+'/api/newsletter/unsubscribe',{method:'POST',body:new URLSearchParams({token:unsubscribe})})).status).toBe(200);expect((await fixture.sql('SELECT status FROM subscriber'))[0].status).toBe('unsubscribed');
 await fixture.sql("UPDATE subscriber SET status='suppressed'");const suppressed=await fetch(fixture.base+'/api/newsletter/subscribe',{method:'POST',headers:{Origin:fixture.base,'Content-Type':'application/json'},body:JSON.stringify({requestKey:crypto.randomUUID(),email:'newsletter-proof@example.com',consent:true,interest:'updates',turnstileToken:'local-preview'})});expect(suppressed.status).toBe(202);expect((await duplicate.json() as any).message).toBe((await suppressed.json() as any).message);await page.reload();await page.waitForTimeout(5500);await expect(page.locator('[data-newsletter-dialog]')).not.toBeVisible();rows.push({realLifecycle:'pending -> active -> unsubscribed -> suppressed',uniform202:true,personalBrowserStorage:false});
 }finally{await context.close();}
 }finally{writeFileSync(join(fixture.directory,'matrix.json'),JSON.stringify(rows,null,2));await fixture.stop();}
});

test('public live-tab preferences reset and manual signup with blocked storage',async({browser})=>{
 test.setTimeout(240000);const f=await newsletterFixture('preferences');const rows:any[]=[];
 try{await f.start();const context=await browser.newContext();try{
  const first=await context.newPage();await first.goto(f.base+'/en');await first.locator('#newsletter-footer-email').focus();await first.evaluate(()=>{(window as any).__storageEvents=0;addEventListener('storage',()=>{(window as any).__storageEvents++});localStorage.setItem('unrelated','keep');});
  const second=await context.newPage();await second.goto(f.base+'/el');await second.locator('[data-preferences-open-footer]').click();await second.locator('[data-prompts-allowed]').uncheck();await expect.poll(()=>first.evaluate(()=>(window as any).__storageEvents)).toBeGreaterThan(0);await first.locator('.brand').focus();await first.waitForTimeout(5500);await expect(first.locator('[data-newsletter-dialog]')).not.toBeVisible();
  await second.locator('[data-preferences-reset]').click();await expect(second.locator('[data-prompts-allowed]')).toBeChecked();expect(await second.evaluate(()=>localStorage.getItem('unrelated'))).toBe('keep');await expect(first.locator('[data-newsletter-dialog]')).toBeVisible();
  await first.bringToFront();await first.locator('#newsletter-modal-email').focus();for(let i=0;i<10;i++){await first.keyboard.press('Tab');const focus=await first.locator('[data-newsletter-dialog]').evaluate(e=>({inside:e.contains(document.activeElement),tag:document.activeElement?.tagName,id:document.activeElement?.id}));rows.push({tab:i,focus});expect(focus.inside||focus.tag==='BODY').toBe(true);}await first.locator('.brand').evaluate((e:HTMLElement)=>e.focus());expect(await first.locator('.brand').evaluate(e=>e===document.activeElement)).toBe(false);await first.keyboard.press('Escape');rows.push({liveStorageEvents:true,resetOwnKeyOnly:true,nativeTabCycleNeverReachesBackgroundControls:true});
 }finally{await context.close();}
 const denied=await browser.newContext();try{await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Denied')}}));const page=await denied.newPage();await page.route('**/api/newsletter/subscribe',route=>route.fulfill({status:202,contentType:'application/json',body:'{}'}));await page.goto(f.base+'/en');await page.locator('#newsletter-footer-email').fill('manual-local@example.com');await page.locator('#newsletter-footer-consent').check();await page.locator('.newsletter-footer button[type=submit]').click();await expect(page.locator('.newsletter-footer [data-newsletter-receipt]')).toBeVisible();rows.push({blockedStorageManualForm:true,apiResponseStubbedForThisCase:true});}finally{await denied.close();}
 // The renderer's modal-only fallback is also checked with JavaScript genuinely disabled.
 const owned=readFileSync(f.sourcePath,'utf8'),settings=JSON.parse(owned);settings.newsletterPrompt.footerMode='off';expect(readFileSync(f.sourcePath,'utf8')).toBe(owned);writeFileSync(f.sourcePath,JSON.stringify(settings,null,2));const nojs=await browser.newContext({javaScriptEnabled:false});try{const page=await nojs.newPage();await page.goto(f.cms+'/el');await expect(page.locator('[data-newsletter-fallback]')).toBeVisible();expect(await page.locator('[data-newsletter-fallback]').getAttribute('href')).toBe('/el/contact');rows.push({modalOnlyNoJsContact:true});}finally{await nojs.close();}
 }finally{writeFileSync(join(f.directory,'matrix.json'),JSON.stringify(rows,null,2));await f.stop();}
});

test('public cached navigation restores one signup handler and safe fallbacks',async()=>{
 test.setTimeout(240000);const f=await newsletterFixture('lifecycle');const browser=await chromium.launch({channel:'chromium',ignoreDefaultArgs:['--disable-back-forward-cache']});const context=await browser.newContext();const page=await context.newPage();page.setDefaultNavigationTimeout(20000);page.setDefaultTimeout(15000);const rows:any[]=[];
 try{await f.start();await context.addInitScript(()=>{(window as any).__cacheProof={marker:crypto.randomUUID(),shows:[]};addEventListener('pageshow',event=>(window as any).__cacheProof.shows.push(event.persisted));});await page.goto(f.base+'/en');await expect(page.locator('#newsletter-footer-email')).toBeVisible();
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(page.locator('.newsletter-footer form')).toBeHidden();await expect(page.locator('[data-newsletter-fallback]')).toBeVisible();await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await expect(page.locator('#newsletter-footer-email')).toBeVisible();
 const cdp=await context.newCDPSession(page);await cdp.send('Page.enable');cdp.on('Page.backForwardCacheNotUsed',event=>rows.push({cacheMiss:event}));const marker=await page.evaluate(()=>(window as any).__cacheProof.marker);await page.goto(f.base+'/en/about',{waitUntil:'domcontentloaded'});await page.evaluate(()=>{setTimeout(()=>history.back(),0)});await expect(page).toHaveURL(f.base+'/en');await expect(page.locator('#newsletter-footer-email')).toBeVisible();const proof=await page.evaluate(()=>(window as any).__cacheProof);rows.push({cacheProof:proof,originalMarker:marker});expect(proof.marker).toBe(marker);expect(proof.shows).toContain(true);
 let submissions=0;await page.route('**/api/newsletter/subscribe',route=>{submissions++;return route.fulfill({status:202,contentType:'application/json',body:'{}'});});await page.locator('#newsletter-footer-email').fill('cached-local@example.com');await page.locator('#newsletter-footer-consent').check();await page.locator('.newsletter-footer button[type=submit]').click();await expect(page.locator('.newsletter-footer [data-newsletter-receipt]')).toBeVisible();expect(submissions).toBe(1);expect(page.url()).not.toContain('email=');expect(page.url()).not.toContain('cached-local');await page.locator('[data-preferences-open-footer]').click();await expect(page.locator('[data-preferences-dialog]')).toBeVisible();rows.push({oneSubmit:true,noEmailNavigation:true,restoredPreferences:true});
 }finally{writeFileSync(join(f.directory,'matrix.json'),JSON.stringify(rows,null,2));try{await f.stop();}finally{await context.close();await browser.close();}}
});
