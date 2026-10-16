import type { ProjectConfig } from '../../packages/config/project.mjs';
import { text,prose } from '../fields/common';
import { withTranslations } from '../i18n';
import { collection } from './common';
export const article=(p:ProjectConfig)=>collection('article','content/articles',withTranslations([text('contentId'),text('slug'),...prose,text('authorId'),text('offeringId'),{name:'updatedAt',type:'datetime'}],p,['status','publishAt','title','description','body','seoDescription','updatedAt']),p);
