import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const project=JSON.parse(readFileSync('project.json','utf8'));
const themes=Object.fromEntries(['neutral','trades','accommodation','wellness'].map(name=>[name,JSON.parse(readFileSync(`packages/design-system/themes/${name}.json`,'utf8'))]));
function snapshot(){const visit=(path:string):string[]=>readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?visit(join(path,e.name)):[join(path,e.name)]);return Object.fromEntries(['project.json',...visit('content'),...visit('packages/design-system/themes')].map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')]));}
let before:ReturnType<typeof snapshot>;
test.beforeAll(()=>{before=snapshot();});
test.afterAll(()=>{const after=snapshot();expect(after).toEqual(before);mkdirSync('.generated/evidence',{recursive:true});writeFileSync('.generated/evidence/showcase-source-hashes.json',JSON.stringify({before,after},null,2));});
test.beforeEach(async({page})=>{
 const errors:string[]=[];const violations:string[]=[];const writes:string[]=[];const fonts:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method())&&/\/api\/|graphql|\/cms\//.test(r.url()))writes.push(r.method()+' '+r.url());if(r.resourceType()==='font'&&new URL(r.url()).origin!==new URL(process.env.E2E_BASE_URL||'http://127.0.0.1:4330').origin)fonts.push(r.url());});
 await page.exposeFunction('recordShowcaseCSP',(value:string)=>violations.push(value));
 await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>(window as any).recordShowcaseCSP(e.violatedDirective+':'+e.blockedURI)));
 (page as any).__showcaseEvidence={errors,violations,writes,fonts};
});
test.afterEach(async({page})=>{const evidence=(page as any).__showcaseEvidence;expect(evidence.errors).toEqual([]);expect(evidence.violations).toEqual([]);expect(evidence.writes).toEqual([]);expect(evidence.fonts).toEqual([]);});
async function ready(page:any,url='/design-system'){await page.goto(url);await expect(page.locator('#showcase-theme')).toBeEnabled();}
async function storage(page:any){return page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage},cookies:document.cookie}));}
test('bookmark, reset, history, languages, keyboard and read-only preview',async({page,context})=>{
 const response=await page.goto('/design-system?other=kept&theme=trades&density=spacious&lang=el#showcase-cards');
 expect(response?.headers()['content-security-policy']).toContain("script-src 'self'");await expect(page.locator('#showcase-theme')).toBeEnabled();const persisted=await storage(page);const cookies=await context.cookies();expect(persisted).toEqual({local:{},session:{},cookies:''});expect(cookies).toEqual([]);
 await expect(page.locator('html')).toHaveAttribute('data-theme','trades');await expect(page.locator('html')).toHaveAttribute('lang','el');await expect(page.locator('[data-sample-language="el"]').first()).toBeVisible();
 await page.reload();await expect(page.locator('#showcase-density')).toHaveValue('spacious');await page.locator('#showcase-theme').selectOption('wellness');await page.goBack();await expect(page.locator('#showcase-theme')).toHaveValue('trades');await page.goForward();await expect(page.locator('#showcase-theme')).toHaveValue('wellness');
 // Programmatic select preserves focus in the old sample until the change listener recovers it.
 await page.locator('[data-sample-language="el"] input:enabled').first().focus();await page.locator('#showcase-language').selectOption('en');await expect(page.locator('#showcase-language')).toBeFocused();await expect(page.locator('[data-sample-language="el"]').first()).toBeHidden();await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.locator('#showcase-reset').click();await expect(page.locator('#showcase-theme')).toHaveValue(project.design.theme);expect(new URL(page.url()).search).toBe('?other=kept');expect(new URL(page.url()).hash).toBe('#showcase-cards');
 await page.locator('#showcase-theme').focus();await page.keyboard.press('Tab');await expect(page.locator('#showcase-density')).toBeFocused();expect(await page.locator('#showcase-density').evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 expect(await storage(page)).toEqual(persisted);expect(await context.cookies()).toEqual(cookies);
});
test('invalid preview values resolve to configured defaults',async({page})=>{await ready(page,'/design-system?theme=unknown&density=99&lang=xx');await expect(page.locator('html')).toHaveAttribute('data-theme',project.design.theme);await expect(page.locator('html')).toHaveAttribute('data-density',project.design.density);await expect(page.locator('html')).toHaveAttribute('lang',project.locale);});
for(const width of [375,768,1440])test(`computed themes/densities, samples and overflow at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await ready(page);
 for(const [name,theme] of Object.entries(themes)){
  await page.locator('#showcase-theme').selectOption(name);
  for(const role of await page.locator('[data-color-token]').evaluateAll(es=>es.map(e=>e.getAttribute('data-color-token')!))){const hex=theme.primitiveColors[theme.semanticColors[role]];expect(await page.locator('.showcase-color-'+role).evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb('+hex.slice(1).match(/../g).map((x:string)=>parseInt(x,16)).join(', ')+')');}
  expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb('+theme.primitiveColors[theme.semanticColors.surface].slice(1).match(/../g).map((x:string)=>parseInt(x,16)).join(', ')+')');
  for(const [density,factor] of [['compact',.75],['comfortable',1],['spacious',1.25]] as const){await page.locator('#showcase-density').selectOption(density);const space=await page.locator('#showcase-foundations').evaluate(e=>parseFloat(getComputedStyle(e).paddingBlockStart));expect(space).toBeCloseTo((width<=640?theme.mobileSectionSpace:theme.sectionSpace)*factor,1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 }
 await expect(page.locator('h1')).toHaveCount(1);const ids=await page.locator('[id]').evaluateAll(es=>es.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
 for(const lang of ['en','el']){await page.locator('#showcase-language').selectOption(lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);const links=await page.locator(`[data-sample-language="${lang}"] a`).evaluateAll(es=>es.map(e=>e.getAttribute('href')!));for(const url of new Set(links)){expect(url.startsWith('/'+lang+'/')).toBe(true);expect((await page.request.get(url)).status()).toBe(200);}}
 await page.locator('#showcase-theme').selectOption('neutral');await page.locator('#showcase-density').selectOption('comfortable');
 const audit=await new AxeBuilder({page}).analyze();expect(audit.violations).toEqual([]);await page.screenshot({path:`.generated/evidence/showcase-${width}.png`,fullPage:true});
});
test('business pages ignore preview query and retain Comfortable baseline',async({page})=>{for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});for(const route of ['/en','/en/contact']){await page.goto(route);const baseline=await page.locator('section').evaluateAll(es=>es.map(e=>({padding:getComputedStyle(e).paddingBlockStart,html:e.innerHTML})));await page.goto(route+'?theme=trades&density=compact&lang=el');await expect(page.locator('html')).toHaveAttribute('data-theme',project.design.theme);await expect(page.locator('html')).toHaveAttribute('data-density','comfortable');expect(await page.locator('section').evaluateAll(es=>es.map(e=>({padding:getComputedStyle(e).paddingBlockStart,html:e.innerHTML})))).toEqual(baseline);const spacings=baseline.map(x=>parseFloat(x.padding));expect(spacings[0]).toBeCloseTo(Math.min(128,Math.max(64,width*.09)),1);}}});
test('without JavaScript configured examples remain readable and selectors disabled',async({browser})=>{const context=await browser.newContext({javaScriptEnabled:false,baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:4330'});const page=await context.newPage();try{await page.goto('/design-system?theme=trades&lang=el');for(const id of ['theme','density','language','reset'])await expect(page.locator('#showcase-'+id)).toBeDisabled();await expect(page.locator('html')).toHaveAttribute('data-theme',project.design.theme);await expect(page.locator('h1')).toBeVisible();await expect(page.locator(`[data-sample-language="${project.locale}"]`).first()).toBeVisible();await expect(page.locator('noscript p')).toContainText('Configured-default examples');}finally{await context.close();}});
