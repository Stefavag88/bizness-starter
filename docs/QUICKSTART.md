# Foundation quickstart

This checkout is the neutral Business Starter v2 Foundation, version `2.0.0-dev`. It is a local development branch, with no hosted provider configuration or production-readiness certification. Start with Node 22.x or 24.x and pnpm 10.13.1.

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm worker:check
pnpm dev:cms
```

Open [the public site](http://127.0.0.1:4330/en) and [the native editor](http://127.0.0.1:4330/cms/index.html). Enter local edit mode. The launcher builds the initial assets, migrates only this checkout's local D1 database, then owns Astro, Worker, the input watcher and Tina. Use `pnpm dev` for the public stack without Tina. Ctrl+C stops only the launcher's children.

The defaults are site 4330, Worker 8790, Tina 4010 and datalayer 9010. Override `SITE_PORT`, `WORKER_PORT`, `TINA_PORT`, `TINA_DATALAYER_PORT` before launching; every port must be distinct and available. Another project's occupied listener causes a clear startup failure. Listener changes require restarting this launcher.

## Editing

Settings own identity, contact and navigation. Pages own seeded page text and stable section instances. Offerings, People and optional Articles own detail content. Expand Translations → Ελληνικά for Greek copy. Rich descriptions allow emphasis and safe links; bodies additionally allow H2/H3, lists and quotes. Optional SEO may be cleared. Save, reload the editor, and reload the public route to inspect the result.

The default locale owns section structure and appearance; translations provide copy by stable section ID. Optional section visibility and approved surface choices are editable. The required hero remains enabled; Contact owns its required form. Foundation deliberately protects page identity, section order, creation/deletion and structural type/variant changes. Page creation and section add/reorder belong to stage 2.

Content saves refresh public development output and the backend manifest through the owned input watcher. Invalid content reports validation errors. Static deployment output requires rebuilding. Never edit generated files under `.generated`, Tina generated output, generated theme CSS/registry or `wrangler.generated.json`.

## Verification

```powershell
pnpm exec playwright install chromium
# Against an already running pnpm dev:cms stack:
$env:E2E_BASE_URL='http://127.0.0.1:4330'
$env:E2E_CMS_URL='http://127.0.0.1:4330'
pnpm test:e2e
```

`E2E_CMS_URL` opts into native saves. Omitting it skips native authoring; specifying an unreachable URL fails. `E2E_BASE_URL` selects the public server independently. Native tests use actual UI/keyboard controls and capture the resulting native save request; they do not issue raw write mutations. Unique ignored backups and complete schema/serializer-derived expectations guard restoration. Avoid simultaneous editing: unknown changes are preserved and reported as conflicts, with original backups retained for manual review. Comparisons are best effort, not an atomic filesystem lock.

Stop the launcher before running isolated native builds or profile verification:

```powershell
pnpm cms:local-build
pnpm test:profiles
```

Profile verification serially configures enquiries/newsletter/nurture and enquiries with articles disabled. It builds native CMS and static pages, dry-runs the Worker, migrates only local D1, starts its own Worker for browser/API checks and stops that exact process tree. It restores exact owned `project.json` bytes after success/failure, preserves external edits on conflict, and regenerates local configuration. Run `pnpm build` afterward to restore default static output, since the final profile has articles disabled. All local port overrides apply. Native CMS builds must not run beside a live watcher. Each profile command has a 120-second timeout, configurable with PROFILE_STAGE_TIMEOUT_MS, and retains stage output under .generated/evidence/profile-commands.log. Timeout kills only the process tree that command created.

The public suite covers EN/EL Home/About/Contact/offering/article at 375/768/1440px, focus, language targets, safe prose, overflow and form feedback. Representative axe scans and manual screenshots supplement this evidence; they do not certify complete accessibility compliance. Evidence lives in ignored `.generated/evidence` and the committed [Foundation evidence](superpowers/plans/2026-10-16-starter-v2-foundation-evidence.md).

## Configuration and deferred work

`project.json` selects profile, independently optional articles, languages and design defaults. Theme JSON owns semantic brand tokens. Default sending and marketing are false, review flags are false, and all identities/addresses are honest sample placeholders. `pnpm doctor` validates local configuration; `pnpm deploy:check` intentionally reports hosted CMS, protection, account, secret, legal/content and sample nurture blockers.

Stage 2 owns the larger section library, add/reorder, page creation and Rooms extension. Stage 3 owns media, social, motion, visitor controls and hosted-provider verification. Stage 4 owns business presets, safe destination initialization and release/tagging. No presets, initializer, migration guide, production delivery, deployment, tagging or remote setup is included here. See [content ownership](CONTENT_MODEL.md), [architecture](ARCHITECTURE.md) and [source provenance](SOURCE_INVENTORY.md).

## Local native build note

The pinned CLI 4.0.1 intermittently stalled at `Indexing local files` during repeated isolated local builds. Canonical configuration validation and generated schema/type output had completed. A datalayer startup/client connection race is an inference from installed CLI code, not a proven upstream diagnosis. The approved local workaround passes the supported `--skip-indexing` only in `--cms-build` mode. This still validates canonical content and builds the native schema/client/editor bundle; it has no local query consumer. `dev:cms` retains full indexing, proven native queries and real UI saves. No dependency upgrade, reconnect patch, hosted build change or production claim is included. Tina advertises its query endpoint as `http://localhost:4010/graphql`; use that host for CMS_QUERY_URL (the OS may bind IPv6). E2E_CMS_URL instead points to the public site origin serving /cms.
