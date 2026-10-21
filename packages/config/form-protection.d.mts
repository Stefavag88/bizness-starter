import type {ProjectConfig} from './project.mjs';
export interface FormProtection {mode:'local'|'turnstile'|'unavailable';siteKey:string}
export function formProtection(project:ProjectConfig,preview?:boolean):FormProtection;
