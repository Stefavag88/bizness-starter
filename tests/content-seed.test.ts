import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
import { parseProject } from '../packages/config/project.mjs';
import { readContent } from '../packages/content/read.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { publicRoutes } from '../packages/content/routes.mjs';
it('publishes the authored EN/EL seed through the same public pipeline',()=>{
 const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));
 const source=readContent('.',project,{now:new Date('2026-10-16T00:00:00Z')});
 for(const locale of ['en','el']){
  const content=localizeContent(source,locale,project);
  expect(publicRoutes(content)).toHaveLength(9);
  expect(content.pages.some(p=>p.sections.some(s=>s._template==='cta'&&s.enabled))).toBe(true);
  expect(content.settings.legal.privacyVersion).toBe('sample-v1');
 }
});
