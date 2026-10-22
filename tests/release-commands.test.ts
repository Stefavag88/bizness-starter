import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import inventory from '../scripts/initialize/export-manifest.json';
import releaseInventory from '../scripts/deployment/release-files.json';
import {createClientPackage} from '../scripts/initialize/snapshot.mjs';
it('requires explicit production/config arguments and rejects overrides before creating a build',async()=>{
 const {parseReleaseBuildArgs}=await import('../scripts/deployment/release-build.mjs');
 expect(parseReleaseBuildArgs(['--target','production','--config','target.json'])).toEqual({target:'production',config:'target.json'});
 for(const args of [[],['--target','local','--config','t'],['--target','production'],['--target','production','--config','t','--force','yes'],['--target','production','--config','t','--config','x']])expect(()=>parseReleaseBuildArgs(args)).toThrow();
});
it('rejects implicit accounts/databases and execution without any runner or cloud action',async()=>{
 const {parseReleaseCommandArgs,planReleaseCommand}=await import('../scripts/deployment/release-command.mjs');
 const args=['--target','production','--artifact','a','--account','a'.repeat(32),'--database','00000000-0000-0000-0000-000000000000'];
 expect(parseReleaseCommandArgs(args).target).toBe('production');
 for(const broken of [[],args.slice(0,6),[...args,'--force','yes'],[...args,'--execute']])expect(()=>parseReleaseCommandArgs(broken)).toThrow();
 expect(()=>planReleaseCommand('deploy',{execute:true} as any)).toThrow(/blocked|execution/i);
 expect(()=>planReleaseCommand('delete',{} as any)).toThrow(/operation/i);
});
it('exports the release runtime and scripts independently of initializer/preset tooling',()=>{
 const source=JSON.parse(readFileSync('package.json','utf8')),client=createClientPackage('client',source);
 expect(releaseInventory).toEqual(inventory);
 for(const name of ['inputs','artifact','build','command'])for(const ext of ['mjs','d.mts'])expect(inventory).toContain('scripts/deployment/release-'+name+'.'+ext);
 for(const name of ['build','verify','deploy','migrate'])expect(client.scripts['release:'+name]).toBe(source.scripts['release:'+name]);
 expect(releaseInventory.some(p=>p.startsWith('scripts/initialize/'))).toBe(false);
});

it('pins local migration rehearsal to an explicitly owned short state directory',async()=>{
 const {localMigrationArgs}=await import('../scripts/deployment/release-build.mjs');
 const args=localMigrationArgs('wrangler.js','workspace','short-state');
 expect(args).toEqual(['wrangler.js','d1','migrations','apply','DB','--local','--config',(await import('node:path')).join('workspace','wrangler.generated.json'),'--persist-to','short-state']);
 expect(args).not.toContain('--remote');
});
