# Initialize an independent application

Use Node 22.x/24.x and pnpm 10.13.1 from the source starter checkout. The destination's parent must already exist. Choose a new destination or an empty regular folder outside the starter and its ancestors.

```powershell
pnpm create:project --help
pnpm create:project --preset trades --name my-business --destination 'C:\Projects\my-business' --languages 'en,el' --default-language el --theme trades --dry-run
pnpm create:project --preset trades --name my-business --destination 'C:\Projects\my-business' --languages 'en,el' --default-language el --theme trades
```

The CLI validates choices and canonical seed content, snapshots reviewed source files, writes exclusively and initializes a fresh Git repository. It does not install dependencies, create commits/remotes, deploy or start servers. Run the printed commands in the destination:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm worker:check
pnpm dev:cms
```

Defaults are site 4330, Worker 8790, Tina 4010 and datalayer 9010. Override SITE_PORT, WORKER_PORT, TINA_PORT and TINA_DATALAYER_PORT to run alongside another project. A native CMS save changes this application's files; the source starter is not consulted.

## What is exported

`scripts/initialize/export-manifest.json` is an explicit reviewed allowlist. Source code, lockfile, all migrations, local tooling and portable operations/readiness docs are copied byte-for-byte. Client package scripts, README, CMS authoring guide, smoke test, project configuration and preset content are deliberately generated/overlaid. Add an entry whenever a runtime source dependency is introduced; a source build alone cannot prove the destination's import closure.

Source business content, credentials/environment files, databases, dependencies, caches, generated configuration, Git history, reviews, initializer/preset packages and gallery entries are excluded. Clients retain the existing design-system showcase as separately documented local tooling. Their test command runs their own content/route validation, not maintainer fixtures that assume neutral sample IDs.

Each destination starts local, enquiries-only, with sending/marketing and review flags false, placeholder site/mail/database identities and empty hosted Access/SNS settings. Replace sample contact/legal details and abstract media deliberately. Production remains blocked until the requirements in the exported readiness document are addressed.

`starter-provenance.json` records format/starter/preset versions, source revision and source snapshot digest. It is provenance, not CMS content or an automatic upgrade mechanism. Source changes are refused during export; a dirty reviewed source snapshot is identified by its digest as well as HEAD.

## Failure and recovery

Occupied directories, repositories, source ancestry overlap, unsafe links/junctions, missing parents, competing files and changed source snapshots are rejected. There is no force/overwrite mode. On partial failure the CLI reports the destination and created files and preserves the partial project and unknown edits. Inspect it manually and choose a fresh empty destination for retry. Do not recursively delete a reported folder without checking its ownership and contents.

Updates to existing clients are reviewed patches that preserve their content and infrastructure. Rerunning the initializer over a client is intentionally rejected.

## Verification

`pnpm test:initialization` creates owned sibling rehearsal projects, installs each normally with the frozen lockfile and runs check/test/build/Worker dry-run for all five presets, including single-language and Articles-disabled cases. It retains the projects and per-command evidence for inspection and subsequent native CMS rehearsal. No client output is automatically removed, including on failure.

`pnpm test:presets` owns guarded staging/production builds, exact restoration/local rebuild and a source gallery browser matrix. Stop owned launchers first. Set `E2E_BROWSER_CHANNEL=chrome` to use installed Chrome, or install the Playwright browser for the default channel.

The generated trades native CMS rehearsal is `e2e/presets-cms.spec.ts`, gated by PRESET_CLIENT_ROOT and a matching provenance record. It owns distinct 4430/8890/4110/9110 ports, captures installed-schema/serializer-derived whole records before dispatch, saves via the actual editor, reloads, checks public output, stops owned processes, then restores only exact owned bytes. Conflicting bytes are preserved with evidence.
