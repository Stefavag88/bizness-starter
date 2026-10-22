/** Public build identity. Contains no credentials or user data. */
export function deploymentIdentity(project){
 if(project.environment==='local')return null;
 return {format:1,application:project.name,environment:project.environment,siteUrl:project.siteUrl,profile:project.profile,turnstileSiteKey:project.infrastructure.turnstileSiteKey};
}
export function identityText(identity){return identity===null?'':JSON.stringify(identity);}
