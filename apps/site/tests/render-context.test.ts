import {it,expect} from 'vitest';
import {fileURLToPath} from 'node:url';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import ContactForm from '../src/templates/ContactForm.astro';
import Layout from '../src/layouts/Layout.astro';
import {createPresetBundle,projectPresetBundle} from '../../../packages/presets/bundle.mjs';
import {createRenderContext} from '../src/lib/render-context';
const bundle=createPresetBundle('trades',{name:'preview-test',languages:['en','el'],defaultLanguage:'en'});
const {contents,routes}=projectPresetBundle(bundle,{assetRoot:fileURLToPath(new URL('../../../',import.meta.url))});
const content=contents.find(c=>c.locale==='el')!;
const context=createRenderContext(bundle.project,routes,{previewBase:'/templates/trades/trades'});
it('renders disabled preview fields without a live form action or business destinations',async()=>{
 const c=await AstroContainer.create();const html=await c.renderToString(ContactForm,{props:{content,context}});
 expect(html).toContain('id="preview-contact-form"');expect(html).not.toContain('action="/api/contact"');
 expect(html).not.toContain('id="contact-form"');expect(html).toMatch(/<button disabled/);
 for(const tag of html.match(/<(?:input|textarea|select)\b[^>]*>/g)??[])expect(tag).toContain('disabled');
 expect(html).toContain('href="/templates/trades/trades/el/privacy"');expect(html).not.toMatch(/href="(?:tel:|mailto:|https:\/\/wa\.me)/);
});
it('keeps the ordinary public form enabled and targeting its existing endpoint',async()=>{
 const c=await AstroContainer.create();const html=await c.renderToString(ContactForm,{props:{content}});
 expect(html).toContain('id="contact-form"');expect(html).toContain('action="/api/contact"');expect(html).not.toMatch(/<button disabled/);
});
it('isolates preview metadata, navigation and visitor state',async()=>{
 const c=await AstroContainer.create();const page=content.pages.find(p=>p._template==='contact')!;
 const html=await c.renderToString(Layout,{props:{content,context,title:'Preview',description:'Sample',path:page.path,alternates:page.alternates}});
 expect(html).toContain('name="robots" content="noindex"');expect(html).not.toContain('rel="canonical"');expect(html).not.toContain('application/rss+xml');
 expect(html).not.toContain('data-visitor-experience');expect(html).toContain('href="/templates/trades/trades/en/contact"');expect(html).toContain('href="/templates"');
});

it('disables hosted contact without a key and emits real protection metadata with a key',async()=>{
 const c=await AstroContainer.create(),base={...bundle.project,environment:'production' as const};
 const unavailable=await c.renderToString(ContactForm,{props:{content,context:createRenderContext(base,routes)}});expect(unavailable).toContain('data-protection-mode="unavailable"');expect(unavailable).toContain('δεν είναι διαθέσιμη προσωρινά');expect(unavailable).toMatch(/<button disabled/);
 const protectedHtml=await c.renderToString(ContactForm,{props:{content,context:createRenderContext({...base,infrastructure:{...base.infrastructure,turnstileSiteKey:'public-key'}},routes)}});expect(protectedHtml).toContain('data-protection-action="contact"');expect(protectedHtml).toContain('data-protection-mode="turnstile"');expect(protectedHtml).not.toContain('local-preview');
});
