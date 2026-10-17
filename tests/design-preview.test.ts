import { describe, expect, it } from 'vitest';
import { previewURL, resolvePreviewState, type PreviewOptions, type PreviewState } from '../apps/site/src/lib/design-preview';

const options: PreviewOptions = Object.freeze({
  themes: Object.freeze(['neutral', 'trades', 'accommodation', 'wellness']),
  languages: Object.freeze(['en', 'el']),
  defaults: Object.freeze({ theme: 'trades', density: 'compact', lang: 'el' }),
});

describe('resolvePreviewState', () => {
  it('uses the configured defaults when preview parameters are absent', () => {
    expect(resolvePreviewState(new URLSearchParams('campaign=autumn'), options)).toEqual({
      theme: 'trades', density: 'compact', lang: 'el',
    });
  });

  it.each(['neutral', 'trades', 'accommodation', 'wellness'])('accepts the bookmarked %s theme', (theme) => {
    expect(resolvePreviewState(new URLSearchParams({ theme, density: 'spacious', lang: 'en' }), options)).toEqual({
      theme, density: 'spacious', lang: 'en',
    });
  });

  it.each(['compact', 'comfortable', 'spacious'] as const)('accepts the bookmarked %s density', (density) => {
    expect(resolvePreviewState(new URLSearchParams({ theme: 'wellness', density, lang: 'el' }), options)).toEqual({
      theme: 'wellness', density, lang: 'el',
    });
  });

  it.each(['', 'unknown', 'constructor', '__proto__', '<script>alert(1)</script>', 'TRADES', ' trades '])(
    'falls back independently for unallowlisted values %j', (value) => {
      expect(resolvePreviewState(new URLSearchParams({ theme: value, density: value, lang: value }), options)).toEqual({
        theme: 'trades', density: 'compact', lang: 'el',
      });
    },
  );

  it('rejects an unsupported locale without discarding other valid choices', () => {
    expect(resolvePreviewState(new URLSearchParams('theme=wellness&density=comfortable&lang=fr'), options)).toEqual({
      theme: 'wellness', density: 'comfortable', lang: 'el',
    });
  });

  it('uses only the supplied theme and language allowlists', () => {
    expect(resolvePreviewState(new URLSearchParams('theme=neutral&lang=en'), {
      themes: ['trades'], languages: ['el'], defaults: options.defaults,
    })).toEqual({ theme: 'trades', density: 'compact', lang: 'el' });
  });

  it('resolves the first incoming value of each duplicated preview key', () => {
    expect(resolvePreviewState(new URLSearchParams('theme=wellness&theme=trades&density=spacious&density=compact&lang=en&lang=el'), options)).toEqual({
      theme: 'wellness', density: 'spacious', lang: 'en',
    });
  });

  it('falls back when the first duplicate is invalid even if later values are valid', () => {
    expect(resolvePreviewState(new URLSearchParams('theme=constructor&theme=neutral&density=&density=spacious&lang=fr&lang=en'), options)).toEqual({
      theme: 'trades', density: 'compact', lang: 'el',
    });
  });

  it('leaves parameters and frozen options unchanged and returns a detached state', () => {
    const params = new URLSearchParams('theme=wellness&theme=neutral&campaign=one&campaign=two');
    const state = resolvePreviewState(params, options);
    state.theme = 'neutral';
    expect(params.toString()).toBe('theme=wellness&theme=neutral&campaign=one&campaign=two');
    expect(options).toEqual({
      themes: ['neutral', 'trades', 'accommodation', 'wellness'], languages: ['en', 'el'],
      defaults: { theme: 'trades', density: 'compact', lang: 'el' },
    });
    const fallback = resolvePreviewState(new URLSearchParams(), options);
    expect(fallback).not.toBe(options.defaults);
    fallback.lang = 'en';
    expect(options.defaults.lang).toBe('el');
  });
});

describe('previewURL', () => {
  const original = 'https://example.test/design-system?theme=trades&campaign=one&theme=neutral&density=compact&density=comfortable&lang=el&lang=en&campaign=two#controls';

  it('replaces every duplicate preview key and preserves unrelated query, route and anchor', () => {
    const current = new URL(original);
    const state: PreviewState = Object.freeze({ theme: 'wellness', density: 'spacious', lang: 'en' });
    const result = previewURL(current, state);
    expect(result.href).toBe('https://example.test/design-system?theme=wellness&campaign=one&density=spacious&lang=en&campaign=two#controls');
    expect(current.href).toBe(original);
    expect(state).toEqual({ theme: 'wellness', density: 'spacious', lang: 'en' });
    expect(result).not.toBe(current);
  });

  it('adds missing preview keys while retaining unknown parameters', () => {
    expect(previewURL(new URL('https://example.test/tools/design-system?other=keep#controls'), {
      theme: 'accommodation', density: 'comfortable', lang: 'el',
    }).href).toBe('https://example.test/tools/design-system?other=keep&theme=accommodation&density=comfortable&lang=el#controls');
  });

  it('resets by removing only all preview keys and resolving back to configured defaults', () => {
    const current = new URL(original);
    const result = previewURL(current, null);
    expect(result.href).toBe('https://example.test/design-system?campaign=one&campaign=two#controls');
    expect(resolvePreviewState(result.searchParams, options)).toEqual({ theme: 'trades', density: 'compact', lang: 'el' });
    expect(current.href).toBe(original);
    expect(result).not.toBe(current);
  });

  it('returns a detached URL when resetting an already clean URL', () => {
    const current = new URL('https://example.test/design-system#controls');
    const result = previewURL(current, null);
    result.hash = 'cards';
    expect(current.href).toBe('https://example.test/design-system#controls');
    expect(result.href).toBe('https://example.test/design-system#cards');
  });
});
