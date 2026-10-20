import {afterEach,it,expect} from 'vitest';
import {mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,symlinkSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {syncMigrations,withConfigureLock} from '../scripts/configure-safety.mjs';
const roots=ownedTempRoots('configure-safety-');
afterEach(()=>roots.cleanup());
function fixture(){const root=roots.create();mkdirSync(join(root,'migrations'));mkdirSync(join(root,'.generated/migrations'),{recursive:true});return root;}
it('copies every ordered migration and removes stale generated SQL only',()=>{
 const root=fixture();const source=join(root,'migrations');const target=join(root,'.generated/migrations');
 writeFileSync(join(source,'0010_later.sql'),'SELECT 10;');writeFileSync(join(source,'0001_initial.sql'),'SELECT 1;');writeFileSync(join(source,'0002_next.sql'),'SELECT 2;');
 writeFileSync(join(target,'0003_stale.sql'),'stale');writeFileSync(join(target,'notes.txt'),'keep');writeFileSync(join(root,'.generated/elsewhere.sql'),'keep outside');
 expect(syncMigrations(root)).toEqual(['0001_initial.sql','0002_next.sql','0010_later.sql']);
 expect(readdirSync(target).sort()).toEqual(['0001_initial.sql','0002_next.sql','0010_later.sql','notes.txt']);
 expect(readFileSync(join(target,'0010_later.sql'),'utf8')).toBe('SELECT 10;');
 expect(readFileSync(join(source,'0001_initial.sql'),'utf8')).toBe('SELECT 1;');expect(readFileSync(join(root,'.generated/elsewhere.sql'),'utf8')).toBe('keep outside');
});
it.each(['0002_bad-name.sql','bad.sql','0001_duplicate.sql','00002_ambiguous_width.sql'])('rejects invalid migration set %s before changing generated files',name=>{
 const root=fixture();writeFileSync(join(root,'migrations/0001_initial.sql'),'SELECT 1;');writeFileSync(join(root,'migrations',name),'SELECT 2;');writeFileSync(join(root,'.generated/migrations/0001_initial.sql'),'original');
 expect(()=>syncMigrations(root)).toThrow(/migration/i);expect(readFileSync(join(root,'.generated/migrations/0001_initial.sql'),'utf8')).toBe('original');
});
it('refuses migration directory replacements rather than deleting another directory',()=>{
 const root=fixture();mkdirSync(join(root,'external'));writeFileSync(join(root,'external/0002_stale.sql'),'preserve');
 writeFileSync(join(root,'migrations/0001_initial.sql'),'SELECT 1;');
 const link=join(root,'.generated/migrations/0002_stale.sql');symlinkSync(join(root,'external'),link,'junction');
 try{expect(()=>syncMigrations(root)).toThrow(/migration/i);expect(readFileSync(join(root,'external/0002_stale.sql'),'utf8')).toBe('preserve');}finally{unlinkSync(link);}
});
it('allows one configure owner across processes and releases after failure',async()=>{
 const root=fixture();const moduleUrl=pathToFileURL(join(process.cwd(),'scripts/configure-safety.mjs')).href;
 await expect(withConfigureLock(root,async()=>{
  const child=spawnSync(process.execPath,['--input-type=module','-e',`import {withConfigureLock} from ${JSON.stringify(moduleUrl)};await withConfigureLock(${JSON.stringify(root)},()=>{});`],{encoding:'utf8'});
  expect(child.status).not.toBe(0);expect(child.stderr).toMatch(/configure.*lock|already.*configur/i);throw Error('owned failure');
 })).rejects.toThrow('owned failure');
 await withConfigureLock(root,()=>{});expect(existsSync(join(root,'.generated/configure.lock'))).toBe(false);
});
it('never takes over or removes an existing abandoned lock',async()=>{
 const root=fixture();const path=join(root,'.generated/configure.lock');writeFileSync(path,'old owner');
 await expect(withConfigureLock(root,()=>{throw Error('must not run');})).rejects.toThrow(/lock|configur/i);
 expect(readFileSync(path,'utf8')).toBe('old owner');
});
