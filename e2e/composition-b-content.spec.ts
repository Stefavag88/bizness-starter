import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createCompositionBDocument, ownCompositionBPage } from './helpers/composition-b-fixture';
import { createOwnedMedia } from './helpers/owned-media';
test.skip(process.env.E2E_COMPOSITION_B_FIXTURE !== '1', 'Opt in against this checkout’s owned indexed dev stack.');
test.describe.configure({ mode: 'serial' });
const name = 'composition_b_public_' + Date.now();
let directory: string, owner: ReturnType<typeof ownCompositionBPage>, document: any, before: Record<string, string>;
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
function snapshot() { const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(path, e.name)) : [join(path, e.name)]); return Object.fromEntries(['project.json', ...walk('content'), ...walk('packages/design-system/themes'), ...walk('apps/site/public/uploads/starter-samples')].filter(p => !p.includes(name)).map(p => [p, hash(readFileSync(p))])); }
test.beforeAll(async () => {
    mkdirSync('.generated/composition-b-public', { recursive: true });
    directory = mkdtempSync('.generated/composition-b-public/run-');
    before = snapshot();
    owner = ownCompositionBPage(name, join(directory, 'page'));
    document = createCompositionBDocument(name, 'draft');
    owner.create(document);
    await new Promise(resolve => setTimeout(resolve, 600));
    document.status = 'published';
    document.translations.el.status = 'published';
    owner.replace(document);
    writeFileSync(join(directory, 'fixture.json'), JSON.stringify(document, null, 2));
});
test.afterAll(async () => { if (owner)
    await owner.restore(); expect(existsSync(owner.path)).toBe(false); const after = snapshot(); expect(after).toEqual(before); writeFileSync(join(directory, 'restoration.json'), JSON.stringify({ before, after, fixtureRemoved: true }, null, 2)); });
async function ready(page: any, locale = 'en') {
    await expect(async () => { await page.goto('/' + locale + '/' + name.replaceAll('_', '-')); await expect(page.locator('#gallery_featured')).toBeVisible(); await page.locator('astro-dev-toolbar').evaluateAll(es => es.forEach(e => e.remove())); }).toPass({ timeout: 30000 });
}
for (const locale of ['en', 'el'])
    for (const width of [375, 768, 1440])
        test(`${locale} all variants at ${width}`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await ready(page, locale);
            await expect(page.locator('h1')).toHaveCount(1);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            for (const id of ['faq_default', 'faq_expanded', 'steps_default', 'steps_cards', 'media_text_default', 'media_text_reversed', 'gallery_default', 'gallery_featured', 'text_only'])
                await expect(page.locator('#' + id)).toBeVisible();
            await expect(page.locator('#only_default')).toHaveCount(locale === 'en' ? 1 : 0);
            await expect(page.locator('[aria-labelledby="text_only"] img')).toHaveCount(0);
            await expect(page.locator('[aria-labelledby="text_only"] .button')).toHaveAttribute('href', '/' + locale + '/contact');
            const summaries = page.locator('[aria-labelledby="faq_default"] summary');
            await summaries.first().focus();
            await expect(summaries.first()).toBeFocused();
            expect(await summaries.first().evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
            await page.keyboard.press('Enter');
            await expect(page.locator('[aria-labelledby="faq_default"] details').first()).toHaveAttribute('open', '');
            await page.keyboard.press('Space');
            await expect(page.locator('[aria-labelledby="faq_default"] details').first()).not.toHaveAttribute('open', '');
            for (const image of await page.locator('main .section-image img').all()) {
                await image.scrollIntoViewIfNeeded();
                await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
                const info = await image.evaluate((e: HTMLImageElement) => ({ w: e.width, h: e.height, aw: Number(e.getAttribute('width')), ah: Number(e.getAttribute('height')), natural: e.naturalWidth, naturalHeight:e.naturalHeight, fit: getComputedStyle(e).objectFit, pos: getComputedStyle(e).objectPosition, ratio: getComputedStyle(e.parentElement!).aspectRatio }));
                expect(info.aw).toBeGreaterThan(0);
                expect(info.ah).toBeGreaterThan(0);
            expect(info.aw).toBe(info.natural);expect(info.ah).toBe(info.naturalHeight);
                expect(info.fit).toBe('cover');
                expect(['50% 50%', '50% 0%', '50% 100%']).toContain(info.pos);
                expect(['3 / 2', '4 / 3']).toContain(info.ratio);
            }
            const hrefs = await page.locator('main a').evaluateAll(es => es.map(e => e.getAttribute('href')!));
            for (const href of hrefs)
                expect(href).toMatch(new RegExp('^/' + locale + '(?:/|$)'));
            const ids = await page.evaluate(() => Array.from(document.querySelectorAll('[id]'), e => e.id));
            expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
            if (width !== 768) {
                const audit = await new AxeBuilder({ page }).analyze();
                writeFileSync(join(directory, locale + '-' + width + '-axe.json'), JSON.stringify(audit, null, 2));
                expect(audit.violations).toEqual([]);
                await page.screenshot({ path: join(directory, locale + '-' + width + '.png'), fullPage: true });
            }
        });
for (const locale of ['en', 'el'])
    test(locale + ' disclosures and expanded text without JavaScript', async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4330' });
        try {
            const page = await context.newPage();
            for (const width of [375, 768, 1440]) {
            await page.setViewportSize({width, height:900});
            await ready(page, locale);
            const summary = page.locator('[aria-labelledby="faq_default"] summary').first();
            await summary.focus();
            await page.keyboard.press('Enter');
            await expect(page.locator('[aria-labelledby="faq_default"] details').first().locator('.prose')).toBeVisible();
            await expect(page.locator('[aria-labelledby="faq_expanded"] .prose').first()).toBeVisible();
            await expect(page.locator('[aria-labelledby="text_only"] .prose')).toBeVisible();
            }
        }
        finally {
            await context.close();
        }
    });
test('representative new sections under all themes and densities', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/design-system');
    await expect(page.locator('#showcase-theme')).toBeEnabled();
    await page.locator('astro-dev-toolbar').evaluateAll(es => es.forEach(e => e.remove()));
    for (const [theme, density] of [['neutral', 'compact'], ['trades', 'comfortable'], ['accommodation', 'spacious'], ['wellness', 'compact']]) {
        await page.locator('#showcase-theme').selectOption(theme);
        await page.locator('#showcase-density').selectOption(density);
        await page.locator('#showcase-language').selectOption(theme === 'wellness' ? 'el' : 'en');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('html')).toHaveAttribute('data-density', density);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        for (const image of await page.locator('img:visible').all()) {
            await image.scrollIntoViewIfNeeded();
            await expect.poll(() => image.evaluate((element:HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
        }
        const audit = await new AxeBuilder({ page }).analyze();
        expect(audit.violations).toEqual([]);
        writeFileSync(join(directory, theme + '-' + density + '-axe.json'), JSON.stringify(audit, null, 2));
        await page.screenshot({ path: join(directory, theme + '-' + density + '.png'), fullPage: true });
    }
});
test('owned upload add, same-path replacement, unlink and visible unsafe/missing errors', async ({ page }) => {
    const path = 'apps/site/public/uploads/' + name + '.png';
    const src = '/uploads/' + name + '.png';
    const media = createOwnedMedia(path, join(directory, 'media'));
    expect(media.originalState().exists).toBe(false);
    const original = structuredClone(document);
    const a = readFileSync('apps/site/public/uploads/starter-samples/abstract-landscape.png'), b = readFileSync('apps/site/public/uploads/starter-samples/abstract-portrait.png');
    const schemaPath = 'tina/__generated__/_schema.json';
    const schema = hash(readFileSync(schemaPath));
    const monitor = await page.context().newPage();
    const reloads: string[] = [];
    monitor.on('websocket', socket => socket.on('framereceived', event => { const payload = String(event.payload); if (payload.includes('full-reload')) reloads.push(payload); }));
    await monitor.goto('/en');
    const waitForReload = async (operation: () => void) => { const count = reloads.length; operation(); await expect.poll(() => reloads.length).toBeGreaterThan(count); };
    try {
        document.sections.find((s: any) => s.id === 'media_text_default').media.src = src;
        owner.replace(document);
        await expect(async () => { await page.goto('/en/' + name.replaceAll('_', '-')); await expect(page.locator('body')).toContainText('cannot render image ' + src); }).toPass({ timeout: 30000 });
        await page.screenshot({path:join(directory,'missing-source.png')});
        await waitForReload(() => media.create(a));
        await ready(page);
        let image = page.locator('[aria-labelledby="media_text_default"] img');
        await expect(image).toHaveAttribute('width', '480');
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(480);
        await waitForReload(() => media.replace(b));
        await expect(async () => { await ready(page); image = page.locator('[aria-labelledby="media_text_default"] img'); await expect(image).toHaveAttribute('width', '320'); await expect(image).toHaveAttribute('height', '480'); await image.scrollIntoViewIfNeeded(); await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(320); }).toPass({ timeout: 30000 });
        await waitForReload(() => media.restore());
        await expect(async () => { await page.goto('/en/' + name.replaceAll('_', '-')); await expect(page.locator('body')).toContainText('cannot render image ' + src); }).toPass({ timeout: 30000 });
        document.sections.find((s: any) => s.id === 'media_text_default').media.src = '/uploads/%2e%2e/unsafe.png';
        owner.replace(document, { validate: false });
        await expect(async () => { await page.goto('/en/' + name.replaceAll('_', '-')); await expect(page.locator('body')).toContainText('Choose an original local PNG, JPEG or WebP upload'); }).toPass({ timeout: 30000 });
        await page.screenshot({path:join(directory,'unsafe-source.png')});
        document = structuredClone(original);
        owner.replace(document);
        await ready(page);
        expect(hash(readFileSync(schemaPath))).toBe(schema);
        writeFileSync(join(directory, 'live-media.json'), JSON.stringify({ source: src, added: { width: 480, height: 320, sha256: hash(a) }, replaced: { width: 320, height: 480, sha256: hash(b) }, unlinked: true, missingVisible: true, unsafeVisible: true, reloadMessages: reloads, schemaBefore: schema, schemaAfter: hash(readFileSync(schemaPath)) }, null, 2));
    }
    finally {
        await monitor.close();
        document = original;
        owner.replace(document);
        media.restore();
    }
});
