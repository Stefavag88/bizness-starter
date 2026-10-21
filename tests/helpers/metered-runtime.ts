import {environment} from '../db';
export function observedEnvironment(profile='newsletter') {
 const fixture=environment(profile); const observed={statements:0,bindingCalls:0}; const raw=fixture.env.DB;
 const wrap=(s:any):any=>new Proxy(s,{get(target,key){if(key==='__raw')return target;if(key==='bind')return(...args:any[])=>wrap(target.bind(...args));if(['first','all','run','raw'].includes(String(key)))return(...args:any[])=>{observed.statements++;observed.bindingCalls++;return target[key](...args);};return Reflect.get(target,key);}});
 fixture.env.DB={prepare:(sql:string)=>wrap(raw.prepare(sql)),batch:async(statements:any[])=>{observed.statements+=statements.length;observed.bindingCalls++;return raw.batch(statements.map(s=>(s as any).__raw??s));}} as any;
 return {...fixture,observed};
}
