import {assertDomainRendererCoverage} from '../templates/domains';
import {resolveContentLink} from './links';
import {readFileSync} from 'node:fs';
import {parseProject} from '../../../../packages/config/project.mjs';
import {readContent} from '../../../../packages/content/read.mjs';
import {localizeContent} from '../../../../packages/content/localize.mjs';
import {publicRoutes} from '../../../../packages/content/routes.mjs';
import {plainText,renderRichText,renderInlineRichText} from '../../../../packages/content/rich-text.mjs';
declare const __PROJECT_ROOT__:string;
export const project=parseProject(JSON.parse(readFileSync(__PROJECT_ROOT__+'/project.json','utf8')));
assertDomainRendererCoverage(project);
export const snapshot=readContent(__PROJECT_ROOT__,project);
export const contents=project.languages.map(l=>localizeContent(snapshot,l.code,project));
export const routes=contents.flatMap(publicRoutes);
export const description=(record:{seoDescription?:string;description?:string;sections?:{copy:object}[]})=>record.seoDescription||plainText(record.description||record.sections?.map(s=>'description' in s.copy?s.copy.description:'body' in s.copy?s.copy.body:'').join(' ')||'',300);
export const localizedLink=(href:string,locale:string)=>resolveContentLink(href,locale,routes,project.siteUrl);
export function rich(value:string,locale:string,inline=false,links=true){
 const html=inline?renderInlineRichText(value,{links}):renderRichText(value);
 return html.replace(/href="([^"&]*)([^" ]*)"/g,(_match,start,end)=>'href="'+localizedLink(start+end,locale)+'"');
}
