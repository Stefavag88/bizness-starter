import { expect,it } from 'vitest';
import { createDomainRegistry,defineDomain,getActiveDomains,getDisabledDomainPages } from '../packages/content/domain-registry.mjs';
import { lessonDomain } from './fixtures/content/domain';
import { project } from './fixtures/content/factory';
it('selects only enabled definitions without changing the static registry',()=>{
 const registry=createDomainRegistry([defineDomain(lessonDomain()),defineDomain({...lessonDomain(false),key:'courses',collectionName:'course',directory:'courses',ownedPages:[{filename:'courses.json',template:'courses',contentId:'course-index'}]})]);
 expect(getActiveDomains(project,registry).map(d=>d.key)).toEqual(['lessons']);
 expect(getDisabledDomainPages(project,registry)).toEqual([{filename:'courses.json',template:'courses',contentId:'course-index'}]);
 expect(getActiveDomains(project)).toEqual([]);
});
it.each(['key','collectionName','directory'] as const)('rejects duplicate %s declarations',field=>{
 const other={...lessonDomain(),key:'courses',collectionName:'course',directory:'courses',ownedPages:[]};
 other[field]=lessonDomain()[field];
 expect(()=>createDomainRegistry([lessonDomain(),other])).toThrow(/duplicate|collision/i);
});
it('rejects shared owned filenames even when both domains are disabled',()=>{
 expect(()=>createDomainRegistry([lessonDomain(false),{...lessonDomain(false),key:'courses',collectionName:'course',directory:'courses'}])).toThrow(/filename|page/i);
});
it.each(['settings','page','pages','offering','offerings','person','people','article','articles','campaign','campaigns'])('rejects built-in alias or directory %s',name=>{
 expect(()=>createDomainRegistry([{...lessonDomain(),collectionName:name}])).toThrow(/reserved|built.in|collision/i);
 expect(()=>createDomainRegistry([{...lessonDomain(),directory:name}])).toThrow(/reserved|built.in|collision/i);
});
it.each(['../lessons','lessons/nested','lessons\\nested','','Lessons','x'.repeat(65)])('rejects unsafe collection directory %j',directory=>{
 expect(()=>defineDomain({...lessonDomain(),directory})).toThrow(/directory/i);
});
it.each(['../lessons.json','lessons/nested.json','lessons.JSON','lessons','@(home).json'])('rejects unsafe owned Page filename %s',filename=>{
 expect(()=>defineDomain({...lessonDomain(),ownedPages:[{filename,template:'lessons',contentId:'lesson-index'}]})).toThrow(/filename/i);
});
it('reserves built-in Page ownership and rejects duplicate Page template ownership',()=>{
 expect(()=>defineDomain({...lessonDomain(),ownedPages:[{filename:'home.json',template:'lessons',contentId:'lesson-index'}]})).toThrow(/reserved|built.in/i);
 expect(()=>createDomainRegistry([lessonDomain(),{...lessonDomain(),key:'courses',collectionName:'course',directory:'courses',ownedPages:[{filename:'courses.json',template:'lessons',contentId:'course-index'}]}])).toThrow(/template/i);
});
it('keeps registry ownership stable if a caller mutates the original declaration',()=>{
 const definition=lessonDomain(),registry=createDomainRegistry([definition]);
 (definition.ownedPages as {filename:string;template:string;contentId:string}[])[0].filename='different.json';
 expect(getDisabledDomainPages(project,createDomainRegistry([{...registry.definitions[0],enabled:()=>false}]))[0].filename).toBe('lessons.json');
});
it('accepts camel-case rich field keys declared by a domain schema',()=>{
 const registry=createDomainRegistry([{...lessonDomain(),richFields:[{path:['copy','bedDescription'],inline:true}]}]);
 expect(getActiveDomains(project,registry)[0].richFields).toEqual([{path:['copy','bedDescription'],inline:true}]);
});
