import {it,expect} from 'vitest';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import Layout from '../src/layouts/Layout.astro';
import {contents} from '../src/lib/content';
it.each(['en','el'])('renders %s footer Markdown as safe localized blocks outside identity paragraphs',async locale=>{
 const container=await AstroContainer.create();const content=structuredClone(contents.find(c=>c.locale===locale)!);
 content.settings.legal.notice=locale==='en'?'**Sample notice**\n\n- First item\n- [Notice privacy](/privacy)':'**Ενδεικτική ειδοποίηση**\n\n- Πρώτο στοιχείο\n- [Πολιτική ειδοποίησης](/privacy)';
 content.settings.legal.notice+='\n\n<script>alert(1)</script>';
 const html=await container.renderToString(Layout,{props:{content,title:'Footer test',description:'Fixture',path:'/'+locale,alternates:[]}});
 const footer=html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)![1];
 expect(footer).toContain(locale==='en'?'<strong>Sample notice</strong>':'<strong>Ενδεικτική ειδοποίηση</strong>');
 expect(footer).toMatch(/<ul>[\s\S]*<li>/);expect(footer).toContain('<a href="/'+locale+'/privacy">'+(locale==='en'?'Notice privacy':'Πολιτική ειδοποίησης')+'</a>');
 expect(footer).not.toContain('<script>');expect(footer).toContain('&lt;script&gt;');
 expect(footer).not.toContain('**');expect(footer).not.toMatch(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*<(?:div|ul|p)\b/);
 expect(footer).not.toMatch(/<p\b[^>]*>[^<]*<p\b/);
});
