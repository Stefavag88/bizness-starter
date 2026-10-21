import {it,expect} from 'vitest';import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {readPresetMedia} from '../packages/presets/media.mjs';
it('reads only reviewed originals and rejects linked media ancestors',()=>{
 const root=mkdtempSync(join(tmpdir(),'preset-media-')),outside=mkdtempSync(join(tmpdir(),'preset-other-'));try{
 mkdirSync(join(root,'apps/site/public'),{recursive:true});mkdirSync(join(outside,'starter-samples'));writeFileSync(join(outside,'starter-samples/abstract-landscape.png'),'not a photo');symlinkSync(outside,join(root,'apps/site/public/uploads'),process.platform==='win32'?'junction':'dir');
 expect(()=>readPresetMedia(root,'abstract-landscape.png')).toThrow(/link/i);expect(()=>readPresetMedia(root,'../secret')).toThrow(/reviewed/i);
 }finally{rmSync(root,{recursive:true,force:true});rmSync(outside,{recursive:true,force:true});}
});
