### Task 2: Native Settings authoring

**Files:** Create tina/fields/contact.ts, tests/cms-contact-social.test.ts. Modify tina/collections/settings.ts; amend tina/validation.ts only if shared projection needs explicit wiring.

**Consumes:** Task1 socialSettingsSchema and normalized settings contract; existing text/object field factories and installed native-save validation.

**Produces:** contactFields() and socialFields(), each returning TinaField[]. Settings exposes one shared Social channels group and the existing translated address only; no translated social URLs/toggle.

- [ ] Write failing schema/validation tests: labeled Instagram/LinkedIn/Facebook URL inputs, WhatsApp international-number helper and Show social icons in header boolean exist once; EN/EL translations contain no shared destinations. Every functional profile exposes these fields.
- [ ] Validate native rich AST objects on unrelated legal.notice remain identical after detached save checks. Verify actual-shaped null clears/parent-null/defaults and invalid social save field paths through the existing validation entry, not a newly fabricated bypass. Invalid booleans and destinations must fail before persistence.
- [ ] Run pnpm exec vitest run tests/cms-contact-social.test.ts; capture RED, implement field factories/shared validation, run GREEN plus tests/cms-save.test.ts and tests/cms-schema.test.ts. Regenerate only with the owned stack stopped. Commit and obtain independent review.

