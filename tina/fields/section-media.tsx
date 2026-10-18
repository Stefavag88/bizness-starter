import { createElement as h, lazy, Suspense, useState } from 'react';
import { applyComposition, useValues } from './composition';
import {
  setSectionMedia,
  addSectionItem,
} from '../../packages/content/section-items.mjs';
import {
  mediaReferenceSchema,
  type MediaReference,
} from '../../packages/content/media.mjs';
import { newItemCopy } from './section-items';
/** Native blank is a callback state, never a persisted media object. */
export function selectedSectionMedia(
  value: unknown,
  current?: MediaReference,
): MediaReference | null {
  if (value === '' || value == null) return null;
  return mediaReferenceSchema.parse({
    src: value,
    crop: current?.crop || 'center',
  });
}
const NativeSource = lazy(async () => {
  const { useCMS } = await import('tinacms');
  return {
    default: (props: any) => {
      const cms = useCMS();
      const plugin = cms.fields.find('image');
      if (!plugin) throw Error('Native image field is not registered');
      return h(plugin.Component, props);
    },
  };
});
export function SectionMediaControls({
  tinaForm,
  sectionId,
  itemId,
  adding = false,
}: any) {
  const values = useValues(tinaForm),
    section = values.sections.find((s: any) => s.id === sectionId);
  const current = itemId
    ? section.items.find((i: any) => i.id === itemId)?.media
    : section.media;
  const [error, setError] = useState('');
  const run = (operation: any) => {
    try {
      applyComposition(tinaForm.finalForm, operation);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const name = `sections.${values.sections.indexOf(section)}.${itemId ? 'items.' + section.items.findIndex((i: any) => i.id === itemId) + '.' : ''}media.src`;
  return h(
    'div',
    { 'data-section-media': itemId || sectionId },
    error && h('p', { role: 'alert' }, error),
    h(
      Suspense,
      { fallback: null },
      h(NativeSource, {
        tinaForm,
        form: tinaForm.finalForm,
        meta: {},
        field: {
          name,
          label: adding ? 'Add gallery image' : 'Shared image',
          clearable: !itemId && !adding,
          accept: ['png', 'jpg', 'jpeg', 'webp'],
        },
        input: {
          name,
          value: adding ? '' : current?.src || '',
          onChange: (value: unknown) =>
            run((v: any) => {
              const media = selectedSectionMedia(value, current);
              if (adding) {
                if (!media) return v;
                const id = 'item_' + crypto.randomUUID().replaceAll('-', '');
                return addSectionItem(v, sectionId, {
                  id,
                  copy: newItemCopy('gallery', id),
                  media,
                });
              }
              return setSectionMedia(v, { sectionId, itemId, media });
            }),
        },
      }),
    ),
    !adding &&
      current &&
      h(
        'label',
        {},
        ' Shared crop ',
        h(
          'select',
          {
            value: current.crop,
            onChange: (e: any) =>
              run((v: any) =>
                setSectionMedia(v, {
                  sectionId,
                  itemId,
                  media: { ...current, crop: e.target.value },
                }),
              ),
          },
          ...['center', 'top', 'bottom'].map((crop) =>
            h('option', { key: crop, value: crop }, crop),
          ),
        ),
      ),
  );
}
