import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {presetCatalog} from '../../../../packages/presets/catalog.mjs';
import type {PresetId} from '../../../../packages/presets/catalog.mjs';

import {createRenderContext} from '../lib/render-context';
export const previewThemes=['neutral','trades','accommodation','wellness'] as const;
declare const __PROJECT_ROOT__:string;
const root=typeof __PROJECT_ROOT__==='string'?__PROJECT_ROOT__:fileURLToPath(new URL('../../../../',import.meta.url));
// Native server import preserves filesystem-relative seed/theme/media ownership in prerender builds.
const bundleUrl=pathToFileURL(join(root,'packages/presets/bundle.mjs')).href;
const {createPresetBundle,projectPresetBundle}:typeof import('../../../../packages/presets/bundle.mjs')=await import(/* @vite-ignore */ bundleUrl);
const cache=new Map<string,ReturnType<typeof projectPresetBundle>&{project:ReturnType<typeof createPresetBundle>['project']}>();
export function preparePresetPreview(preset:string,theme:string,locale:string){
 if(!presetCatalog.some(p=>p.id===preset)||!previewThemes.includes(theme as never)||!['en','el'].includes(locale))throw Error('Unknown preset preview');
 const key=preset+'/'+theme;let projection=cache.get(key);
 if(!projection){const bundle=createPresetBundle(preset as PresetId,{name:'example-'+preset,languages:['en','el'],defaultLanguage:'en',theme});projection={...projectPresetBundle(bundle,{assetRoot:root}),project:bundle.project};cache.set(key,projection);}
 const {project,routes,contents}=projection;
 return {project,routes,content:contents.find(c=>c.locale===locale)!,context:createRenderContext(project,routes,{previewBase:'/templates/'+key})};
}
export function presetPaths(){return presetCatalog.flatMap(preset=>previewThemes.flatMap(theme=>['en','el'].flatMap(locale=>preparePresetPreview(preset.id,theme,locale).routes.filter(r=>r.locale===locale).map(route=>({params:{preset:preset.id,theme,locale,path:route.path.split('/').slice(2).join('/')||undefined},props:{route}})))));}
