# Task 2 implementation report

Base: `1367a9e` on `codex/starter-v2-contact-social`.

## Changes

- Added `tina/fields/contact.ts` with `contactFields(): TinaField[]` and `socialFields(): TinaField[]`, using the existing text factory.
- Contact exposes required Email, optional Phone with exact callable-format/display-only guidance, and translated multiline Address.
- Settings exposes exactly one shared `Social channels` root object with Instagram URL, LinkedIn URL, Facebook URL, WhatsApp international number and Show social icons in header controls in enquiries/newsletter/nurture. URL help requires platform HTTPS; WhatsApp help includes the example +302101234567 without a destination default. Address alone is reused in translated Contact groups.
- Added 20 tests in `tests/cms-contact-social.test.ts`: four authoring tests and sixteen existing native-save boundary characterizations. The latter invoke the collection's actual `ui.beforeSubmit` hook, which resolves the real update submission, detached validation and catalog guard. A filesystem-backed data-layer response supplies the current complete catalog; no write/persistence bypass was introduced.
- The existing `settingsDocumentSchema` already consumes Task 1's shared schema through `settingsSchema.shape`; `normalizeSettingsDocument` and the installed save hook already validate it. No changes to `tina/validation.ts` were necessary.

## RED / GREEN and commands

All raw logs are in this report's directory and contain explicit exits.

| Command / log | Result |
| --- | --- |
| `pnpm exec vitest run tests/cms-contact-social.test.ts` / `task-2-red.log` | Genuine initial RED, exit 1: all four new authoring tests failed because all three profiles lacked the social group and Email lacked required/label metadata. No production edits preceded this run. |
| Same command after adding native save characterizations / `task-2-save-baseline.log` | Exit 1: same four authoring failures; all sixteen existing save behaviors already passed before field implementation. These are explicitly baseline characterizations, not claimed new-behavior REDs. |
| `pnpm exec vitest run tests/cms-contact-social.test.ts tests/cms-save.test.ts tests/cms-schema.test.ts` / `task-2-green.log` | Exit 0, 3 files / 34 tests passed after field implementation. |
| `pnpm check` / `task-2-check.log` | Initial exit 2: spreading the existing broadly typed `text(): TinaField` caused a union-type assignment error. |
| `pnpm check` / `task-2-check-corrected.log` | Exit 0 after explicitly narrowing the new string controls, with 53 Astro files, 0 errors/warnings/hints. |
| `pnpm test` / `task-2-full-test.log` | Exit 0, run once on final source: 78 files passed / 1 skipped; 875 tests passed / 1 opt-in native-query test skipped. Site render suite: 7 files / 24 tests passed. Raw output retains expected failure-injection child-process messages and experimental SQLite warnings; no test failed. |
| `pnpm cms:local-build` / `task-2-cms-build.log` | Exit 0. Native schema/client/editor compilation completed; launcher stopped its owned Tina process. Uses the repository's existing local-build skip-indexing behavior; this is not live indexed-query or UI-save proof. |
| `git diff --check` / `task-2-diff-check.log` | Exit 0. Git reported only its normal LF-to-CRLF working-tree warning for Settings. |
| SHA256 comparison of `canonical-before.json` / `task-2-canonical-hashes.log` | Exit 0, 16/16 canonical project/content/upload hashes match after CMS compilation. |

Configured service ports 4330/8790/4010/9010 were confirmed stopped before check/full suite/CMS build and after CMS build. No dependencies, hosted actions or stack restart occurred. Generated output remains ignored and uncommitted.

## Self-review

- Shared URLs/toggle appear outside translations; all three functional profiles consume the same Settings factory.
- Existing required mailbox contract is also explicit in the native control. Phone guidance retains arbitrary display text compatibility and documents when no telephone link is created.
- Actual-shaped absent/null/empty/whitespace and parent-null social values pass the existing hook; null optional phone/address pass without modifying original input.
- Invalid platform URLs, a malformed WhatsApp number and string/numeric booleans reject with exact `social.<field>` issue paths before catalog I/O, and therefore before persistence. Translated email/phone/social overrides reject.
- Native legal.notice AST object, link, leaf, translated AST, opaque IDs and the own `target: undefined` property survive valid save checks unchanged. Input values remain identical after both successful and rejected checks.
- Generated native types expose nullable Social fields and Boolean showInHeader, while translations expose Contact Address only.
- Canonical serialized seeds still omit social. No normalization rewrite or generated tracked file changed.

## Concerns / limits

No outstanding implementation concern found. Task 4 must still prove real UI selection/edit/clear, installed serialization/persistence, reload, and absence of GraphQL/ghost-link problems. This task's unit and build evidence does not claim that UI proof. Independent immutable candidate review remains the controller's next step.

Candidate commit: 5edc499cec99ead03e43f2cec1df30ef08e92071
