import type {ZodType} from 'zod';
import type {SettingsCopy,SocialSettings,ContactLink,ContactChannels} from './types';
export type {SocialSettings,ContactLink,ContactChannels} from './types';
export const SOCIAL_CHANNELS:readonly ['instagram','linkedin','facebook','whatsapp'];
export const socialSettingsSchema:ZodType<SocialSettings,unknown>;
export function phoneHref(value:string):string|undefined;
export function contactChannels(settings:SettingsCopy,locale:string):ContactChannels;
