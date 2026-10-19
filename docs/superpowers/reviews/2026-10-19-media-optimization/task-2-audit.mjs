import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { resolveCachedMedia, readCachedCandidate } from '../../../packages/media/cache.mjs';
import { readValidatedSource } from '../../../packages/media/source-reader.mjs';
const task='.superpowers/sdd/2026-10-19-starter-v2-media-optimization/';
const baseline=JSON.parse(await readFile(task+'canonical-before.json','utf8'));
const current={};
async function walk(path){for(const item of await readdir(path,{withFileTypes:true})){const p=join(path,item.name);if(item.isDirectory())await walk(p);else current[p.replaceAll('\\','/')]=createHash('sha256').update(await readFile(p)).digest('hex');}}
await walk('content');await walk('apps/site/public/uploads');current['project.json']=createHash('sha256').update(await readFile('project.json')).digest('hex');
const changed=[...new Set([...Object.keys(current),...Object.keys(baseline)])].filter(path=>current[path]!==baseline[path]);
await writeFile(task+'task-2-canonical-audit.json',JSON.stringify({fileCount:Object.keys(current).length,changed},null,2));if(changed.length)throw new Error('Canonical bytes changed');
const root=await mkdtemp(join(tmpdir(),'media-byte-table-'));
try {await mkdir(join(root,'apps/site/public/uploads'),{recursive:true});await writeFile(join(root,'apps/site/public/uploads/photo.jpg'),await readFile('tests/fixtures/media-optimization/large-photo.jpg'));const s=await readValidatedSource(root,'/uploads/photo.jpg');const r=await resolveCachedMedia(root,s,{enabled:true,widths:[320,640,960,1440,1920],quality:80});const rows=[];for(const c of [...r.webp,...r.fallback]){await readCachedCandidate(root,c);rows.push({width:c.width,height:c.height,format:c.format,bytes:c.bytes,originalBytes:s.bytes.length});}await writeFile(task+'task-2-photo-byte-table.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));}
finally{await rm(root,{recursive:true,force:true});}
