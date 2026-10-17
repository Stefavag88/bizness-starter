# Showcase acceptance — 2026-10-17

Scope: local Design-system showcase increment on `codex/starter-v2-showcase`, after Composition A. No canonical identity/content change, native save/profile replay, sending, hosted setup, deployment, merge, push or tag. The two reference repositories remained read-only at starter `7473c0839dca8fadb7d7a8f9cc459cab79aba94f` and financial `0e1e5988dcdcba508300099ccab2643daedf1aad`.

## Verification

- Task 1: 38 focused tests and 65 actual computed CSS cases; old Comfortable computed properties identical at 375/640/641/768/1440. All four themes pass the unchanged contrast validator; no font installation.
- Task 2: 24 pure URL-state cases pass.
- Task 3: actual six renderers and fixtures, one H1/unique IDs and isolated local route; static output has one external approximately 9KB script, two external stylesheets and no inline executable script/style.
- Task 4 verifier: ten focused cases pass, after red tests. Covers serial staging/production/local, exact original bytes, build failure, a real owned-process timeout, concurrent edits/deletion preserved without refresh, route/navigation/manifest leakage and missing final local output.
- `pnpm test:showcase-builds`: passed staging, production and exact-restored local. Staging/production each 22 pages with no design-system directory or manifest/navigation/feed reference. Final local 23 pages includes design-system/index.html. Configure and Astro commands all exited successfully within 120000ms stages. Original/final project SHA-256 both `41b010e330e0243a96a4256076759af543ab1e47bd12943eddb82d8e6f93082f`.
- `pnpm worker:check`: passed dry-run; generated asset configuration and existing self-only headers accepted. No cloud deployment.
- Built Worker browser: `E2E_BASE_URL=http://127.0.0.1:8790`, installed Chromium under `.generated/browsers`; seven tests passed. All 16 displayed semantic swatches computed correctly for four palettes; compact/comfortable/spacious computed factors at 375/768/1440; EN/EL document/sample language, valid sample destinations, unique IDs/one H1, hidden-focus recovery, keyboard visible focus, bookmark/reload/reset/Back/Forward and invalid inputs pass.
- EN Home/Contact business output ignores preview query parameters and retains default Comfortable spacing. Prior Task 1 computed-property comparison proves pre-change Comfortable equivalence.
- JavaScript-disabled context retains configured default examples and disabled selectors with visible explanation. Playwright's noscript-container text matcher excluded the container; inspected DOM confirmed actual paragraph content and the test now asserts the rendered paragraph. No product change was required.
- Three representative axe scans returned zero violations; screenshots at 375/768/1440 were retained and mobile screenshot inspected. These checks do not certify accessibility.
- Zero CSP violations, runtime errors, console errors, external font requests or contact/newsletter/native mutation requests. Browser local/session storage and cookies unchanged. All canonical content/project/theme file hashes match before/after preview actions, retained under `.generated/evidence/showcase-source-hashes.json`.

Ignored evidence: `.generated/showcase-builds/run-*/original.json`, command logs and evidence.json retain original bytes, command PIDs, exact hashes and restoration. `.generated/showcase-builds/evidence.json` points to the latest summary. `.generated/evidence/showcase-{375,768,1440}.png` retains screenshots. No scratch reports or generated evidence is committed.

## Ownership and teardown

Original dev:cms launcher session 50604 was stopped by the controller before this task; its verified children were already absent. Task 4 served the final local assets with owned Worker launcher session 48903 (Node4472 → Wrangler15324 → supervisor36696). Readiness was confirmed at port8790 and generated headers parsed. After acceptance, taskkill targeted only verified Node4472 `/T /F`; the command reported termination of that owned tree (including workerd11064,20768, supervisor36696, Wrangler15324 and runtime helper descendants). No process was selected by name/port or in a reference repository. The build verifier never deletes backups; Astro owns dist cleanup. Timeout behavior independently proves owned children stop while exact configuration restores.

See FOUNDATION_DECISIONS.md for all controller rulings and asset packaging/performance costs. Composition B remains next; Composition C and stages 3/4 retain their separate approval boundaries.

Final strict check: 36 Astro files, zero errors/warnings/hints. Final full test command: 376 passing boundary/unit tests, five passing actual Astro render tests, one optional native-query test skipped because no native-query opt-in was set. Node's existing experimental SQLite warning remains informational. `git diff --check` passed.

Restart: owned `pnpm dev:cms` session27704, launcher Node25624 via cmd17808, owns content13928/Tina3964/Worker16484/site14868. Default configured ports4330/8790/4010/9010 were free at launcher preflight. Readiness GETs returned200 for /design-system, /en, /en/contact, /cms/index.html and Worker /api/health. Opening the showcase was requested in Codex; the child chat received a queued tab, so the controller opens it in the user-facing chat. Business routes remain available. The final ownership test additionally checks concurrent edits during local refresh; current focused total is ten cases.


After the final local-refresh ownership guard, the real staging/production/local verifier passed again, followed by strict check (36 files, zero diagnostics) and the complete 376+5 passing test suite with one optional native-query skip. Session27704 was stopped by verified launcher Node25624 `/T /F` for these checks. Final restarted launcher is session28700, Node25288 via cmd35552, owning content12348/Tina4532/Worker36028/site32844. All five readiness URLs again returned200. The latest build summary retains matching original/final project hashes. The initial browser storage/cookie emptiness assertion also passed against actual Worker assets after restart.
