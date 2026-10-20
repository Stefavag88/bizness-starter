import {newsletterFields} from '../fields/newsletter';
import {createElement as h} from 'react';
import {getDisabledDomainPages} from '../../packages/content/domain-registry.mjs';
import type { ProjectConfig } from '../../packages/config/project.mjs';
import { navigationLabels } from '../fields/section-copy';
import { NavigationControls } from '../fields/navigation';
import { text, object } from '../fields/common';
import { contactFields, socialFields } from '../fields/contact';
import { rich } from '../fields/rich-text';
import { collection } from './common';
export function settings(p: ProjectConfig) {
  const disabledPageFiles=[...getDisabledDomainPages(p).map(page=>page.filename),...(!p.articles?['insights.json']:[])];
  const navigation=()=>({...navigationLabels(),ui:{component:(props:any)=>h(NavigationControls,{...props,disabledPageFiles,languages:p.languages,defaultLocale:p.locale})}});
  const translated = [
    ...newsletterFields(p,{translated:true}),
    object('brand', [text('tagline')]),
    object('legal', [rich('notice')]),
    object('contact', contactFields().filter(field => field.name === 'address')),
    navigation(),
  ];
  return {
    ...collection(
      'settings',
      'content/settings',
      [
        ...newsletterFields(p),
        object('brand', [text('name'), text('tagline')]),
        object('legal', [
          text('businessName'),
          text('privacyVersion'),
          rich('notice'),
        ]),
        object('contact', contactFields()),
        { ...object('social', socialFields()), label: 'Social channels' },
        navigation(),
        object(
          'translations',
          p.languages
            .filter((l) => l.code !== p.locale)
            .map((l) => ({
              ...object(l.code.replaceAll('-', '_'), translated),
              label: l.label,
            })),
        ),
      ],
      p,
      true,
    ),
    match: { include: 'site' },
  };
}
