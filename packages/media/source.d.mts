import type { MediaFormat } from '../content/media.mjs';
export interface SourceMedia { src: string; width: number; height: number; format: MediaFormat; fingerprint: string }
/** Server-only. root is the repository root containing apps/site/public/uploads. */
export function resolveSourceMedia(root: string, src: string): Promise<SourceMedia>;
