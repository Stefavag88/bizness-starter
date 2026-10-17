# Business Starter v2 — Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Use a fresh medium implementer and independent task reviewer per task, then one whole-branch review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a truthful local design-system showcase with four selectable themes, responsive density and EN/EL examples of the actual v2 components.

**Architecture:** Theme JSON and shared CSS own presentation. A browser-safe allowlisted URL-state module drives a local-only Astro showcase of actual renderers. Preview never writes project configuration or canonical content; no business presets are introduced.

**Tech Stack:** Existing Astro/TypeScript, theme JSON/generator, Vitest, Playwright and axe. Node 22.x || 24.x, pnpm 10.13.1; no new dependency or font installation.

**Spec:** [Approved showcase design](../specs/2026-10-17-starter-v2-showcase-design.md).

**Status:** Written spec approved on 2026-10-17. This implementation plan was approved for execution by the user on 2026-10-17. Preserve the previously selected medium subagent execution with independent review; do not ask for a new execution-method choice.

## Global Constraints

- Expose /design-system only when project.environment is local.
- Keep it outside the business header/footer navigation, locale alternatives, feed, canonical content manifest and sitemap.
- Generate no showcase output in staging/production builds, and include noindex/nofollow metadata locally.
- Changing controls updates the URL and preview attributes, not project.json, theme JSON or canonical content.
- Do not use localStorage, cookies, service workers or API writes.
- Keep preview scripts and styles external/bundled, compatible with the existing self-only public Content Security Policy.
- Preserve its existing self-hosted Noto Sans coverage for Greek and Latin. Do not copy unavailable font stacks or install new fonts.
- Keep Neutral and the configured current theme unchanged. Do not lower contrast thresholds to import a reference palette.
- Density factors are compact 0.75, comfortable 1, spacious 1.25; use mobileSectionSpace at the existing mobile breakpoint.
- Render actual shared Button, Field, Card, RichText and registered section components rather than visual copies.
- No new Tina collection, persisted field or schemaVersion change is needed.
- Neither reference repository may receive builds, installs, writes or process stops.
- No sending, deployment, provisioning, migration CLI, merge, push or tag is included here. All Markdown is English.

## Review Focus

1. Unknown/prototype-like/duplicate URL values must not inject attributes or select nonexistent registry entries; unrelated query keys and anchors survive changes/reset. Task2 owns pure cases, Task4 owns browser replay.
2. Language switches must not leave focus inside hidden samples or duplicate IDs; every sample link must resolve to an available route even when articles are disabled. Task3 owns fixture contracts, Task4 owns real DOM/link checks.
3. A development tool must not leak into staging/production output or disappear only from navigation while its asset remains deployed. Task4 owns real environment builds and artifact checks.
4. Static Astro may inline small scripts and dev mode does not necessarily enforce asset CSP. Task3 must ensure emitted executable code is external, and Task4 verifies the built local page under the actual self-only policy.
5. Preview/build acceptance must preserve concurrent configuration edits, source bytes and unrelated processes on success, failure or timeout. Task4 owns guarded restoration and owned-command failure tests.

## Isolation and interfaces

Work in C:/Projects/bizness-starter-v2 on codex/starter-v2-showcase; preserve accepted Composition A branch/history. Before implementation establish a plan-specific SDD workspace/ledger and inspect the actual live launcher. Last recorded owner is session50604, children content4332/Tina19888/Worker18912/site34452. Revalidate those identities before using its own Ctrl+C handler. Stop it before schema/configure/build work; never select a process to kill by port/name. Restart the new project's dev:cms stack after final acceptance if its default ports remain free. All port overrides remain supported.

Both reference repositories remain read-only: bizness-starter HEAD7473c0839dca8fadb7d7a8f9cc459cab79aba94f and financial-consulting-example HEAD0e1e5988dcdcba508300099ccab2643daedf1aad. Record HEAD/status before and after without opening secrets. Use existing installed Chromium via PLAYWRIGHT_BROWSERS_PATH=C:/Projects/bizness-starter-v2/.generated/browsers. Do not rebuild native CMS beside a watcher or download another browser.

| File boundary | Responsibility |
| --- | --- |
| packages/design-system/themes/*.json | Source themes; generated CSS/registry remain configure outputs |
| packages/config/project.mjs and shared global.css | Accepted density values and one responsive spacing policy |
| apps/site/src/lib/design-preview.ts | Pure URL state, with no filesystem or server imports |
| apps/site/src/components/showcase/ | Typed deterministic sample adapter and actual component rendering |
| apps/site/src/layouts/ShowcaseLayout.astro | Developer shell, shared CSS/fonts, language and noindex, without business branding |
| apps/site/src/pages/design-system/[...index].astro | Local-only static route and initial allowlisted options |
| apps/site/src/scripts/design-preview.ts | DOM controller; no writes/storage/dynamic HTML |
| scripts/verify-showcase-builds.mjs | Owned environment builds and exact project restoration |

Planning clarifications: spacious requires the additive ProjectConfig enum change discovered in the source; schemaVersion remains2. The component fixtures support en/el only. Select configured en/el sample languages in project order; prefer the project default when supported, otherwise explicitly label the first supported sample as a sample-language choice. With no supported sample language, show an actionable local notice and no interactive sample toolbar. Never fabricate public translations or change site routing. The developer shell can stay English with lang=en on its text, while document/sample language follows the selected sample.

### Task 1: Restore source themes and functional shared density

**Files:** Create packages/design-system/themes/{trades,accommodation,wellness}.json and tests/design-themes.test.ts. Modify packages/config/project.mjs, tests/project-config.test.ts, apps/site/src/styles/global.css. Extend project.d.mts only if its actual inferred contract needs it; do not hand-edit generated outputs.

**Interfaces:** Existing themeByName/validateTheme/themeCSS/validateDesign signatures stay unchanged. ProjectConfig.design.density accepts comfortable|compact|spacious. Introduce --density-factor and --section-space-effective: the latter is the selected desktop/mobile theme base times that factor. Generic section padding uses it; preserve existing Comfortable hero/component overrides.

- [ ] Write red tests: all four named themes validate/generate semantic CSS; all font roles retain Noto Sans; neutral JSON and current project configuration are untouched; spacious parses and invalid density rejects. Test existing contrast protections with a deliberately invalid palette rather than asserting only registry presence.
- [ ] Author the three complete v2 JSON records using inspected read-only palettes as reference. Starting values: Trades canvas#f5f8fb/ink#163249/accent#185f8a/mutedSurface#e5edf3/radius6px/desktop64/mobile48; Accommodation #f8f4ed/#292c36/#715437/#eee5d7/8px/96/72; Wellness #faf5f0/#303b35/#725269/#eee5ec/16px/112/80. Keep semantic roles complete, copy current supported font stacks and retain valid feedback/control colors. Adjust only a failing palette value if needed to pass the unchanged validator; record the reason.
- [ ] Add spacious to the project density enum and implement shared density tokens at desktop and max-width640px. Remove the competing hardcoded compact rule. Comfortable default output must retain its current spacing; hero-specific rules must not be accidentally replaced by a generic selector. Unsupported hero/card layout metadata is not a new variant implementation.
- [ ] Run pnpm exec vitest run tests/design-themes.test.ts tests/project-config.test.ts, pnpm configure and pnpm check. Commit feat: restore starter themes and responsive density.

### Task 2: Define safe, replayable preview URL state

**Files:** Create apps/site/src/lib/design-preview.ts and tests/design-preview.test.ts.

**Interfaces:** Export PreviewState={theme:string;density:'compact'|'comfortable'|'spacious';lang:string}; PreviewOptions={themes:readonly string[];languages:readonly string[];defaults:PreviewState}. Export resolvePreviewState(params:URLSearchParams,options:PreviewOptions):PreviewState and previewURL(current:URL,state:PreviewState|null):URL. Null means reset: remove only theme/density/lang. A state value replaces all duplicates of those keys and retains other parameters, pathname and hash. Inputs remain unchanged. URLSearchParams.get defines first-value resolution for duplicate incoming keys.

- [ ] Write red cases for configured defaults, valid bookmarked choices, invalid/empty/constructor/__proto__/script-like values, unsupported locale, duplicated preview keys, unknown unrelated keys, #controls anchor and immutable inputs. With defaults trades/compact/el, fallback and reset must not silently return neutral/comfortable/en.
- [ ] Implement exact allowlist membership using arrays/own membership, without filesystem, generated CSS imports, storage or window dependency. Options are validated server-supplied supported choices; the module does not guess a locale/theme from arbitrary text.
- [ ] Run pnpm exec vitest run tests/design-preview.test.ts and pnpm check. Commit feat: add safe showcase preview state.

### Task 3: Render the actual system and connect preview controls

**Files:** Create components/showcase/{samples.ts,Showcase.astro}, layouts/ShowcaseLayout.astro, pages/design-system/[...index].astro, scripts/design-preview.ts and styles/showcase.css under apps/site/src. Create tests/showcase-samples.test.ts. Modify existing UI components only for a concrete shared sample-state requirement; keep their public behavior unchanged.

**Interfaces:** Export createShowcaseSamples(content:LocalizedContent):{locale:string;sections:LocalizedSection[];content:LocalizedContent} from samples.ts. Return detached presentation fixtures using valid existing localized page destinations, not invented unavailable editorial routes. Prefix all section, field and help/error IDs with showcase plus locale and instance. Render sectionRenderer(type,'default') with hero primary=false; the shell owns the only H1. Only derive/render supported configured en/el groups server-side. Client code imports Task2 functions and generated browser-safe theme metadata, never lib/content or filesystem modules.

- [ ] Write red sample tests for all six registered types, repeated unique instance/control IDs, detached canonical input, valid destinations and an articles-disabled localized catalog. Keep the synthetic ArticleList demo visibly labelled even when it uses a valid available contact destination; do not imply disabled public articles exist. No fixture is written to content/.
- [ ] Build the local-only route using getStaticPaths with an optional rest parameter: one root path locally, none for staging/production. Render a fixed developer shell, noindex/nofollow, meaningful configured-default examples, anchor navigation and a homepage link. Reuse shared foundation/generated/global CSS and self-hosted fonts; scope only showcase layout styles. Never add links to the business header/footer or content manifests.
- [ ] Render real shared controls/cards/rich text and all six renderers, not CSS lookalikes. Demo forms cannot submit; disabled button and labelled help/error states are explicit. Add fixed role-based swatches using external CSS variables, plus text token values from the selected theme. Distinguish theme choice from business presets and tell developers where permanent settings live. Unsupported layout metadata is informational only.
- [ ] Connect labelled theme/density/language selectors and reset, initially disabled. Initialize from current URL, enable controls only after ready, apply allowlisted data-theme/data-density/document language and hidden sample groups, and update token text with textContent. Keep keyboard focus on the initiating toolbar control; on programmatic/popstate language switches, move focus to the sample-language control before hiding a group containing focus. On user changes use pushState; on popstate apply without adding history; reset removes only preview keys. No local/session storage, cookies, API requests, innerHTML or query-derived inline style/script.
- [ ] Ensure actual emitted executable preview code stays external under the existing CSP, including Astro's small-script handling. Reuse supported installed Astro mechanisms verified from the local compiler/config; do not relax CSP or hand-author generated chunks. Provide a short noscript message and leave configured-default examples readable with selectors disabled.
- [ ] Run focused sample/state/theme tests, pnpm check and local static build. Inspect script/style output for CSP compatibility. Commit feat: add local design-system showcase.

### Task 4: Browser, environment exclusion and handoff acceptance

**Files:** Create e2e/design-system.spec.ts, scripts/verify-showcase-builds.{mjs,d.mts}, tests/showcase-builds.test.ts, docs/DESIGN_SYSTEM_SHOWCASE.md and docs/superpowers/plans/2026-10-17-starter-v2-showcase-evidence.md. Modify package.json with test:showcase-builds, docs/{QUICKSTART,ARCHITECTURE,FOUNDATION_DECISIONS}.md and AGENTS.md only for current guidance.

**Interfaces:** Export verifyShowcaseBuilds({path='project.json',backupRoot='.generated/showcase-builds',run,refresh}={}):Promise<void>. Use existing createOwnedFileEdit and runOwnedCommand. For staging/production create a separate owned edit from the exact original, change only environment, configure/build, assert no dist/design-system output and no manifest/feed/nav entry, restore in finally. Run local configure/build last from restored original; assert local index output and retain exact restoration/command/teardown proof. A missing run override uses bounded real configure/Astro build commands; default120000ms stage timeout, SHOWCASE_BUILD_TIMEOUT_MS override. Package command is node scripts/verify-showcase-builds.mjs.

- [ ] Write red verifier cases for successful local/staging/production behavior, build failure, timeout and concurrent project edit. Existing external edits remain preserved; cleanup stops only owned children and does not blindly overwrite or regenerate from a conflicted file. Validate resolved deletion/cleanup paths, and retain original bytes/evidence before mutation.
- [ ] Add Playwright coverage driven by E2E_BASE_URL: default and bookmarked preview, all four computed palettes, factors .75/1/1.25 above/below640px, reset preserving other query/hash, reload, Back/Forward, invalid URL inputs, EN/EL document/sample language, hidden-focus recovery, unique IDs/one H1, valid example URLs and keyboard controls. Check no overflow at375/768/1440, visible focus and representative screenshots/axe; no accessibility certification claim. Compare Comfortable Home/Contact baseline spacing against the pre-change contract and verify business pages ignore preview query parameters.
- [ ] Assert selectors are disabled and default examples readable with JavaScript off. Snapshot content/project/theme bytes before preview actions and prove unchanged afterward. Monitor contact/newsletter/native mutation endpoints for zero writes, and assert local/session storage/cookies are unchanged. Keep tests read-only; no canonical fixture mutation is needed.
- [ ] With all native/site watchers stopped, run pnpm test:showcase-builds, pnpm check and pnpm test once. Run Worker dry-run if generated asset configuration changed; otherwise retain previous backend evidence. Do not repeat native save/profile suites without a concrete boundary change. Local build must be last and production artifacts must never retain the showcase.
- [ ] Serve the final local build through a newly owned local Worker using configured ports and existing generated _headers. Run the showcase browser suite against that built origin so actual self-only CSP/external scripts are exercised rather than bypassed by dev behavior. Assert no CSP violations or external font requests. Stop that owned tree afterward, verify source snapshots unchanged and restore/restart the new project's originally owned dev:cms launcher if ports are free. Open /design-system for the user after readiness checks; leave business routes available.
- [ ] Document URL preview/reset, permanent configuration, sample locale limits, local-only exposure, four themes, density semantics and the next Composition B step. Record commands, actual counts, screenshots, unchanged config/content/source hashes and teardown. Self-review and commit test: verify showcase isolation and document usage. Root then obtains independent Task4 and whole-branch review, preserves decisions and the local branch; no merge/push/tag/deploy.

## Plan self-review and handoff

Coverage: themes/density have Task1; pure state Task2; actual renderers, static route, controller and CSP-safe output Task3; responsive/browser/no-JS/production exclusion/ownership/docs Task4. The five Review Focus inputs each have explicit covering tests. Shared interfaces use the same PreviewState/options/query keys and existing LocalizedContent/section renderer types. The plan does not add public preview overrides, CMS fields, a business preset selector, new section variants or a media library. Defaults and samples remain distinct from canonical content.

The user has already selected medium subagents with independent task reviews. After written plan review, execute continuously across the four tasks and final review, without asking between tasks. Later roadmap packages require their own concrete specs/plans; this approval does not silently implement Composition B/C or stages3/4.
