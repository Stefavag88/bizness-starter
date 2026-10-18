import { expect,it } from 'vitest';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readContent } from '../packages/content/read.mjs';
import { createDomainRegistry } from '../packages/content/domain-registry.mjs';
import { createCmsDescriptor } from '../scripts/cms-descriptor.mjs';
import { parseProject } from '../packages/config/project.mjs';
import { fixture,project } from './fixtures/content/factory';
import { lessonDomain } from './fixtures/content/domain';
it('loads a registered active flat collection through its strict schema',()=>{
 const f=fixture();f.write('lessons/one.json',{contentId:'lesson-one',slug:'one',title:'Lesson one'});
 const source=readContent(f.root,project,{registry:createDomainRegistry([lessonDomain()])});
 expect(source.domains.lessons).toEqual([{contentId:'lesson-one',slug:'one',title:'Lesson one'}]);
});
it('does not read malformed disabled collection or declared index bytes, including descriptor discovery',()=>{
 const f=fixture();mkdirSync(join(f.root,'content/lessons/nested'),{recursive:true});
 writeFileSync(join(f.root,'content/lessons/broken.json'),'{broken');
 writeFileSync(join(f.root,'content/pages/lessons.json'),'{broken index');
 const registry=createDomainRegistry([lessonDomain(false)]);
 expect(readContent(f.root,project,{registry}).domains).toEqual({});
 const descriptor=createCmsDescriptor(f.root,project,registry);
 expect(descriptor.domainPageFiles).toEqual(['lessons']);
 expect(readFileSync(join(f.root,'content/pages/lessons.json'),'utf8')).toBe('{broken index');
 writeFileSync(join(f.root,'content/pages/sibling.json'),'{broken sibling');
 expect(()=>readContent(f.root,project,{registry})).toThrow(/sibling\.json/);
 expect(()=>createCmsDescriptor(f.root,project,registry)).toThrow(/sibling\.json/);
});
it.each(['lessons/broken.json','pages/sibling.json'])('still rejects active malformed %s with its filename',path=>{
 const f=fixture();f.write(path,{});writeFileSync(join(f.root,'content',path),'{broken');
 expect(()=>readContent(f.root,project,{registry:createDomainRegistry([lessonDomain()])})).toThrow(path.endsWith('sibling.json')?/sibling\.json/:/broken\.json/);
});
it('rejects nested active domain folders and schema-invalid domain records with their filename',()=>{
 const f=fixture(),registry=createDomainRegistry([lessonDomain()]);
 f.write('lessons/invalid.json',{contentId:'lesson-one',slug:'one',title:7});
 expect(()=>readContent(f.root,project,{registry})).toThrow(/invalid\.json/);
 mkdirSync(join(f.root,'content/lessons/nested'));
 expect(()=>readContent(f.root,project,{registry})).toThrow(/nested.*flat files/);
});
it('keeps legacy disabled insights unread and discovers active insights filenames',()=>{
 const f=fixture();writeFileSync(join(f.root,'content/pages/insights.json'),'{broken index');
 expect(createCmsDescriptor(f.root,{...project,articles:false}).articlePageFiles).toEqual(['insights']);
});
it('emits declaration metadata without secrets or domain instance/item IDs',()=>{
 const f=fixture(),registry=createDomainRegistry([lessonDomain()]);
 f.write('lessons/one.json',{contentId:'private-record-id',slug:'one',title:'Secret record title'});
 const p={...project,infrastructure:{...project.infrastructure,accessAudience:'secret-infrastructure-audience'}};
 const before=JSON.stringify(createCmsDescriptor(f.root,p,registry));
 f.write('lessons/two.json',{contentId:'another-record-id',slug:'two',title:'Second title'});
 expect(JSON.stringify(createCmsDescriptor(f.root,p,registry))).toBe(before);
 expect(before).not.toMatch(/private-record-id|another-record-id|secret-infrastructure-audience|lesson-index|Secret record title/);
});
it('defaults the explicit Rooms module to disabled and rejects unknown module keys',()=>{
 expect(parseProject(project).modules).toEqual({rooms:false});
 expect(()=>parseProject({...project,modules:{unknown:true}})).toThrow();
});
