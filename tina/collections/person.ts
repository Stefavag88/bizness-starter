import type { ProjectConfig } from '../../packages/config/project.mjs';
import { text,prose } from '../fields/common';
import { withTranslations } from '../i18n';
import { collection } from './common';
export const person=(p:ProjectConfig)=>collection('person','content/people',withTranslations([text('contentId'),text('slug'),...prose,text('role')],p,['status','publishAt','title','description','body','seoDescription','role']),p);
