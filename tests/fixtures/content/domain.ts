import { z } from 'zod';
import type { DomainDefinition } from '../../../packages/content/domain-contracts';
export const lessonSchema=z.strictObject({contentId:z.string().min(1),slug:z.string().min(1),title:z.string().min(1)});
export type Lesson=z.infer<typeof lessonSchema>;
export const lessonDomain=(enabled=true):DomainDefinition<Lesson,Lesson & import('../../../packages/content/types').RouteFields>=>({
 key:'lessons',collectionName:'lesson',directory:'lessons',schema:lessonSchema,
 ownedPages:[{filename:'lessons.json',template:'lessons',contentId:'lesson-index'}],
 enabled:()=>enabled,richFields:[],projectRecord:record=>({...record}),routePath:record=>'/en/lessons/'+record.slug,
 validate:()=>{},enquiry:false,
});
declare module '../../../packages/content/domain-contracts' {
 interface DomainRecordMap {lessons:Lesson}
 interface LocalizedDomainRecordMap {lessons:Lesson & import('../../../packages/content/types').RouteFields}
}
