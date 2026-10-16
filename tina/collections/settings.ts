import type { ProjectConfig } from '../../packages/config/project.mjs';
import descriptor from '../../.generated/cms.json';
import { text,object } from '../fields/common';
import { rich } from '../fields/rich-text';
import { collection } from './common';
export function settings(p:ProjectConfig){
 const translated=[object('brand',[text('tagline')]),object('legal',[rich('notice')]),object('contact',[text('address')]),object('navigation',descriptor.navigation.map(id=>text(id)))];
 return {...collection('settings','content/settings',[object('brand',[text('name'),text('tagline')]),object('legal',[text('businessName'),text('privacyVersion'),rich('notice')]),object('contact',[text('email'),text('phone'),text('address')]),object('navigation',[text('pageId'),text('label')],true),object('translations',p.languages.filter(l=>l.code!==p.locale).map(l=>({...object(l.code.replaceAll('-','_'),translated),label:l.label})))],p,true),match:{include:'site'}};
}
