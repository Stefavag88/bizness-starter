import { test, expect, type Page } from '@playwright/test';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createCmsSources } from './helpers/cms-source-ownership';
import { createCmsEvidence } from './helpers/cms-evidence';
const cms = process.env.E2E_CMS_URL;
test.skip(!cms, 'Opt in against the owned native CMS stack.');
test.describe.configure({ mode: 'serial', timeout: 300000 });
let visit = 0;
test.beforeEach(({ page }) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
});
async function open(page: Page, path: string) {
  await page.goto(cms + '/cms/index.html?composition=' + ++visit + '#/' + path);
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
async function bold(page: Page, index: number, text: string) {
  const editor = page.locator('[contenteditable=true]').nth(index);
  await editor.click();
  await editor.focus();
  await expect(editor).toBeFocused();
  await page.waitForTimeout(400);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(400);
  await page.keyboard.press('Backspace');
  await page.keyboard.type(text, { delay: 10 });
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+End');
  await page.waitForTimeout(250);
  await page.keyboard.press('Control+b');
  await expect(editor.locator('strong')).toHaveText(text);
}
const hash = (p: string) =>
  createHash('sha256').update(readFileSync(p)).digest('hex');
test('Standard native creation, batched bilingual composition, public ID association and owned cleanup', async ({
  page,
  context,
}) => {
  mkdirSync('.generated/composition-cms', { recursive: true });
  const directory = mkdtempSync('.generated/composition-cms/run-'),
    evidence = createCmsEvidence(directory);
  const name = 'composition-' + Date.now(),
    path = 'content/pages/' + name + '.json',
    collisionName = name + '-collision',
    collisionPath = 'content/pages/' + collisionName + '.json',
    sources = createCmsSources(
      [path, collisionPath],
      join(directory, 'backups'),
      { allowCreate: true },
    );
  const baseline = {
    schema: hash('tina/__generated__/_schema.json'),
    descriptor: hash('.generated/cms.json'),
  };
  const saves: any[] = [];
  const site = await context.newPage();
  const schema = () =>
    JSON.parse(readFileSync('tina/__generated__/_schema.json', 'utf8'));
  async function save(
    operation: 'create' | 'update',
    predicate: (d: any) => boolean,
    targetPath = path,
  ) {
    console.log('Native save', operation, targetPath);
    sources.assertUnchanged();
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
      sources,
      targetPath,
      mutation,
      schema(),
      predicate,
    );
    saves.push({
      operation,
      mutation,
      saved: JSON.parse(readFileSync(targetPath, 'utf8')),
    });
    writeFileSync(
      join(directory, 'saves.json'),
      JSON.stringify(saves, null, 2),
    );
  }
  async function reload() {
    await open(page, 'collections/edit/page/' + name);
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
  }
  try {
    await open(page, 'collections/page');
    await page.getByRole('button', { name: 'Create New', exact: true }).click();
    await page.getByRole('menuitem', { name: 'standard', exact: true }).click();
    await page.locator('[name=contentId]').fill(name.replaceAll('-', '_'));
    await page.locator('[name=slug]').fill(name);
    await page.getByRole('textbox', { name: 'My_Document' }).fill(name);
    await page.getByRole('button', { name: 'meta', exact: true }).click();
    await page.locator('[name="meta.title"]').fill('Composition native page');
    await root(page);
    await save(
      'create',
      (d) =>
        d.status === 'draft' &&
        d._template === 'standard' &&
        d.sections.length === 1,
    );
    await reload();
    await expect(page.locator('[name=contentId]')).toHaveAttribute(
      'readonly',
      '',
    );
    await expect(page.locator('[name=slug]')).toHaveAttribute('readonly', '');
    const draft = await site.goto('/en/' + name);
    expect(draft?.status()).toBe(404);
    await expect(
      page.getByRole('checkbox', { name: 'Show section' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Remove intro', exact: true }),
    ).toBeDisabled();
    await page
      .getByRole('combobox', { name: 'Add section after intro', exact: true })
      .selectOption('rich-text');
    const first = await page
      .locator('[data-section-id]')
      .nth(1)
      .getAttribute('data-section-id');
    expect(first).toMatch(/^section_[a-f0-9]{32}$/);
    await page
      .getByRole('combobox', {
        name: 'Add section after ' + first,
        exact: true,
      })
      .selectOption('rich-text');
    const second = await page
      .locator('[data-section-id]')
      .nth(2)
      .getAttribute('data-section-id');
    for (const id of [first!, second!])
      await page
        .locator(`[data-section-id="${id}"]`)
        .getByRole('checkbox', { name: 'Show section' })
        .check();
    await page
      .getByRole('button', { name: 'Initialize Ελληνικά copy', exact: true })
      .click();
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await page.locator('[name="copy.sections.1.title"]').fill('English first');
    await page.locator('[name="copy.sections.2.title"]').fill('English second');
    await bold(page, 1, 'English first rich prose');
    await bold(page, 2, 'English second rich prose');
    await root(page);
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('button', { name: 'translations.el.meta', exact: true })
      .click();
    await page
      .locator('[name="translations.el.meta.title"]')
      .fill('Ελληνική σελίδα');
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
    for (const id of [first!, second!])
      await page
        .getByRole('button', {
          name: 'Add translation copy for ' + id,
          exact: true,
        })
        .click();
    await page
      .locator('[name="translations.el.copy.sections.1.title"]')
      .fill('Ελληνικό πρώτο');
    await page
      .locator('[name="translations.el.copy.sections.2.title"]')
      .fill('Ελληνικό δεύτερο');
    await bold(page, 1, 'Ελληνικό πρώτο κείμενο');
    await bold(page, 2, 'Ελληνικό δεύτερο κείμενο');
    await root(page);
    await save(
      'update',
      (d) => d.sections.length === 3 && d.translations.el.status === 'draft',
    );
    await reload();
    await page
      .getByRole('button', { name: 'Move ' + second + ' up', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await page
      .locator(`[data-section-id="${first}"]`)
      .getByRole('checkbox', { name: 'Show section' })
      .uncheck();
    await page
      .getByRole('combobox', { name: 'status', exact: true })
      .selectOption('published');
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'translations.el.status', exact: true })
      .selectOption('published');
    await root(page);
    await save(
      'update',
      (d) =>
        d.sections[1].id === second &&
        d.sections[2].id === first &&
        !d.sections[2].enabled,
    );
    await reload();
    for (const [language, text] of [
      ['en', 'English second rich prose'],
      ['el', 'Ελληνικό δεύτερο κείμενο'],
    ]) {
      await site.goto('/' + language + '/' + name);
      await expect(
        site.locator('[aria-labelledby="' + second + '"] strong'),
      ).toHaveText(text);
      await expect(site.locator('#' + first)).toHaveCount(0);
      await expect(site.locator('main h1')).toHaveCount(1);
      await expect(
        site
          .getByRole('navigation', {
            name: language === 'el' ? 'Κύρια πλοήγηση' : 'Main navigation',
            exact: true,
          })
          .locator('a[href="/' + language + '/' + name + '"]'),
      ).toHaveCount(0);
    }
    await page
      .getByRole('button', { name: 'Remove ' + first, exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Cancel removal', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Remove ' + first, exact: true })
      .click();
    await expect(
      page.getByText(
        'Remove this section and its copy from every translation?',
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Confirm removal', exact: true })
      .click();
    await save(
      'update',
      (d) =>
        d.sections.length === 2 &&
        [d.copy, d.translations.el.copy].every(
          (c) => !c.sections.some((s: any) => s.id === first),
        ),
    );
    await reload();
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await expect(
      page.locator('[contenteditable=true]').nth(1).locator('strong'),
    ).toHaveText('English second rich prose');
    await root(page);
    expect(hash('tina/__generated__/_schema.json')).toBe(baseline.schema);
    expect(hash('.generated/cms.json')).toBe(baseline.descriptor);
    // Explicit Node-owned fixture: same immutable ID, different registered type on another page.
    // This setup is deliberately separate from the UI-created Standard page.
    const collision = {
      contentId: collisionName.replaceAll('-', '_'),
      _template: 'standard',
      slug: collisionName,
      status: 'published',
      meta: { title: 'Independent page', seoDescription: '' },
      sections: [
        {
          id: 'intro',
          _template: 'hero',
          variant: 'default',
          enabled: true,
          appearance: { surface: 'default' },
        },
        {
          id: second,
          _template: 'cta',
          variant: 'default',
          enabled: true,
          appearance: { surface: 'default' },
        },
      ],
      copy: {
        sections: [
          {
            id: 'intro',
            _template: 'hero',
            title: 'Independent page',
            description: '',
          },
          {
            id: second,
            _template: 'cta',
            title: 'Independent CTA',
            description: 'Independent registered type.',
            link: { label: 'Contact', href: '/contact' },
          },
        ],
      },
      translations: {},
    };
    expect(sources.originalState(collisionPath)).toEqual({ exists: false });
    sources.assertUnchanged();
    sources.createAbsent(
      collisionPath,
      collision,
      (d) => d.sections[1]._template === 'cta',
    );
    await open(page, 'collections/edit/page/' + collisionName);
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await page
      .locator('[name="copy.sections.1.title"]')
      .fill('Edited independent CTA');
    await save(
      'update',
      (d) =>
        d.sections[1].id === second &&
        d.sections[1]._template === 'cta' &&
        d.copy.sections[1].title === 'Edited independent CTA',
      collisionPath,
    );
    await open(page, 'collections/edit/page/' + collisionName);
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await expect(page.locator('[name="copy.sections.1.title"]')).toHaveValue(
      'Edited independent CTA',
    );
    await site.goto('/en/' + collisionName);
    await expect(
      site.locator('[aria-labelledby="' + second + '"]'),
    ).toContainText('Edited independent CTA');
    await site.goto('/en/' + name);
    await expect(
      site.locator('[aria-labelledby="' + second + '"] strong'),
    ).toHaveText('English second rich prose');
    expect(hash('tina/__generated__/_schema.json')).toBe(baseline.schema);
    expect(hash('.generated/cms.json')).toBe(baseline.descriptor);
    writeFileSync(
      join(directory, 'acceptance.json'),
      JSON.stringify(
        {
          name,
          first,
          second,
          baseline,
          after: {
            schema: hash('tina/__generated__/_schema.json'),
            descriptor: hash('.generated/cms.json'),
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await sources.restore(() => site.close());
    expect(existsSync(path)).toBe(false);
    expect(existsSync(collisionPath)).toBe(false);
    writeFileSync(
      join(directory, 'restoration.json'),
      JSON.stringify(
        {
          original: sources.originalState(path),
          existsAfter: existsSync(path),
          backup: sources.backup,
        },
        null,
        2,
      ),
    );
  }
});

test('native required regions, read-only identity and Standard-only creation reject without source writes', async ({
  page,
}) => {
  const home = readFileSync('content/pages/home.json', 'utf8'),
    privacy = readFileSync('content/pages/privacy.json', 'utf8');
  await open(page, 'collections/edit/page/home');
  await expect(page.locator('[name=contentId]')).toHaveAttribute(
    'readonly',
    '',
  );
  await expect(page.locator('[name=slug]')).toHaveAttribute('readonly', '');
  await expect(
    page.getByRole('button', { name: 'Remove intro', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('checkbox', { name: 'Show section' }).first(),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Move intro down', exact: true }),
  ).toBeDisabled();
  await open(page, 'collections/edit/page/privacy');
  const required = page.locator('[data-section-id="privacy_details"]');
  await expect(
    required.getByRole('checkbox', { name: 'Show section' }),
  ).toBeDisabled();
  await expect(
    required.getByRole('button', {
      name: 'Remove privacy_details',
      exact: true,
    }),
  ).toBeDisabled();
  const filename = 'composition-rejected-' + Date.now();
  let mutations = 0;
  page.on('request', (r) => {
    if (
      r.method() === 'POST' &&
      (r.postData() || '').includes('createDocument')
    )
      mutations++;
  });
  await open(page, 'collections/page');
  await page.getByRole('button', { name: 'Create New', exact: true }).click();
  await page.getByRole('menuitem', { name: 'contact', exact: true }).click();
  await page.locator('[name=contentId]').fill('composition_rejected');
  await page.locator('[name=slug]').fill(filename);
  await page.getByRole('textbox', { name: 'My_Document' }).fill(filename);
  await page
    .getByRole('combobox', { name: 'status', exact: true })
    .selectOption('draft');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText(/Create a Standard page/).first()).toBeVisible();
  expect(mutations).toBe(0);
  expect(existsSync('content/pages/' + filename + '.json')).toBe(false);

  for (const invalid of ['nested', 'published', 'reserved']) {
    await open(page, 'collections/page');
    await page.getByRole('button', { name: 'Create New', exact: true }).click();
    await page.getByRole('menuitem', { name: 'standard', exact: true }).click();
    await page.locator('[name=contentId]').fill('composition_rejected');
    await page
      .locator('[name=slug]')
      .fill(invalid === 'reserved' ? '404' : filename);
    await page
      .getByRole('textbox', { name: 'My_Document' })
      .fill(invalid === 'nested' ? 'nested/' + filename : filename);
    await page.getByRole('button', { name: 'meta', exact: true }).click();
    await page.locator('[name="meta.title"]').fill('Rejected draft');
    await root(page);
    if (invalid === 'published')
      await page
        .getByRole('combobox', { name: 'status', exact: true })
        .selectOption('published');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page
        .getByText(
          invalid === 'nested'
            ? /flat collection/
            : invalid === 'published'
              ? /as drafts/
              : /reserved slug/,
        )
        .first(),
    ).toBeVisible();
    expect(mutations).toBe(0);
    expect(existsSync('content/pages/' + filename + '.json')).toBe(false);
    expect(existsSync('content/pages/nested/' + filename + '.json')).toBe(
      false,
    );
  }
  expect(readFileSync('content/pages/home.json', 'utf8')).toBe(home);
  expect(readFileSync('content/pages/privacy.json', 'utf8')).toBe(privacy);
});

test('native rejected incomplete create and initialized locale retain a correction path and unsaved rich copy', async ({
  page,
}) => {
  mkdirSync('.generated/composition-recovery', { recursive: true });
  const directory = mkdtempSync('.generated/composition-recovery/run-');
  const evidence = createCmsEvidence(directory);
  const name = 'recovery-' + Date.now();
  const path = 'content/pages/' + name + '.json';
  const sources = createCmsSources([path], join(directory, 'backups'), {
    allowCreate: true,
  });
  expect(sources.originalState(path)).toEqual({ exists: false });
  const settingsBefore = readFileSync('content/settings/site.json', 'utf8');
  const baseline = {
    schema: hash('tina/__generated__/_schema.json'),
    descriptor: hash('.generated/cms.json'),
  };
  const saves: any[] = [];
  let mutations = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      /(?:create|update)Document/.test(request.postData() || '')
    )
      mutations++;
  });
  async function save(
    operation: 'create' | 'update',
    predicate: (d: any) => boolean,
  ) {
    sources.assertUnchanged();
    const waiting = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        (response.request().postData() || '').includes(operation + 'Document'),
      { timeout: 20000 },
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await waiting;
    expect((await response.json()).errors || []).toEqual([]);
    const mutation = {
      ...response.request().postDataJSON().variables,
      operation,
    };
    await evidence.captureNative(
      sources,
      path,
      mutation,
      JSON.parse(readFileSync('tina/__generated__/_schema.json', 'utf8')),
      predicate,
    );
    saves.push({ mutation, saved: JSON.parse(readFileSync(path, 'utf8')) });
    writeFileSync(
      join(directory, 'saves.json'),
      JSON.stringify(saves, null, 2),
    );
  }
  async function rejectSave(label: string) {
    const before = mutations;
    const original = existsSync(path) ? readFileSync(path, 'utf8') : null;
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByText(/Too small: expected string/).first(),
    ).toBeVisible();
    expect(mutations).toBe(before);
    expect(existsSync(path) ? readFileSync(path, 'utf8') : null).toBe(original);
    sources.assertUnchanged();
    await page.screenshot({
      path: join(directory, label + '.png'),
      fullPage: true,
    });
    writeFileSync(
      join(directory, label + '.json'),
      JSON.stringify({
        mutationsBefore: before,
        mutationsAfter: mutations,
        unchanged: true,
      }),
    );
    await page.getByRole('button', { name: 'Close', exact: true }).click();
  }
  try {
    await open(page, 'collections/page');
    await page.getByRole('button', { name: 'Create New', exact: true }).click();
    await page.getByRole('menuitem', { name: 'standard', exact: true }).click();
    await page.locator('[name=contentId]').fill(name.replaceAll('-', '_'));
    await page.locator('[name=slug]').fill(name);
    await page.getByRole('textbox', { name: 'My_Document' }).fill(name);
    await rejectSave('incomplete-create-rejected');
    await page.getByRole('button', { name: 'meta', exact: true }).click();
    await page.locator('[name="meta.title"]').fill('Recovered native draft');
    await root(page);
    await expect(page.locator('[name=slug]')).toHaveValue(name);
    await save(
      'create',
      (d) => d.meta.title === 'Recovered native draft' && d.status === 'draft',
    );
    await open(page, 'collections/edit/page/' + name);
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await page
      .locator('[name="copy.sections.0.title"]')
      .fill('Unsaved English hero');
    await bold(page, 0, 'Unsaved English rich copy');
    await root(page);
    await page
      .getByRole('button', { name: 'Initialize Ελληνικά copy', exact: true })
      .click();
    await rejectSave('initialized-locale-rejected');
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await expect(page.locator('[name="copy.sections.0.title"]')).toHaveValue(
      'Unsaved English hero',
    );
    await expect(page.locator('[contenteditable=true] strong')).toHaveText(
      'Unsaved English rich copy',
    );
    await page.getByRole('button', { name: 'link', exact: true }).click();
    await expect(
      page.locator('[name="copy.sections.0.link.href"]'),
    ).toBeVisible();
    await root(page);
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('button', { name: 'translations.el.meta', exact: true })
      .click();
    await page
      .locator('[name="translations.el.meta.title"]')
      .fill('Διορθωμένη σελίδα');
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
    await bold(page, 0, 'Ελληνικό κείμενο');
    await root(page);
    await save(
      'update',
      (d) =>
        d.copy.sections[0].title === 'Unsaved English hero' &&
        d.copy.sections[0].description.trim() ===
          '**Unsaved English rich copy**' &&
        d.translations.el.meta.title === 'Διορθωμένη σελίδα' &&
        d.translations.el.copy.sections[0].title === 'Ελληνικός τίτλος' &&
        d.translations.el.copy.sections[0].description.trim() ===
          '**Ελληνικό κείμενο**' &&
        d.translations.el.status === 'draft',
    );
    await open(page, 'collections/edit/page/' + name);
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'copy', exact: true }).click();
    await expect(page.locator('[name="copy.sections.0.title"]')).toHaveValue(
      'Unsaved English hero',
    );
    await expect(page.locator('[contenteditable=true] strong')).toHaveText(
      'Unsaved English rich copy',
    );
    await root(page);
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('button', { name: 'translations.el.meta', exact: true })
      .click();
    await expect(
      page.locator('[name="translations.el.meta.title"]'),
    ).toHaveValue('Διορθωμένη σελίδα');
    await root(page);
    await page
      .getByRole('button', { name: 'Translations', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
    await page
      .getByRole('button', { name: 'translations.el.copy', exact: true })
      .click();
    await expect(
      page.locator('[name="translations.el.copy.sections.0.title"]'),
    ).toHaveValue('Ελληνικός τίτλος');
    await expect(page.locator('[contenteditable=true] strong')).toHaveText(
      'Ελληνικό κείμενο',
    );
    expect({
      schema: hash('tina/__generated__/_schema.json'),
      descriptor: hash('.generated/cms.json'),
    }).toEqual(baseline);
    writeFileSync(
      join(directory, 'acceptance.json'),
      JSON.stringify(
        {
          name,
          saves: saves.length,
          mutations,
          baseline,
          reloadVerified: true,
        },
        null,
        2,
      ),
    );
  } finally {
    // Settings is untouched and checked before removing the created Page destination.
    expect(readFileSync('content/settings/site.json', 'utf8')).toBe(
      settingsBefore,
    );
    await sources.restore();
    expect(existsSync(path)).toBe(false);
    writeFileSync(
      join(directory, 'restoration.json'),
      JSON.stringify(
        {
          original: sources.originalState(path),
          existsAfter: existsSync(path),
          settingsUnchanged: true,
        },
        null,
        2,
      ),
    );
  }
});
