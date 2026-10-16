import {expect,it} from 'vitest';
import {expectedNativeDocument} from '../e2e/helpers/native-document';
const rich={type:'root',children:[{type:'p',children:[{text:'Probe',bold:true}]}]};
const templates=[{name:'rich_text',nameOverride:'rich-text',fields:[{name:'id',type:'string'},{name:'body',type:'rich-text'}]},{name:'offering_list',nameOverride:'offering-list',fields:[{name:'id',type:'string'}]}];
const schema={collections:[{name:'page',path:'content/pages',templates:[{name:'standard',fields:[{name:'copy',type:'object',fields:[{name:'sections',type:'object',list:true,templates}]},{name:'publishAt',type:'datetime'}]}]}]};
it('derives nested canonical aliases and bold serialization without changing the native AST',async()=>{
 const mutation={operation:'create' as const,collection:'page',relativePath:'/probe.json',params:{page:{standard:{copy:{sections:[{rich_text:{id:'a',body:rich}},{offering_list:{id:'b'}}]},publishAt:null}}}};
 const before=structuredClone(mutation);
 expect(await expectedNativeDocument(mutation,schema)).toEqual({_template:'standard',copy:{sections:[{id:'a',body:'**Probe**\n',_template:'rich-text'},{id:'b',_template:'offering-list'}]},publishAt:'1970-01-01T00:00:00.000Z'});
 expect(mutation).toEqual(before);
});
it('preserves only prior legacy fields on update and does not infer new disk bytes',async()=>{
 expect(await expectedNativeDocument({operation:'update',collection:'page',relativePath:'probe.json',params:{page:{standard:{publishAt:'2026-10-16T13:00:00+03:00'}}}},schema,{legacy:'safe',_template:'standard',publishAt:'old'})).toEqual({legacy:'safe',_template:'standard',publishAt:'2026-10-16T10:00:00.000Z'});
});
it.each(['../probe.json','//probe.json','\\\\server\\probe.json','nested/probe.json','C:/probe.json'])('rejects unsafe native creation path %s',async relativePath=>{
 await expect(expectedNativeDocument({operation:'create',collection:'page',relativePath,params:{page:{standard:{}}}},schema)).rejects.toThrow(/Mutation source/);
});
