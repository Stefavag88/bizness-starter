import {it,expect} from 'vitest';
import {parseProject} from '../packages/config/project.mjs';
import {project} from './fixtures/content/factory';
const defaults={enabled:false,durationMs:600,distancePx:18,staggerMs:70,interactionMs:180};
it('defaults absent and partial motion without mutating input',()=>{
 const raw=JSON.parse(JSON.stringify(project)); delete raw.design.motion;
 expect(parseProject(raw).design.motion).toEqual(defaults);
 expect(raw.design.motion).toBeUndefined(); delete raw.design;
 expect(parseProject(raw).design.motion).toEqual(defaults);
 expect(parseProject({...project,design:{...project.design,motion:{distancePx:0}}}).design.motion).toEqual({...defaults,distancePx:0});
});
it.each([{enabled:'true'},{enabled:null},{durationMs:99},{durationMs:1201},{durationMs:600.5},{distancePx:-1},{distancePx:49},{staggerMs:151},{staggerMs:-1},{interactionMs:401},{interactionMs:-1},{durationMs:'600'},{unknown:1}])('rejects invalid motion %j',motion=>expect(()=>parseProject({...project,design:{...project.design,motion}})).toThrow());
it.each([{durationMs:100,distancePx:0,staggerMs:0,interactionMs:0},{durationMs:1200,distancePx:48,staggerMs:150,interactionMs:400}])('accepts inclusive motion boundaries %j',motion=>expect(parseProject({...project,design:{...project.design,motion}}).design.motion).toMatchObject(motion));
it('emits configured units deterministically and rejects unvalidated interpolation',async()=>{
 const {motionCSS}=await import('../packages/design-system/motion.mjs');
 const motion={...defaults,durationMs:950,distancePx:32,staggerMs:120,interactionMs:240};
 const css=motionCSS(motion);
 for(const token of ['--motion-duration:950ms','--motion-distance:32px','--motion-stagger:120ms','--motion-interaction-duration:240ms'])expect(css).toContain(token);
 expect(motionCSS(motion)).toBe(css);
 expect(()=>motionCSS({...motion,distancePx:'1;display:none'} as any)).toThrow();
});
