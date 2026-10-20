import type {ProjectConfig} from '../config/project.mjs';import type {LocalizedContent,Route} from '../content/types';import type {PresetId} from './catalog.mjs';
export interface PresetOptions {name:string;languages:('en'|'el')[];defaultLanguage:'en'|'el';theme?:string;articles?:boolean}
export interface PresetBundle {project:ProjectConfig;files:Map<string,Uint8Array>}
export function createPresetBundle(id:PresetId,options:PresetOptions):PresetBundle;
export function projectPresetBundle(bundle:PresetBundle,options:{assetRoot:string;now?:Date}):{contents:LocalizedContent[];routes:Route[]};
