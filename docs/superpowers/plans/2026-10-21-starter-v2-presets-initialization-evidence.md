# Presets and independent initialization evidence

Date: 2026-10-21. Platform: Windows, Node 24.12.0, pnpm 10.13.1, Astro 7.3.6, TinaCMS 3.14.3 / CLI 4.0.1. Browser: installed Chrome through Playwright 1.63.0.

## Implemented scope

Five bilingual preset bundles, safe standalone CLI export, explicit preview render context, local source gallery/full-page previews, independent client verification and native CMS roundtrip. Source branch: `codex/starter-v2-presets`, based on `56ea47d`. The financial example and original starter were not changed. No provisioning, deployment, remote migrations or real sending occurred. Production remains blocked.

## Independent applications

`pnpm test:initialization` generated five sibling applications under `C:/Projects/.starter-rehearsal-clmKGW`. Each installed its own dependencies with `pnpm install --frozen-lockfile`; no source node_modules copy or junction was used. Each passed its own `pnpm check`, `pnpm test`, `pnpm build` and `pnpm worker:check`. Each starts with a fresh unborn Git branch and no remote. Gallery marker, preset packages/entries, source caches and initializer are absent. All have local enquiries defaults with sending/marketing and review flags false.

| Preset | Languages / default | Articles | Independent gates |
| --- | --- | --- | --- |
| neutral | en, el / en | true | Pass |
| professional-services | el / el | false | Pass |
| trades | en, el / el | true | Pass |
| accommodation | en, el / en | true | Pass |
| studio | en / en | false | Pass |

The complete per-command report is the retained sibling `evidence.json`; per-command logs are alongside it. Client tests validate their own canonical content and published Home/Contact routes without neutral sample text/IDs. Install warnings about ignored optional better-sqlite3/core-js scripts and pre-existing unused declarations in CMS source did not prevent the checks, builds or real editor session. They are not hosted compatibility claims.

A real Greek-only/Articles-disabled build exposed empty JSON dataset inference as never[] in Worker consumers. `tests/manifest-types.test.ts` reproduced the failure with a detached compiler-host projection; the contract-typed Worker manifest adapter made it pass. The full five-client matrix was repeated after that fix.

## Native generated-project editing

A separately initialized and normally installed bilingual/default-Greek trades client at `C:/Projects/.starter-rehearsal-clmKGW/cms-trades` ran its own site/Worker/Tina/datalayer on 4430/8890/4110/9110. Command:

```powershell
$env:PRESET_CLIENT_ROOT='C:/Projects/.starter-rehearsal-clmKGW/cms-trades'
$env:E2E_BROWSER_CHANNEL='chrome'
pnpm exec playwright test e2e/presets-cms.spec.ts
```

Result: **1 passed**, 36.4 seconds. The browser edited the Greek Home hero title and default-language Offering body through native controls, saved, fully reloaded, and verified public /el, /el/services/planning-session and /en output. Both complete records were derived before dispatch from the native request, installed schema, GraphQL coercion and installed serializer. The Page template key is preserved according to collection.templates, rather than assumed absent. No raw write request substituted for the editor.

Evidence: `cms-trades/.generated/preset-cms/run-e4eTq8`, including pre-dispatch requests/complete records, schema-derived hashes, saved hashes, launcher log and source backups. Owned processes stopped before restoration. Both canonical files exactly match their original backup bytes after the run (independently rechecked).

Earlier harness attempts are retained: one refused an expected-byte mismatch because Page serialization must retain _template, and left that client’s saved bytes untouched; another restored its owned Page save but exposed same-URL nested-editor state and stale generated CMS assets during startup. The accepted run uses a fresh client, unique full-navigation URLs and indexed GraphQL readiness. No refused file was overwritten to manufacture a passing result. The original conflicting rehearsal is preserved under the separate `trades/.generated/preset-cms` evidence directory.

## Gallery and output isolation

The EN/EL gallery/preview matrix covers 375, 768 and 1440 pixels, keyboard entry, no horizontal overflow, internal links, contact/privacy, locale changes and a Room detail with an independent theme. **6 browser cases passed**. No mutating business requests or subscriber/preference storage changes occurred. Disabled preview fields/buttons and missing form endpoints are also covered by Astro render tests.

`pnpm test:presets` performs actual staging and production builds, verifies missing gallery routes and fingerprinted dedicated JS/CSS, restores exact canonical bytes, rebuilds local output last, and runs the browser matrix with an owned stack. Reusable sample PNGs, business assets and shared themes remain valid. A regression test permits the local-only gallery to link to /design-system without weakening nonlocal checks. Final artifact inventories and source ownership records are retained under `.generated/presets-artifacts`.

## Safety and focused regressions

Tests cover explicit export inventory/secret exclusion, changes to selected files and the inventory, strict argument parsing/PowerShell command quoting, no-write dry runs, source ancestry and junction rejection, empty/occupied destinations, preserved competing files with concrete created-file reports, independent Git initialization, safe reset settings, language/theme/article bundle variants, validated required original media and preview prefix/link/form/visitor isolation.

Initialization failure preserves partial output and unknown edits. Rehearsal applications are intentionally retained for inspection; no recursive project cleanup is performed. Review removal of those directories separately if disk space is needed.

## Limits

These are local application/browser/build proofs. They do not certify every OS/browser, hosted Access/Tina authentication, SES/Turnstile, production resource isolation or data retention. The owner has not supplied hosted identities/resources or an agreed retention policy. See [production readiness](../../PRODUCTION_READINESS.md), [presets](../../PRESETS.md) and [initialization](../../INITIALIZATION.md).

## Final verification before independent review

- `pnpm check`: pass, 75 Astro files, zero errors/warnings/hints.
- `pnpm test`: 1085 root tests passed, one explicitly skipped; 44 Astro renderer/browser-library tests passed.
- `pnpm test:presets`: staging and production exclusion, exact canonical restoration and local rebuild passed; six Chrome viewport/locale browser cases passed again.
- `pnpm worker:check`: passed local dry-run; no upload/deployment.
- `pnpm deploy:check`: intentionally failed because production prerequisites remain unconfigured.
- `git diff --check`: passed.

The source local build contains 416 pages including previews; nonlocal builds retain only ordinary application output. Source restoration evidence reports `restored: true`, `conflict: false`, with original/final project hash `2c7bcfdb5421457f5e61c35702a41f82d70b4d9bea1000720f8a83f313a11088`.

The execution ledger and final independent review are archived alongside this report at closeout. Their findings/rulings take precedence over any earlier pending-status wording in historical planning documents.
