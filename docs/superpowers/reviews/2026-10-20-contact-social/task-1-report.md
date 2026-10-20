# Task 1 report: pure settings and destination contracts

Status: verified local candidate, pending independent controller review. Work is confined to C:/Projects/bizness-starter-v2 on codex/starter-v2-contact-social from 1b8698a. No launcher restart, remote action, dependency change, source-reference edit or canonical seed rewrite.

## Changes

- Added browser-safe contact.mjs/contact.d.mts, fixed SOCIAL_CHANNELS ordering, strict socialSettingsSchema, phoneHref and contactChannels.
- Social settings normalize missing/null object and field clears to empty strings/false; supplied strings trim; booleans remain actual booleans; unknown keys reject. HTTPS provider hostname, credentials, port, length, unsafe-link and international WhatsApp checks are shared with settings validation.
- SettingsCopy now requires normalized SocialSettings; ContactLink and ContactChannels are explicit public types. Existing schema declarations already re-export these types. No barrel expansion was necessary because consumers use contact.mjs directly.
- Optional phone/address native null/absent values become empty strings while persisted phone strings retain their existing 100-character bound. Translation ownership stays strict. Both locales retain detached equal shared social settings.
- Contact projection preserves phone/mailbox labels, uses phone then email ordering, encodes the entire mailbox, provides unsupported nonempty phoneText, preserves address line breaks, omits empty optional data, and creates ordered external HTTPS social links.
- Normalized test fixture builder now includes required social defaults. Serialized settingsDocument deliberately omits optional social, continuing to exercise unchanged existing canonical documents.

## Test evidence and exact exits

Raw logs are in this report's directory.

1. task-1-red.log: pnpm exec vitest run tests/contact-channels.test.ts => exit 1; 11 failed, 4 passed. Meaningful missing normalization/schema/localization behavior, including unknown social root and absent defaults.
2. task-1-schema-green.log: same focused command => exit 0; 78 passed.
3. task-1-projection-red.log: same focused command => exit 1; 18 failed, 78 passed. Missing phoneHref/contactChannels exports demonstrated unimplemented projections.
4. Initial task-1-green.log attempt exposed one test setup issue: pinned z.email rejects literal ?/# mailboxes. Projection injection boundary now uses SettingsCopy directly; canonical email validation is unchanged.
5. task-1-mailbox-phone-red.log: same focused command => exit 1; 2 failed, 98 passed. Outer spaces before a leading phone + failed; controller's temporarily requested literal-percent mailbox case was rejected by isSafeLink's repeated decoding. The controller withdrew the percent exception, so that out-of-canonical case was removed and final isSafeLink remains authoritative. Phone handling was fixed to allow ASCII outer spaces while rejecting newline/control syntax.
6. task-1-platform-mutation-red.log: pnpm exec vitest run tests/contact-channels.test.ts -t 'platform destination validation' => exit 1; 18 failed, 45 passed, 36 skipped. Temporarily removed HTTPS/provider/port guard; restored exact source in finally. Platform tables were initially run GREEN alongside the schema implementation; this later mutation demonstrates their guards fail observably, but is not a preimplementation RED for those additional URL cases.
7. Final task-1-green.log: pnpm exec vitest run tests/contact-channels.test.ts tests/content-schema.test.ts tests/content-documents.test.ts => exit 0; 137 passed (99 contact + 38 existing).
8. task-1-types.log: pnpm exec tsc --noEmit => exit 0.
9. task-1-check.log: pnpm check => exit 0; Astro 53 files, 0 errors/warnings/hints.
10. task-1-full-test.log: pnpm test => exit 0; root 855 passed/1 skipped across 77 passed/1 skipped files; site 24 passed across 7 files. Existing intentional child-failure diagnostics and experimental SQLite warnings remain in the raw full-suite log; no failed test files.
11. task-1-diff-check.log: git diff --check => exit 0.
12. task-1-canonical-hashes.log: all 16 original SHA256 entries MATCH. The launcher process query before final gates returned no owned node/cmd processes.

## Self-review and concerns

- Pure runtime module imports only zod and the existing browser-safe rich-text helper; no filesystem, loader, Tina, Astro or production singleton import. All source/native inputs remain detached and untouched.
- Fixed destination order, phone digit limits/allowed syntax, unsupported text fallback, whitespace-only omission, WhatsApp boundaries, platform spoofing/unsafe encoded bypasses, and mailbox ?/# parameter encoding are covered with literal expected output.
- Pinned z.email excludes literal %, ? and #. The + mailbox case is canonically accepted; ?/# encoding is a construction-boundary test and does not claim the canonical schema accepts it. Per corrected controller ruling, no isSafeLink exception or richer mailbox schema was introduced.
- locale is accepted by the pure API; platform labels are invariant. Localized group/new-tab labels remain later component work.
- UI components, Tina authoring fields/serialization, native saves, browser verification and docs belong to later tasks; this task makes no claims about them.
- Process limitation: supplemental platform table tests did not have an initial preimplementation RED, as detailed above; mutation RED and subsequent full GREEN are retained transparently for independent review.

## Candidate commit

1367a9e5f92fcd8f78572ea0c0f815d6b6d4dcde — feat(content): add shared contact and social destination contracts. Commit exited 0 and contains only seven scoped source/test files. Evidence/report remain in the ignored planning workspace. Final git status --short is clean.
