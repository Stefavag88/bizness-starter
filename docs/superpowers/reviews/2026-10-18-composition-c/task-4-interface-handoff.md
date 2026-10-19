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
