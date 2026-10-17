# Business Starter v2 — Composition B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Use fresh medium implementers, independent review after each task and a whole-branch review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authorable FAQ, process steps, media/text and gallery sections with stable nested translations, safe local images and real showcase examples.

**Architecture:** Deliver vertical section slices through the existing registry, typed-list documents, native controls and static renderers. Shared item/source order stays on references; localized copy associates by ID. A separate server-only source metadata adapter supplies original-image dimensions; no derivative pipeline or new content encoding is introduced.

**Tech Stack:** Pinned Astro7.3.6, TypeScript, Zod, Tina editor3.14.3/CLI4.0.1/app2.5.14, Vitest, Playwright/axe, Node22.x ||24.x and pnpm10.13.1. The installed Astro dependency resolves Sharp0.35.5 through Node createRequire; verified during planning, no dependency upgrade/install is needed.

**Spec:** [Approved Composition B design](../specs/2026-10-18-starter-v2-composition-b-design.md).

**Status:** Written spec approved2026-10-18. This plan awaits review. Preserve the already selected medium subagents with independent task gates; no new execution-method choice is needed.

## Global Constraints

- Retain schemaVersion2, typed section-copy lists, detached domain projection and original native values/AST return.
- Default locale owns shared structure, order and appearance; translations own copy by stable IDs. No default-language or per-item fallback.
- Existing six types retain default-only variants. New sections start hidden; hero/privacy/contact capability protections remain.
- Crop is center, top or bottom; source and crop are shared. Fixed CSS classes implement these positions without inline styles.
- Missing optional media/text image is text-only; a referenced missing/broken file is not treated as absent.
- Content images require nonempty localized alt text in every supplied section translation. Captions may be blank.
- No arbitrary CSS/component paths/HTML/embeds, derivative generation/srcsets, remote image fetching or decoder/filesystem imports in editor/client bundles.
- Stop the owned dev stack before the full suite/conflicting builds. Preserve unknown editor bytes and both read-only reference repositories.
- All Markdown is English. No new fonts/dependencies, business presets/Rooms, hosted resources, real sending, deployment, merge, push or tag.

## Review Focus

1. Equal item IDs in different sections and locale lists in different orders must not cross-associate copy; add/remove across three locales must preserve unrelated native AST identity. Tasks1/3 own operations tests; Task4 owns real saves.
2. Early invalid saves must leave nested question/answer/image/alt editors reachable, retaining unsaved prose and sending zero mutations. Tasks1/3 own model/render checks; Task4 owns native correction/reload proof.
3. Encoded separators/traversal, symlink escapes, corrupt headers, mismatched file formats and same-path source replacement must not bypass physical metadata checks or return stale dimensions. Task2 owns exact fixtures; Task5 checks public failures/live updates.
4. Clearing a selected image must prune localized image text while preserving body/CTA and physical files. Native clear states may differ from wire omission. Task3 proves installed selection/clear contract before wider work; Task4 owns end-to-end proof.
5. New showcase images and renderers must not reintroduce dedicated nonlocal preview JS/CSS; shared business media must remain usable. Task5 owns real asset inventories, CSP, no-JS and articles-disabled checks.

## Workspace and common interfaces

Use C:/Projects/bizness-starter-v2 on codex/starter-v2-composition-b. Accepted showcase handoffd3a3478 and planningHEADa413409 stay retained. Sources are read-only: starter7473c0839dca8fadb7d7a8f9cc459cab79aba94f, financial0e1e5988dcdcba508300099ccab2643daedf1aad. Record HEAD/status without installs/builds/saves/process stops or secret reads.

Last owned live launcher session45708 had content26780/Tina10076/Worker35664/site37436; revalidate ownership and stop its exact launcher tree before tests/builds. Keep configured port overrides, default4330/8790/4010/9010. Native query uses localhost:4010, public CMS origin127.0.0.1:4330. Installed browser path C:/Projects/bizness-starter-v2/.generated/browsers. No browser download.

Each registry definition gains referenceFields (additional Zod reference fields), defaultReference:()=>object (items:[] for list types, otherwise empty), richFields:readonly {path:readonly string[];inline:boolean}[] (use [items,*,answer] for item traversal), and optional itemCopySchema/defaultItemCopy. addSection merges defaultReference into the newly created reference; it does not leave required items undefined. Existing definitions use empty referenceFields and unchanged defaults. Build reference discriminated unions from the common ID/enabled/appearance fields plus per-type referenceFields and variants; keep dependencies one-way. Native projection visits only registered rich paths on a detached clone. Share this metadata with draft-shape checks instead of recursively parsing/rebuilding opaque ASTs.

FAQ/steps/gallery copy item arrays remain arrays on disk and in normalized section copy. LocalizeContent associates them by ID and emits shared order; it never uses localized list position. Whole optional section copy may be absent. Zero-item hidden sections are valid; every supplied item must otherwise be complete even while hidden. Enabled list sections require at least one item. Meaningful rich answers/bodies require nonempty plainText after existing safe-Markdown validation. Empty intermediate editor entries remain in-memory drafts only.

Item IDs use the existing lowercase field-ID pattern, generated once as item_ plus UUID hex. Retained IDs cannot change identity by direct editing; removal followed by a genuinely new ID is allowed. Section media is absent when cleared; native blank/null input is handled by the UI operation before save, not by mutating the original beforeSubmit values.

## File boundaries

| Boundary | Responsibility |
| --- | --- |
| content section-registry/schemas/documents/types/localize | Registered types, per-type references/copy/variants and ID-based projected order |
| packages/content/section-items.mjs + .d.mts | Pure opaque-native item operations, reused by gallery |
| packages/content/media.mjs + .d.mts | Browser-safe source/crop contract and safe single-decode upload-relative path |
| packages/media/source.mjs + .d.mts | Server-only containment, bounds, byte hash and Sharp metadata |
| tina/fields/section-items.tsx, section-media.tsx, section-copy.ts | Shared structure versus fixed localized editors and native image picker |
| templates/sections/{Faq,Steps,MediaText,Gallery}.astro, ui/SectionImage.astro | Actual semantic production components using shared tokens |
| showcase samples/view, e2e helpers and docs | Deterministic examples, owned native/public evidence and handoff |

### Task 1: Authorable FAQ and steps vertical slice

**Files:** Modify packages/content/{section-registry,schemas,documents,composition,localize}.{mjs,d.mts}, types.ts; tina/{validation.ts,fields/composition.tsx,fields/section-copy.ts,sections/index.ts}; public renderer registry/map and shared section CSS. Create section-items.{mjs,d.mts}, tina/fields/section-items.tsx, Faq.astro, Steps.astro and tests/section-items.test.ts, tests/composition-b-contracts.test.ts. Update affected existing registry/native declaration/render tests rather than leaving the checkout partially registered.

**Interfaces:** addSectionItem(values,sectionId,{id,copy,media?}), moveSectionItem(values,sectionId,itemId,'up'|'down'), removeSectionItem(values,sectionId,itemId), addSectionItemTranslation(values,localeKey,sectionId,itemId,copy), setSectionVariant(values,sectionId,variant). Return new changed containers; unrelated AST nodes stay ===. SectionItemsControls performs one batch; FixedSectionItems renders only matching registered native copy children. Media argument is rejected until a registered type declares it (Task3 gallery).

- [ ] Write failing cases for two repeated FAQ sections with equal item IDs, shared-vs-localized order, three-locale add/remove, cancellation no-op, missing/stale/duplicate IDs, invalid type/variant, enabled empty lists, missing whole optional translated section and retained AST identity. Cover nested answer serialization with bold/link, unsafe nodes and original beforeSubmit return.
- [ ] Register faq default/expanded and steps default/cards end-to-end. References own items:[{id}], copies own id/question/answer or id/title/body. Expose default-locale add/move/remove and explicit localized-item initialization; do not auto-fill existing translations. Use real AST defaults. Preserve hidden data, immutable saved section IDs and all existing required-region/URL protections.
- [ ] Extend detached native projection from the current body/description handling to registry richFields, including items.*.answer/body. Reject unsupported AST/HTML rather than skipping new rich fields. Extend Page correction bindings to actual nested editors. Update native static fields/aliases without deriving schema from item IDs; default item/source controls cannot be rendered in localized copy.
- [ ] Implement native details/summary and expanded FAQ; ordered vertical/card steps. Reuse semantic typography/radius/density/prose/focus, no JS dependency. Add actual Astro render regressions for H2/item semantics, all four variants, safe rich content and no nested anchors. Do not add demonstration sections to canonical Home.
- [ ] Run focused contracts/items/native projection tests, pnpm check and pnpm test with watchers stopped; static build. Commit feat: add authorable faq and process sections. Actual native writes are Task4, not claimed here.

### Task 2: Safe local image contract and metadata adapter

**Files:** Create packages/content/media.{mjs,d.mts}, packages/media/source.{mjs,d.mts}, tests/media-source.test.ts and tests/media-contract.test.ts. No new wire fields are activated until Task3; this adapter is independently testable.

**Interfaces:** parseMediaSource(src:string):{src:string;relativePath:string;extension:'png'|'jpeg'|'webp'} preserves the wire source, resolves exactly one safe decode for filesystem use and normalizes jpg to jpeg only in extension metadata. Export mediaReferenceSchema={src,crop}, crop default center. resolveSourceMedia(root,src):Promise<{src,width,height,format,fingerprint}> is server-only; fingerprint is SHA256 of actual bytes. Cache decoded metadata by byte hash/format, never filename alone.

- [ ] Write red path cases for local uploads with ordinary spaces, valid percent-encoded spaces, traversal/encoded dots/separators/double encoding, backslashes/UNC/remote/data/query/hash/control paths and generated uploads/section-images or uploads/generated destinations. Other ordinary upload subfolders remain supported.
- [ ] Resolve real upload-root/file paths and require containment, a regular file and matching png/jpeg/webp actual format. Bound source bytes to20MiB, dimensions topositive integers no greater than20000 each and area to40,000,000 pixels. Check byte length after read as well as stat; use installed Sharp input limits and apply EXIF orientations5-8 when reporting dimensions. These are metadata checks, not a claim of exhaustive compressed-payload validation.
- [ ] Verify adapter resolution from the pinned Astro dependency using Node createRequire (planning resolved Sharp0.35.5). Keep all fs/decoder imports out of browser media.mjs. No derivative output, network fetch or global mutable filename-only cache. Add temp-directory fixtures for supported/missing/corrupt-header/format-mismatch/oversized/oriented/symlink files and same-path changed bytes yielding new dimensions/hash. If Windows symlink permissions are unavailable, report that explicit gap rather than claiming a skipped case passed.
- [ ] Run focused media tests and strict check. Commit feat: validate local content image sources. Do not run native/profile suites for this isolated adapter.

### Task 3: Authorable media/text and gallery vertical slice

**Files:** Extend registry/types/reference-copy validation/localization and Task1 item operations; create tina/fields/section-media.tsx, templates/sections/{MediaText,Gallery}.astro, components/ui/SectionImage.astro, apps/site/src/lib/section-media.ts and tests/composition-b-media.test.ts. Update native schemas, renderer map and focused CSS. Extend apps/site/astro.config.mjs upload watching only where needed.

**Interfaces:** setSectionMedia(values,{sectionId,itemId?,media:MediaReference|null}) updates one media/text reference or gallery item; null is allowed for optional media/text, not a gallery item (remove the item instead). Clearing media/text prunes its localized image objects across existing locales without changing body/link AST identity. lib/section-media.ts binds project root to Task2 resolver without exporting it to clients. SectionImage Props are {media:ResolvedMedia;alt:string;caption?:string;crop:Crop;ratio:landscape|gallery;locale:string}; landscape means3:2 and gallery means4:3. It emits plain lazy/async img inside fixed frames, using existing localized caption rendering.

- [ ] First prove the installed native image field selection/clear callback and serialization behavior in a bounded owned test: selecting sets shared src/crop; clear deletes optional media and localized image text in one operation. Use registered native plugin APIs; do not invent exports or change original values at save to hide a mismatch. Record actual blank/null/omission behavior before broad controls work.
- [ ] Add red cases for gallery source/order/alt association across three locales, missing/stale alt IDs, media/text source absent versus broken, clear/prune with retained body/CTA AST, source replacement retaining item ID, invalid crop and unsupported variants. Extend nested registered rich paths to captions and media/text body; captions are inline only.
- [ ] Register media-text default/reversed and gallery default/featured fully in native/persisted/public maps. References own sources/crops/items; copy owns alt/caption/body/CTA. Require nonempty alt for referenced content images. No decorative toggle, inline image styles, raw HTML or physical file deletion. Keep source picker outside localized editors and preserve invalid-save recovery for image text and nested links.
- [ ] Render actual metadata through the server adapter only for enabled/published localized sections reaching public output. Missing referenced files throw actionable page/section/item errors; unreferenced/draft/hidden source files are not decoded. Keep schema syntax checks strict for all stored references. Crop classes center/top/bottom, media frame3:2, gallery frame4:3; responsive layout and featured order reflect shared structure.
- [ ] Add upload add/change/unlink invalidation through the owned Astro development watcher, including a newly created uploads directory. Ignore generated CMS outputs; do not expand the unrelated canonical add-only refresh contract. Source replacement must re-read byte hashes. No generated-asset manifest or image pipeline is introduced.
- [ ] Run focused contracts/operations/media/native projection and real Astro render checks, strict check, full suite and static build. Commit feat: add content media and gallery sections. Retain source dimensions/metadata-only limitations in task report.

### Task 4: Native authoring and restoration acceptance

**Files:** Create e2e/composition-b-cms.spec.ts, e2e/helpers/owned-media.ts and tests/owned-media.test.ts; extend existing native-document/ownership/evidence helpers only for a demonstrated new need. Preserve existing complete-record derivation and permanent conflict revocation.

**Interfaces:** createOwnedMedia(path,backupRoot) captures original presence/bytes before any change. create(bytes) is initially-absent-only with wx; replace(bytes) compares the last owned Buffer; capture(bytes) claims only exact known bytes; restore() removes/restores only a proven owned Buffer and permanently refuses conflicts. Restrict test paths to explicitly named contained upload destinations. Source media fixture creation is Node-owned setup followed by actual native picker selection, not a claim of native upload coverage.

- [ ] Red ownership tests: absent exclusive creation, concurrent EEXIST, changed/missing file before replace/restore, diagnostic failure after ownership and byte-exact restoration. Never use newly observed disk bytes as expected ownership. Native JSON still derives from actual mutation/schema/installed serializer; binary media derives from predetermined literal image bytes.
- [ ] Create unique owned test images and a Standard draft through actual CMS UI. Add two same-type sections and nested FAQ/steps/gallery items, explicitly initialize EN/EL copy, format bold/link answers/captions and choose images through the native picker. Set variants, reorder nested items and whole sections, hide/show, remove with cancel/confirm, change image source and clear optional media/text image. Save/reload and verify public ID/type/source associations; no raw write mutations.
- [ ] Intentionally Save with incomplete nested answer and missing localized alt. Assert actionable native errors and zero native mutations, then reach/correct actual nested editors without discarding unrelated unsaved rich text. Save/reload successfully. Assert original native values/AST identity in hook regressions and schema/descriptor bytes unchanged by instance/item IDs.
- [ ] Protect required hero/privacy/contact and immutable saved identities. Verify removed gallery references do not physically delete source images. Restore the owned Page before restoring/removing its media files; preserve any unknown external edits and retain original/expected/conflict evidence. Initialize evidence before edits and claim ownership before optional diagnostic I/O.
- [ ] Run focused ownership tests, strict check and bounded native suite against a fully indexed owned dev:cms stack. Inspect observed selectors in a batch; no repeated full run per guessed selector. Retain actual save counts/requests/bytes/restoration and exact PID/port teardown. Commit test: prove composition b native authoring.

### Task 5: Showcase, responsive/public acceptance and handoff

**Files:** Extend showcase samples/view and existing tests; create two neutral original PNG sample assets under apps/site/public/uploads/starter-samples with provenance documentation, e2e/composition-b-content.spec.ts and docs/superpowers/plans/2026-10-18-starter-v2-composition-b-evidence.md. Update current composition/content/architecture/showcase/quickstart/decision docs and AGENTS. Extend build verifier artifact fingerprints only if actual output warrants it.

**Interfaces:** Preserve createShowcaseSamples output; add all eight new type/variant pairs, unique locale/instance/control IDs and real registered renderers. Starter sample images are ordinary reusable CMS-selectable starter assets, not client photographs or dedicated preview code; they intentionally remain available as normal public images in nonlocal builds. Dedicated showcase script/style assets remain local-only. Document this distinction explicitly.

- [ ] Generate original small neutral PNG illustrations once from deterministic owned source, label them as samples and document provenance; no AXIA photos or runtime derivative generator. Add actual showcase samples for all four sections/eight variants in EN/EL and update registry-exhaustive tests. Existing six section examples and behavior remain.
- [ ] Public matrix375/768/1440 covers EN/EL, all variants, keyboard FAQ controls, no-JS disclosure/text, reduced motion, one H1, safe links, no overflow, intrinsic image dimensions/aspect frames/crops and text-only media clearing. Verify missing whole translated section omission and actual browser naturalWidth>0. Include source-at-same-path replacement/add/unlink live refresh with precise owned bytes and unchanged schema.
- [ ] Retain representative axe/manual screenshots without certification claims. Exercise all four themes and three densities on representative new sections, avoiding an unbounded full cross-product. Keep canonical Home/brand unchanged. Validate unsafe/missing visible image public errors rather than silently dropping media.
- [ ] Stop watchers; run frozen install, pnpm check, pnpm test, static build, Worker dry-run and isolated CMS build. Run test:showcase-builds with real staging/production JS/CSS inventories/local restoration. Run an owned articles-disabled build/public check, preserving dormant article data and new sections; do not repeat unrelated newsletter/nurture delivery suites unless a changed boundary warrants it. Exact project/content/media restoration and both reference HEAD/status snapshots are mandatory.
- [ ] Document editor steps, nested ownership/variants, source-path and metadata limits, native clear/recovery, original-image performance limits and deferred Stage3 optimization. Preserve earlier evidence as historical, append actual new results/rulings/costs. Commit test: verify composition b and document section contracts. Root obtains independent Task5 then most-capable medium final review, one batched fix wave/scoped rereview if required, and restarts owned site/CMS at handoff. No deployment/merge/push/tag.

## Plan self-review and handoff

Vertical Tasks1/3 register their schemas/native controls/renderers together so intermediate commits do not expose unsupported types. Task2's media adapter is independently bounded before activation. Task4 owns the risky actual native serialization/correction and binary restoration gate; Task5 owns public/showcase/profiles/assets/docs. All five Review Focus inputs have explicit owners and tests. Registry rich paths prevent hand-maintained answer/caption serializer omissions; nested IDs/order and original native ASTs have covering assertions.

The media limits and adapter were concretized from the installed toolchain. Only the existing typed-list representation is accepted; no migration, fallback or new media service. Additional generic extension work, Rooms, presets and optimized derivatives remain future stages. Existing user preference is medium subagents and independent reviews. After written plan review, execute all five tasks continuously without per-task approval requests, then finish on the local branch.
