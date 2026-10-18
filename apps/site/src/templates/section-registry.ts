import {sectionDefinitions} from '../../../../packages/content/section-registry.mjs';
import type {SectionType} from '../../../../packages/content/types';
export const sectionRegistry=Object.freeze(Object.fromEntries(sectionDefinitions.map(definition=>[definition.type,definition.variants]))) as Readonly<Record<SectionType,readonly string[]>>;
export function rendererKey(type:string,variant:string):SectionType {
 if(!Object.hasOwn(sectionRegistry,type)||!sectionRegistry[type as SectionType].includes(variant))throw Error('Unsupported section '+type+'/'+variant);
 return type as SectionType;
}
