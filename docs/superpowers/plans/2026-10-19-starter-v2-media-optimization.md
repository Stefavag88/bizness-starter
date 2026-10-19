# Stage 3A Responsive Media Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Serve bounded responsive static image derivatives without changing design, canonical content or Tina authoring.

**Architecture:** A server-only Sharp pipeline reads one validated source snapshot, shares content-addressed cached variants, and publishes only assets demanded during the current build. Astro connects the same session to rendering and exact-file local serving; SectionImage supplies layout-specific responsive markup.

**Tech Stack:** Existing Astro 7.3.6, TinaCMS, Zod, TypeScript, Vitest, Playwright and Cloudflare static assets; explicit Sharp 0.35.5.

**Spec:** [Approved media design](../specs/2026-10-19-starter-v2-media-optimization-design.md).

## Global Constraints

- Work in C:/Projects/bizness-starter-v2 on codex/starter-v2-media-optimization; preserve b49ae65 and both read-only reference repositories.
- Preserve schemaVersion 2, media {src,crop}, stable IDs, translations, publication, current design/crop frames, lazy loading and async decoding.
- Default project.media.optimization: enabled=true, widths=[320,640,960,1440,1920], quality=80. Widths: ascending unique integers 160–2560, one through six entries. Quality: integer 40–95.
- WebP plus original-format PNG/JPEG fallback; WebP source needs one family. PNG remains lossless and transparent. AVIF is deferred. Never upscale; maximum six widths/twelve outputs per source. Two simultaneous transform jobs maximum.
- Preserve source limits: 20 MiB, 20,000 pixels per side, 40 million pixels, local one-decode path/format/regular-file/symlink containment protections. Encode the exact validated Buffer snapshot.
- Keep originals public and unchanged. No generated URL in canonical content, browser encoder, runtime Worker transform endpoint, remote fetch or visitor-controlled encoding API.
- Sharp 0.35.5 becomes an exact root dependency; no other upgrades. Developer optimization policy stays outside the structural CMS descriptor.
- Before any configure/check/build/CMS command, verify and stop the existing owned launcher tree; never run overlapping checkout builds. Preserve its inventory for final restart. Pure temporary-root tests may run independently.
- English Markdown and retained raw evidence. No hosted setup, sending, deployment, merge, push, tag or release.
- Execute sequentially with fresh medium implementers and independent medium task reviewers; finish with the most capable available model at medium for whole-branch review. Preserve the existing selected method.

## Review Focus

1. A source changes between validation and encoding: outputs must use the validated bytes, not a second pathname read (Task 1).
2. Interrupted or concurrent cache writes, including forged cache manifests: no partial output, escape or stale reuse (Task 2).
3. Short galleries/Room lists have fewer columns than the grid maximum: sizes must match actual rendered widths, including one-item layouts (Task 4).
4. Warm local cache contains showcase-only assets before production build: publish only current rendered demand (Tasks 3 and 6).
5. Restoration loses ownership or shutdown fails: independently restore eligible sources, retain dependent images, and refuse subsequent configure/build (Task 5).

---

## File and interface map

- packages/config/project.mjs and project.d.mts: strict MediaOptimization configuration/defaults; tests/project-config.test.ts.
- package.json and pnpm-lock.yaml: explicit root Sharp ownership; packages/media/source.mjs and new source-reader.mjs: public metadata facade versus private validated bytes; matching .d.mts declarations.
- New packages/media/optimization.mjs: pure width policy and encoder; cache.mjs: bounded atomic disk cache; session.mjs: demand/session ownership; each has matching .d.mts declarations and focused tests.
- New apps/site/src/integrations/media.mjs: Astro lifecycle and Vite middleware; astro.config.mjs registers it. apps/site/src/lib/section-media.ts remains the contextual adapter.
- New packages/media/layout.mjs and .d.mts: browser-safe sizes policy, separate from server modules. SectionImage.astro and its four callers pass layout roles; global.css only accommodates picture inside existing frames.
- New e2e/helpers/media-optimization-fixture.ts and media-optimization-cleanup.ts, tests/media-optimization-cleanup.test.ts, e2e/media-optimization.spec.ts, e2e/media-optimization-cms.spec.ts, scripts/verify-media-optimization.mjs: owned acceptance and raw evidence.
- New tests/fixtures/media-optimization/README.md plus large-photo.jpg, portrait.jpg, alpha.png, small.png and animated.webp: fixture provenance and checksums; not public starter defaults.
- New docs/MEDIA_OPTIMIZATION.md and docs/superpowers/plans/2026-10-19-starter-v2-media-optimization-evidence.md; update existing media/authoring/development docs only where their behavior changes.

Public contracts (declare once and consume consistently):

- MediaOptimization = {enabled:boolean; widths:number[]; quality:number}; ProjectConfig.media.optimization is fully defaulted.
- Existing SourceMedia remains {src,width,height,format,fingerprint}. readValidatedSource(root:string,src:string):Promise<{media:SourceMedia;bytes:Buffer;pages:number}> is server-only; resolveSourceMedia retains its existing signature and shape.
- candidateWidths(sourceWidth:number,widths:number[]):number[]. ImageCandidate = {src:string;width:number;height:number;format:'png'|'jpeg'|'webp';bytes:number}; ResponsiveMedia = SourceMedia & {fallback:ImageCandidate[];webp:ImageCandidate[];passthroughReason?:'disabled'|'animated-or-multipage'}.
- createMediaSession({root:string,policy:MediaOptimization,mode:'build'|'dev'}):MediaSession. MediaSession has resolve(src:string):Promise<ResponsiveMedia>, publish(outDir:string):Promise<void>, asset(urlPath:string):Promise<{bytes:Buffer;contentType:string}|undefined>, close():Promise<void>. The asset method serves only exact already-demanded cache identities; it does not transform.
- A root-keyed server-only session registry exposes beginMediaSession(options):MediaSession, getMediaSession(root:string):MediaSession, endMediaSession(root:string):Promise<void>. Astro owns registration; direct test harnesses explicitly own their sessions. No lazy cross-build singleton state.
- ResolvedMedia becomes ResponsiveMedia; resolveSectionMedia(media,context) keeps its current inputs/undefined/error behavior and calls the active session. Context remains pageId/sectionId/itemId.
- ImageLayout = 'media-text'|'gallery'|'gallery-featured-lead'|'gallery-featured-item'|'room-card'|'room-detail'; imageSizes(layout:ImageLayout,itemCount:number):string. SectionImage gains required layout and optional itemCount=1 props; existing ratio/crop/alt/caption/locale props remain.

Cache: .generated/media-optimization/cache/v1, with a pipeline marker, content-addressed immutable entries and manifests. Publication: /_media/v1/<sha256>.<extension> in the actual Astro output directory, never public/uploads. Hash input includes source bytes, width, format, quality, Sharp version, pipeline version and orientation/encoding policy. Verify manifest identity and output byte hash/decoded dimensions before reuse. Reject symlink/reparse destinations and escaping paths. Only clean owned marked namespaces; never canonical uploads. Keep session demand separate from persistent cache inventory.

### Task 1: Configuration and validated source ownership

**Files:** Root dependency/lock, config files, source facade/reader/declarations; tests/project-config.test.ts and tests/media-source.test.ts.

**Interfaces:** Produce MediaOptimization and readValidatedSource; preserve SourceMedia/resolveSourceMedia.

- [x] Write failing tests for absent/partial/full policy defaults, unknown nested keys, duplicate/unordered widths, 0/7 entries, fractional/out-of-range widths/quality and disabled mode; assert createCmsDescriptor output is unchanged by optimization settings. Extend source tests to assert one validated read feeds fingerprint/metadata/returned bytes, bounded source checks remain, and pages identifies multipage input without changing the public metadata shape.
- [x] Run pnpm exec vitest run tests/project-config.test.ts tests/media-source.test.ts; retain RED output for new behavior.
- [x] Add exact root sharp:0.35.5 with pnpm add -w -E sharp@0.35.5; inspect lock diff for unrelated version drift. Use its direct import consistently, including test utilities. Extract private byte reading, preserve all containment and bounds checks, and default nested config with strict schemas.
- [x] Run the same tests and pnpm check; expect all passing and no server media import reachable from CMS/client modules. Commit feat: define bounded media policy and source snapshots after independent review.

### Task 2: Encoder and content-addressed cache

**Files:** New optimization/cache modules and declarations; tests/media-optimization.test.ts, tests/media-cache.test.ts; provenance fixtures.

**Interfaces:** Consume validated snapshot and policy; produce ResponsiveMedia candidate families for sessions. Export candidateWidths and resolveCachedMedia(root:string,snapshot:Awaited<ReturnType<typeof readValidatedSource>>,policy:MediaOptimization):Promise<ResponsiveMedia> from cache.mjs.

- [x] Write test `candidateWidths caps without upscaling` with `expect(candidateWidths(1000,[320,640,960,1440,1920])).toEqual([320,640,960,1000])`, `expect(candidateWidths(200,[320,640])).toEqual([200])` and `expect(candidateWidths(4000,[320,640,960,1440,1920])).toEqual([320,640,960,1440,1920])`. Add actual-byte tests. Assert dimensions, alpha, normalized EXIF orientation, lossless PNG fallback, format counts, corrupt payload rejection, animated passthrough and zero derivatives when disabled. Acquire one redistributable large photographic fixture with verified original source/author/license and checksum recorded before use; do not import business reference photos. Generate orientation/alpha/small/animation fixtures from owned or licensed inputs and document recipes.
- [x] Add cache tests for identical source reuse across paths/locales, changed bytes at the same path, quality/pipeline changes, missing/corrupt output, concurrent identical requests, two-job ceiling, interrupted writes, forged metadata and destination symlink/escape. A controlled pathname replacement after read must still encode the original snapshot. Decode actual outputs rather than asserting names alone.
- [x] Run pnpm exec vitest run tests/media-optimization.test.ts tests/media-cache.test.ts and retain failing evidence.
- [x] Implement rotate/resize without upscaling, WebP and original-format output; cache immutable validated entries via atomic temporary writes and in-flight deduplication. Use the global two-job semaphore around transforms. Multipage and disabled cases retain original presentation with explicit reason, empty candidate arrays and no encode. Encoder errors propagate; do not fall back silently. Omit the optional equal-dimension original substitution in this increment to keep the renderer contract simple.
- [x] Repeat tests; require passing real output assertions. Commit feat: cache bounded responsive image variants after review.

### Task 3: Build demand and contained development delivery

**Files:** session modules/declarations, integration/media.mjs, astro.config.mjs, section-media.ts; tests/media-session.test.ts and tests/media-integration.test.ts.

**Interfaces:** Implement the session/registry contracts above; adapter produces ResolvedMedia with existing contextual error wrapping.

- [x] Test fresh build sessions, shared source deduplication, publish only demand, disabled/no-image zero work, no cross-build demand, exact known dev GET/HEAD delivery and rejection of unknown/traversal/query-generated requests. Seed warm cache with local-only demand, then assert a new nonlocal session never publishes it. Test close/error cleanup and original-byte replacement yielding fresh URLs/dimensions.
- [x] Run pnpm exec vitest run tests/media-session.test.ts tests/media-integration.test.ts; capture RED.
- [x] Register sessions in supported Astro build-start/server-setup lifecycle; publish after rendering into build:done dir, await all jobs before success, close on completion/error/server close. Dev middleware serves exact demanded assets with correct MIME/length and immutable content-addressed caching; visitors cannot cause transformations. Preserve current upload refresh events. Resolve policy from parsed project config, never CMS descriptor. Maintain actionable page/section/item/source errors and no Worker route changes.
- [x] Repeat tests and pnpm check; build a temporary minimal media page and assert referenced files exist. Commit feat: publish demanded media as static assets after review.

### Task 4: Responsive markup matched to existing grids

**Files:** layout modules/declarations, SectionImage.astro, MediaText.astro, Gallery.astro, RoomList.astro, RoomDetail.astro, global.css; tests/media-layout.test.ts and apps/site/tests/media-optimization.test.ts; add that exact file to apps/site/vitest.config.ts include.

**Interfaces:** Consume ResponsiveMedia, ImageLayout and imageSizes. Pass actual rendered item count from gallery/Room list; featured first item gets lead role.

CSS-derived sizes rules: define W as calc(min(100vw, 72rem) - clamp(2.5rem, 8vw, 6rem)). Media-text uses W below 768px and calc((W - 2rem)/2) above. Normal gallery/Room cards use up to three auto-fit columns, bounded by itemCount: two columns become possible at 39.130435rem, three at 59.782609rem (17rem minimum and 2rem gaps); widths are W, (W - 2rem)/2 or (W - 4rem)/3. Featured lead is W; featured others use W below 768px and (W - 2rem)/2 above. Room detail is calc(min(100vw, 58rem) - clamp(2.5rem, 8vw, 6rem)). Emit expanded valid sizes expressions, not symbolic W. Current density only changes vertical section spacing, so all three densities share these expressions.

- [x] Write tests for each role, one/two/three-plus items, breakpoints and capped containers. Component assertions cover source type/image srcsets, fallback dimensions, sizes, alt/safe caption, crop classes, lazy/async, passthrough original and no-image behavior; use existing Astro component test configuration.
- [x] Run pnpm exec vitest run tests/media-layout.test.ts and pnpm exec vitest run --config apps/site/vitest.config.ts; retain new-test RED.
- [x] Render picture only for derivative families; select largest fallback as img src with its intrinsic dimensions, width-descriptor srcsets and correct sizes. WebP originals need no duplicate source family. Preserve original img for passthrough. Ensure picture fills the fixed frame and existing image CSS still applies. No section spacing or typography changes.
- [x] Repeat tests; expect passing. Commit feat: render layout-aware responsive images after review.

### Task 5: Fault-tested acceptance ownership

**Files:** New acceptance fixture/cleanup helpers, tests/media-optimization-cleanup.test.ts, verification entry point/package script test:media-optimization.

**Interfaces:** Reuse canonicalSnapshot/assertCanonicalSnapshot, owned file/media helpers and installed serializer preflight. The new verification command owns only its child processes and unique .generated/media-optimization/acceptance-* directory.

- [x] Before any canonical fixture mutation, write fault tests for full project/content/uploads snapshot gates, pre-write owner conflict, awaited independent restoration, one failed sibling restore, dependent media retention after document conflict, false restore results, process shutdown failure and refusal to regenerate while unsafe. Retain ledger outcomes for every eligible cleanup action.
- [x] Run pnpm exec vitest run tests/media-optimization-cleanup.test.ts; retain RED.
- [x] Implement fixtures and command orchestration using existing ownership boundaries rather than broad reset/delete. Support separate pure/static/native runs, command/PID/time/log inventories and final snapshot comparison. Stop only verified owned launcher trees before configure/build/CMS; ports are checks, not ownership. Private acceptance runtime state only, no source D1 migration. Never overwrite external changes.
- [x] Repeat fault tests and a no-mutation orchestration smoke; expect passing and unchanged canonical hashes. Commit test: guard media acceptance lifecycle after review.

### Task 6: Browser, static Worker, Tina and performance proof

**Files:** New browser/native specs and evidence doc, MEDIA_OPTIMIZATION.md; verification entry point and existing related docs as needed.

**Interfaces:** Consume reviewed helpers and public render/session contracts. No new production behavior except fixes returned through the responsible implementer/reviewer.

- [x] Add failing acceptance assertions covering all five layout roles plus featured lead/item, EN/EL at 375/768/1440, DPR 1/2, JS/no-JS, themes/densities, item counts 1/2/3/4, preserved crop/alt/caption/dimensions/no overflow. Compare measured frame width to evaluated sizes within rounding tolerance; inspect currentSrc and successful loads. Keep representative axe audits and screenshots, not a redundant full Cartesian screenshot set.
- [x] Add actual built Worker static delivery tests: derived files return correct MIME/CSP-compatible loads without runtime transformation; unknown paths never generate output. Exercise warm-cache local/staging/production inventories, optimization-off, Rooms/articles-off and representative profiles. Add live upload add/change/unlink/same-path replacement checks. Tina native select/clear must persist original /uploads references, unchanged unrelated ASTs and no generated URLs; preflight installed request/schema/serializer ownership before dispatch.
- [x] Run pnpm test:media-optimization -- --pure then --static then --native; retain initial failures, implement only test wiring and route fixes to owners. Produce actual per-candidate dimensions/byte tables and browser selected-transfer evidence showing large-photo savings against the original; report small/PNG exceptions honestly. Retain animation passthrough reason and provenance.
- [x] With the owned live launcher stopped, run pnpm check, pnpm test, pnpm build, pnpm worker:check, pnpm cms:local-build, pnpm test:static-routing and pnpm test:showcase-builds sequentially behind snapshot gates. Every command must exit 0; conditional native tests require separate explicit live proof. Preserve failed runs and repairs rather than describing a segmented run as one green invocation.
- [x] Document defaults/overrides/rebuild requirement, supported formats/limits, sizes roles, source-versus-cache ownership, local dev/static production, animation/AVIF limitations, cache recovery and storage/build cost. Record raw paths/hashes/inventories, cleanup results and known limits in evidence. Commit docs/test: verify responsive media delivery after task review.
- [ ] Obtain independent whole-branch review at medium on the most capable available model; resolve findings and perform scoped re-review. Archive permanent task/review evidence before removing only verified owned scratch. Restore canonical state, restart the owned local site/CMS if previously running, and report tested behavior and remaining limits. No release or remote operation.

## Plan self-review

Spec requirements map to Tasks 1–6: policy/source safety (1), outputs/identity/format limits (2), publication/dev lifecycle (3), responsive layout/design compatibility (4), safe mutation (5), real acceptance/performance/docs (6). All five Review Focus conditions have explicit tests. SourceMedia stays backward-compatible; ResponsiveMedia and session signatures are consistent across consumers. The plan deliberately excludes AVIF, background images, cleanup of originals and hosted certification. Implementation waits for written-plan review; the selected execution method is already recorded.

## Implementation closeout

All six implementation tasks and the single final fix wave are independently accepted at product commit ece55ba. Final check/test: 756 root passed, one conditional skip, 24 site passed. Scoped built WebP proof passed with exact demand/publication equality. Earlier broad gates remain attributed to their recorded source, not rerun implicitly. Permanent review archive: ../reviews/2026-10-19-media-optimization/. Final archive cleanup and local launcher restoration are controller closeout duties.
