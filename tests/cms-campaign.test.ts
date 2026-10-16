import { it,expect } from 'vitest';
import { fixture,project,editorial } from './fixtures/content/factory';
import { readContent } from '../packages/content/read.mjs';
import { buildCollections } from '../tina/collections';
import { validateNativeSave } from '../tina/validation';
const campaign={contentId:'weekly-note',subject:'A useful update',intro:'A short introduction.',interest:'updates'};
const enabled={...project,profile:'newsletter' as const,interests:[{id:'updates',label:'Updates'}]};
it('exposes draft campaign copy only to newsletter/nurture profiles',()=>{
 expect(buildCollections(project).map(c=>c.name)).not.toContain('campaign');
 for(const profile of ['newsletter','nurture'] as const)expect(buildCollections({...enabled,profile}).map(c=>c.name)).toContain('campaign');
});
it('loads and guards campaign copy against CRLF, unsafe IDs, missing interests and unpublished articles',()=>{
 const f=fixture();f.write('campaigns/note.json',campaign);
 expect((readContent(f.root,enabled) as any).campaigns).toHaveLength(1);
 expect((readContent(f.root,project) as any).campaigns).toEqual([]);
 for(const patch of [{subject:'x\r\nBcc: bad'},{subject:'x'.repeat(151)},{intro:'x'.repeat(2001)},{articleId:'Bad ID'},{interest:'missing'},{articleId:'missing'}]){
  f.write('campaigns/note.json',{...campaign,...patch});expect(()=>readContent(f.root,enabled)).toThrow();
 }
 f.write('articles/article.json',{...editorial('article','article'),status:'draft'});f.write('campaigns/note.json',{...campaign,articleId:'article'});expect(()=>readContent(f.root,enabled)).toThrow();
 expect(()=>validateNativeSave({...campaign,articleId:null},'campaign',enabled)).not.toThrow();
});
