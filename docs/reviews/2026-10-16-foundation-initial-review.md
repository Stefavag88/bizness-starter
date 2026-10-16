# Foundation final whole-branch review

Reviewed HEAD: `ab538d4c55a8aa2721fdf12a3773383fb45be4bf`, against the empty tree. Repository: `C:/Projects/bizness-starter-v2`. Review is read-only on that checkout; this report is written in the coordinating workspace. No source content, index, HEAD, or branch changes were made, no servers started, and no broad suites repeated.

Authority: approved 2026-10-16 design and Foundation implementation plan, `docs/FOUNDATION_DECISIONS.md`, and recorded Foundation evidence. I applied the requesting-code-review reviewer rubric. Inspection covered canonical schemas/loading/localization/publication/routes, native collection/save controls and ownership helpers, public rendering/forms/feed/links, configuration/manifest/design generation, local launcher/profile/restoration paths, Worker profile/security/subscription/campaign/delivery/workflow/webhook boundaries, and relevant regression tests/documentation. The lockfile was not reviewed line by line; the independently passing frozen installation and pinned native compatibility evidence were retained rather than repeating dependency work without a concrete concern.

## Strengths

- Public records, locale alternatives, feeds and backend manifests derive from the same validated publication pipeline. The union of published offering contexts across locales correctly complements the deliberately default-locale article manifest.
- Native rich text uses detached projections and the installed serializer; the original editor values are returned untouched. Actual native mutation/schema-derived ownership and exact-byte restoration are substantially stronger evidence than tests that infer expectations from newly saved files.
- The last evidence-ordering fix claims valid native saves before optional diagnostic I/O, and prepares evidence storage before editing. Its focused regressions address the failure that was found.
- Required Page structure and Contact capability are explicit, with stable section IDs and independent locale publication. Filesystem code remains outside browser/editor validation imports.
- Local-only delivery capture, explicit profile gates, owned process cleanup, configuration backup/conflict preservation and unconditional production-readiness blockers make the current delivery boundary clear.
- The recorded native, public, profile and source-preservation evidence is specific about limitations. The root independently reconfirmed 204 unit passes plus one opt-in skip, clean type/Astro diagnostics, 22 pages plus two feeds, and Worker dry-run at this HEAD during review.

## Issues

### Critical

None found.

### Important — should fix before accepting Foundation

#### 1. P2 — Native deletion can bypass relationship validation and break the catalog

**File:** `C:/Projects/bizness-starter-v2/tina/collections/common.ts:5`.

The shared collection factory enables native Delete for offerings, people and articles, while the only catalog guard is `beforeSubmit`. The installed Tina runtime's delete action calls `admin.deleteDocument(vars)` directly (`node_modules/tinacms/dist/index.js`, around lines 74670 and 17073), without invoking that save hook. Its native reference check cannot protect these relationships: `authorId`, `offeringId` and campaign `articleId` are ordinary string fields holding canonical IDs, not Tina reference fields.

An editor can delete the seeded `sample-person` or `sample-service` record while `sample-article` still references it. The next canonical configure/build fails, and save-time validation of other records can also fail while the catalog is invalid. In-memory inspection with the real loader/catalog confirmed that removing the person yields `sample-article: authorId references missing ID sample-person`. The same boundary exists for deleting an article referenced by campaign copy.

**Fix direction:** Preserve canonical ID relationships. Either implement a relationship-aware deletion path using a verified supported native integration, or explicitly disable native deletion for relationship targets during Foundation and document the protected capability. The latter is a valid bounded Foundation fix; converting IDs into file paths merely to inherit Tina references is not needed.

**Focused validation:** Assert the selected delete policy on generated native collections for offerings/people/articles and exercise the default seeded relationship case. If deletion remains exposed, demonstrate that the real deletion path rejects a referenced target before disk mutation, while permitting the intended unreferenced case. Retain loader rejection for dangling IDs.

#### 2. P2 — Native nested documents are exposed, but the public loader silently ignores them

**Files:** `C:/Projects/bizness-starter-v2/tina/collections/common.ts:5`; `C:/Projects/bizness-starter-v2/packages/content/read.mjs:18`.

The collection factory does not set `createFolder` or `createNestedFolder`. Installed Tina defaults both controls to true, including on collections whose `create`/`delete` settings are restricted (`node_modules/tinacms/dist/index.js`, around lines 74642–74646). Editable editorial collections therefore allow an editor to create a folder and save a document beneath it. `validateCurrentSave` accepts the collection-relative nested path and includes it in the native catalog, but `readContent` reads only immediate `.json` children. A valid nested offering/person/article appears in the editor and passes save validation, then disappears from public routes and manifests; a top-level article referring to that nested target instead breaks canonical loading.

**Fix direction:** Make folder support an explicit consistent contract. For this Foundation, the smallest fix is to disable both native folder controls and reject non-flat document paths before save, with documentation that editorial documents live directly in their collection folder. Alternatively, deliberately support recursive discovery consistently across public loading, CMS descriptors and ownership assumptions; that is a larger change and not necessary here.

**Focused validation:** Cover generated collection folder settings and a nested `relativePath` save attempt. Verify that it is rejected before persistence under a flat-file policy. A temporary fixture with nested content should not silently become accepted-but-unpublished authoring; either fail clearly or support it consistently, according to the chosen policy.

#### 3. P2 — Footer legal notice bypasses the shared rich renderer

**File:** `C:/Projects/bizness-starter-v2/apps/site/src/layouts/Layout.astro:15`.

`settings.legal.notice` is a Markdown body in the canonical schema and is offered as native rich text with headings, lists, emphasis and links. The footer interpolates that string directly inside a paragraph. A legitimate edit such as `**Sample notice** [Privacy](/privacy)` therefore prints Markdown punctuation and an unclickable link on every public page. Both English and Greek are affected. The current plain-text seed conceals the mismatch.

**Fix direction:** Render this field through the existing localized safe `RichText` component/helper, in an appropriate block container outside the business-name paragraph. Preserve the stored Markdown contract and safe link localization; do not inject raw HTML or wrap block-rich content inside a paragraph.

**Focused validation:** Render a representative EN/EL notice containing emphasis, a list and an internal privacy link. Assert semantic output, correct localized destination, no literal Markdown delimiters and no invalid nested paragraphs. Existing native rich validation already supplies the AST safety boundary.

#### 4. P2 — The system 404 route is absent from collision validation

**File:** `C:/Projects/bizness-starter-v2/packages/content/catalog.mjs:4`.

The reserved set omits `404`, while `apps/site/src/pages/[locale]/404.astro` owns `/<locale>/404` and the Worker fetches that exact page to serve localized misses. `publicRoutes` compares only content routes, so it cannot detect the generated system route. A canonical page with slug `404` is accepted and advertised in navigation/manifests even though Astro's specific 404 route owns the same URL. This is possible when configuring the seeded project directly; it does not depend on enabling the deferred page-creation UI.

A read-only in-memory probe changed the existing About page slug to `404`, ran the real `validateCatalog`, and obtained an accepted page route `/en/404` with `/el/404` as its alternate. No checkout content was changed.

**Fix direction:** Reserve the localized system 404 destination in the shared catalog/route validation, ideally alongside the other system paths. Keep the same rejection at canonical loading and native catalog-validation boundaries.

**Focused validation:** Add the `404` slug to the reserved-route regression and assert the candidate fails before build/save. Retain the existing localized missing-page behavior test. A broad native save run is unnecessary for this pure shared validator correction.

### Minor

No additional cosmetic or speculative items promoted to findings.

## Recommendations

Resolve these four issues as one bounded fix wave. Prefer explicit Foundation capability restrictions for deletion/folders over introducing new content models or a full authoring subsystem. Add focused regressions, rerun the ordinary required checks, and request a scoped rereview of the changed boundaries. Repeat native end-to-end saves only where a native behavioral change needs that evidence; the already passing rich-text/visibility roundtrips do not need indiscriminate repetition.

## Declined to judge

- Page creation, section add/remove/reorder, the expanded section library and Rooms: explicitly deferred to stage 2; no missing-feature finding.
- Media pipelines, social controls, decorative motion, visitor preferences and analytics: explicitly deferred to stage 3, or not enabled; no implied implementation requirement.
- Hosted Tina authentication/indexing, Turnstile client integration, SES/SNS accounts, remote D1/Queues/Workflow behavior and real delivery: hosted/provider verification is deferred and production readiness is expressly blocked; local code inspection is not certification of those services.
- Presets, destination initializer, release tags, migration of old client content, merge/push/deployment: explicitly outside this Foundation delivery.
- JSON-LD and reproducing the financial example's visual design: explicitly not required; the neutral implementation is intentional.
- Isolated `--skip-indexing` CMS builds as proof of indexing: explicitly not treated as that proof. The approved isolated-build exception is accepted together with separately observed full dev indexing/native query/UI evidence.
- Complete accessibility, all browsers, every locale/font combination, and production load/security certification: representative EN/EL Chromium and manual evidence supports only its documented scope.
- Published editorial slug redirects: the overall architecture requires explicit redirects for changed published slugs, but the approved Foundation task implements route/collision contracts without a redirect subsystem. I did not expand this fix wave into redirects; the executor should explicitly retain this obligation for the later release/authoring gate.
- Native Page template unions across multiple new pages: the current supported authoring boundary is the seeded Pages set, with page creation deferred. I did not require a full multi-page template schema redesign now.
- Full lockfile/dependency supply-chain audit and cross-platform process certification: frozen installation/native compatibility and Windows local evidence were available; no concrete dependency regression justified broadening this review into those audits.
- Mechanical reformatting of compact source files: readability could improve, but no formatting-only blocker is asserted.

## Assessment

**Ready to accept Foundation: With fixes.**

The architectural boundaries and evidence are sound for a local Foundation, but two native authoring operations currently escape the canonical contract, and rich-footer/system-route integration has observable gaps. The four findings are bounded and can be corrected without expanding the approved stage or changing the canonical model.
