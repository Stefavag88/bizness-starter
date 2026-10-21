import {z} from 'zod';
import {formProtection} from '../config/form-protection.mjs';
import {isSafeMarkdown} from './rich-text.mjs';
import {LIMITS} from './section-registry.mjs';
const text=z.string().trim().max(LIMITS.title).default('');
const body=z.string().max(LIMITS.body).refine(v=>isSafeMarkdown(v),'Only safe Markdown is allowed').default('');
const inline=z.string().max(LIMITS.description).refine(v=>isSafeMarkdown(v,true),'Only inline emphasis and safe links are allowed').default('');
const copy={title:text,body,footerPrompt:inline,emailLabel:text,submitLabel:text,consentLabel:z.string().trim().max(LIMITS.description).default(''),privacyLinkLabel:text,dismissLabel:text,successTitle:text,successBody:body};
export const newsletterCopySchema=z.strictObject(copy);
export const newsletterSettingsSchema=z.strictObject({enabled:z.boolean().default(false),modalEnabled:z.boolean().default(true),autoOpen:z.boolean().default(true),footerMode:z.enum(['off','open-modal','inline']).default('open-modal'),delaySeconds:z.number().int().min(5).max(120).default(12),dismissDays:z.number().int().min(1).max(180).default(30),acceptedDays:z.number().int().min(30).max(365).default(180),interestId:z.string().max(40).default(''),...copy});
const active=p=>p.profile!=='enquiries'&&p.modules.newsletterPrompt;
function validateCopy(value,policy,locale){
 const required=['emailLabel','submitLabel','consentLabel','privacyLinkLabel','successTitle','successBody'];
 if(policy.modalEnabled)required.push('title','body','dismissLabel');
 if(policy.footerMode==='inline')required.push('footerPrompt');
 for(const key of required)if(!value?.[key]?.trim())throw Error(`Newsletter ${locale}: ${key} is required`);
}
export function validateNewsletterSettings(settings,project){
 const policy=newsletterSettingsSchema.parse(settings.newsletterPrompt??{});
 if(!active(project)||!policy.enabled)return;
 if(policy.footerMode==='open-modal'&&!policy.modalEnabled)throw Error('Newsletter open-modal footer requires modalEnabled');
 if(!project.interests.some(i=>i.id===policy.interestId))throw Error('Newsletter requires a configured interest');
 validateCopy(policy,policy,project.locale);
 for(const language of project.languages)if(language.code!==project.locale)validateCopy(settings.translations?.[language.code]?.newsletterPrompt,policy,language.code);
}
export function resolveNewsletterExperience(settings,project,context){
 const value=newsletterSettingsSchema.parse(settings.newsletterPrompt??{});
 if(!active(project)||!value.enabled||!context.privacyHref)return null;
 try{validateCopy(value,value,context.locale);}catch{return null;}
 if(!project.interests.some(i=>i.id===value.interestId)||(value.footerMode==='open-modal'&&!value.modalEnabled))return null;
 const protection=formProtection(project);
 const canSubmit=protection.mode==='turnstile'||protection.mode==='local'&&context.localProtectionAvailable;
 const excluded=['contact','privacy','error','system','newsletter','cms','admin','showcase'];
 return {...value,protection,interest:value.interestId,privacyHref:context.privacyHref,canSubmit,autoEligible:canSubmit&&value.modalEnabled&&value.autoOpen&&!excluded.includes(context.pageKind),preferences:project.modules.visitorPreferences&&value.modalEnabled&&value.autoOpen};
}
