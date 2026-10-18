import {it,expect} from 'vitest';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import EditorialDetail from '../src/templates/EditorialDetail.astro';
import {createDomainRendererRegistry,domainRenderer,assertDomainRendererCoverage} from '../src/templates/domains';
import {createDomainRegistry} from '../../../packages/content/domain-registry.mjs';
import {lessonDomain} from '../../../tests/fixtures/content/domain';
import {project} from '../../../tests/fixtures/content/factory';
it('renders extracted editorial semantics, safe prose, one H1, localized links and dates',async()=>{
 const container=await AstroContainer.create();const html=await container.renderToString(EditorialDetail,{props:{record:{title:'Example',role:'Guide',publishAt:'2026-01-01T00:00:00Z',description:'A **useful** summary.',body:'## Details\n\n[Contact](/contact)\n\n<script>bad</script>'},content:{locale:'el'}}});
 expect(html.match(/<h1>/g)).toHaveLength(1);expect(html).toContain('<h1>Example</h1>');expect(html).toContain('<p>Guide</p>');expect(html).toContain('<time datetime="2026-01-01T00:00:00Z">');expect(html).toContain('<strong>useful</strong>');expect(html).toContain('href="/el/contact"');expect(html).not.toContain('<script>');expect(html).toContain('&lt;script&gt;');
});
it('rejects duplicate renderer keys and missing active coverage, resolving registered handlers',()=>{
 const Renderer=EditorialDetail;const registry=createDomainRendererRegistry([{key:'lessons',renderer:Renderer}]);
 expect(domainRenderer('lessons',registry)).toBe(Renderer);expect(()=>createDomainRendererRegistry([{key:'lessons',renderer:Renderer},{key:'lessons',renderer:Renderer}])).toThrow(/Duplicate/);
 expect(()=>assertDomainRendererCoverage(project,createDomainRegistry([lessonDomain()]),createDomainRendererRegistry([]))).toThrow(/lessons.*renderer|renderer.*lessons/i);
 expect(()=>assertDomainRendererCoverage(project,createDomainRegistry([lessonDomain(false)]),createDomainRendererRegistry([]))).not.toThrow();
});
