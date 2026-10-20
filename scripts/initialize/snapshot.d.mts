export interface ApplicationSnapshot {revision:string;digest:string;files:Map<string,{bytes:Uint8Array;sha256:string}>;assertUnchanged():void}
export function snapshotApplication(root:string):ApplicationSnapshot;
export function createClientPackage(name:string,source:Record<string,any>):Record<string,any>;

export function readApplicationInput(root:string,path:string):Uint8Array;
