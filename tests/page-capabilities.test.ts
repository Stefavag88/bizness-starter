import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizePageDocument } from '../packages/content/documents.mjs';
import { assertPageCapabilities, assertExistingPageIdentity } from '../packages/content/composition.mjs';
const page=(name='about')=>normalizePageDocument(JSON.parse(readFileSync(`content/pages/${name}.json`,'utf8')));
it('rejects duplicate, hidden or moved heroes independent of controls',()=>{
 for(const change of [(p:any)=>p.sections.push({...p.sections[0],id:'other'}),(p:any)=>p.sections[0].enabled=false,(p:any)=>p.sections.reverse(),(p:any)=>p.sections.shift()]){const p=page();change(p);expect(()=>assertPageCapabilities(p)).toThrow();}
});
it('protects the known required privacy region from removal, hiding and retyping',()=>{
 for(const change of [(p:any)=>p.sections.pop(),(p:any)=>p.sections[1].enabled=false,(p:any)=>p.sections[1]._template='cta']){const p=page('privacy');change(p);expect(()=>assertPageCapabilities(p)).toThrow();}
});
it('protects existing identity and retained section types while permitting replacement by genuinely new IDs',()=>{
 const original=page();
 for(const change of [(p:any)=>p.contentId='other',(p:any)=>p.slug='other',(p:any)=>p._template='standard',(p:any)=>p.sections[1]._template='cta',(p:any)=>p.sections[0].id='other_hero']){const p=structuredClone(original);change(p);expect(()=>assertExistingPageIdentity(p,original)).toThrow();}
 const next=structuredClone(original);next.sections[1]={...next.sections[1],id:'new_id',_template:'cta'};expect(()=>assertExistingPageIdentity(next,original)).not.toThrow();
});
it('allows a new Standard draft with one hero and no translations; special creation fails without current context',()=>{
 const fresh=page();fresh._template='standard';fresh.contentId='new_page';fresh.slug='new-page';fresh.status='draft';fresh.translations={};fresh.sections=fresh.sections.slice(0,1);fresh.copy.sections={intro:fresh.copy.sections.intro};
 expect(()=>assertPageCapabilities(fresh)).not.toThrow();
 for(const template of ['home','contact','offerings','insights','about']){expect(()=>assertExistingPageIdentity({...fresh,_template:template} as any,undefined as any)).toThrow();}
});
