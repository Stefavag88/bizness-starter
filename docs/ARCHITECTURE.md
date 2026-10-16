# Architecture

This repository is the isolated Business Starter v2 foundation. `project.json` owns developer configuration; `packages/config/project.mjs` is its browser-safe strict Zod boundary, with TypeScript declarations alongside it. Scripts and Astro consume the same parser. Native content, Pages and CMS contracts arrive in subsequent Foundation tasks.

| Boundary | Ownership |
| --- | --- |
| apps/site | Neutral static Astro smoke page with English/Greek sample copy |
| worker | Local API health route; backend capabilities arrive in Task 4 |
| packages/config | Project validation and types; no filesystem imports |
| packages/content, contracts, design-system, email | Reserved monorepo package boundaries |
| tina, content | Reserved authoring and canonical content boundaries |
| scripts | Local configuration, isolated development lifecycle, Wrangler wrapper |
| tests, e2e | Contract/lifecycle tests and future browser tests |

`pnpm configure` validates the project and generates ignored .generated/local.json plus wrangler.generated.json. These outputs are never authoring targets. Sending and marketing default false; review flags default false. The initial Worker cannot send messages or provision resources.

Use Node 22.x or 24.x and pnpm 10.13.1. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build` and `pnpm worker:check`. `pnpm dev` starts the site at http://127.0.0.1:4330 and the local Worker at http://127.0.0.1:8790. `/api/health` works directly and through the site's proxy. Ctrl+C removes only process trees created by this launcher.

Override SITE_PORT, WORKER_PORT, TINA_PORT and TINA_DATALAYER_PORT (defaults 4330/8790/4010/9010). Values must be distinct integers from 1 to 65535. Occupied site/Worker ports fail with an actionable error before starting children. The generated local URL map uses the same values. Tina ports are reserved configuration until Task 3; no Tina listener starts yet. `pnpm dev:cms` and `pnpm cms:local-build` exit with an explicit Task 3 notice.

The launcher never stops another project's server. On Windows it terminates exact child PIDs and their descendants; on POSIX it signals the child process groups it owns. The automated lifecycle test starts on dynamically selected isolated ports, verifies health through the proxy, sends Ctrl+C and checks child PIDs and sockets are gone.

See the preserved design/spec and plan under docs/superpowers for the subsequent work. No deployment, provisioning, remote databases or real sending is included.
