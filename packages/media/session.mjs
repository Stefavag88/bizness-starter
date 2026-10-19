// Server-only demand ownership. No cache inventory is used to authorize publication.
import {resolve,join,basename} from 'node:path';
import {lstat,mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {readValidatedSource} from './source-reader.mjs';
import {resolveCachedMedia,readCachedCandidate} from './cache.mjs';
const URL_PATTERN=/^\/_media\/v1\/[a-f0-9]{64}\.(png|jpeg|webp)$/;
const key=root=>{const path=resolve(root).replaceAll('\\','/').replace(/\/$/,'');return process.platform==='win32'?path.toLowerCase():path;};
// Vite SSR and the integration can load distinct copies of this module in one
// process. The registry shares only explicitly begun sessions across those copies.
const registrySymbol=Symbol.for('starter.media.session.registry.v1');
const registry=globalThis[registrySymbol] ??= new Map();
async function safeDirectory(path){
 try {await mkdir(path);}catch(error){if(error.code!=='EEXIST')throw error;}
 const stat=await lstat(path);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Unsafe media publication symlink/reparse directory');
}
async function publishFile(outDir,candidate,bytes){
 const root=resolve(outDir);await safeDirectory(root);const media=join(root,'_media');await safeDirectory(media);const dir=join(media,'v1');await safeDirectory(dir);
 const file=join(dir,basename(candidate.src));
 try {const stat=await lstat(file);if(stat.isSymbolicLink()||!stat.isFile())throw new Error('Unsafe media publication symlink/reparse file');if(!(await readFile(file)).equals(bytes))throw new Error('Conflicting media publication bytes');return;}catch(error){if(error.code!=='ENOENT')throw error;}
 const temp=join(dir,`.${randomUUID()}.tmp`);
 try {await writeFile(temp,bytes,{flag:'wx'});await rename(temp,file);}finally{await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
export function createMediaSession({root,policy,mode}){
 root=resolve(root);policy={...policy,widths:[...policy.widths]};
 let closed=false;const demanded=new Map(),pending=new Set(),sources=new Map();let failure;
 function assertOpen(){if(closed)throw new Error('Media session is closed');}
 async function drain(){while(pending.size)await Promise.allSettled([...pending]);}
 function track(work){pending.add(work);work.then(()=>pending.delete(work),error=>{failure??=error;pending.delete(work);});return work;}
 const session={
  async resolve(src){
   assertOpen();
   if(mode==='build'&&sources.has(src))return sources.get(src);
   const work=(async()=>{const snapshot=await readValidatedSource(root,src);const result=await resolveCachedMedia(root,snapshot,policy);if(!closed)for(const c of [...result.fallback,...result.webp])demanded.set(c.src,{...c});return result;})();
   if(mode==='build')sources.set(src,work);
   return track(work);
  },
  async publish(outDir){assertOpen();await drain();if(failure)throw failure;await safeDirectory(resolve(outDir));for(const c of demanded.values()){const {bytes}=await readCachedCandidate(root,c);await publishFile(outDir,c,bytes);}},
  async asset(urlPath){if(closed||!URL_PATTERN.test(urlPath))return undefined;const c=demanded.get(urlPath);if(!c)return undefined;return track(readCachedCandidate(root,c));},
  async close(){closed=true;await drain();demanded.clear();sources.clear();},
 };
 return session;
}
export function beginMediaSession(options){const id=key(options.root);if(registry.has(id))throw new Error('An active media session already owns this root');const session=createMediaSession(options);registry.set(id,session);return session;}
export function getMediaSession(root){const session=registry.get(key(root));if(!session)throw new Error('No active media session for this project root');return session;}
export async function endMediaSession(root){const id=key(root),session=registry.get(id);if(session){try{await session.close();}finally{if(registry.get(id)===session)registry.delete(id);}}}
