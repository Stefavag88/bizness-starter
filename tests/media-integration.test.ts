import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import mediaIntegration from '../apps/site/src/integrations/media.mjs';
import {getMediaSession,endMediaSession} from '../packages/media/session.mjs';
let root:string;const policy={enabled:true,widths:[160],quality:80};
beforeEach(async()=>{root=await mkdtemp(join(tmpdir(),'media-integration-'));await mkdir(join(root,'apps/site/public/uploads'),{recursive:true});await writeFile(join(root,'apps/site/public/uploads/a.png'),await sharp({create:{width:200,height:100,channels:3,background:'red'}}).png().toBuffer());});
afterEach(async()=>{await endMediaSession(root);await rm(root,{recursive:true,force:true});});
it('owns a fresh build session and publishes demanded bytes into actual build done dir',async()=>{
 const integration=mediaIntegration({root,policy});await integration.hooks['astro:build:start']!({} as any);const r=await getMediaSession(root).resolve('/uploads/a.png');const out=join(root,'actual');await mkdir(out);await integration.hooks['astro:build:done']!({dir:pathToFileURL(out+'/')} as any);expect((await readFile(join(out,r.webp[0].src))).length).toBe(r.webp[0].bytes);expect(()=>getMediaSession(root)).toThrow(/active/);
});
it('serves GET and HEAD exactly, rejects query/traversal/unknown and cleans server sessions',async()=>{
 const integration=mediaIntegration({root,policy});let handler:any;await integration.hooks['astro:server:setup']!({server:{middlewares:{use:(fn:any)=>handler=fn}}} as any);const r=await getMediaSession(root).resolve('/uploads/a.png');
 async function request(url:string,method='GET'){const headers:any={};let body:any;let next=false;const response:any={setHeader:(k:string,v:any)=>headers[k]=v,end:(b:any)=>body=b};await handler({url,method},response,()=>{next=true;});return {headers,body,next,status:response.statusCode};}
 const get=await request(r.webp[0].src);expect(get.headers['Content-Type']).toBe('image/webp');expect(Number(get.headers['Content-Length'])).toBe(r.webp[0].bytes);expect(get.headers['Cache-Control']).toContain('immutable');expect(get.body.length).toBe(r.webp[0].bytes);expect((await request(r.webp[0].src,'HEAD')).body).toBeUndefined();
 for(const url of [r.webp[0].src+'?width=640','/_media/v1/../escape.webp','/_media/v1/'+'a'.repeat(64)+'.webp'])expect((await request(url)).status).toBe(404);expect((await request('/ordinary')).next).toBe(true);expect((await request(r.webp[0].src,'POST')).status).toBe(405);
 await integration.hooks['astro:server:done']!({} as any);expect(()=>getMediaSession(root)).toThrow(/active/);
});
it('closes registration even when publication fails',async()=>{
 const integration=mediaIntegration({root,policy});await integration.hooks['astro:build:start']!({} as any);await expect(getMediaSession(root).resolve('/uploads/missing.png')).rejects.toThrow();await expect(integration.hooks['astro:build:done']!({dir:pathToFileURL(join(root,'out')+'/')} as any)).rejects.toThrow();expect(()=>getMediaSession(root)).toThrow(/active/);
});

it('releases sessions after real prerender and compile failures, then builds fresh referenced assets',async()=>{
 const {buildSite}=await import('../apps/site/scripts/build.mjs');
 const {pathToFileURL}=await import('node:url');
 const pages=join(root,'src/pages');await mkdir(pages,{recursive:true});await symlink(join(process.cwd(),'apps/site/node_modules'),join(root,'node_modules'),'junction');
 const integration=()=>mediaIntegration({root,policy});
 const config=()=>({root,configFile:false as const,logLevel:'silent' as const,integrations:[integration()]});
 await writeFile(join(pages,'index.astro'),'---\nthrow new Error("Controlled unrelated prerender failure");\n---\n<p>Unreachable</p>');
 await expect(buildSite(config(),root)).rejects.toThrow(/Controlled unrelated/);expect(()=>getMediaSession(root)).toThrow(/active/);
 await writeFile(join(pages,'index.astro'),'---\nconst = invalid;\n---\n<p>Broken compiler</p>');
 await expect(buildSite(config(),root)).rejects.toThrow();expect(()=>getMediaSession(root)).toThrow(/active/);
 const sessionUrl=pathToFileURL(join(process.cwd(),'packages/media/session.mjs')).href;
 await writeFile(join(pages,'index.astro'),`---\nimport {getMediaSession} from ${JSON.stringify(sessionUrl)};\nconst image=await getMediaSession(${JSON.stringify(root)}).resolve('/uploads/a.png');\n---\n<img src={image.webp[0].src} width={image.webp[0].width} height={image.webp[0].height} />`);
 await buildSite(config(),root);expect(()=>getMediaSession(root)).toThrow(/active/);const html=await readFile(join(root,'dist/index.html'),'utf8');const src=html.match(/src="([^\"]+)"/)![1];expect(src).toMatch(/^\/_media\/v1\//);expect((await sharp(await readFile(join(root,'dist',src))).metadata()).width).toBe(160);
},60000);

it('preserves supported build options instead of silently discarding forwarded CLI flags',async()=>{
 const {parseBuildArgs}=await import('../apps/site/scripts/build.mjs');
 expect(parseBuildArgs(['--outDir','custom-dist','--mode=staging','--force','--devOutput','--silent','--base','/sample','--host','--port','4331'])).toEqual({config:{outDir:'custom-dist',mode:'staging',force:true,logLevel:'silent',base:'/sample',server:{host:true,port:4331}},options:{devOutput:true},help:false});
 expect(()=>parseBuildArgs(['--unknown'])).toThrow(/Unsupported/);
});
