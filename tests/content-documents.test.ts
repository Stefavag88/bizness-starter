import { it, expect } from 'vitest';
import * as documents from '../packages/content/documents.mjs';
import {
  normalizedPage as page,
  normalizedSettings as settings,
} from './fixtures/content/factory';
const wirePage = () => {
  const p: any = page();
  for (const c of [
    p.copy,
    ...Object.values(p.translations).map((t: any) => t.copy),
  ])
    c.sections = Object.entries(c.sections).map(([id, copy]: any) => ({
      id,
      _template: p.sections.find((s: any): unknown => s.id === id)._template,
      ...copy,
    }));
  return p;
};
const wireSettings = () => {
  const s: any = settings();
  for (const t of Object.values(s.translations) as any[])
    t.navigation = Object.entries(t.navigation).map(([pageId, label]) => ({
      pageId,
      label,
    }));
  return s;
};
it('normalizes typed lists by ID into detached maps without changing shared order', () => {
  const p = wirePage();
  p.translations.el.copy.sections.reverse();
  const original = structuredClone(p);
  const normalized = documents.normalizePageDocument(p);
  expect(normalized.copy.sections.details).toEqual({
    title: 'More',
    body: 'A useful paragraph.',
  });
  expect(normalized.sections.map((s) => s.id)).toEqual(['intro', 'details']);
  expect(p).toEqual(original);
  normalized.copy.sections.intro.title = 'Changed';
  expect(p.copy.sections[0].title).toBe('Hello');
});
it.each([
  [
    'duplicate copy ID',
    (p: any): unknown => p.copy.sections.push(p.copy.sections[0]),
  ],
  ['stale copy ID', (p: any): unknown => (p.copy.sections[0].id = 'stale')],
  [
    'mismatched type',
    (p: any): unknown => (p.copy.sections[1]._template = 'hero'),
  ],
  ['missing default copy', (p: any): unknown => p.copy.sections.pop()],
  [
    'missing translated hero',
    (p: any): unknown => p.translations.el.copy.sections.shift(),
  ],
  ['unknown field', (p: any): unknown => (p.copy.sections[0].unknown = true)],
  [
    'old map shape',
    (p: any): unknown => (p.copy.sections = page().copy.sections),
  ],
] as const)('rejects %s at the Page document boundary', (_name, change) => {
  const candidate = wirePage();
  change(candidate);
  expect(() => documents.normalizePageDocument(candidate)).toThrow();
});
it('allows omitted optional translation copy and page-local IDs of different types', () => {
  const p = wirePage();
  p.translations.el.copy.sections.pop();
  expect(
    documents.normalizePageDocument(p).translations.el.copy.sections.details,
  ).toBeUndefined();
  p.sections[1]._template = 'cta';
  p.copy.sections[1] = {
    id: 'details',
    _template: 'cta',
    title: 'Contact',
    description: '',
    link: { label: 'Contact', href: '/contact' },
  };
  expect(() => documents.normalizePageDocument(p)).not.toThrow();
  expect(() => documents.normalizePageDocument(wirePage())).not.toThrow();
});
it('normalizes translated label lists by ID with exact unique shared membership', () => {
  const s = wireSettings();
  s.translations.el.navigation.reverse();
  const original = structuredClone(s);
  expect(
    documents.normalizeSettingsDocument(s).translations.el.navigation.home,
  ).toBe('Αρχική');
  expect(s).toEqual(original);
});

it.each([
  [
    'duplicate ID',
    (s: any): unknown =>
      s.translations.el.navigation.push(s.translations.el.navigation[0]),
  ],
  ['missing label', (s: any): unknown => s.translations.el.navigation.pop()],
  [
    'stale ID',
    (s: any): unknown => (s.translations.el.navigation[0].pageId = 'stale'),
  ],
  [
    'old map shape',
    (s: any): unknown =>
      (s.translations.el.navigation = settings().translations.el.navigation),
  ],
] as const)('rejects %s at the Settings document boundary', (_name, change) => {
  const candidate = wireSettings();
  change(candidate);
  expect(() => documents.normalizeSettingsDocument(candidate)).toThrow();
});

it('requires an own translated label for the valid constructor page ID', () => {
  const candidate = wireSettings();
  candidate.navigation.push({ pageId: 'constructor', label: 'Constructor' });
  expect(() => documents.normalizeSettingsDocument(candidate)).toThrow(
    /Missing translated navigation label/,
  );
  candidate.translations.el.navigation.push({
    pageId: 'constructor',
    label: 'Constructor Greek',
  });
  const normalized = documents.normalizeSettingsDocument(candidate);
  expect(
    Object.hasOwn(normalized.translations.el.navigation, 'constructor'),
  ).toBe(true);
  expect(normalized.translations.el.navigation.constructor).toBe(
    'Constructor Greek',
  );
});
