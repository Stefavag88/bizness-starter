import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {admitMediaNativeWrite} from '../e2e/helpers/media-optimization-native-admission';
import {nativeDocumentPath,type Schema} from '../e2e/helpers/native-document';
const hash=(bytes:string)=>createHash('sha256').update(bytes).digest('hex');
function fixture(){
 const directory=mkdtempSync(join(tmpdir(),'media-native-admission-'));
 const pages=join(directory,'pages');mkdirSync(pages);
 const path=join(pages,'owned.json'),other=join(pages,'other.json');
 writeFileSync(path,'owned original');writeFileSync(other,'unrelated original');
 // Same directory deliberately proves collection admission independently from path equality.
 const schema:Schema={collections:[{name:'page',path:pages,fields:[]},{name:'settings',path:pages,fields:[]}]};
 return {path,other,schema};
}
it.each([
 ['wrong-target','updateDocument','page','other.json'],
 ['wrong-collection','updateDocument','settings','owned.json'],
 ['wrong-create','createDocument','page','owned.json'],
 ['wrong-delete','deleteDocument','page','owned.json'],
 ['multiple-writes','updateDocument createDocument','page','owned.json'],
])('refuses %s before dispatch or pending/hash advancement',(_name,query,collection,relativePath)=>{
 const {path,other,schema}=fixture();let dispatched=0,pending:unknown;let expectedHash=hash('owned original');
 const beforeHash=expectedHash;
 expect(()=>{
  const request=admitMediaNativeWrite(query,{collection,relativePath,params:{}},schema,path);
  pending={request,bytes:'unexpected write'};
  dispatched++;writeFileSync(nativeDocumentPath(request,schema),'unexpected write');expectedHash=hash('unexpected write');
 }).toThrow(/Native media write refused/);
 expect(dispatched).toBe(0);expect(pending).toBeUndefined();expect(expectedHash).toBe(beforeHash);
 expect(readFileSync(path,'utf8')).toBe('owned original');expect(readFileSync(other,'utf8')).toBe('unrelated original');
});
it('admits only the intended update operation/collection/exact backed-up target',()=>{
 const {path,schema}=fixture();const request=admitMediaNativeWrite('mutation Update { updateDocument }',{collection:'page',relativePath:'owned.json',params:{page:{}}},schema,path);
 expect(request.operation).toBe('update');expect(request.collection).toBe('page');expect(nativeDocumentPath(request,schema)).toBe(resolve(path));
});
