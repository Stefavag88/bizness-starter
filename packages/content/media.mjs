import { z } from 'zod';

/** Preserve the public URL while decoding exactly once for filesystem lookup. */
export function parseMediaSource(src) {
  const invalid = () => { throw new Error('Media source must be an original local PNG, JPEG or WebP under /uploads/'); };
  if (typeof src !== 'string' || !src.startsWith('/uploads/')) invalid();
  // Encoded dots/separators are never structural syntax, even if decoding would
  // appear to leave the path contained. A remaining percent forbids double decode.
  if (/%(?:2e|2f|5c)/i.test(src)) invalid();
  let decoded;
  try { decoded = decodeURIComponent(src); } catch { invalid(); }
  if (/[\\%?#:\u0000-\u001f\u007f]/.test(decoded)) invalid();
  const relativePath = decoded.slice('/uploads/'.length);
  const segments = relativePath.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || /[. ]$/.test(segment))) invalid();
  if (['section-images', 'generated'].includes(segments[0].toLowerCase())) invalid();
  const match = /\.(png|jpe?g|webp)$/i.exec(relativePath);
  if (!match) invalid();
  const extension = match[1].toLowerCase().replace('jpg', 'jpeg');
  return { src, relativePath, extension };
}

export const mediaReferenceSchema = z.strictObject({
  src: z.string().refine(src => {
    try { parseMediaSource(src); return true; } catch { return false; }
  }, 'Choose an original local PNG, JPEG or WebP upload'),
  crop: z.enum(['center', 'top', 'bottom']).default('center'),
});
