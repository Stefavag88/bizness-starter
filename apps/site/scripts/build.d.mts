import type {AstroInlineConfig} from 'astro';
export function buildSite(inlineConfig?:AstroInlineConfig,root?:string,options?:{devOutput?:boolean}):Promise<void>;
export function parseBuildArgs(args:string[]):{config:AstroInlineConfig;options:{devOutput?:boolean};help:boolean};
