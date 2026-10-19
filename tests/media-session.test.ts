import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import sharp from 'sharp';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import {createMediaSession,beginMediaSession,getMediaSession,endMediaSession} from '../packages/media/session.mjs';
let root:string;const policy={enabled:true,widths:[160,320],quality:80};
beforeEach(async()=>{root=await mkdtemp(join(tmpdir(),'media-session-'));await mkdir(join(root,'apps/site/public/uploads'),{recursive:true});await writeFile(join(root,'apps/site/public/uploads/a.png'),await sharp({create:{width:400,height:200,channels:4,background:'red'}}).png().toBuffer());});
afterEach(async()=>{vi.restoreAllMocks();await endMediaSession(root);await rm(root,{recursive:true,force:true});});
it('deduplicates source demand, publishes only current rendered assets and starts empty after warm local demand',async()=>{
 const local=createMediaSession({root,policy,mode:'build'});const [a,b]=await Promise.all([local.resolve('/uploads/a.png'),local.resolve('/uploads/a.png')]);expect(a.webp).toEqual(b.webp);await local.close();
 const fresh=beginMediaSession({root,policy,mode:'build'});expect(await fresh.asset(a.webp[0].src)).toBeUndefined();const out=join(root,'dist');await fresh.publish(out);expect(await readdir(out)).toEqual([]);await endMediaSession(root);
 const next=beginMediaSession({root,policy,mode:'build'});const r=await next.resolve('/uploads/a.png');await next.publish(out);const names=await readdir(join(out,'_media/v1'));expect(names.sort()).toEqual([...r.webp,...r.fallback].map(c=>basename(c.src)).sort());for(const c of r.webp)expect((await readFile(join(out,c.src))).length).toBe(c.bytes);
});
it('serves only exact demanded identities and never allows unknown cache URLs to authorize reads',async()=>{
 const seed=createMediaSession({root,policy,mode:'build'});const a=await seed.resolve('/uploads/a.png');await seed.close();const s=createMediaSession({root,policy,mode:'dev'});
 for(const url of [a.webp[0].src,a.webp[0].src+'?width=320','/_media/v1/../escape.webp'])expect(await s.asset(url)).toBeUndefined();
 await s.resolve('/uploads/a.png');expect((await s.asset(a.webp[0].src))?.contentType).toBe('image/webp');expect((await s.asset(a.fallback[0].src))?.bytes.length).toBe(a.fallback[0].bytes);await s.close();expect(await s.asset(a.webp[0].src)).toBeUndefined();await expect(s.resolve('/uploads/a.png')).rejects.toThrow(/closed/);
});
it('re-reads changed original bytes in development and produces fresh dimensions and URLs',async()=>{
 const s=createMediaSession({root,policy,mode:'dev'});const a=await s.resolve('/uploads/a.png');await writeFile(join(root,'apps/site/public/uploads/a.png'),await sharp({create:{width:200,height:300,channels:3,background:'blue'}}).png().toBuffer());const b=await s.resolve('/uploads/a.png');expect(b.width).toBe(200);expect(b.height).toBe(300);expect(b.webp[0].src).not.toBe(a.webp[0].src);await s.close();
});
it('does zero cache work when disabled or unused and drains in-flight jobs on close',async()=>{
 const s=createMediaSession({root,policy:{...policy,enabled:false},mode:'build'});const r=await s.resolve('/uploads/a.png');expect(r.passthroughReason).toBe('disabled');await s.publish(join(root,'disabled'));await expect(readdir(join(root,'.generated'))).rejects.toThrow();await s.close();
 const busy=createMediaSession({root,policy,mode:'build'});const work=busy.resolve('/uploads/a.png');await busy.close();await work;expect(await busy.asset((await work).webp[0].src)).toBeUndefined();
});
it('requires explicit root ownership, rejects overlapping owners and clears failed sessions',async()=>{
 expect(()=>getMediaSession(root)).toThrow(/active/);const s=beginMediaSession({root,policy,mode:'build'});expect(getMediaSession(root)).toBe(s);expect(()=>beginMediaSession({root,policy,mode:'build'})).toThrow(/active/);await expect(s.resolve('/uploads/missing.png')).rejects.toThrow();await expect(s.publish(join(root,'bad'))).rejects.toThrow();await endMediaSession(root);expect(()=>getMediaSession(root)).toThrow(/active/);beginMediaSession({root,policy,mode:'build'});
});
it('refuses symlinked output namespaces without changing their targets',async()=>{
 const s=createMediaSession({root,policy,mode:'build'});await s.resolve('/uploads/a.png');const out=join(root,'dist'),outside=join(root,'outside');await mkdir(out);await mkdir(outside);await symlink(outside,join(out,'_media'),'junction');await expect(s.publish(out)).rejects.toThrow(/symlink|reparse/);expect(await readdir(outside)).toEqual([]);await s.close();
});

it('drains delayed sibling cache work before rejection and session close',async()=>{
 const {open}=await import('node:fs/promises');const probe=await open(join(root,'probe'),'w');const proto=Object.getPrototypeOf(probe);const original=proto.writeFile;await probe.close();let active=0,completed=0;
 vi.spyOn(proto,'writeFile').mockImplementation(async function(this:any,data:any,...args:any[]){
  if(typeof data==='string'&&data.startsWith('{"identity":')){
   active++;try {if(data.includes('"format":"webp"'))throw new Error('Controlled cache failure');await new Promise(r=>setTimeout(r,100));completed++;return await original.call(this,data,...args);}finally{active--;}
  }return original.call(this,data,...args);
 });
 const session=createMediaSession({root,policy,mode:'build'});await expect(session.resolve('/uploads/a.png')).rejects.toThrow(/Controlled cache failure/);await session.close();expect(active).toBe(0);expect(completed).toBe(2);
});

it.each([false,true])('rejects junction ancestors before creating output for demanded=%s',async(demanded)=>{
 const outside=join(root,'outside'),redirect=join(root,'redirect');await mkdir(outside);await writeFile(join(outside,'keep'),'unchanged');await symlink(outside,redirect,'junction');
 const session=createMediaSession({root,policy:{...policy,enabled:demanded},mode:'build'});
 try {
  if(demanded)await session.resolve('/uploads/a.png');
  await expect(session.publish(join(redirect,'dist'))).rejects.toThrow(/symlink|reparse/);
  expect(await readdir(outside)).toEqual(['keep']);expect(await readFile(join(outside,'keep'),'utf8')).toBe('unchanged');
 }finally{await session.close();}
});
