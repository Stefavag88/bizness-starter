export interface PreviewState {
  theme: string;
  density: 'compact' | 'comfortable' | 'spacious';
  lang: string;
}

export interface PreviewOptions {
  themes: readonly string[];
  languages: readonly string[];
  defaults: PreviewState;
}

const densities = ['compact', 'comfortable', 'spacious'] as const;

function allowedValue<T extends string>(value: string | null, choices: readonly T[], fallback: T): T {
  return choices.find((choice) => choice === value) ?? fallback;
}

/** Resolve the first query value against validated, server-supplied choices. */
export function resolvePreviewState(params: URLSearchParams, options: PreviewOptions): PreviewState {
  return {
    theme: allowedValue(params.get('theme'), options.themes, options.defaults.theme),
    density: allowedValue(params.get('density'), densities, options.defaults.density),
    lang: allowedValue(params.get('lang'), options.languages, options.defaults.lang),
  };
}

/** Return an independent URL; null resets only the preview parameters. */
export function previewURL(current: URL, state: PreviewState | null): URL {
  const result = new URL(current.href);
  for (const key of ['theme', 'density', 'lang'] as const) {
    if (state === null) result.searchParams.delete(key);
    else result.searchParams.set(key, state[key]);
  }
  return result;
}
