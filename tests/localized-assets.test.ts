import {it,expect} from 'vitest';
import {localizedAsset} from '../worker/assets';
it('returns localized content with 404 status and strips conditional headers',async()=>{
 const seen:Request[]=[];
 const response=await localizedAsset(new Request('https://example.com/el/missing',{headers:{'If-None-Match':'old'}}),async request=>{seen.push(request);return new Response(new URL(request.url).pathname==='/el/404'?'Η σελίδα δεν βρέθηκε':'Default 404',{status:seen.length===1?404:200,headers:{'Content-Type':'text/html'}});},['en','el']);
 expect(response.status).toBe(404);expect(await response.text()).toContain('Η σελίδα');expect(seen[1].headers.has('If-None-Match')).toBe(false);
});
