### Task 1: Configuration and validated source ownership

**Files:** Root dependency/lock, config files, source facade/reader/declarations; tests/project-config.test.ts and tests/media-source.test.ts.

**Interfaces:** Produce MediaOptimization and readValidatedSource; preserve SourceMedia/resolveSourceMedia.

- [ ] Write failing tests for absent/partial/full policy defaults, unknown nested keys, duplicate/unordered widths, 0/7 entries, fractional/out-of-range widths/quality and disabled mode; assert createCmsDescriptor output is unchanged by optimization settings. Extend source tests to assert one validated read feeds fingerprint/metadata/returned bytes, bounded source checks remain, and pages identifies multipage input without changing the public metadata shape.
- [ ] Run pnpm exec vitest run tests/project-config.test.ts tests/media-source.test.ts; retain RED output for new behavior.
- [ ] Add exact root sharp:0.35.5 with pnpm add -w -E sharp@0.35.5; inspect lock diff for unrelated version drift. Use its direct import consistently, including test utilities. Extract private byte reading, preserve all containment and bounds checks, and default nested config with strict schemas.
- [ ] Run the same tests and pnpm check; expect all passing and no server media import reachable from CMS/client modules. Commit feat: define bounded media policy and source snapshots after independent review.

