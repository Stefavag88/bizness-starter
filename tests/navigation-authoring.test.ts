import { describe, it, expect } from 'vitest';
import {
  addNavigationItem,
  moveNavigationItem,
  removeNavigationItem,
  setNavigationLabel,
} from '../packages/content/navigation.mjs';
import { settingsDocument, fixture, project } from './fixtures/content/factory';
import { normalizeSettingsDocument } from '../packages/content/documents.mjs';
import { readContent } from '../packages/content/read.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { beforeSubmit, validateCurrentSave } from '../tina/validation';
const draft = () => {
  const s = settingsDocument();
  s.translations.pt_BR = structuredClone(s.translations.el);
  s.legal.notice = {
    type: 'root',
    children: [{ type: 'p', children: [{ text: 'Legal', bold: true }] }],
  };
  return s;
};
describe('explicit shared navigation operations', () => {
  it('adds all existing locale entries with empty labels and preserves unrelated AST references', () => {
    const s = draft(),
      before = structuredClone(s);
    const next = addNavigationItem(s, { pageId: 'about', label: 'About' });
    expect(next.navigation.map((i: any) => i.pageId)).toEqual([
      'home',
      'insights',
      'about',
    ]);
    for (const key of ['el', 'pt_BR']) {
      expect(next.translations[key].navigation.at(-1)).toEqual({
        pageId: 'about',
        label: '',
      });
      expect(next.translations[key].legal).toBe(s.translations[key].legal);
    }
    expect(next.legal).toBe(s.legal);
    expect(next.legal.notice).toBe(s.legal.notice);
    expect(s).toEqual(before);
    expect(() =>
      normalizeSettingsDocument({
        ...next,
        legal: { ...next.legal, notice: 'Legal' },
      }),
    ).toThrow();
  });
  it('uses shared order for fixed labels and edits by ID even when translated order differs', () => {
    const s = draft();
    s.translations.el.navigation.reverse();
    const next = moveNavigationItem(s, 'insights', 'up');
    expect(next.navigation.map((i: any) => i.pageId)).toEqual([
      'insights',
      'home',
    ]);
    expect(next.translations).toBe(s.translations);
    const labeled = setNavigationLabel(next, 'el', 'home', 'Σπίτι');
    expect(
      labeled.translations.el.navigation.find((i: any) => i.pageId === 'home')
        ?.label,
    ).toBe('Σπίτι');
    expect(labeled.translations.pt_BR).toBe(s.translations.pt_BR);
    expect(labeled.legal).toBe(s.legal);
    const base = setNavigationLabel(labeled, null, 'home', 'Start');
    expect(base.navigation.find((i: any) => i.pageId === 'home')?.label).toBe(
      'Start',
    );
    expect(base.translations).toBe(labeled.translations);
  });
  it('removes membership in every locale while retaining unrelated values', () => {
    const s = draft(),
      next = removeNavigationItem(s, 'home');
    expect(next.navigation.map((i: any) => i.pageId)).toEqual(['insights']);
    for (const t of Object.values(next.translations) as any[])
      expect(t.navigation.map((i: any) => i.pageId)).toEqual(['insights']);
    expect(next.legal).toBe(s.legal);
    expect(s.navigation).toHaveLength(2);
  });
  it('rejects duplicate/stale IDs, malformed membership, invalid moves and unknown locales', () => {
    const s = draft();
    for (const call of [
      () => addNavigationItem(s, { pageId: 'home', label: 'Again' }),
      () => addNavigationItem(s, { pageId: 'Bad ID', label: 'Bad' }),
      () => moveNavigationItem(s, 'stale', 'up'),
      () => moveNavigationItem(s, 'home', 'up'),
      () => removeNavigationItem(s, 'stale'),
      () => setNavigationLabel(s, 'fr', 'home', 'Maison'),
      () => setNavigationLabel(s, 'el', 'stale', 'Stale'),
    ])
      expect(call).toThrow();
    for (const change of [
      (v: any) =>
        v.translations.el.navigation.push(v.translations.el.navigation[0]),
      (v: any) => v.translations.el.navigation.pop(),
      (v: any) => (v.translations.el.navigation[0].pageId = 'stale'),
    ]) {
      const v = draft();
      change(v);
      expect(() =>
        addNavigationItem(v, { pageId: 'about', label: 'About' }),
      ).toThrow();
    }
  });
  it('requires exact labels at save and returns original Settings AST containers', () => {
    let s = draft();
    delete s.translations.pt_BR;
    s = addNavigationItem(s, { pageId: 'about', label: 'About' });
    expect(() => beforeSubmit(s, 'settings', project)).toThrow();
    s = setNavigationLabel(s, 'el', 'about', 'Σχετικά');
    expect(beforeSubmit(s, 'settings', project)).toBe(s);
    expect(s.legal.notice.children[0].children[0].bold).toBe(true);
  });
  it('keeps EN published/draft EL destination visibility locale-specific without fallback', () => {
    const f = fixture();
    const source = readContent(f.root, project);
    const about = source.pages.find((p) => p.contentId === 'about')!;
    about.translations.el.status = 'draft';
    source.settings.navigation.push({ pageId: 'about', label: 'About' });
    source.settings.translations.el.navigation.about = 'Σχετικά';
    expect(
      localizeContent(source, 'en', project).settings.navigation.at(-1),
    ).toEqual({ pageId: 'about', label: 'About' });
    expect(
      localizeContent(source, 'el', project).settings.navigation.some(
        (i) => i.pageId === 'about',
      ),
    ).toBe(false);
    delete about.translations.el;
    expect(
      localizeContent(source, 'el', project).settings.navigation.some(
        (i) => i.pageId === 'about',
      ),
    ).toBe(false);
  });
});

it('requires every configured Settings locale at the detached native boundary', () => {
  const s = settingsDocument();
  delete s.translations.el;
  expect(() => beforeSubmit(s, 'settings', project)).toThrow(
    /settings translation/i,
  );
});
it('commits navigation and labels atomically without changing unrelated fields', async () => {
  const { applyNavigation, navigationLabelEntries } =
    await import('../tina/fields/navigation');
  const s = draft();
  s.translations.el.navigation.reverse();
  expect(navigationLabelEntries(s, 'el').map((i: any) => i.pageId)).toEqual([
    'home',
    'insights',
  ]);
  const changes: any[] = [];
  let batches = 0;
  const form = {
    getState: () => ({ values: s }),
    batch: (fn: () => void) => {
      batches++;
      fn();
    },
    change: (...args: any[]) => changes.push(args),
  };
  applyNavigation(form, (v: any) =>
    addNavigationItem(v, { pageId: 'about', label: 'About' }),
  );
  expect(batches).toBe(1);
  expect(changes.map((c) => c[0])).toEqual(['navigation', 'translations']);
  expect(changes[1][1].el.legal).toBe(s.translations.el.legal);
});
it('rejects a saved Settings destination absent from the complete current catalog', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { parseProject } = await import('../packages/config/project.mjs');
  const p = parseProject(JSON.parse(readFileSync('project.json', 'utf8')));
  let values = JSON.parse(readFileSync('content/settings/site.json', 'utf8'));
  values = addNavigationItem(values, {
    pageId: 'missing_page',
    label: 'Missing',
  });
  values = setNavigationLabel(values, 'el', 'missing_page', 'Λείπει');
  const folders: any = {
    settings: 'settings',
    page: 'pages',
    offering: 'offerings',
    person: 'people',
    article: 'articles',
    campaign: 'campaigns',
  };
  const cms = {
    api: {
      tina: {
        request: async (q: string) => {
          const c = /\{(\w+)Connection/.exec(q)![1];
          return {
            [c + 'Connection']: {
              edges: readdirSync('content/' + folders[c])
                .filter((f) => f.endsWith('.json'))
                .map((f) => ({
                  node: {
                    _values: JSON.parse(
                      readFileSync('content/' + folders[c] + '/' + f, 'utf8'),
                    ),
                    _sys: { relativePath: f },
                  },
                })),
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          };
        },
      },
    },
  };
  await expect(
    validateCurrentSave(values, 'settings', p, cms, {
      operation: 'update',
      relativePath: 'site.json',
    }),
  ).rejects.toThrow(/missing pageId/);
});

it('renders editable locale labels beside shared controls so a rejected save can be corrected in place', async () => {
  const { NavigationEditor } = await import('../tina/fields/navigation');
  const { createRequire } = await import('node:module');
  const { renderToStaticMarkup } = createRequire(import.meta.url)(
    'react-dom/server',
  ) as { renderToStaticMarkup: (element: unknown) => string };
  const { createElement } = await import('react');
  let values = addNavigationItem(draft(), { pageId: 'about', label: 'About' });
  const form = { getState: () => ({ values }), subscribe: () => () => {} };
  const markup = renderToStaticMarkup(
    createElement(NavigationEditor, {
      field: { name: 'navigation' },
      tinaForm: { finalForm: form },
      cms: {},
    }),
  );
  expect(markup).toContain('aria-label="el label for about"');
  expect(markup).toContain('aria-label="pt_BR label for about"');
  const translated = renderToStaticMarkup(
    createElement(NavigationEditor, {
      field: { name: 'translations.el.navigation' },
      tinaForm: { finalForm: form },
      cms: {},
    }),
  );
  expect(translated).not.toContain('Move navigation');
  expect(translated).not.toContain('Add page to menu');
  expect(translated).toContain('aria-label="Label for about"');
});


describe('editing a navigation destination', () => {
  it('replaces the shared page and every translated reference, preserving labels, order and unrelated ASTs', async () => {
    const { setNavigationDestination } = await import('../packages/content/navigation.mjs');
    const original = draft();
    original.translations.el.navigation.reverse();
    const before = structuredClone(original);
    const next = setNavigationDestination(original, 'home', 'about', ['home', 'insights', 'about']);
    expect(next.navigation).toEqual([{ pageId: 'about', label: 'Home' }, original.navigation[1]]);
    for (const key of ['el', 'pt_BR']) {
      expect(next.translations[key].navigation).toEqual(original.translations[key].navigation.map((item: any) => item.pageId === 'home' ? { ...item, pageId: 'about' } : item));
      expect(next.translations[key].legal).toBe(original.translations[key].legal);
    }
    expect(next.legal).toBe(original.legal);
    expect(original).toEqual(before);
    expect(setNavigationDestination(next, 'about', 'about', ['about'])).toBe(next);
  });
  it('rejects unavailable, duplicate, malformed and stale destinations without changing the draft', async () => {
    const { setNavigationDestination } = await import('../packages/content/navigation.mjs');
    const original = draft(), before = structuredClone(original);
    for (const [from, to] of [['home','insights'],['home','missing'],['home','Bad ID'],['stale','about']]) {
      expect(() => setNavigationDestination(original, from, to, ['home','insights','about','Bad ID'])).toThrow();
    }
    expect(original).toEqual(before);
  });
});
