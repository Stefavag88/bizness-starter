import {it,expect} from 'vitest';
import {resolveContentLink} from '../apps/site/src/lib/links';
const routes=[{path:'/en/contact',alternates:[{locale:'en',path:'/en/contact'},{locale:'el',path:'/el/contact'}]}];
it('resolves canonical, unprefixed and same-origin rich/CTA links to the current locale',()=>{
 for(const href of ['/en/contact','/contact','https://example.com/en/contact'])expect(resolveContentLink(href,'el',routes,'https://example.com')).toBe('/el/contact');
 expect(resolveContentLink('/?x=1#top','el',routes,'https://example.com')).toBe('/el?x=1#top');
 expect(resolveContentLink('https://other.example/contact','el',routes,'https://example.com')).toBe('https://other.example/contact');
});
