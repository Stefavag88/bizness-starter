import {
  createElement as h,
  lazy,
  Suspense,
  useState,
  useSyncExternalStore,
} from 'react';
import { sectionDefinitions } from '../../packages/content/section-registry.mjs';
import {
  addSection,
  moveSection,
  removeSection,
  setSectionEnabled,
  addTranslationCopy,
  type NativeSectionType,
  type CompositionCopyEntry,
  type CompositionDraft,
} from '../../packages/content/composition.mjs';
import type { SectionType } from '../../packages/content/types';
import { nativeRichText } from './rich-text';
export { removeSection };
const NativeFields = lazy(async () => ({
  default: (await import('tinacms')).FieldsBuilder,
}));
const definition = (type: string) => {
  const result = sectionDefinitions.find(
    (d) => d.type === type || d.nativeName === type,
  );
  if (!result) throw Error('Unknown section type');
  return result;
};
// The installed Group blocks entry whenever a submission error makes the form invalid.
// Page correction must still reach its actual fields. Tina's typed navigation action
// (also used by breadcrumbs) changes only the active field, preserving values/ASTs.
export function openPageCorrection(tinaForm: any, cms: any, fieldName: string) {
  cms.dispatch({
    type: 'forms:set-active-field-name',
    value: { formId: tinaForm.id, fieldName },
  });
}
const NativePageObject = lazy(async () => {
  const { useCMS } = await import('tinacms');
  return {
    default: ({ tinaForm, field }: any) => {
      const cms = useCMS();
      return h(
        'button',
        {
          type: 'button',
          className: 'block w-full rounded border p-3 mb-5 text-left',
          onClick: () => openPageCorrection(tinaForm, cms, field.name),
        },
        field.label || field.name,
      );
    },
  };
});
export function PageObjectControls(props: any) {
  return h(Suspense, { fallback: null }, h(NativePageObject, props));
}
export function pageCorrectionFields(fields: any[]): any[] {
  return fields.map((field) => ({
    ...field,
    ...(field.type === 'object' && !field.list
      ? { ui: { ...field.ui, component: PageObjectControls } }
      : {}),
    ...(field.fields ? { fields: pageCorrectionFields(field.fields) } : {}),
    ...(Array.isArray(field.templates)
      ? {
          templates: field.templates.map((template: any) => ({
            ...template,
            fields: pageCorrectionFields(template.fields),
          })),
        }
      : {}),
  }));
}
export function RegisteredFields({ tinaForm, fields }: any) {
  return h(
    Suspense,
    { fallback: null },
    h(NativeFields, { form: tinaForm, fields }),
  );
}
export function applyComposition(
  form: any,
  operation: (values: CompositionDraft) => CompositionDraft,
) {
  const before = form.getState().values;
  const after = operation({
    ...before,
    translations: before.translations || {},
  });
  form.batch(() => {
    for (const key of ['sections', 'copy', 'translations'] as const)
      if (after[key] !== before[key]) form.change(key, after[key]);
  });
}
export function availableSections(articles: boolean) {
  return sectionDefinitions.filter(
    (d) => d.type !== 'hero' && (articles || d.type !== 'article-list'),
  );
}
export function appendSection(
  values: CompositionDraft,
  type: SectionType,
  afterId: string,
) {
  const id = 'section_' + crypto.randomUUID().replaceAll('-', '');
  const d = definition(type);
  const defaults = d.defaultCopy();
  const copy: CompositionCopyEntry = {
    id,
    _template: d.nativeName as NativeSectionType,
    ...defaults,
  };
  for (const key of ['body', 'description'])
    if (Object.hasOwn(copy, key))
      copy[key] = nativeRichText(copy[key] as string);
  const result = addSection(values, { type, id, afterId, copy });
  return result;
}
function emptyCopy(
  section: CompositionDraft['sections'][number],
): CompositionCopyEntry {
  const d = definition(section._template);
  return {
    id: section.id,
    _template: d.nativeName as NativeSectionType,
    title: '',
    ...(d.type === 'rich-text'
      ? { body: nativeRichText() }
      : { description: nativeRichText() }),
    ...(d.type === 'cta' ? { link: { label: '', href: '' } } : {}),
  };
}
export function initializeTranslationCopy(
  values: CompositionDraft,
  locale: string,
  id: string,
) {
  const section = values.sections.find((s) => s.id === id);
  if (!section) throw Error('Unknown section ID');
  let result = values;
  if (!Object.hasOwn(values.translations, locale)) {
    result = {
      ...values,
      translations: {
        ...values.translations,
        [locale]: {
          status: 'draft',
          meta: { title: '', seoDescription: '' },
          copy: { sections: [emptyCopy(values.sections[0])] },
        },
      },
    };
    if (id === values.sections[0].id) return result;
  }
  return addTranslationCopy(result, locale, id, emptyCopy(section));
}
export function sectionControlState(values: CompositionDraft, index: number) {
  const section = values.sections[index],
    hero = definition(section._template).type === 'hero';
  return {
    required:
      hero ||
      (values.contentId === 'privacy' && section.id === 'privacy_details'),
    upDisabled: hero || index <= 1,
    downDisabled: hero || index >= values.sections.length - 1,
  };
}
function useValues(tinaForm: any) {
  const form = tinaForm.finalForm;
  return useSyncExternalStore(
    (callback) => form.subscribe(callback, { values: true }),
    () => form.getState().values,
    () => form.getState().values,
  );
}
export function SectionControls({
  tinaForm,
  articles = true,
  languages = [],
}: any) {
  const raw = useValues(tinaForm),
    values = {
      ...raw,
      sections: raw.sections || [],
      translations: raw.translations || {},
    } as CompositionDraft;
  const [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState('');
  const run = (fn: (v: CompositionDraft) => CompositionDraft) => {
    try {
      applyComposition(tinaForm.finalForm, fn);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return h(
    'div',
    {},
    h(
      'p',
      {},
      'Compose shared sections. New sections start hidden. Translations edit copy only.',
    ),
    error && h('p', { role: 'alert' }, error),
    ...values.sections.map((section, index) => {
      const state = sectionControlState(values, index);
      return h(
        'fieldset',
        { key: section.id, 'data-section-id': section.id },
        h('legend', {}, section.id),
        h(
          'label',
          {},
          h('input', {
            type: 'checkbox',
            checked: section.enabled !== false,
            disabled: state.required,
            onChange: (e: any) =>
              run((v) => setSectionEnabled(v, section.id, e.target.checked)),
          }),
          ' Show section',
        ),
        h(
          'label',
          {},
          ' Surface ',
          h(
            'select',
            {
              value: section.appearance?.surface || 'default',
              onChange: (e: any) =>
                run((v) => ({
                  ...v,
                  sections: v.sections.map((s) =>
                    s.id === section.id
                      ? {
                          ...s,
                          appearance: {
                            ...s.appearance,
                            surface: e.target.value,
                          },
                        }
                      : s,
                  ),
                })),
            },
            ...['default', 'muted', 'accent'].map((surface) =>
              h('option', { key: surface, value: surface }, surface),
            ),
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            disabled: state.upDisabled,
            'aria-label': 'Move ' + section.id + ' up',
            onClick: () => run((v) => moveSection(v, section.id, 'up')),
          },
          'Move up',
        ),
        h(
          'button',
          {
            type: 'button',
            disabled: state.downDisabled,
            'aria-label': 'Move ' + section.id + ' down',
            onClick: () => run((v) => moveSection(v, section.id, 'down')),
          },
          'Move down',
        ),
        h(
          'button',
          {
            type: 'button',
            disabled: state.required,
            'aria-label': 'Remove ' + section.id,
            onClick: () => setPending(section.id),
          },
          'Remove',
        ),
        pending === section.id &&
          h(
            'div',
            { role: 'group', 'aria-label': 'Confirm removal of ' + section.id },
            h(
              'p',
              {},
              'Remove this section and its copy from every translation?',
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => {
                  run((v) => removeSection(v, section.id));
                  setPending(null);
                },
              },
              'Confirm removal',
            ),
            h(
              'button',
              { type: 'button', onClick: () => setPending(null) },
              'Cancel removal',
            ),
          ),
        h(
          'label',
          {},
          ' Add section after ' + section.id,
          h(
            'select',
            {
              'aria-label': 'Add section after ' + section.id,
              value: '',
              onChange: (e: any) => {
                if (e.target.value)
                  run((v) => appendSection(v, e.target.value, section.id));
              },
            },
            h('option', { value: '' }, 'Choose section type'),
            ...availableSections(articles).map((d) =>
              h('option', { key: d.type, value: d.type }, d.type),
            ),
          ),
        ),
      );
    }),
    ...languages
      .filter(
        (l: any) =>
          values.sections.length > 0 &&
          !values.translations[l.code.replaceAll('-', '_')],
      )
      .map((l: any) =>
        h(
          'button',
          {
            key: l.code,
            type: 'button',
            onClick: () =>
              run((v) =>
                initializeTranslationCopy(
                  v,
                  l.code.replaceAll('-', '_'),
                  v.sections[0].id,
                ),
              ),
          },
          'Initialize ' + l.label + ' copy',
        ),
      ),
  );
}
export function copyChildFields(field: any, entry: any, index: number) {
  const native = definition(entry._template).nativeName;
  const template = Array.isArray(field.templates)
    ? field.templates.find((t: any) => t.name === native)
    : field.templates?.[native];
  if (!template)
    throw Error('Missing registered native copy fields: ' + native);
  return template.fields
    .filter((f: any) => f.name !== 'id' && f.name !== '_template')
    .map((child: any) => ({
      ...child,
      label: child.label || child.name,
      name: `${field.name}.${index}.${child.name}`,
    }));
}
export function SectionCopyControls({ input, field, tinaForm }: any) {
  const raw = useValues(tinaForm),
    values = {
      ...raw,
      sections: raw.sections || [],
      translations: raw.translations || {},
    } as CompositionDraft;
  const locale = /^translations\.([^.]+)\.copy\.sections$/.exec(
    field.name,
  )?.[1];
  const entries = input.value || [];
  return h(
    'div',
    {},
    ...entries.map((entry: any, index: number) =>
      h(
        'fieldset',
        { key: entry.id, 'data-copy-id': entry.id },
        h('legend', {}, entry.id),
        h(RegisteredFields, {
          tinaForm,
          fields: copyChildFields(field, entry, index),
        }),
      ),
    ),
    ...(locale
      ? values.sections
          .filter((s) => !entries.some((e: any) => e.id === s.id))
          .map((s) =>
            h(
              'button',
              {
                key: s.id,
                type: 'button',
                onClick: () =>
                  applyComposition(tinaForm.finalForm, (v) =>
                    initializeTranslationCopy(v, locale, s.id),
                  ),
              },
              'Add translation copy for ' + s.id,
            ),
          )
      : []),
  );
}
