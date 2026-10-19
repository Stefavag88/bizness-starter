# Stage 3A — Responsive media optimization design

Date: 2026-10-19. Status: Written specification approved by the user; implementation awaits review of the separate implementation plan. Baseline: accepted Composition C closeout b49ae65. Repository: C:/Projects/bizness-starter-v2, branch codex/starter-v2-media-optimization. The two reference repositories remain read-only.

## Intent

Make existing website images cheaper to download and appropriately sized for their layout, without changing the design, Tina authoring workflow or persisted media references. An editor still selects an original local upload and supplies localized alt/caption text. The application selects responsive derived files automatically.

Success means actual static output serves smaller appropriate variants for representative large photos, preserves accessible text and visual layout, refreshes when an original changes at the same path, and keeps public image delivery independent of a runtime transformation service. This is the media slice of Stage 3, not all of Stage 3 or a production-readiness certification.

The user approved proceeding with this media slice after Composition C. This proposal assumes technical optimization policy belongs in developer configuration rather than adding encoding controls to every CMS image. Originals remain the source of truth. The written specification and subsequent written implementation plan require separate review before product code changes.

## Approaches and decision

1. **Build-time Sharp variants behind the existing server adapter — recommended.** Preserve /uploads paths and the established physical-source validation, generate finite content-addressed derivatives, and reuse one renderer. This adds a small pipeline and cache owner, but avoids rewriting CMS references or introducing an image provider.
2. **Bridge uploads into Astro's imported-asset graph.** Use Astro image components after generating an importable asset index or staging source files. This delegates more transformation work to Astro, but adds copy/index/invalidation ownership around dynamic CMS uploads. Do not fabricate private Astro metadata or depend on undocumented asset internals.
3. **A managed/runtime image service.** Potentially useful later, but adds provider configuration, runtime behavior and another operational boundary. It is outside this slice.

Choose option 1. Astro documentation distinguishes unprocessed public files from imported assets; our pinned Astro service also returns an unauthorized local string source unchanged. Simply replacing img with Image is insufficient for our existing public-upload contract. The supported Astro image APIs remain an alternative, not a reason to migrate working content in this increment.

## Scope and compatibility

Apply optimization through the shared SectionImage/server-media boundary to media-text, galleries, Room listing thumbnails and Room detail images. Other future renderers can reuse that boundary. Do not introduce new Hero/background imagery, article cover fields, logos, social images, a lightbox, motion, visitor state or business presets.

Preserve schemaVersion 2, media {src,crop}, stable section/item IDs, bilingual alt/caption ownership, exact translation membership, current crop classes/aspect frames, design tokens, navigation and publication behavior. No content migration, generated references saved to JSON, new CMS collection or editor-specific optimized copy is needed. Existing optional image clearing and text-only presentation remain intact.

Original PNG/JPEG/WebP files stay in apps/site/public/uploads and remain publicly addressable as before. Generating derivatives does not remove originals, clean unused uploads or provide access control. Deployment storage and build work can increase even when visitor transfer decreases.

Use the currently installed Sharp 0.35.5 encoder; make that exact version an explicit dependency for pipeline ownership rather than depending on Astro's optional transitive package. Do not upgrade Astro, Tina, Sharp, fonts or another dependency. The plan must show the explicit dependency/lockfile change and keep the existing metadata adapter consistent with that ownership.

## Developer configuration

Add strict optional project.media.optimization with defaults enabled=true, widths=[320,640,960,1440,1920], quality=80. Defaulting supports existing project.json without a migration. Configuration is developer-owned; Tina's infrastructure-free descriptor should not acquire unrelated technical or secret settings merely because this option exists.

Widths must be ascending unique integers from 160 through 2560, with one through six entries. Quality is an integer from 40 through 95 for lossy WebP/JPEG output; PNG fallback remains lossless. Reject unknown keys and invalid limits instead of silently accepting unlimited work. Encoder concurrency is bounded to two transformation jobs at once; it is not a CMS setting.

When enabled=false, use the established original-image renderer and metadata safeguards, with no derivative generation. This is a supported diagnostic/compatibility switch, not permission to ignore unsafe source references. Changing policy requires the normal owned-stop/configure/restart or static rebuild workflow.

## Outputs and responsive layout

Generate WebP and a compatible resized fallback in the original format for PNG/JPEG. A WebP original needs only one format family. AVIF is deliberately deferred from the first slice to limit encoding/build cost; it can be added behind the same output contract after benchmarking.

Select candidate widths from configured widths no larger than the oriented original width, plus the original width capped at the largest configured width; deduplicate and sort. Never upscale. This yields at most six sizes per format and twelve variants per source. Very small or already optimized files need not shrink; do not make a universal byte-reduction claim. Where an equal-dimension derived result is larger than its source, the pipeline may retain the original for that fallback rather than force a regression.

Emit picture/source/img with correct width-descriptor srcset and layout-aware sizes for media-text, normal/featured galleries, Room cards and Room detail figures. The implementation plan must derive each sizes expression from the actual container/grid CSS and test it at supported breakpoints, including density choices. A single generic 100vw for every card is not acceptable.

Preserve intrinsic dimensions, alt text, localized safe captions, lazy loading, async decoding and fixed object-fit/object-position behavior. Resize the natural image and normalize orientation; retain visual cropping in the current CSS frame rather than baking a new crop into every derivative. No layout redesign or automatic eager loading of all images. Transparency remains transparent; PNG fallback must not be silently flattened to JPEG.

## Validated source and encoder boundary

Retain local-only /uploads syntax, one-decode/path traversal and symlink containment protections, regular-file checks, byte/format checks and the existing 20 MiB, 20,000-pixel-side and 40-million-pixel bounds. The encoder must consume the same validated byte snapshot whose fingerprint/metadata it uses; do not validate one read and encode a later pathname read that may contain different bytes.

Expose any required byte-reader functionality only inside server-only media modules. No Buffer, source filesystem path, image decoder, encoder or filesystem loader enters Tina/browser imports. Keep current named content collections/domain registration contracts independent of transformation code.

Full encoding can detect corrupt compressed payloads that previous metadata-only inspection did not. A referenced static image that cannot decode/transform fails with actionable page/section/item/source context. Do not silently publish a broken derived URL or mask an encoder failure with the original. Original files and content records remain untouched on failure.

Static photos are the optimization target. Detect animated/multipage inputs and retain their original presentation with a recorded passthrough reason, rather than silently flattening them or introducing animation processing. Existing source bounds still apply. This slice does not certify animation accessibility or add motion preferences.

## Cache, publication and lifecycle

Derivative identities include actual source-byte hash, requested width/format/quality, encoder/pipeline version and relevant transformation policy. Filename-only or mtime-only cache keys are insufficient. The same source/size/format is shared across locales, sections and Room uses; localized prose never duplicates image bytes.

Store intermediate outputs/manifests in a dedicated ignored pipeline-owned cache, separate from canonical uploads and previous acceptance artifacts. Publish only derivatives demanded by rendered output into a dedicated generated static namespace. Generated URLs are never accepted as canonical CMS upload references. Invalid cache entries are rejected or safely regenerated only inside that owned namespace; writes are atomic within their owner and concurrent requests share one encoding job.

Generate assets as part of static build. In local development, generate only while rendering known content, and serve exact known cached assets through a contained local adapter. Do not add a production Worker transform endpoint, remote fetch, arbitrary width/quality query API or visitor-controlled encoding operation. Production derivative delivery uses ordinary static assets under existing CSP/routing boundaries.

Preserve upload add/change/unlink refresh. Replacing bytes at an unchanged path must produce new variants and dimensions without stale URL reuse. An unlinked referenced file fails visibly; an unreferenced/disabled image is not encoded. Build failure must not mutate content/originals. Missing/draft/disabled locales/domains use existing publication rules; no new independent image publication algorithm.

The local showcase can demand derived sample assets only when its route is registered. Staging/production must still exclude the showcase route and dedicated preview code. Ordinary sample originals remain legitimate reusable business assets; do not label them a leak. Do not deploy local-only demanded derivatives unless a public business renderer also demands them.

## Acceptance and evidence

- Contract tests cover strict/default/disabled configuration, capped/deduplicated no-upscale widths, alpha/orientation, source and transform failures, animation passthrough, safe generated destinations and output metadata.
- Cache/invalidation tests cover repeated-source reuse, same-path changed bytes, changed policy/encoder identity, concurrent deduplication and missing/corrupt cache entries. Test actual output files and decoded dimensions, not only generated names or mocked encoders.
- Real static browser checks cover EN/EL at 375/768/1440, multiple device-pixel ratios, JS disabled, current design themes/densities and all affected image layouts. Inspect currentSrc/srcset/sizes, successful loads, preserved crop/caption/alt, no overflow and representative accessibility audits/screenshots. Normal no-JS content remains complete.
- Use owned representative photographic fixtures plus transparent PNG, portrait/orientation and small-image fixtures. Record per-candidate byte/dimension tables and demonstrate transfer reduction against the original on representative large photos. Avoid a fabricated universal percentage target or reliance only on tiny abstract sample PNGs. Fixture provenance and test ownership must be explicit; no external business photos are imported by implication.
- Verify actual generated variants and CSP/static-asset delivery with the built Worker, without a transformation request at runtime. Preserve protected routing, roles, form/Worker behavior and source manifest contracts. Existing capture/native authoring proofs are not replayed unless a changed boundary justifies them.
- Confirm Tina still selects/clears originals, preserves unchanged ASTs/JSON and never persists derivative URLs. Use actual native UI only for the changed integration boundary; request/schema/installed-serializer ownership remains mandatory for writes.
- Verify disabled optimization, disabled Rooms/articles, representative profiles, static build, isolated CMS and local/staging/production artifact inventories. Run appropriate check/test/build/routing gates, with exact process ownership and no conflicting live launcher.
- Before fixture mutation, fault-test complete project/content/uploads snapshots, awaited independent restoration, false-owner/shutdown failures and regeneration refusal. Never delete or overwrite unknown canonical edits. Keep dependent media if its referring document cannot be restored. Retain raw commands/results, output inventories, source hashes, conflict/cleanup records and known limits in English documentation.

## Delivery

After written-spec approval, write a separate task-sized implementation plan with exact server/renderer/config/build/dev interfaces, output namespace, widths/sizes/format policy, dependency ownership, acceptance owners and independent review gates. Retain the selected medium implementers, independent task reviews and most-capable available model at medium for whole-branch review. Proceed with implementation only after that written plan is reviewed.

Stay in the v2 repository on a dedicated media branch, preserving Composition C at b49ae65. Keep both source repositories read-only. No remote accounts, paid image service, hosted configuration, deployment, sending, merge/push/tag or release is authorized. The running local site/CMS stays unchanged during specification review.

Self-review: original/canonical ownership and generated outputs are distinct; source-read/encode consistency and stale-cache behavior are explicit; every existing media use is in scope without changing content schemas/design; formats/configuration/animation limits are bounded; runtime/cloud scope and performance claims are constrained. No runtime implementation or dependency change has begun.

## Primary references checked

- [Astro images guide](https://docs.astro.build/en/guides/images/) and [astro:assets reference](https://docs.astro.build/en/reference/modules/astro-assets/): imported/public source distinction and image APIs. Pinned local Astro 7.3.6 service/getURL and build loader were inspected; no undocumented API use is proposed.
- [Sharp resize reference](https://sharp.pixelplumbing.com/api-resize/): no-enlargement behavior. The repository lockfile supplies Astro's existing Sharp 0.35.5; promoting that exact version is an ownership change, not an encoder upgrade.
