# Composition B controller rulings and costs

All decisions below were made during the approved execution. They supplement the task reports and the design decisions document. The final review accepted the implementation at f9b93e2; no final fix wave was required.

| Ruling | Reason | Cost or risk |
| --- | --- | --- |
| Continue from the accepted routing and access-role commits. | The user requested these prerequisites before Composition B. | Reversing the choice requires separating those integrations; no hosted side effects occurred. |
| Use the current owned launcher rather than the historical PIDs in the plan. | Revalidate ownership before stopping processes. | A mistaken ownership check could interrupt local work; no reference-project process was targeted. |
| Distinguish known toolchain advisories from new failures. | The pinned baseline already emits SQLite, color-variable, performance and line-ending notices. | New warning regressions still need investigation; the final review found no demonstrated behavioral regression. |
| Defer actual Cancel-click proof from Task 1 to Task 4. | No additional DOM test dependency was needed; the real native gate owned that behavior. | UI defects could have survived until Task 4. That gate subsequently passed with zero mutations and unchanged bytes. |
| Interpret the media adapter root as the repository root. | Its uploads directory is apps/site/public/uploads, matching Astro and Tina. | Future callers must preserve that directory contract. |
| Accept narrowly observed native link/text metadata. | Installed Tina emits target: undefined and opaque text-leaf IDs. | Keep strict negative and AST-identity regressions; defined targets, unknown attributes and malformed IDs remain rejected. |
| Attempt independently owned cleanup even if another cleanup fails. | A conflicted Page must not strand a proven temporary PNG. | A conflicted test Page can retain a reference to a removed test image; backups and aggregate diagnostics support reconciliation. |
| Require confirmed shutdown and an exact full source snapshot before each restore-build command. | Do not consume unknown inputs or rebuild alongside an unconfirmed runtime. | Extra bounded hash reads; conflicts skip regeneration and require reconciliation. These checks are not atomic filesystem locks. |

The complete chronological ledger is archived in progress.md. Final review scope, declined behaviors and verification limits are in final-review.md. No merge, push, tag, deployment, hosted setup or real sending was performed.
