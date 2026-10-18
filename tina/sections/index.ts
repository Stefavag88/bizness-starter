import type { TinaField } from 'tinacms';
import type { ProjectConfig } from '../../packages/config/project.mjs';
import { createElement as h } from 'react';
import { text, object } from '../fields/common';
import { SectionControls } from '../fields/composition';
export const references: TinaField = {
  name: 'sections',
  label: 'Section composition',
  type: 'object',
  list: true,
  ui: { component: SectionControls },
  fields: [
    text('id', true),
    text('_template', true),
    { name: 'variant', type: 'string', options: ['default','expanded','cards','reversed','featured'] },
    { name: 'enabled', type: 'boolean' },
    object('media',[{name:'src',type:'image'}, {name:'crop',type:'string',options:['center','top','bottom']}]),
    object('items',[text('id',true),object('media',[{name:'src',type:'image'},{name:'crop',type:'string',options:['center','top','bottom']}])],true),
    object('appearance', [
      {
        name: 'surface',
        type: 'string',
        options: ['default', 'muted', 'accent'],
      },
    ]),
  ],
};
export function pageReferences(project: ProjectConfig): TinaField {
  return {
    ...references,
    ui: {
      component: (props: any) =>
        h(SectionControls, {
          ...props,
          articles: project.articles,
          project,
          languages: project.languages.filter((l) => l.code !== project.locale),
        }),
    },
  };
}
