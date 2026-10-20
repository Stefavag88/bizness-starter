import {parseProject} from '../../packages/config/project.mjs';
import {newsletterSettingsSchema} from '../../packages/content/newsletter.mjs';
import {project,normalizedSettings} from './content/factory';
import {copy} from './newsletter-copy';
export {copy};
export const enabledProject=()=>parseProject({...project,profile:'newsletter',modules:{...project.modules,newsletterPrompt:true,visitorPreferences:true},interests:[{id:'updates',label:'Updates'}]});
export const enabledSettings=()=>({...normalizedSettings(),newsletterPrompt:{...newsletterSettingsSchema.parse({}),...copy,enabled:true,interestId:'updates'},translations:{el:{...normalizedSettings().translations.el,newsletterPrompt:{...copy,title:'Χρήσιμες ενημερώσεις',footerPrompt:'Λάβετε **ενημερώσεις**.'}}}});
