# Composition C Task 3 report

Status: implementation complete; independent review is controller-owned and remains required before enquiry integration. Base: `9c2a2560ea800a2c5c50853f7b9b2d9372989073`. Implementation commit: `b6d5f38bf61fdcc9d7887e89e098e2f9304fa1b0`. Commit subject: `feat: add optional rooms authoring and presentation`.

## Delivered scope

- Browser-safe Rooms contract and declarations in `packages/domains/rooms/{contract.mjs,contract.d.mts,types.ts}`: Room/LocalizedRoom typed maps; publication/index dependency; stable image/amenity ID joins; numeric, list, prose, source/crop and localized membership bounds. Bed description accepts empty text as allowed by the approved design.
- Module-owned immutable item/source operations in `items.mjs` and matching declarations. Add/remove/reorder and explicit locale/item-copy initialization preserve unrelated native AST references. Removing an item prunes localized copy without removing upload files. Translation initialization supplies draft status and blank localized text, never default-language prose.
- Native Room collection, fields and custom controls in `tina/domains/rooms/`. Shared structure/source/crop controls only occur in the default locale. Localized item fields render registered native fields directly; missing copy exposes explicit initialization. Item removal requires its own confirmation. Identity is read-only for persisted initial contentId/slug and is save-validated by the common guard. The collection disables native Delete/folders and supplies native rich AST draft defaults. Module-owned `applyRoom` updates changed refs/copy/translations in one batch; Page-only `applyComposition` is unchanged.
- Actual Astro RoomDetail/RoomList reuse existing Description/RichText/SectionImage, source adapter, design classes and localized labels. Detail has one H1, guest/beds/amenities/body/images and encoded localized contact CTA. Listing uses the first shared image, localized description and required empty-state copy. No new palette, effect, lightbox or derivative generation.
- Dormant draft EN/EL `content/pages/rooms.json` with required hero and room-list; empty `content/rooms/.gitkeep`. No Room records, canonical Home/settings/navigation/project design edits or schemaVersion change.
- `docs/ROOMS_AUTHORING.md` documents enablement, identity, structure/copy, bounds, locale/index publication and the extension recipe.

## Exact registration/configuration changes

1. `packages/config/project.mjs` and `.d.mts`: explicit strict `modules.rooms` boolean, default false; unknown keys still fail.
2. `packages/content/domain-registry.mjs`: static `roomsDomain`; paired declaration imports Rooms type augmentation.
3. `packages/content/module-extensions.mjs`: template `rooms` and `roomListDefinition`; paired declaration imports augmentation.
4. `tina/domains/index.ts`: `{key:'rooms',allowCreate:true,assertIdentity:assertRoomIdentity,buildCollection:roomCollection}`.
5. `tina/fields/section-copy.ts`: module-owned room-list field factory, including required emptyMessage; dormant schema retained.
6. `apps/site/src/templates/domains/index.ts`: initialized RoomDetail renderer for rooms; existing coverage/duplicate negatives retained.
7. `apps/site/src/templates/sections.ts`: room-list renderer.
8. `apps/site/vitest.config.ts`: actual Astro rooms.test.ts inclusion.
9. Existing test expectations updated for eleven registered copy templates, rooms:false defaults, explicit project-aware disabled chooser, and unchanged default-enabled showcase samples. Showcase production implementation is unchanged.

## Controller-approved framework corrections

These two concrete defects surfaced only when the first production registration exercised the Task 2 contracts. Both were raised before modifying generic code and explicitly approved by the controller.

1. Renderer initialization cycle: registry -> RoomDetail -> shared rich/media components -> lib/content -> registry caused `Invalid renderer for domain rooms`. Removed the coverage import/call from `apps/site/src/lib/content.ts`; moved it to `getStaticPaths` in `[locale]/[...path].astro`. Coverage still fails before static route generation. Standalone content reads no longer promise renderer coverage. Actual Astro tests verify initialized RoomDetail identity and missing active coverage failure.
2. Required module translation fields: hardcoded `emptyCopy` omitted room-list.emptyMessage, so explicit translation initialization failed with `Invalid section copy fields`. `tina/fields/composition.tsx` now derives fresh blank text/empty arrays from the registered defaultCopy and initializes declared richFields as native empty ASTs. The detached translation-draft branch of `packages/content/composition.mjs` accepts blank text generically using validation-only placeholders (href remains `/`). Complete schema/save validation still rejects blank required text. Neither operation reads or rewrites existing locale ASTs, and no Rooms branch was added to a generic algorithm.

No other loader, localizer, catalog, route, native-save algorithm or unrelated template edits were made.

## RED/GREEN evidence

- Initial test-first root Rooms suites and actual Astro suite failed because the planned Rooms modules/renderers did not yet exist (module-resolution RED, not a passing assertion claim).
- Native adapter test exposed an initialization-order issue in a const identity callback; the Rooms-owned identity export became a hoisted function.
- Controller-approved initializer regression first failed with `Invalid section copy fields`; raw RED is `composition-c-task3-initializer-red.log`. GREEN proves missing-locale and optional-section initialization includes blank emptyMessage, native rich ASTs, existing copy AST identity, rejected complete save, then corrected successful original-value save.
- Native draft-default regression failed because body was an empty string; native rich AST defaults fixed it (`composition-c-task3-defaults-red.log`).
- Focused root: 3 files, 8 tests passed. Focused actual Astro: 1 file, 3 tests passed, covering text-only/empty states, safe localized CTA, first-image thumbnail, source width/height, crop classes, lazy loading and coverage initialization.
- First full run found six expected stale registration-fixture failures in domain-discovery, cms-static-schema, cms-composition-controls and showcase-samples. Expectations were updated at explicit seams; raw failed run preserved as `composition-c-task3-test-initial.log`. No failures were hidden.
- Final validation: `pnpm check` (0 errors/warnings/hints), `pnpm test` (604 passed + 1 existing skipped root; 21 actual Astro tests passed), `pnpm build` (23 default pages, no Rooms routes), and `git diff --check` pass.

Raw final command output is retained locally under `.generated/evidence/composition-c-task3-{check,test,build}.log`; focused and RED evidence uses the same prefix. Generated evidence remains ignored by repository policy. Node's existing experimental SQLite warnings occur in backend tests; there are no new dependencies or runtime warning suppressions.

## Task 4 handoff and concerns

Actual indexed Tina create/edit/reorder/rejected-save recovery, browser viewport/keyboard/accessibility behavior and fixture cleanup ownership must still be proved by Task 4. This report does not claim live UI proof. No stack was launched/stopped and no external delivery or reference-repository mutation occurred.

- Enable Rooms only in owned temporary config; preserve canonical dormant draft index, Home, settings and project bytes. The shared slug of the owned index sets the public prefix.
- Exercise native `room` draft creation with unique flat filename/contentId/slug. Confirm saved identity read-only behavior against actual Tina initialValues lifecycle and immutable save guards, disabled Delete/folders, native AST defaults and schema independence from records/item IDs.
- Controls are `RoomItems`, `RoomItemCopy`, `RoomTranslations`, `RoomIdentity`, and module-owned `applyRoom` in `tina/domains/rooms/items.tsx`. Structure fieldsets expose `data-room-item-id`. Use Add Room image through the installed image plugin, Add amenity, Move up/down, Remove/Confirm removal, Initialize locale Room translation and Initialize copy controls.
- Adding structure intentionally leaves supplied translated item copy incomplete; initialization is explicit and blank, and complete save rejects missing/blank alt/labels until corrected. Confirm failed-save correction remains reachable for nested native fields and AST associations survive reload/reordering.
- Include room-list translation initialization on an optional section and missing locale; supplied dormant index already has both locale copies. Blank emptyMessage is an editing draft only and must be corrected before save.
- Static detail CTA selects encoded `contextId`; generic enquiry acceptance/manifest/Worker integration remains Task 5. No reservations, inventory, pricing or sending behavior is added here.
- Independent review is still required. Generic algorithm freeze should include review of the two narrowly approved helper corrections above.

The report remains local under the existing ignored `.superpowers/sdd` policy; implementation and authoring documentation are committed. The final Git worktree is clean.

## Review fix round 1

Reviewed head: `b6d5f38bf61fdcc9d7887e89e098e2f9304fa1b0`. Important finding: Rooms projection admitted an immediately published translation but inherited the default locale future publishAt through the shared-field spread. The selected locale now explicitly supplies `publishAt`, including undefined, matching the existing localizedValue no-fallback contract. No other production behavior or formatting changed.

Regression tests cover EN scheduled/EL immediate and the reverse at the same captured clock, projected isPublished consistency, missing schedule preservation, route/alternate eligibility before the scheduled instant, reciprocal alternatives at that instant and unchanged source translation metadata.

Commands and evidence:

- RED: `pnpm exec vitest run tests/rooms-publication.test.ts tests/rooms-contract.test.ts` failed the EN-future regression with inherited `2027-01-01T00:00:00Z` instead of undefined. Raw output: `.generated/evidence/composition-c-task3-fix1-red.log`.
- GREEN: same focused command passed 2 files / 6 tests. Raw output: `.generated/evidence/composition-c-task3-fix1-green.log`.
- `pnpm check`: passed, 50 Astro files, zero errors/warnings/hints. Raw output: `.generated/evidence/composition-c-task3-fix1-check.log`.
- `git diff --check`: passed before commit. Live native UI and enquiry integration remain subsequent gates; minor structure-control formatting is deferred as instructed.
