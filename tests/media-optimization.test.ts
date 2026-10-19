import { afterEach, beforeEach, expect, it } from 'vitest';
import sharp from 'sharp';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { candidateWidths, resolveCachedMedia, readCachedCandidate } from '../packages/media/cache.mjs';
import { readValidatedSource } from '../packages/media/source-reader.mjs';
let root:string;
const policy={enabled:true,widths:[160,320,640,960,1440,1920],quality:80};
beforeEach(async()=>{root=await mkdtemp(join(tmpdir(),'media-opt-'));await mkdir(join(root,'apps/site/public/uploads'),{recursive:true});});
afterEach(async()=>{await rm(root,{recursive:true,force:true});});
async function fixture(name:string){await writeFile(join(root,'apps/site/public/uploads',name),await readFile(new URL('./fixtures/media-optimization/'+name,import.meta.url)));return readValidatedSource(root,'/uploads/'+name);}
it('candidateWidths caps without upscaling',()=>{
 expect(candidateWidths(1000,[320,640,960,1440,1920])).toEqual([320,640,960,1000]);
 expect(candidateWidths(200,[320,640])).toEqual([200]);
 expect(candidateWidths(4000,[320,640,960,1440,1920])).toEqual([320,640,960,1440,1920]);
});
it('encodes a real large photo into at most twelve correctly decoded smaller candidates',async()=>{
 const source=await fixture('large-photo.jpg');const result=await resolveCachedMedia(root,source,policy);
 expect(result.webp).toHaveLength(6);expect(result.fallback).toHaveLength(6);
 for(const c of [...result.webp,...result.fallback]){const {bytes}=await readCachedCandidate(root,c);const m=await sharp(bytes).metadata();await sharp(bytes).raw().toBuffer();expect(m.width).toBe(c.width);expect(m.height).toBe(c.height);expect(m.format).toBe(c.format);expect(c.bytes).toBe(bytes.length);expect(bytes.length).toBeLessThan(source.bytes.length);}
});
it('normalizes EXIF orientation without changing the original snapshot',async()=>{
 const source=await fixture('portrait.jpg');const result=await resolveCachedMedia(root,source,policy);expect(result.width).toBe(300);expect(result.height).toBe(600);
 for(const c of [...result.fallback,...result.webp]){const {bytes}=await readCachedCandidate(root,c);const m=await sharp(bytes).metadata();expect(m.orientation).toBeUndefined();expect(m.height).toBe(c.width*2);}
 expect((await sharp(source.bytes).metadata()).orientation).toBe(6);
});
it('preserves transparency and lossless PNG fallback pixels at original size',async()=>{
 const source=await fixture('alpha.png');const result=await resolveCachedMedia(root,source,policy);
 const c=result.fallback.at(-1)!;expect(c.width).toBe(400);expect(c.format).toBe('png');
 const {bytes}=await readCachedCandidate(root,c);expect(await sharp(bytes).raw().toBuffer()).toEqual(await sharp(source.bytes).raw().toBuffer());
 for(const c of result.webp){const {bytes}=await readCachedCandidate(root,c);expect((await sharp(bytes).metadata()).hasAlpha).toBe(true);}
});
it('does not upscale small images and uses only one WebP family',async()=>{
 const s=await fixture('small.png');const a=await resolveCachedMedia(root,s,policy);expect(a.fallback.map(c=>c.width)).toEqual([100]);
 const b=await sharp(s.bytes).webp().toBuffer();await writeFile(join(root,'apps/site/public/uploads/static.webp'),b);
 const r=await resolveCachedMedia(root,await readValidatedSource(root,'/uploads/static.webp'),policy);expect(r.fallback).toEqual([]);expect(r.webp.map(c=>c.width)).toEqual([100]);
});
it('passes disabled and multipage sources through without creating a cache',async()=>{
 for(const [name,p,reason] of [['small.png',{...policy,enabled:false},'disabled'],['animated.webp',policy,'animated-or-multipage']] as const){const r=await resolveCachedMedia(root,await fixture(name),p);expect(r.fallback).toEqual([]);expect(r.webp).toEqual([]);expect(r.passthroughReason).toBe(reason);}
 await expect(readFile(join(root,'.generated/media-optimization/cache/v1/.pipeline'))).rejects.toThrow();
});
it('propagates compressed-payload corruption instead of silently passing through',async()=>{
 const s=await fixture('large-photo.jpg');s.bytes=s.bytes.subarray(0,Math.floor(s.bytes.length/2));
 // Metadata still decodes; the full transform must reject incomplete pixels.
 const {createHash}=await import('node:crypto');s.media.fingerprint=createHash('sha256').update(s.bytes).digest('hex');
 await expect(resolveCachedMedia(root,s,policy)).rejects.toThrow();
});

it('characterizes pinned PNG output as at most RGBA8 even for a 16-bit alpha source',async()=>{
 const input=await sharp({create:{width:8,height:4,channels:4,background:'#33669980'}}).toColourspace('rgb16').png().toBuffer();
 expect((await sharp(input).metadata()).bitsPerSample).toBe(16);
 await writeFile(join(root,'apps/site/public/uploads/deep.png'),input);
 const source=await readValidatedSource(root,'/uploads/deep.png');
 const result=await resolveCachedMedia(root,source,policy);
 for(const candidate of result.fallback){
  const {bytes}=await readCachedCandidate(root,candidate);
  const metadata=await sharp(bytes).metadata();
  expect(metadata.bitsPerSample).toBe(8);expect(metadata.channels).toBe(4);
  expect(metadata.hasAlpha).toBe(true);expect(metadata.hasProfile).toBe(false);
 }
});
