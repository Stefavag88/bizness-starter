import {it,expect,afterEach} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {createCmsSources} from '../e2e/helpers/cms-source-ownership';
import {createCmsEvidence} from '../e2e/helpers/cms-evidence';
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0)){if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('cms-evidence-'))throw Error('Unsafe fixture cleanup');rmSync(root,{recursive:true,force:true});}});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'cms-evidence-'));roots.push(root);const path=join(root,'record.json');const original='{ "body": "Original" }\r\n';writeFileSync(path,original);
 const sources=createCmsSources([path],join(root,'backups'));const directory=join(root,'fresh','evidence');
 const schema={collections:[{name:'offering',path:root,fields:[{name:'body',type:'string'}]}]};
 const mutation={collection:'offering',relativePath:'record.json',params:{offering:{body:'Native proof'}}};
 return {path,original,sources,directory,schema,mutation};
}
it('prepares initially absent evidence storage before a native save and restores exact owned bytes',async()=>{
 const f=fixture();expect(existsSync(f.directory)).toBe(false);const evidence=createCmsEvidence(f.directory);expect(existsSync(f.directory)).toBe(true);
 try{f.sources.assertUnchanged();writeFileSync(f.path,JSON.stringify({body:'Native proof'}));await evidence.captureNative(f.sources,f.path,f.mutation,f.schema,d=>d.body==='Native proof');expect(f.sources.owns(f.path)).toBe(true);expect(JSON.parse(readFileSync(join(f.directory,'last-native-mutation.json'),'utf8')).saved.body).toBe('Native proof');}finally{await f.sources.restore();}
 expect(readFileSync(f.path,'utf8')).toBe(f.original);
});
it('claims a valid save before diagnostic failure so finally can restore exact original bytes',async()=>{
 const f=fixture();mkdirSync(f.directory,{recursive:true});mkdirSync(join(f.directory,'last-native-mutation.json'));const evidence=createCmsEvidence(f.directory);
 writeFileSync(f.path,JSON.stringify({body:'Native proof'}));
 try{await expect(evidence.captureNative(f.sources,f.path,f.mutation,f.schema,d=>d.body==='Native proof')).rejects.toThrow();expect(f.sources.owns(f.path)).toBe(true);}finally{await f.sources.restore();}
 expect(readFileSync(f.path,'utf8')).toBe(f.original);
});
it('removes an owned initially absent create even when optional diagnostic output fails',async()=>{
 const f=fixture();const created=join(roots.at(-1)!,'created.json');const sources=createCmsSources([created],join(roots.at(-1)!,'create-backups'),{allowCreate:true});mkdirSync(f.directory,{recursive:true});mkdirSync(join(f.directory,'last-native-mutation.json'));const evidence=createCmsEvidence(f.directory);writeFileSync(created,'{"body":"Native proof"}');
 try{await expect(evidence.captureNative(sources,created,{...f.mutation,operation:'create',relativePath:'/created.json'},f.schema,d=>d.body==='Native proof')).rejects.toThrow();expect(sources.owns(created)).toBe(true);}finally{await sources.restore();}expect(existsSync(created)).toBe(false);
});

it('preserves a concurrent replacement after diagnostic failure on an initially absent native create', async () => {
  const f = fixture(),
    created = join(roots.at(-1)!, 'interrupted.json');
  const sources = createCmsSources(
    [created],
    join(roots.at(-1)!, 'interrupted-backups'),
    { allowCreate: true },
  );
  const evidence = createCmsEvidence(f.directory);
  mkdirSync(join(f.directory, 'last-native-mutation.json'));
  writeFileSync(created, '{"body":"Native proof"}');
  await expect(
    evidence.captureNative(
      sources,
      created,
      { ...f.mutation, operation: 'create', relativePath: '/interrupted.json' },
      f.schema,
      (d) => d.body === 'Native proof',
    ),
  ).rejects.toThrow();
  expect(sources.owns(created)).toBe(true);
  writeFileSync(created, '{"body":"Another editor after interruption"}');
  await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');
  expect(sources.owns(created)).toBe(false);
  expect(readFileSync(created, 'utf8')).toBe(
    '{"body":"Another editor after interruption"}',
  );
  expect(
    JSON.parse(
      readFileSync(sources.backupFor(created) + '.expected.json', 'utf8'),
    ),
  ).toEqual({ body: 'Native proof' });
  expect(
    JSON.parse(readFileSync(join(sources.backup, 'manifest.json'), 'utf8'))[0]
      .exists,
  ).toBe(false);
});
