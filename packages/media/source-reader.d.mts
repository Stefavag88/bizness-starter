import type { Buffer } from 'node:buffer';
import type { SourceMedia } from './source.mjs';
/** Server-only. Bytes are the exact validated snapshot used for media metadata. */
export function readValidatedSource(root: string, src: string): Promise<{media: SourceMedia; bytes: Buffer; pages: number}>;
