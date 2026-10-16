# Foundation implementation decisions

These decisions resolve details left open by the approved Foundation plan. They are local implementation choices, not a release or hosted-production approval. Both reference repositories remain read-only.

| Decision | Reason | Cost if revisited |
| --- | --- | --- |
| Keep the existing nonsecret infrastructure and interest fields in ProjectConfig. | The selected Worker contracts require them. | Configuration/schema adjustment; no resources were provisioned. |
| Bootstrap planning artifacts in the conversation workspace, then execute from the new repository. | Avoid writes in either reference project. | Documentation relocation only. |
| Define one explicit Route contract, including person detail routes and paths without trailing slashes. | Astro, manifests, feeds and locale alternatives need the same destinations. | Coordinated route/type updates before release. |
| Require article publishAt per locale; updatedAt cannot precede it. Other publication dates are optional and translations do not inherit a schedule. | Publication is independent per locale. | A deliberate content-contract revision before release. |
| Treat blank/null optional article relationships as absent, and validate supplied IDs. | Match native editor clear states without introducing sample-data dependencies. | Schema/editor normalization changes. |
| Use GraphQL-safe page, section and copy-map IDs; keep slugs and editorial scalar IDs independent. | Native Tina field names cannot contain dashes. | Stable-ID renaming and translated copy-map updates. |
| Keep shared identity, contact destinations, privacyVersion and navigation destinations outside translated copy. | One authoritative source prevents conflicting business facts. | A deliberate ownership/schema change. |
| Normalize native regional locale keys only on detached validation/loading projections; reject duplicate aliases. | Preserve the actual editor values while supporting its storage conventions. | A codec adjustment, without legacy starter compatibility. |
| Share a browser-safe catalog validator and generate a structural CMS descriptor. | Save/build checks agree without importing filesystem code into the editor. | Validator/descriptor interface changes. |
| Protect seeded page identity and section structure during Foundation. | Page creation and section add/reorder belong to stage 2. | Additional authoring controls, not a new content model. |
| Include canonical campaign drafts for newsletter/nurture; enquiries does not read them. | The approved profile-aware CMS requires this omitted contract. | Small schema/tests changes; no sending is activated. |
| Use the verified editor3.14.3 / CLI4.0.1 / app2.5.14 graph. | app2.5.15 imports an API unavailable in the pinned editor. | Reverify a coherent dependency graph and native roundtrips when upgrading. |
| Keep native rich text as stored Markdown, and validate detached editor AST through the installed serializer. | Preserve native editing while rejecting unsafe or unsupported content. | Serializer/schema compatibility work on a future upgrade. |
| Use the supported skip-indexing flag only for isolated local CMS builds. | Repeated CLI4.0.1 local indexing stalled; these builds have no query consumer. Full dev indexing, native queries and UI saves were separately tested. The connection-race explanation remains an inference. | Isolated builds do not independently prove indexing; retain real dev/editor verification. |
| Keep the new local repository and branch without merge, push or tag. | This is the explicitly approved separate-project delivery boundary. | Integration can be chosen later; no shared state changed. |

The six initial section renderers are intentionally neutral. JSON-LD, photographic media, social controls, motion, visitor preferences and business presets are not added by implication. Their owners and the remaining stages are documented in the approved design and Foundation evidence.

## Final-review authoring and release decisions

| Decision | Reason | Cost if revisited |
| --- | --- | --- |
| Disable native Delete for Offerings, People and Articles during Foundation. | Native deletion bypasses the save hook and scalar canonical IDs are relationship targets; the existing catalog guard cannot prevent this mutation. | Stage 2 must provide relationship-aware authoring/deletion before exposing Delete; retain stable IDs and dangling-reference validation. |
| Explicitly disable both native folder controls across every collection and reject nested native save paths. Active collection subfolders fail public loading with actionable instructions. | Foundation has flat collection documents; silently ignoring native nested documents can hide published content or break relationships. Dormant article/campaign folders retain their unread profile gates. | Deliberate recursive discovery and authoring/ownership contracts would be required to add folders; no folder feature is implied. |
| Require explicit redirects for changed published editorial slugs before hosted release. | Previously published URLs must remain supported under the approved architecture. | Stage 2 authoring and the release gate must enforce this requirement; the redirects subsystem is outside Foundation. |
