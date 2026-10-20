import type {TinaField} from 'tinacms';
import type {ProjectConfig} from '../../packages/config/project.mjs';
import {object,text} from './common';
import {rich} from './rich-text';
export function newsletterFields(project:ProjectConfig,{translated=false}={}):TinaField[]{
 const copy:TinaField[]=[{...text('title'),label:'Modal title'},{...rich('body'),label:'Modal body'},{...rich('footerPrompt',true),label:'Short footer prompt'},...['emailLabel','submitLabel','consentLabel','privacyLinkLabel','dismissLabel','successTitle'].map(name=>text(name)),{...rich('successBody'),label:'Received request message',description:'A request is not an active subscription. Ask visitors to confirm by email.'}];
 const fields:TinaField[]=translated?copy:[
  {name:'enabled',label:'Enable newsletter signup',type:'boolean',ui:{defaultValue:false}},
  {name:'modalEnabled',label:'Enable modal',type:'boolean',ui:{defaultValue:true}},
  {name:'autoOpen',label:'Automatic prompts',type:'boolean',ui:{defaultValue:true}},
  {name:'footerMode',label:'Footer signup',type:'string',ui:{defaultValue:'open-modal'},options:[{value:'off',label:'None'},{value:'open-modal',label:'Open modal'},{value:'inline',label:'Compact inline form'}]},
  ...[['delaySeconds','Delay in visible seconds'],['dismissDays','Dismissal cooldown in days'],['acceptedDays','Received request cooldown in days']].map(([name,label])=>({name,label,type:'number',ui:{defaultValue:{delaySeconds:12,dismissDays:30,acceptedDays:180}[name]}} as TinaField)),
  {name:'interestId',label:'Newsletter interest',type:'string',options:project.interests.map(i=>({value:i.id,label:i.label}))},...copy];
 const available=project.profile!=='enquiries'&&project.modules.newsletterPrompt;
 return [{name:'newsletterPrompt',type:'object',fields,label:'Newsletter signup',description:'Modal and footer share consent and interest. Review material consent changes alongside Legal privacyVersion.',...(!available?{ui:{component:'hidden' as const}}:{})}];
}
