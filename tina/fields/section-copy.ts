import { createElement as h, lazy, Suspense } from 'react';
import type { TinaField, Template } from 'tinacms';
import { sectionDefinitions } from '../../packages/content/section-registry.mjs';
import { text, object, link } from './common';
import { rich } from './rich-text';

// Load the native renderer in the browser; schema construction stays usable in Node.
const NativeFields = lazy(async () => ({ default: (await import('tinacms')).FieldsBuilder }));

// Resolved native fields keep Tina's rich controls, with fixed membership at this checkpoint.
export function FixedEntries({ input, field, tinaForm }: any) {
  return h('div', {}, ...(input.value || []).map((entry: any, index: number) => {
    const template = field.templates?.[entry._template];
    const fields = template?.fields || field.fields || [];
    const children = fields.map((child: any) => ({ ...child, name: `${field.name}.${index}.${child.name}` }));
    return h('fieldset', { key: entry.id || entry.pageId },
      h('legend', {}, entry.id || entry.pageId),
      h(Suspense, { fallback: null }, h(NativeFields, { form: tinaForm, fields: children })));
  }));
}

export function sectionCopyFields(type: string): TinaField[] {
  return [text('id', true), text('title'), type === 'rich-text' ? rich('body') : rich('description', true),
    ...(['hero', 'cta'].includes(type) ? [link] : [])];
}

export const sectionCopyTemplates: Template[] = sectionDefinitions.map(definition => ({
  name: definition.nativeName,
  ...(definition.type !== definition.nativeName ? { nameOverride: definition.type } : {}),
  label: definition.type,
  fields: sectionCopyFields(definition.type),
}));

export function pageCopy(): TinaField {
  return object('copy', [{ name: 'sections', label: 'Section copy', type: 'object', list: true,
    templates: sectionCopyTemplates, ui: { component: FixedEntries } }]);
}

export function navigationLabels(): TinaField {
  return { ...object('navigation', [text('pageId', true), text('label')], true), ui: { component: FixedEntries } };
}
