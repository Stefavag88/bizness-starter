import { z } from 'zod';
import { pageSchema, settingsSchema } from './schemas.mjs';
import { sectionDefinitions } from './section-registry.mjs';

const id = z.string().regex(/^[a-z][a-z0-9_]{0,79}$/);
const locale = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);
const entries = z.array(z.discriminatedUnion('_template', sectionDefinitions.map(definition =>
  z.strictObject({ id, _template: z.literal(definition.type), ...definition.copySchema.shape })
)));
const copy = z.strictObject({ sections: entries });

function pageProjection(document) {
  const result = structuredClone(document);
  const mapCopy = value => ({
    sections: Object.fromEntries(value.sections.map(({ id, _template, ...copy }) => [id, copy])),
  });
  result.copy = mapCopy(result.copy);
  for (const translation of Object.values(result.translations)) translation.copy = mapCopy(translation.copy);
  return result;
}

function settingsProjection(document) {
  const result = structuredClone(document);
  for (const translation of Object.values(result.translations)) {
    translation.navigation = Object.fromEntries(translation.navigation.map(({ pageId, label }) => [pageId, label]));
  }
  return result;
}

function domainIssues(schema, projection, document, ctx) {
  const result = schema.safeParse(projection(document));
  if (!result.success) for (const issue of result.error.issues) ctx.addIssue(issue);
}

const pageTranslation = pageSchema.shape.translations.unwrap().valueType;
export const pageDocumentSchema = z.strictObject({
  ...pageSchema.shape,
  copy,
  translations: z.record(locale, z.strictObject({ ...pageTranslation.shape, copy })).default({}),
}).superRefine((document, ctx) => {
  const localizedCopies = [
    [document.copy, ['copy', 'sections']],
    ...Object.entries(document.translations).map(([locale, translation]) =>
      [translation.copy, ['translations', locale, 'copy', 'sections']]),
  ];
  for (const [value, path] of localizedCopies) {
    const ids = new Set();
    for (const [index, entry] of value.sections.entries()) {
      if (ids.has(entry.id)) {
        ctx.addIssue({ code: 'custom', path: [...path, index, 'id'], message: 'Duplicate section copy ID: ' + entry.id });
      }
      ids.add(entry.id);
      const reference = document.sections.find(section => section.id === entry.id);
      if (reference && reference._template !== entry._template) {
        ctx.addIssue({ code: 'custom', path: [...path, index, '_template'], message: 'Copy template must match shared section type' });
      }
    }
  }
  // Domain validation remains authoritative for required copy, safe prose and shared membership.
  domainIssues(pageSchema, pageProjection, document, ctx);
});

const settingsTranslation = settingsSchema.shape.translations.unwrap().valueType;
export const settingsDocumentSchema = z.strictObject({
  ...settingsSchema.shape,
  translations: z.record(locale, z.strictObject({
    ...settingsTranslation.shape,
    navigation: settingsSchema.shape.navigation,
  })).default({}),
}).superRefine((document, ctx) => {
  for (const [locale, translation] of Object.entries(document.translations)) {
    if (new Set(translation.navigation.map(item => item.pageId)).size !== translation.navigation.length) {
      ctx.addIssue({ code: 'custom', path: ['translations', locale, 'navigation'], message: 'Duplicate navigation page ID' });
    }
  }
  domainIssues(settingsSchema, settingsProjection, document, ctx);
});

export function normalizePageDocument(raw) {
  return pageSchema.parse(pageProjection(pageDocumentSchema.parse(raw)));
}

export function normalizeSettingsDocument(raw) {
  return settingsSchema.parse(settingsProjection(settingsDocumentSchema.parse(raw)));
}
