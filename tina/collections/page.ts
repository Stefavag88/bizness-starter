import type { ProjectConfig } from '../../packages/config/project.mjs';
import { text,publication,meta } from '../fields/common';
import { references } from '../sections';
import { pageCopy } from '../templates/pages';
import { withTranslations } from '../i18n';
import { collection } from './common';
import descriptor from '../../.generated/cms.json';
import { PAGE_TEMPLATES } from '../../packages/content/schemas.mjs';
export function pages(p:ProjectConfig){
 const {fields,...base}=collection('page','content/pages',[],p,true);
 return {...base,...(!p.articles&&descriptor.articlePageFiles.length?{match:{exclude:'@('+descriptor.articlePageFiles.join('|')+')'}}:{}),templates:PAGE_TEMPLATES.filter(t=>p.articles||t!=='insights').map(name=>({name,label:name,fields:withTranslations([text('contentId',true),text('slug',true),...publication,meta,references,pageCopy(name)],p,['status','publishAt','meta','copy'])}))};
}
