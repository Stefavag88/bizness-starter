import { describe, expect, it } from 'vitest';
import { mediaReferenceSchema, parseMediaSource } from '../packages/content/media.mjs';

describe('local media source contract', () => {
  it.each([
    ['/uploads/team photo.png', 'team photo.png', 'png'],
    ['/uploads/people/team%20photo.JPG', 'people/team photo.JPG', 'jpeg'],
    ['/uploads/library/portrait.jpeg', 'library/portrait.jpeg', 'jpeg'],
    ['/uploads/other/εικόνα.webp', 'other/εικόνα.webp', 'webp'],
  ])('preserves wire source %s and decodes one safe filesystem path', (src, relativePath, extension) => {
    expect(parseMediaSource(src)).toEqual({ src, relativePath, extension });
  });
  it.each([
    '', 'uploads/photo.png', '/elsewhere/photo.png', '//host/uploads/photo.png',
    'https://example.org/uploads/photo.png', 'data:image/png;base64,abc',
    '/uploads/../photo.png', '/uploads/./photo.png', '/uploads/a//photo.png',
    '/uploads/%2e%2e/photo.png', '/uploads/a%2fb.png', '/uploads/a%5cb.png',
    '/uploads/%252e%252e/photo.png', '/uploads/a%252fb.png', '/uploads/a%2520b.png',
    '/uploads/a\\b.png', '\\\\server\\photo.png', '/uploads/C:/photo.png',
    '/uploads/a.png?q=1', '/uploads/a.png#x', '/uploads/a%3fb.png', '/uploads/a%23b.png',
    '/uploads/a\u0000.png', '/uploads/a\n.png', '/uploads/a%0Ab.png', '/uploads/a%7fb.png',
    '/uploads/a%ZZ.png', '/uploads/a%.png', '/uploads/a.svg', '/uploads/a.gif',
    '/uploads/section-images/a.png', '/uploads/generated/a.png', '/uploads/GENERATED/a.png',
    '/uploads/sub./a.png', '/uploads/sub /a.png',
  ])('rejects unsafe or unsupported source %j', src => {
    expect(() => parseMediaSource(src)).toThrow();
    expect(mediaReferenceSchema.safeParse({ src }).success).toBe(false);
  });
  it('defaults crop without changing src and rejects unsupported crop/extra wire fields', () => {
    expect(mediaReferenceSchema.parse({ src: '/uploads/a%20b.png' })).toEqual({ src: '/uploads/a%20b.png', crop: 'center' });
    for (const crop of ['center', 'top', 'bottom']) expect(mediaReferenceSchema.safeParse({ src: '/uploads/a.png', crop }).success).toBe(true);
    expect(mediaReferenceSchema.safeParse({ src: '/uploads/a.png', crop: 'left' }).success).toBe(false);
    expect(mediaReferenceSchema.safeParse({ src: '/uploads/a.png', width: 10 }).success).toBe(false);
  });
});
