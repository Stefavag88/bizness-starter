import type {Server} from 'node:http';
export function probePorts(env?:Record<string,string|undefined>):{site:number;tina:number;datalayer:number};
export function runProbe():Promise<void>;
export function runProbeCommand(options:{
  root:string;
  ports:Record<string,number>;
  server:Server;
  args:string[];
  executable?:string;
  env?:NodeJS.ProcessEnv;
  hooks?:unknown[];
  checkPorts?:(ports:Record<string,number>)=>Promise<void>;
  onOutput?:(text:string)=>void;
}):Promise<void>;
