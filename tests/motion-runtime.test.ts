import {it,expect} from 'vitest';
import {initMotion} from '../apps/site/src/scripts/motion';
import {scene} from './fixtures/motion/scene';
it('animates an offscreen target once and caps stagger at 300ms',()=>{
 const s=scene(10);const stop=initMotion(s.root);s.fire(...s.targets);s.fire(...s.targets);
 expect(s.targets.map(t=>t.animate.mock.calls.length)).toEqual(Array(10).fill(1));
 expect(s.targets.map(t=>(t.animate.mock.calls[0] as any)[1].delay)).toEqual([0,70,140,210,280,300,300,300,300,300]);
 expect(s.observer.unobserve).toHaveBeenCalledTimes(10);stop();expect(s.observer.disconnect).toHaveBeenCalled();
});
it.each(['off','reduced','unsupported','visible','focus','hash','hidden'])('skips %s content',mode=>{
 const s=scene();if(mode==='off')s.root.documentElement.dataset.motion='off';if(mode==='reduced')s.media.matches=true;
 if(mode==='unsupported')(s.win as any).IntersectionObserver=undefined;if(mode==='visible')s.targets[0].top=20;
 if(mode==='focus')s.root.activeElement=s.targets[0];if(mode==='hash')s.win.location.hash='#destin%61tion';if(mode==='hidden')s.targets[0].hidden=true;
 const stop=initMotion(s.root);s.fire(...s.targets);expect(s.targets[0].animate).not.toHaveBeenCalled();stop();
});
it.each(['focus','hash','media'])('cancels immediately on %s',mode=>{
 const s=scene();const stop=initMotion(s.root);s.fire(...s.targets);const a=s.targets[0].animate.mock.results[0]?.value;
 expect(a).toBeDefined();if(mode==='focus')s.focus(s.targets[0]);if(mode==='hash')s.hash('#destination');if(mode==='media'){s.media.matches=true;s.listeners.get('media')?.();}
 expect(a.cancel).toHaveBeenCalled();stop();
});
it('is idempotent, disposes listeners and permits explicit reinitialization',()=>{
 const s=scene();const stop=initMotion(s.root);expect(initMotion(s.root)).toBe(stop);stop();stop();
 expect(s.root.removeEventListener).toHaveBeenCalled();expect(s.win.removeEventListener).toHaveBeenCalled();expect(initMotion(s.root)).not.toBe(stop);
});
it('reads custom tokens, preserves existing translation, and ignores nested targets',()=>{
 const s=scene(2);s.values['--motion-duration']='950ms';s.values['--motion-distance']='32px';s.values['--motion-stagger']='120ms';
 (s.targets[0] as any).translation='4px';s.targets[1].parentElement={closest:()=>s.targets[0]};
 const stop=initMotion(s.root);s.fire(...s.targets);const [frames,options]=s.targets[0].animate.mock.calls[0] as any;
 expect(options.duration).toBe(950);expect(frames[0]).toEqual({opacity:0});expect(s.targets[1].animate).not.toHaveBeenCalled();stop();
});
it.each(['observer','animate','style','rejection'])('fails open for %s errors',async mode=>{
 const s=scene();if(mode==='observer')(s.win as any).IntersectionObserver=class{constructor(){throw Error('unsupported')}};
 if(mode==='style')s.win.getComputedStyle.mockImplementation(()=>{throw Error('style')});
 if(mode==='animate')s.targets[0].animate.mockImplementation(()=>{throw Error('animate')});
 if(mode==='rejection')s.targets[0].animate.mockImplementation(()=>({cancel:()=>{},finished:Promise.reject(Error('cancelled'))}) as any);
 let stop=()=>{};expect(()=>{stop=initMotion(s.root);s.fire(...s.targets);s.hash('#%zz');stop();stop();}).not.toThrow();await Promise.resolve();
});
