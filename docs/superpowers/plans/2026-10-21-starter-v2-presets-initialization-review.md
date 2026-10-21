# Independent whole-branch review

Date: 2026-10-21. Reviewer: fresh read-only gpt-6-astra agent. Original reviewed range: `56ea47d..b614e23`. No second reviewer was dispatched. This preserves the original findings; controller correction results follow in the evidence/ledger.

## Strengths

- Explicit export inventory, safe configuration defaults, exclusive file creation and preservation of failed destinations provide a sound foundation.
- Preview context reaches the shared renderers, including rich text, locale navigation and Room links. Contact controls are disabled and visitor-state initialization is omitted.
- The recorded independent installs/builds, Greek-only and Articles-disabled cases, native CMS roundtrip, and nonlocal artifact checks address substantial integration risks.

## Original findings

Critical: none found.

### Important 1: a destination named ..client bypasses source ancestry rejection

Original location: scripts/initialize/destination.mjs:11. For destination <source>/..client, relative(source,destination) is ..client. startsWith('..') mistakes an ordinary child name for parent traversal. The reverse comparison passes too; CLI validation rejects only an exact .. segment. Initialization can therefore create a nested client inside the source checkout. Check the actual parent segment and reject before destination creation.

### Important 2: seed/media fingerprints can describe different consumed bytes

Original location: scripts/initialize/initialize.mjs:18. Bundle generation/validation precedes seed/media fingerprinting. An image edited between validation and hashing leaves old output with new fingerprints. Static seed-module imports likewise allow old cached content with new source hashes. Capture and verify the actual inputs consumed, including cached-seed and generation-to-fingerprinting race cases.

### Important 3: cached directories bypass intermediate ancestry checks

Original location: scripts/initialize/initialize.mjs:32. After apps/site exists, moving apps outside and replacing it with a junction preserves the inode/device of apps/site reached through the junction. Root checks pass and cached-directory validation checks only that child. Additional files can be written outside the validated destination until final inspection fails. Validate the complete directory chain before each creation.

### Minor 4: dry-run output lacks a resolved configuration summary

Original location: scripts/initialize/initialize.mjs:26. It reports destination, filenames, revision and next commands, but omits preset, resolved theme, languages/default and reset policy. A summary would improve pre-creation review.

### Minor 5: partial-write inventory omits the partially written file

Original location: scripts/initialize/initialize.mjs:38. createdFiles is updated after successful write/close; a write failure leaves an unlisted file. Record successful exclusive creation immediately, optionally tracking completion separately.

## Original recommendations and assessment

Use the single correction pass for the Important findings, with regressions proving rejection before unsafe writes and provenance matching consumed inputs.

Ready to merge: **With fixes**. Application and preview work are well supported; initializer ancestry and snapshot consistency need correction. The review inspected implementation, tests and evidence without rerunning lifecycle suites or changing files/HEAD/index/processes.

## Declined to judge

Hosted provisioning, identity isolation, provider delivery and retention readiness remain explicitly blocked and outside this local implementation's scope.

## Controller grading and correction

Findings 1–3 retained as Important. Finding 5 regraded Important: users recovering a failed initialization need all created files, including an incomplete one. Finding 4 remains Minor and deferred. The hosted scope remains deliberately blocked under the owner's instruction.

Five concrete regression failures were observed before correction: dot-prefix descendant, cached seed data, late image fingerprinting, replaced intermediate junction and incomplete-write inventory. The correction uses segment-aware ancestry; pre-generation hashes verified before/after generation in a fresh Node process; full cached-directory ancestry checks before each creation; and immediate recording after exclusive open. No failed output or unknown editor bytes are deleted.

Focused correction and byte-parity checks: 19 passed across initializer, cached-generation and export tests. Each of the five presets produces identical validated project/content/media bytes through isolated generation. The full post-correction suite and exact final commit are recorded in the dated evidence and execution ledger.
