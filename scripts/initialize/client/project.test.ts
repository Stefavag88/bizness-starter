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

it('defaults to a closed hosted dispatch allowance and imports the capacity model',async()=>{
 const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));const {runtimeBudget,...infrastructure}=project.infrastructure;const defaults=parseProject({...project,infrastructure});expect(defaults.infrastructure.runtimeBudget.dailyDispatchLimit).toBeNull();
 expect(runtimeBudget.transactionalReserve).toBeLessThanOrEqual(runtimeBudget.dailyDispatchLimit??0);
 const {calculateCapacity}=await import('../packages/runtime-capacity/model.mjs');const {resolveRuntimePolicy}=await import('../packages/config/runtime-budgets.mjs');
 expect(calculateCapacity({profile:project.profile},{profile:project.profile,qualification:'local'},resolveRuntimePolicy(project.profile)).qualification).toBe('not_qualified');
});
