export function verifyProfiles(options?: {path?:string;backupRoot?:string;run?:(profile:string,articles:boolean)=>Promise<void>;refresh?:()=>Promise<unknown>}):Promise<void>;
