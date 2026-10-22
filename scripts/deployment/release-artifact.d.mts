import type {ProductionTarget} from './production.mjs';
export interface ReleaseMetadata {format:1;application:string;target:'production';accountId:string;databaseId:string;sourceRevision:string|null;inputDigest:string;targetDigest:string;checks:Record<string,boolean>;tools:{node:string;pnpm:string;wrangler:string};cms:'not_built'}
export interface ReleaseManifest extends ReleaseMetadata {status:'blocked';deployable:false;issues:string[];files:Record<string,string>;releaseId:string}
export function releaseWorkerConfig(target:ProductionTarget):Record<string,any>;
export function sealReleaseArtifact(root:string,metadata:ReleaseMetadata):ReleaseManifest;
export function verifyReleaseArtifact(root:string,expected?:ProductionTarget):ReleaseManifest;
