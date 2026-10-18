# Business Starter v2 — Composition B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Use fresh medium implementers, independent review after each task and a whole-branch review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authorable FAQ, process steps, media/text and gallery sections with stable nested translations, safe local images and real showcase examples.

**Architecture:** Deliver vertical section slices through the existing registry, typed-list documents, native controls and static renderers. Shared item/source order stays on references; localized copy associates by ID. A separate server-only source metadata adapter supplies original-image dimensions; no derivative pipeline or new content encoding is introduced.

**Tech Stack:** Pinned Astro7.3.6, TypeScript, Zod, Tina editor3.14.3/CLI4.0.1/app2.5.14, Vitest, Playwright/axe, Node22.x ||24.x and pnpm10.13.1. The installed Astro dependency resolves Sharp0.35.5 through Node createRequire; verified during planning, no dependency upgrade/install is needed.

**Spec:** [Approved Composition B design](../specs/2026-10-18-starter-v2-composition-b-design.md).

**Status:** Written spec and implementation plan approved2026-10-18. Execution authorized after the separately completed routing and access-role prerequisites. Preserve the already selected medium subagents with independent task gates; no new execution-method choice is needed.

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

