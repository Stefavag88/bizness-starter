import {it,expect,vi} from 'vitest';
// Minimal DOM-independent form surface; browser acceptance separately exercises the real DOM/script loader.
function fixture(mode='turnstile',hostname='client.test'){
 const element={} as HTMLElement;const form={dataset:{protectionMode:mode,protectionKey:'public-key',protectionAction:'contact',locale:'en'},querySelector:()=>element} as unknown as HTMLFormElement;
 let options:any;const api={render:vi.fn((_element:any,value:any)=>{options=value;return 'widget-1';}),execute:vi.fn(),reset:vi.fn(),remove:vi.fn()};
 return {form,api,hostname,load:vi.fn(async()=>api),options:()=>options};
}
it('uses local simulation only on loopback and never loads a provider there',async()=>{
 const {createFormProtection}=await import('../apps/site/src/scripts/form-protection');const f=fixture('local','localhost'),controller=createFormProtection(f.form,{load:f.load,hostname:f.hostname});expect(await controller.token()).toBe('local-preview');expect(f.load).not.toHaveBeenCalled();const remote=fixture('local');await expect(createFormProtection(remote.form,{load:remote.load,hostname:remote.hostname}).token()).rejects.toThrow();expect(remote.load).not.toHaveBeenCalled();
});
it('executes a fresh per-attempt challenge and resets after expiry or retry',async()=>{
 const {createFormProtection}=await import('../apps/site/src/scripts/form-protection');const f=fixture(),controller=createFormProtection(f.form,{load:f.load,hostname:f.hostname});
 const first=controller.token();await vi.waitFor(()=>expect(f.api.execute).toHaveBeenCalledTimes(1));f.options().callback('token-1');expect(await first).toBe('token-1');controller.reset();
 const second=controller.token();const rejected=expect(second).rejects.toThrow();await vi.waitFor(()=>expect(f.api.execute).toHaveBeenCalledTimes(2));f.options()['expired-callback']();await rejected;
 const retry=controller.token();await vi.waitFor(()=>expect(f.api.execute).toHaveBeenCalledTimes(3));f.options().callback('token-3');expect(await retry).toBe('token-3');controller.destroy();expect(f.api.remove).toHaveBeenCalledWith('widget-1');
});
it('does not leak a widget or submit after destruction while loading',async()=>{
 const {createFormProtection}=await import('../apps/site/src/scripts/form-protection');const f=fixture();let resolve!:(value:any)=>void;const load=()=>new Promise<any>(done=>resolve=done),controller=createFormProtection(f.form,{load,hostname:f.hostname});const pending=controller.token();const rejected=expect(pending).rejects.toThrow();controller.destroy();resolve(f.api);await rejected;expect(f.api.render).not.toHaveBeenCalled();
});

it('loads one provider script per document and permits a user retry after load failure',async()=>{
 const {loadTurnstile}=await import('../apps/site/src/scripts/form-protection');const scripts:any[]=[];const win:any={};const doc={defaultView:win,createElement:()=>({remove:vi.fn()}),head:{appendChild:(script:any)=>scripts.push(script)}} as unknown as Document;
 const first=loadTurnstile(doc),same=loadTurnstile(doc);expect(first).toBe(same);expect(scripts).toHaveLength(1);expect(scripts[0].src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');const failed=expect(first).rejects.toThrow();scripts[0].onerror();await failed;expect(scripts[0].remove).toHaveBeenCalled();
 const second=loadTurnstile(doc);expect(scripts).toHaveLength(2);win.turnstile=fixture().api;scripts[1].onload();expect(await second).toBe(win.turnstile);
});
it('ignores callbacks from an earlier challenge while a fresh attempt is pending',async()=>{
 const {createFormProtection}=await import('../apps/site/src/scripts/form-protection');const f=fixture(),controller=createFormProtection(f.form,{load:f.load,hostname:f.hostname});const first=controller.token();const rejected=expect(first).rejects.toThrow();await vi.waitFor(()=>expect(f.api.execute).toHaveBeenCalledTimes(1));const old=f.options();old['expired-callback']();await rejected;
 const next=controller.token();await vi.waitFor(()=>expect(f.api.execute).toHaveBeenCalledTimes(2));old.callback('stale-token');f.options().callback('fresh-token');expect(await next).toBe('fresh-token');controller.destroy();
});
