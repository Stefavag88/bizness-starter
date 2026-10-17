import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import * as security from '../worker/security';
import worker from '../worker/index';
import { environment } from './db';
vi.mock('../worker/workflow', () => ({ startEnrollments: async () => {}, WelcomeWorkflow: class {} }));
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let jwks: object;
const issuer = 'https://roles-test.cloudflareaccess.com';
beforeAll(async () => { pair = await generateKeyPair('RS256'); jwks = { keys: [{ ...await exportJWK(pair.publicKey), kid: 'roles', alg: 'RS256', use: 'sig' }] }; });
afterEach(() => vi.unstubAllGlobals());
function remote() {
  const value = environment();
  Object.assign(value.env, { ENVIRONMENT: 'production', ACCESS_ISSUER: issuer, ACCESS_AUDIENCE: 'site-audience', ADMIN_EMAILS: '["admin1@example.com","admin2@example.com"]', EDITOR_EMAILS: '["editor@example.com","admin1@example.com"]', ASSETS: { fetch: async () => new Response('CMS asset') } });
  // Keep jose verification and Worker authorization real; substitute only the external certificate endpoint.
  vi.stubGlobal('fetch', async (url: unknown) => {
    if (String(url) !== `${issuer}/cdn-cgi/access/certs`) throw Error('Unexpected external request');
    return Response.json(jwks);
  });
  return value;
}
async function token(email: unknown = 'admin1@example.com', patch: Record<string, unknown> = {}) {
  return new SignJWT({ email, iss: issuer, aud: 'site-audience', exp: Math.floor(Date.now()/1000)+300, ...patch }).setProtectedHeader({alg:'RS256',kid:'roles'}).sign(pair.privateKey);
}
const request = (path: string, jwt?: string, host='https://example.com') => new Request(host+path, {headers: jwt ? {'cf-access-jwt-assertion':jwt} : {}});
const cms = security.editor;
it.each(['admin1@example.com','admin2@example.com'])('admits %s to CMS and operations', async email => {
  const {env,database}=remote(); try { const r=request('/cms',await token(email)); expect(await security.admin(r,env)).toBe(email); expect(await cms(r,env)).toBe(email); } finally {database.close();}
});
it('normalizes signed identities and runtime lists consistently',async()=>{
 const {env,database}=remote();try{Object.assign(env,{ADMIN_EMAILS:'[" ADMIN1@Example.COM "]',EDITOR_EMAILS:'[]'});expect(await security.admin(request('/admin',await token(' Admin1@EXAMPLE.com ')),env)).toBe('admin1@example.com');}finally{database.close();}
});
it('allows editors to CMS but denies operational helpers',async()=>{
 const {env,database}=remote();try{const r=request('/cms',await token('editor@example.com'));expect(await cms(r,env)).toBe('editor@example.com');await expect(security.admin(r,env)).rejects.toMatchObject({status:403});}finally{database.close();}
});
it.each([
 ['unlisted','stranger@example.com',{}],['missing email',undefined,{}],['non-string email',4,{}],['expired','admin1@example.com',{exp:1}],['no expiry','admin1@example.com',{exp:undefined}],['wrong issuer','admin1@example.com',{iss:'https://wrong.cloudflareaccess.com'}],['wrong audience','admin1@example.com',{aud:'wrong'}],
])('rejects %s signed claims for both roles',async(_name,email,patch)=>{
 const {env,database}=remote();try{const jwt=await token(email,{...patch,...(email===undefined?{email:undefined}:{})});await expect(security.admin(request('/admin',jwt),env)).rejects.toMatchObject({status:403});await expect(cms(request('/cms',jwt),env)).rejects.toMatchObject({status:403});}finally{database.close();}
});
it.each(['missing','tampered'])('rejects %s tokens even with a trusted-looking email header',async kind=>{
 const {env,database}=remote();try{const r=request('/cms',kind==='missing'?undefined:(await token())+'bad');r.headers.set('cf-access-authenticated-user-email','admin1@example.com');await expect(security.admin(r,env)).rejects.toMatchObject({status:403});await expect(cms(r,env)).rejects.toMatchObject({status:403});}finally{database.close();}
});
it.each([undefined,'','admin1@example.com','{}','null','[4]','["*"]','["admin1@example.com"," ADMIN1@example.com "]'])('fails closed on invalid role list %s',async value=>{
 const {env,database}=remote();try{Object.assign(env,{ADMIN_EMAILS:value});await expect(security.admin(request('/admin',await token()),env)).rejects.toMatchObject({status:503});await expect(cms(request('/cms',await token('editor@example.com')),env)).rejects.toMatchObject({status:503});}finally{database.close();}
});
it('permits editor-only CMS while empty admins deny operations',async()=>{
 const {env,database}=remote();try{Object.assign(env,{ADMIN_EMAILS:'[]'});const r=request('/cms',await token('editor@example.com'));expect(await cms(r,env)).toBe('editor@example.com');await expect(security.admin(r,env)).rejects.toMatchObject({status:403});}finally{database.close();}
});
it.each(['ACCESS_ISSUER','ACCESS_AUDIENCE','EDITOR_EMAILS'])('fails closed with missing %s',async key=>{
 const {env,database}=remote();try{Object.assign(env,{[key]:undefined});await expect(cms(request('/cms',await token()),env)).rejects.toMatchObject({status:503});}finally{database.close();}
});
it('bypasses roles only for actual loopback requests in local environment',async()=>{
 const {env,database}=environment();try{for(const host of ['http://localhost:8790','http://127.0.0.1:8790','http://[::1]:8790']){expect(await security.admin(request('/admin',undefined,host),env)).toBe('local-developer');expect(await cms(request('/cms',undefined,host),env)).toBe('local-developer');}await expect(cms(request('/cms'),env)).rejects.toMatchObject({status:503});env.ENVIRONMENT='production';await expect(cms(request('/cms',undefined,'http://localhost:8790'),env)).rejects.toMatchObject({status:503});}finally{database.close();}
});
it.each(['admin1@example.com','admin2@example.com','editor@example.com','stranger@example.com'])('enforces %s roles at real Worker routes',async email=>{
 const {env,database}=remote();try{const jwt=await token(email),ctx={} as ExecutionContext;const isAdmin=email.startsWith('admin'),isEditor=email==='editor@example.com';for(const path of ['/cms','/cms/index.html']){const response=await worker.fetch(request(path,jwt),env,ctx);expect(response.status).toBe(isAdmin||isEditor?200:403);if(response.status===200)expect(await response.text()).toBe('CMS asset');}for(const path of ['/admin/campaigns','/api/admin/campaigns','/api/admin/campaign-sources','/api/operations/overview'])expect((await worker.fetch(request(path,jwt),env,ctx)).status).toBe(isAdmin?200:403);env.PROFILE='enquiries';expect((await worker.fetch(request('/api/admin/campaigns',jwt),env,ctx)).status).toBe(404);}finally{database.close();}
});

it('rejects a symmetric token even when its email and claims match',async()=>{
 const {env,database}=remote();try{const jwt=await new SignJWT({email:'admin1@example.com'}).setProtectedHeader({alg:'HS256'}).setIssuer(issuer).setAudience('site-audience').setExpirationTime('5m').sign(new TextEncoder().encode('untrusted-symmetric-key-000000000000'));await expect(security.admin(request('/admin',jwt),env)).rejects.toMatchObject({status:403});}finally{database.close();}
});
it.each(['https://evil.test','http://roles-test.cloudflareaccess.com','https://roles-test.cloudflareaccess.com/path'])('rejects invalid issuer configuration %s',async issuer=>{
 const {env,database}=remote();try{env.ACCESS_ISSUER=issuer;await expect(security.admin(request('/admin',await token()),env)).rejects.toMatchObject({status:503});}finally{database.close();}
});
it('fails closed for administrator access when the editor list is malformed',async()=>{
 const {env,database}=remote();try{env.EDITOR_EMAILS='editor@example.com';await expect(security.admin(request('/admin',await token()),env)).rejects.toMatchObject({status:503});}finally{database.close();}
});
