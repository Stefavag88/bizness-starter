import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { resolveCachedMedia, readCachedCandidate } from '../packages/media/cache.mjs';
import { readValidatedSource } from '../packages/media/source-reader.mjs';
let root:string,uploads:string,cache:string;
const policy={enabled:true,widths:[160,320],quality:80};
beforeEach(async()=>{root=await mkdtemp(join(tmpdir(),'media-cache-'));uploads=join(root,'apps/site/public/uploads');cache=join(root,'.generated/media-optimization/cache/v1');await mkdir(uploads,{recursive:true});await writeFile(join(uploads,'a.png'),await sharp({create:{width:400,height:200,channels:4,background:'#a85'}}).png().toBuffer());});
afterEach(async()=>{vi.restoreAllMocks();await rm(root,{recursive:true,force:true});});
const snapshot=()=>readValidatedSource(root,'/uploads/a.png');
const file=(src:string)=>join(cache,basename(src));
it('reuses identical bytes across source paths and locales without writes',async()=>{
 const s=await snapshot();const a=await resolveCachedMedia(root,s,policy);const c=a.webp[0];const first=(await stat(file(c.src))).mtimeMs;
 const b=await resolveCachedMedia(root,{...s,media:{...s.media,src:'/uploads/el/alias.png'}},policy);expect(b.webp).toEqual(a.webp);expect(b.src).toBe('/uploads/el/alias.png');expect((await stat(file(c.src))).mtimeMs).toBe(first);
});
it('uses the validated snapshot after the pathname is replaced and invalidates changed bytes',async()=>{
 const old=await snapshot();await writeFile(join(uploads,'a.png'),await sharp({create:{width:200,height:300,channels:3,background:'blue'}}).png().toBuffer());
 const a=await resolveCachedMedia(root,old,policy);expect((await sharp((await readCachedCandidate(root,a.fallback[0])).bytes).metadata()).height).toBe(80);
 const b=await resolveCachedMedia(root,await snapshot(),policy);expect(b.webp[0].src).not.toBe(a.webp[0].src);expect(b.height).toBe(300);
});
it('quality and forged pipeline identities cannot reuse stale cache entries',async()=>{
 const s=await snapshot();const a=await resolveCachedMedia(root,s,policy);const b=await resolveCachedMedia(root,s,{...policy,quality:90});expect(b.webp[0].src).not.toBe(a.webp[0].src);
 const path=file(a.webp[0].src)+'.json';const m=JSON.parse(await readFile(path,'utf8'));m.identity.pipeline='obsolete';await writeFile(path,JSON.stringify(m));
 await expect(readCachedCandidate(root,a.webp[0])).rejects.toThrow();const repaired=await resolveCachedMedia(root,s,policy);expect((await readCachedCandidate(root,repaired.webp[0])).bytes.length).toBeGreaterThan(0);
});
it('regenerates missing output, corrupt bytes, forged metadata and incomplete temporary writes',async()=>{
 const s=await snapshot();const a=await resolveCachedMedia(root,s,policy);const c=a.webp[0];const original=(await readCachedCandidate(root,c)).bytes;
 await rm(file(c.src));await writeFile(join(cache,'interrupted.tmp'),'partial');await resolveCachedMedia(root,s,policy);expect((await readCachedCandidate(root,c)).bytes).toEqual(original);
 await writeFile(file(c.src),'broken');await expect(readCachedCandidate(root,c)).rejects.toThrow();await resolveCachedMedia(root,s,policy);expect((await readCachedCandidate(root,c)).bytes).toEqual(original);
 const path=file(c.src)+'.json';const m=JSON.parse(await readFile(path,'utf8'));m.width=999;m.file='../../escape';await writeFile(path,JSON.stringify(m));await expect(readCachedCandidate(root,c)).rejects.toThrow();await resolveCachedMedia(root,s,policy);expect((await readCachedCandidate(root,c)).bytes).toEqual(original);
 expect(await readFile(join(cache,'interrupted.tmp'),'utf8')).toBe('partial');
});
it('deduplicates concurrent requests and limits real Sharp transforms to two globally',async()=>{
 const proto=Object.getPrototypeOf(sharp());const original=proto.toBuffer;let active=0,max=0,encodes=0;
 vi.spyOn(proto,'toBuffer').mockImplementation(async function(this:any,...args:any[]){const transform=this.options.width>0;if(transform){active++;max=Math.max(max,active);encodes++;}try{return await original.apply(this,args);}finally{if(transform)active--;}});
 const s=await snapshot();const results=await Promise.all(Array.from({length:10},()=>resolveCachedMedia(root,s,policy)));expect(results.every(r=>r.webp[0].src===results[0].webp[0].src)).toBe(true);expect(encodes).toBe(4);expect(max).toBe(2);
 for(const c of [...results[0].webp,...results[0].fallback])await sharp((await readCachedCandidate(root,c)).bytes).raw().toBuffer();
});
it('rejects unowned markers, cache-directory junctions, output symlinks and forged URL escapes',async()=>{
 const s=await snapshot();await mkdir(cache,{recursive:true});await writeFile(join(cache,'.pipeline'),'foreign');await expect(resolveCachedMedia(root,s,policy)).rejects.toThrow(/marker|owner|pipeline/i);
 await rm(join(root,'.generated'),{recursive:true});const outside=join(root,'outside');await mkdir(outside);await symlink(outside,join(root,'.generated'),'junction');await expect(resolveCachedMedia(root,s,policy)).rejects.toThrow(/symlink|reparse|destination/i);expect(await readdir(outside)).toEqual([]);
 await rm(join(root,'.generated'));const a=await resolveCachedMedia(root,s,policy);const c=a.webp[0];const target=join(outside,'keep');await writeFile(target,'untouched');await rm(file(c.src));await symlink(target,file(c.src),'file');await expect(resolveCachedMedia(root,s,policy)).rejects.toThrow(/symlink|reparse|destination/i);expect(await readFile(target,'utf8')).toBe('untouched');
 await expect(readCachedCandidate(root,{...c,src:'/_media/v1/../../escape.webp'})).rejects.toThrow();
});
it('does not publish a partial manifest after an interrupted atomic write and recovers on retry',async()=>{
 const {open}=await import('node:fs/promises');const probe=await open(join(root,'probe'),'w');const proto=Object.getPrototypeOf(probe);const original=proto.writeFile;await probe.close();
 const boundary=vi.spyOn(proto,'writeFile').mockImplementation(async function(this:any,data:any,...args:any[]){if(typeof data==='string' && data.startsWith('{"identity":')){throw new Error('Controlled interrupted manifest write');}return original.call(this,data,...args);});
 const s=await snapshot();await expect(resolveCachedMedia(root,s,{...policy,widths:[160]})).rejects.toThrow(/interrupted/);
 // Promise.all rejects early: allow both independent format jobs to finish cleanup.
 await new Promise(resolve=>setTimeout(resolve,50));boundary.mockRestore();
 expect((await readdir(cache)).filter(name=>name.endsWith('.json')||name.endsWith('.tmp'))).toEqual([]);
 const r=await resolveCachedMedia(root,s,{...policy,widths:[160]});for(const c of [...r.webp,...r.fallback])expect((await readCachedCandidate(root,c)).bytes.length).toBeGreaterThan(0);
});
it('rejects symlinked manifests and parent namespaces before modifying their targets',async()=>{
 const s=await snapshot();const a=await resolveCachedMedia(root,s,policy);const c=a.webp[0];const outside=join(root,'outside-json');await writeFile(outside,'untouched');await rm(file(c.src)+'.json');await symlink(outside,file(c.src)+'.json','file');
 await expect(resolveCachedMedia(root,s,policy)).rejects.toThrow(/symlink|reparse|destination/i);expect(await readFile(outside,'utf8')).toBe('untouched');await expect(readCachedCandidate(root,c)).rejects.toThrow();
});
it('shares its two-job transform ceiling across different repository roots',async()=>{
 const other=await mkdtemp(join(tmpdir(),'media-second-'));const proto=Object.getPrototypeOf(sharp());const original=proto.toBuffer;let active=0,max=0;
 vi.spyOn(proto,'toBuffer').mockImplementation(async function(this:any,...args:any[]){const transform=this.options.width>0;if(transform){active++;max=Math.max(max,active);}try{return await original.apply(this,args);}finally{if(transform)active--;}});
 try{const s=await snapshot();const results=await Promise.all([resolveCachedMedia(root,s,policy),resolveCachedMedia(other,s,policy)]);expect(max).toBe(2);for(let index=0;index<2;index++)for(const c of results[index].webp)expect((await readCachedCandidate(index?other:root,c)).bytes.length).toBeGreaterThan(0);}finally{await rm(other,{recursive:true,force:true});}
});
it('commits the pipeline marker atomically for concurrent first requests',async()=>{
 const {open}=await import('node:fs/promises');const probe=await open(join(root,'probe'),'w');const proto=Object.getPrototypeOf(probe);const original=proto.writeFile;await probe.close();
 vi.spyOn(proto,'writeFile').mockImplementation(async function(this:any,data:any,...args:any[]){if(data==='starter-media-optimization-cache-v1\n')await new Promise(resolve=>setTimeout(resolve,50));return original.call(this,data,...args);});
 const s=await snapshot();const results=await Promise.all([resolveCachedMedia(root,s,policy),resolveCachedMedia(root,s,policy)]);expect(results[0].webp).toEqual(results[1].webp);
});
it('does not trust forged manifest dimensions even when a replacement output has a matching hash',async()=>{
 const {createHash}=await import('node:crypto');const s=await snapshot();const r=await resolveCachedMedia(root,s,policy);const c=r.webp[0];const bytes=await sharp({create:{width:160,height:78,channels:3,background:'red'}}).webp().toBuffer();const m=JSON.parse(await readFile(file(c.src)+'.json','utf8'));m.height=78;m.bytes=bytes.length;m.sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(file(c.src),bytes);await writeFile(file(c.src)+'.json',JSON.stringify(m));
 const repaired=await resolveCachedMedia(root,s,policy);expect(repaired.webp[0].height).toBe(80);expect((await sharp((await readCachedCandidate(root,repaired.webp[0])).bytes).metadata()).height).toBe(80);
});
it('reuses photographic output despite Sharp shrink-on-load height rounding',async()=>{
 await writeFile(join(uploads,'photo.jpg'),await readFile(new URL('./fixtures/media-optimization/large-photo.jpg',import.meta.url)));const s=await readValidatedSource(root,'/uploads/photo.jpg');const r=await resolveCachedMedia(root,s,{...policy,widths:[320]});const before=await Promise.all([...r.webp,...r.fallback].map(c=>stat(file(c.src))));
 const again=await resolveCachedMedia(root,s,{...policy,widths:[320]});expect(again.webp).toEqual(r.webp);expect(again.fallback).toEqual(r.fallback);const after=await Promise.all([...r.webp,...r.fallback].map(c=>stat(file(c.src))));expect(after.map(x=>x.mtimeMs)).toEqual(before.map(x=>x.mtimeMs));
});
