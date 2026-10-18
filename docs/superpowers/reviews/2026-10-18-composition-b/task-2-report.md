# Task 2 report: safe local image contract and metadata adapter

## Implementation

Implemented the isolated browser-safe source/crop schema and server-only source metadata adapter. No registry, production media consumer, canonical content, upload assets, manifests, dependencies, authorization or routing code changed.

The parser preserves the wire source and decodes exactly once for filesystem lookup. It supports ordinary spaces, encoded spaces, Unicode filenames and ordinary upload subfolders. It rejects malformed encoding, remaining percent/double encoding, encoded dots/separators, traversal, empty segments, backslashes, UNC/remote/data paths, controls, query/fragment components, unsupported formats and the reserved generated/section-images upload destinations. Trailing dot/space path segments are rejected to avoid Windows path aliasing.

The server adapter resolves the real upload root and file, checks relative-path containment and regular-file status, applies the 20 MiB bound both to stat and actual read bytes, hashes actual bytes with SHA-256, verifies PNG/JPEG/WebP format against the source extension, and enforces positive integer dimensions up to 20000 per axis and 40000000 pixels. EXIF orientations 5–8 swap displayed dimensions. Metadata caching uses byte hash plus format and is bounded to 128 entries; each resolution reads current bytes, so same-path replacement remains fresh. The returned metadata object is detached from cached entries.

Controller ruling: root means the repository root; uploads resolve beneath apps/site/public/uploads. This is recorded in both the implementation and declaration. Sharp resolves via createRequire from the installed site's Astro dependency. Runtime inspection confirmed Astro 7.3.6 and Sharp 0.35.5 at node_modules/.pnpm/sharp@0.35.5_@types+node@24.0.0/node_modules/sharp/dist/index.cjs. No new direct dependency was added.

## Verification and TDD evidence

Initial RED, before either production module existed:

    pnpm exec vitest run tests/media-contract.test.ts tests/media-source.test.ts

Result: two failed suites because packages/content/media.mjs and packages/media/source.mjs did not exist. This was module-absence evidence for the new adapter, rather than a failed behavior assertion; no tests could collect at this point.

After implementation, the same focused command passed 59/59. The final deterministic stat/read growth regression increased this to 60/60.

Additional behavioral RED proof: temporarily removed only the post-read byte guard, ran:

    pnpm exec vitest run tests/media-source.test.ts -t 'grow beyond'

Result: one failed test, “promise resolved … instead of rejecting”, with the oversized bytes accepted as a 3×2 PNG. Nineteen tests were excluded by this deliberate name filter; these were not permission skips. The guard was restored in a finally block, then the complete focused command passed:

    Test Files 2 passed (2)
    Tests 60 passed (60)

The growth test uses real files/stat/read/truncate operations and intercepts only the FileHandle stat boundary to deterministically force a concurrent-growth condition. All normal metadata tests use the real installed Sharp implementation. Temporary fixture roots mirror apps/site/public/uploads and are uniquely created and removed; no canonical content or upload assets were touched.

Coverage includes PNG/JPEG/WebP, spaces and encoded spaces, nested upload folders, missing files, directories, corrupt headers, extension/actual-format disagreement (including cached bytes), stat oversize, post-stat growth, zero/excessive dimensions, excessive pixel area, EXIF 3/5/6/7/8, same-path replacement, actual file symlink escape, directory junction/sibling-prefix escape, contained file symlinks and a symlinked upload root. Every Windows symlink/junction test ran and passed; no permissions gap or silent skip exists.

Strict check, run twice (the second after the growth regression):

    pnpm check

Result: exit 0; TypeScript passed; Astro checked 39 files with 0 errors, 0 warnings and 0 hints. Focused tests finished in approximately 0.8 seconds each. Each strict check took approximately 15 seconds including configuration generation. No full/native/profile suite ran, per the explicit isolated-adapter task scope.

    git diff --cached --check

Result: clean after removing one trailing blank line. Git emitted its normal LF-to-CRLF conversion notices during staging.

An initial dependency-version diagnostic attempted sharp/package.json, which is not exported by the installed package and failed with ERR_PACKAGE_PATH_NOT_EXPORTED. The diagnostic was corrected to sharp.versions.sharp; the production adapter already used the supported sharp export and all focused tests had passed.

## Files changed

- packages/content/media.mjs
- packages/content/media.d.mts
- packages/media/source.mjs
- packages/media/source.d.mts
- tests/media-contract.test.ts
- tests/media-source.test.ts

## Self-review, decisions and limits

Reviewed all six staged files and the task requirements. Browser-safe media.mjs imports only Zod; all filesystem, hashing, module resolution and Sharp imports remain in the separate server module. No production media activation occurs before Task 3. Existing Task 1 registry metadata and all predecessor authentication/static-routing code remain intact.

The adapter performs metadata/header validation, not exhaustive compressed-payload decoding. Dimension-limit tests patch PNG IHDR dimensions and its CRC deliberately to exercise metadata bounds without allocating huge pixel payloads. Cache memory is bounded, but every resolution intentionally incurs a filesystem read and hash to avoid filename-only staleness. No derivatives, fetching or networking is introduced. Realpath containment is checked before opening the resolved path; this is not an atomic lock against a hostile concurrent filesystem actor swapping directory topology. Ordinary source replacement and the requested stat/read growth condition are covered.

No unresolved task concerns. Controller review follows this implementation commit. This report is ignored scratch evidence and is not included in the task-source commit.
