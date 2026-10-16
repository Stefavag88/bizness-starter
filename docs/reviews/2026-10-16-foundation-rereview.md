# Scoped final rereview

Date: 2026-10-16. Reviewed range: `ab538d4c55a8aa2721fdf12a3773383fb45be4bf..22a33ccf922764d78119bb76a78c493ba7001b72` in `C:/Projects/bizness-starter-v2`.

Scope: the four P2 findings in `final-review.md`, their fixes/tests/documentation, and regressions introduced by those changes. The checkout remained read-only. No additional agents, builds, native saves, servers or broad test runs were started. This report uses source inspection and the supplied verification evidence, including the recorded generated schema and read-only native UI probe.

## Findings disposition

| Original finding | Disposition | Rereview evidence |
| --- | --- | --- |
| Native deletion bypasses relationship validation | **Addressed** | `tina/collections/common.ts:5` explicitly disables Delete for offering/person/article, while retaining stable scalar ID relationships and canonical dangling-reference rejection. This is the bounded Foundation protection accepted in the original review. Regression tests cover generated policies and detached seeded dangling-reference cases. Actual native UI evidence reports no Delete/Rename controls on all three collections, zero mutations, and unchanged content. |
| Nested native documents diverge from the flat loader | **Addressed** | Both folder controls are explicitly false on every collection. `tina/validation.ts:50` rejects slash/backslash-containing and non-JSON relative paths before projection/query access. The real collection-hook regression verifies its normalized nested path is rejected without mutating values. `packages/content/read.mjs:11` rejects subdirectories in active collections, including settings, with an actionable path/instruction. Profile conditions still avoid reading dormant articles/campaigns; regression tests cover both active rejection and dormant omission. |
| Footer legal notice prints literal Markdown | **Addressed** | Layout imports the established `RichText` component and renders the notice as a separate block after the business-name paragraph. Existing safe rendering and locale link resolution are reused. The new real Astro Layout tests cover both locales, emphasis, lists, localized notice links, escaped raw HTML in a defensive direct-render fixture, and absence of nested block/paragraph markup. The site-root test configuration is isolated and explicitly included in the ordinary test command. |
| System localized 404 route is not reserved | **Addressed** | `packages/content/catalog.mjs:4` includes `404` in the shared reserved set. Loader and detached existing-About catalog regressions exercise the original accepted-collision trigger. Native About slug changes continue to fail at the earlier protected-identity boundary, preserving editor values. Existing localized missing-page behavior is unchanged. |

## Regression assessment

No new actionable regression found in the changed paths. The changes are limited to explicit native capability restrictions, early path validation, actionable flat-folder loading, existing safe rich rendering, and a shared reserved-system-prefix addition. They do not replace canonical IDs, add recursive publication, bypass native serialization, or expand the approved stage.

The native UI probe evidence at `.generated/evidence/final-fixes-native-ui.json` records real row-menu checks, both localized public footers, zero mutation requests, unchanged canonical content and the generated action flags. The fix report records 219 ordinary test passes plus two actual Astro render passes and one opt-in skip; zero strict/Astro diagnostics; successful default build, Worker dry-run and isolated native build; normal full dev indexing and owned teardown. These reported runs were not needlessly repeated during this read-only rereview.

The supplied fix report also preserves its initial regression failures and test-harness corrections. The tests meaningfully cover the previously missed boundaries rather than only checking implementation text.

## Declined to judge

- The original final review's deferred-stage and verification-limit items remain unchanged; no additional outside-scope behavior was introduced or silently dropped in this scoped pass.
- A full relationship-aware delete/folder subsystem remains outside Foundation. The explicit protected capability and flat-file policies are now documented, with stage 2 ownership retained.
- Published editorial slug redirects remain a stage 2 authoring/release-gate obligation under the executor's explicit ruling. The added documentation retains the requirement before hosted release; this rereview does not claim that Foundation implements redirects.
- No production, hosted provider, complete accessibility, or broader new-feature certification is inferred from the scoped tests/native read-only probe.

## Verdict

**All four prior P2 findings addressed. No open findings in this scoped rereview.**

The final fix wave is acceptable for the approved local Foundation boundary. The executor retains responsibility for overall acceptance and the already documented deferred release obligations.
