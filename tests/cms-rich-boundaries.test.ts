import { it,expect } from 'vitest';
import { fixture,project,editorial } from './fixtures/content/factory';
import { readContent } from '../packages/content/read.mjs';
import { nativeProjection,validateNativeSave } from '../tina/validation';
it('rejects unsafe or unsupported persisted Markdown at the same validation boundary',()=>{
 const f=fixture();
 for(const body of ['[unsafe](javascript:alert(1))','<script>alert(1)</script>','![image](/asset.png)','# H1','#### H4']){f.write('offerings/sample.json',{...editorial(),body});expect(()=>readContent(f.root,project)).toThrow();expect(()=>validateNativeSave({...editorial(),body},'offering',project)).toThrow();}
});
it('projects section copy with an ID named body without treating its map entry as an AST',()=>{
 const ast={type:'root',children:[{type:'p',children:[{text:'Safe prose'}]}]};
 const value={copy:{sections:[{id:'body',_template:'rich_text',title:'Section',body:ast}]}};
 expect(nativeProjection(value,project).copy.sections[0].body).toEqual(expect.any(String));expect(value.copy.sections[0].body).toBe(ast);
});
