import {it,expect,afterEach,vi} from 'vitest';
// These are real filesystem/Git/child-process integration cases. Under the
// full parallel suite one takes ~6s; keep the budget local to this file.
vi.setConfig({testTimeout:20000});
import fs from 'node:fs';import {join,resolve} from 'node:path';import {execFileSync} from 'node:child_process';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {parseInitializeArgs,formatInitializeCommand} from '../scripts/initialize/options.mjs';
import {inspectDestination} from '../scripts/initialize/destination.mjs';
import {presetCatalog} from '../packages/presets/catalog.mjs';
import {createPresetBundle} from '../packages/presets/bundle.mjs';
import {initializeProject} from '../scripts/initialize/initialize.mjs';
const roots=ownedTempRoots('initializer-target-');afterEach(()=>{vi.restoreAllMocks();roots.cleanup();});
const options=(destination:string)=>({help:false,dryRun:false,preset:'trades' as const,name:'example-client',destination,languages:['en','el'] as ('en'|'el')[],defaultLanguage:'el' as const,theme:'trades'});
it('parses strict options and quotes displayed commands without shell execution',()=>{
 const parsed=parseInitializeArgs(['--preset','trades','--name','client','--destination','C:/Projects/A b','--languages','el,en','--default-language','el','--dry-run']);
 expect(parsed).toMatchObject({dryRun:true,languages:['el','en'],defaultLanguage:'el'});
 expect(formatInitializeCommand({...parsed,destination:"C:/Projects/A '$() b"})).toContain("'C:/Projects/A ''$() b'");
 for(const args of [['--unknown'],['--preset','trades','--preset','studio'],['--name'],['--destination','../unsafe']])expect(()=>parseInitializeArgs(args)).toThrow();
 expect(parseInitializeArgs(['--help']).help).toBe(true);
});
it('dry-runs with no destination files',async()=>{
 const parent=roots.create(),destination=join(parent,'dry');const result=await initializeProject({source:resolve('.'),options:options(destination),dryRun:true});
 expect(result.createdFiles).toEqual([]);expect(fs.existsSync(destination)).toBe(false);
});
it('creates an independent safely reset application without source tooling or history',async()=>{
 const destination=join(roots.create(),'client');const result=await initializeProject({source:resolve('.'),options:options(destination),dryRun:false});
 expect(result.createdFiles.length).toBeGreaterThan(60);
 const project=JSON.parse(fs.readFileSync(join(destination,'project.json'),'utf8'));
 expect(project).toMatchObject({name:'example-client',locale:'el',environment:'local',profile:'enquiries',legalReviewed:false,contentReviewed:false,infrastructure:{turnstileSiteKey:'',sendingEnabled:false,marketingEnabled:false,accessIssuer:'',databaseId:'00000000-0000-0000-0000-000000000000'}});
 expect(fs.existsSync(join(destination,'.starter-tools.json'))).toBe(false);expect(fs.existsSync(join(destination,'packages/presets'))).toBe(false);
 expect(fs.existsSync(join(destination,'migrations/0002_workflow_cursor.sql'))).toBe(true);
 expect(execFileSync('git',['-C',destination,'remote'],{encoding:'utf8'}).trim()).toBe('');
 expect(()=>execFileSync('git',['-C',destination,'rev-parse','HEAD'],{stdio:'ignore'})).toThrow();
 expect(fs.existsSync(join(destination,'tests/project.test.ts'))).toBe(true);
});
it('refuses occupied targets, source ancestry and destination links',async()=>{
 const parent=roots.create(),occupied=join(parent,'occupied');fs.mkdirSync(occupied);fs.writeFileSync(join(occupied,'keep'),'mine');
 expect(()=>inspectDestination(resolve('.'),occupied)).toThrow();expect(()=>inspectDestination(resolve('.'),resolve('.'))).toThrow();expect(()=>inspectDestination(resolve('.'),resolve('../'))).toThrow();expect(()=>inspectDestination(resolve('.'),resolve('nested'))).toThrow();
 const linked=join(parent,'linked');fs.symlinkSync(occupied,linked,'junction');try{expect(()=>inspectDestination(resolve('.'),linked)).toThrow();}finally{fs.unlinkSync(linked);}
 expect(fs.readFileSync(join(occupied,'keep'),'utf8')).toBe('mine');
});
it('preserves a competing file and partial output on mid-copy collision',async()=>{
 const destination=join(roots.create(),'collision');const open=fs.openSync;
 vi.spyOn(fs,'openSync').mockImplementation(((path:any,flags:any,...args:any[])=>{
 if(String(path)===join(destination,'package.json')&&flags==='wx')fs.writeFileSync(String(path),'external editor');
 return (open as any)(path,flags,...args);
 }) as any);
 const failure=await initializeProject({source:resolve('.'),options:options(destination),dryRun:false}).catch(error=>error);
 expect(failure.message).toMatch(/preserv|creat|exist/i);expect(failure.createdFiles).toContain('.gitignore');expect(failure.destination).toBe(destination);
 expect(fs.readFileSync(join(destination,'package.json'),'utf8')).toBe('external editor');
});

it('rejects dot-prefixed descendants before any destination creation',()=>{
 const destination=resolve('..client');expect(()=>inspectDestination(resolve('.'),destination)).toThrow(/overlap/i);expect(fs.existsSync(destination)).toBe(false);
});
it('rejects a replaced intermediate ancestor before writing additional files through it',async()=>{
 const parent=roots.create(),destination=join(parent,'client'),external=join(parent,'external');fs.mkdirSync(external);
 const open=fs.openSync,close=fs.closeSync;let tracked:number|undefined,swapped=false;
 vi.spyOn(fs,'openSync').mockImplementation(((path:any,flags:any,...args:any[])=>{const fd=(open as any)(path,flags,...args);if(String(path)===join(destination,'apps/site/astro.config.mjs')&&flags==='wx')tracked=fd;return fd;}) as any);
 vi.spyOn(fs,'closeSync').mockImplementation((fd:number)=>{close(fd);if(fd===tracked&&!swapped){swapped=true;const owned=join(destination,'apps'),moved=join(external,'apps');expect(owned.startsWith(parent)).toBe(true);expect(moved.startsWith(parent)).toBe(true);fs.renameSync(owned,moved);fs.symlinkSync(moved,owned,process.platform==='win32'?'junction':'dir');}});
 try{await expect(initializeProject({source:resolve('.'),options:options(destination)})).rejects.toThrow(/directory|link|changed/i);expect(swapped).toBe(true);expect(fs.existsSync(join(external,'apps/site/package.json'))).toBe(false);}
 finally{vi.restoreAllMocks();if(swapped)fs.unlinkSync(join(destination,'apps'));}
});
it('reports a created file even when its write fails halfway',async()=>{
 const destination=join(roots.create(),'write-failure'),open=fs.openSync,write=fs.writeFileSync;let tracked:number|undefined;
 vi.spyOn(fs,'openSync').mockImplementation(((path:any,flags:any,...args:any[])=>{const fd=(open as any)(path,flags,...args);if(String(path)===join(destination,'package.json')&&flags==='wx')tracked=fd;return fd;}) as any);
 vi.spyOn(fs,'writeFileSync').mockImplementation(((path:any,...args:any[])=>{if(path===tracked)throw Object.assign(Error('fixture disk full'),{code:'ENOSPC'});return (write as any)(path,...args);}) as any);
 const failure=await initializeProject({source:resolve('.'),options:options(destination)}).catch(error=>error);expect(failure.createdFiles).toContain('package.json');expect(fs.existsSync(join(destination,'package.json'))).toBe(true);
});

it.each(presetCatalog)('preserves validated $id bundle bytes through isolated generation',async metadata=>{
 const destination=join(roots.create(),'client');const settings={...options(destination),preset:metadata.id,theme:metadata.suggestedTheme};
 const expected=createPresetBundle(metadata.id,settings);await initializeProject({source:resolve('.'),options:settings});
 expect(JSON.parse(fs.readFileSync(join(destination,'project.json'),'utf8'))).toEqual(expected.project);
 for(const [path,bytes] of expected.files)expect(fs.readFileSync(join(destination,path))).toEqual(Buffer.from(bytes));
});
