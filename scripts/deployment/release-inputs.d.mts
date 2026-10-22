export function sha256(bytes:string|Uint8Array):string;
export function canonical(value:unknown):string;
export function safePath(path:string):string;
export function regularBytes(root:string,path:string):Buffer;
export function regularTree(root:string,prefix?:string):Record<string,string>;
export function sanitizedBuildEnv(source:NodeJS.ProcessEnv,workspace:string):NodeJS.ProcessEnv;
export function snapshotReleaseInputs(root:string):{files:Map<string,{bytes:Buffer;sha256:string}>;sourceRevision:string|null;digest:string;assertUnchanged():void};
