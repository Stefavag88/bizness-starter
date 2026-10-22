import {it,expect,afterEach,vi} from 'vitest';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {initializeProject} from '../scripts/initialize/initialize.mjs';
import {createClientPackage} from '../scripts/initialize/snapshot.mjs';
import inventory from '../scripts/initialize/export-manifest.json';
import releaseInventory from '../scripts/deployment/release-files.json';
vi.setConfig({testTimeout:20000});const roots=ownedTempRoots('prompt-workflow-');afterEach(()=>roots.cleanup());
async function client(){const destination=join(roots.create(),'client');await initializeProject({source:resolve('.'),options:{help:false,dryRun:false,preset:'professional-services',name:'prompt-client',destination,languages:['en','el'],defaultLanguage:'en'}});return destination;}
it('generates portable client guidance and maintenance tooling without source-only creation instructions',async()=>{
 const destination=await client();
 expect(readFileSync(join(destination,'AGENTS.md'),'utf8')).toBe(readFileSync('scripts/initialize/client/AGENTS.md','utf8'));
 for(const file of ['.agents/skills/starter-maintain-site/SKILL.md','docs/CONFIGURATION_MAP.md','scripts/site-inspect.mjs','scripts/site-inspect.d.mts'])expect(existsSync(join(destination,file))).toBe(true);
 expect(existsSync(join(destination,'.agents/skills/starter-create-site'))).toBe(false);
 const p=JSON.parse(readFileSync('package.json','utf8'));expect(createClientPackage('client',p).scripts['site:inspect']).toBe('node scripts/site-inspect.mjs');
 expect(inventory).toEqual(releaseInventory);expect(inventory).toContain('AGENTS.md');expect(inventory).not.toContain('.agents/skills/starter-create-site/SKILL.md');
});
it('inspects actual canonical ownership, choices and optional capabilities without generated output or writes',async()=>{
 const destination=await client(),p=join(destination,'project.json'),bytes=readFileSync(p);
 const {inspectSite}=await import('../scripts/site-inspect.mjs');const report=inspectSite(destination);
 expect(report.application).toBe('prompt-client');expect(report.languages).toEqual(['en','el']);expect(report.profile).toBe('enquiries');expect(report.inventories).toEqual({release:'scripts/deployment/release-files.json',initializer:null});expect(report.owners.phone).toEqual({file:'content/settings/site.json',field:'contact.phone'});
 expect(report.choices.surfaces).toEqual(['default','muted','accent']);expect(report.pages.some((page:any)=>page.template==='home')).toBe(true);
 expect(report.pages.every((page:any)=>page.sections.every((section:any)=>section.id&&typeof section.enabled==='boolean'&&section.variants.includes(section.variant)))).toBe(true);
 expect(report.newsletter.available).toBe(false);expect(report.newsletter.footerModes).toEqual(['off','open-modal','inline']);
 expect(existsSync(join(destination,'.generated'))).toBe(false);expect(Array.from(readFileSync(p))).toEqual(Array.from(bytes));expect(report).not.toHaveProperty('infrastructure');
 writeFileSync(p,JSON.stringify({...JSON.parse(bytes.toString()),unknownSecret:'must reject'}));expect(()=>inspectSite(destination)).toThrow();expect(readFileSync(p,'utf8')).toContain('unknownSecret');
});
