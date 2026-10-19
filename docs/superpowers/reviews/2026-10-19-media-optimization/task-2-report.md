# Task 2 implementation report

Status: Task 2 implementation candidate; independent controller review pending. No session, Astro integration, renderer, publication owner, or browser implementation is included.

## Scope and contracts

Added server-only `packages/media/optimization.mjs` and `cache.mjs` with matching declarations; focused cache/encoder tests and five isolated fixtures with attribution/checksums. Existing canonical media schema and public SourceMedia are unchanged.

Declarations are defined once in `optimization.d.mts` and re-exported by `cache.d.mts`:

```ts
interface ImageCandidate { src: string; width: number; height: number; format: 'png' | 'jpeg' | 'webp'; bytes: number }
interface ResponsiveMedia extends SourceMedia { fallback: ImageCandidate[]; webp: ImageCandidate[]; passthroughReason?: 'disabled' | 'animated-or-multipage' }
function candidateWidths(sourceWidth: number, widths: number[]): number[];
function resolveCachedMedia(root: string, snapshot: Awaited<ReturnType<typeof readValidatedSource>>, policy: MediaOptimization): Promise<ResponsiveMedia>;
function readCachedCandidate(root: string, candidate: ImageCandidate): Promise<{bytes: Buffer; contentType: string}>;
```

The additive `readCachedCandidate` contract was explicitly approved by the controller. Task 3 owns an exact demanded URL-to-candidate map and calls this helper for local serving/publication. No raw cache filesystem path is exported. The helper verifies strict URL identity, the marked contained cache namespace, manifest identity, output hash, format/dimensions, and complete decoding, and throws on a missing or invalid entry.

## Behavior and safety

Candidate widths cap/deduplicate/sort without upscaling. Sharp consumes the validated Buffer snapshot, auto-orients before width-only resize and strips metadata; PNG fallback is lossless, PNG/WebP transparency remains intact, JPEG/WebP quality follows policy. JPEG/PNG get a WebP family plus original-format family; static WebP gets only its WebP family. A process-wide FIFO semaphore caps real transform jobs at two, including across different roots. Disabled/multipage media return explicit reasons and empty families without creating a derivative namespace. Full compressed-payload encoder failures propagate.

Cache files live only in `.generated/media-optimization/cache/v1`; candidates use `/_media/v1/<sha256>.<png|jpeg|webp>`. Identities include the source-byte SHA-256, width, format, quality, Sharp version, pipeline version, orientation/encoding policy. Original paths/locales are excluded. Each output has a matching `.json` manifest with exact identity, output filename, bytes, width, height and output SHA-256. Warm reuse decodes actual bytes; invalid ordinary entries regenerate; observed symlink/reparse or nonregular destinations reject. Directory ancestors are checked individually; filenames and URLs cannot supply arbitrary paths. File reads compare named/opened device and inode. There are no canonical upload writes, broad deletion, or adoption of arbitrary manifest paths.

Writes use exclusive unique temporary files, flush/close, namespace revalidation, and atomic rename. The manifest is committed last. A complete marker is installed using an atomic hard link which never replaces an existing marker, then its temporary name is removed. Only this invocation's own temporary names are cleaned. Unknown interrupted temporary files are ignored and retained. In-flight identity entries span both validation and encoding.

The controller approved one pixel of height tolerance against the validated source ratio because libvips JPEG shrink-on-load sometimes differs from arithmetic rounding. The decoded dimensions must still equal the manifest and candidate exactly. Tests prove real photographic warm reuse and rejection at the two-pixel forged-height boundary. Width-only natural resizing remains unchanged; forced dimensions/cropping were not introduced.

## Fixtures and real output

`tests/fixtures/media-optimization/README.md` records verified source, author, selected license, modification recipe and SHA-256 for every fixture before test use. The photograph is Wikimedia's 3840 x 1725 derivative of Hannes Röst's Fronalpstock panorama, CC BY-SA 3.0, 1,610,954 bytes. Its source page is https://commons.wikimedia.org/wiki/File:Fronalpstock_big.jpg and the license is https://creativecommons.org/licenses/by-sa/3.0/. The full 10109 x 4542 original is deliberately unused because it exceeds 40 million pixels. The remaining orientation, alpha, small and animated fixtures are original synthetic test pixels made available under CC0, with exact Sharp recipes recorded. No business-reference images were used.

`task-2-photo-byte-table.json` retains the actual decoded default-policy width/dimension/format/byte table:

| Width | Height | WebP bytes | JPEG bytes |
| --- | --- | --- | --- |
| 320 | 143 | 8,940 | 10,205 |
| 640 | 287 | 31,722 | 36,702 |
| 960 | 431 | 69,668 | 80,283 |
| 1440 | 647 | 155,210 | 178,379 |
| 1920 | 863 | 275,784 | 314,123 |

These numbers establish reduction for this representative photograph; no universal reduction claim is made.

## RED/GREEN and diagnostic evidence

All paths below are relative to this report directory. Failure logs were retained separately and never overwritten.

- `task-2-red.log`: first missing-module RED. `task-2-red-behavior.log`: exported stub produced 12 failed / 1 passed assertions; corruption rejection already passed because the stub threw.
- `task-2-green-attempt-1.log`: first 13/13 passing real-byte tests; `task-2-green-attempt-2.log`: added actual interrupted manifest write, cross-root ceiling and manifest-symlink checks, 16/16 passing.
- `task-2-red-marker-race.log`: deterministic delayed first marker write proved an incomplete marker could be read concurrently. Root cause was exclusive creation exposing empty contents before write completion. Atomic complete-marker hard-link installation fixes this; `task-2-green-final.log`: 17/17 passing.
- `task-2-red-forged-dimensions.log`: a replacement valid WebP with forged matching hash/manifest dimensions was trusted on cache reuse. Source-ratio validation fixes this; `task-2-green-18.log`: 18/18 passing.
- `task-2-red-photo-rounding.log`: strict arithmetic height validation unnecessarily regenerated real photographic outputs, detected by changed output mtimes. Controller-approved one-pixel tolerance fixes this; `task-2-green-19.log`: 19/19 passing.
- `task-2-focused-final.log`: subsequent run exposed an intermittent transform-count assertion (7 observed versus 4). `task-2-dedup-both-diagnostic.log` retained 8 observed versus 4, but exactly four true cache misses. `task-2-sharp-observer-values.log` proves Sharp's decode-only width is -1 and resize width is positive. The observer used Boolean(-1), counting warm validation decodes as transforms. Both observers now test width > 0. No dedup architecture change was needed. Eight isolated diagnostic runs (files 2 through 9) passed. Diagnostic file 1 retains the unsupported `--repeat-each` CLI attempt; it is not passing evidence. `task-2-dedup-boundary-diagnostic.log` retains a passing diagnostic workload.
- `task-2-focused-corrected.log`: final corrected complete focused workload, 19/19 passing. Temporary console instrumentation was removed.

Tests exercise capped widths; all output dimensions/formats/byte counts and full decoding; photo transfer reduction; normalized orientation; exact original-size PNG pixels and retained WebP alpha; small no-upscale and WebP-only family; disabled/multipage zero derivatives; corrupt compressed payload failure; path/locale sharing without rewrite; replaced pathname retaining old snapshot bytes; changed source bytes/quality/pipeline identity; missing/corrupt outputs; forged manifests; exact two-pixel forgery rejection; interrupted atomic writes/recovery; concurrent first initialization; exact four transforms for ten duplicate resolves; global two-job ceiling across roots; URL escape rejection, foreign markers, ancestor junctions, file/manifest symlinks; and photographic warm-cache mtimes.

## Required regression and ownership evidence

`task-2-check.log`: initial `pnpm check` exit 0, Astro 50 files / 0 errors / 0 warnings / 0 hints. `task-2-full-test.log`: initial `pnpm test` exit 0, main 69 passed files / one skipped, 683 passed tests / one skipped; site 6 files / 21 passed. SQLite experimental warnings and Vitest performance suggestions are present; no failed tests. The initial full run preceded the final photographic cache test and observer correction. Final required checks are retained in `task-2-check-final.log` and `task-2-full-test-final.log`.

`task-2-process-inventory.json` is an empty array: fresh Win32_Process inspection found no checkout Node/pnpm launcher before configure/check/test. No processes were stopped or restarted by this task. All cache/source mutations in tests use independently created OS temporary roots; owned roots are removed afterward. The canonical SHA-256 audit is retained in `task-2-canonical-audit.json` and reports no changed project/content/upload files. No reference checkout was modified. No deployment, push, merge, tag, release, external messaging or hosted setup was performed.

## Self-review and limits

Reviewed the finished modules, declarations, test assumptions, provenance, cache ownership and public URL boundary. Only Task 2 files are staged for the candidate. Browser/layout/session demand/publication integration remains for later tasks. Cache entries are validated for identity, byte integrity and decoded properties, not cryptographically authenticated against an adversary with arbitrary write access to both manifests and output bytes. Filesystem checks reject observed symlinks/reparse destinations and replacements at the open/read boundary; Node pathname operations do not provide a kernel-atomic guarantee against an actively hostile concurrent ancestor-directory replacement. The same general local filesystem trust limitation already exists at the source reader boundary. No known unresolved Task 2 test failure remains after the corrected observer run; independent review remains pending.

Final verification: `task-2-check-final.log` exit 0, 50 Astro files with 0 errors/warnings/hints; `task-2-full-test-final.log` exit 0, 69 main files passed / one skipped, 684 tests passed / one existing skip; 6 site files / 21 tests passed. Final full regression includes all 19 focused tests. `task-2-byte-audit-final.log` reproduces the recorded actual photo byte table; canonical audit verifies 16 baseline files unchanged. Initial staged diff checking identified trailing blank lines in two new files, which were removed without behavior changes. Final staged diff check is clean and retained as `task-2-diff-check.log`.

Committed review candidate: `66551944ccf2788e87994225937be91272ec0c31` (`feat: cache bounded responsive image variants`). Immutable review range: `ba861c8..6655194`. Post-commit `git status --short` was empty. The report and raw evidence remain ignored controller artifacts. Independent Task 2 review is pending; no publishing occurred.

## Task 2 review fix, round 1 of 5

Review base: `66551944ccf2788e87994225937be91272ec0c31`. Read the complete `task-2-review.md`, verified the Important finding in the code, and followed receiving-code-review/TDD/verification guidance. The review identified a real warm-path resource defect: full cache validation raw decodes bypassed the encoder's process-wide semaphore. The earlier transform-only observer intentionally ignored those decodes and did not establish bounded total native image work. Pre-existing SQLite/Vitest log noise remains acknowledged and deferred; no toolchain upgrade/suppression was made.

Added two regressions observing every real Sharp `toBuffer` call, distinguishing raw decodes from positive-width transforms but counting both toward simultaneous native work. A brief completion-boundary delay preserves actual native decoding/encoding and makes independent-request overlap deterministic. One test warms both six-width format families in two independently owned roots, then concurrently validates all 24 cached candidates. The other concurrently reads eight candidates directly through `readCachedCandidate` in two roots while encoding four policy-changed candidates. Both assert a combined peak of two, exact operation counts, successful byte-bearing output and no active work left afterward.

Exact RED command: `pnpm exec vitest run tests/media-cache.test.ts tests/media-optimization.test.ts`, retained in `task-2-fix1-red.log`, exit 1: 2 failed / 19 passed. Observed native-work peaks were 18 for warm cross-root cache validation and 10 for direct reads plus transforms, against the required bound of two. These are genuine behavior failures, not missing imports or mocks replacing native image work.

The fix promotes the existing FIFO scheduler to shared server-only `withNativeImageWork<T>(job: () => Promise<T>): Promise<T>` in `optimization.mjs` and its declaration. `encodeCandidate` uses it exactly as the previous private transform scheduler. Cache validation now acquires that same scheduler once around metadata inspection and complete raw decoding. No cache resolution or in-flight identity owner holds a scheduler slot while calling validation or encoding, so acquisition is not nested and cold/warm transitions do not deadlock. The existing identity deduplication map, cache identities, encoded bytes, original source policies, URL contracts and source/output protections are unchanged. The scheduler declaration explicitly documents one acquisition per native job and no nested acquisitions.

Exact GREEN command: `pnpm exec vitest run tests/media-cache.test.ts tests/media-optimization.test.ts`, retained in `task-2-fix1-green.log`, exit 0: 2 files / 21 tests passed. Both new regressions observed a peak of exactly two for all native image work and the original concurrent identity-dedup tests remained green. Exact type command: `pnpm exec tsc --noEmit`, retained in `task-2-fix1-types.log`, exit 0 with no diagnostics. The full suite was not repeated for this scoped fix, as explicitly directed by the controller; the base candidate's final complete regression remains recorded above. No further failures occurred in the covering run.

Self-review inspected the complete four-file fix diff: scheduler sharing, nonnested acquisition boundaries, error-finally release, unchanged in-flight ownership and real output assertions. Only `packages/media/optimization.mjs`, `optimization.d.mts`, `cache.mjs` and `tests/media-cache.test.ts` changed. Canonical `project.json`, content and uploads remain unchanged; no launcher/configure/build/publication/hosted operations were performed. No known unresolved finding from this review round remains; independent fix review is pending.

Fix round 1 committed as `4c51d0ca0726e33d15a67cf3697c358e5133f8a9` (`fix: bound native image cache validation work`); immutable fix review range `6655194..4c51d0c`. Final staged diff check was clean (`task-2-fix1-diff-check.log`); post-commit `git status --short` was empty. No canonical diff was present. Awaiting independent controller fix review.
