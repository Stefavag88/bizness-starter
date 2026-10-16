import {it,expect,afterEach} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createOwnedFileEdit,cleanupOwnedEdit} from '../scripts/owned-file-edit.mjs';
const dirs:string[]=[];afterEach(()=>{for(const dir of dirs.splice(0))rmSync(dir,{recursive:true,force:true});});
function setup(){const dir=mkdtempSync(join(tmpdir(),'smoke-ownership-'));dirs.push(dir);const path=join(dir,'article.json');const original=Buffer.from('original\r\n');writeFileSync(path,original);return {path,original,edit:createOwnedFileEdit(path,join(dir,'backup'))};}
it('checks ownership before the initial mutation and retains both original and unexpected bytes',()=>{
 const {path,original,edit}=setup();writeFileSync(path,'editor before mutation');
 expect(()=>edit.replace(Buffer.from('smoke'))).toThrow(/ownership/i);
 expect(readFileSync(path,'utf8')).toBe('editor before mutation');expect(readFileSync(edit.backupPath)).toEqual(original);
 expect(readFileSync(edit.conflictPath!,'utf8')).toBe('editor before mutation');
});
it('preserves intervening edits on normal restore and still stops owned processes',async()=>{
 const {path,original,edit}=setup();edit.replace(Buffer.from('smoke'));writeFileSync(path,'editor during success');
 expect(()=>edit.restore()).toThrow(/ownership/i);let stopped=false;
 await cleanupOwnedEdit(edit,async()=>{stopped=true;});
 expect(stopped).toBe(true);expect(readFileSync(path,'utf8')).toBe('editor during success');expect(readFileSync(edit.backupPath)).toEqual(original);
 expect(readFileSync(edit.conflictPath!,'utf8')).toBe('editor during success');
});
it('preserves intervening edits during failure cleanup and always stops owned processes',async()=>{
 const {path,original,edit}=setup();edit.replace(Buffer.from('smoke'));writeFileSync(path,'editor during failure');let stopped=false;
 await expect(cleanupOwnedEdit(edit,async()=>{stopped=true;})).rejects.toThrow(/ownership/i);
 expect(stopped).toBe(true);expect(readFileSync(path,'utf8')).toBe('editor during failure');expect(readFileSync(edit.backupPath)).toEqual(original);
 expect(readFileSync(edit.conflictPath!,'utf8')).toBe('editor during failure');
});
it('restores only exact owned bytes byte-for-byte',()=>{
 const {path,original,edit}=setup();edit.replace(Buffer.from('smoke\n'));expect(readFileSync(path)).toEqual(Buffer.from('smoke\n'));edit.restore();expect(readFileSync(path)).toEqual(original);
});
