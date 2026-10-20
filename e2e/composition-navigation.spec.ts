import { test, expect, type Page } from '@playwright/test';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
} from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createCmsSources } from './helpers/cms-source-ownership';
import { createCmsEvidence } from './helpers/cms-evidence';
const cms = process.env.E2E_CMS_URL;
test.skip(!cms, 'Opt in against the owned native CMS stack.');
test.describe.configure({ mode: 'serial', timeout: 240000 });
let visit = 0;
async function open(page: Page, path: string) {
  await page.goto(cms + '/cms/index.html?navigation=' + ++visit + '#/' + path);
  const enter = page.getByRole('button', {
    name: 'Enter Edit Mode',
    exact: true,
  });
  await expect(
    page
      .getByRole('button', { name: /^(Enter Edit Mode|Save|Create New)$/ })
      .first(),
  ).toBeVisible({ timeout: 30000 });
  if (await enter.isVisible()) await enter.click();
}
async function root(page: Page) {
  await page
    .getByRole('navigation', { name: 'breadcrumb' })
    .getByRole('button')
    .nth(1)
    .click();
}
const hash = (p: string) =>
  createHash('sha256').update(readFileSync(p)).digest('hex');
test('explicit bilingual Settings navigation uses saved Pages, shared order and locale publication with owned cleanup', async ({
  page,
  context,
}) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  mkdirSync('.generated/composition-navigation', { recursive: true });
  const directory = mkdtempSync('.generated/composition-navigation/run-'),
    evidence = createCmsEvidence(directory);
  const name = 'navigation-' + Date.now(),
    id = name.replaceAll('-', '_'),
    path = 'content/pages/' + name + '.json',
    settingsPath = 'content/settings/site.json';
  // Separate owners enforce Settings restoration before removing the created Page.
  const settings = createCmsSources(
    [settingsPath],
    join(directory, 'settings-backups'),
  );
  const pages = createCmsSources([path], join(directory, 'page-backups'), {
    allowCreate: true,
  });
  const baseline = {
    schema: hash('tina/__generated__/_schema.json'),
    descriptor: hash('.generated/cms.json'),
  };
  const saves: any[] = [];
  let mutations = 0;
  page.on('request', (r) => {
    if (
      r.method() === 'POST' &&
      /\b(createDocument|updateDocument)\b/.test(r.postData() || '')
    )
      mutations++;
  });
  const site = await context.newPage();
  async function save(
    operation: 'create' | 'update',
    target: string,
    predicate: (d: any) => boolean,
  ) {
    settings.assertUnchanged();
    pages.assertUnchanged();
    const responsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        (r.request().postData() || '').includes(operation + 'Document'),
      { timeout: 20000 },
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await responsePromise;
    expect((await response.json()).errors || []).toEqual([]);
    const mutation = {
      ...response.request().postDataJSON().variables,
      operation,
    };
    await evidence.captureNative(
      target === settingsPath ? settings : pages,
      target,
      mutation,
      JSON.parse(readFileSync('tina/__generated__/_schema.json', 'utf8')),
      predicate,
    );
    saves.push({
      operation,
      mutation,
      saved: JSON.parse(readFileSync(target, 'utf8')),
    });
    writeFileSync(
      join(directory, 'saves.json'),
      JSON.stringify(saves, null, 2),
    );
  }
  async function editPage() {
    await open(page, 'collections/edit/page/' + name);
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
  }
  async function editSettings() {
    await open(page, 'collections/edit/settings/site');
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
  }
  async function nav(locale: 'en' | 'el', expected: string[]) {
    const navigation = site.getByRole('navigation', {
      name: locale === 'el' ? 'Κύρια πλοήγηση' : 'Main navigation',
      exact: true,
    });
    await expect(async () => {
      await site.goto('/' + locale, { waitUntil: 'domcontentloaded' });
      await expect(navigation.locator('a')).toHaveText(expected);
    }).toPass({ timeout: 30000 });
    return navigation;
  }
  const original = JSON.parse(settings.originalBytes(settingsPath));
  const baseLabels = original.navigation.map((n: any) => n.label),
    elLabels = original.navigation.map(
      (n: any) =>
        original.translations.el.navigation.find(
          (t: any) => t.pageId === n.pageId,
        ).label,
    );
  try {
    await open(page, 'collections/page');
    await page.getByRole('button', { name: 'Create New', exact: true }).click();
    await page.getByRole('menuitem', { name: 'standard', exact: true }).click();
    await page.locator('[name=contentId]').fill(id);
    await page.locator('[name=slug]').fill(name);
    await page.getByRole('textbox', { name: 'My_Document' }).fill(name);
    await page.getByRole('button', { name: 'meta', exact: true }).click();
    await page
      .locator('[name="meta.title"]')
      .fill('Navigation native destination');
    await root(page);
    await save(
      'create',
      path,
      (d) => d.status === 'draft' && d.contentId === id,
    );
    await editPage();
    await page
      .getByRole('combobox', { name: 'status', exact: true })
      .selectOption('published');
    await save(
      'update',
      path,
      (d) =>
        d.status === 'published' && Object.keys(d.translations).length === 0,
    );
    await editSettings();
    // Capture every remaining native control together for selector diagnostics.
    writeFileSync(
      join(directory, 'settings-controls.txt'),
      await page.locator('body').innerText(),
    );
    await page
      .getByRole('combobox', { name: 'Saved Page destination', exact: true })
      .selectOption(id);
    await page
      .getByRole('textbox', { name: 'New navigation label', exact: true })
      .fill('Navigation test EN');
    await page
      .getByRole('button', { name: 'Add page to menu', exact: true })
      .click();
    const before = mutations;
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByText(/Too small: expected string/).first(),
    ).toBeVisible();
    expect(mutations).toBe(before);
    expect(readFileSync(settingsPath, 'utf8')).toBe(
      settings.originalBytes(settingsPath),
    );
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'el label for ' + id, exact: true }),
    ).toHaveValue('');
    await page
      .getByRole('textbox', { name: 'el label for ' + id, exact: true })
      .fill('Πλοήγηση EL προσωρινό');
    await save(
      'update',
      settingsPath,
      (d) =>
        d.navigation.at(-1).pageId === id &&
        d.translations.el.navigation.at(-1).label === 'Πλοήγηση EL προσωρινό',
    );
    await editSettings();
    await page
      .getByRole('button', { name: 'translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    writeFileSync(
      join(directory, 'translated-controls.txt'),
      await page.locator('body').innerText(),
    );
    await expect(
      page.getByRole('textbox', { name: 'Label for ' + id, exact: true }),
    ).toHaveValue('Πλοήγηση EL προσωρινό');
    await expect(
      page.getByRole('button', { name: /Move navigation/ }),
    ).toHaveCount(0);
    await page
      .getByRole('textbox', { name: 'Label for ' + id, exact: true })
      .fill('Πλοήγηση EL');
    await root(page);
    await save(
      'update',
      settingsPath,
      (d) => d.translations.el.navigation.at(-1).label === 'Πλοήγηση EL',
    );
    await editSettings();
    await expect(
      page.getByRole('textbox', { name: 'Label for ' + id, exact: true }),
    ).toHaveValue('Navigation test EN');
    const english = await nav('en', [...baseLabels, 'Navigation test EN']);
    await expect(
      english.getByRole('link', { name: 'Navigation test EN', exact: true }),
    ).toHaveAttribute('href', '/en/' + name);
    await nav('el', elLabels);
    // Explicitly initialize and publish the Page translation through native controls.
    await editPage();
    await page
      .getByRole('button', { name: 'Initialize Ελληνικά copy', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('button', { name: 'translations.el.meta', exact: true })
      .click();
    await page
      .locator('[name="translations.el.meta.title"]')
      .fill('Ελληνικός προορισμός');
    await root(page);
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('button', { name: 'translations.el.copy', exact: true })
      .click();
    await page
      .locator('[name="translations.el.copy.sections.0.title"]')
      .fill('Ελληνικός τίτλος');
    await root(page);
    await save('update', path, (d) => d.translations.el.status === 'draft');
    await nav('en', [...baseLabels, 'Navigation test EN']);
    await nav('el', elLabels);
    await editPage();
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'translations.el.status', exact: true })
      .selectOption('published');
    await root(page);
    await save('update', path, (d) => d.translations.el.status === 'published');
    const greek = await nav('el', [...elLabels, 'Πλοήγηση EL']);
    await expect(
      greek.getByRole('link', { name: 'Πλοήγηση EL', exact: true }),
    ).toHaveAttribute('href', '/el/' + name);
    await editSettings();
    await page
      .getByRole('button', {
        name: 'Move navigation ' + id + ' up',
        exact: true,
      })
      .focus();
    await page.keyboard.press('Enter');
    await save(
      'update',
      settingsPath,
      (d) => d.navigation.at(-2).pageId === id,
    );
    await editSettings();
    const reordered = [...baseLabels],
      reorderedEl = [...elLabels];
    reordered.splice(-1, 0, 'Navigation test EN');
    reorderedEl.splice(-1, 0, 'Πλοήγηση EL');
    await nav('en', reordered);
    await nav('el', reorderedEl);
    await page
      .getByRole('button', { name: 'Remove navigation ' + id, exact: true })
      .click();
    await save(
      'update',
      settingsPath,
      (d) =>
        !d.navigation.some((n: any) => n.pageId === id) &&
        !d.translations.el.navigation.some((n: any) => n.pageId === id),
    );
    await editSettings();
    await expect(
      page.getByRole('textbox', { name: 'Label for ' + id, exact: true }),
    ).toHaveCount(0);
    await nav('en', baseLabels);
    await nav('el', elLabels);
    expect(existsSync(path)).toBe(true);
    expect((await site.goto('/en/' + name))?.status()).toBe(200);
    expect((await site.goto('/el/' + name))?.status()).toBe(200);
    expect(hash('tina/__generated__/_schema.json')).toBe(baseline.schema);
    expect(hash('.generated/cms.json')).toBe(baseline.descriptor);
    writeFileSync(
      join(directory, 'pre-cleanup-checks.json'),
      JSON.stringify(
        { baseline, saves: saves.length, result: 'passed' },
        null,
        2,
      ),
    );
  } finally {
    try {
      await settings.restore();
      await pages.restore();
    } finally {
      await site.close();
    }
  }
  expect(readFileSync(settingsPath, 'utf8')).toBe(
    settings.originalBytes(settingsPath),
  );
  expect(existsSync(path)).toBe(false);
  writeFileSync(
    join(directory, 'acceptance.json'),
    JSON.stringify(
      {
        baseline,
        saves: saves.length,
        result: 'passed',
        settingsRestored: true,
        ownedPageRemoved: true,
      },
      null,
      2,
    ),
  );
});
