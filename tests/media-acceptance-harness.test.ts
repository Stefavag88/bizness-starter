import {ownedTempRoots} from './helpers/owned-temp-roots';
import {it,expect,vi,afterEach} from 'vitest';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {staticOwner} from '../e2e/helpers/media-optimization-acceptance';
import {createMediaOptimizationFixture} from '../e2e/helpers/media-optimization-fixture';
import {cleanupMediaOptimization} from '../e2e/helpers/media-optimization-cleanup';
import {mediaRuntime,cleanupMediaBrowser} from '../e2e/helpers/media-optimization-runtime';
import {canonicalSnapshot,assertCanonicalSnapshot} from '../scripts/composition-c-snapshot.mjs';
function root(){const path=tempRoots.create();for(const p of ['content/pages','content/rooms','apps/site/public/uploads'])mkdirSync(join(path,p),{recursive:true});writeFileSync(join(path,'project.json'),readFileSync('project.json'));writeFileSync(join(path,'content/pages/rooms.json'),readFileSync('content/pages/rooms.json'));return path;}
const tempRoots=ownedTempRoots('media-harness-fault-');
afterEach(({task})=>{tempRoots.cleanup(task.result?.state==='fail');});
it('restores partially acquired static setup when setup rejects before returning to browser work',async()=>{
 const path=root(),before=canonicalSnapshot(path);const owner=staticOwner({environment:'local',theme:'neutral',density:'comfortable',rooms:1,profile:'enquiries',articles:true,enabled:true},{root:path});
 vi.spyOn(owner.fixture,'createDocument').mockImplementationOnce(()=>{throw Error('setup failed after binary acquisition');});
 expect(()=>owner.setup()).toThrow(/setup failed/);expect(existsSync(join(path,'apps/site/public/uploads/media-acceptance-large-photo.jpg'))).toBe(true);
 await owner.fixture.cleanup();expect(canonicalSnapshot(path)).toEqual(before);expect(owner.run.finish().unchanged).toBe(true);
});
it('rejecting browser close still confirms exact runtime shutdown and restores sources while refusing regeneration',async()=>{
 const path=root(),before=canonicalSnapshot(path),f=createMediaOptimizationFixture({root:path,documents:['content/pages/proof.json'],media:[{path:'apps/site/public/uploads/proof.png',documents:['content/pages/proof.json']}]});
 f.createMedia('apps/site/public/uploads/proof.png',Buffer.from('owned'));f.createDocument('content/pages/proof.json',{src:'/uploads/proof.png'});
 const runtime=mediaRuntime(f.directory,'actual-child',['-e','setInterval(()=>{},1000)']);let regenerated=false,ledger:any;
 try {
 await expect(cleanupMediaBrowser({closeBrowser:async()=>{throw Error('browser close rejected');},stops:[{id:'owned-runtime',stop:()=>runtime.stop()}],restores:[{id:'fixture-sources',restore:()=>f.cleanup()}],assertInputs:()=>assertCanonicalSnapshot(before,path),regenerate:[{id:'configure',run:()=>{regenerated=true;}}],record:state=>{ledger=state;}})).rejects.toThrow();
 expect(runtime.closed()).toBe(true);expect(canonicalSnapshot(path)).toEqual(before);expect(ledger.stops.map((r:any)=>r.status)).toEqual(['failed','stopped']);expect(ledger.actions[0].status).toBe('restored');expect(regenerated).toBe(false);expect(ledger.regeneration[0].status).toBe('skipped');
 } finally {await runtime.stop();}

});
