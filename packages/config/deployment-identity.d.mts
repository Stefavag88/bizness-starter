import type {ProjectConfig} from './project.mjs';
export interface DeploymentIdentity {format:1;application:string;environment:string;siteUrl:string;profile:string;turnstileSiteKey:string}
export function deploymentIdentity(project:ProjectConfig):DeploymentIdentity|null;
export function identityText(identity:DeploymentIdentity|null):string;
