import {it,expect} from 'vitest';
import {settings} from '../tina/collections/settings';
import {nativeProjection} from '../tina/validation';
import {nativeRichText} from '../tina/fields/rich-text';
import {enabledProject,enabledSettings} from './fixtures/newsletter';
import {project} from './fixtures/content/factory';
it('declares hidden dormant native fields without deleting schema',()=>{for(const p of [project,enabledProject()]){const field:any=settings(p).fields?.find(f=>f.name==='newsletterPrompt');expect(field?.type).toBe('object');expect(field.fields.find((f:any)=>f.name==='body').type).toBe('rich-text');expect(field.fields.find((f:any)=>f.name==='footerPrompt').overrides.toolbar).toEqual(['bold','italic','link']);if(p===project)expect(field.ui.component).toBe('hidden');}});
it('projects nested rich ASTs without mutating submission',()=>{const values:any=enabledSettings();for(const record of [values.newsletterPrompt,values.translations.el.newsletterPrompt]){record.body=nativeRichText('Body');record.successBody=nativeRichText('Confirm');record.footerPrompt=nativeRichText('Prompt');}const original=JSON.stringify(values);const result=nativeProjection(values,enabledProject(),'settings');expect(result.newsletterPrompt.body.trim()).toBe('Body');expect(result.translations.el.newsletterPrompt.footerPrompt.trim()).toBe('Prompt');expect(JSON.stringify(values)).toBe(original);});
it('rejects noninline AST nodes in footer prompts',()=>{const values:any=enabledSettings();values.newsletterPrompt.footerPrompt={type:'root',children:[{type:'h2',children:[{type:'text',text:'No'}]}]};expect(()=>nativeProjection(values,enabledProject(),'settings')).toThrow(/Unsupported/);});
