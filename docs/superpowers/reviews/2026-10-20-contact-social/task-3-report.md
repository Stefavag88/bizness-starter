# Task 3 report: shared static contact/social UI

## Scope and outcome

Implemented on `codex/starter-v2-contact-social`, based on accepted Task 2 `5edc499cec99ead03e43f2cec1df30ef08e92071`. Components consume explicit typed props. `ContactDetails` renders direct channels, unsupported display-only phone and multiline address; `SocialLinks` renders configured social links with localized new-tab text, in labeled and icon variants. `ContactIcon` renders only a static seven-icon registry as decorative inline SVG paths, without `set:html`, CMS SVG, remote assets or an installed icon dependency.

Contact retains its heading, required fields, form action and entire client script. Its existing form section now contains a form-first grid followed by a compact aside; the split is exactly `56rem` and uses the specified `22rem` aside/token defaults. The noscript email now uses the same projected email destination. Footer preserves tagline, legal business identity, rich legal notice and Privacy while grouping shared contact/social components. Header main navigation/language markup is unchanged; the optional icon group appears only when configured and nonempty. Existing semantic colors, focus and radius remain authoritative. No animation, storage, tracking, provider or native-app probes were added.

`apps/site/vitest.config.ts` adds the focused test file to the existing explicitly enumerated site suite; this necessary test-registration change is additional to the component file list.

## RED / GREEN and raw command evidence

All raw logs below are retained alongside this report, with explicit exit values.

| Command / evidence | Actual result |
| --- | --- |
| `pnpm exec vitest run --config apps/site/vitest.config.ts apps/site/tests/contact-social.test.ts` / `task-3-red.log` | Exit 1, five assertion failures against existing actual Astro-rendered Layout/ContactForm before any production edits. Missing shared destinations/groups and configured header navigation caused failures. No missing component import or test discovery error. |
| Same focused command / `task-3-green.log` | Exit 0, five tests passed after implementation. One overbroad initial assertion excluding every script was narrowed to exclude inline script markup: the preexisting external ContactForm client script is required and remains. The genuine RED failures were missing feature assertions, independent of this adjustment. |
| `pnpm exec vitest run --config apps/site/vitest.config.ts` / `task-3-site-suite.log` | Exit 0, eight files / 29 render tests passed, including the existing bilingual safe rich-footer suite. |
| `pnpm check` / `task-3-check.log` | Exit 0, canonical configure, TypeScript and 57 Astro files; 0 errors, 0 warnings, 0 hints. Run once after production implementation. |
| `pnpm test` / `task-3-full-test.log` | Exit 0, run once after production implementation: 78 files passed / one skipped; 875 tests passed / one existing opt-in native-query test skipped. Subsequent site suite: eight files / 29 tests passed. Raw output retains the repository's expected fault-injection child errors and experimental SQLite warnings; no failing test. |
| `git diff --check` / `task-3-diff-check-initial.log` | Exit 2: one new blank line at EOF in `apps/site/vitest.config.ts`. Corrected only that whitespace after the passing checks above. |
| `git diff --check` / `task-3-diff-check.log` | Exit 0 after the EOF correction. Routine LF-to-CRLF Git warnings remain. |
| SHA256 comparison against `canonical-before.json` / `task-3-canonical-hashes.log` | Exit 0, 16/16 canonical project/content/upload hashes match after full tests. Current seeds still omit optional social. |
| Configured listeners / `task-3-ports.log` | Exit 0, ports 4330/8790/4010/9010 stopped; also checked before the site/final suites. No launcher started or stopped by this task. |

Tests use Astro's actual experimental container, detached bilingual localized settings, literal hand-derived destinations and rendered markup. They cover exact encoded email, callable phone, four social/WhatsApp URLs, target/rel, escaped multiline address/unsupported phone, seven decorative icon attributes, localized new-tab text, form-first DOM, required form controls/action, retained footer identity/privacy, header default-off/on with only configured icons, distinct navigation labels, empty address and absence of empty social headings/groups.

## Source provenance

Bootstrap Icons release `v1.13.1` resolves directly to pinned commit `ce0e49dd063243118a115f17ad1fe1fe7576d552` (lightweight tag). The GitHub commit endpoint returned this exact SHA; `task-3-source-provenance.log` retains its SHA/tree/message evidence. An initial attempt to interpret the ref as an annotated tag returned 404; the ref was already a commit and was subsequently verified through the commit endpoint.

Fetched only `icons/telephone.svg`, `icons/envelope.svg`, `icons/geo-alt.svg`, `icons/instagram.svg`, `icons/linkedin.svg`, `icons/facebook.svg`, `icons/whatsapp.svg` and `LICENSE` from pinned upstream raw paths. `docs/THIRD_PARTY_NOTICES.md` retains the full MIT license and SHA256 of each original UTF-8 source, including the license. The tiny registry preserves only path `d` and optional `fill-rule`; original SVG classes and unrelated attributes are omitted. Explicit viewBox, dimensions, currentColor and decorative attributes belong to the component. No arbitrary assets or packages were downloaded/installed.

## Self-review

- All placements reuse `contactChannels`; no destination concatenation remains in Layout or ContactForm, including noscript email.
- New components have no global settings/content lookup. Static allowlisted paths use ordinary escaped Astro attributes, never `set:html`.
- Direct links do not add target/rel; HTTPS links have `_blank` and `noopener noreferrer`, with textual platform names and localized hidden new-tab wording.
- Icon-only header names remain textual via a visually hidden span. Header touch targets and social icon size use the binding tokens, with wrapping; no main-navigation or language behavior was changed.
- Empty social arrays render no wrapper, heading or nav. Footer flex groups do not create empty columns/separators. Optional address is omitted when absent and rendered with `white-space:pre-line` when present.
- Contact remains first in DOM and mobile flow. Aside is later, with the exact `56rem` two-column breakpoint. Existing required form fields/action/script stay intact.
- Component styles reuse theme colors, focus and radius; no platform brand colors or new motion. Token defaults reside in foundations.css, with generated theme/CMS output unmodified.
- No canonical seed, dependency, source reference, hosted state or remote repository operation changed.

## Concerns and proof boundaries

No outstanding implementation concern found in this scope. Actual responsive browser inspection, focus/overflow/contrast evidence and native CMS edit/clear/serialization/reload proof belong to Task 4; container output is not claimed as that proof. No public production build/browser check was run in Task 3. Independent immutable candidate review remains the controller's next step. The report/log evidence directory is repository-ignored and retained locally, consistent with preceding task reports.

Final staged-diff verification also caught a redundant EOF blank in the newly added test (untracked files are not covered by an unstaged `git diff --check`). `task-3-staged-diff-initial.log` retains exit 2. Removed only this whitespace and verified the complete staged patch with exit 0 in `task-3-staged-diff.log`. The form client script is also identical to baseline after newline normalization (`task-3-form-script.log`, exit 0).

Candidate commit: 3093f652d7cb5a988b1b8b0bd7008d716cc28633
