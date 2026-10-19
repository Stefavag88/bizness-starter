import type { MediaOptimization } from '../config/project.mjs';
import type { readValidatedSource } from './source-reader.mjs';
import type { ImageCandidate, ResponsiveMedia } from './optimization.mjs';
export type { ImageCandidate, ResponsiveMedia } from './optimization.mjs';
export { candidateWidths } from './optimization.mjs';
/** Server-only. root is a repository root with its own marked cache. */
export function resolveCachedMedia(root: string, snapshot: Awaited<ReturnType<typeof readValidatedSource>>, policy: MediaOptimization): Promise<ResponsiveMedia>;
/** Verify exact URL identity, containment, marker, manifest, hash and decoded output. Throws on invalid/missing entries. */
export function readCachedCandidate(root: string, candidate: ImageCandidate): Promise<{bytes: Buffer; contentType: string}>;
