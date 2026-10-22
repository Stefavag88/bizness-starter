import identityMarker from '../.generated/deployment-identity-text.json';
import {identityText,type DeploymentIdentity} from '../packages/config/deployment-identity.mjs';
import type {Env} from './types';
/** Run before metering, DB, dispatch or provider calls. */
export function validateDeploymentIdentity(built:DeploymentIdentity|null,env:Partial<Env>){
 if(built===null){if(env.DEPLOYMENT_IDENTITY)throw Error('Deployment identity mismatch');return;}
 if(env.DEPLOYMENT_IDENTITY!==identityText(built)||env.ENVIRONMENT!==built.environment||env.SITE_URL!==built.siteUrl||env.PROFILE!==built.profile||env.TURNSTILE_SITE_KEY!==built.turnstileSiteKey)throw Error('Deployment identity mismatch');
}

const builtIdentity:DeploymentIdentity|null=identityMarker?JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(identityMarker),character=>character.charCodeAt(0)))):null;
export function validateRuntimeDeployment(env:Partial<Env>){validateDeploymentIdentity(builtIdentity,env);}
