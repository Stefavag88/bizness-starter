import type { z } from 'zod';
export type MediaFormat = 'png' | 'jpeg' | 'webp';
export interface ParsedMediaSource { src: string; relativePath: string; extension: MediaFormat }
export interface MediaReference { src: string; crop: 'center' | 'top' | 'bottom' }
export function parseMediaSource(src: string): ParsedMediaSource;
export const mediaReferenceSchema: z.ZodType<MediaReference, { src: string; crop?: MediaReference['crop'] }>;
