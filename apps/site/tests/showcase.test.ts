import {beforeEach,afterEach} from 'vitest';
import {fileURLToPath} from 'node:url';
import {beginMediaSession,endMediaSession} from '../../../packages/media/session.mjs';
const mediaRoot=fileURLToPath(new URL('../../../',import.meta.url));
beforeEach(()=>{beginMediaSession({root:mediaRoot,policy:{enabled:true,widths:[320,640,960,1440,1920],quality:80},mode:'dev'});});
afterEach(async()=>{await endMediaSession(mediaRoot);});
import {it,expect} from 'vitest';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import Field from '../src/components/ui/Field.astro';
import Showcase from '../src/components/showcase/Showcase.astro';
import {contents} from '../src/lib/content';
it('preserves default Field markup and renders explicit demo error/help/disabled state',async()=>{
 const container=await AstroContainer.create();
 const basic=await container.renderToString(Field,{props:{name:'ordinary',label:'Ordinary'}});
 expect(basic).toContain('aria-describedby="ordinary-error"');expect(basic).not.toContain('aria-invalid');expect(basic).not.toContain(' disabled');
 const demo=await container.renderToString(Field,{props:{name:'showcase-en-control-error',label:'Example',help:'Help example',error:'Error example',disabled:true}});
 expect(demo).toContain('aria-invalid="true"');expect(demo).toContain('showcase-en-control-error-help');expect(demo).toContain('Help example');expect(demo).toContain('Error example');expect(demo).toContain(' disabled');
});
it('renders real bilingual sample groups with unique IDs, one H1 and disabled toolbar',async()=>{
 const container=await AstroContainer.create();const html=await container.renderToString(Showcase,{props:{contents}});
 expect(html.match(/<h1\b/g)).toHaveLength(1);
 const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);expect(new Set(ids).size).toBe(ids.length);
 expect(html).toContain('data-sample-language="en"');expect(html).toContain('data-sample-language="el" hidden');
 expect(html).toContain('id="showcase-language" disabled');expect(html).toContain('Synthetic ArticleList');expect(html).toContain('Συνθετικό δείγμα ArticleList');
 expect(html.match(/class="faq-items"/g)).toHaveLength(4);expect(html.match(/class="steps steps-cards"/g)).toHaveLength(2);expect(html.match(/class="[^"]*media-text-reversed[^"]*"/g)).toHaveLength(2);expect(html.match(/class="gallery gallery-featured"/g)).toHaveLength(2);expect(html.match(/<img\b/g)).toHaveLength(12);
 expect(html).not.toContain('<form');expect(html).not.toContain('style=');
});
it('shows a notice without preview controls when no configured sample language is supported',async()=>{
 const container=await AstroContainer.create();const unsupported=structuredClone(contents[0]);unsupported.locale='fr';
 const html=await container.renderToString(Showcase,{props:{contents:[unsupported]}});
 expect(html).toContain('No supported sample languages are configured');expect(html).not.toContain('<select');expect(html).not.toContain('id="showcase-reset"');expect(html).not.toContain('data-sample-language=');
});
