import type {ContentSnapshot} from '../packages/content/types';
import type {ProjectConfig} from '../packages/config/project.mjs';
export function createManifest(source:ContentSnapshot,project:ProjectConfig):{enquiryContexts:{id:string;kind:string}[];offerings:{id:string;slug:string;title:string;path:string}[];articles:{id:string;title:string;description:string;url:string}[];campaigns:unknown[];routes:import('../packages/content/types').Route[]};
