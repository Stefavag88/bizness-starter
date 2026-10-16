import {it,expect} from 'vitest';
import {SECTION_TYPES} from '../packages/content/schemas.mjs';
import {sectionRegistry,rendererKey} from '../apps/site/src/templates/section-registry';
it('has exactly one renderer contract for each registered section',()=>{
 expect(Object.keys(sectionRegistry).sort()).toEqual([...SECTION_TYPES].sort());
 for(const type of SECTION_TYPES)expect(rendererKey(type,'default')).toBe(type);
});
it('rejects unregistered types and unsupported variants',()=>{
 expect(()=>rendererKey('hero','split')).toThrow();expect(()=>rendererKey('made-up','default')).toThrow();
});
