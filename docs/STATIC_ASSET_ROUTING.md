# Static asset routing

Public output is served by Workers Static Assets. The generated `run_worker_first` list keeps `/`, exact `/api`, `/admin`, `/cms`, `/newsletter` and their descendants in the Worker. Configured locale roots and descendants have explicit negative patterns, so even localized misses and unsupported methods go directly to assets. Other existing static assets use normal asset-first routing. No public response requires a diagnostic Worker header.

`not_found_handling: '404-page'` chooses the nearest literal `404.html`. Astro normally emits localized error pages as `LOCALE/404/index.html`; the `localized-static-not-found` build integration copies each to `LOCALE/404.html` after the static build. These are generated artifacts, never canonical content. Missing localized GET/navigation requests now receive localized HTML with status 404 without invoking application code. Existing canonical `/LOCALE/404` remains an addressable 200 page. With both Astro's directory output and the copied file present, pinned Wrangler serves `/LOCALE/404/index.html` directly with 200; `/LOCALE/404.html` redirects with 307 to `/LOCALE/404`. This intrinsic alias is not a canonical editorial URL. Other public trailing-slash redirects retain drop-trailing-slash behavior.

Astro development retains its existing localized middleware; the Worker localized fallback remains for requests that reach its asset boundary. Static output uses generated `_headers` for CSP, nosniff, referrer and permissions policies. Static 404 responses follow the asset service's cache behavior rather than the Worker's fallback `no-store` response. The HTML retains its noindex metadata. Hosted CMS still requires Access configuration; local permissions still require an actual loopback request.

## Reproduce the boundary proof

Stop the owned dev/CMS launcher, then run:

```text
pnpm test:static-routing
```

This acceptance command targets the current EN/EL enquiries seed, its English default locale and seeded slugs; it is not an arbitrary configured-site verifier. The command rebuilds and runs Wrangler 4.148.0 locally against a unique ignored copy of the built assets. Its disposable Worker entry delegates root and privileged requests to the actual Worker. Every other application invocation returns status 599. Public 200/304/307/404/405 responses therefore demonstrate asset-service handling, rather than merely showing that the Worker called its `ASSETS` binding. The wrapper's invocation marker exists only in the temporary harness. No diagnostic headers or test branches ship in production.

Coverage includes EN/EL Home, About, Contact, offering/person/article details and feeds; compiled scripts/styles/fonts; navigation and raw GET; HEAD; conditional requests; nested, extension-like and encoded missing paths; canonical slash redirects; intrinsic error-page aliases; and unsupported localized POST. The missing-page conditional case combines a nonmatching ETag with a future If-Modified-Since value; it does not establish IMS-only behavior or matching-404-ETag behavior. Nonlocale missing GET/navigation requests also return the root 404 directly in this pinned runtime. Colliding owned API/admin/CMS/newsletter asset files cannot bypass explicit Worker routing. The real Worker verifies the root redirect, health response, forbidden contact origin, disabled marketing/admin responses, remote CMS denial and permitted local CMS access. The harness uses no D1 migrations, canonical edits, sending or external accounts and stops its runtime in `finally`, then removes only its unique owned directory.

The first red run returned 599 for `/en/about` with the original broad locale Worker routing. After routing changed, the next red run served the English root 404 for `/el/missing`. The build integration made the complete runtime matrix green. Existing focused localized fallback tests remain, while the old broad-routing configuration assertion is replaced by this observable runtime proof.

This is local pinned-Wrangler evidence, not hosted deployment or account/quota verification. Hosted edge routing, cache behavior and quota accounting remain unverified. Database operations and email delivery are not exercised by this routing harness. Root redirects, API/form submissions, newsletter lifecycle and protected CMS/admin operations still invoke the Worker and can consume its request allowance. Attackers can target those paths; this change does not provide universal quota protection or replace provider limits, form protection, Access or hosted readiness checks. Future changes to route ownership, locale generation or Wrangler need this acceptance rerun.

The implementation follows Cloudflare's documented [static site generation and nearest 404 handling](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/) and [advanced routing, including negative Worker-first patterns](https://developers.cloudflare.com/workers/static-assets/routing/advanced/).

## Verification result (2026-10-18)

- `pnpm check`: 36 Astro files, zero errors/warnings/hints; TypeScript passed.
- `pnpm test`: 379 boundary/unit tests passed, one optional native-query test skipped; five footer/render tests passed. The former broad-locale configuration assertion was removed in favor of the runtime matrix above.
- `pnpm test:static-routing`: rebuilt 23 pages and passed the complete local runtime matrix.
- `pnpm worker:check`: Wrangler dry-run bundled successfully; no deployment occurred.

The acceptance runtime was stopped and its unique copied-asset directory removed after both failed and successful runs. Canonical project/content files and the two read-only source repositories were not changed.
