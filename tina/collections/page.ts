import type { ProjectConfig } from '../../packages/config/project.mjs';
import { text, publication, meta } from '../fields/common';
import { pageReferences } from '../sections';
import {
  PageIdentityControls,
  createStandardPageDefaults,
} from '../fields/page-identity';
import { pageCopy } from '../templates/pages';
import { withTranslations } from '../i18n';
import { collection } from './common';
import descriptor from '../../.generated/cms.json';
import { PAGE_TEMPLATES } from '../../packages/content/schemas.mjs';
export function pages(p: ProjectConfig) {
  const { fields, ...base } = collection('page', 'content/pages', [], p, true);
  return {
    ...base,
    ui: {
      ...base.ui,
      allowedActions: { ...base.ui?.allowedActions, create: true },
    },
    ...(!p.articles && descriptor.articlePageFiles.length
      ? {
          match: {
            exclude: '@(' + descriptor.articlePageFiles.join('|') + ')',
          },
        }
      : {}),
    templates: PAGE_TEMPLATES.filter((t) => p.articles || t !== 'insights').map(
      (name) => ({
        name,
        label: name,
        ...(name === 'standard'
          ? { ui: { defaultItem: createStandardPageDefaults } }
          : {}),
        fields: withTranslations(
          [
            { ...text('contentId'), ui: { component: PageIdentityControls } },
            { ...text('slug'), ui: { component: PageIdentityControls } },
            ...publication,
            meta,
            pageReferences(p),
            pageCopy(),
          ],
          p,
          ['status', 'publishAt', 'meta', 'copy'],
        ),
      }),
    ),
  };
}
