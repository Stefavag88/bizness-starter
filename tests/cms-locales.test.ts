import { it,expect } from 'vitest';
import { fixture,project,editorial } from './fixtures/content/factory';
import { readContent } from '../packages/content/read.mjs';
import { readdirSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
it('loads encoded regional translations losslessly and rejects duplicate aliases',()=>{
 const f=fixture();const p={...project,languages:[...project.languages,{code:'pt-BR',label:'Portuguese'}]};
 for(const folder of ['settings','pages','offerings','people','articles'])for(const file of readdirSync(join(f.root,'content',folder))){const value=JSON.parse(readFileSync(join(f.root,'content',folder,file),'utf8'));value.translations.pt_BR=structuredClone(value.translations.el);f.write(folder+'/'+file,value);}
 const source=readContent(f.root,p);expect(source.offerings[0].translations['pt-BR']).toEqual(source.offerings[0].translations.el);expect(source.offerings[0].translations).not.toHaveProperty('pt_BR');
 const value:any={...editorial(),translations:{pt_BR:editorial().translations.el,'pt-BR':editorial().translations.el}};f.write('offerings/sample.json',value);expect(()=>readContent(f.root,p)).toThrow(/duplicate|alias/i);
});
