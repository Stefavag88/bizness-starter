import {ownedTempRoots} from './helpers/owned-temp-roots';
import {it,expect,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {mediaRuntime} from '../e2e/helpers/media-optimization-runtime';
const tempRoots=ownedTempRoots('media-owned-runtime-');
afterEach(({task})=>{tempRoots.cleanup(task.result?.state==='fail');});
it('confirms close of only its actual owned long-lived child before admitting regeneration',async()=>{
 const directory=tempRoots.create();const runtime=mediaRuntime(directory,'proof',['-e',"console.log('owned runtime');setInterval(()=>{},1000)"]);
 try {
  expect(runtime.pid).toBeGreaterThan(0);
  expect(runtime.closed()).toBe(false);
  await runtime.stop();
  expect(runtime.closed()).toBe(true);
  const proof=JSON.parse(readFileSync(join(directory,'runtime-proof.json'),'utf8'));
  expect(proof.shutdownConfirmed).toBe(true);
  expect(proof.pid).toBe(runtime.pid);
  expect(proof.ended).toBeTruthy();
  await runtime.stop();
 } finally {await runtime.stop();}

});
