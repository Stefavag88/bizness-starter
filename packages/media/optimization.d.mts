import type { SourceMedia } from './source.mjs';
export interface ImageCandidate { src: string; width: number; height: number; format: 'png' | 'jpeg' | 'webp'; bytes: number }
export interface ResponsiveMedia extends SourceMedia { fallback: ImageCandidate[]; webp: ImageCandidate[]; passthroughReason?: 'disabled' | 'animated-or-multipage' }
export function candidateWidths(sourceWidth: number, widths: number[]): number[];
export const PIPELINE_VERSION: string;
export const ENCODING_POLICY: string;
export const SHARP_VERSION: string;
/** Server-only bounded encoder; consumes validated bytes. */
export function encodeCandidate(bytes: Buffer, width: number, format: ImageCandidate['format'], quality: number): Promise<{bytes: Buffer; width: number; height: number}>;
/** Server-only shared process-wide bound for encodes and full validation decodes. Call once per native job; do not nest acquisitions. */
export function withNativeImageWork<T>(job: () => Promise<T>): Promise<T>;
