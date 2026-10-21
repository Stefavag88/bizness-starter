import {it,expect,afterEach,vi} from 'vitest';
import fs from 'node:fs';import {join,resolve} from 'node:path';import {execFileSync} from 'node:child_process';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {parseInitializeArgs,formatInitializeCommand} from '../scripts/initialize/options.mjs';
import {inspectDestination} from '../scripts/initialize/destination.mjs';
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
 expect(project).toMatchObject({name:'example-client',locale:'el',environment:'local',profile:'enquiries',legalReviewed:false,contentReviewed:false,infrastructure:{sendingEnabled:false,marketingEnabled:false,accessIssuer:'',databaseId:'00000000-0000-0000-0000-000000000000'}});
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
