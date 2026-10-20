export type PresetId='neutral'|'professional-services'|'trades'|'accommodation'|'studio';
export interface PresetMetadata {readonly id:PresetId;readonly version:1;readonly title:Readonly<{en:string;el:string}>;readonly summary:Readonly<{en:string;el:string}>;readonly suggestedTheme:string;readonly rooms:boolean}
export const presetCatalog:readonly PresetMetadata[];
