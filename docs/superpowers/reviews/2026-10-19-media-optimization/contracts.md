# Stage 3A Responsive Media Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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


