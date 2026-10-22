# Your business website

This is an independent application. Edit identity, contact details and navigation in Tina Settings; edit page structure/content under Pages. Offerings and People hold service/team content. Articles and Rooms appear when enabled. No connection to the source starter is needed after creation.

Use Node 22.x or 24.x and pnpm 10.13.1:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm worker:check
pnpm dev:cms
```

The public site defaults to http://127.0.0.1:4330/en or /el according to your languages; CMS is /cms/index.html. Set SITE_PORT, WORKER_PORT, TINA_PORT and TINA_DATALAYER_PORT when running alongside another project. Existing occupied ports are rejected. Ctrl+C stops only owned processes.

Replace illustrative sample content and placeholder contact/legal details before publication. See docs/CMS_AUTHORING.md, docs/OPERATIONS.md and docs/PRODUCTION_READINESS.md. Sending and marketing are disabled and production readiness stays blocked. Never copy credentials into project.json. Generated files are not editing sources. Future starter updates are reviewed patches; there is no automatic overwrite of your content.

## Production preparation

The initial hosted workflow is local development + production only; staging is optional. The local-only deploy:prepare command validates an explicit non-secret production target and writes a blocked review plan without changing canonical configuration or creating cloud resources. See [deployment preparation](docs/DEPLOYMENT.md). Hosted readiness gates remain mandatory.

## Changes through prompts

Read AGENTS.md and docs/CONFIGURATION_MAP.md; the included starter-maintain-site skill maps requested outcomes to canonical settings/components. pnpm site:inspect reports actual page/section identities, surfaces, variants and feature prerequisites without writes. Ask for the result you want; unsupported capabilities require an explicit shared extension rather than generated-file edits.
