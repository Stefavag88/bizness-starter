export interface LocalPorts {site:number;worker:number;tina:number;datalayer:number}
export function resolvePorts(env?:Record<string,string|undefined>):LocalPorts;
export function assertPortsFree(ports:Record<string,number>):Promise<void>;
