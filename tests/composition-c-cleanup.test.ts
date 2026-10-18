import {execFileSync} from 'node:child_process';
import {afterEach,expect,it,vi} from 'vitest';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCmsSources} from '../e2e/helpers/cms-source-ownership';
import {createOwnedMedia} from '../e2e/helpers/owned-media';
import {cleanupCompositionPublic} from '../e2e/helpers/composition-b-cleanup';
import {cleanupCompositionCNative,type CompositionCNativeCleanupState} from '../e2e/helpers/composition-c-fixture';
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'composition-c-cleanup-'));roots.push(root);const uploads=join(root,'uploads');mkdirSync(uploads);
 const record=join(root,'room.json'),sources=createCmsSources([record],join(root,'record-backup'),{allowCreate:true});sources.createAbsent(record,{contentId:'proof'},()=>true);
 const paths=['a.png','b.png'].map(name=>join(uploads,name));const media=paths.map(path=>createOwnedMedia(path,join(root,'media-backup'),{uploadsRoot:uploads}));media.forEach((owner,i)=>owner.create(Buffer.from([137,80,78,71,i])));
 const ledger=join(root,'restoration.json');const actions=media.map(owner=>vi.fn(()=>{expect(existsSync(record)).toBe(false);owner.restore();}));const options={restoreRecords:vi.fn(()=>sources.restore()),restoreMedia:actions,record:vi.fn((state:CompositionCNativeCleanupState)=>writeFileSync(ledger,JSON.stringify(state)))};
 return {root,record,sources,paths,media,ledger,actions,options};
}
it('preserves first upload conflict, restores the independent second upload, and writes the ledger before aggregate failure',async()=>{
 const f=fixture(),unknown=Buffer.from('External first image');writeFileSync(f.paths[0],unknown);
 const failure=await cleanupCompositionCNative(f.options).catch(error=>error);
 expect(failure).toBeInstanceOf(AggregateError);expect(failure.errors).toHaveLength(1);expect(String(failure.errors[0])).toMatch(/Media ownership conflict/);
 expect(existsSync(f.record)).toBe(false);expect(readFileSync(f.paths[0])).toEqual(unknown);expect(existsSync(f.paths[1])).toBe(false);expect(f.actions.every(action=>action.mock.calls.length===1)).toBe(true);
 expect(JSON.parse(readFileSync(f.ledger,'utf8'))).toEqual({recordsRestored:true,mediaRestored:[false,true]});expect(existsSync(join(f.media[0].backup,'conflict-observed.bin'))).toBe(true);
});
it('retains both dependent uploads after record conflict, still writes the ledger and attempts independent cleanup',async()=>{
 const f=fixture(),unknown='{"external":"Room"}\r\n';writeFileSync(f.record,unknown);const independent=vi.fn();
 const failure=await cleanupCompositionPublic([()=>cleanupCompositionCNative(f.options),independent]).catch(error=>error);
 expect(failure).toBeInstanceOf(AggregateError);expect(failure.errors[0]).toBeInstanceOf(AggregateError);expect(readFileSync(f.record,'utf8')).toBe(unknown);expect(f.paths.every(path=>existsSync(path))).toBe(true);expect(f.actions.every(action=>action.mock.calls.length===0)).toBe(true);expect(independent).toHaveBeenCalledOnce();
 expect(JSON.parse(readFileSync(f.ledger,'utf8'))).toEqual({recordsRestored:false,mediaRestored:[false,false]});expect(existsSync(f.sources.backupFor(f.record))).toBe(false);expect(existsSync(join(f.sources.backup,'manifest.json'))).toBe(true);
});
it('attempts all eligible image restores and ledger, aggregates ledger failure, and continues independent cleanup',async()=>{
 const f=fixture();writeFileSync(f.paths[0],'Unknown upload');const ledgerError=Error('ledger write failed');f.options.record.mockImplementation(()=>{throw ledgerError;});const independent=vi.fn();
 const failure=await cleanupCompositionPublic([()=>cleanupCompositionCNative(f.options),independent]).catch(error=>error);
 expect(failure).toBeInstanceOf(AggregateError);const cleanupFailure=failure.errors[0];expect(cleanupFailure).toBeInstanceOf(AggregateError);expect(cleanupFailure.errors).toHaveLength(2);expect(cleanupFailure.errors[1]).toBe(ledgerError);expect(f.options.record).toHaveBeenCalledOnce();expect(independent).toHaveBeenCalledOnce();expect(readFileSync(f.paths[0],'utf8')).toBe('Unknown upload');expect(existsSync(f.paths[1])).toBe(false);
});

it('loads the native fixture through the direct Node TypeScript launcher boundary',()=>{
 expect(()=>execFileSync(process.execPath,['--input-type=module','-e',"await import('./e2e/helpers/composition-c-fixture.ts')"],{cwd:process.cwd(),stdio:'pipe'})).not.toThrow();
});
