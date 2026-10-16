import type { TinaField } from 'tinacms';
import descriptor from '../../.generated/cms.json';
import { object } from '../fields/common';
import { sectionCopy } from '../sections';
export function pageCopy(template:string):TinaField {
 const sections=new Map<string,string>();
 for(const page of descriptor.pages.filter(p=>p._template===template))for(const section of page.sections){const prior=sections.get(section.id);if(prior&&prior!==section._template)throw Error('Section IDs must use a consistent type across seeded pages: '+section.id);sections.set(section.id,section._template);}
 return object('copy',[object('sections',[...sections].map(([id,type])=>({...object(id,sectionCopy(type)),label:id.replaceAll('_',' ')+' ('+type+')'})))]);
}
