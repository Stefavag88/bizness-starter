import {watch} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// Inputs only. Generated output and native CMS output are deliberately excluded.
const inputs=['content','packages/design-system/themes','project.json'];
let timer,running=false,again=false;
function configure(){
 if(running){again=true;return;}running=true;
 const child=spawn(process.execPath,[resolve('scripts/configure.mjs')],{stdio:'inherit',windowsHide:true});
 child.on('exit',code=>{running=false;if(code)console.error('Content generation failed; fix the authoring error and save again.');if(again){again=false;configure();}});
 child.on('error',error=>{running=false;console.error(error.message);});
}
for(const input of inputs)watch(input,{recursive:input!=='project.json'},(_event,file)=>{if(file&&!String(file).endsWith('.json'))return;clearTimeout(timer);timer=setTimeout(configure,200);});
console.log('Watching canonical content, project.json and theme JSON inputs.');
