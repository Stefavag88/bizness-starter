export function runOwnedCommand(executable:string,args:string[],options?:{
  timeoutMs?:number;
  cwd?:string;
  env?:NodeJS.ProcessEnv;
  onStart?:(pid:number)=>void;
  onOutput?:(text:string,stream:'stdout'|'stderr')=>void;
}):Promise<{stdout:string;stderr:string;pid:number}>;
