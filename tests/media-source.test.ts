import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { mkdtemp, mkdir, writeFile, rm, symlink, truncate, open } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { resolveSourceMedia } from '../packages/media/source.mjs';

let root: string, uploads: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'starter-media-')); uploads = join(root, 'apps/site/public/uploads'); await mkdir(uploads, { recursive: true }); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
const image = (width = 3, height = 2) => sharp({ create: { width, height, channels: 3, background: '#336699' } });
async function save(name: string, bytes: Buffer) { await writeFile(join(uploads, name), bytes); return `/uploads/${name}`; }

describe('server source metadata', () => {
  it.each(['png', 'jpeg', 'webp'] as const)('reads real %s bytes and fingerprints their content', async format => {
    const bytes = await image().toFormat(format).toBuffer();
    const src = await save(`team photo.${format === 'jpeg' ? 'jpg' : format}`, bytes);
    expect(await resolveSourceMedia(root, src)).toEqual({ src, width: 3, height: 2, format, fingerprint: createHash('sha256').update(bytes).digest('hex') });
    const encoded = src.replace(' ', '%20');
    expect((await resolveSourceMedia(root, encoded)).src).toBe(encoded);
  });
  it('supports ordinary upload subfolders', async () => {
    await mkdir(join(uploads, 'other'));
    const src = await save('other/team.png', await image().png().toBuffer());
    expect((await resolveSourceMedia(root, src)).width).toBe(3);
  });
  it('rejects missing files, directories and corrupt headers', async () => {
    await expect(resolveSourceMedia(root, '/uploads/missing.png')).rejects.toThrow();
    await mkdir(join(uploads, 'folder.png'));
    await expect(resolveSourceMedia(root, '/uploads/folder.png')).rejects.toThrow();
    await save('bad.png', Buffer.from('not an image'));
    await expect(resolveSourceMedia(root, '/uploads/bad.png')).rejects.toThrow();
  });
  it('rejects actual formats that disagree with the path extension even after caching valid bytes', async () => {
    const png = await image().png().toBuffer();
    await save('valid.png', png);
    await resolveSourceMedia(root, '/uploads/valid.png');
    await save('wrong.jpg', png);
    await expect(resolveSourceMedia(root, '/uploads/wrong.jpg')).rejects.toThrow();
    await save('wrong.png', await image().gif().toBuffer());
    await expect(resolveSourceMedia(root, '/uploads/wrong.png')).rejects.toThrow();
  });
  it('rejects files above 20 MiB before decoding', async () => {
    const src = await save('large.png', await image().png().toBuffer());
    await truncate(join(uploads, 'large.png'), 20 * 1024 * 1024 + 1);
    await expect(resolveSourceMedia(root, src)).rejects.toThrow(/byte|size|20/i);
  });
  it('rejects bytes that grow beyond the limit between stat and read', async () => {
    const src = await save('grows.png', await image().png().toBuffer());
    const path = join(uploads, 'grows.png');
    const handle = await open(path, 'r');
    const prototype = Object.getPrototypeOf(handle);
    const originalStat = prototype.stat;
    // Keep real filesystem operations; intercept this one stat boundary solely
    // to force the otherwise timing-dependent writer race deterministically.
    const stat = vi.spyOn(prototype, 'stat').mockImplementationOnce(async function(this: FileHandle, ...args: unknown[]) {
      const result = await originalStat.apply(this, args);
      await truncate(path, 20 * 1024 * 1024 + 1);
      return result;
    });
    try { await expect(resolveSourceMedia(root, src)).rejects.toThrow(/byte|size|20/i); }
    finally { stat.mockRestore(); await handle.close(); }
  });
  it.each([[0, 2], [20001, 1], [10000, 4001]])('rejects invalid or excessive dimensions %i x %i', async (width, height) => {
    const bytes = Buffer.from(await image().png().toBuffer());
    bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
    bytes.writeUInt32BE(crc32(bytes.subarray(12, 29)), 29);
    const src = await save('dimensions.png', bytes);
    await expect(resolveSourceMedia(root, src)).rejects.toThrow();
  });
  it.each([5, 6, 7, 8])('reports displayed dimensions for EXIF orientation %i', async orientation => {
    const src = await save('oriented.jpg', await image(7, 3).jpeg().withMetadata({ orientation }).toBuffer());
    expect(await resolveSourceMedia(root, src)).toMatchObject({ width: 3, height: 7, format: 'jpeg' });
  });
  it('does not swap EXIF orientation 3 dimensions', async () => {
    const src = await save('oriented.jpg', await image(7, 3).jpeg().withMetadata({ orientation: 3 }).toBuffer());
    expect(await resolveSourceMedia(root, src)).toMatchObject({ width: 7, height: 3 });
  });
  it('reads changed bytes at the same path rather than caching by filename', async () => {
    const src = await save('replace.png', await image(3, 2).png().toBuffer());
    const first = await resolveSourceMedia(root, src);
    await save('replace.png', await image(9, 4).png().toBuffer());
    const second = await resolveSourceMedia(root, src);
    expect(second).toMatchObject({ width: 9, height: 4 });
    expect(second.fingerprint).not.toBe(first.fingerprint);
  });
  it('rejects a file symlink escaping the real upload root', async () => {
    await writeFile(join(root, 'outside.png'), await image().png().toBuffer());
    await symlink(join(root, 'outside.png'), join(uploads, 'escape.png'), 'file');
    await expect(resolveSourceMedia(root, '/uploads/escape.png')).rejects.toThrow(/outside|contain|escape/i);
  });
  it('rejects directory junction escapes and sibling prefix paths', async () => {
    const outside = join(root, 'apps/site/public/uploads-sibling');
    await mkdir(outside); await writeFile(join(outside, 'image.png'), await image().png().toBuffer());
    await symlink(outside, join(uploads, 'escape'), 'junction');
    await expect(resolveSourceMedia(root, '/uploads/escape/image.png')).rejects.toThrow(/outside|contain|escape/i);
  });
  it('accepts contained file symlinks and a realpath-resolved upload root', async () => {
    const realUploads = join(root, 'real-uploads');
    await rm(uploads, { recursive: true }); await mkdir(realUploads);
    await symlink(realUploads, uploads, 'junction');
    await writeFile(join(realUploads, 'real.png'), await image().png().toBuffer());
    await symlink(join(realUploads, 'real.png'), join(realUploads, 'alias.png'), 'file');
    expect((await resolveSourceMedia(root, '/uploads/alias.png')).width).toBe(3);
  });
});

// Snapshot assertions catch a second pathname read after validation. Only the
// read boundary is intercepted; disk reads and Sharp metadata stay real.
describe('validated source snapshots', () => {
  it('returns the exact single read used for fingerprint and metadata despite a subsequent replacement', async () => {
    const { readValidatedSource } = await import('../packages/media/source-reader.mjs');
    const original = await image(11, 7).png().toBuffer();
    const replacement = await image(4, 9).png().toBuffer();
    const src = await save('snapshot.png', original);
    const path = join(uploads, 'snapshot.png');
    const handle = await open(path, 'r');
    const prototype = Object.getPrototypeOf(handle);
    const originalRead = prototype.readFile;
    let reads = 0;
    const read = vi.spyOn(prototype, 'readFile').mockImplementation(async function(this: FileHandle, ...args: unknown[]) {
      reads++;
      const bytes = await originalRead.apply(this, args);
      await writeFile(path, replacement);
      return bytes;
    });
    try {
      const result = await readValidatedSource(root, src);
      expect(result.bytes).toEqual(original);
      expect(result.media).toEqual({ src, width: 11, height: 7, format: 'png', fingerprint: createHash('sha256').update(original).digest('hex') });
      expect(result.pages).toBe(1);
      expect(reads).toBe(1);
    } finally { read.mockRestore(); await handle.close(); }
  });
  it('identifies animated WebP pages without adding private properties to public metadata', async () => {
    const { readValidatedSource } = await import('../packages/media/source-reader.mjs');
    // Two differently colored stacked frames, each 3 x 2.
    const pixels = Buffer.from([...Array(6).fill([255, 0, 0]).flat(), ...Array(6).fill([0, 0, 255]).flat()]);
    const bytes = await sharp(pixels, { raw: { width: 3, height: 4, channels: 3, pageHeight: 2 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
    const src = await save('animated.webp', bytes);
    const result = await readValidatedSource(root, src);
    expect(result.pages).toBe(2);
    expect(result.bytes).toEqual(bytes);
    expect(result.media).toEqual({ src, width: 3, height: 2, format: 'webp', fingerprint: createHash('sha256').update(bytes).digest('hex') });
    expect(await resolveSourceMedia(root, src)).toEqual(result.media);
  });
});
