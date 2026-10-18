# SDD ledger — plan: docs/superpowers/plans/2026-10-18-starter-v2-composition-b.md

Execution approved by the user on 2026-10-18: "ok, proceed" after the five-step plan summary and link. Workspace: C:/Projects/bizness-starter-v2, branch codex/starter-v2-composition-b. Starting HEAD: 21dad5bb8a871bd9c9436c12640fa5e188689355. Routing 50b15aa and access roles21dad5b are accepted predecessors and must remain intact. No new worktree: this task continues in the dedicated branch/path explicitly named by the approved plan.

## Preflight

| Tasks | Producer / consumer | Finding |
| --- | --- | --- |
| 1 and 2 | Registry copy/reference interfaces; media adapter isolated until activation | No shared mutable feature activation; Task2 does not register wire fields. |
| 1 and 3 | referenceFields/defaultReference/richFields/itemCopySchema and pure item operations | Task3 extends the registered metadata and same operations, no parallel item model. |
| 1 and 4 | Native item controls/correction and opaque AST handling | Task1 unit/render proof, Task4 installed UI persistence/recovery proof. |
| 1 and 5 | Registry/renderers and showcase exhaustiveness | Register actual renderers now; extend showcase fixture coverage at Task5. |
| 2 and 3 | parseMediaSource/mediaReferenceSchema/resolveSourceMedia | Limits and path semantics defined; browser-safe contract stays separate from server adapter. |
| 2 and 4 | Literal image fixtures and binary ownership | Metadata fixtures temporary, native fixtures uniquely owned; restore page before media. |
| 2 and 5 | Byte-hash metadata and public image semantics | Task5 covers live replacement and public errors without optimization claims. |
| 3 and 4 | setSectionMedia/native image callback contract | Task3 bounded native selection/clear probe before broad controls, Task4 full end-to-end proof. |
| 3 and 5 | Upload watcher and actual media renderers | Preserve existing Astro localized-static404 and local-only showcase integrations. |
| 4 and 5 | Owned JSON/media helpers and native/public fixtures | Shared helpers preserve permanent conflict revocation; all fixture cleanup remains exact. |
| 1 | Tests vs registration/native/render code | Internally consistent; no actual native-save claim at this step. |
| 2 | Metadata bounds vs adapter tests | Internally consistent; existing Astro-resolved Sharp, no install or derivatives. |
| 3 | Optional image vs shared gallery ownership | Internally consistent; media-text clear only, gallery removal explicit. |
| 4 | Native save proof vs restoration | Internally consistent; complete serializer-derived JSON plus predetermined binary bytes. |
| 5 | Sample assets vs nonlocal preview exclusion | Internally consistent; ordinary sample images intentionally public, dedicated preview code excluded. |

Ruling: Continue from accepted routing/access-role commits rather than the older planning HEAD — the user approved these prerequisites before Composition B — cost if wrong: integration changes must be separated/reverted, no hosted side effects occurred.
Ruling: Treat earlier plan launcher PIDs as historical and use the current owned session26593 — exact session stopped before baseline tests — cost if wrong: local interruption only; no reference process was targeted.
Ruling: Keep known dependency experimental/deprecation/line-ending advisories distinct from new test failures — the pinned baseline emits these warnings — cost if wrong: warning-related regressions could be missed, so novel warnings remain reviewable.

## Tasks

- Task 1: pending — FAQ and steps vertical slice.
- Task 2: pending — safe local media contract and adapter.
- Task 3: pending — media/text and gallery vertical slice.
- Task 4: pending — native authoring and restoration acceptance.
- Task 5: pending — showcase/public acceptance and handoff.

Both reference repositories clean at pinned HEADs: starter7473c0839dca8fadb7d7a8f9cc459cab79aba94f and financial0e1e5988dcdcba508300099ccab2643daedf1aad. Reads only.
`nBaseline: pnpm test424 boundary tests +5 render tests passed,1 optional native-query skipped. Task1 BASE9ce61a23695e5cb46d5bcb9d5f1eb329d3dfd73c.

Task1 implementer: /root/composition_b_faq_steps; medium; started from9ce61a2.

Ruling: Task1 cancellation is inspected as a state-only action with no operation/batch; actual native Cancel click and zero mutation belong to Task4 — no installed DOM test runtime and no new dependency is authorized — cost if wrong: cancellation UI defects remain undetected until Task4, which must prove this behavior before completion.

Task1 implementation d7909f6, full433+9 pass, check/build pass. Independentreviewpending.

Task 1: complete (commits9ce61a2..d7909f6, review clean). Reviewer/root/composition_b_faq_review; spec andqualityapproved; nofindings. Cannot-verify nativepersistence/recovery/Cancel/browseritems resolve to explicitTask4/5 acceptanceowners, notclaimsforTask1. Processclaims supportedby taskreportlogsandcommits; no broad rerunrequired.
Task2 BASEd7909f6; pendingdispatch.

Task2 implementer/root/composition_b_media_adapter; medium; startedfromd7909f6. Task1review artifacts retained inplanworkspace until finalarchive.

Ruling: resolveSourceMedia(root,src) root means project repository root; its upload directory is root/apps/site/public/uploads — matches Astro/Tina existing publicFolder and Task3 project-root binding — cost if wrong: future consumers must adjust root arguments before activation, no current public consumer exists.

Task2 implementation7893ab0; focused60+checkclean; actualWindowslinktestspassnoskip; reviewpending.

Task 2: complete (commitsd7909f6..7893ab0, review clean). Reviewer/root/composition_b_media_review; spec+qualityapproved,nofindings. Unchangedglobalcontracts verifiedbyisolatedsixfilediff; reportedWindows/test/checkresults documentedtaskreport, no publicactivationclaim. Task3 BASE7893ab0.

Task3 implementer/root/composition_b_media_sections; medium; nativeimagecallbackprobe first; actorownsteststackandmuststopbeforefullsuite.

Task3 resumed sameimplementer on usercontinue after platformusageinterruption. Verified cleanHEAD7893ab0 and no liveownedprojectservers/partialreport; no completedtasksredispatched. Installed public ImageFieldPlugin emptystringclear contract beingprobed beforeimplementation.

Task3 implementation45cf603; focused/nativeimage+FinalForm+serializer+uploadwatcherprobesgreen; full511+16/check/buildpass; reviewpending.

Task 3: complete (commits7893ab0..45cf603, review approved). Reviewer/root/composition_b_media_sections_review speccompliant,noblockingfindings.
Task 3: minor (deferred): existing SQLiteexperimental/Vitestperformanceadvisories; finalreviewmusttriageagainstbaselineRuling.
Task3 cannot-verifyhistoricalprobeordering/stackcleanup: retainedprobeevidence+taskreportinspected; no currentworkingchanges claimed. Unknownbytespreservation canonicalnativeproofTask4; referencehistorysnapshotsTask5explicitgate. Task4 BASE45cf603.

Task4 implementer/root/composition_b_native_acceptance; medium; binaryownershipfirst, actualindexednativeUIproof; ownexactdevCMSlauncher thenstopbeforeTask5. RequiredCancelproofcarriedfromTask1.

Ruling: Task4 may narrowly accept installed native link metadata target:undefined and opaque string/finite-number text-leaf IDs after actual exported-plugin/Form probe — real CMS links were otherwise rejected before meaningful validation; keep unknown attributes, defined target values and malformed IDs rejected — cost if wrong: rich-text metadata acceptance is broader and must remain covered by unsafe-input and original-AST identity regressions. Fix owned byTask4 implementer/review.

Task4 implementationb3fec11; actualnative2/query1,529+16full/focused96/checkpassed; ownedstackstoppedportsfree; reviewpending. ActualCancel+invalidsavecorrectionobligationsproveninrun-U2sQCT, requestandrestoreartifactsretained.

Task 4: complete (commits45cf603..b3fec11, review approved). Reviewer/root/composition_b_native_review; specapproved,noblockingfindings; retainednative/logs/Cancel/rejection/restorationevidenceverified.
Task 4: minor (deferred): colorvariable/SQLite/performanceadvisoriesinretainedlogs; finalreviewtriagewithbaseline.
Cannotverifyunchangedcross-taskguaranteesresolveagainstearlierreviewedcommits; finalTask5referenceHEAD/statussnapshotsremainmandatory. Task5 BASEb3fec11.

Task5 implementer/root/composition_b_public_handoff; medium; finalpublic/showcase/envbuilds/docs. Currentstackstopped; actorownsandstopsanytemporarylauncherbeforefinalreview. Native2/2notredispatchedunlessnewchangedboundary.

Task5 implementationc5cb20c; unit530/render16/public10/builtshowcase7/articlesdisabled1/allbuildgatespass; worktreecleanstackstopped; taskreviewpending.

Task5 initialreviewfailed: I1 monitor/Pagecleanupfailurecan skip ownedPNGrestore; I2 articles-disabledregenmayproceedaftershutdownfailureorbeforefullsnapshotconflictcheck. Fixround1/5 resumedoriginalimplementer/root/composition_b_public_handoff; FIX_BASEc5cb20c. Successfulacceptanceevidenceconsistent, no rendererfinding.

Task5 fixround1 implementationf9b93e2; focused51/tsc/public10/articlesdisabled1pass, exactrestorationstackstopped; scopedrereviewpending.

Ruling: Independently owned cleanup actions attempt restoration independently and aggregate failures; a conflicted Page cannot strand a still-proven temporary PNG — fixes reviewed failure paths while preserving unknown Page bytes — cost if wrong: conflicted fixture pages may retain references to removed test-owned images; original backups and failure evidence remain for reconciliation.
Ruling: Restore-build commands require confirmed runtime shutdown and exact full source snapshots before each command — avoids consuming unknown inputs or rebuilding beside a live runtime — cost: bounded extra hash reads and skipped rebuild/manual reconciliation on conflicts; comparisons remain best effort, not atomic locks.

Task5 fix round 1/5 (2 addressed,0open; I1 independentcleanup,I2 stopped-runtime/fullsourcegates; commitsc5cb20c..f9b93e2). Reviewer/root/composition_b_public_rereview foundnonewbreakage/outofscopeitems.
Task 5: complete (commitsb3fec11..f9b93e2, review clean after fixround1). Minorbaselinewarningsretainedforfinaltriage. Unchangednative/routing/authcross-taskclaimsresolveearlierreviewedproofsandnowwholebranchreview.
Final whole-branch BASE21dad5bb8a871bd9c9436c12640fa5e188689355 HEADf9b93e2; next most-capablemediumreview. All five task gates complete.

Finalwholebranchreviewer/root/composition_b_final_review gpt-6-astra/mediumdispatchedonf9b93e2. Controllerfresh pnpm test537+16 PASS,1optionalqueryskip (stackstopped); gitstatusclean. No sourcechangeafterTask5fixreview. Finalreviewpending.

Final whole-branch review: approved at f9b93e2, no Critical/Important or new actionable Minor findings; no final fix wave. Deferred baseline diagnostics triaged as nonblocking without behavioral regressions. Declined behaviors match explicit Stage 3/Composition C/hosted boundaries; existing canonical add-only/main-focus limitations remain disclosed.
All implementation tasks and reviews complete. Fresh final tests:537 boundary+16 render passed,1 optional query skipped with stopped servers; indexed query passed in Task4. Both references freshly rechecked clean at pinned HEADs. Permanent archive:docs/superpowers/reviews/2026-10-18-composition-b. Final local stack restart pending controller handoff.
