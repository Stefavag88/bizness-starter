/** Preserve localized public error pages when static assets fall back to the root 404. */
export async function localizedAsset(
  request: Request,
  fetchAsset: (request: Request) => Promise<Response>,
  locales: readonly string[],
): Promise<Response> {
  const response = await fetchAsset(request);
  const locale = new URL(request.url).pathname.split('/')[1];
  if (
    response.status !== 404 ||
    !['GET', 'HEAD'].includes(request.method) ||
    !locales.includes(locale) ||
    !response.headers.get('Content-Type')?.includes('text/html')
  )
    return response;
  const headers = new Headers(request.headers);
  headers.delete('If-None-Match');
  headers.delete('If-Modified-Since');
  const localized = await fetchAsset(
    new Request(new URL('/' + locale + '/404', request.url), {
      method: request.method,
      headers,
    }),
  );
  if (localized.status !== 200) return response;
  const resultHeaders = new Headers(localized.headers);
  resultHeaders.set('X-Robots-Tag', 'noindex');
  resultHeaders.set('Cache-Control', 'no-store');
  return new Response(localized.body, { status: 404, headers: resultHeaders });
}
