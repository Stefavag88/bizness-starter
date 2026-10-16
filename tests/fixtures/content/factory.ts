import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';
import { parseProject } from '../../../packages/config/project.mjs';
export const project = parseProject({name:'test',starterVersion:'2.0.0-dev',schemaVersion:2,locale:'en',languages:[{code:'en',label:'English'},{code:'el',label:'Greek'}],siteUrl:'https://example.com'});
export const hero = () => ({id:'intro',_template:'hero',variant:'default',appearance:{surface:'default'}});
export const normalizedPage = (id='home',template='home',slug='') => ({
 contentId:id,_template:template,slug,status:'published',
 meta:{title:id,seoDescription:''},sections:[hero(),{id:'details',_template:'rich-text',variant:'default',enabled:true,appearance:{surface:'muted'}}],
 copy:{sections:{intro:{title:'Hello',description:'A **clear** introduction.'},details:{title:'More',body:'A useful paragraph.'}}},
 translations:{el:{status:'published',meta:{title:'Σελίδα'},copy:{sections:{intro:{title:'Γεια',description:'Μια εισαγωγή.'},details:{title:'Περισσότερα',body:'Μια παράγραφος.'}}}}}
});
export const editorial = (kind='offering',id='sample') => ({
 contentId:id,slug:id,status:'published',title:'A sample',description:'A **useful** summary.',body:'## Details\n\nUseful information.',
 ...(kind==='person'?{role:'Guide'}:{}),
 ...(kind==='article'?{publishAt:'2025-01-01T09:00:00Z'}:{}),
 translations:{el:{status:'published',title:'Δείγμα',description:'Μια περίληψη.',body:'## Λεπτομέρειες',...(kind==='person'?{role:'Οδηγός'}:{}),...(kind==='article'?{publishAt:'2025-01-02T09:00:00Z'}:{})}}
});
export const normalizedSettings = () => ({
 brand:{name:'Example Studio',tagline:'Space for useful work'},legal:{businessName:'Example Studio',privacyVersion:'sample-v1',notice:'Example content for review.'},
 contact:{email:'hello@example.com',phone:'',address:''},
 navigation:[{label:'Home',pageId:'home'},{label:'Articles',pageId:'insights'}],
 translations:{el:{brand:{tagline:'Χώρος για χρήσιμη εργασία'},legal:{notice:'Ενδεικτικό περιεχόμενο.'},contact:{address:''},navigation:{home:'Αρχική',insights:'Άρθρα'}}}
});
const dirs:string[]=[];
afterEach(()=>{for(const dir of dirs.splice(0))rmSync(dir,{recursive:true,force:true});});
export function fixture() {
 const root=mkdtempSync(join(tmpdir(),'starter-content-'));dirs.push(root);
 const write=(path:string,value:unknown)=>{const file=join(root,'content',path);mkdirSync(join(file,'..'),{recursive:true});writeFileSync(file,JSON.stringify(value));};
 write('settings/site.json',settingsDocument());
 for(const [id,template,slug] of [['home','home',''],['about','about','about'],['contact','contact','contact'],['privacy','standard','privacy'],['services','offerings','services'],['insights','insights','insights']]) write('pages/'+id+'.json',pageDocument(id,template,slug));
 write('offerings/sample.json',editorial());
 write('people/person.json',editorial('person','person'));
 write('articles/article.json',editorial('article','article'));
 return {root,write};
}

// Domain helpers and serialized helpers are deliberately distinct.
export function pageDocument(id='home',template='home',slug='') {
 const value:any=normalizedPage(id,template,slug);
 for(const copy of [value.copy,...Object.values(value.translations).map((t:any)=>t.copy)])copy.sections=Object.entries(copy.sections).map(([id,copy]:any)=>({id,_template:value.sections.find((s:any)=>s.id===id)._template,...copy}));
 return value;
}
export function settingsDocument() {
 const value:any=normalizedSettings();
 for(const translation of Object.values(value.translations) as any[])translation.navigation=Object.entries(translation.navigation).map(([pageId,label])=>({pageId,label}));
 return value;
}
