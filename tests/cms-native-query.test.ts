import { it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseProject } from '../packages/config/project.mjs';
import { validateCurrentSave } from '../tina/validation';
import { buildCollections } from '../tina/collections';
const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));
const url=process.env.CMS_QUERY_URL;
const request=async(query:string,{variables={}}:any={})=>{const response=await fetch(url!,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables})});const result:any=await response.json();if(result.errors)throw Error(JSON.stringify(result.errors));return result.data;};
it.skipIf(!url)('validates actual native GraphQL ASTs and candidate catalogs without saving',async()=>{
 const cms={api:{tina:{request}}};
 for(const kind of ['settings','page','offering','person','article']){
  const result=await request(`query { ${kind}Connection { edges {node { ... on Document {_values _sys {relativePath}} }}}}`);
  const node=result[kind+'Connection'].edges[0].node;const values=node._values;const original=structuredClone(values);
  expect(await validateCurrentSave(values,kind,project,cms,{operation:'update',relativePath:node._sys.relativePath})).toBe(values);expect(values).toEqual(original);
  const collection=buildCollections(project).find(c=>c.name===kind)!;
  expect(await collection.ui!.beforeSubmit!({values,cms,form:{crudType:'update',path:collection.path+'/'+node._sys.relativePath}})).toBe(values);
  if(kind==='offering'){
   const duplicate={...values,contentId:'home'};await expect(validateCurrentSave(duplicate,kind,project,cms,{operation:'create',relativePath:'new-offering.json'})).rejects.toThrow(/Duplicate/);
   await expect(validateCurrentSave({...values,contentId:'new-offering',slug:values.slug},kind,project,cms,{operation:'create',relativePath:'new-offering.json'})).rejects.toThrow(/collision|duplicate/i);
  }
 }
},30000);
