# Production release candidates

Use local development plus one production deployment per application. Staging remains optional. These tools build and verify an isolated **blocked candidate**; they do not provision resources, authenticate to Cloudflare, publish the CMS, deploy a Worker, apply remote SQL or enable sending.

## Build and inspect

Stop the owned dev launcher first. Use Node 22 or 24 and pnpm 10.13.1. Create the strict non-secret production target described in [deployment](DEPLOYMENT.md), keeping canonical project.json local.

```powershell
pnpm check
pnpm test
pnpm release:build -- --target production --config deployment.production.json
# Use the exact artifact directory printed by the successful build:
pnpm release:verify -- --artifact .generated/releases/run-ID/artifact
```

The inert deployment.production.example.json can rehearse this workflow without an account or credentials. A successful build or verification exits 0 **only for local integrity/build success**. Its readiness remains blocked. A failed build exits 1, preserves its run directory and never seals a successful manifest. Do not treat an old artifact as evidence of the latest attempt.

Each unique run owns workspace/, artifact/, logs/ and build-report.json under .generated/releases/. The builder snapshots the explicit scripts/deployment/release-files.json runtime inventory plus canonical project/content/theme/upload bytes. It records SHA-256 hashes of the actual inputs, source revision when available, and target bytes. Uncommitted reviewed input bytes are included; a revision alone does not describe them. A newly initialized client without a commit records a null revision. Both the source inputs and target are checked again before finalization. Unknown source files, generated output, local CMS bundles, .env/.dev.vars, runtime state, Git and dependencies are not copied. Links and hidden canonical content are refused.

Only the workspace project.json is replaced with the production projection. Child commands receive an allowlisted environment and fresh configuration homes, temporary directories and empty npm configuration; cloud, AWS, Tina and secret environment variables are not inherited. No secret is required. Dependency downloads still need network access. The builder uses frozen install, typecheck, public build, a bundled Worker dry-run, migrations against a **new disposable local D1**, and a no-bundle dry-run of the packaged configuration. Source local D1 and canonical project/content are untouched. The rehearsal database uses a uniquely owned short directory under the operating system temporary folder to avoid Windows SQLite path limits in nested client workspaces; build-report.json records localState. It is retained on success or failure with the run evidence, and is never packaged. Logs are outside the artifact. Timeouts terminate only the owned command tree; failed workspaces are retained for diagnosis.

In the source starter, the initializer export inventory and release inventory must stay synchronized; tests enforce this. Independent clients have only scripts/deployment/release-files.json and maintain that list when adding runtime components, scripts, fonts or dependencies. These are hand-maintained source inventories, distinct from generated manifests. Canonical content, uploaded originals and theme directories are collected automatically. Generated clients have the same release commands without importing initializer or preset tooling. Source-only pnpm test:release creates and rehearses an independent client.

## Package and identity contract

The artifact contains assets/, bundled worker/, migrations/, non-secret project.json, identity.json, frozen wrangler.json and release.json. Runtime paths are relative and checked against the shared configuration generator, including account, custom domain, D1 UUID, derived resource names and production variables. The package records pinned tool versions and completed local checks. The checksum and exact file hashes reject unexpected, missing, modified, linked or externally referenced files. They detect accidental corruption; they are **not a digital signature** and do not protect against an owner deliberately rewriting the package and recomputing its manifest.

Configure derives one public identity from application, environment, site origin, profile and public Turnstile key. Public content pages carry it in a nonvisual meta element. The Worker consumes its generated base64 representation; verification checks that exact compiled marker. Root redirect output is checked against the selected origin and default locale instead of requiring a layout marker. Runtime HTTP, Queue, scheduled and nurture Workflow entry points compare the compiled identity with bindings before database, dispatch or provider work. A mismatch returns a generic HTTP 503 or rejects background execution. This does not prove cloud account ownership, resource entitlement, secret correctness or hosted availability.

**Hosted CMS status is always not_built in this milestone.** Local Tina output is excluded. The artifact is deliberately incomplete for launch: hosted Tina credentials, repository/content branch, native editor build and actual Access/security-header/publishing verification still need a separately authorized milestone. Never copy the local editor to make a candidate appear complete.

## Guarded command plans

```powershell
pnpm release:deploy -- --target production --artifact PATH --account ACCOUNT_ID --database DATABASE_UUID
pnpm release:migrate -- --target production --artifact PATH --account ACCOUNT_ID --database DATABASE_UUID
```

Both commands reverify the package and require the exact recorded account and database. They print structured **review plans** for the already bundled Worker or packaged migrations and exit 1 while blocked. They run no subprocess. --execute is rejected; there is no force/yes/environment override or remote executor. The legacy Wrangler wrapper still permits only its exact local/dry-run command shapes. Raw Wrangler/dashboard access remains outside this accidental-command safeguard.

Do not run a real remote command to test a negative guard. Test the pure parser/planner. Do not manually remove readiness issues or recompute a package to bypass them. A future remote executor must reverify immediately before use and require separately approved resource/secret/hosted checks and deployment authorization.

## Commissioning and recovery order

1. Review real business/legal/consent content and final target; agree and implement retention/deletion. Establish operators, alerts and a tested database recovery point.
2. Separately authorize resource setup, secret bindings, hosted Tina build, Access roles/login, Turnstile hostname/action and restricted provider delivery verification. Qualify profile capacity and record hosted evidence. [Production readiness](PRODUCTION_READINESS.md) remains authoritative.
3. Rehearse forward migrations against the relevant previous schema and representative synthetic data. A fresh local database rehearsal only proves fresh installation, not every upgrade path or remote recoverability. Inspect pending migrations and record account/database before any separately authorized remote migration.
4. Prefer compatible additive schema changes; deploy only the exact verified artifact, record its release ID and verify public/CMS/admin/forms and background behavior. Enabling actual sending and public launch require their own completed gates.
5. Retain the prior verified artifact, schema compatibility notes and tested database recovery point. On a code failure, restore compatible prior code using separately authorized release tooling. **Code rollback does not undo migrations**. For destructive/incompatible SQL, stop writes and use a separately reviewed database recovery procedure; never blindly run reverse SQL.

There is no automatic cleanup of failed runs or their recorded localState directories. An operator may archive or remove an exact verified owned run after confirming it is no longer needed; never recursively delete a computed or unverified path.

Wrangler documents [local bundle output and dry-run/no-bundle options](https://developers.cloudflare.com/workers/wrangler/commands/workers/) and [D1 migration commands](https://developers.cloudflare.com/d1/wrangler-commands/). These commands provide local evidence here; they do not establish hosted readiness.
