### Task 4: Responsive markup matched to existing grids

**Files:** layout modules/declarations, SectionImage.astro, MediaText.astro, Gallery.astro, RoomList.astro, RoomDetail.astro, global.css; tests/media-layout.test.ts and apps/site/tests/media-optimization.test.ts; add that exact file to apps/site/vitest.config.ts include.

**Interfaces:** Consume ResponsiveMedia, ImageLayout and imageSizes. Pass actual rendered item count from gallery/Room list; featured first item gets lead role.

CSS-derived sizes rules: define W as calc(min(100vw, 72rem) - clamp(2.5rem, 8vw, 6rem)). Media-text uses W below 768px and calc((W - 2rem)/2) above. Normal gallery/Room cards use up to three auto-fit columns, bounded by itemCount: two columns become possible at 39.130435rem, three at 59.782609rem (17rem minimum and 2rem gaps); widths are W, (W - 2rem)/2 or (W - 4rem)/3. Featured lead is W; featured others use W below 768px and (W - 2rem)/2 above. Room detail is calc(min(100vw, 58rem) - clamp(2.5rem, 8vw, 6rem)). Emit expanded valid sizes expressions, not symbolic W. Current density only changes vertical section spacing, so all three densities share these expressions.

- [ ] Write tests for each role, one/two/three-plus items, breakpoints and capped containers. Component assertions cover source type/image srcsets, fallback dimensions, sizes, alt/safe caption, crop classes, lazy/async, passthrough original and no-image behavior; use existing Astro component test configuration.
- [ ] Run pnpm exec vitest run tests/media-layout.test.ts and pnpm exec vitest run --config apps/site/vitest.config.ts; retain new-test RED.
- [ ] Render picture only for derivative families; select largest fallback as img src with its intrinsic dimensions, width-descriptor srcsets and correct sizes. WebP originals need no duplicate source family. Preserve original img for passthrough. Ensure picture fills the fixed frame and existing image CSS still applies. No section spacing or typography changes.
- [ ] Repeat tests; expect passing. Commit feat: render layout-aware responsive images after review.

