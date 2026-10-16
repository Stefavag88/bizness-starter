# Architecture

This is the isolated Business Starter v2 foundation. Canonical EN/EL JSON lives under `content/`; developer configuration lives in `project.json`. Public output is static Astro, with a separate Worker for forms, protected operations and email lifecycle. No deployment or external account has been configured.

| Boundary | Contract |
| --- | --- |
| packages/config | Strict browser-safe `parseProject`; no filesystem imports |
| packages/content | `readContent(PROJECT_ROOT, project)` validates canonical documents; `localizeContent` and `publicRoutes` share publication and reciprocal locale availability |
| apps/site/src/lib/content.ts | Server-only project/content adapter; project-root injection remains outside client bundles |
| apps/site/src/templates/Page.astro | One `LocalizedPage` plus one `LocalizedContent`; copy remains on page records |
| templates/sections.ts | Six static Astro imports, exhaustive renderer map, default-only variant validation; no component-path lookup |
| packages/design-system | Reviewed theme JSON/validator and generated semantic CSS; neutral theme uses self-hosted Noto Sans for Greek/Latin |
| packages/contracts, email | Bounded API schemas, escaping/token helpers and plain email rendering |
| worker | Contact, enquiries/newsletter/nurture gating, SQL consent lifecycle, reviewed campaign snapshots, delivery/queue/workflow, protected operations and localized asset fallback |
| migrations | Initial schema for a new project database; contains no subscriber records |
| tina | Native editor collections, rich-text projection and detached save validation; browser imports contain no filesystem adapter |
| scripts | Configuration, local migration/startup, owned processes, input-only content generation and local smoke |

`pnpm configure` explicitly runs the CMS descriptor generator after project/content validation and emits ignored local URLs, Worker bindings, the backend manifest, migration input, theme CSS and asset headers. Backend manifest IDs and URLs come from the same read/localize/publicRoutes pipeline as the site. Articles in the manifest are exactly the active default-locale article set. SEO/RSS/email summaries use plain SEO or `plainText` extraction. All canonical routes omit a trailing slash; offering detail paths follow the configured offerings page slug, and people have `/LOCALE/people/SLUG` routes. The root redirects to the default locale. Both the Worker asset boundary and Astro dev middleware preserve localized 404 content/status.

The public layout has one H1, semantic sections, simple navigation/footer, canonical metadata, available-language links and feeds. There is no modal, media manager, social layer, visitor-state system or financial-specific branding. The contact template owns native fields, required consent, inline validation, a focusable error summary, preserved retry keys, disabled duplicate submissions, timeout/retry feedback and server validation. JavaScript is required to submit the JSON API; a direct email alternative is provided. Hosted form protection is intentionally not configured in this local foundation.

## Local use

Use Node 22.x or 24.x and pnpm 10.13.1:

```text
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm worker:check
pnpm dev
```

`pnpm dev` validates/generates, builds the static asset baseline, applies additive D1 migrations with `--local`, then starts the input watcher, Worker and Astro site. Forms are not available before migration succeeds. Local sending writes only dummy capture messages in ignored project-local D1. Default site/Worker/Tina/datalayer ports are 4330/8790/4010/9010. `/api/health` works directly and through the site proxy. `pnpm db:local` is available separately and never uses remote migrations.

`pnpm dev:cms` additionally owns Tina on its configured port and datalayer port. `pnpm cms:local-build` runs the native local CMS build alone, without site/Worker/content watcher. Stop a launcher before a separate CMS build. Ctrl+C stops only exact PIDs/process trees created by that launcher; it never selects another project's processes by name or port. Occupied/duplicate ports fail before children are started. Override `SITE_PORT`, `WORKER_PORT`, `TINA_PORT`, `TINA_DATALAYER_PORT`; listener/port changes require a launcher restart.

## Save freshness

The owned `scripts/watch-content.mjs` watches only JSON input under content, project.json and theme JSON. It debounces saves and serializes `configure` subprocesses. Generated outputs, databases and native CMS outputs are excluded. Writes are byte-stable, including the CMS descriptor, so editorial copy does not unnecessarily rebuild the editor schema. Vite watches the same public inputs, invalidates server content modules and requests full reload. Wrangler observes changed imported manifests/settings. A successful canonical save therefore reaches public reload and the backend manifest without restarting the launcher. Invalid input reports validation errors and keeps the last valid generated manifest until corrected. Static deployment output still requires a new build; this is not a hosted content service.

## Security and profile boundaries

All profiles allow contact; enquiries exposes no newsletter/campaign routes. Newsletter enables consent and campaign lifecycle; nurture alone generates the Workflow binding. Marketing is not automatically enabled by publishing content. Default sending and marketing flags are false. SQL operations retain idempotency, scoped/generation-bound tokens, double opt-in, withdrawal suppression, approval hashes and ambiguous-provider quarantine. Node tests use isolated in-memory SQLite. Native Workflow execution and external providers are not simulated as successful cloud integrations.

Local origin allowances are generated exact loopback origins for the configured site/Worker ports and apply only to actual local requests. Remote requests require `SITE_URL`; the environment label alone cannot grant local administration or origin exemptions. Confirmation/unsubscribe capture links use the configured local Worker URL. Public assets have same-origin CSP for built scripts/styles/fonts; protected runtime HTML has nonce CSP, JSON APIs have no-store/nosniff and restrictive CSP. Hosted CMS/operations still require Access configuration.

`pnpm doctor` validates local configuration. `pnpm deploy:check` intentionally fails for this foundation: hosted CMS/form protection, secrets, account readiness and content/legal review remain required. There is no deploy command, real sending, cloud provisioning or remote migration in this task. Sample nurture messages remain a production blocker.

`pnpm smoke:local` starts an owned local launcher, checks public/Worker behavior and briefly changes one article's SEO copy to prove freshness. It restores the exact original bytes in finally and shuts down its children. Do not run it alongside another launcher or another task editing that article. Its ignored `.generated/task4-smoke.json` records ports, checks, source hashes and stopped child PIDs. Task 5 owns native editor/browser save and source-ownership E2E coverage.
