import {parseProject} from '../../packages/config/project.mjs';
import {newsletterSettingsSchema} from '../../packages/content/newsletter.mjs';
import {project,normalizedSettings} from './content/factory';
export const copy={title:'Useful updates',body:'## Useful news\n\nA **short** message.',footerPrompt:'Get **useful** updates.',emailLabel:'Email',submitLabel:'Sign up',consentLabel:'I agree to newsletter emails.',privacyLinkLabel:'Privacy',dismissLabel:'Close',successTitle:'Check your inbox',successBody:'If appropriate, confirm using the email link.'};
export const enabledProject=()=>parseProject({...project,profile:'newsletter',modules:{...project.modules,newsletterPrompt:true,visitorPreferences:true},interests:[{id:'updates',label:'Updates'}]});
export const enabledSettings=()=>({...normalizedSettings(),newsletterPrompt:{...newsletterSettingsSchema.parse({}),...copy,enabled:true,interestId:'updates'},translations:{el:{...normalizedSettings().translations.el,newsletterPrompt:{...copy,title:'Χρήσιμες ενημερώσεις',footerPrompt:'Λάβετε **ενημερώσεις**.'}}}});
