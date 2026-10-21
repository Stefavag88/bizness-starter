import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {presetToolsEnabled} from '../scripts/preset-tools.mjs';
import {preparePresetPreview,presetPaths} from '../apps/site/src/presets/presenter';
it('registers only local source tools with a valid marker and entries',()=>{
 const root=mkdtempSync(join(tmpdir(),'preset-routes-'));try{
 expect(presetToolsEnabled(root,'local')).toBe(false);mkdirSync(join(root,'apps/site/src/presets'),{recursive:true});for(const file of ['Gallery.astro','Preview.astro'])writeFileSync(join(root,'apps/site/src/presets',file),'');
 writeFileSync(join(root,'.starter-tools.json'),JSON.stringify({kind:'starter-source',version:1}));expect(presetToolsEnabled(root,'local')).toBe(true);
 for(const env of ['staging','production'])expect(presetToolsEnabled(root,env)).toBe(false);
 writeFileSync(join(root,'.starter-tools.json'),'bad');expect(presetToolsEnabled(root,'local')).toBe(false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
it('enumerates only real public preset/theme/locale paths with scoped links',()=>{
 const paths=presetPaths();expect(paths.length).toBeGreaterThan(300);
 expect(paths.some(p=>p.params.preset==='accommodation'&&p.params.path?.startsWith('rooms/'))).toBe(true);
 expect(paths.some(p=>String(p.params.theme)==='invalid'||p.params.locale==='fr'||p.params.path==='cms')).toBe(false);
 const model=preparePresetPreview('studio','trades','el');expect(model.project.design.theme).toBe('trades');expect(model.content.locale).toBe('el');expect(model.context.link('/contact','el')).toBe('/templates/studio/trades/el/contact');
 expect(()=>preparePresetPreview('nope','trades','en')).toThrow();expect(()=>preparePresetPreview('trades','nope','en')).toThrow();expect(()=>preparePresetPreview('trades','trades','fr')).toThrow();
});
