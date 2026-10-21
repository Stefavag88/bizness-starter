import {it,expect,afterEach} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,dirname,resolve} from 'node:path';
import {presetCatalog} from '../packages/presets/catalog.mjs';
import {createPresetBundle,projectPresetBundle} from '../packages/presets/bundle.mjs';
import {readContent} from '../packages/content/read.mjs';
const roots:string[]=[];afterEach(()=>{for(const p of roots.splice(0))rmSync(p,{recursive:true,force:true});});
it('defines five independent versioned choices',()=>expect(presetCatalog.map(p=>p.id)).toEqual(['neutral','professional-services','trades','accommodation','studio']));
it.each(['neutral','professional-services','trades','accommodation','studio'] as const)('validates %s across languages, themes and article choices',id=>{
 for(const [languages,defaultLanguage] of [[['en'],'en'],[['el'],'el'],[['en','el'],'en'],[['en','el'],'el']] as const)for(const articles of [true,false]){
 const bundle=createPresetBundle(id,{name:'example-client',languages:[...languages],defaultLanguage,theme:id==='studio'?'wellness':'trades',articles});
 const root=mkdtempSync(join(tmpdir(),'preset-'));roots.push(root);
 for(const [file,bytes] of bundle.files){const p=join(root,file);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,bytes);}
 const source=readContent(root,bundle.project);const result=projectPresetBundle(bundle,{assetRoot:resolve('.'),now:new Date('2026-10-21T00:00:00Z')});
 expect(result.contents.map(c=>c.locale)).toEqual(languages);expect(result.routes.length).toBeGreaterThan(4);
 expect(source.settings.brand.name).not.toBe('AXIA');expect(bundle.project.infrastructure.sendingEnabled).toBe(false);
 expect(bundle.project.infrastructure.adminEmails).toEqual([]);expect(bundle.project.modules.rooms).toBe(id==='accommodation');
 if(!articles)expect(result.routes.some(r=>r.kind==='article'||r.contentId==='insights')).toBe(false);
 }
});
it('rejects unsupported choices without inventing translations',()=>{
 for(const options of [{languages:['fr'],defaultLanguage:'fr'},{languages:['el'],defaultLanguage:'en'},{theme:'absent'}])expect(()=>createPresetBundle('trades',{name:'client',languages:['en'],defaultLanguage:'en',theme:'neutral',...options} as any)).toThrow();
 expect(()=>createPresetBundle('absent' as any,{name:'client',languages:['en'],defaultLanguage:'en',theme:'neutral'})).toThrow();
});
it('offers genuinely different home compositions and immutable projections',()=>{
 const compositions=new Set<string>();
 for(const id of presetCatalog.map(p=>p.id)){
 const bundle=createPresetBundle(id,{name:'client',languages:['en','el'],defaultLanguage:'en',theme:'neutral'});
 const a=projectPresetBundle(bundle,{assetRoot:resolve('.')});const home=a.contents[0].pages.find(p=>p._template==='home')!;
 compositions.add(home.sections.map(s=>s._template).join(','));home.sections[0].copy.title='Changed';
 expect(projectPresetBundle(bundle,{assetRoot:resolve('.')}).contents[0].pages[0].sections[0].copy.title).not.toBe('Changed');
 }
 expect(compositions.size).toBe(5);
});

it.each(['professional-services','trades','accommodation'] as const)('keeps %s page copy independent of studio branding',preset=>{
 const bundle=createPresetBundle(preset,{name:'client',languages:['en','el'],defaultLanguage:'en'});const about=JSON.parse(new TextDecoder().decode(bundle.files.get('content/pages/about.json')));expect(about.meta.title).not.toMatch(/studio/i);
});
