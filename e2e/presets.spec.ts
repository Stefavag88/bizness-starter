import {test,expect} from '@playwright/test';
for(const width of [375,768,1440])for(const locale of ['en','el'])test(`preset previews ${locale} at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});const mutations:string[]=[];
 page.on('request',r=>{if(r.method()!=='GET'&&r.method()!=='HEAD')mutations.push(r.url());});
 await page.goto('/templates');await expect(page.locator('.preset-card')).toHaveCount(5);
 await page.keyboard.press('Tab');await expect(page.locator(':focus')).toBeVisible();
 await page.locator(`a[href="/templates/trades/trades/${locale}"]`).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','trades');
 await expect(page.locator('main h1')).toHaveCount(1);
 const storage=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
 for(const path of ['', '/contact','/services','/privacy']){
  await page.goto('/templates/trades/trades/'+locale+path);await expect(page.locator('main h1')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const href of await page.evaluate(()=>Array.from(document.querySelectorAll('a[href]'),n=>n.getAttribute('href')!)))expect(href.startsWith('#')||href==='/templates'||href.startsWith('/templates/trades/trades/')).toBe(true);
 }
 await page.goto('/templates/trades/trades/'+locale+'/contact');await expect(page.locator('#preview-contact-form button[type=submit]')).toBeDisabled();
 const other=locale==='en'?'el':'en';await page.locator(`header a[hreflang="${other}"]`).click();await expect(page).toHaveURL(new RegExp('/'+other+'/contact$'));
 await page.goto('/templates/accommodation/wellness/'+locale+'/rooms');
 await page.locator(`a[href="/templates/accommodation/wellness/${locale}/rooms/illustrative-room"]`).first().click();
 await expect(page.locator('main h1')).toHaveCount(1);await expect(page.locator('html')).toHaveAttribute('data-theme','wellness');
 expect(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual(storage);expect(mutations).toEqual([]);
});
