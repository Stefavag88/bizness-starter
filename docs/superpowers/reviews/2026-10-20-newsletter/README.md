# Newsletter implementation evidence

Date: 2026-10-20. Baseline: `61e52ae`. Branch: `codex/starter-v2-newsletter-preferences`.

## Implemented

CMS Settings own independently enabled modal and compact footer signup, localized visual rich text, prompt copy, consent labels, interest and timing. The footer supports off, open-modal and inline modes. Shared browser state, request handling and native dialogs preserve the current Worker double-opt-in flow. Developer module flags default false; the default enquiries example remains unchanged.

See [authoring and delivery boundaries](../../../NEWSLETTER.md), the [design](../../specs/2026-10-20-starter-v2-newsletter-preferences-design.md) and [implementation plan](../../plans/2026-10-20-starter-v2-newsletter-preferences.md).

## Verification

All seven standard gates exited 0: check, test, build, Worker dry run, local native CMS build, static routing and showcase builds. Exact PIDs, timestamps and exit codes are in `runner/gates-final.json`; raw outputs are archived alongside it.

The final standard suite passed 962 root tests and 41 Astro renderer tests (1003 total), with one existing environment-conditional native-query skip. The skipped indexed query was then run explicitly against the restored real CMS and passed: `runner/closeout-indexed-test.log`.

The detached full acceptance run passed two tests: five actual Tina saves with installed GraphQL coercion/serializer byte proof, plus responsive EN/EL public UI and a real isolated D1 lifecycle. It verified pending -> active -> unsubscribed -> suppressed, uniform202 responses and no personal browser storage. Native proof includes module disable/save/re-enable retention, footer-only mode, configured timings/interest, native rich AST preservation and nurture/manual-dialog behavior. Exact source/schema/wire/expected-byte evidence is archived under `runner/full`.

A separate focused acceptance run passed live cross-tab storage events, reset of only the module key, keyboard background-control inertness, manual signup with denied storage and the modal-only no-JavaScript Contact fallback. Its blocked-storage request response was deliberately stubbed; the separate main lifecycle used the actual Worker, capture flow and isolated D1. See `runner/preferences`.

Public layouts were checked at 375/768/1440 in EN/EL. Failure paths included denied/corrupt/write-failed storage, failed controller import, no JavaScript, reduced motion, active form, hidden-document state, another open dialog and excluded Contact/Privacy/system routes. Background visibility was simulated with the browser visibility event; this is not an OS-level background or cross-engine certification.

The main source inventory was unchanged across each detached run. The normal project/config/content and normal database were not used as fixture mutation targets. All fixture stacks were stopped by owned child identity. The normal site/CMS was restored with six HTTP200 endpoints and indexed Settings/Home, and a default-profile browser check proved no newsletter root/forms/controller request. See closeout records in `runner`.

## Corrections and rulings

Browser RED/GREEN found and corrected initial modal focus. A renderer RED/GREEN added the Contact fallback to modal-only use. A CMS-field regression aligned native field defaults with runtime defaults. Native query validation and native CMS build subsequently passed; a fresh end-to-end blank-object authoring flow was not separately claimed.

- Reused the clean dedicated feature checkout instead of another worktree. This preserves the established local path; filesystem isolation is weaker, mitigated by detached fixtures.
- Compared preserved indexed native ASTs and exact installed-serializer-derived bytes, rather than requiring initial Markdown strings to retain noncanonical trailing newlines. A semantic-only comparison would be weaker; both AST and exact-byte checks remain.
- Retained native dialog behavior. Chromium can expose BODY while cycling through browser chrome; the test permits that non-control stop, rejects outside controls and explicitly proves background-link focus is blocked. Other browser engines have not been certified.

The full native/public run and the focused preferences run are complementary independent fixture runs; they are not described as a single fresh three-test run. Their exact timestamps and inventories travel with the evidence.

## Delivery limits

No hosted protection adapter/widget/CSP provisioning, real sending/provider account, deployment, optional tracking integration or generic cookie-consent platform was added. Hosted signup remains fallback-only without authentic protection. Existing confirmation emails/token pages remain English. Browser suppression is convenience, not subscription proof, consent storage or unsubscribe.

Independent final review completed with one Important finding. It was fixed in one author RED/GREEN pass, including genuine BFCache restoration and safe teardown; the post-fix suite passed 967 root +41 site tests (1008), checks and build. One documentation Minor remains deferred. See [final review and resolution](FINAL_REVIEW.md). No push, merge, deployment or release tag.
