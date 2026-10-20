import { cmsElement as h } from './controls';
import {roomListCopyFields} from '../domains/rooms/fields';
import { lazy, Suspense } from 'react';
import type { TinaField, Template } from 'tinacms';
import { sectionDefinitions } from '../../packages/content/section-registry.mjs';
import { text, object, link, editorLabel } from './common';
import { SectionCopyControls } from './composition';
import {FixedSectionItems} from './section-items';
import { rich } from './rich-text';

// Load the native renderer in the browser; schema construction stays usable in Node.
const NativeFields = lazy(async () => ({ default: (await import('tinacms')).FieldsBuilder }));

// Resolved native fields keep Tina's rich controls, with fixed membership at this checkpoint.
export function FixedEntries({ input, field, tinaForm }: any) {
  return h('div', {}, ...(input.value || []).map((entry: any, index: number) => {
    const template = field.templates?.[entry._template];
    const fields = template?.fields || field.fields || [];
    const children = fields.map((child: any) => ({ ...child, name: `${field.name}.${index}.${child.name}` }));
    return h('fieldset', { key: entry.id || entry.pageId },
      h('legend', {}, entry.id || entry.pageId),
      h(Suspense, { fallback: null }, h(NativeFields, { form: tinaForm, fields: children })));
  }));
}

// Tina-only registration seam for module-owned section copy controls.
export const moduleSectionCopyFields:Readonly<Record<string,()=>TinaField[]>>=Object.freeze({'room-list':roomListCopyFields});
export function sectionCopyFields(type: string): TinaField[] {
  if(moduleSectionCopyFields[type])return moduleSectionCopyFields[type]();
  if(type==='media-text')return [text('id',true),text('title'),rich('body'),object('image',[text('alt'),rich('caption',true)]),link];
  if(type==='gallery')return [text('id',true),text('title'),rich('description',true),{name:'items',label:'Images',type:'object',list:true,fields:[text('id',true),text('alt'),rich('caption',true)],ui:{component:FixedSectionItems}}];
  if(type==='faq'||type==='steps')return [text('id',true),text('title'),rich('description',true),{name:'items',label:'Items',type:'object',list:true,fields:[text('id',true),text(type==='faq'?'question':'title'),rich(type==='faq'?'answer':'body')],ui:{component:FixedSectionItems}}];
  return [text('id', true), text('title'), type === 'rich-text' ? rich('body') : rich('description', true),
    ...(['hero', 'cta'].includes(type) ? [link] : [])];
}

export const sectionCopyTemplates: Template[] = sectionDefinitions.map(definition => ({
  name: definition.nativeName,
  ...(definition.type !== definition.nativeName ? { nameOverride: definition.type } : {}),
  label: editorLabel(definition.type),
  fields: sectionCopyFields(definition.type),
}));

export function pageCopy(): TinaField {
  return object('copy', [{ name: 'sections', label: 'Section copy', type: 'object', list: true,
    templates: sectionCopyTemplates, ui: { component: SectionCopyControls } }]);
}

export function navigationLabels(): TinaField {
  return { ...object('navigation', [text('pageId', true), text('label')], true), ui: { component: FixedEntries } };
}
