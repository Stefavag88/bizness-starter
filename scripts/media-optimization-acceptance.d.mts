export interface MediaAcceptanceRunOptions {
 root?:string;
 expected?:()=>Record<string,string>;
 isStopped?:()=>boolean;
 checkPorts?:()=>Promise<void>;
}
export function createMediaAcceptanceRun(options?:MediaAcceptanceRunOptions):{
 directory:string;
 assertInputs():void;
 command(args:string[],options?:{cwd?:string;timeoutMs?:number;env?:Record<string,string>}):Promise<void>;
 configure():Promise<void>;
 build(args?:string[]):Promise<void>;
 finish():{directory:string;unchanged:boolean};
};
export function verifyMediaOptimization(options?:{phase?:string;root?:string;checkPorts?:()=>Promise<void>}):Promise<{directory:string;unchanged:boolean}>;
