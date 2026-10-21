# Hosted CMS and form security evidence

Date: 2026-10-21. Implementation commit: 33809a6, branch codex/free-runtime-budgets. Scope: local implementation and verification only; no deployment, real credentials, actual challenge calls, real subscriptions or sending. Existing unrelated analytics changes were preserved byte-for-byte and excluded from commits. Suite results apply to the working tree including those preserved changes.

## Implementation and tests

- Strict public site-key configuration defaults/reset; local/hosted/unavailable projection; source-controlled public/static policy and authenticated CMS-only response policy.
- CMS replaces inherited CSP after editor authentication on /cms and /cms/*, sets noindex and no-store, preserves redirects and denies unauthenticated requests before asset fetch. Public CSP retains strict defaults and allows the fixed Turnstile script/frame origin only when configured for a hosted build.
- Shared per-form controller: one lazy provider script per document, independent widgets, fresh action-specific tokens, old-callback rejection, bounded load/acquisition, explicit retry and destroy cleanup.
- Contact and modal/footer signup retain validation, accessible EN/EL messages and local preview. Async newsletter coordination covers protection plus HTTP; missing hosted keys retain honest fallbacks.
- Server rejects preview tokens remotely and checks secret, HTTP status, hostname/action and exact success with one metered fixed-endpoint attempt, redirect refusal and four-second timeout; errors sanitized.

RED/GREEN: initial header/config tests5fail ->51passed across policies/config/access; controller/server missing/incorrect behavior5fail ->10passed; async newsletter/projection3fail ->33focusedpassed; export regression1fail ->19focusedpassed including loader retry and old callbacks. The existing teardown test now waits for actual fetch start because token acquisition is asynchronous; it retains the original no-accept-after-destroy assertion.

pnpm check: 77 Astro files, zero errors/warnings/hints. pnpm test: 1,192 main passed, one existing skipped; 47 site rendering tests passed. pnpm build: 416 local pages. pnpm worker:check: successful dry-run. Real local Wrangler routing acceptance passed: public routes/assets bypass Worker, privileged routes invoke it, CMS effective CSP is single and correct on successful assets and canonical307 redirects.

## Independent app and browser acceptance

Retained client: C:/Projects/.form-security-client-a10203f1a6c84636aadbaa6b1da8695c. Frozen install, check, tests, build and Worker dry-run passed with reset local defaults. Only that newly created fixture was then switched to a production-like newsletter configuration with a fake public key and fake content; its hosted build/dry-run passed and excluded showcase/templates output. No cloud resource was connected.

Actual compiled pages were served locally with the hosted public CSP. Playwright mocked only the provider script and Contact/newsletter responses. EN/EL at375/1440 passed Contact expiry/no-submit and explicit retry, preserved input, successful action token, independent modal error, footer pending-token coordination/duplicate prevention, one provider script per document and no horizontal overflow. Screenshots were retained; EN mobile was visually inspected. Mocked successful responses prove browser contract behavior, not delivery or actual Cloudflare verification.

Initial browser harness failed because Playwright read its browser path before the environment was set; dynamic import after path setup uses the existing installed browser. A mock script also incorrectly reset the preselected expiry mode; changed it to a nullish default. No application fix was needed for either harness error. Routing initially expected200 for all CMS aliases; actual canonical307 redirects are now explicitly preserved and checked. Browser-only resume reused the already built disposable fixture and repeated no installs/builds.

Raw proof: .generated/form-*.log and .generated/evidence/form-security/report.json plus screenshots/client command logs. Reproduce the full isolated rehearsal with pnpm test:form-security, or use -- --resume-browser only for its existing retained fixture. The harness never mutates source content/project.

## Review and handoff

One independent read-only review of61b5614..33809a6 reported no Critical, Important or Minor findings. It did not rerun suites/builds or perform provider calls. Final native runtime acceptance then identified a local dev-only policy gap: Tina serves scripts from its local4010origin. The existing policy allowed connections but blocked these dev scripts. Diagnostic browser requests confirmed the cause; a focused regression reproduced it (RED). The fix allows only validated local Tina script and derived HMR WebSocket origins in authenticated local CMS responses. The now-loaded native editor also exposed bundled data-URL fonts blocked by the CMS default policy; a second RED regression covers the explicit CMS-only font-src self/data allowance. Hosted CMS receives that font directive, while public policies remain unchanged. Final check77Astrofiles clean, full suite1,192main+47site passed with1existing skip, and Worker dry-run passed after the fix. Native smoke results are recorded below. Production remains blocked for actual hostname/keys, Access/Tina/secret configuration and live verification, artifact/deployment/migration tooling, retention, sending/feedback, capacity and recovery. Staging remains optional.

## Final native acceptance and handoff

- After both native-discovered policy corrections, final focused controller/CMS suite12/12 passed. Final check77Astrofiles clean; final full suite1,192main+47site passed,1existing skip; Worker dry-run and actual local routing both passed. Logs: form-final-check.log, form-final-tests.log, form-final-worker.log, form-final-routing.log.
- Native read-only Settings/site loaded through http://127.0.0.1:8790/cms under the actual single Worker CSP; Enter Edit Mode and Save UI were visible. No edits or saves occurred. No page errors or required-resource CSP failures. Evidence: native-cms.json and native-cms.png.
- Seven optional Google Fonts/Tina telemetry request violations remained intentionally blocked and are recorded as blockedOptionalRequests. They were not silently permitted or claimed absent. Original diagnostic attempts are retained. Public CSP remains self-only for fonts and never gains CMS inline/blob privileges.
- The final shared header helper was applied only to the owned generated-client fixture after verifying its prior source against33809a6 (allowing only CRLF normalization). Independent client check/test/Worker dry-run passed again. Browser-only EN/EL375/1440 acceptance passed again after that update; its report is reset before every run so a failed resume cannot retain a stale success flag.
- Owned dev:cms stack session47971 remains running. EN, EL Contact, CMS and Worker health returned HTTP200. No external resources were provisioned, no credentials connected and no real send/subscription/deployment occurred.
- Pre-existing provider-usage edits remain byte-for-byte unchanged and uncommitted. Keep codex/free-runtime-budgets; no merge or push.

## Archived rulings

The owner's go authorizes this scope and the existing inline execution method; no additional approval round or cloud authorization was inferred. Reuse the active feature checkout. Preserve unrelated edits. Controller token acquisition is asynchronous, so the existing teardown regression waits for the actual fetch rather than assuming synchronous start. Browser path initialization, mock challenge-mode reset and canonical307 expectations were harness corrections. Final native acceptance legitimately required local Tina dev-script/HMR origins and CMS data fonts; these exceptions are restricted and tested. Optional telemetry/fonts are kept blocked and explicitly reported. One final independent review, one native acceptance correction pass and green final checks complete the local milestone. All hosted verification gates remain.
