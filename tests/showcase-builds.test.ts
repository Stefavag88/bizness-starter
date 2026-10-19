import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyShowcaseBuilds} from '../scripts/verify-showcase-builds.mjs';
import {runOwnedCommand} from '../scripts/owned-command.mjs';
function fixture(){const root=mkdtempSync(join(tmpdir(),'showcase-'));const path=join(root,'project.json');const original=Buffer.from('{"environment":"local","identity":"unchanged"}\n');writeFileSync(path,original);return {root,path,original,backupRoot:join(root,'backups')};}
function output(root:string,local:boolean,leak=false){const dist=join(root,'apps/site/dist');rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});if(local||leak){mkdirSync(join(dist,'design-system'));writeFileSync(join(dist,'design-system/index.html'),'preview');}writeFileSync(join(dist,'index.html'),'<a href="/en">Home</a>');mkdirSync(join(root,'.generated'),{recursive:true});writeFileSync(join(root,'.generated/manifest.json'),'{}');}
it('builds staging/production from separate original edits and local last, retaining exact bytes',async()=>{const f=fixture();const seen:string[]=[];await verifyShowcaseBuilds({...f,run:async(env:string)=>{seen.push(env);expect(JSON.parse(readFileSync(f.path,'utf8'))).toEqual({environment:env,identity:'unchanged'});output(f.root,false);},refresh:async()=>{seen.push('local');expect(readFileSync(f.path)).toEqual(f.original);output(f.root,true);}});expect(seen).toEqual(['staging','production','local']);expect(readFileSync(f.path)).toEqual(f.original);expect(existsSync(join(f.backupRoot,'evidence.json'))).toBe(true);});
it.each(['failure','timeout'])('restores exact original after %s and rebuilds local',async(kind)=>{const f=fixture();let refreshed=false;await expect(verifyShowcaseBuilds({...f,run:async()=>{if(kind==='timeout')await runOwnedCommand(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:150});throw Error('build failure');},refresh:async()=>{refreshed=true;output(f.root,true);}})).rejects.toThrow(kind==='timeout'?/timed out/:/build failure/);expect(refreshed).toBe(true);expect(readFileSync(f.path)).toEqual(f.original);});
it('preserves concurrent source bytes and skips regeneration on ownership conflict',async()=>{const f=fixture();let refresh=false;await expect(verifyShowcaseBuilds({...f,run:async()=>{writeFileSync(f.path,'external edit');},refresh:async()=>{refresh=true;}})).rejects.toThrow(/ownership conflict/);expect(readFileSync(f.path,'utf8')).toBe('external edit');expect(refresh).toBe(false);});
it('rejects leaked production output while restoring local',async()=>{const f=fixture();await expect(verifyShowcaseBuilds({...f,run:async()=>output(f.root,false,true),refresh:async()=>output(f.root,true)})).rejects.toThrow(/showcase output/);expect(readFileSync(f.path)).toEqual(f.original);});
it('rejects manifest or navigation leakage even without route output',async()=>{const f=fixture();await expect(verifyShowcaseBuilds({...f,run:async()=>{output(f.root,false);writeFileSync(join(f.root,'.generated/manifest.json'),'{"routes":["/design-system"]}');},refresh:async()=>output(f.root,true)})).rejects.toThrow(/manifest/);});

it('preserves a concurrent deletion and skips regeneration',async()=>{const f=fixture();let refreshed=false;await expect(verifyShowcaseBuilds({...f,run:async()=>{rmSync(f.path);},refresh:async()=>{refreshed=true;}})).rejects.toThrow(/ownership conflict/);expect(existsSync(f.path)).toBe(false);expect(refreshed).toBe(false);});
it('rejects navigation leakage without a route directory',async()=>{const f=fixture();await expect(verifyShowcaseBuilds({...f,run:async()=>{output(f.root,false);writeFileSync(join(f.root,'apps/site/dist/index.html'),'<a href="/design-system">Preview</a>');},refresh:async()=>output(f.root,true)})).rejects.toThrow(/navigation/);});
it('rejects missing final local output',async()=>{const f=fixture();await expect(verifyShowcaseBuilds({...f,run:async()=>output(f.root,false),refresh:async()=>output(f.root,false)})).rejects.toThrow(/showcase output/);expect(readFileSync(f.path)).toEqual(f.original);});
it('rejects concurrent edits during final local refresh without replacing them',async()=>{const f=fixture();await expect(verifyShowcaseBuilds({...f,run:async()=>output(f.root,false),refresh:async()=>{output(f.root,true);writeFileSync(f.path,'external final edit');}})).rejects.toThrow(/ownership conflict/);expect(readFileSync(f.path,'utf8')).toBe('external final edit');});
it.each([
 ['renamed preview controller', 'renamed.js', 'document.querySelector("#showcase-toolbar");'],
 ['dedicated layout script', 'ShowcaseLayout.astro_astro_type_script_index_0_lang.hash.js', 'export {};'],
 ['showcase stylesheet', 'renamed.css', '.showcase-toolbar{display:grid}'],
])('rejects asset-only leakage: %s',async(_name,file,source)=>{
 const f=fixture();
 await expect(verifyShowcaseBuilds({...f,run:async()=>{
  output(f.root,false);
  const assets=join(f.root,'apps/site/dist/_astro');
  mkdirSync(assets,{recursive:true});
  writeFileSync(join(assets,file),source);
 },refresh:async()=>output(f.root,true)})).rejects.toThrow(/Showcase asset leaked/);
 expect(readFileSync(f.path)).toEqual(f.original);
});
it('preserves shared themes, business assets and CMS reserved-path validation in asset inventories',async()=>{
 const f=fixture();
 await verifyShowcaseBuilds({...f,run:async()=>{
  output(f.root,false);
  const assets=join(f.root,'apps/site/dist/_astro');
  mkdirSync(assets,{recursive:true});
  writeFileSync(join(assets,'shared.css'),'html[data-theme=trades]{--color-surface:#f5f8fb}');
  writeFileSync(join(assets,'ContactForm.hash.js'),'document.querySelector("form");');
  writeFileSync(join(assets,'cms.js'),'const reserved=["/design-system","design-system"];');
  writeFileSync(join(assets,'font.woff2'),Buffer.from([0,1,2]));
 },refresh:async()=>output(f.root,true)});
 const evidence=JSON.parse(readFileSync(join(f.backupRoot,'evidence.json'),'utf8'));
 expect(evidence.inventories.map((entry:any)=>entry.environment)).toEqual(['staging','production','local']);
 expect(evidence.inventories[0].assets.map((entry:any)=>entry.path).sort()).toEqual([
  '_astro/ContactForm.hash.js','_astro/cms.js','_astro/font.woff2','_astro/shared.css',
 ]);
 expect(evidence.inventories[0].assets.every((entry:any)=>entry.bytes>0&&/^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
});

it('inventories reusable original PNGs in every environment without classifying them as dedicated preview code',async()=>{
 const f=fixture();const bytes=Buffer.from([137,80,78,71]);
 const build=(local:boolean)=>{output(f.root,local);const uploads=join(f.root,'apps/site/dist/uploads/starter-samples');mkdirSync(uploads,{recursive:true});writeFileSync(join(uploads,'original.png'),bytes);};
 await verifyShowcaseBuilds({...f,run:async()=>build(false),refresh:async()=>build(true)});
 const evidence=JSON.parse(readFileSync(join(f.backupRoot,'evidence.json'),'utf8'));
 for(const inventory of evidence.inventories){const asset=inventory.assets.find((a:any)=>a.path==='uploads/starter-samples/original.png');expect(asset).toMatchObject({bytes:4,showcase:false});expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);}
});
it('preserves independent content conflicts and skips final local regeneration after project restoration',async()=>{const f=fixture();mkdirSync(join(f.root,'content'));const source=join(f.root,'content','opaque.json');writeFileSync(source,'original');let refreshed=false;await expect(verifyShowcaseBuilds({...f,run:async()=>{output(f.root,false);writeFileSync(source,'external content');},refresh:async()=>{refreshed=true;}})).rejects.toThrow(/ownership conflict/);expect(readFileSync(source,'utf8')).toBe('external content');expect(readFileSync(f.path)).toEqual(f.original);expect(refreshed).toBe(false);});
