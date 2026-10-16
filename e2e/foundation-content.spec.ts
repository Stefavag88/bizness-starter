import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const routes=['','about','contact','services/planning-session','insights/a-useful-first-question'];
for(const locale of ['en','el'])for(const width of [375,768,1440])for(const route of routes){
 test(`${locale}/${route} at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto(`/${locale}${route?"/"+route:""}`);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  expect(await page.locator('a a').count()).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.prose script, .prose iframe, .prose object').count()).toBe(0);
  const alternate=page.locator(`a[hreflang="${locale==='en'?'el':'en'}"]`);
  await expect(alternate).toHaveCount(1);
  await expect(alternate).toHaveAttribute('href',`/${locale==='en'?'el':'en'}${route?'/'+route:''}`);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(()=>document.activeElement?.tagName)).toBe('A');
  expect(await page.evaluate(()=>getComputedStyle(document.activeElement!).outlineStyle)).not.toBe('none');
  if([375,1440].includes(width)&&['','contact'].includes(route)){
   const audit=await new AxeBuilder({page}).analyze();
   expect(audit.violations).toEqual([]);
   await page.locator('body').click({position:{x:0,y:0}});await page.locator('astro-dev-toolbar').evaluateAll(es=>es.forEach(e=>e.remove()));
   await page.screenshot({path:`.generated/evidence/${locale}-${route||'home'}-${width}.png`,fullPage:true});
  }
 });
}
test('contact validates, focuses feedback and submits to local backend',async({page})=>{
 await page.goto('/en/contact');
 await page.locator('button[type=submit]').click();
 await expect(page.locator('[role=alert]').first()).toBeVisible();await expect(page.locator('#form-errors')).toBeFocused();
 await page.locator('[name=name]').fill('Foundation browser fixture');
 await page.locator('[name=email]').fill('browser@example.com');
 await page.locator('[name=message]').fill('Local browser verification enquiry, no external delivery.');
 await page.locator('[name=privacyAccepted]').check();
 await page.locator('button[type=submit]').click();
 await expect(page.locator('[role=status]')).toContainText(/received|thank/i);
});
