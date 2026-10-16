import type { Collection,TinaField } from 'tinacms';
import type { ProjectConfig } from '../../packages/config/project.mjs';
import { validateCurrentSave } from '../validation';
export function collection(name:string,path:string,fields:TinaField[],project:ProjectConfig,protectedRecords=false):Collection {
 return {name,label:name==='person'?'People':name[0].toUpperCase()+name.slice(1),path,format:'json',fields,ui:{allowedActions:{create:!protectedRecords,delete:!protectedRecords&&!['offering','person','article'].includes(name),createFolder:false,createNestedFolder:false},beforeSubmit:async({values,cms,form})=>validateCurrentSave(values,name,project,cms,String(form.path||form.relativePath).replaceAll('\\','/').replace(path+'/',''))}};
}
