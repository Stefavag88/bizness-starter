# Task 3 report: media/text and gallery vertical slice

Date: 2026-10-18. Branch: codex/starter-v2-composition-b. Base: 7893ab0.
Status: implemented and verified; independent review remains controller-owned.

## Implementation

- Registered media-text/default/reversed and gallery/default/featured in the shared contracts, declarations, native copy templates, reference fields and static renderer maps. Existing six section types retain default-only variants.
- References own source/crop and gallery IDs/order. Localized copy owns alt/caption/body/CTA. Gallery localization reuses the accepted ID-based projection; no positional or language fallback was added.
- Added browser-safe setSectionMedia(values, {sectionId, itemId?, media}) to the existing pure item operations. Optional media/text clear removes the shared media property and corresponding image objects from default and existing translation copy. Body, nested rich links, CTA objects and unrelated editor AST identities are retained. Gallery clear rejects; removal uses the existing cross-locale item operation. Source replacement retains the item ID and copy containers.
- Gallery add requires a valid source and creates a stable item ID once. Its new-item caption uses an actual native AST. Alt has an explicit editable draft prompt; translations require explicit initialization and meaningful localized alt before save.
- Added native shared-source/crop controls using the registered image plugin. Sources remain outside localized copy editors. Blank/null/undefined callback inputs are converted by the operation before save; beforeSubmit still returns the original values and never rewrites them to hide a mismatch.
- Extended registered rich paths to media/text body, image.caption and gallery items.*.caption. Captions use inline-only safe Markdown and native toolbar rules. Existing invalid-save correction navigation reaches image objects, body, captions and nested rich links.
- Added server-only section-media.ts, binding the repository root to the accepted Task 2 adapter. No filesystem/decoder dependency enters editor/client imports. Public rendering passes page/section/item identity for actionable missing/broken-file errors.
- Added actual MediaText, Gallery and SectionImage Astro components. Plain original-file img elements carry intrinsic dimensions, lazy loading and async decoding. Shared CSS classes provide 3:2 media frames, 4:3 gallery frames, center/top/bottom crops, desktop reversal, responsive grids and first-item featured presentation. CSS uses existing semantic tokens, without inline style attributes.
- Added a separate section-upload-refresh Vite plugin watching the stable public parent. Upload directory creation and add/change/unlink invalidate the server module graph and request a full reload. Generated CMS outputs remain excluded by the uploads-only filter. The canonical content refresh implementation and its accepted add-only limitation are unchanged.
- Preserved the localized-static-not-found hook and access-role implementation. Static build still produces en/404.html and el/404.html.

## Native image prerequisite and integration evidence

All native probes used the installed public API and owned in-memory values. No canonical content file was edited and no save/mutation was sent. The browser used the already installed .generated/browsers Chromium. Browser and Vite server were closed in finally blocks; no dev:cms or source-project server was started or stopped.

The initial bounded probe rendered public ImageFieldPlugin.Component beneath TinaCMSProvider. A controlled public media-manager/store boundary supplied a selected local media record to the component's actual registered selection callback; a real UI click exercised the installed clear button. The probe does not claim media-library upload/modal acceptance or canonical save acceptance.

Observed on Tina 3.14.3:

| Input/action | Actual result |
| --- | --- |
| Select local probe media | input.onChange('/uploads/probe.png') |
| Click installed clear button | input.onChange('') |
| ImageFieldPlugin.parse(null) | '' |
| ImageFieldPlugin.parse(undefined) | '' |
| ImageFieldPlugin.parse('') | '' |
| Installed TinaSchema.transformPayload selected image | source string retained |
| Installed TinaSchema.transformPayload blank image | explicit empty string retained |
| Installed TinaSchema.transformPayload null image | explicit null retained |
| Installed TinaSchema.transformPayload omitted image | property omitted |

This establishes that raw native blank/null and wire omission differ; no private/nonexistent exports or beforeSubmit rewriting were used.

After implementing the small operation/control, an additional browser probe rendered the production SectionMediaControls with the actual registered cms.fields.find('image') plugin and public Tina Form/real Final Form:

- Selecting changed shared src to /uploads/probe.png while retaining top crop.
- Clearing omitted the shared media property and all three EN/EL/FR image-copy objects in one batch operation.
- Default and translated body AST identities and the CTA object identity were retained.
- Zero browser errors and zero saves.
- A committed regression uses the installed public TinaSchema API with the actual pages(project) schema and confirms cleared media and default/translated image text serialize as omission.

Commands:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH=(Resolve-Path '.generated/browsers').Path
node .generated/task3-image-probe/run.mjs
node .generated/task3-image-probe/serialize.mjs
node .generated/task3-image-probe/integration.mjs
```

Outputs/evidence:

- .generated/task3-image-probe/observations.json
- .generated/task3-image-probe/serialization.json
- .generated/task3-image-probe/integration.json
- Probe sources and launchers are retained in the same ignored directory for inspection/reproduction.

The first exploratory browser run omitted the required tinaForm metadata and generated hover errors, while observing the callbacks. The fixture was corrected and the clean raw-plugin and production-control probes above were rerun successfully. Early standalone runner attempts also corrected installed Vite resolution and Windows file-URL imports; no dependency installation or private implementation patch was made.

## TDD evidence

1. Added tests/composition-b-media.test.ts before production changes.
   - RED: pnpm exec vitest run tests/composition-b-media.test.ts -> 6 failed / 7 passed. Expected failures: unknown media-text/gallery discriminator, missing setSectionMedia, absent nested caption serialization and unknown native defaults.
   - GREEN after contracts/operations/native fields: affected contract/item/native-projection files -> 22/22 passing.
   - Fixture-only corrections isolated shared media objects between tests and used explicit hero enabled state; these corrected test setup rather than weakening assertions.
2. Added actual Astro tests before renderer implementation.
   - RED: pnpm exec vitest run --config apps/site/vitest.config.ts apps/site/tests/composition-b-media.test.ts -> 5/5 failed with Unsupported section media-text/default, media-text/reversed, gallery/default and gallery/featured.
   - GREEN: 5/5 passing after registration/rendering. The fixture path was corrected to the exact site upload root using import.meta.url.
3. Added upload watcher contract test before the watcher implementation.
   - RED: plugin lookup undefined.
   - GREEN: watcher contract passes for add/change/unlink/new directory and excludes generated/canonical paths.
4. Added further focused regressions for installed wire omission, source replacement scoped to matching gallery item IDs in separate sections, three-locale reorder/removal, corrupt-file item diagnostics, same-path byte replacement and public visibility filtering.
   - Focused native/media controls: 40/40 passing.
   - Actual Astro media regressions: 7/7 passing.

## Final verification

All owned probe servers were stopped before full tests and builds. Commands ran in C:/Projects/bizness-starter-v2 with the existing pinned dependencies.

| Command | Result |
| --- | --- |
| pnpm test | Root: 52 files passed, 1 skipped; 511 tests passed, 1 skipped. Site Astro: 4 files / 16 tests passed. |
| pnpm check | TypeScript passes; Astro checks 44 files with 0 errors, 0 warnings, 0 hints. |
| pnpm build | Static build succeeds, 23 pages. Localized literal 404.html outputs verified present. |
| git diff --check | Passes; existing LF/CRLF conversion advisories only. |
| node .generated/task3-image-probe/watcher.mjs | Actual installed Vite watcher: newUploadsDirectory=1, add=1, change=1, unlink=1 invalidation. |

The first full-suite run found only two stale eight-type expectations in tests/cms-static-schema.test.ts: explicit copy-template list and registry count. These were amended to ten types and the full suite was rerun green. An earlier focused run found the corresponding chooser count (7 -> 9 optional types), also updated. No production behavior was changed to satisfy obsolete counts.

The one skipped test is the existing tests/cms-native-query.test.ts query integration gated by CMS_QUERY_URL. No live CMS was needed or claimed for this Task 3 bounded probe. Existing Node experimental SQLite and Vitest transform-performance advisories remain; they are not new failures.

Retained final logs:

- .generated/task3-evidence/full-suite.log
- .generated/task3-evidence/check.log
- .generated/task3-evidence/build.log
- .generated/task3-evidence/watcher.json

The actual watcher probe removed only the known Task 3-created empty uploads directory, using an empty-directory check and nonrecursive rmdir, then recreated it to prove first-directory detection. Its unique image file was exclusively created, compared before replacement/deletion and removed only while its exact owned bytes matched. The directory was left empty. Astro image fixtures likewise use unique names, exclusive writes and guarded cleanup. Unknown upload files were never overwritten or deleted.

## Self-review, rulings and limits

- Repository-root ruling is followed: Task 2 resolves root/apps/site/public/uploads; no app-root reinterpretation was introduced.
- Strict syntax validation remains active for all stored references, including drafts and hidden sections. Filesystem metadata is only requested by renderers reached after publication/localization/enabled filtering; hidden direct renderer references also skip lookup.
- Existing opaque native values/AST return behavior and fixed localized item editors remain in place. Source replacement does not invent localized prose or change identity. Clear only prunes stale image text.
- Task 2 remains the physical validation owner: original PNG/JPEG/WebP only, bounded 20 MiB files, maximum 20,000 per dimension / 40 million pixels, realpath containment and content-hash metadata caching. Metadata validation is not a full pixel-decoding or image-optimization guarantee.
- Original files are rendered without derivatives, srcsets, compression or a generated image manifest. Large original uploads retain their performance cost; no production optimization claim is made.
- Canonical native save/reload/early-invalid-save recovery acceptance belongs to Task 4. This task proves the actual callback/Final Form/serializer behavior and keeps correction editors registered; it does not claim Task 4 acceptance.
- Showcase sample images, canonical demonstration assets, responsive browser matrix, axe/no-JS/CSP and live public replacement acceptance remain Task 5. No sample asset or canonical page was added here.
- The actual image picker retains its installed independent media-library behavior. Clear/reference removal never invokes physical deletion.
- No dependencies/fonts were installed or upgraded; no external provider, sending, deployment, merge, push or tag occurred. No child implementer/reviewer was spawned.
- Verification cost: two full-suite runs (the second after obsolete test expectations), focused red/green iterations, one final strict check and one static build; bounded browser/Vite probes only. No token/currency cost measurement is available in this worker.

Read-only source checks returned clean status and unchanged revisions:

- C:/Projects/bizness-starter: 7473c0839dca8fadb7d7a8f9cc459cab79aba94f.
- C:/Projects/financial-consulting-example: 0e1e5988dcdcba508300099ccab2643daedf1aad.

No source installs, builds, saves, process stops or secret reads occurred.

## Changed files

New:

- apps/site/src/components/ui/SectionImage.astro
- apps/site/src/lib/section-media.ts
- apps/site/src/templates/sections/Gallery.astro
- apps/site/src/templates/sections/MediaText.astro
- apps/site/tests/composition-b-media.test.ts
- tests/composition-b-media.test.ts
- tina/fields/section-media.tsx

Extended:

- apps/site/astro.config.mjs
- apps/site/src/styles/global.css
- apps/site/src/templates/Page.astro
- apps/site/src/templates/section-registry.ts
- apps/site/src/templates/sections.ts
- apps/site/vitest.config.ts
- packages/content/composition.d.mts
- packages/content/composition.mjs
- packages/content/schemas.mjs
- packages/content/section-items.d.mts
- packages/content/section-items.mjs
- packages/content/section-registry.mjs
- packages/content/types.ts
- tests/cms-composition-controls.test.ts
- tests/cms-static-schema.test.ts
- tina/fields/composition.tsx
- tina/fields/rich-text.ts
- tina/fields/section-copy.ts
- tina/fields/section-items.tsx
- tina/sections/index.ts

The report and scratch evidence remain in ignored task/evidence directories and are not staged as task source.

## Final commit

Commit recorded after final verification and whitespace self-review. The staged diff check initially found three trailing blank lines introduced by shell file writes; they were removed before the final amended commit. Final git diff HEAD^ HEAD --check passes. This whitespace-only correction did not change the tested behavior. The worktree is clean.
Final commit: 45cf603 - feat: add content media and gallery sections.
