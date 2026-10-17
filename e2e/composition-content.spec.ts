import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { createCmsSources } from './helpers/cms-source-ownership';
import { normalizePageDocument } from '../packages/content/documents.mjs';

// A separate Node-owned public fixture, not a claim of native creation proof.
// Opt in only against this checkout's running public development stack.
test.skip(
  process.env.E2E_COMPOSITION_FIXTURE !== '1',
  'Opt in to owned public composition fixtures.',
);
test.describe.configure({ mode: 'serial' });
const name = 'acceptance_' + Date.now();
const fixtureSlug = name.replace('_', '-');
const path = 'content/pages/' + name + '.json';
let sources: ReturnType<typeof createCmsSources> | undefined;
let directory: string;
test.beforeAll(async () => {
  mkdirSync('.generated/composition-content', { recursive: true });
  directory = mkdtempSync('.generated/composition-content/run-');
  sources = createCmsSources([path], join(directory, 'backups'), {
    allowCreate: true,
  });
  expect(sources.originalState(path)).toEqual({ exists: false });
  sources.assertUnchanged();
  const document = JSON.parse(readFileSync('content/pages/about.json', 'utf8'));
  document._template = 'standard';
  document.contentId = name;
  document.slug = fixtureSlug;
  document.sections = document.sections.filter(
    (s: any) => s._template !== 'people-list',
  );
  document.copy.sections = document.copy.sections.filter(
    (s: any) => s._template !== 'people-list',
  );
  document.translations.el.copy.sections =
    document.translations.el.copy.sections.filter(
      (s: any) => s._template !== 'people-list',
    );
  document.sections.push({
    id: 'only_default',
    _template: 'rich-text',
    variant: 'default',
    enabled: true,
    appearance: { surface: 'muted' },
  });
  document.copy.sections.push({
    id: 'only_default',
    _template: 'rich-text',
    title: 'Optional English copy only',
    body: '**Default only** with a [contact link](/contact).',
  });
  document.status = 'draft';
  document.translations.el.status = 'draft';
  normalizePageDocument(document);
  sources.createAbsent(
    path,
    document,
    (d) => d.slug === fixtureSlug && d._template === 'standard',
  );
  writeFileSync(
    join(directory, 'fixture-draft.json'),
    JSON.stringify(document, null, 2),
  );
  // Model the native create(draft) then publish(update) flow. The existing
  // Vite refresh hook handles changes, but add-only input does not invalidate it.
  await new Promise((resolve) => setTimeout(resolve, 500));
  sources.assertUnchanged();
  document.status = 'published';
  document.translations.el.status = 'published';
  normalizePageDocument(document);
  writeFileSync(path, JSON.stringify(document, null, 2));
  sources.capture(
    path,
    document,
    (d) => d.status === 'published' && d.translations.el.status === 'published',
  );
  writeFileSync(
    join(directory, 'fixture.json'),
    JSON.stringify({ path, document }, null, 2),
  );
});
test.afterAll(async () => {
  if (!sources) return;
  await sources.restore();
  expect(existsSync(path)).toBe(false);
  writeFileSync(
    join(directory, 'restoration.json'),
    JSON.stringify({ originalAbsent: true, ownedRemoved: true }, null, 2),
  );
});
for (const locale of ['en', 'el'])
  for (const width of [375, 768, 1440])
    for (const route of ['', 'contact', 'composed']) {
      test(
        locale + '/' + (route || 'home') + ' composition at ' + width,
        async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          const slug = route === 'composed' ? fixtureSlug : route;
          const url = '/' + locale + (slug ? '/' + slug : '');
          // Input-watcher/Vite convergence is bounded; a transient HMR abort is not a successful visit.
          await expect(async () => {
            const response = await page.goto(url);
            expect(response?.status()).toBe(200);
            await expect(page.locator('h1')).toHaveCount(1);
          }).toPass({ timeout: 30000 });
          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page.locator('a a')).toHaveCount(0);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          const other = locale === 'en' ? 'el' : 'en';
          await expect(
            page.locator('a[hreflang="' + other + '"]'),
          ).toHaveAttribute('href', '/' + other + (slug ? '/' + slug : ''));
          await page.keyboard.press('Tab');
          expect(
            await page.evaluate(() => document.activeElement?.tagName),
          ).toBe('A');
          expect(
            await page.evaluate(
              () => getComputedStyle(document.activeElement!).outlineStyle,
            ),
          ).not.toBe('none');
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(/#main$/);
          if (route === 'contact') {
            await expect(page.locator('form [name="message"]')).toBeVisible();
            await expect(
              page.locator('form [name="privacyAccepted"]'),
            ).toBeVisible();
          }
          if (route === 'composed') {
            await expect(page.locator('#only_default')).toHaveCount(
              locale === 'en' ? 1 : 0,
            );
            await expect(page.locator('.prose strong').first()).toBeVisible();
            if (locale === 'en')
              await expect(
                page.getByRole('link', { name: 'contact link', exact: true }),
              ).toHaveAttribute('href', '/en/contact');
          }
          if (width === 375 || width === 1440) {
            const audit = await new AxeBuilder({ page }).analyze();
            expect(audit.violations).toEqual([]);
            await page
              .locator('astro-dev-toolbar')
              .evaluateAll((es) => es.forEach((e) => e.remove()));
            await page.screenshot({
              path: join(
                directory,
                locale + '-' + (route || 'home') + '-' + width + '.png',
              ),
              fullPage: true,
            });
          }
        },
      );
    }
for (const locale of ['en', 'el'])
  test(
    locale + ' required privacy body remains published',
    async ({ page }) => {
      await page.goto('/' + locale + '/privacy');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('#privacy_details')).toBeVisible();
      const body = page
        .locator('#privacy_details')
        .locator('..')
        .locator('.prose');
      expect((await body.innerText()).length).toBeGreaterThan(100);
    },
  );
