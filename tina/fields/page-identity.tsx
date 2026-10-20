import { cmsElement as h } from './controls';
import { nativeRichText } from './rich-text';
export function PageIdentityControls({ input, field, tinaForm }: any) {
  return h('input', {
    ...input,
    id: field.name,
    'aria-label': field.label || field.name,
    type: 'text',
    value: input.value || '',
    readOnly: tinaForm.crudType !== 'create',
  });
}
export function createStandardPageDefaults() {
  return {
    _template: 'standard',
    contentId: '',
    slug: '',
    status: 'draft' as const,
    meta: { title: '', seoDescription: '' },
    sections: [
      {
        id: 'intro',
        _template: 'hero',
        variant: 'default',
        enabled: true,
        appearance: { surface: 'default' },
      },
    ],
    copy: {
      sections: [
        {
          id: 'intro',
          _template: 'hero',
          title: 'New page',
          description: nativeRichText(),
        },
      ],
    },
    translations: {},
  };
}
