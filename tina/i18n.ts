import type { TinaField } from 'tinacms';
import type { ProjectConfig } from '../packages/config/project.mjs';
export function withTranslations(fields:TinaField[],project:ProjectConfig,localizedNames:string[]):TinaField[] {
 return [...fields,{name:'translations',label:'Translations',type:'object',fields:project.languages.filter(l=>l.code!==project.locale).map(l=>({name:l.code.replaceAll('-','_'),label:l.label,type:'object',fields:fields.filter(f=>localizedNames.includes(f.name))}))}];
}
