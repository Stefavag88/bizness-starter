import type {} from '../domains/rooms/types';
import type { ProjectConfig } from '../config/project.mjs';
import type { DomainDefinition, DomainRegistry, OwnedDomainPage } from './domain-contracts';
export type { DomainDefinition, DomainRegistry } from './domain-contracts';
export function defineDomain<R,L>(definition:DomainDefinition<R,L>):DomainDefinition<R,L>;
export function createDomainRegistry(definitions:DomainRegistry['definitions']):DomainRegistry;
export const domainRegistry:DomainRegistry;
export function getActiveDomains(project:ProjectConfig,registry?:DomainRegistry):DomainRegistry['definitions'];
export function getDisabledDomainPages(project:ProjectConfig,registry?:DomainRegistry):readonly OwnedDomainPage[];
