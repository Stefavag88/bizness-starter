import {it,expect,vi,beforeAll,afterEach} from 'vitest';import {exportJWK,generateKeyPair,SignJWT} from 'jose';import worker from '../worker/index';import {environment} from './db';
vi.mock('cloudflare:workers',()=>({WorkflowEntrypoint:class{}}));
let pair:Awaited<ReturnType<typeof generateKeyPair>>,jwks:object;beforeAll(async()=>{pair=await generateKeyPair('RS256');jwks={keys:[{...await exportJWK(pair.publicKey),kid:'usage',alg:'RS256',use:'sig'}]};});afterEach(()=>vi.unstubAllGlobals());
async function jwt(email:string){return new SignJWT({email,iss:'https://usage-test.cloudflareaccess.com',aud:'usage',exp:Math.floor(Date.now()/1000)+300}).setProtectedHeader({alg:'RS256',kid:'usage'}).sign(pair.privateKey);}
it.each(['enquiries','newsletter','nurture'])('admits only an administrator to usage under %s',async profile=>{const f=environment(profile);try{
 Object.assign(f.env,{ENVIRONMENT:'production',ACCESS_ISSUER:'https://usage-test.cloudflareaccess.com',ACCESS_AUDIENCE:'usage',ADMIN_EMAILS:'["owner@example.com"]',EDITOR_EMAILS:'["writer@example.com"]'});
 vi.stubGlobal('fetch',async()=>Response.json(jwks));const ctx={waitUntil:()=>{}} as any;
 for(const path of ['/admin/usage','/api/operations/usage']){
 const owner=await worker.fetch(new Request('https://example.com'+path,{headers:{'cf-access-jwt-assertion':await jwt('owner@example.com')}}),f.env,ctx);expect(owner.status).toBe(200);
 const editor=await worker.fetch(new Request('https://example.com'+path,{headers:{'cf-access-jwt-assertion':await jwt('writer@example.com')}}),f.env,ctx);expect(editor.status).toBe(403);
 expect((await worker.fetch(new Request('https://example.com'+path),f.env,ctx)).status).toBe(403);
 }
 expect(f.database.prepare('SELECT COUNT(*) n FROM runtime_usage_day').get()?.n).toBe(0);
 }finally{f.database.close();}});
it('does not let a client select another account or database',async()=>{const f=environment();try{
 const r=await worker.fetch(new Request('http://127.0.0.1:8899/api/operations/usage?accountId=other'),f.env,{waitUntil:()=>{}} as any);expect(r.status).toBe(400);
 }finally{f.database.close();}});

it.each(['expired','wrong audience','spoofed local'])('denies %s before reading usage data',async kind=>{const f=environment();try{
 Object.assign(f.env,{ENVIRONMENT:kind==='spoofed local'?'local':'production',ACCESS_ISSUER:'https://usage-test.cloudflareaccess.com',ACCESS_AUDIENCE:'usage',ADMIN_EMAILS:'["owner@example.com"]',EDITOR_EMAILS:'[]'});
 const signed=await new SignJWT({email:'owner@example.com',iss:'https://usage-test.cloudflareaccess.com',aud:kind==='wrong audience'?'other':'usage',exp:kind==='expired'?1:Math.floor(Date.now()/1000)+300}).setProtectedHeader({alg:'RS256',kid:'usage'}).sign(pair.privateKey);
 vi.stubGlobal('fetch',async()=>Response.json(jwks));const prepare=vi.fn(()=>{throw Error('must not query');});f.env.DB={prepare} as any;
 for(const path of ['/admin/usage','/api/operations/usage']){const r=await worker.fetch(new Request('https://example.com'+path,{headers:kind==='spoofed local'?{}:{'cf-access-jwt-assertion':signed}}),f.env,{waitUntil:()=>{}} as any);expect(r.status).toBe(403);}
 expect(prepare).not.toHaveBeenCalled();
 }finally{f.database.close();}});
