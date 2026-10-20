# SDD ledger — plan: docs/superpowers/plans/2026-10-20-starter-v2-motion.md

Baseline: 69e2599. Branch: codex/starter-v2-motion.
Ruling: Reuse the verified clean, dedicated starter checkout on a new feature branch rather than another worktree — preserves the established installed runtime and local CMS workflow — weaker filesystem isolation if unrelated work appears.
Execution: user selected inline with one independent final review, superseding per-task reviews.
Pre-flight: Task 1 exports MotionConfig/token CSS consumed by Task 2 computed-style reader and Task 3 generated layout; Task 2 initMotion(root) disposer consumed by public bootstrap/showcase; Task 3 markers consumed by Task 4 browser acceptance. Names align.
Task 1: complete (commits 69e2599..cf59ea8, tests: pnpm exec vitest run tests/project-config.test.ts tests/motion-config.test.ts →    Duration  644ms (import 53%, transform 31%, tests 14%, worker 2%))
Task 2: complete (commits cf59ea8..9e59e0b, tests: pnpm exec vitest run tests/motion-runtime.test.ts tests/motion-config.test.ts →    Duration  401ms (import 46%, transform 40%, tests 10%, worker 4%))
Task 3: complete (commits 9e59e0b..1299aac, tests: pnpm test:footer →              learn more: https://vitest.dev/guide/improving-performance#caching-between-reruns)
