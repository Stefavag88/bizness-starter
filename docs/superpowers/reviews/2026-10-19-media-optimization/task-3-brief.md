### Task 3: Build demand and contained development delivery

**Files:** session modules/declarations, integration/media.mjs, astro.config.mjs, section-media.ts; tests/media-session.test.ts and tests/media-integration.test.ts.

**Interfaces:** Implement the session/registry contracts above; adapter produces ResolvedMedia with existing contextual error wrapping.

- [ ] Test fresh build sessions, shared source deduplication, publish only demand, disabled/no-image zero work, no cross-build demand, exact known dev GET/HEAD delivery and rejection of unknown/traversal/query-generated requests. Seed warm cache with local-only demand, then assert a new nonlocal session never publishes it. Test close/error cleanup and original-byte replacement yielding fresh URLs/dimensions.
- [ ] Run pnpm exec vitest run tests/media-session.test.ts tests/media-integration.test.ts; capture RED.
- [ ] Register sessions in supported Astro build-start/server-setup lifecycle; publish after rendering into build:done dir, await all jobs before success, close on completion/error/server close. Dev middleware serves exact demanded assets with correct MIME/length and immutable content-addressed caching; visitors cannot cause transformations. Preserve current upload refresh events. Resolve policy from parsed project config, never CMS descriptor. Maintain actionable page/section/item/source errors and no Worker route changes.
- [ ] Repeat tests and pnpm check; build a temporary minimal media page and assert referenced files exist. Commit feat: publish demanded media as static assets after review.

