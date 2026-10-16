import { it,expect } from 'vitest';
import { fixture,project,editorial } from './fixtures/content/factory';
import { readContent } from '../packages/content/read.mjs';
it('campaign article eligibility includes shared relationship publication',()=>{
 const f=fixture();const p={...project,profile:'newsletter' as const,interests:[{id:'updates',label:'Updates'}]};
 f.write('people/person.json',{...editorial('person','person'),status:'draft'});
 f.write('articles/article.json',{...editorial('article','article'),authorId:'person'});
 f.write('campaigns/note.json',{contentId:'note',subject:'A note',intro:'A brief note.',articleId:'article',interest:'updates'});
 expect(()=>readContent(f.root,p)).toThrow(/unavailable|published/i);
});
