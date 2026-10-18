import type { ProjectConfig } from '../packages/config/project.mjs';
import type { DomainRegistry } from '../packages/content/domain-contracts';
export function createCmsDescriptor(root:string,project:ProjectConfig,registry?:DomainRegistry):{
 project:Pick<ProjectConfig,'name'|'starterVersion'|'schemaVersion'|'profile'|'articles'|'modules'|'locale'|'languages'|'siteUrl'|'interests'>;
 articlePageFiles:string[];domainPageFiles:string[];
};
