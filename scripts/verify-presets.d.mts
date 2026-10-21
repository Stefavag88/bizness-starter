export function presetAssetInventory(dist:string):{path:string;sha256:string;bytes:number;preset:boolean}[];
export function assertPresetArtifacts(dist:string,local:boolean):ReturnType<typeof presetAssetInventory>;
export function verifyPresets(options?:{root?:string}):Promise<void>;
