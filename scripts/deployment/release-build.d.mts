import type {ReleaseManifest} from './release-artifact.mjs';
export function parseReleaseBuildArgs(args:string[]):{target:'production';config:string};
export function buildProductionRelease(root:string,args:string[]):Promise<{artifact:string;run:string;manifest:ReleaseManifest}>;
export function localMigrationArgs(wrangler:string,workspace:string,state:string):string[];
