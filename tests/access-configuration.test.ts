import { expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
it('emits JSON role lists for Worker without exposing identities in the CMS descriptor',()=>{
 const root=mkdtempSync(join(tmpdir(),'starter-role-config-'));
 try {
  cpSync('content',join(root,'content'),{recursive:true});cpSync('migrations',join(root,'migrations'),{recursive:true});
  for(const path of ['apps/site/src/styles','packages/design-system'])mkdirSync(join(root,path),{recursive:true});
  const project=JSON.parse(readFileSync('project.json','utf8'));delete project.infrastructure.adminEmail;
  Object.assign(project.infrastructure,{adminEmails:[' Admin1@Example.com ','admin2@example.com'],editorEmails:['editor@example.com']});
  writeFileSync(join(root,'project.json'),JSON.stringify(project));
  const result=spawnSync(process.execPath,[resolve('scripts/configure.mjs')],{cwd:root,encoding:'utf8'});
  expect(result.status,result.stderr).toBe(0);
  const vars=JSON.parse(readFileSync(join(root,'wrangler.generated.json'),'utf8')).vars;
  expect(vars.ADMIN_EMAILS).toBe('["admin1@example.com","admin2@example.com"]');expect(vars.EDITOR_EMAILS).toBe('["editor@example.com"]');expect(vars.ADMIN_EMAIL).toBeUndefined();
  const descriptor=JSON.parse(readFileSync(join(root,'.generated/cms.json'),'utf8'));expect(descriptor.project.infrastructure).toBeUndefined();
 } finally {rmSync(root,{recursive:true,force:true});}
});
it('requires at least one administrator for production readiness even with CMS editors',()=>{
 const root=mkdtempSync(join(tmpdir(),'starter-role-doctor-'));
 try{const project=JSON.parse(readFileSync('project.json','utf8'));delete project.infrastructure.adminEmail;Object.assign(project.infrastructure,{adminEmails:[],editorEmails:['editor@example.com'],accessIssuer:'https://example.cloudflareaccess.com',accessAudience:'site-audience'});writeFileSync(join(root,'project.json'),JSON.stringify(project));const result=spawnSync(process.execPath,[resolve('scripts/doctor.mjs'),'--production'],{cwd:root,encoding:'utf8'});expect(result.status).toBe(1);expect(result.stderr).toMatch(/at least one administrator/i);}finally{rmSync(root,{recursive:true,force:true});}
});
