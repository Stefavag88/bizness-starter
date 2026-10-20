# Stage 3B contact/social — independent whole-branch review

Date: 2026-10-20. Reviewer: contact_final_review. Immutable range: `3519bcd345c3dfc4a425b935bd59100a9f80e3f0..180f4ea1b895c4d5d998dcd956c2370b82768bc3` (five commits; supplied 181966-byte review package). No product, index, HEAD, branch, canonical content, or runtime changes were made. This report is the sole authorized review output.

## Scope and method

Read the approved design, implementation plan, binding contracts, progress/rulings ledger, final-review context, Task 4 report and evidence index. Inspected the changes across pure contracts, localization, Tina fields, components/styles, icon registry/notices, admission/coercion/ownership helpers, public/native acceptance specs, unit/render tests, scripts and documentation. Followed the code-reviewer template and judged unspecified behavior against reasonable editor/visitor expectations.

Used read-only source inspection and retained raw evidence rather than rerunning already evidenced broad suites. Independently read the seven-command ledger in acceptance-V2qmjt: all seven records have positive PIDs, ended timestamps and exit 0. Read native invocation/cleanup/indexed-query records in acceptance-KCY5qC: exit 0, three saves, 25 successful queries, browser and both runtimes stopped, settings restored, snapshot matched and canonical regeneration completed. A read-only Node comparison independently confirmed each retained predicted-byte SHA256 and deep equality of all three submitted legal/translation ASTs against pre-edit indexed values. Read all five final public matrix files and ten axe reports: 12 contexts per fixture, 60 total, no reported axe violations. Visually inspected the retained Greek all-on 375px screenshot. This is inspection of historical evidence, not a new live suite run.

An initial sandboxed git-status call saw a non-worktree mapping. Repeating the authorized read-only check through escalation confirmed a clean actual checkout and HEAD 180f4ea. No Git-state repair was attempted.

## Strengths

- Shared normalization and destination projection are small and correctly separated from Tina/Astro. Optional social defaults, strict keys/booleans, root-only ownership and detached nondefault-locale reconstruction prevent migration and localization regressions. The canonical seed remains unchanged.
- Platform validation combines the existing safety predicate with parsed HTTPS/host/credential/port checks. Phone display compatibility is preserved without guessing a number, and the mailbox is encoded as a complete URI component. The withdrawn mailto exception did not enter implementation.
- The three placements consume one projection. Conditional social groups disappear, direct links remain same-context, external links carry target/rel and localized new-tab text, and SVGs remain static/decorative. Contact retains required fields, action, script and form-first DOM. The placement labels correct the actual duplicate-landmark finding without redesigning navigation.
- Native proof models installed GraphQL input ordering before installed serialization. The optional exact-byte guard compares before ownership and revokes stale claims on rejection. Static fixtures use caller-known bytes. Cleanup still attempts independent restoration after shutdown failure and refuses regeneration on conflict.
- Tests exercise schema/native clears, detached AST preservation, actual Astro rendering, installed coercion ordering, foreign equal-JSON/different-byte preservation, actual editor saves and static Worker assets. Failed runs and recovery rulings are retained honestly rather than collapsed into a fictional uninterrupted success.
- No dependency upgrade, new browser SDK, remote icon loading, Worker endpoint, data migration, seed insertion or outbound platform action is introduced.

## Issues

### Critical — must fix

None found.

### Important — should fix

None found in the reviewed implementation or accepted local behavior.

### Minor — nice to have

1. **The selected source inventory is narrower than all behavior inputs.** `scripts/verify-contact-social.mjs:9` and `docs/superpowers/plans/2026-10-20-starter-v2-contact-social-evidence.md:38`.
   - The driver hashes packages, site source, Tina collections/fields, scripts/tests/e2e and three root files, but omits top-level Tina configuration/validation and site/Worker build-entry/configuration inputs. This is distinct from the complete canonical project/content/uploads snapshot, which serves a different purpose.
   - Consequently equality of native/public inventories proves equality only of the listed paths; it cannot independently prove that every behavior-affecting input remained equal at those historical times. The ledger discloses this, but the permanent evidence's unqualified behavior-stability sentence can be read more broadly.
   - Fix: qualify the permanent historical claim with this exact limitation during controller closeout. For future runs, include the relevant top-level Tina, site/Worker config and build inputs in a deterministic inventory (or a tracked-source inventory with deliberate exclusions). Do not retroactively imply that newly hashed paths were captured historically. This is nonblocking because no actual omitted-source drift or behavior regression was found, and later gates and existing provenance provide additional evidence.

2. **Dense lifecycle lines make the safety boundary harder to audit.** `e2e/contact-social-cms.spec.ts:16`, `e2e/contact-social-cms.spec.ts:19`, `e2e/contact-social-cms.spec.ts:21`, `e2e/contact-social-cms.spec.ts:37`, `e2e/contact-social.spec.ts:14`, and `scripts/verify-contact-social.mjs:12`.
   - Setup, pre-dispatch proof, ownership, assertions and cleanup contain many independent operations on very long lines. Correct ordering is especially important here, so a later maintainer can accidentally move a claim/assertion or cleanup step without noticing.
   - Fix: a future focused readability change should expand statements and extract narrowly named local proof/setup functions while preserving the single owner and exact dispatch/cleanup order. Do not create another generic framework. Existing fault tests should verify the refactor. No current ordering defect was found; this is nonblocking and does not justify rerunning every acceptance phase now.

## Plan alignment and deviations

The product slice matches all four planned units: optional shared settings, CMS authoring/clearing, static reusable placements, and actual local acceptance. No material unauthorized product expansion was found. The localized placement prop is a justified correction from real axe evidence. The additive exact-byte parameter and installed GraphQL coercion are justified narrow changes needed to meet the original ownership contract. Reusing the approved dedicated checkout accords with the recorded controller ruling.

The plan's historical RED requirements were not fully met for Task 1 supplemental URL cases and the initial Task 4 11-case run. These are process deviations, not hidden implementation failures: the supplemental cases later had mutation RED, the first Task 4 run failed collection without executing assertions, and later exact-byte/coercion regressions have meaningful RED/GREEN. They cannot be repaired by renaming or rerunning historical logs. Current coverage plus explicit disclosure supports local acceptance.

## Deferred-item triage

| Item | Disposition |
| --- | --- |
| Task 1 supplemental platform tables initially GREEN | Accept disclosed historical test-first limitation; preserve original log and later mutation evidence. No retroactive RED claim. |
| Initial Task 4 11-case RED was collection-only | Accept disclosed process limitation; preserve meaningful later exact-byte/coercion assertion RED and complete GREEN separately. |
| Narrow selected source inventory | Minor issue 1; qualify historical language at closeout, improve future coverage. No claim of equality for omitted inputs. |
| Dense lifecycle/proof lines | Minor issue 2; deferred readability work is reasonable. |
| Intentional child, SQLite/Vitest and NO_COLOR/FORCE_COLOR warnings | Nonblocking retained output; do not claim warning-free general suites. The zero-diagnostic Astro check is a separate bounded claim. |
| Original launcher, archive and artifact statuses still pending | Controller-owned closeout obligations, not defects in this immutable implementation. Completion must not be claimed until done. |

## Recommendations

Accept this local implementation without a product fix wave. At final documentation closeout, explicitly qualify source-inventory scope and record the controller's decisions on both minor findings and each declined behavior below. Preserve all failed attempts, exact-hash recovery ruling and raw records before archive/cleanup. Finish the planned original-stack readiness checks without converting this review into hosted readiness or broad accessibility certification.

## Declined to judge — controller disposition required

- Hosted CMS/provider configuration, deployed rebuild freshness and production sending: no hosted environment or provider operation is part of the approved local slice; local link behavior was reviewed.
- Whether an external social page exists, belongs to the editor, redirects, or opens an installed native application: the contract validates destination syntax/host and explicitly avoids outbound navigation and app-launch guarantees.
- Legal permission for brand-logo use: the pinned source metadata and full notice were inspected; trademark/legal certification requires a different review.
- Independent fresh upstream commit authenticity: this review inspected the retained pinned registry/notices and provenance statements; it did not repeat external retrieval, so it does not add a second upstream-verification claim.
- Exhaustive accessibility across assistive technologies, every browser/theme/zoom/viewport and arbitrary future content: the actual rendering, representative screenshot and bounded matrix/axe/focus evidence support the stated local scope only.
- Atomic exclusion of concurrent external filesystem writers: compare-before-write is explicitly best effort; this review judged exact-byte admission/revocation/conflict preservation, not an absent cross-process lock guarantee.
- Exact-byte guarantees for unrelated older helper callers: the optional argument deliberately preserves their previous semantic mode; expanding all historical suites is outside this slice.
- Historical equality of source inputs absent from the native/public inventories: impossible to infer from those inventories; handled explicitly as minor issue 1 rather than silently assumed.
- Current original-launcher readiness, final evidence archive and completed artifact checkboxes: intentionally assigned to the controller after review; not executed here.
- Production form endpoint/anti-abuse/provider correctness and unrelated media implementation: unchanged boundaries outside this immutable slice; preservation of the form and relevant shared helpers was reviewed.

## Assessment

**Ready to merge? Yes, for the approved local implementation scope.** This is a review verdict, not authorization to merge, push, deploy or perform any remote action.

**Local acceptance verdict: ACCEPT.** No Critical or Important finding remains. The design is implemented coherently and supported by substantive retained native/static/gate evidence; the two minor issues are documentation/evidence precision and future auditability. Controller closeout, explicit residual adjudication and original-stack restoration remain required before declaring the whole task complete.
