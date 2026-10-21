import importFs from 'node:fs';
import {it,expect} from 'vitest';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {snapshotApplication,createClientPackage,readApplicationInput} from '../scripts/initialize/snapshot.mjs';
import inventory from '../scripts/initialize/export-manifest.json';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {afterEach} from 'vitest';
const roots=ownedTempRoots('initializer-export-');afterEach(()=>roots.cleanup());
it('exports only reviewed application files and preserves the dependency lock contract',()=>{
 expect(new Set(inventory).size).toBe(inventory.length);
 for(const path of inventory){expect(path.startsWith('content/')).toBe(false);expect(path).not.toMatch(/(^|\/)(node_modules|presets|\.git|\.generated|\.wrangler|test-results|reviews)(\/|$)|\.env|\.dev.vars/);}
 const source=JSON.parse(readFileSync('package.json','utf8'));const client=createClientPackage('my-client',source);
 expect(client.name).toBe('my-client');expect(client.dependencies).toEqual(source.dependencies);expect(client.devDependencies).toEqual(source.devDependencies);
 expect(client.scripts.test).toBe('pnpm configure && vitest run');expect(client.scripts['test:profiles']).toBeUndefined();
});
it('captures exact files and detects source changes without reading unselected secrets',()=>{
 const root=roots.create();
 for(const path of inventory){const target=join(root,path);mkdirSync(dirname(target),{recursive:true});copyFileSync(path,target);}
 mkdirSync(join(root,'scripts/initialize'),{recursive:true});copyFileSync('scripts/initialize/export-manifest.json',join(root,'scripts/initialize/export-manifest.json'));
 execFileSync('git',['init',root],{stdio:'ignore'});execFileSync('git',['-C',root,'-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','--allow-empty','-m','fixture'],{stdio:'ignore'});
 writeFileSync(join(root,'.env'),'SECRET_SENTINEL');
 const snapshot=snapshotApplication(root);expect(snapshot.files.size).toBe(inventory.length);expect([...snapshot.files.keys()]).not.toContain('.env');snapshot.assertUnchanged();
 const manifestPath=join(root,'scripts/initialize/export-manifest.json');const originalInventory=readFileSync(manifestPath);writeFileSync(manifestPath,'[]');expect(()=>snapshot.assertUnchanged()).toThrow(/inventory|changed/i);writeFileSync(manifestPath,originalInventory);
 const target=join(root,inventory[0]);writeFileSync(target,'concurrent edit');expect(()=>snapshot.assertUnchanged()).toThrow(/changed/i);
});
it('refuses paths escaping the source inventory',()=>expect(inventory.every(p=>!p.split('/').includes('..')&&!p.startsWith('/')&&!p.includes('\\'))).toBe(true));

it('rejects source links before reading their contents',()=>{const root=roots.create();writeFileSync(join(root,'secret'),'private');const link=join(root,'allowed.txt');importFs.symlinkSync(join(root,'secret'),link);try{expect(()=>readApplicationInput(root,'allowed.txt')).toThrow(/link/i);}finally{importFs.unlinkSync(link);}});

it('exports every runtime budget dependency and capacity CLI to independent clients',()=>{
 for(const path of ['packages/config/runtime-budgets.mjs','packages/config/runtime-budgets.d.mts','packages/runtime-capacity/model.mjs','packages/runtime-capacity/model.d.mts','worker/budget.ts','worker/admissions.ts','worker/scheduler.ts','worker/usage.ts','worker/usage-contracts.ts','worker/usage-page.ts','worker/campaign-estimates.ts','migrations/0003_runtime_budgets.sql','migrations/0004_runtime_selection_indexes.sql','scripts/report-capacity.mjs','docs/RUNTIME_BUDGETS.md','docs/USAGE_CAPACITY.md'])expect(inventory).toContain(path);
 const source=JSON.parse(readFileSync('package.json','utf8'));expect(createClientPackage('client',source).scripts['report:capacity']).toBe('node scripts/report-capacity.mjs');
});
