import {it,expect} from 'vitest';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mediaRuntime} from '../e2e/helpers/media-optimization-runtime';
it('confirms close of only its actual owned long-lived child before admitting regeneration',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'media-owned-runtime-'));const runtime=mediaRuntime(directory,'proof',['-e',"console.log('owned runtime');setInterval(()=>{},1000)"]);
 expect(runtime.pid).toBeGreaterThan(0);expect(runtime.closed()).toBe(false);await runtime.stop();expect(runtime.closed()).toBe(true);const proof=JSON.parse(readFileSync(join(directory,'runtime-proof.json'),'utf8'));expect(proof.shutdownConfirmed).toBe(true);expect(proof.pid).toBe(runtime.pid);expect(proof.ended).toBeTruthy();await runtime.stop();
});
