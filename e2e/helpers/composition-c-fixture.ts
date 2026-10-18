import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
/** Project configuration is independently owned; document ownership is request-derived. */
export function enableCompositionC(){
 mkdirSync('.generated/composition-c-cms',{recursive:true});
 const directory=mkdtempSync('.generated/composition-c-cms/config-');
 const original=readFileSync('project.json');
 const project=JSON.parse(original.toString());project.modules={...project.modules,rooms:true};
 const expected=Buffer.from(JSON.stringify(project,null,2)+'\n');
 writeFileSync(join(directory,'project.original.json'),original);
 if(!readFileSync('project.json').equals(original))throw Error('Project changed before enablement');
 writeFileSync('project.json',expected);
 return {directory,restore(){if(!readFileSync('project.json').equals(expected)){writeFileSync(join(directory,'project.conflict.json'),readFileSync('project.json'));throw Error('Project conflict preserved: '+directory);}writeFileSync('project.json',original);}};
}
