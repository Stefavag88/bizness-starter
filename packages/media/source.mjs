// Server-only adapter: never import this module from editor/client code.
import { createRequire } from 'node:module';
import { realpath, open } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { parseMediaSource } from '../content/media.mjs';

// Sharp is owned by the pinned Astro dependency, not a new direct dependency.
const siteRequire = createRequire(new URL('../../apps/site/package.json', import.meta.url));
const astroRequire = createRequire(siteRequire.resolve('astro/package.json'));
const sharp = astroRequire('sharp');
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 20000;
const MAX_PIXELS = 40000000;
// Bound process memory while sharing metadata only by content hash and format.
const metadataCache = new Map();
const MAX_CACHE_ENTRIES = 128;

/** root is the repository root; uploads live at apps/site/public/uploads. */
export async function resolveSourceMedia(root, src) {
  const parsed = parseMediaSource(src);
  const uploadRoot = await realpath(resolve(root, 'apps/site/public/uploads'));
  const filePath = await realpath(resolve(uploadRoot, parsed.relativePath));
  const containedPath = relative(uploadRoot, filePath);
  if (!containedPath || containedPath === '..' || containedPath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(containedPath)) {
    throw new Error(`Media source escapes the upload root: ${src}`);
  }
  const file = await open(filePath, 'r');
  let bytes;
  try {
    const stat = await file.stat();
    if (!stat.isFile()) throw new Error(`Media source must be a regular file: ${src}`);
    if (stat.size > MAX_BYTES) throw new Error(`Media source exceeds the 20 MiB byte limit: ${src}`);
    bytes = await file.readFile();
  } finally { await file.close(); }
  // A file can grow after stat. Bound the bytes actually read as well.
  if (bytes.length > MAX_BYTES) throw new Error(`Media source exceeds the 20 MiB byte limit: ${src}`);
  const fingerprint = createHash('sha256').update(bytes).digest('hex');
  const key = `${fingerprint}:${parsed.extension}`;
  let result = metadataCache.get(key);
  if (!result) {
    // This validates metadata/header bounds, not exhaustive compressed payloads.
    const metadata = await sharp(bytes, { limitInputPixels: MAX_PIXELS, failOn: 'warning' }).metadata();
    if (metadata.format !== parsed.extension) throw new Error(`Media format does not match its extension: ${src}`);
    let { width, height } = metadata;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) {
      throw new Error(`Media dimensions exceed the supported bounds: ${src}`);
    }
    if ([5, 6, 7, 8].includes(metadata.orientation)) [width, height] = [height, width];
    result = { width, height, format: metadata.format, fingerprint };
    if (metadataCache.size >= MAX_CACHE_ENTRIES) metadataCache.delete(metadataCache.keys().next().value);
    metadataCache.set(key, result);
  }
  return { src, ...result };
}
