import {resolve} from 'node:path';
import {nativeDocumentPath,type Mutation,type Schema} from './native-document';
/** Admit only the exact Page update backed up by the native media fixture. */
export function admitMediaNativeWrite(
 query:string,
 variables:Record<string,unknown>,
 schema:Schema,
 path:string,
):Mutation {
 const writes=query.match(/\b(?:create|update|delete)Document\b/g)??[];
 if(writes.length!==1||writes[0]!=='updateDocument'){
  throw Error('Native media write refused: expected one updateDocument operation');
 }
 const request={...variables,operation:'update'} as Mutation;
 if(request.collection!=='page'){
  throw Error('Native media write refused: expected the Page collection');
 }
 if(nativeDocumentPath(request,schema)!==resolve(path)){
  throw Error('Native media write refused: target is outside the backed-up fixture');
 }
 return request;
}
