import type { ProjectConfig } from '../../packages/config/project.mjs';
import { text,prose } from '../fields/common';
import { withTranslations } from '../i18n';
import { collection } from './common';
export const offering=(p:ProjectConfig)=>collection('offering','content/offerings',withTranslations([text('contentId'),text('slug'),...prose],p,['status','publishAt','title','description','body','seoDescription']),p);
