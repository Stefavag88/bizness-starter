import {it,expect,afterEach} from 'vitest';
import {mkdirSync,writeFileSync,readFileSync,copyFileSync,symlinkSync,unlinkSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {parseProject} from '../packages/config/project.mjs';
import source from '../project.json';
const roots=ownedTempRoots('release-artifact-');afterEach(()=>roots.cleanup());
const write=(root:string,path:string,value:unknown)=>{mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),typeof value==='string'?value:JSON.stringify(value));};
async function fixture(siteUrl='https://client.example'){
 const {releaseWorkerConfig,sealReleaseArtifact}=await import('../scripts/deployment/release-artifact.mjs');
 const {deploymentIdentity,identityText}=await import('../packages/config/deployment-identity.mjs');
 const p=parseProject({...source,environment:'production',siteUrl});
 const target={application:p.name,accountId:'a'.repeat(32),project:p},root=roots.create(),identity=deploymentIdentity(p)!;
 write(root,'project.json',p);write(root,'identity.json',identity);write(root,'wrangler.json',releaseWorkerConfig(target));
 write(root,'assets/en/index.html','<meta name="starter-deployment" content="'+identityText(identity).replaceAll('"','&quot;')+'">');
 write(root,'worker/index.js','export const marker="'+Buffer.from(identityText(identity)).toString('base64')+'";');write(root,'migrations/0001_initial.sql','CREATE TABLE fixture(id TEXT);');
 const metadata={format:1 as const,application:p.name,target:'production' as const,accountId:target.accountId,databaseId:p.infrastructure.databaseId,sourceRevision:null,inputDigest:'a'.repeat(64),targetDigest:'b'.repeat(64),checks:{typecheck:true,publicBuild:true,workerBundle:true,localMigrations:true,packagedDryRun:true},tools:{node:process.version,pnpm:'10.13.1',wrangler:'4.148.0'},cms:'not_built' as const};
 sealReleaseArtifact(root,metadata);return {root,target,metadata};
}
it('verifies a blocked candidate and rejects target mismatch, corruption, missing, extra and manifest changes',async()=>{
 const {verifyReleaseArtifact}=await import('../scripts/deployment/release-artifact.mjs');const {root,target}=await fixture();
 expect(verifyReleaseArtifact(root,target).status).toBe('blocked');
 expect(()=>verifyReleaseArtifact(root,{...target,accountId:'b'.repeat(32)})).toThrow(/target|account/i);
 const path=join(root,'assets/en/index.html'),bytes=readFileSync(path);writeFileSync(path,'tampered');expect(()=>verifyReleaseArtifact(root,target)).toThrow(/hash|integrity/i);writeFileSync(path,bytes);
 write(root,'extra.txt','extra');expect(()=>verifyReleaseArtifact(root,target)).toThrow(/inventory|extra/i);unlinkSync(join(root,'extra.txt'));
 unlinkSync(path);expect(()=>verifyReleaseArtifact(root,target)).toThrow(/inventory|missing/i);writeFileSync(path,bytes);
 const manifest=JSON.parse(readFileSync(join(root,'release.json'),'utf8'));manifest.cms='built';write(root,'release.json',manifest);expect(()=>verifyReleaseArtifact(root,target)).toThrow(/checksum|integrity/i);
});
it('refuses links, external config paths and a package without a matching frontend/bundle marker',async()=>{
 const {sealReleaseArtifact,verifyReleaseArtifact}=await import('../scripts/deployment/release-artifact.mjs');const {root,target,metadata}=await fixture();
 const link=join(root,'assets/link');symlinkSync(join(root,'identity.json'),link);try{expect(()=>verifyReleaseArtifact(root,target)).toThrow(/link/i);}finally{unlinkSync(link);}
 const config=JSON.parse(readFileSync(join(root,'wrangler.json'),'utf8'));config.main='../outside.js';write(root,'wrangler.json',config);expect(()=>sealReleaseArtifact(root,metadata)).toThrow(/config|path/i);
 write(root,'wrangler.json',(await import('../scripts/deployment/release-artifact.mjs')).releaseWorkerConfig(target));write(root,'worker/index.js','no identity');expect(()=>sealReleaseArtifact(root,metadata)).toThrow(/identity|marker/i);
});
it('copies only explicit runtime inputs and canonical content, detects changes and strips inherited credentials',async()=>{
 const {snapshotReleaseInputs,sanitizedBuildEnv}=await import('../scripts/deployment/release-inputs.mjs');
 const inventory=JSON.parse(readFileSync('scripts/deployment/release-files.json','utf8'));
 const root=roots.create();for(const path of inventory){mkdirSync(dirname(join(root,path)),{recursive:true});copyFileSync(path,join(root,path));}
 write(root,'project.json',source);write(root,'content/settings/test.json',{});write(root,'.env','SECRET');write(root,'apps/site/public/cms/index.html','LOCALCMS');write(root,'.generated/secret','SECRET');
 const snapshot=snapshotReleaseInputs(root);expect(snapshot.files.has('.env')).toBe(false);expect(snapshot.files.has('apps/site/public/cms/index.html')).toBe(false);expect(snapshot.files.has('content/settings/test.json')).toBe(true);snapshot.assertUnchanged();
 write(root,'content/new.json',{});expect(()=>snapshot.assertUnchanged()).toThrow(/changed/i);
 const env=sanitizedBuildEnv({PATH:'path',SystemRoot:'system',AWS_SECRET_ACCESS_KEY:'SECRET',TINA_TOKEN:'SECRET',CLOUDFLARE_API_TOKEN:'SECRET',NODE_OPTIONS:'danger',npm_config_registry:'danger',HOME:'old'},root);
 expect(Object.values(env)).not.toContain('SECRET');expect(env.NODE_OPTIONS).toBeUndefined();expect(env.HOME).not.toBe('old');expect(env.PATH).toBe('path');
});

it('validates the generated root redirect separately from actual page identities',async()=>{
 const {root,metadata}=await fixture();unlinkSync(join(root,'release.json'));
 const {sealReleaseArtifact}=await import('../scripts/deployment/release-artifact.mjs');
 write(root,'assets/index.html','<meta http-equiv="refresh" content="2;url=/en"><link rel="canonical" href="https://client.example/en">');
 expect(sealReleaseArtifact(root,metadata).status).toBe('blocked');unlinkSync(join(root,'release.json'));
 write(root,'assets/index.html','<meta http-equiv="refresh" content="2;url=/wrong"><link rel="canonical" href="https://wrong.example/en">');
 expect(()=>sealReleaseArtifact(root,metadata)).toThrow(/redirect|identity/i);
});
it('only creates blocked command plans for the exact verified account and database',async()=>{
 const {root,target}=await fixture();const {planReleaseCommand}=await import('../scripts/deployment/release-command.mjs');
 const options={target:'production' as const,artifact:root,accountId:target.accountId,databaseId:target.project.infrastructure.databaseId};
 for(const op of ['deploy','migrate']){const plan=planReleaseCommand(op,options);expect(plan.executable).toBe(false);expect(plan.status).toBe('blocked');expect(plan.command.args).toContain(join(root,'wrangler.json'));}
 expect(()=>planReleaseCommand('deploy',{...options,accountId:'b'.repeat(32)})).toThrow(/account/i);
 expect(()=>planReleaseCommand('migrate',{...options,databaseId:'11111111-1111-4111-8111-111111111111'})).toThrow(/database/i);
});

it.each(['https://client.example/','https://CLIENT.example','https://δοκιμή.example/'])('accepts Astro-normalized root redirect output for %s',async(siteUrl)=>{
 const {root,metadata}=await fixture(siteUrl);unlinkSync(join(root,'release.json'));
 const {sealReleaseArtifact}=await import('../scripts/deployment/release-artifact.mjs');
 write(root,'assets/index.html','<meta http-equiv="refresh" content="2;url=/en"><link rel="canonical" href="'+new URL('/en',siteUrl).href+'">');
 expect(sealReleaseArtifact(root,metadata).status).toBe('blocked');
});
