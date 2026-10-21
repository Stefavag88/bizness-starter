# CMS headers and hosted form protection plan

Spec: ../specs/2026-10-21-hosted-form-security-design.md
Execution: inline; existing feature checkout; one final independent review. No external effects.

## Task 1: Authoritative CMS policy and configuration

Files: packages/config/security-headers.mjs + .d.mts; packages/config/form-protection.mjs + .d.mts; packages/config/project.mjs + .d.mts; scripts/configure.mjs; scripts/worker-config.mjs; worker/types.ts; worker/index.ts; tests/form-security.test.ts.

Interfaces: publicAssetHeaders(turnstile:boolean):string, cmsResponse(response,env):Response, formProtection(project,preview=false):{mode,siteKey}; turnstileSiteKey defaults empty and validates public-key syntax. Worker emits CMS_LOCAL_ORIGINS and TURNSTILE_SITE_KEY; authenticated CMS fetch is followed by authoritative header replacement.

Write failing policy/config tests; implement source helpers and generator integration; verify public CSP lacks inline/blob allowances and CMS inherits no duplicate CSP. Cover local origin filtering and auth failure. No generated source edits.

## Task 2: Turnstile controller and server validation

Files: apps/site/src/scripts/form-protection.ts; worker/security.ts; tests/form-security.test.ts; tests/turnstile-client.test.ts.

Interfaces: createFormProtection(form):{token():Promise<string>,reset():void,destroy():void}; optional injected loader permits isolated browser-independent lifecycle tests, production defaults fixed URL. Loader single-flights per document. Server verifyTurnstile preserves existing exported signature.

Write failing server tests and controller lifecycle tests; implement bounded loader/challenge, action checks, timeout/error/expiry cleanup and isolated local mode. Backend verifies exact token response hostname/action, HTTP status and sanitizes errors. Meter only actual attempts, no inline retry.

## Task 3: Contact/newsletter integration

Files: ContactForm.astro; shared FormProtection.astro component; newsletter NewsletterForm.astro/Footer/VisitorDialogs/Layout; newsletter-form.ts; visitor-experience.ts; packages/content/newsletter.mjs + .d.mts; styles/global.css; tests/newsletter-form.test.ts; rendering tests.

Await controller tokens for both form types. Newsletter options.token accepts async; coordinator blocks during challenge; input validation runs first. Every request resets the widget. Teardown cancels pending protection. Contact disables unavailable hosted submit and retains contact fallback. No hidden constant preview token in hosted output. Existing local behavior and browser storage semantics unchanged.

## Task 4: Exports, acceptance and documentation

Files: initializer inventory/client tests; production target readiness/example; docs/FORM_SECURITY.md; current readiness and deployment guides; scripts/verify-static-routing.mjs; browser acceptance harness.

Export/reset every new runtime dependency. Document public key vs secret, exact hostname/action, CSP ownership, local simulation and remaining hosted checks. Run focused regressions, check, full test, build, Worker dry-run, real local routing/CMS policy assertions, browser mocked challenge acceptance and independent generated-client checks. Final review, verified fix pass, evidence and restart CMS/site.

## Review focus

CMS public-policy separation and auth precede asset fetch; no arbitrary origins/key injection; no fallback to local on hosted requests; independent per-form callbacks/tokens; fresh token after rejection; async coordination/destroy races; timeout/loader failure permits explicit retry; export/reset completeness; production gates not silently lifted.
