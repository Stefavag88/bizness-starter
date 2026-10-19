# Task 2 scoped re-review — fix round 1

Reviewed package: d2503c7..9c2a256 (fix commit 9c2a2560ea800a2c5c50853f7b9b2d9372989073).

## Verdict

**ADDRESSED. Scoped fix approved.**

The prior Important finding is addressed at packages/content/domain-publication.mjs:23. Requiring `parts[0] === ''` rejects `relative/en/item` and equivalent nonempty prefixes before the locale. Existing locale, canonical segment and reserved-prefix checks remain in place. A valid absolute path still satisfies the added condition. No new Critical or Important breakage was found in this fix.

The focused regression at tests/domain-projection.test.ts:72–75 supplies a malformed route for each of EN and EL while keeping the other locale's callback absolute. These cases exercise the shared projection validator used to build both public paths and alternatives (packages/content/domain-publication.mjs:7–15).

## Evidence inspected

- Prior task-2-review.md, task-2-brief.md, task-2-report.md (Review fix round 1 and its evidence disclosure), and review-d2503c7..9c2a256.diff.
- Actual .generated/evidence/task2-fix1-red.log: both new cases fail because the callback did not throw; 9 existing cases pass.
- Actual .generated/evidence/task2-fix1-focused.log: 2 files and 29 tests pass.
- Actual .generated/evidence/task2-fix1-check.log: TypeScript/Astro check completes with 47 Astro files, 0 errors, 0 warnings and 0 hints.

Historical full-suite/build and baseline comparison raw logs were not retained. The report transparently distinguishes its recovered historical command/transcript result from saved raw evidence. This remains an evidence limitation; this re-review neither recreated those logs nor independently confirms those historical runs.

## Scope

Reviewed only the prior finding, the fix diff, its immediate projection context and saved fix evidence. No broad original-diff review and no test/check reruns were performed. No product files, index or HEAD were changed; only this review report was written. No subagents were dispatched.
