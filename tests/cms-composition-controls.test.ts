import { it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { project } from './fixtures/content/factory';
import { nativeRichText } from '../tina/fields/rich-text';
import * as controls from '../tina/fields/composition';
import {
  createStandardPageDefaults,
  PageIdentityControls,
} from '../tina/fields/page-identity';
import {
  resolveNativeSubmission,
  validateCurrentSave,
} from '../tina/validation';
const about = () =>
  JSON.parse(readFileSync('content/pages/about.json', 'utf8'));
it('batches a structural edit once, retains AST identity and prunes all locale copy on removal', () => {
  const values = about();
  const ast = {
    type: 'root',
    children: [{ type: 'p', children: [{ text: 'Native' }] }],
  };
  values.copy.sections[1].body = ast;
  const changes: any[] = [];
  const form = {
    getState: () => ({ values }),
    batch: vi.fn((fn) => fn()),
    change: vi.fn((...args: any[]) => changes.push(args)),
  };
  controls.applyComposition(form, (v) =>
    controls.appendSection(v, 'rich-text', 'intro'),
  );
  expect(form.batch).toHaveBeenCalledTimes(1);
  expect(changes.map((c) => c[0])).toEqual(['sections', 'copy']);
  expect(changes[1][1].sections[1].body).toBe(ast);
  expect(changes[0][1][1]).toMatchObject({ enabled: false });
  expect(changes[0][1][1].id).toMatch(/^section_[a-f0-9]{32}$/);
  controls.applyComposition(form, (v) => controls.removeSection(v, 'approach'));
  expect(changes.at(-1)[0]).toBe('translations');
  expect(
    changes.at(-1)[1].el.copy.sections.some((s: any) => s.id === 'approach'),
  ).toBe(false);
});
it('declares bounded labelled moves, protects required sections and excludes dormant articles only from the chooser', () => {
  const values = about();
  expect(controls.sectionControlState(values, 0)).toMatchObject({
    required: true,
    upDisabled: true,
    downDisabled: true,
  });
  expect(controls.sectionControlState(values, 1)).toMatchObject({
    upDisabled: true,
    downDisabled: false,
  });
  expect(controls.sectionControlState(values, 2)).toMatchObject({
    upDisabled: false,
    downDisabled: true,
  });
  expect(controls.availableSections(false).map((d) => d.type)).not.toContain(
    'article-list',
  );
  expect(controls.availableSections(true)).toHaveLength(9);
  values.contentId = 'privacy';
  values.sections[1].id = 'privacy_details';
  expect(controls.sectionControlState(values, 1).required).toBe(true);
});
it('initializes a locale only on explicit action with empty hero and selected copy, draft publication and empty meta', () => {
  const values = about();
  values.translations = {};
  const result = controls.initializeTranslationCopy(values, 'el', 'approach');
  expect(result.translations.el).toEqual({
    status: 'draft',
    meta: { title: '', seoDescription: '' },
    copy: {
      sections: [
        {
          id: 'intro',
          _template: 'hero',
          title: '',
          description: nativeRichText(),
        },
        {
          id: 'approach',
          _template: 'rich_text',
          title: '',
          body: nativeRichText(),
        },
      ],
    },
  });
  expect(values.translations).toEqual({});
  expect(() =>
    controls.initializeTranslationCopy(result, 'el', 'approach'),
  ).toThrow(/already exists/);
});
it('renders only declared child fields with immutable copy identity and no independent structure controls', () => {
  const fields = [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'body', type: 'rich-text' },
  ];
  expect(
    controls
      .copyChildFields(
        {
          name: 'translations.el.copy.sections',
          templates: { rich_text: { fields } },
        },
        { _template: 'rich_text', id: 'x' },
        2,
      )
      .map((f: any) => f.name),
  ).toEqual([
    'translations.el.copy.sections.2.title',
    'translations.el.copy.sections.2.body',
  ]);
  expect(typeof controls.SectionCopyControls).toBe('function');
  expect(typeof controls.SectionControls).toBe('function');
});
it('starts Standard creation as a draft with empty editable identity and no translated prose; freezes identity after create', () => {
  const values = createStandardPageDefaults();
  expect(values).toMatchObject({
    _template: 'standard',
    contentId: '',
    slug: '',
    status: 'draft',
    translations: {},
    sections: [{ id: 'intro', _template: 'hero', enabled: true }],
  });
  const input = { name: 'contentId', value: 'new_page', onChange: vi.fn() };
  expect(
    PageIdentityControls({
      input,
      field: { name: 'contentId' },
      tinaForm: { crudType: 'create' },
    }).props.readOnly,
  ).toBe(false);
  expect(
    PageIdentityControls({
      input,
      field: { name: 'contentId' },
      tinaForm: { crudType: 'update' },
    }).props.readOnly,
  ).toBe(true);
});
it('resolves verified native create metadata while rejecting absolute, nested, mismatched and update metadata', () => {
  expect(
    resolveNativeSubmission(
      { crudType: 'create', path: 'content/pages/probe.json' },
      { filename: 'probe' },
      'content/pages',
    ),
  ).toEqual({
    operation: 'create',
    relativePath: 'probe.json',
    filename: 'probe',
  });
  expect(
    resolveNativeSubmission(
      { crudType: 'update', path: 'content/pages/probe.json' },
      {},
      'content/pages',
    ),
  ).toEqual({ operation: 'update', relativePath: 'probe.json' });
  for (const path of [
    '/probe.json',
    '//probe.json',
    'C:/probe.json',
    'content/pages/a/probe.json',
    'content/pages/../probe.json',
  ])
    expect(() =>
      resolveNativeSubmission(
        { crudType: 'create', path },
        { filename: 'probe' },
        'content/pages',
      ),
    ).toThrow(/flat|path/i);
  expect(() =>
    resolveNativeSubmission(
      { crudType: 'create', path: 'content/pages/probe.json' },
      { filename: 'other' },
      'content/pages',
    ),
  ).toThrow(/filename/i);
  expect(() =>
    resolveNativeSubmission(
      { crudType: 'update', path: 'content/pages/probe.json' },
      { filename: 'probe' },
      'content/pages',
    ),
  ).toThrow(/metadata/i);
});
const cms = {
  api: {
    tina: {
      request: async (query: string) => {
        const kind = /\{(\w+)Connection/.exec(query)![1],
          folders: any = {
            settings: 'settings',
            page: 'pages',
            offering: 'offerings',
            person: 'people',
            article: 'articles',
          };
        return {
          [kind + 'Connection']: {
            edges: readdirSync('content/' + folders[kind])
              .filter((f) => f.endsWith('.json'))
              .map((f) => ({
                node: {
                  _values: JSON.parse(
                    readFileSync('content/' + folders[kind] + '/' + f, 'utf8'),
                  ),
                  _sys: { relativePath: f },
                },
              })),
            pageInfo: { hasNextPage: false },
          },
        };
      },
    },
  },
};
it('validates Standard create against the current catalog and returns exact originals including AST and creation metadata', async () => {
  const values: any = createStandardPageDefaults();
  values.contentId = 'composition_new';
  values.slug = 'composition-new';
  values.filename = 'composition-new';
  values.copy.sections[0].title = 'A new page';
  values.meta.title = 'A new page';
  const ast = {
    type: 'root',
    children: [{ type: 'p', children: [{ text: 'Native' }] }],
  };
  values.copy.sections[0].description = ast;
  expect(
    await validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: '/composition-new.json',
      filename: 'composition-new',
    }),
  ).toBe(values);
  expect(values.copy.sections[0].description).toBe(ast);
  expect(values.filename).toBe('composition-new');
  await expect(
    validateCurrentSave(
      { ...values, _template: 'contact' },
      'page',
      project,
      cms,
      {
        operation: 'create',
        relativePath: 'composition-new.json',
        filename: 'composition-new',
      },
    ),
  ).rejects.toThrow(/Standard/);
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'about.json',
      filename: 'composition-new',
    }),
  ).rejects.toThrow(/filename|exists/);
  await expect(
    validateCurrentSave({ ...values, slug: '404' }, 'page', project, cms, {
      operation: 'create',
      relativePath: 'composition-new.json',
      filename: 'composition-new',
    }),
  ).rejects.toThrow(/reserved/);
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'update',
      relativePath: 'composition-new.json',
    }),
  ).rejects.toThrow(/metadata|not found/);
});

it('fails closed before catalog access on wire path tricks and unrecognized create metadata', async () => {
  const cms = {
    get api() {
      throw Error('Unexpected catalog access');
    },
  };
  for (const relativePath of [
    '//x.json',
    'C:/x.json',
    '../x.json',
    '/nested/x.json',
    'x.JSON',
    'x.json/',
  ])
    await expect(
      validateCurrentSave({}, 'page', project, cms, {
        operation: 'create',
        relativePath,
      }),
    ).rejects.toThrow(/flat/);
  expect(() =>
    resolveNativeSubmission(
      { crudType: 'create', path: 'content/pages//probe.json' },
      { filename: 'probe' },
      'content/pages',
    ),
  ).toThrow(/flat|path/);
  expect(() =>
    resolveNativeSubmission(
      { path: 'content/pages/probe.json' },
      {},
      'content/pages',
    ),
  ).toThrow(/context/);
});
it('rejects duplicate draft slug and duplicate ID, published creation and incomplete explicit translation copy', async () => {
  const values: any = createStandardPageDefaults();
  Object.assign(values, { contentId: 'another_draft', slug: 'about' });
  values.meta.title = 'Draft';
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'another-draft.json',
    }),
  ).rejects.toThrow(/slug.*unique|collision|duplicate/i);
  values.slug = 'another-draft';
  values.contentId = 'home';
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'another-draft.json',
    }),
  ).rejects.toThrow(/Duplicate/);
  values.contentId = 'another_draft';
  values.status = 'published';
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'another-draft.json',
    }),
  ).rejects.toThrow(/draft/);
  const current = about(),
    localized = controls.initializeTranslationCopy(
      { ...current, translations: {} },
      'el',
      'approach',
    );
  const { beforeSubmit } = await import('../tina/validation');
  expect(() =>
    beforeSubmit({ ...localized }, 'page', project, current),
  ).toThrow();
});
it('renders accessible protected controls with labelled keyboard moves and no editable instance IDs', async () => {
  const { createRequire } = await import('node:module');
  const { renderToStaticMarkup } = createRequire(import.meta.url)(
    'react-dom/server',
  );
  const { createElement } = await import('react');
  const values = about();
  const tinaForm = {
    finalForm: { getState: () => ({ values }), subscribe: () => () => {} },
  };
  const html = renderToStaticMarkup(
    createElement(controls.SectionControls, {
      tinaForm,
      articles: false,
      languages: [],
    }),
  );
  expect(html).toContain('disabled="" aria-label="Move intro up"');
  expect(html).toContain('disabled="" aria-label="Move approach up"');
  expect(html).toContain('disabled="" aria-label="Move people_preview down"');
  expect(html).toContain('aria-label="Remove intro"');
  expect(html).not.toContain('value="article-list"');
  expect(html).not.toMatch(/name=".*\.id"/);
});

it('keeps the native special-template picker renderable so save can explain Standard-only creation', async () => {
  const { createRequire } = await import('node:module');
  const { renderToStaticMarkup } = createRequire(import.meta.url)(
    'react-dom/server',
  );
  const { createElement } = await import('react');
  const tinaForm = {
    finalForm: {
      getState: () => ({ values: { _template: 'contact' } }),
      subscribe: () => () => {},
    },
  };
  expect(() =>
    renderToStaticMarkup(
      createElement(controls.SectionControls, { tinaForm, languages: [] }),
    ),
  ).not.toThrow();
});

it('allows an explicitly supplied valid draft locale on first save without changing its copy or status', async () => {
  const values: any = createStandardPageDefaults();
  Object.assign(values, {
    contentId: 'explicit_locale',
    slug: 'explicit-locale',
  });
  values.meta.title = 'Draft';
  values.translations = {
    el: {
      status: 'draft',
      meta: { title: 'Ελληνικός τίτλος', seoDescription: '' },
      copy: {
        sections: [
          {
            id: 'intro',
            _template: 'hero',
            title: 'Ελληνικός τίτλος',
            description: '',
          },
        ],
      },
    },
  };
  expect(
    await validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'explicit-locale.json',
    }),
  ).toBe(values);
  values.translations.el.status = 'published';
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'explicit-locale.json',
    }),
  ).rejects.toThrow(/draft/);
});
it('initializes every new rich field as a native AST, never a string that Tina omits on create', () => {
  const defaults: any = createStandardPageDefaults();
  expect(defaults.copy.sections[0].description).toMatchObject({ type: 'root' });
  const values = about(),
    added = controls.appendSection(values, 'rich-text', 'intro');
  expect(added.copy.sections.at(-1)!.body).toMatchObject({ type: 'root' });
  const translated = controls.initializeTranslationCopy(
    { ...values, translations: {} },
    'el',
    'approach',
  );
  expect(translated.translations.el.copy.sections[0].description).toMatchObject(
    { type: 'root' },
  );
  expect(translated.translations.el.copy.sections[1].body).toMatchObject({
    type: 'root',
  });
});

it('keeps native copy child labels human-readable after qualifying their paths', () => {
  const field = {
    name: 'copy.sections',
    templates: {
      rich_text: {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'body', label: 'Body', type: 'rich-text' },
        ],
      },
    },
  };
  expect(
    controls
      .copyChildFields(field, { id: 'x', _template: 'rich_text' }, 1)
      .map((f: any) => f.label),
  ).toEqual(['title', 'Body']);
});
it('keeps shared scalar types canonical while typed native copy uses GraphQL-safe template aliases', () => {
  const added = controls.appendSection(about(), 'rich-text', 'intro');
  expect(added.sections[1]._template).toBe('rich-text');
  expect(added.copy.sections.at(-1)!._template).toBe('rich_text');
});
it('rejects creation filename collisions case-insensitively before a Windows filesystem overwrite', async () => {
  const values: any = createStandardPageDefaults();
  Object.assign(values, {
    contentId: 'case_collision',
    slug: 'case-collision',
  });
  values.meta.title = 'Draft';
  await expect(
    validateCurrentSave(values, 'page', project, cms, {
      operation: 'create',
      relativePath: 'ABOUT.json',
    }),
  ).rejects.toThrow(/filename|exists/i);
});
it('rejects aliased shared scalar reference types at save instead of approving invalid persisted JSON', async () => {
  const { beforeSubmit } = await import('../tina/validation');
  const current = about(),
    values = about();
  values.sections[1]._template = 'rich_text';
  values.copy.sections[1]._template = 'rich_text';
  expect(() => beforeSubmit(values, 'page', project, current)).toThrow(
    /canonical.*shared|shared.*canonical/i,
  );
});
it.each(['published', 'draft'])(
  'rejects new draft page URLs already owned by %s editorial records',
  async (status) => {
    const values: any = createStandardPageDefaults();
    Object.assign(values, {
      contentId: 'route_collision',
      slug: 'services/planning-session',
    });
    values.meta.title = 'Draft';
    const catalog = {
      api: {
        tina: {
          request: async (query: string) => {
            const result: any = await cms.api.tina.request(query);
            if (query.includes('offeringConnection'))
              for (const edge of result.offeringConnection.edges)
                edge.node._values.status = status;
            return result;
          },
        },
      },
    };
    await expect(
      validateCurrentSave(values, 'page', project, catalog, {
        operation: 'create',
        relativePath: 'route-collision.json',
      }),
    ).rejects.toThrow(/collision|duplicate/i);
  },
);
it('surfaces pre-write validation through native alerts and rethrows without mutating values or accessing the catalog', async () => {
  const { buildCollections } = await import('../tina/collections');
  const collection = buildCollections(project).find((c) => c.name === 'page')!;
  const values = { _template: 'contact', filename: 'rejected' },
    original = structuredClone(values),
    error = vi.fn();
  await expect(
    collection.ui!.beforeSubmit!({
      values,
      form: { crudType: 'create', path: 'content/pages/rejected.json' },
      cms: {
        alerts: { error },
        get api() {
          throw Error('Unexpected catalog access');
        },
      },
    }),
  ).rejects.toThrow(/Create a Standard page/);
  expect(error).toHaveBeenCalledExactlyOnceWith(
    'Create a Standard page. Special page templates are reserved for existing records.',
  );
  expect(values).toEqual(original);
});

it('offers actual nested Page correction destinations after rejection without changing values or ASTs', () => {
  const values = controls.initializeTranslationCopy(
    { ...about(), translations: {} },
    'el',
    'intro',
  );
  const ast = nativeRichText('Unsaved prose');
  values.copy.sections[1].body = ast;
  const before = structuredClone(values);
  const dispatch = vi.fn();
  for (const fieldName of [
    'meta',
    'copy',
    'translations.el.meta',
    'translations.el.copy',
  ]) {
    controls.openPageCorrection(
      { id: 'native-page', finalForm: { getState: () => ({ values }) } },
      { dispatch },
      fieldName,
    );
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'forms:set-active-field-name',
      value: { formId: 'native-page', fieldName },
    });
  }
  expect(values).toEqual(before);
  expect(values.copy.sections[1].body).toBe(ast);
});

it('binds correction navigation to every actual Page object including both locale levels', async () => {
  const { buildCollections } = await import('../tina/collections');
  const page = buildCollections(project).find((c) => c.name === 'page')!;
  for (const template of page.templates as any[]) {
    const fields = template.fields;
    for (const name of ['meta', 'copy', 'translations'])
      expect(fields.find((f: any) => f.name === name).ui.component).toBe(
        controls.PageObjectControls,
      );
    const copyTemplates = fields.find((f: any) => f.name === 'copy').fields[0]
      .templates;
    for (const name of ['hero', 'cta']) {
      const link = copyTemplates
        .find((t: any) => t.name === name)
        .fields.find((f: any) => f.name === 'link');
      expect(link.ui.component).toBe(controls.PageObjectControls);
    }
    const locale = fields.find((f: any) => f.name === 'translations').fields[0];
    expect(locale.ui.component).toBe(controls.PageObjectControls);
    for (const name of ['meta', 'copy'])
      expect(locale.fields.find((f: any) => f.name === name).ui.component).toBe(
        controls.PageObjectControls,
      );
  }
});
