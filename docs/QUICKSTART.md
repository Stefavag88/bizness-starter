# Composition A and B quickstart

This checkout is the neutral Business Starter v2 Foundation with Composition A and B, version `2.0.0-dev`. It is a local development branch, with no hosted provider configuration or production-readiness certification. Start with Node 22.x or 24.x and pnpm 10.13.1.

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

The default locale owns section structure and appearance; translations provide copy by stable section ID. Composition A supports explicit Standard draft creation, optional section add/reorder/remove and Settings navigation authoring. Saved identity and URLs remain immutable. Hero, required privacy body and Contact form remain protected. Read [Composition authoring](COMPOSITION_AUTHORING.md) for native template-picker limits, explicit locale initialization and save recovery.

Content saves refresh public development output and the backend manifest through the owned input watcher. Invalid content reports validation errors. Static deployment output requires rebuilding. Never edit generated files under `.generated`, Tina generated output, generated theme CSS/registry or `wrangler.generated.json`.

## Verification

```powershell
pnpm exec playwright install chromium
# Against an already running pnpm dev:cms stack (reuse an installed browser):
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

Composition A completes the first stage 2 authoring slice. Composition B adds FAQ, steps, media/text and gallery. Composition C adds the optional Rooms extension and static domain registrations, with Tasks 1–7 and whole-branch review approved at `7a12969`; local closeout is complete. Stage 3A implements responsive static media; see [media policy and rebuilds](MEDIA_OPTIMIZATION.md). Stage 3B implements shared contact/social channels; see [authoring, link rules and local acceptance](CONTACT_SOCIAL.md). Remaining Stage 3 work includes motion, visitor controls and hosted-provider verification. Stage 4 owns business presets, safe destination initialization and release/tagging. No presets, initializer, migration guide, production delivery, deployment, tagging or remote setup is included here. See [content ownership](CONTENT_MODEL.md), [architecture](ARCHITECTURE.md) and [source provenance](SOURCE_INVENTORY.md).

## Local native build note

The pinned CLI 4.0.1 intermittently stalled at `Indexing local files` during repeated isolated local builds. Canonical configuration validation and generated schema/type output had completed. A datalayer startup/client connection race is an inference from installed CLI code, not a proven upstream diagnosis. The approved local workaround passes the supported `--skip-indexing` only in `--cms-build` mode. This still validates canonical content and builds the native schema/client/editor bundle; it has no local query consumer. `dev:cms` retains full indexing, proven native queries and real UI saves. No dependency upgrade, reconnect patch, hosted build change or production claim is included. Tina advertises its query endpoint as `http://localhost:4010/graphql`; use that host for CMS_QUERY_URL (the OS may bind IPv6). E2E_CMS_URL instead points to the public site origin serving /cms.

## Foundation authoring safeguards

All native collections explicitly disable Create folder and Create nested folder. Store JSON documents directly in each collection folder; nested native save paths are rejected before validation queries or persistence. The public loader fails with the offending active subfolder and a move-to-collection instruction, rather than silently omitting nested documents. Disabled article folders and campaign folders outside newsletter/nurture remain unread.

Native Delete is disabled for Offerings, People and Articles because their stable scalar IDs are relationship targets. Native deletion does not run the save catalog guard. Foundation preserves those IDs and its dangling-relationship validation; stage 2 must add relationship-aware authoring/deletion before exposing deletion. Settings creation/deletion and Page deletion/rename remain protected; only Standard draft creation is enabled.

Changing a published editorial slug requires an explicit redirect from its previous public URL before hosted release. Stage 2 authoring and the release gate must enforce that obligation; Foundation does not implement a redirects subsystem. The localized system `404` path is reserved and cannot be assigned to content.

The ordinary `pnpm test` command runs the boundary/unit suite and then the site-root Astro Layout render suite. Use `pnpm test:footer` for only the bilingual rich-footer component regression; it renders detached fixture content without editing canonical source files.

## Composition acceptance

Against the owned indexed dev:cms stack, run the query test separately, then the owned public matrix:

```powershell
$env:CMS_QUERY_URL='http://localhost:4010/graphql'
pnpm exec vitest run tests/cms-native-query.test.ts
$env:E2E_COMPOSITION_FIXTURE='1'
pnpm exec playwright test e2e/composition-content.spec.ts
```

The matrix owns a unique initially absent Standard fixture and removes it only after complete-record ownership checks. It covers EN/EL Home, Contact and Standard at 375/768/1440, plus required privacy content. Task 4/5 native suites retain the schema/serializer-derived mutation proofs. Current evidence is [Composition A acceptance](superpowers/plans/2026-10-16-starter-v2-composition-a-evidence.md); historical Foundation evidence remains unchanged.

## Design-system showcase

The local-only `/design-system` reference compares four themes, responsive density and configured English/Greek samples without changing canonical content. See [showcase usage](DESIGN_SYSTEM_SHOWCASE.md) for bookmarks, reset, permanent settings and isolated build/browser acceptance. Stop the owned launcher before `pnpm test:showcase-builds`; its final build restores local output. The showcase includes all fourteen type/variant pairs; ordinary starter PNGs remain reusable in nonlocal builds.

### Full-suite server prerequisite

Stop the owned dev or dev:cms launcher before pnpm test. The dev-lifecycle regression starts an owned Astro instance with alternate ports, but Astro also holds a per-project lock: another running instance in this checkout still prevents that test from starting. Restart pnpm dev:cms after the stopped-server checks. Do not force-replace or stop an unrelated Astro process.

## Static routing acceptance

Stop the owned launcher and run `pnpm test:static-routing` to rebuild and verify asset bypass, localized errors, redirects, static security headers and real protected-route handling with pinned Wrangler. See [routing decision and evidence](STATIC_ASSET_ROUTING.md). This command owns and stops its temporary runtime; restart `pnpm dev:cms` afterward as needed.

## Worker access roles

Configure developer-owned infrastructure.adminEmails and infrastructure.editorEmails arrays for hosted access. Administrators can use CMS and operational routes; editors can use CMS only. Keep Tina membership separate and within its Free plan's two CMS users. See [authentication and migration](AUTHENTICATION.md) for normalized lists, Access application coverage, migration from adminEmail and pending hosted verification.


## Composition B acceptance

With the installed Chromium path and owned indexed local stack:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:/Projects/bizness-starter-v2/.generated/browsers'
$env:E2E_COMPOSITION_B_FIXTURE='1'
pnpm exec playwright test e2e/composition-b-content.spec.ts
```

This opt-in public suite uses an owned temporary Standard seed and known image bytes, covering EN/EL at 375/768/1440, all eight new variants, no-JS disclosure/text, reduced motion, image dimensions/crops, translation omission and upload add/change/unlink. It preserves canonical Home/brand and removes only proven fixture bytes. Native authoring evidence is separately retained from Task 4; rerun e2e/composition-b-cms.spec.ts only when that boundary changes. Stop the launcher before frozen install/check/test/build, Worker dry-run, isolated CMS build and test:showcase-builds. The separate owned articles-disabled build/public probe uses the installed Playwright runner; see the evidence document. No new runtime or dependency is needed.

Read [Composition authoring](COMPOSITION_AUTHORING.md) before adding nested items or images, [sample provenance](STARTER_SAMPLE_ASSETS.md) before replacing the neutral illustrations, and [Composition B evidence](superpowers/plans/2026-10-18-starter-v2-composition-b-evidence.md) for actual verification and limits.

## Composition C local use and verification

Rooms defaults to disabled in `project.json` (`modules.rooms: false`), independently of profile/articles. Stop the exact owned launcher before toggling it; run `pnpm configure`, then restart `pnpm dev:cms`. The dormant bilingual index remains draft and no Room records ship. Create native flat drafts and explicitly publish each locale's index and Room; enabling alone does not change Home/navigation. See [Rooms authoring](ROOMS_AUTHORING.md) and [developer extensions](DOMAIN_EXTENSIONS.md).

With owned launchers stopped, `pnpm test:composition-c` runs cleanup faults plus the pure/static/browser and five representative build modes. `pnpm test:composition-c -- --gates` adds the seven global gates; `node scripts/verify-composition-c.mjs --gates-only` runs those gates alone. The harness owns fixtures/processes, snapshots all canonical project/content/uploads inputs, retains conflicts and refuses regeneration after unsafe cleanup. It requires installed browsers at `.generated/browsers`; it builds its own static baseline and uses health/static Workers without D1. The separate Task 5 Worker capture suite requires initialized local D1 and an existing static baseline. Neither provisions cloud resources. Native saves remain a separate opt-in `E2E_CMS_URL` suite against the owned indexed stack.

The accepted final-source C evidence is segmented (six full/public tests plus corrected pure matrix and seven global gates); the final full entry invocation itself exited 1 and is retained. Read [C evidence](superpowers/plans/2026-10-18-starter-v2-composition-c-evidence.md) for actual commands/results, narrow scopes and approved whole-branch review with completed local closeout. Do not run the broad harness just to reconfirm historical evidence or during concurrent editing. Local audits are not hosted readiness or accessibility certification.

## Shared contact and social channels

Author shared contact details and optional Instagram/LinkedIn/Facebook/WhatsApp in Settings; Contact and footer update together, with header icons off by default. Clear optional fields to remove their links. See [contact/social authoring and exact-owned acceptance](CONTACT_SOCIAL.md). Hosted static sites require a rebuild after saves.

## Shared motion

See [MOTION](MOTION.md) for opt-in project settings, generated tokens, renderer markers, reduced-motion/no-JavaScript fallback and the transient local showcase control. The local example enables motion; omitted settings stay disabled.

## Newsletter and visitor preferences

See [newsletter authoring and delivery boundaries](NEWSLETTER.md) for the opt-in newsletter modal, compact footer signup, localized visual editors, shared browser suppression and preferences. The default enquiries project remains unchanged. Hosted protection and actual sending require separately configured integrations.

## Business templates

Use `/templates` in the local source starter to choose a composition. See [presets](PRESETS.md) and [independent project initialization](INITIALIZATION.md).

## Local runtime capacity

After starting the Worker, open `/admin/usage` on its local URL for application statistics. Cloud provider cards intentionally show Not configured. `pnpm test:runtime-budgets` runs the disposable local acceptance harness; the [runtime guide](RUNTIME_BUDGETS.md) explains `pnpm report:capacity` inputs. See [Usage & Capacity](USAGE_CAPACITY.md).
