import type {ProjectConfig} from '../packages/config/project.mjs';
import type {ProductionTarget} from './deployment/production.mjs';
export interface LocalConfig {siteUrl:string;workerUrl:string;tinaUrl:string;[key:string]:unknown}
export function createWorkerConfig(project:ProjectConfig,local:LocalConfig,identity?:ProductionTarget):Record<string,any>;
