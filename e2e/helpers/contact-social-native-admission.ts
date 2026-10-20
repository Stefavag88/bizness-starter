import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const graphqlPath=require.resolve('graphql',{paths:[require.resolve('@tinacms/cli')]});
const {parse,buildSchema,getOperationAST}=require(graphqlPath);
const {getVariableValues}=createRequire(graphqlPath)('graphql/execution/values');
/** Narrow wire admission. No request is dispatched until this and full serializer proof pass. */
export function assertContactSettingsMutation(body:unknown,sourcePath:string):void {
 const refuse=()=>{throw Error('Contact native mutation refused: expected one exact update/settings/site.json');};
 if(!body||typeof body!=='object'||Array.isArray(body))return refuse();
 const b=body as any,v=b.variables;
 if(typeof b.query!=='string'||!v||v.collection!=='settings'||v.relativePath!=='site.json'||!v.params?.settings||Object.keys(v.params).length!==1||resolve(sourcePath)!==resolve('content/settings/site.json'))return refuse();
 let ast:any;try{ast=parse(b.query);}catch{return refuse();}
 if(ast.definitions.length!==1)return refuse();
 const op=ast.definitions[0];
 if(op.kind!=='OperationDefinition'||op.operation!=='mutation'||op.selectionSet.selections.length!==1)return refuse();
 const field=op.selectionSet.selections[0];
 if(field.kind!=='Field'||field.name.value!=='updateDocument'||field.alias||field.directives.length||op.directives.length)return refuse();
 const args=field.arguments;
 if(args.length!==3||!['collection','relativePath','params'].every(name=>args.some((a:any)=>a.name.value===name&&a.value.kind==='Variable'&&a.value.name.value===name)))return refuse();
}

/** Installed GraphQL coercion orders input fields before the resolver/serializer sees them. */
export function coerceContactSettingsVariables(body:any,schemaSDL:string){
 const operation=getOperationAST(parse(body.query));
 if(!operation)throw Error('Contact native coercion: missing operation');
 const {coerced,errors}=getVariableValues(buildSchema(schemaSDL),operation.variableDefinitions,body.variables);
 if(errors?.length)throw Error('Contact native coercion: '+errors.map((error:Error)=>error.message).join('; '));
 return {...coerced,operation:'update' as const};
}
