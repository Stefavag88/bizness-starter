import { it, expect } from 'vitest';
import { normalizePageDocument } from '../packages/content/documents.mjs';
import * as ops from '../packages/content/section-items.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { nativeProjection, beforeSubmit } from '../tina/validation';
import {
  pageDocument,
  project,
  normalizedSettings,
} from './fixtures/content/factory';
const media = { src: '/uploads/example.png', crop: 'top' as const };
const ast = {
  type: 'root',
  children: [
    {
      type: 'p',
      children: [
        { text: 'Body', bold: true },
        { type: 'a', url: '/contact', children: [{ text: 'Contact' }] },
      ],
    },
  ],
};
function draft(): any {
  const v = pageDocument('about', 'about', 'about');
  v.sections = v.sections.map((s: any) => ({ ...s, enabled: true }));
  v.sections.push(
    {
      id: 'media',
      _template: 'media-text',
      variant: 'reversed',
      enabled: true,
      appearance: { surface: 'default' },
      media: { ...media },
    },
    {
      id: 'gallery',
      _template: 'gallery',
      variant: 'featured',
      enabled: true,
      appearance: { surface: 'muted' },
      items: [
        { id: 'one', media: { ...media } },
        { id: 'two', media: { src: '/uploads/two.png', crop: 'bottom' } },
      ],
    },
  );
  v.copy.sections.push(
    {
      id: 'media',
      _template: 'media-text',
      title: 'Media',
      body: 'Body',
      image: { alt: 'Image', caption: 'Caption' },
      link: { label: 'Contact', href: '/contact' },
    },
    {
      id: 'gallery',
      _template: 'gallery',
      title: 'Gallery',
      description: '',
      items: [
        { id: 'two', alt: 'Second', caption: 'Two' },
        { id: 'one', alt: 'First', caption: 'One' },
      ],
    },
  );
  const baseTranslation = structuredClone(v.translations.el);
  for (const locale of ['el', 'fr']) {
    v.translations[locale] = structuredClone(baseTranslation);
    v.translations[locale].copy.sections.push(
      ...structuredClone(v.copy.sections.slice(-2)),
    );
  }
  return v;
}
it('registers media variants and joins source/order/alt by ID across three locales', () => {
  const v = normalizePageDocument(draft());
  const settings: any = normalizedSettings();
  settings.translations.fr = structuredClone(settings.translations.el);
  const p: any = {
    ...project,
    languages: [...project.languages, { code: 'fr', label: 'French' }],
  };
  for (const locale of ['en', 'el', 'fr']) {
    const content = localizeContent(
      {
        settings,
        pages: [v],
        offerings: [],
        people: [],
        articles: [],
        campaigns: [],
        now: '2026-10-18T00:00:00Z',
      },
      locale,
      p,
    );
    const s: any = content.pages[0].sections.find((s) => s.id === 'gallery');
    expect(s.items.map((i: any) => i.id)).toEqual(['one', 'two']);
    expect(s.copy.items.map((i: any) => i.alt)).toEqual(['First', 'Second']);
  }
});
it.each([
  'missing',
  'stale',
  'blank',
  'crop',
  'variant',
  'orphan',
  'missing-image',
])('rejects invalid %s contracts even on hidden references', (kind) => {
  const v = draft();
  v.sections.at(-1).enabled = false;
  if (kind === 'missing') v.translations.el.copy.sections.at(-1).items.pop();
  if (kind === 'stale') v.copy.sections.at(-1).items[0].id = 'stale';
  if (kind === 'blank') v.copy.sections.at(-1).items[0].alt = ' ';
  if (kind === 'crop') v.sections.at(-1).items[0].media.crop = 'left';
  if (kind === 'variant') v.sections.at(-1).variant = 'cards';
  if (kind === 'orphan') delete v.sections.at(-2).media;
  if (kind === 'missing-image')
    delete v.translations.el.copy.sections.at(-2).image;
  expect(() => normalizePageDocument(v)).toThrow();
});
it('permits absent optional image and rejects a broken source syntax', () => {
  const v = draft();
  delete v.sections.at(-2).media;
  for (const c of [
    v.copy,
    ...Object.values(v.translations).map((t: any) => t.copy),
  ])
    delete c.sections.at(-2).image;
  expect(() => normalizePageDocument(v)).not.toThrow();
  v.sections.at(-2).media = {
    src: 'https://example.com/image.png',
    crop: 'center',
  };
  expect(() => normalizePageDocument(v)).toThrow();
});
it('clears optional media and image copy in one operation retaining body/CTA opaque identities', () => {
  const v = draft();
  for (const c of [
    v.copy,
    ...Object.values(v.translations).map((t: any) => t.copy),
  ]) {
    c.sections.at(-2).body = ast;
    c.sections.at(-2).link = { label: 'Contact', href: ast };
  }
  const next: any = (ops as any).setSectionMedia(v, {
    sectionId: 'media',
    media: null,
  });
  expect(next.sections.at(-2)).not.toHaveProperty('media');
  for (const [i, c] of [
    v.copy,
    ...Object.values(v.translations).map((t: any) => t.copy),
  ].entries()) {
    const n = [
      next.copy,
      ...Object.values(next.translations).map((t: any) => t.copy),
    ][i];
    expect(n.sections.at(-2)).not.toHaveProperty('image');
    expect(n.sections.at(-2).body).toBe(ast);
    expect(n.sections.at(-2).link).toBe(c.sections.at(-2).link);
  }
  expect(v.copy.sections.at(-2).image.alt).toBe('Image');
});
it('replaces gallery sources preserving identity/copy and rejects item clear', () => {
  const v = draft();
  const next: any = (ops as any).setSectionMedia(v, {
    sectionId: 'gallery',
    itemId: 'one',
    media: { ...media, src: '/uploads/replaced.webp' },
  });
  expect(next.sections.at(-1).items[0]).toEqual({
    id: 'one',
    media: { ...media, src: '/uploads/replaced.webp' },
  });
  expect(next.copy).toBe(v.copy);
  expect(next.translations).toBe(v.translations);
  expect(() =>
    (ops as any).setSectionMedia(v, {
      sectionId: 'gallery',
      itemId: 'one',
      media: null,
    }),
  ).toThrow();
  expect(() =>
    ops.addSectionItem(v, 'gallery', {
      id: 'three',
      copy: { id: 'three', alt: 'Third', caption: '' },
    }),
  ).toThrow();
});
it('projects nested captions/body safely and preserves original native values and AST identity', () => {
  const v = draft();
  delete v.translations.fr;
  v.copy.sections.at(-2).body = ast;
  v.copy.sections.at(-2).image.caption = ast;
  v.copy.sections.at(-1).items[0].caption = ast;
  expect(
    nativeProjection(v, project).copy.sections.at(-2).image.caption,
  ).toContain('**Body**');
  expect(beforeSubmit(v, 'page', project, v)).toBe(v);
  expect(v.copy.sections.at(-2).body).toBe(ast);
  expect(v.copy.sections.at(-2).image.caption).toBe(ast);
  v.copy.sections.at(-1).items[0].caption = {
    type: 'root',
    children: [{ type: 'h2', children: [{ text: 'Heading' }] }],
  };
  expect(() => nativeProjection(v, project)).toThrow();
});
it('creates native media and gallery defaults and exposes fixed copy fields', async () => {
  const { appendSection, copyChildFields } =
    await import('../tina/fields/composition');
  const { sectionCopyTemplates } = await import('../tina/fields/section-copy');
  for (const type of ['media-text', 'gallery'] as const) {
    const v = appendSection(
      {
        ...pageDocument('about', 'about', 'about'),
        sections: pageDocument('about', 'about', 'about').sections.map(
          (s: any) => ({ ...s, enabled: true }),
        ),
      } as any,
      type,
      'intro',
    );
    const c: any = v.copy.sections.at(-1);
    expect(c[type === 'gallery' ? 'description' : 'body']).toMatchObject({
      type: 'root',
    });
    const fields = copyChildFields(
      { name: 'copy.sections', templates: sectionCopyTemplates },
      c,
      0,
    );
    expect(fields.map((f: any) => f.name)).toContain(
      type === 'gallery' ? 'copy.sections.0.items' : 'copy.sections.0.image',
    );
  }
});
it('normalizes observed native blank states and batches clear without changing rich ASTs', async () => {
  const { selectedSectionMedia } = await import('../tina/fields/section-media');
  const { applyComposition } = await import('../tina/fields/composition');
  for (const blank of ['', null, undefined])
    expect(selectedSectionMedia(blank, media)).toBeNull();
  expect(selectedSectionMedia('/uploads/replaced.jpg', media)).toEqual({
    src: '/uploads/replaced.jpg',
    crop: 'top',
  });
  const values = draft();
  values.copy.sections.at(-2).body = ast;
  let batches = 0;
  const changes: any[] = [];
  applyComposition(
    {
      getState: () => ({ values }),
      batch: (f: any) => {
        batches++;
        f();
      },
      change: (...args: any[]) => changes.push(args),
    },
    (v) =>
      ops.setSectionMedia(v, {
        sectionId: 'media',
        media: selectedSectionMedia(''),
      }),
  );
  expect(batches).toBe(1);
  expect(changes.map((c) => c[0])).toEqual([
    'sections',
    'copy',
    'translations',
  ]);
  expect(changes[1][1].sections.at(-2).body).toBe(ast);
});
it('keeps scoped gallery media and copy aligned through reorder/removal in three locales', () => {
  const v = draft();
  const next: any = ops.moveSectionItem(v, 'gallery', 'two', 'up');
  expect(next.sections.at(-1).items[0].media.src).toBe('/uploads/two.png');
  expect(next.copy).toBe(v.copy);
  const removed: any = ops.removeSectionItem(next, 'gallery', 'one');
  for (const [index, c] of [
    removed.copy,
    ...Object.values(removed.translations).map((t: any) => t.copy),
  ].entries()) {
    expect(c.sections.at(-1).items.map((i: any) => i.id)).toEqual(['two']);
    expect(c.sections.at(-2)).toBe(
      [v.copy, ...Object.values(v.translations).map((t: any) => t.copy)][
        index
      ].sections.at(-2),
    );
  }
});
it('invalidates upload add/change/unlink including a newly created directory, excluding generated and canonical inputs', async () => {
  const configPath = '../apps/site/astro.config.mjs';
  const config = (await import(configPath)).default as any;
  const plugin = config.vite.plugins.find(
    (p: any) => p.name === 'section-upload-refresh',
  );
  expect(plugin).toBeDefined();
  const listeners: Record<string, Function> = {};
  const watched: string[] = [];
  let invalidations = 0,
    reloads = 0;
  const server = {
    watcher: {
      add: (p: string | string[]) => watched.push(...[p].flat()),
      on: (event: string, cb: Function) => {
        listeners[event] = cb;
      },
    },
    moduleGraph: { invalidateAll: () => invalidations++ },
    ws: { send: () => reloads++ },
  };
  plugin.configureServer(server);
  expect(
    watched.some((p) => p.replaceAll('\\', '/').endsWith('/apps/site/public')),
  ).toBe(true);
  for (const event of ['add', 'change', 'unlink'])
    listeners[event](process.cwd() + '/apps/site/public/uploads/new/image.png');
  listeners.addDir(process.cwd() + '/apps/site/public/uploads');
  listeners.change(process.cwd() + '/.generated/image.png');
  listeners.add(process.cwd() + '/content/pages/new.json');
  expect(invalidations).toBe(4);
  expect(reloads).toBe(4);
});

it('serializes cleared media/image objects as omission through the installed native schema API', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const { TinaSchema } = createRequire(require.resolve('tinacms'))(
    '@tinacms/schema-tools',
  );
  const { pages } = await import('../tina/collections/page');
  const v = draft();
  delete v.translations.fr;
  for (const c of [v.copy, v.translations.el.copy])
    for (const entry of c.sections)
      entry._template = entry._template.replaceAll('-', '_');
  const next = ops.setSectionMedia(v, { sectionId: 'media', media: null });
  const payload = new TinaSchema({
    collections: [pages(project)],
  }).transformPayload('page', next);
  expect(payload.page.about.sections.at(-2)).not.toHaveProperty('media');
  expect(payload.page.about.copy.sections.at(-2).media_text).not.toHaveProperty(
    'image',
  );
  expect(
    payload.page.about.translations.el.copy.sections.at(-2).media_text,
  ).not.toHaveProperty('image');
  expect(next.copy.sections.at(-2)?.body).toBe(v.copy.sections.at(-2).body);
});
it('scopes replacement to one gallery when item IDs match across sections', () => {
  const v = draft();
  v.sections.push({
    ...v.sections.at(-1),
    id: 'second_gallery',
    items: [
      { id: 'one', media: { src: '/uploads/other.png', crop: 'center' } },
    ],
  });
  v.copy.sections.push({
    ...v.copy.sections.at(-1),
    id: 'second_gallery',
    items: [{ id: 'one', alt: 'Other', caption: ast }],
  });
  const next: any = ops.setSectionMedia(v, {
    sectionId: 'gallery',
    itemId: 'one',
    media: { ...media, src: '/uploads/new.png' },
  });
  expect(next.sections.at(-1)).toBe(v.sections.at(-1));
  expect(next.copy).toBe(v.copy);
  expect(
    next.sections.find((s: any) => s.id === 'gallery').items[0].media.src,
  ).toBe('/uploads/new.png');
});
