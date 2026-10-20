import {it,expect} from 'vitest';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import {sectionRenderer} from '../src/templates/sections';
import Layout from '../src/layouts/Layout.astro';
import {contents} from '../src/lib/content';
it('keeps primary hero visible and enhances non-primary copy',async()=>{
 const container=await AstroContainer.create();const Hero=sectionRenderer('hero','default');
 const props={section:{id:'intro',_template:'hero',variant:'default',appearance:{surface:'default'},copy:{title:'Hello',description:'Text'}},locale:'en'};
 expect(await container.renderToString(Hero,{props:{...props,primary:true}})).not.toContain('data-motion-reveal');
 expect(await container.renderToString(Hero,{props:{...props,primary:false}})).toContain('data-motion-reveal');
});
it.each(['offering-list','people-list','article-list'])('marks %s copy and cards as separate targets',async type=>{
 const container=await AstroContainer.create();const Renderer=sectionRenderer(type as any,'default');const content=contents[0];
 const html=await container.renderToString(Renderer,{props:{section:{id:'list',_template:type,variant:'default',appearance:{surface:'default'},copy:{title:'List',description:'Description'}},content,locale:'en'}});
 expect(html).toContain('data-motion-group');expect(html).toContain('data-motion-reveal');
 expect(html).not.toMatch(/data-motion-reveal[^>]*>[^]*data-motion-reveal[^>]*>[^]*<\/h2>/);
});
it('keeps shell navigation, footer, skip link and H1 outside entrance targets',async()=>{
 const container=await AstroContainer.create();const html=await container.renderToString(Layout,{props:{content:contents[0],title:'Test',description:'Fixture',path:'/en',alternates:[]}});
 expect(html).toContain('data-motion=');
 for(const tag of ['header','footer'])expect(html.match(new RegExp(`<${tag}[^]*?</${tag}>`))![0]).not.toContain('data-motion-reveal');
});
