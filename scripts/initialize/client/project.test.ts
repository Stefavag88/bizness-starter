import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseProject} from '../packages/config/project.mjs';
import {readContent} from '../packages/content/read.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {publicRoutes} from '../packages/content/routes.mjs';
it('validates this application content and all published language routes',()=>{
 const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));
 const source=readContent(process.cwd(),project);
 for(const language of project.languages){const routes=publicRoutes(localizeContent(source,language.code,project));expect(routes.some(r=>r.contentId==='home')).toBe(true);expect(routes.some(r=>r.contentId==='contact')).toBe(true);}
});
