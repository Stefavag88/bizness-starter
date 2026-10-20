import {it,expect} from 'vitest';
import {createRenderContext} from '../apps/site/src/lib/render-context';
import {createPresetBundle,projectPresetBundle} from '../packages/presets/bundle.mjs';
const bundle=createPresetBundle('trades',{name:'client',languages:['en','el'],defaultLanguage:'en',theme:'trades'});
const {routes}=projectPresetBundle(bundle,{assetRoot:process.cwd()});
it('preserves canonical rendering and safely resolves token-level rich links',()=>{
 const context=createRenderContext(bundle.project,routes);
 expect(context.link('/contact','el')).toBe('/el/contact');
 expect(context.rich('[Contact](/contact?x=1&y=2#form)','el')).toContain('href="/el/contact?x=1&amp;y=2#form"');
 expect(context.rich('<script>bad()</script>','en')).not.toContain('<script>');
});
it('scopes internal, same-origin and alternate links to the selected preview',()=>{
 const context=createRenderContext(bundle.project,routes,{previewBase:'/templates/trades/trades'});
 expect(context.link('/contact','el')).toBe('/templates/trades/trades/el/contact');
 expect(context.link('/en/contact','el')).toBe('/templates/trades/trades/el/contact');
 expect(context.link('https://example.com/en/contact?x=1#form','el')).toBe('/templates/trades/trades/el/contact?x=1#form');
 expect(context.link('https://outside.example/a','en')).toBe('https://outside.example/a');expect(context.link('#fragment','en')).toBe('#fragment');
 expect(context.rich('[Contact](/contact)','en')).toContain('href="/templates/trades/trades/en/contact"');
 expect(context.rich('[Contact](/contact)','en',true,false)).not.toContain('<a');
});
it.each(['//evil.test','/templates/../evil','/templates/trades/trades?escape=1'])('rejects invalid preview prefix %s',previewBase=>expect(()=>createRenderContext(bundle.project,routes,{previewBase})).toThrow());
