import { it,expect } from 'vitest';
import { buildCollections } from '../tina/collections';
import { project } from './fixtures/content/factory';
it('excludes dormant article index files from native page indexing when articles are disabled',()=>{
 const page=buildCollections({...project,articles:false}).find(c=>c.name==='page')!;
 expect(page.match?.exclude).toContain('insights');
 expect(page.templates?.map(t=>typeof t==='string'?t:t.name)).not.toContain('insights');
});
