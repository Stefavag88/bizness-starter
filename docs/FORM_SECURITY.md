# CMS policies and form protection

Status: locally implemented and tested; actual hosted verification remains required. No credentials, cloud resources or delivery are configured by this change. The site design and CMS content ownership are unchanged.

## CMS policy ownership

Static assets have one strict public Content-Security-Policy in the generated _headers file. Public pages never receive CMS inline-script, inline-style or blob allowances. After editor authentication, the Worker replaces the inherited CSP on /cms and /cms/* responses with exactly one CMS policy, sets noindex/nofollow and no-store, and preserves status/body/redirect behavior. Unauthenticated requests never fetch editor assets. CMS_LOCAL_ORIGINS contains only configured Tina loopback origins in local mode. The local CMS policy permits their dev scripts, HTTP connections and derived HMR WebSocket origins; hosted CMS policies ignore those origins entirely. CMS alone permits its bundled data-URL fonts; public font policy stays self-only.

This ownership avoids overlapping policies: Cloudflare combines values from matching rules, so an additional CMS rule does not override a public rule. See [Cloudflare asset headers](https://developers.cloudflare.com/workers/static-assets/headers/). CMS remains protected by Access plus independent Tina authentication/membership. The native editor's required inline privileges apply only behind that authenticated route, not to public pages. Do not add a second static CMS CSP. Optional Google Fonts stylesheets and Tina telemetry origins are deliberately not allowlisted. Local native Settings loaded without them; blocked optional-request console messages are recorded separately from required-resource failures.

## Public key and server secret

Set developer-owned infrastructure.turnstileSiteKey to the widget's public site key for the intended hosted build. It is a bounded alphanumeric/underscore/hyphen string, default empty, and is deliberately public in form markup. Set TURNSTILE_SECRET separately as a Worker secret binding. Never put that secret in project JSON, deployment JSON, CMS content, frontend environment variables or logs. Configure the widget for the final site hostname and verify contact and subscribe actions. Turnstile pre-clearance is not enabled by this integration.

Local mode uses a preview token only on loopback and does not load the provider script. Template previews stay disabled. Hosted mode with no site key disables the Contact submit button with a localized explanation and retains email/phone alternatives; newsletter keeps its contact fallback. Hosted mode with a site key enables the real widget flow. A browser claiming local mode on a nonlocal hostname is rejected, and the backend independently requires both local environment and loopback request hostname before bypassing verification.

Independent clients reset the site key to empty. Production preparation accepts it under the explicit production infrastructure input and reports missing/testing keys; it still produces a blocked review plan, not a hosted build. The future production artifact pipeline must pass the same selected key/site origin to the build and Worker. Never edit generated assets or change the local project's environment merely to remove readiness warnings.

## Browser lifecycle

Contact, newsletter modal and footer share a controller with an independent widget for each form. The fixed Cloudflare explicit-render script loads only when protection is needed. A document shares one loader. Every submission executes a fresh action-specific challenge; tokens are not stored in browser storage or reused for retry. Flexible interaction-only presentation preserves the normal form layout, showing the provider challenge when interaction is needed.

Email/consent validation happens before requesting a newsletter token. Shared request coordination covers challenge waiting as well as submission, preventing modal/footer duplicate requests. Challenge failure, expiry, script failure or timeout preserves input and permits an explicit user retry. Widget callbacks from an older attempt cannot resolve a new one. Teardown removes widgets and rejects pending protection; page restoration reinitializes the existing controls. Status messages remain localized and accessible.

The loader waits at most 10 seconds, token acquisition 45 seconds including script loading, Contact submission 15 seconds and newsletter submission 20 seconds. These are application defaults, not provider guarantees. Network requests are not automatically retried. After an API attempt the widget is removed so a retry obtains a new token while preserving the existing request-key semantics.

The public CSP allows only the additional script/frame origin needed by Turnstile when a hosted key is configured. See [Cloudflare CSP guidance](https://developers.cloudflare.com/turnstile/reference/content-security-policy/) and [explicit widget rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/). Do not proxy or locally cache the provider API script.

## Server verification

The Worker rejects local-preview, empty and oversized hosted tokens; requires the secret; and verifies with the fixed Siteverify endpoint. HTTP failure, malformed data, redirect, timeout, unsuccessful verification, wrong hostname or wrong action fails closed. There is one metered external attempt and a four-second timeout; raw provider errors and secrets are never returned to the browser. Existing privacy/consent, rate limits, idempotency, capture/sending and budget rules still apply.

Cloudflare tokens are short-lived and single-use; server validation is mandatory. See [Siteverify documentation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Production requires real matching keys and a real hostname test, not just passing local fixtures or public testing keys.

## Acceptance and remaining gates

The local suite covers configuration, policy/auth boundaries, async form coordination, provider failures and controller cleanup. Real local Wrangler acceptance checks the effective CMS/public response policies. Browser acceptance uses actual built pages and a mocked provider script/API so no challenge credentials, real signups or sends occur. Independent generated clients must include the same helpers and reset defaults.

Before release, verify actual Access login/JWKS and route coverage, Tina repository/index/rebuild publication, native CMS under hosted CSP, real challenge success/expiry/error for both locales, matching sitekey/secret/hostname/action and secret rotation. Production artifact identity, remote migration/deployment tooling, sending/feedback, retention, capacity and recovery gates remain mandatory. Staging stays optional. See [deployment preparation](DEPLOYMENT.md) and [production readiness](PRODUCTION_READINESS.md).
