// Server-only bounded encoder. All callers share these two transformation slots.
import sharp from 'sharp';
export const PIPELINE_VERSION = 'v1-rotate-resize-lossless-png-1';
export const ENCODING_POLICY = 'auto-orient;inside;without-enlargement;strip-metadata;png-lossless';
export const SHARP_VERSION = sharp.versions.sharp;
let active = 0;
const waiting = [];
async function transformSlot(job) {
  if (active >= 2) await new Promise(resolve => waiting.push(resolve));
  else active++;
  try { return await job(); }
  finally { const next = waiting.shift(); if (next) next(); else active--; }
}
export function candidateWidths(sourceWidth, widths) {
  return [...new Set([...widths.filter(width => width <= sourceWidth), Math.min(sourceWidth, widths.at(-1))])].sort((a,b) => a-b);
}
export async function encodeCandidate(bytes, width, format, quality) {
  return transformSlot(async () => {
    let image = sharp(bytes, { limitInputPixels: 40000000, failOn: 'warning' }).rotate().resize({width,withoutEnlargement:true});
    if (format === 'png') image = image.png();
    else if (format === 'jpeg') image = image.jpeg({quality});
    else if (format === 'webp') image = image.webp({quality});
    else throw new Error(`Unsupported media output format: ${format}`);
    const {data,info} = await image.toBuffer({resolveWithObject:true});
    return {bytes:data,width:info.width,height:info.height};
  });
}
