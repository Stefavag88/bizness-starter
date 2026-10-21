import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {join} from 'node:path';import {readApplicationInput} from './snapshot.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=[
 ...['catalog.mjs','bundle.mjs','media.mjs','seeds/common.mjs','seeds/neutral-data.json',...['neutral','professional-services','trades','accommodation','studio'].map(id=>'seeds/'+id+'.mjs')].map(name=>'packages/presets/'+name),
 ...['abstract-landscape.png','abstract-portrait.png'].map(name=>'apps/site/public/uploads/starter-samples/'+name),
 'scripts/initialize/generate-bundle.mjs','scripts/initialize/snapshot.mjs','scripts/initialize/preset-snapshot.mjs',
];
export function snapshotPresetInputs(root){
 const hashes=new Map(inputs.map(path=>[path,hash(readApplicationInput(root,path))]));
 return {hashes,assertUnchanged(){for(const [path,expected] of hashes)if(hash(readApplicationInput(root,path))!==expected)throw Error('Preset input changed during initialization: '+path);}};
}
export function generatePresetBundle(root,options,hashes){
 // A fresh process has no cached seed JSON/modules from a prior preview or API call.
 // Both sides verify the pre-generation snapshot before any destination is claimed.
 const bytes=execFileSync(process.execPath,[join(root,'scripts/initialize/generate-bundle.mjs')],{cwd:root,input:JSON.stringify({root,options,hashes:[...hashes]}),encoding:'utf8',maxBuffer:16000000,windowsHide:true,stdio:['pipe','pipe','pipe']});
 const result=JSON.parse(bytes);return {project:result.project,files:new Map(result.files.map(([path,base64])=>[path,new Uint8Array(Buffer.from(base64,'base64'))]))};
}
