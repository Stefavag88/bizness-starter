import {beforeEach,afterEach} from 'vitest';
import {beginMediaSession,endMediaSession} from '../../../packages/media/session.mjs';
const mediaRoot=fileURLToPath(new URL('../../../',import.meta.url));
beforeEach(()=>{beginMediaSession({root:mediaRoot,policy:{enabled:true,widths:[320,640,960,1440,1920],quality:80},mode:'dev'});});
afterEach(async()=>{await endMediaSession(mediaRoot);});
import { it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sectionRenderer } from '../src/templates/sections';
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('astro/package.json'))('sharp');
it.each([
  ['media-text', 'default'],
  ['media-text', 'reversed'],
  ['gallery', 'default'],
  ['gallery', 'featured'],
])(
  'renders actual %s/%s image metadata, localized caption and fixed classes',
  async (type, variant) => {
    const dir = fileURLToPath(new URL('../public/uploads', import.meta.url));
    mkdirSync(dir, { recursive: true });
    const name = 'task3_' + crypto.randomUUID() + '.png',
      path = resolve(dir, name),
      src = '/uploads/' + name;
    const bytes = await sharp({
      create: { width: 6, height: 4, channels: 3, background: '#336699' },
    })
      .png()
      .toBuffer();
    writeFileSync(path, bytes, { flag: 'wx' });
    try {
      const container = await AstroContainer.create();
      const section = {
        id: 'media_example',
        _template: type,
        variant,
        enabled: true,
        appearance: { surface: 'muted' },
        media: { src, crop: 'top' },
        items: [{ id: 'one', media: { src, crop: 'bottom' } }],
        copy: {
          title: 'Media heading',
          body: '**Body** [Contact](/contact)',
          description: 'Gallery description',
          image: {
            alt: 'Localized image',
            caption: '**Caption** [Contact](/contact)',
          },
          items: [
            {
              id: 'one',
              alt: 'First image',
              caption: '**Caption** [Contact](/contact)',
            },
          ],
        },
      };
      const html = await container.renderToString(
        sectionRenderer(type, variant) as any,
        { props: { section, locale: 'el', pageId: 'owned_page' } },
      );
      expect(html).toContain('width="6"');
      expect(html).toContain('height="4"');
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('decoding="async"');
      expect(html).toContain(type === 'gallery' ? 'crop-bottom' : 'crop-top');
      expect(html).toContain(
        type === 'gallery' ? 'frame-gallery' : 'frame-landscape',
      );
      expect(html).toContain('<strong>Caption</strong>');
      expect(html).toContain('href="/el/contact"');
      expect(html).not.toMatch(/style=|<script|<h1/);
      if (type === 'gallery') expect(html).toContain('alt="First image"');
      else expect(html).toContain('alt="Localized image"');
    } finally {
      if (readFileSync(path).equals(bytes)) unlinkSync(path);
      else throw Error('Owned image changed; preserved');
    }
  },
);
it('renders intentional text-only media and gives actionable errors for referenced missing files', async () => {
  const container = await AstroContainer.create();
  const section = {
    id: 'media_example',
    _template: 'media-text',
    variant: 'default',
    enabled: true,
    appearance: { surface: 'default' },
    copy: { title: 'Text only', body: 'Useful body' },
  };
  const renderer = sectionRenderer('media-text', 'default') as any;
  const html = await container.renderToString(renderer, {
    props: { section, locale: 'en', pageId: 'owned_page' },
  });
  expect(html).toContain('Useful body');
  expect(html).not.toContain('<img');
  await expect(
    container.renderToString(renderer, {
      props: {
        section: {
          ...section,
          media: { src: '/uploads/task3_missing.png', crop: 'center' },
          copy: { ...section.copy, image: { alt: 'Missing' } },
        },
        locale: 'en',
        pageId: 'owned_page',
      },
    }),
  ).rejects.toThrow(/owned_page.*media_example/);
});

it('omits hidden references and untranslated/draft localized sections before any decoding', async () => {
  const { localizeContent } =
    await import('../../../packages/content/localize.mjs');
  const { normalizePageDocument } =
    await import('../../../packages/content/documents.mjs');
  const { pageDocument, project, normalizedSettings } =
    await import('../../../tests/fixtures/content/factory');
  const page: any = pageDocument('about', 'about', 'about');
  page.sections.push({
    id: 'broken',
    _template: 'gallery',
    variant: 'default',
    enabled: false,
    appearance: { surface: 'default' },
    items: [
      { id: 'one', media: { src: '/uploads/absent.png', crop: 'center' } },
    ],
  });
  page.copy.sections.push({
    id: 'broken',
    _template: 'gallery',
    title: 'Hidden',
    description: '',
    items: [{ id: 'one', alt: 'Absent' }],
  });
  const source: any = {
    settings: normalizedSettings(),
    pages: [normalizePageDocument(page)],
    offerings: [],
    people: [],
    articles: [],
    campaigns: [],
    now: '2026-10-18T00:00:00Z',
  };
  expect(
    localizeContent(source, 'en', project).pages[0].sections.some(
      (s) => s.id === 'broken',
    ),
  ).toBe(false);
  source.pages[0].sections.at(-1).enabled = true;
  expect(
    localizeContent(source, 'el', project).pages[0].sections.some(
      (s) => s.id === 'broken',
    ),
  ).toBe(false);
  source.pages[0].status = 'draft';
  expect(localizeContent(source, 'en', project).pages).toHaveLength(0);
});
it('rejects corrupt image bytes with gallery item context and re-reads same-path replacements', async () => {
  const dir = fileURLToPath(new URL('../public/uploads', import.meta.url));
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, 'task3_' + crypto.randomUUID() + '.png');
  let owned = Buffer.from('corrupt');
  writeFileSync(path, owned, { flag: 'wx' });
  const src = '/uploads/' + path.split(/[\\/]/).at(-1);
  const section = {
    id: 'gallery_example',
    _template: 'gallery',
    variant: 'featured',
    enabled: true,
    appearance: { surface: 'default' },
    items: [{ id: 'one', media: { src, crop: 'center' } }],
    copy: {
      title: 'Gallery',
      description: '',
      items: [{ id: 'one', alt: 'One' }],
    },
  };
  try {
    const container = await AstroContainer.create();
    const renderer = sectionRenderer('gallery', 'featured') as any;
    await expect(
      container.renderToString(renderer, {
        props: { section, locale: 'en', pageId: 'owned_page' },
      }),
    ).rejects.toThrow(/owned_page.*gallery_example.*one/);
    for (const width of [3, 7]) {
      if (!readFileSync(path).equals(owned))
        throw Error('Owned image changed; preserved');
      owned = await sharp({
        create: { width, height: 2, channels: 3, background: '#336699' },
      })
        .png()
        .toBuffer();
      writeFileSync(path, owned);
      const html = await container.renderToString(renderer, {
        props: { section, locale: 'en', pageId: 'owned_page' },
      });
      expect(html).toContain(`width="${width}"`);
    }
  } finally {
    if (readFileSync(path).equals(owned)) unlinkSync(path);
    else throw Error('Owned image changed; preserved');
  }
});
