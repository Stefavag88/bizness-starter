import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import type { TinaField } from 'tinacms';
import { parseProject } from '../packages/config/project.mjs';
import { buildCollections } from '../tina/collections';

const project = parseProject(JSON.parse(readFileSync('project.json', 'utf8')));
const seed = () => JSON.parse(readFileSync('content/settings/site.json', 'utf8'));
const fieldsOf = (field: TinaField): TinaField[] => 'fields' in field ? field.fields ?? [] : [];
const find = (fields: TinaField[], name: string) => fields.find(field => field.name === name)!;
const settingsFor = (profile = project.profile) => buildCollections({ ...project, profile }).find(c => c.name === 'settings')!;

describe('shared native contact and social authoring', () => {
  for (const profile of ['enquiries', 'newsletter', 'nurture'] as const) {
    it(`exposes one labeled shared social group in ${profile}`, () => {
      const fields = settingsFor(profile).fields!;
      const groups = fields.filter(field => field.name === 'social');
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('Social channels');
      expect(fieldsOf(groups[0]).map(({name, type, label}) => ({name, type, label}))).toEqual([
        { name: 'instagram', type: 'string', label: 'Instagram URL' },
        { name: 'linkedin', type: 'string', label: 'LinkedIn URL' },
        { name: 'facebook', type: 'string', label: 'Facebook URL' },
        { name: 'whatsapp', type: 'string', label: 'WhatsApp international number' },
        { name: 'showInHeader', type: 'boolean', label: 'Show social icons in header' },
      ]);
      for (const name of ['instagram', 'linkedin', 'facebook']) {
        expect(find(fieldsOf(groups[0]), name).description).toMatch(/HTTPS/);
      }
      expect(find(fieldsOf(groups[0]), 'whatsapp').description).toMatch(/\+302101234567/);
      expect(find(fieldsOf(groups[0]), 'whatsapp')).not.toHaveProperty('defaultValue');
      for (const translation of fieldsOf(find(fields, 'translations'))) {
        expect(fieldsOf(translation).map(field => field.name)).not.toContain('social');
        expect(fieldsOf(find(fieldsOf(translation), 'contact')).map(field => field.name)).toEqual(['address']);
      }
    });
  }

  it('explains required email and supported phone display formatting', () => {
    const fields = fieldsOf(find(settingsFor().fields!, 'contact'));
    expect(find(fields, 'email')).toMatchObject({type: 'string', label: 'Email', required: true});
    expect(find(fields, 'phone').description).toMatch(/3.?20.*digits/i);
    expect(find(fields, 'phone').description).toMatch(/spaces.*hyphens.*parentheses.*periods/i);
    expect(find(fields, 'phone').description).toMatch(/display.*without.*link/i);
    expect(find(fields, 'address').description).toMatch(/translat/i);
  });
});

// The real collection hook runs the detached schema/catalog guard before Tina persists.
const folders: Record<string, string> = {
  settings: 'settings', page: 'pages', offering: 'offerings', person: 'people', article: 'articles', campaign: 'campaigns',
};
function catalogCms() {
  return { api: { tina: { request: async (query: string) => {
    const collection = /\{(\w+)Connection/.exec(query)![1];
    return { [collection + 'Connection']: {
      edges: readdirSync('content/' + folders[collection]).filter(file => file.endsWith('.json')).map(file => ({ node: {
        _values: JSON.parse(readFileSync('content/' + folders[collection] + '/' + file, 'utf8')),
        _sys: { relativePath: file },
      } })),
      pageInfo: { hasNextPage: false, endCursor: null },
    } };
  } } } };
}
const submit = (values: any, cms: any = catalogCms()) => settingsFor().ui!.beforeSubmit!({
  values, cms, form: { crudType: 'update', path: 'content/settings/site.json' },
} as any);

describe('installed Settings save hook contact/social guard', () => {
  it.each([
    undefined, null, {},
    { instagram: null, linkedin: null, facebook: null, whatsapp: null, showInHeader: null },
    { instagram: '', linkedin: '   ', facebook: null, whatsapp: '', showInHeader: false },
    { instagram: ' https://www.instagram.com/example-studio ', linkedin: 'https://linkedin.com/company/example-studio', facebook: 'https://facebook.com/example-studio', whatsapp: '+302101234567', showInHeader: true },
  ])('accepts native clear/default or configured social values without rewriting input: %j', async social => {
    const values = seed();
    if (social !== undefined) values.social = social;
    values.contact.phone = null;
    values.contact.address = null;
    values.translations.el.contact.address = null;
    const before = structuredClone(values);
    expect(await submit(values)).toBe(values);
    expect(values).toEqual(before);
  });

  it('preserves exact unrelated legal rich AST nodes, metadata and undefined properties', async () => {
    const values = seed();
    values.social = { instagram: 'https://instagram.com/example-studio', showInHeader: true };
    const leaf = { type: 'text', text: 'Native notice', bold: true, id: 'opaque-leaf' };
    const link = { type: 'a', url: '/en/privacy', target: undefined, id: 'opaque-link', children: [leaf] };
    const ast = { type: 'root', children: [{ type: 'p', id: 123, children: [link, {text: ''}] }] };
    values.legal.notice = ast;
    values.translations.el.legal.notice = structuredClone(ast);
    const translated = values.translations.el.legal.notice;
    const before = structuredClone(values);
    expect(await submit(values)).toBe(values);
    expect(values).toEqual(before);
    expect(values.legal.notice).toBe(ast);
    expect(values.translations.el.legal.notice).toBe(translated);
    expect(ast.children[0].children[0]).toBe(link);
    expect(link.children[0]).toBe(leaf);
    expect(Object.hasOwn(link, 'target')).toBe(true);
  });

  it.each([
    ['instagram', 'http://instagram.com/example-studio'],
    ['linkedin', 'https://linkedin.com.evil.test/company/example'],
    ['facebook', 'https://instagram.com/example-studio'],
    ['whatsapp', '302101234567'],
    ['showInHeader', 'false'],
    ['showInHeader', 1],
  ])('rejects invalid social.%s with a field path before catalog/persistence', async (field, value) => {
    const values = seed();
    values.social = { [field]: value };
    const before = structuredClone(values);
    // An invalid candidate must fail before any catalog I/O; persistence follows this hook.
    const cms = { api: { tina: { request: async () => { throw Error('Unexpected catalog request'); } } } };
    await expect(submit(values, cms)).rejects.toMatchObject({ issues: expect.arrayContaining([
      expect.objectContaining({path: ['social', field]}),
    ]) });
    expect(values).toEqual(before);
  });

  it.each(['social', 'email', 'phone'])('rejects shared %s overrides inside Greek Settings copy', async field => {
    const values = seed();
    if (field === 'social') values.translations.el.social = { instagram: 'https://instagram.com/example-studio' };
    else values.translations.el.contact[field] = 'shared override';
    await expect(submit(values)).rejects.toThrow();
  });
});
