import type {MediaOptimization} from '../config/project.mjs';
import type {ResponsiveMedia} from './optimization.mjs';
export interface MediaSession {
 resolve(src:string):Promise<ResponsiveMedia>;
 publish(outDir:string):Promise<void>;
 asset(urlPath:string):Promise<{bytes:Buffer;contentType:string}|undefined>;
 close():Promise<void>;
}
export interface MediaSessionOptions {root:string;policy:MediaOptimization;mode:'build'|'dev'}
export function createMediaSession(options:MediaSessionOptions):MediaSession;
export function beginMediaSession(options:MediaSessionOptions):MediaSession;
export function getMediaSession(root:string):MediaSession;
export function endMediaSession(root:string):Promise<void>;
