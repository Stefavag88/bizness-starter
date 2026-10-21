import type {FormProtection} from '../config/form-protection.mjs';
import type {ZodType} from 'zod';
import type {ProjectConfig} from '../config/project.mjs';
export interface NewsletterCopy {title:string;body:string;footerPrompt:string;emailLabel:string;submitLabel:string;consentLabel:string;privacyLinkLabel:string;dismissLabel:string;successTitle:string;successBody:string}
export interface NewsletterPolicy {modalEnabled:boolean;autoOpen:boolean;footerMode:'off'|'open-modal'|'inline';delaySeconds:number;dismissDays:number;acceptedDays:number}
export interface NewsletterSettings extends NewsletterCopy,NewsletterPolicy {enabled:boolean;interestId:string}
export interface NewsletterExperience extends NewsletterSettings {protection:FormProtection;interest:string;privacyHref:string;canSubmit:boolean;autoEligible:boolean;preferences:boolean}
export const newsletterCopySchema:ZodType<NewsletterCopy>;
export const newsletterSettingsSchema:ZodType<NewsletterSettings>;
export function validateNewsletterSettings(settings:{newsletterPrompt?:NewsletterSettings;translations?:Record<string,{newsletterPrompt?:NewsletterCopy}>},project:ProjectConfig):void;
export function resolveNewsletterExperience(settings:{newsletterPrompt?:NewsletterSettings},project:ProjectConfig,context:{locale:string;privacyHref:string|null;pageKind:string;localProtectionAvailable:boolean}):NewsletterExperience|null;
