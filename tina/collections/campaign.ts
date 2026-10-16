import type { ProjectConfig } from '../../packages/config/project.mjs';
import { text } from '../fields/common';
import { collection } from './common';
export const campaign=(p:ProjectConfig)=>collection('campaign','content/campaigns',[text('contentId'),text('subject'),{name:'intro',type:'string',ui:{component:'textarea'}},text('articleId'),{name:'interest',type:'string',options:p.interests.map(i=>({value:i.id,label:i.label}))}],p);
