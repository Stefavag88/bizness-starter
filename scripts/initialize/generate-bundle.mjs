import {readFileSync,realpathSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {readApplicationInput} from './snapshot.mjs';
const request=JSON.parse(readFileSync(0,'utf8'));const root=realpathSync(fileURLToPath(new URL('../../',import.meta.url)));
if(realpathSync(request.root)!==root)throw Error('Preset generation root mismatch');
const verify=()=>{for(const [path,expected] of request.hashes){const actual=createHash('sha256').update(readApplicationInput(root,path)).digest('hex');if(actual!==expected)throw Error('Preset input snapshot changed: '+path);}};
verify();
const {createPresetBundle,projectPresetBundle}=await import('../../packages/presets/bundle.mjs');
const bundle=createPresetBundle(request.options.preset,request.options);projectPresetBundle(bundle,{assetRoot:root});
verify();
process.stdout.write(JSON.stringify({project:bundle.project,files:[...bundle.files].map(([path,bytes])=>[path,Buffer.from(bytes).toString('base64')])}));
