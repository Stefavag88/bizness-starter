import type {PresetBundle,PresetOptions} from '../../packages/presets/bundle.mjs';import type {PresetId} from '../../packages/presets/catalog.mjs';
export function snapshotPresetInputs(root:string):{hashes:Map<string,string>;assertUnchanged():void};
export function generatePresetBundle(root:string,options:PresetOptions&{preset:PresetId},hashes:Map<string,string>):PresetBundle;
