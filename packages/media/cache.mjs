// Server-only cache. URLs and manifest names never supply filesystem paths.
import sharp from 'sharp';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath, rename, unlink, link } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { candidateWidths, encodeCandidate, withNativeImageWork, PIPELINE_VERSION, ENCODING_POLICY, SHARP_VERSION } from './optimization.mjs';
export { candidateWidths } from './optimization.mjs';
const MARKER = 'starter-media-optimization-cache-v1\n';
const CACHE_PARTS = ['.generated','media-optimization','cache','v1'];
const URL = /^\/_media\/v1\/([a-f0-9]{64})\.(png|jpeg|webp)$/;
const inFlight = new Map();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const identityHash = identity => hash(JSON.stringify(identity));
function identity(source, width, format, quality) {
  return {source,width,format,quality,sharp:SHARP_VERSION,pipeline:PIPELINE_VERSION,policy:ENCODING_POLICY};
}
function contained(root, path) {
  const rel = relative(root,path);
  if (!rel || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)) throw new Error('Media cache destination escapes its root');
}
async function regular(path, directory = false, optional = false) {
  let stat;
  try { stat = await lstat(path); } catch (error) { if (optional && error.code === 'ENOENT') return false; throw error; }
  if (stat.isSymbolicLink() || (directory ? !stat.isDirectory() : !stat.isFile())) throw new Error(`Unsafe media cache symlink/reparse destination: ${path}`);
  return true;
}
async function readRegular(path) {
  await regular(path);
  const handle = await open(path,'r');
  try {
    const before = await handle.stat();
    const named = await lstat(path);
    if (!before.isFile() || named.isSymbolicLink() || before.ino !== named.ino || before.dev !== named.dev) throw new Error('Unsafe replaced media cache destination');
    return await handle.readFile();
  } finally { await handle.close(); }
}
async function cacheDirectory(root, create) {
  const realRoot = await realpath(resolve(root));
  let dir = realRoot;
  for (const part of CACHE_PARTS) {
    dir = join(dir,part);contained(realRoot,dir);
    if (create) await mkdir(dir).catch(error => {if(error.code !== 'EEXIST') throw error;});
    await regular(dir,true);
  }
  const marker = join(dir,'.pipeline');
  if (create) {
    // Install complete ownership bytes atomically without replacing foreign markers.
    const temp = join(dir,`.pipeline.${randomUUID()}.tmp`);
    let handle;
    try {
      handle = await open(temp,'wx');await handle.writeFile(MARKER);await handle.sync();await handle.close();handle=undefined;
      try {await link(temp,marker);} catch(error) {if(error.code !== 'EEXIST') throw error;}
    } finally {await handle?.close();await unlink(temp).catch(error=>{if(error.code!=='ENOENT') throw error;});}
  }
  if ((await readRegular(marker)).toString() !== MARKER) throw new Error('Foreign media cache pipeline marker');
  return dir;
}
function candidateIdentity(candidate) {
  const parsed = URL.exec(candidate.src);
  if (!parsed || parsed[2] !== candidate.format) throw new Error('Invalid media cache candidate URL identity');
  return parsed[1];
}
async function validate(dir, candidate, expectedIdentity) {
  const id = candidateIdentity(candidate);
  const file = join(dir,`${id}.${candidate.format}`);
  const manifest = JSON.parse((await readRegular(file+'.json')).toString());
  const i = manifest.identity;
  if (!i || typeof i.source !== 'string' || !/^[a-f0-9]{64}$/.test(i.source) || !Number.isInteger(i.width) || i.width < 1 || i.width > 2560 || !Number.isInteger(i.quality) || i.quality < 40 || i.quality > 95) throw new Error('Invalid media cache manifest identity');
  const canonical = identity(i.source,i.width,i.format,i.quality);
  if (JSON.stringify(i) !== JSON.stringify(canonical) || identityHash(canonical) !== id || (expectedIdentity && JSON.stringify(i) !== JSON.stringify(expectedIdentity)) || i.format !== candidate.format || i.width !== candidate.width) throw new Error('Invalid media cache manifest identity');
  if (manifest.width !== candidate.width || manifest.height !== candidate.height || manifest.bytes !== candidate.bytes || manifest.file !== `${id}.${candidate.format}`) throw new Error('Invalid media cache manifest metadata');
  const bytes = await readRegular(file);
  if (bytes.length !== candidate.bytes || hash(bytes) !== manifest.sha256) throw new Error('Invalid media cache output hash');
  // Acquire only for this decode, never around a cache resolution that may encode.
  await withNativeImageWork(async () => {
    const decoder = sharp(bytes,{limitInputPixels:40000000,failOn:'warning'});
    const m = await decoder.metadata();
    if (m.format !== candidate.format || m.width !== candidate.width || m.height !== candidate.height || (m.pages ?? 1) !== 1 || m.orientation) throw new Error('Invalid media cache decoded dimensions');
    await decoder.raw().toBuffer();
  });
  return {bytes,contentType:`image/${candidate.format}`};
}
/** Reads only a strictly identified, verified candidate; session demand is owned by the caller. */
export async function readCachedCandidate(root,candidate) {
  candidateIdentity(candidate);
  return validate(await cacheDirectory(root,false),candidate);
}
async function atomicWrite(root,dir,name,bytes) {
  await cacheDirectory(root,false);
  const destination = join(dir,name);
  await regular(destination,false,true);
  const temp = join(dir,`${name}.${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await open(temp,'wx');await handle.writeFile(bytes);await handle.sync();await handle.close();handle=undefined;
    await cacheDirectory(root,false);await regular(destination,false,true);
    await rename(temp,destination);
  } finally {await handle?.close();await unlink(temp).catch(error=>{if(error.code!=='ENOENT') throw error;});}
}
async function cachedCandidate(root,dir,snapshot,width,format,quality) {
  const i=identity(snapshot.media.fingerprint,width,format,quality);
  const id=identityHash(i), name=`${id}.${format}`;
  const key=`${dir}/${id}`;
  if(inFlight.has(key)) return {...await inFlight.get(key)};
  const work=(async()=>{
    const file=join(dir,name);
    // Unsafe destinations are errors; ordinary incomplete/corrupt entries regenerate.
    await regular(file,false,true);await regular(file+'.json',false,true);
    try {
      const m=JSON.parse((await readRegular(file+'.json')).toString());
      // JPEG shrink-on-load can round one pixel differently from ratio arithmetic.
      // Bound that difference; decoded dimensions must still match the manifest exactly.
      const expectedHeight=Math.max(1,Math.round(snapshot.media.height*width/snapshot.media.width));
      if(!Number.isInteger(m.height) || m.height < 1 || Math.abs(m.height-expectedHeight)>1) throw new Error('Invalid media cache source aspect ratio');
      const candidate={src:`/_media/v1/${name}`,width,height:m.height,format,bytes:m.bytes};
      await validate(dir,candidate,i);return candidate;
    } catch(error) {if (/symlink|reparse|destination/.test(error.message)) throw error;}
    const output=await encodeCandidate(snapshot.bytes,width,format,quality);
    const candidate={src:`/_media/v1/${name}`,width:output.width,height:output.height,format,bytes:output.bytes.length};
    const manifest={identity:i,file:name,width:output.width,height:output.height,bytes:output.bytes.length,sha256:hash(output.bytes)};
    await atomicWrite(root,dir,name,output.bytes);
    // The manifest is the commit record and is always renamed last.
    await atomicWrite(root,dir,name+'.json',JSON.stringify(manifest));
    return candidate;
  })();
  inFlight.set(key,work);
  try{return {...await work};}finally{inFlight.delete(key);}
}
export async function resolveCachedMedia(root,snapshot,policy) {
  const base={...snapshot.media,fallback:[],webp:[]};
  if (!policy.enabled) return {...base,passthroughReason:'disabled'};
  if (snapshot.pages > 1) return {...base,passthroughReason:'animated-or-multipage'};
  // Refuse mismatched private snapshots; never use a second source pathname read.
  if(hash(snapshot.bytes)!==snapshot.media.fingerprint) throw new Error('Media snapshot fingerprint mismatch');
  const dir=await cacheDirectory(root,true);
  const widths=candidateWidths(snapshot.media.width,policy.widths);
  const formats=snapshot.media.format==='webp'?['webp']:['webp',snapshot.media.format];
  const families=await Promise.all(formats.map(async format=>[format,await Promise.all(widths.map(width=>cachedCandidate(root,dir,snapshot,width,format,policy.quality)))]));
  for(const [format,candidates] of families)base[format==='webp'?'webp':'fallback']=candidates;
  return base;
}
