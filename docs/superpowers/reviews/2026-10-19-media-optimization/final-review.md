# Whole-branch final review — Stage 3A responsive media

Date: 2026-10-19. Reviewed immutable range `b49ae65..7a6420e`; inspected HEAD `7a6420ea5faee7dd317b0fcd12bc4d9011032b8d`. Scope: this local media slice, including production pipeline, configuration, renderers, acceptance ownership, tests and documentation. Review is independent of the six earlier task approvals.

## Strengths

- Exact validated source bytes feed both fingerprinting and encoding; metadata facade compatibility and server-only separation are preserved. Strict defaulted developer policy does not enter the CMS descriptor. Sharp is explicitly pinned at the already-installed 0.35.5, without unrelated lockfile version drift.
- Source identities include policy/version inputs; real output hashes, decoded dimensions and full payload decoding protect ordinary cache reuse. The shared native-work semaphore and all-settled failure drain address real concurrency and cleanup hazards.
- Explicit root-owned sessions separate persistent cache inventory from current build demand. Exact demanded development URLs cannot request arbitrary transformations. Supported build entry points close sessions on success and unrelated build failure; ancestor publication containment is checked before directory creation.
- Layout roles/counts follow the actual grid, including short galleries, text-only Room cards and the featured breakpoint correction. Existing crop CSS, lazy/async attributes and safe localized copy remain intact in the inspected implementation.
- Acceptance has meaningful independent cleanup, conflict preservation and dependent-media retention, complete canonical snapshots, exact native target admission and installed serializer expectations before dispatch. The evidence candidly distinguishes failed attempts, later harness changes, conditional skips and source timing.

## Issues

### Critical

None found.

### Important — fixes required

**I1 / P1 — Static WebP originals never use their generated responsive family.**

References: `apps/site/src/components/ui/SectionImage.astro:8` and `:13`; `packages/media/cache.mjs:134` and `:149`; `apps/site/tests/media-optimization.test.ts:30`.

The cache deliberately returns a static WebP original with `fallback: []` and candidates in `webp`. SectionImage chooses its responsive branch solely through `media.fallback.at(-1)`, and builds the img srcset solely from that same array. Consequently every ordinary static WebP upload is encoded and demanded/published, but the actual HTML emits the original upload with no responsive srcset or sizes. This loses the principal feature for a supported source format and produces derivatives that are not referenced by output HTML. The component test masks the integration mismatch by inventing `fallback: media.webp`, while the real encoder test expressly expects an empty fallback array. The browser fixture contains animated WebP only, which correctly bypasses encoding and cannot catch this.

Fix: choose the WebP candidate array as the img family for static WebP originals (or consistently revise the shared contract), retain the single-family/no-duplicate-source behavior, and keep genuinely empty passthrough arrays on the original branch. Add an actual static WebP source-through-session-through-renderer regression and a scoped built-output/browser case asserting responsive HTML, successful currentSrc and publication/demand equality. Do not manufacture a different family shape in the component test.

**I2 / P2 — Corrupt cache files are read without byte bounds before validation.**

References: `packages/media/cache.mjs:27-35`, `:66-73`, and `:109`.

`readRegular` checks file type/identity but then calls unbounded `handle.readFile()`. The marker, manifest and binary output all use this helper. Manifest JSON is fully read and parsed before its shape is checked; output is fully allocated before comparing its byte length or hash. On warm resolution, `candidate.bytes` comes from the untrusted manifest and is not first validated as a bounded integer. A mistakenly replaced or corrupt multi-gigabyte manifest/output can therefore exhaust memory or impose excessive I/O before being rejected/regenerated. This is a local build/dev reliability defect, not a claim of a remote visitor-controlled exploit. The two-job native semaphore does not bound these reads: they occur before admission to the semaphore, and multiple candidates read concurrently.

Fix: impose small explicit marker/manifest limits and a justified finite derivative-byte limit compatible with the allowed source geometry/lossless PNG output; validate manifest byte fields before output reads. Use bounded reads on the opened handle, rejecting excess bytes even if the file grows after stat. Compare stat length to expected output length before allocation where possible, without relying on stat alone. Add focused oversized marker/manifest/output and growth-after-stat tests that demonstrate rejection or safe regeneration without a full oversized read. Retain the existing symlink, identity and atomic commit checks. Source inspection is sufficient to establish this path; no destructive or memory-exhaustion probe was run.

### Minor — explicit triage

**M1 / P3 — Browser preservation assertions are too permissive.**

Reference: `e2e/media-optimization.spec.ts:29`.

The browser accepts any supported object-position rather than the expected crop for that fixture item; positive width/height attributes do not establish exact intrinsic preservation. The alt/caption regular expressions likewise establish broad language/content presence, not exact item association. A regression swapping top/bottom or assigning another valid dimension pair can pass. Disposition of the deferred Task 6 observation: retain as a nonblocking test-quality finding, not silently discarded. Inspected production crop mapping is unchanged, and component/encoder tests separately cover concrete dimensions and crop classes, so this is not evidence of an existing visual regression. Prefer expected fixture identity/crop/copy and candidate dimensions (with the documented encoder rounding rule) in a scoped preservation assertion. Strengthen during the I1 fixture addition if practical.

**M2 / P3 — Dense lifecycle helpers and tests obscure ownership transitions.**

References: `e2e/helpers/media-optimization-fixture.ts:19-36`, `e2e/media-optimization-cms.spec.ts:65-89`, and `e2e/media-optimization.spec.ts:29-61`.

Multiple admission, mutation, assertion and restoration steps share very long lines. Disposition of the deferred readability observation: accepted as a nonblocking maintainability issue. Expanded command/native admission blocks are an improvement, but the remaining blocks are harder to audit and modify safely. Expand touched lifecycle paths into named steps; a broad style-only rewrite is not required for acceptance.

**M3 / P3 — Documentation claims an original-byte substitution that is not implemented.**

Reference: `docs/MEDIA_OPTIMIZATION.md:29`; related wording in `docs/superpowers/plans/2026-10-19-starter-v2-media-optimization-evidence.md:50`.

The guide says an equal-dimension fallback can reuse original bytes when re-encoding is larger. The approved plan explicitly omitted this optional optimization, and cache misses always call encodeCandidate. Equal output sizes or even identical deterministic PNG bytes do not demonstrate a source-reuse decision. Correct the guide to state that all enabled static candidates are encoded and may be larger, and describe the table as observed equal-size/lossless output rather than evidence of an implemented substitution. No encoder feature addition is necessary.

**M4 / P3 — Some newly added temporary-root tests leave their directories behind.**

References: `tests/media-native-admission.test.ts:10`, `tests/media-acceptance-harness.test.ts:10`, `tests/media-runtime.test.ts:7`.

These helpers allocate OS temporary directories without an afterEach/finally removal owner. Repeated full-suite runs retain copies, artifacts and backups. This is limited test-host disk accumulation, not canonical data loss. Track roots and remove only verified owned non-reparse roots after cleanup; keep failure evidence deliberately when required. Ensure actual child shutdown has finally ownership even if an intermediate assertion fails. Nonblocking for the product slice.

## Deferred warning disposition

Existing SQLite ExperimentalWarning, Vitest performance notices and dependency peer/deprecation output are accepted as disclosed toolchain noise, not a new media defect. Do not suppress them merely to claim warning-free output, and do not upgrade dependencies in this fix wave. Astro check's zero diagnostics is a narrower valid claim than warning-free overall execution.

## Plan and ruling assessment

All eight explicit Ruling entries were considered against the approved intent:

1. Reusing the named dedicated checkout is consistent with authorization. Cost: less filesystem isolation; snapshots/process ownership mitigate but do not provide a lock.
2. Committing candidates before independent review is acceptable for immutable local review ranges. Cost: rejected code remains in history; this conveys no release/merge authority.
3. Explicit sessions for detached Astro tests are appropriate. Cost: harness setup and teardown responsibility; avoiding an implicit session is the right boundary.
4. readCachedCandidate as a server-only verified-byte interface is sound. Cost: an additive interface; I2 identifies a missing resource guard within it, not grounds to export raw paths.
5. One-pixel ratio-height tolerance is justified by Sharp's real shrink-on-load behavior. Decoded output must still match the manifest exactly; tests distinguish the allowed rounding from larger forged-height errors.
6. The supported build wrapper, including the three corrected direct callers, appropriately supplies cleanup missing from Astro's general error hooks. Cost: maintained CLI compatibility surface. Existing parser/actual build failure tests cover the inspected supported use, not every ad hoc external invocation.
7. All-settled sibling draining is necessary to make session shutdown truthful. Cost: failure waits for outstanding bounded work; acceptable.
8. Featured sizes below 768px correctly follow actual auto-fit CSS. Cost: a revised expression/coverage burden; this fixes the plan's mistaken formula without redesign.

No unapproved production feature expansion was found. Original public uploads, canonical schema, domain publication and localized copy ownership remain in place. I1 is an implementation contract defect despite previous task approvals. I2 is a reasonable-user resource/recovery requirement as well as part of the bounded-cache intent.

## Verification and evidence limits

Reviewed production changes, tests and docs through the supplied immutable diff and focused source reads; inspected the approved design/plan, full ruling/deferred ledger, final review handoff and Task 6 evidence/report. No broad suite was rerun, no probe mutated canonical inputs, and no product/git/branch changes were made. Worktree was clean and HEAD matched the target before this report.

The raw final command ledger `acceptance-mkR7p6/commands.json` explicitly records check/test exit 0 at final source. Retained evidence reports 743 root tests passed / 1 conditional skip, plus 24 site tests. Final native admission evidence records 6 focused tests and one actual native run with two admitted saves and 19 UI queries. The seven-gate run `acceptance-u70xHM` belongs to `01504ed`; its later check/full/native coverage is not represented as a rerun of every static gate. The 44-context/128-route matrix and subsequent cleanup/type corrections remain distinguished as documented. Empty TypeScript logs alone were not used as exit proof.

All 16 canonical hashes were reported restored. Source .wrangler was not baseline-hashed; this review makes no byte-equivalence assertion about it. Administrative archival, plan checkbox completion and restoring the user's prior launcher remain controller closeout duties, not missing media runtime implementation.

## Declined to judge

Each line requires an explicit controller disposition; none is silently discarded.

- Hosted production/provider correctness, remote deployment, release, pushing/merging/tagging or sending: no hosted run or authorization exists; this review only covers local media implementation/evidence.
- General site accessibility certification and animation motion policy: only representative axe checks and unchanged image accessibility attributes are evidenced; animation deliberately passes through.
- Non-Chromium rendering, no-WebP engine fallback selection and exhaustive theme/density/profile combinations: actual matrix is Chromium and representative beyond the default design; fallback bytes/markup are checked but cross-engine selection is not proven.
- Universal byte savings, network timing/Core Web Vitals, deployment-size reduction or cold-build performance targets: evidence measures selected payload bytes for representative fixtures; originals/cache/fallback storage can increase and no universal target was approved.
- AVIF, remote/runtime transformation, image-background/hero/social expansion, upload garbage collection and original access control: explicit future/out-of-scope capabilities; originals intentionally stay public.
- Ad hoc direct Astro CLI/API users bypassing the supported build wrapper, arbitrary foreign roots/config overrides and unrelated concurrent builds in one process: cleanup guarantee is deliberately scoped to owned supported entry points. This does not waive failures in the supported paths inspected here.
- Hostile concurrent filesystem replacement by another writer, crash/power-loss durability and multiple independent writers racing one cache: no transactional filesystem lock or multi-process cache protocol is provided; ownership assumes the stopped/owned local workflow. Ordinary existing symlink containment and corrupt-cache resource behavior were judged, including I2, rather than deferred under this limitation.
- Arbitrary adversarial GraphQL documents beyond the installed Tina UI mutation shape: the admission helper is a test-harness guard using token matching and inspected variables, not a public GraphQL firewall. Actual known native select/clear ownership was judged; broad CMS security and unrelated native workflows were not recertified.
- Byte-for-byte source .wrangler/D1 state equivalence: absent baseline prevents that conclusion; the retained private-persistence investigation and absence of source migrations are narrower evidence.
- Fresh external license/legal verification and unchanged reference-repository integrity: documented fixture provenance/checksums and recorded reference hashes were reviewed; no external legal certification or new reference-repository operation was performed.
- Unrelated prior Composition behavior, full authentication/form/Worker security audit and remaining Stage 3/Stage 4 readiness: existing regression evidence is relevant, but this branch's review scope is responsive media and its changed boundaries.

## Assessment

**Ready for local slice acceptance: With fixes; not approved yet.**

Fix I1 and I2 in the permitted batched fix wave, then perform scoped independent re-review with real contract regressions. Minor observations are explicitly nonblocking and require recorded controller disposition. The architecture is otherwise coherent and the existing evidence is substantial, but passing suites do not resolve the WebP contract mismatch or the unbounded corrupt-cache reads. This verdict provides no deployment, release or general production-readiness certification.
