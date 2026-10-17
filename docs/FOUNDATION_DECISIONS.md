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

## Composition A decisions superseding current Foundation limits

Historical Foundation decisions/evidence above remain a record of that stage. Composition A now uses schemaVersion 2, typed-list documents, Standard draft creation and optional section/navigation composition.

| Decision | Reason | Cost if wrong or revisited |
| --- | --- | --- |
| Reuse the explicitly selected isolated repository/branch in place. | Preserves the approved separate-project delivery boundary. | Later checkout relocation; neither source repository changes. |
| Keep normalized fixture factories separate from wire factories; no old disk-map reader. | Internal ID maps remain useful while disk has one typed-list representation. | Fixture refactoring, without adding compatibility. |
| Include common hooks and all save callsites in operation/path-context changes. | Collection-specific guards cannot work with inconsistent submission signatures. | Reviewable shared-hook changes. |
| Permit explicit complete draft translations during Standard creation. | Explicit editor initialization is allowed; automatic prose/publication is forbidden. | Narrowing creation policy is a deliberate guard change. |
| Reject shared scalar aliases at actual save; retain aliases in native typed-copy discriminators and opaque pure operations. | Installed serializer preserves scalar aliases but canonicalizes template aliases. | Malformed external values are rejected; valid native saves stay compatible. |
| Use a separate documented Node-owned cross-page same-ID/different-type fixture followed by native edit/save. | Immutable UI UUID generation cannot choose a collision ID. | Rework fixture proof without production overrides or raw mutations. |
| Reuse the unchanged complete-record evidence helper rather than edit it to satisfy a file checklist. | Existing create/update/absent-source ownership covers actual native saves. | A concrete later helper gap requires a scoped change. |
| Keep direct locale label correction beside fixed nested Settings editors, editing the same form state. | Installed editor blocks nested navigation after invalid Save until corrected. | Extra visible label inputs; no additional state owner or wire fields. |
| Retain original thrown native error/object after actionable alerts. | Error handling must preserve installed semantics and failure evidence. | Changes to alert presentation rather than swallowed/replaced failures. |
| Initialize evidence and capture ownership before diagnostic I/O; restore Settings before deleting an owned destination. | Failures and absent-source cleanup must not erase unknown editor bytes or break references. | More guarded acceptance code; no atomic cross-editor guarantee. |
| Keep isolated local skip-indexing and separate indexed native query/UI proof. | Accepted CLI build workaround does not itself prove indexing. | Reverify upstream behavior before changing the local workaround. |
| Retain failed native Windows UNKNOWN/open evidence; use one unchanged targeted retry after diagnosis. | One observed installed-writer failure was transient; hiding it or adding blind production retries is unjustified. | Investigate Windows native I/O if recurrence appears. |
| Use bounded public convergence checks after saves. | Vite HMR may abort immediate navigation while inputs settle. | A bounded test wait; continued failure remains visible. |
| Preserve the historical Foundation record and add Composition evidence. | Earlier evidence used schemaVersion 1, current acceptance uses schemaVersion 2. | Documentation separation only. |
| Leave independent task gate and final whole-branch review to the controller. | Implementer must not self-approve or spawn reviewers. | Subsequent scoped corrections remain reviewable. |

Composition B/C and stages 3/4, more renderers, Rooms, media/social/motion, visitor state, presets, destination initialization, hosted verification and releases remain deferred. Sending/marketing/review flags stay false. Neither read-only source repository receives installs, builds, saves or process stops. No remotes/secrets, real delivery, deployment, merge, push or tag are introduced.

| Additional Task 6 decision | Reason | Cost if wrong or revisited |
| --- | --- | --- |
| Model Node-owned public fixture creation as draft then explicit publication update; retain add-only dev freshness as unresolved. | Existing Vite handleHotUpdate reacts to changes, not add-only events; supported native create/publish already supplies the update. | Externally added published files may require another deliberate edit or launcher restart. A future watcher fix needs targeted add/unlink coverage. |
| Test the current skip link's fragment navigation and actual focused-link outline without claiming main focus transfer. | The existing main has no tabindex and does not become document.activeElement on activation. | This acceptance does not prove active-element transfer to the nonfocusable target; a later focus behavior change requires a scoped test/fix. |

## Final Composition A review decisions

| Decision | Reason | Cost if wrong or revisited |
| --- | --- | --- |
| Open actual native Page object editors using the installed active-field action, including after an invalid save. | Editors must be able to correct required metadata and localized hero fields without discarding current values, ASTs or errors. Native save validation remains mandatory. | Reverify native navigation API and recovery tests on Tina upgrades. |
| Never revive a permanently revoked fixture owner. A distinct one-off recovery requires independently retained successful native request/response, active schema and installed serializer, independently derived prior create, original-absence evidence and an immediate exact current-byte guard. | One test predicate incorrectly assumed Markdown had no trailing newline. Ordinary ownership correctly revoked itself and preserved the fixture. Complete independent proof established the precise current fixture before cleanup; any mismatch must preserve it. | Deletion of concurrent editor content if the proof or guard is wrong; comparisons remain best effort, not a transaction. This is not a production retry or a general ownership exception. |
| Archive final reviews and the final fix report under docs/superpowers/reviews, then remove the plan-specific scratch workspace. | Preserve review findings, their resolution and recovery decisions without retaining a tracked report in disposable scratch storage. | Documentation relocation and link maintenance only; runtime is unchanged. |

All final review findings I1/M1/M2/M3 were addressed in runtime commit d411bcad5db5dd2f284869d159287e752aacf181 and the scoped rereview found no new Critical/Important breakage. This is local Composition A acceptance, not hosted release approval. Existing add-only development freshness, unverified main focus transfer, best-effort concurrency and the observed Windows native writer failure remain disclosed in the authoring/evidence documents.
