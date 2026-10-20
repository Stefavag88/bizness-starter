import type {PresetId} from '../../packages/presets/catalog.mjs';
export interface InitializeOptions {help:boolean;dryRun:boolean;preset:PresetId;name:string;destination:string;languages:('en'|'el')[];defaultLanguage:'en'|'el';theme?:string}
export function parseInitializeArgs(argv:string[]):InitializeOptions;
export function formatInitializeCommand(options:InitializeOptions):string;
