# Hosted CMS policy and form protection

The owner approved fixing CMS headers and implementing Turnstile for Contact and newsletter on 2026-10-21. Preserve design/content/local preview, production-only workflow and unrelated analytics edits. No deployment, credentials, real sending or real challenge calls during verification.

## Design

The global static asset policy remains strict. Because Cloudflare combines matching _headers values, do not add a second CMS CSP there. After editor authentication, Worker CMS responses replace the inherited policy with exactly one CMS policy, covering /cms and /cms/*. Only local mode allows validated configured Tina loopback script/HTTP/HMR origins. CMS alone allows its bundled data-URL fonts; public font policy stays self-only. Optional remote fonts/telemetry remain blocked. Public responses never gain CMS inline/blob privileges. Shared pure source defines static and CMS policies. Unit and real local Wrangler routing tests verify actual response headers.

Add infrastructure.turnstileSiteKey as a developer-owned public key (default empty). Secrets remain Worker-only TURNSTILE_SECRET. Shared configuration projection returns local, turnstile or unavailable mode; previews are unavailable. Local mode works only on loopback in the browser and backend. Hosted forms require a configured key; missing configuration shows an honest contact fallback and never submits a local token. Production preparation reports missing/testing keys without clearing any hosted gates. Initializers reset the new key.

One browser controller per form lazily loads the fixed Cloudflare explicit-render script. Requests acquire fresh action-specific tokens (contact or subscribe) on submit, with explicit widget execution, interaction-only appearance, flexible sizing, localized widgets, bounded script/challenge waits and no automatic retries. Tokens are not cached between submissions. Reset/remove widgets after attempts and teardown; errors/expiry/timeout preserve entered values and permit user retries. No raw provider error is shown. Modal/footer have independent widgets and share existing request coordination and signup suppression.

Contact retains validation, request-key semantics and accessible statuses. Newsletter validates consent/email before loading protection, awaits token while holding the coordinator, and starts its fetch timeout afterward. Remove its loopback-only enhancement restriction when a hosted key is present. Local simulation and template-preview disabling remain intact. Existing fallback works without JavaScript or keys.

Server validation remains mandatory. For nonlocal requests, reject preview/empty/oversized tokens, require secret, meter one external call, use fixed endpoint with redirect refusal and bounded timeout, require HTTP success and exact success/hostname/action. Fail closed on malformed/non-success/provider failures with sanitized messages. Do not change consent, sending, admission or database ownership.

## Verification and release limits

Test first: policy replacement/no public weakening, auth before CMS fetch, strict public-key config/default/reset, local/hosted/preview mode gating, server hostname/action/error/timeout, async newsletter coordination, browser loader failure/retry, independent widgets, token expiry, teardown and no duplicate submits. Use actual built pages/controller browser tests with mocked challenge script and API responses; no real challenge credentials. Run check/full tests/build/Worker dry-run/routing/native CMS smoke and a generated-client rehearsal. One independent final review and one verified fix pass. Production remains blocked pending actual domain/key/Access/Tina configuration, hosted verification and all other existing release gates.
