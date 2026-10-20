import type {ProjectConfig} from '../../../../packages/config/project.mjs';
import type {Route} from '../../../../packages/content/types';
import {renderRichText,renderInlineRichText} from '../../../../packages/content/rich-text.mjs';
import {resolveContentLink} from './links';
export interface RenderContext {project:ProjectConfig;routes:Route[];previewBase?:string;link(href:string,locale:string):string;rich(value:string,locale:string,inline?:boolean,links?:boolean):string}
export function createRenderContext(project:ProjectConfig,routes:Route[],options:{previewBase?:string}={}):RenderContext {
 const {previewBase}=options;
 if(previewBase&&!/^\/templates\/(neutral|professional-services|trades|accommodation|studio)\/(neutral|trades|accommodation|wellness)$/.test(previewBase))throw Error('Invalid preset preview prefix');
 const link=(href:string,locale:string)=>{
  const target=resolveContentLink(href,locale,routes,project.siteUrl);
  return previewBase&&target.startsWith('/')&&!target.startsWith('//')?previewBase+target:target;
 };
 return {project,routes,previewBase,link,rich(value,locale,inline=false,links=true){const options={links,resolveHref:(href:string)=>link(href,locale)};return inline?renderInlineRichText(value,options):renderRichText(value,options);}};
}
