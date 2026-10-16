import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const profile=process.env.E2E_PROFILE;test.skip(!profile,'Run through pnpm test:profiles against its owned built Worker.');
test('built public/API/editor profile contracts',async({page,request})=>{
 const articles=process.env.E2E_ARTICLES==='true';
 const names=['settings','page','offering','person',...(articles?['article']:[]),...(profile==='enquiries'?[]:['campaign'])];const nativeNames=JSON.parse(readFileSync('tina/__generated__/_schema.json','utf8')).collections.map((c:any)=>c.name);expect(nativeNames).toEqual(names);expect(names.includes('campaign')).toBe(profile!=='enquiries');expect(names.includes('article')).toBe(articles);
 const generated=JSON.parse(readFileSync('wrangler.generated.json','utf8'));expect(Boolean(generated.workflows)).toBe(profile==='nurture');expect(generated.vars.SENDING_ENABLED).toBe('false');expect(generated.vars.MARKETING_ENABLED).toBe('false');
 for(const lang of ['en','el']){
  await page.goto('/'+lang);await expect(page.locator('h1')).toHaveCount(1);
  await page.goto('/'+lang+'/contact');await expect(page.locator('[name=marketingConsent]')).toHaveCount(profile==='enquiries'?0:1);
  const article=await request.get('/'+lang+'/insights/a-useful-first-question');expect(article.status()).toBe(articles?200:404);
  const feed=await request.get('/'+lang+'/feed.xml');expect(feed.status()).toBe(articles?200:404);
 }
 const newsletter=await request.get('/newsletter/confirm');expect(newsletter.status()).toBe(profile==='enquiries'?404:200);
 const health=await request.get('/api/health');expect(health.ok()).toBe(true);expect((await health.json()).profile).toBe(profile);
});
