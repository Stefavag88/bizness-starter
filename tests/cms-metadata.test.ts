import { it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseProject } from '../packages/config/project.mjs';
import { nativeProjection } from '../tina/validation';
const project=parseProject(JSON.parse(readFileSync('project.json','utf8')));
it('removes only recognized native collection metadata on a detached projection',()=>{
 const values={_collection:'offering',_template:'offering',title:'Example'};
 expect(nativeProjection(values,project)).toEqual({title:'Example'});expect(values._template).toBe('offering');
 expect(nativeProjection({_collection:'page',_template:'home'},project)).toEqual({_template:'home'});
 expect(nativeProjection({_collection:'offering',_template:'alien'},project)).toHaveProperty('_template','alien');
});
