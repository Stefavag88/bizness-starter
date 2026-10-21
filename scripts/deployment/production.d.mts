import type {ProjectConfig} from '../../packages/config/project.mjs';
export interface ProductionTarget {application:string;accountId:string;project:ProjectConfig}
export function parseProductionTarget(raw:unknown,source:ProjectConfig):ProductionTarget;
export function productionIssues(target:ProductionTarget):string[];
