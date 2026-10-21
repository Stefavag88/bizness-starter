import {it,expect} from 'vitest';
import {initializationCases} from '../scripts/verify-initialization.mjs';
import {presetAssetInventory,assertPresetArtifacts} from '../scripts/verify-presets.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
it('covers all independent presets, Greek-only and articles-disabled clients',()=>{
 expect(initializationCases.map(c=>c.preset)).toEqual(['neutral','professional-services','trades','accommodation','studio']);
 expect(initializationCases.some(c=>c.languages.join(',')==='el'&&c.defaultLanguage==='el')).toBe(true);
 expect(initializationCases.some(c=>c.articles===false)).toBe(true);
});
it('rejects dedicated preset assets even when a gallery route is absent',()=>{
 const dist=mkdtempSync(join(tmpdir(),'preset-assets-'));try{
 mkdirSync(join(dist,'_astro'));writeFileSync(join(dist,'_astro','leak.css'),'.preset-gallery{display:grid}');
 const assets=presetAssetInventory(dist);expect(assets[0].preset).toBe(true);expect(assets[0].sha256).toMatch(/^[a-f0-9]{64}$/);
 expect(()=>assertPresetArtifacts(dist,false)).toThrow(/asset/i);
 }finally{rmSync(dist,{recursive:true,force:true});}
});
