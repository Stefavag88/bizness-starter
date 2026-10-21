import {test,expect} from '@playwright/test';
test('shows honest local capacity and unavailable provider statistics',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/admin/usage');await expect(page.getByRole('heading',{name:'Usage & Capacity',exact:true})).toBeVisible();
 await expect(page.getByRole('status')).toContainText('Statistics loaded');await expect(page.locator('#usage-meta')).toContainText('Local simulation');
 await expect(page.locator('#provider-status')).toContainText('Not configured');await expect(page.locator('#history tr')).toHaveCount(7);
 const before=await request.get('/api/operations/usage');expect(before.ok()).toBe(true);expect((await before.json()).provider.metrics.every((m:any)=>m.value===null)).toBe(true);
 await page.getByLabel('From',{exact:true}).focus();await expect(page.getByLabel('From',{exact:true})).toBeFocused();
 expect(errors).toEqual([]);
});
test('fits narrow screens and preserves clear metric sections',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/admin/usage');await expect(page.getByRole('status')).toContainText('Statistics loaded');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await expect(page.getByRole('heading',{name:'Recorded application activity'})).toBeVisible();
});
test('renders warning and critical thresholds without treating missing readings as zero',async({page,request})=>{
 const r=await request.get('/api/operations/usage'),fixture=await r.json();fixture.admission={configured:true,status:'available',limit:100,reserve:10,used:70,marketingUsed:60,remaining:30};
 await page.route('**/api/operations/usage?*',route=>route.fulfill({json:fixture}));await page.goto('/admin/usage');
 await expect(page.locator('[data-level="warning"]')).toContainText('70.0% used');
 fixture.admission.used=85;fixture.admission.remaining=15;await page.reload();await expect(page.locator('[data-level="critical"]')).toContainText('85.0% used');
 await expect(page.locator('#provider')).toContainText('Not configured');
});
