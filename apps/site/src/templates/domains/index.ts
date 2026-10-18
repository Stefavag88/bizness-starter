import type {AstroComponentFactory} from 'astro/runtime/server/index.js';
import type {ProjectConfig} from '../../../../../packages/config/project.mjs';
import type {DomainRegistry} from '../../../../../packages/content/domain-contracts';
import {domainRegistry,getActiveDomains} from '../../../../../packages/content/domain-registry.mjs';
export interface DomainRendererRegistration {readonly key:string;readonly renderer:AstroComponentFactory}
export interface DomainRendererRegistry {readonly definitions:readonly DomainRendererRegistration[]}
export function createDomainRendererRegistry(definitions:readonly DomainRendererRegistration[]):DomainRendererRegistry {
 const keys=new Set<string>();
 for(const definition of definitions){if(keys.has(definition.key))throw Error('Duplicate domain renderer: '+definition.key);keys.add(definition.key);if(typeof definition.renderer!=='function')throw Error('Invalid renderer for domain '+definition.key);}
 return Object.freeze({definitions:Object.freeze(definitions.map(definition=>Object.freeze({...definition})))});
}
// Server-only static registrations. Every enabled content domain must have coverage.
export const domainRenderers=createDomainRendererRegistry([]);
export function domainRenderer(key:string,registry=domainRenderers):AstroComponentFactory {
 const entry=registry.definitions.find(entry=>entry.key===key);
 if(!entry)throw Error('Domain '+key+' requires a renderer registration in templates/domains/index.ts');
 return entry.renderer;
}
export function assertDomainRendererCoverage(project:ProjectConfig,contentRegistry:DomainRegistry=domainRegistry,rendererRegistry=domainRenderers):void {
 for(const definition of getActiveDomains(project,contentRegistry))domainRenderer(definition.key,rendererRegistry);
}
