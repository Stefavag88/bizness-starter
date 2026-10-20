# Starter v2 — Newsletter prompt and visitor preferences design

Date: 2026-10-20
Status: Proposed written design; awaits user review before implementation planning.
Baseline: `61e52ae` (reviewed shared motion, restored normal local stack).
Execution preference: inline implementation with per-task tests/commits and one independent final review. No per-task agent reviews.

## Intent

Add a reusable, accessible newsletter prompt with CMS-editable EN/EL content and defensively persisted browser suppression. Supply a clear visitor-preferences control without implying that a banner alone establishes compliance or adding analytics. Preserve the existing design system, publication rules, functional profiles and double-opt-in backend.

The existing starter uses the `enquiries` profile. Keep that default. Newsletter functionality is demonstrated and tested in detached newsletter/nurture fixtures; it becomes available on a real project only when its profile/modules and CMS settings explicitly enable it. Real sending, provider accounts, deployment and hosted form-protection setup remain separately scoped.

## Approaches

1. Native dialog, minimal shared preference state and the existing Worker subscription flow. Recommended: fits static Astro, avoids a dependency and preserves existing consent/security contracts.
2. Third-party newsletter popup/consent widget. More ready-made controls, but adds account/provider coupling, external scripts, storage and styling constraints to a provider-neutral starter.
3. Inline footer signup only. Simplest, but does not satisfy the requested modal prompt. Support a compact inline footer form as an independently selectable companion to approach 1, in addition to a modal-opening footer button.

Use approach 1. This is one experience module with a small shared browser-state boundary, not an email-provider migration or a generic external-script platform.

## Ownership and enablement

- Extend strict developer `project.modules` with `newsletterPrompt:false` and `visitorPreferences:false`, defaulted for existing projects. Preserve `enquiries`, `newsletter` and `nurture` profile meanings.
- The effective newsletter capability requires a newsletter/nurture profile, `modules.newsletterPrompt`, enabled CMS settings, complete eligible localized copy and a published localized privacy destination. No frontend signup or newsletter bundle/request is exposed in enquiries.
- Visitor preferences can be enabled independently. When no newsletter prompt or optional integration exists, do not render an empty preferences control/dialog.
- Shared settings own widget enablement, modal enablement, footer mode, auto-open, timing and interest selection. Default/localized settings own copy; translations cannot independently change structure, timing or consent choices.
- Omitted newsletter settings remain disabled. Turning a profile/module off retains dormant canonical copy/preferences without leaking visible controls, requests or routes. Native CMS saves must preserve dormant values and unrelated rich-text ASTs, including saves after switching a module off.
- Keep current seeded content/profile unchanged unless explicitly approved. No silent conversion of the default example to newsletter. The implementation guide will show the exact opt-in steps.

## CMS model

Use a named Settings group, `newsletterPrompt`, with shared fields:

| Field | Default | Validation / meaning |
| --- | --- | --- |
| enabled | false | Master editorial availability, only effective in the eligible profile/module |
| modalEnabled | true | Makes the dialog available; independent of the compact footer form |
| autoOpen | true | Automatic prompt when the modal is enabled; manual entry remains when false |
| footerMode | open-modal | Enum off, open-modal, inline; open-modal requires modalEnabled |
| delaySeconds | 12 | Integer 5–120; elapsed eligible visible-page time |
| dismissDays | 30 | Integer 1–180; cooldown after automatic display/dismissal |
| acceptedDays | 180 | Integer 30–365; suppress after the API accepts a request |
| interestId | empty | Select an exact configured project interest; required when enabling |

Localized copy: `title`, rich `body`, short rich-inline `footerPrompt`, `emailLabel`, `submitLabel`, `consentLabel`, `privacyLinkLabel`, `dismissLabel`, `successTitle` and rich `successBody`. Use existing safe rich-text/schema/editor helpers: canonical Markdown strings, Tina visual WYSIWYG/HTML-style editing for modal body and success body, detached validation, preserved native ASTs and no arbitrary HTML execution.

The modal body editor supports the existing approved paragraphs, headings, lists, emphasis and links. Canonical safe rich content remains the storage format; no new arbitrary raw-HTML execution path is introduced. The footer prompt uses the inline rich-text editor (text/emphasis/links only), with no heading, image or full-body field.

Apply bounded text/body lengths using the existing field conventions. An allowed interest and required copy for each enabled surface must validate before enabling. Footer-only configurations do not require unused modal title/body copy; inline footerPrompt is required only in inline mode. Reject open-modal footer mode when modalEnabled is false. Allow modal only, inline footer only, or both. Missing/draft/unavailable localized privacy content makes the prompt ineligible in that locale; do not invent a cross-language privacy URL. Operational field help explains that successful submission is not active subscription and material consent-copy changes must be reviewed alongside the existing privacy version.

Validation/progress/error/close labels use the shared localized UI message boundary, not CMS-editable arbitrary server errors. Consent is unchecked and explicitly required; privacy acknowledgement and newsletter marketing consent are not conflated. The checkbox text and the existing server-owned `settings.legal.privacyVersion` remain the consent contract; the client cannot set a consent version.

## Modal and interaction

- Use a native `<dialog>` with existing typography, colours, radius, form fields, buttons, semantic tokens and icons. Content is a short title/body, email field, explicit consent, privacy link and one submit action. No image is required.
- Auto-open once per eligible cooldown, after the configured delay. Count only foreground/visible time. Do not auto-open on Contact, privacy, error/system pages, newsletter token pages, CMS/admin or the design-system showcase. Contact remains form-first.
- If the visitor is entering another form, another dialog is open or the page is backgrounded, defer the prompt; never steal current form focus. Eligibility is rechecked when attempting to open, not only at page initialization.
- In open-modal footer mode, a Newsletter button allows manual opening regardless of automatic cooldown or prompt preference. In inline mode it is replaced by the compact form described below; off mode renders neither. Manual opening never changes backend subscription status.
- Escape and a visible close/dismiss control work. Native modal focus containment/inert background is used; restore focus to the trigger, or a safe existing page element for auto-open. Closing the prompt records cooldown. There is no nested modal stack: opening preferences from the prompt closes it safely and does not automatically reopen it on return.
- Use the accepted motion tokens for a brief optional dialog entrance, without scroll-reveal markers. Reduced motion opens/closes immediately. Do not delay focus, allow disappearing controls during exit, or animate the primary page content.
- Dialog/storage/fetch support is feature-detected. Unsupported browsers do not auto-open. With JavaScript disabled, no broken modal controls are exposed; provide a localized direct Contact alternative, not a nonfunctional HTML POST to a JSON-only API.

## Compact footer signup

The footer is independently configurable from the modal. `footerMode: inline` renders a short localized `footerPrompt`, one email input and one submit button, not the modal title/body. Reuse the localized email/button labels and the same accessible form/controller, validation, request state and Worker contract; do not duplicate a second subscription implementation.

On wide screens, email and button sit on one row; on small screens they stack without overflow. Keep the prompt above them and a compact explicit-consent/privacy row below. Consent is not prechecked or inferred silently from a generic button click: the existing API requires affirmative newsletter consent. This supporting row is not a second marketing body. Status/error feedback is compact and local to the footer form.

Footer submission does not open another modal. A successful request updates the same browser suppression state as modal submission, so it prevents a subsequent automatic prompt. When the modal accepts a request, the inline form can reflect the same generic received-request state without exposing subscriber identity. Manual form availability is not disabled solely by automatic-prompt preference/cooldown. Both surfaces share the configured interest and privacy destination.

Set modalEnabled false and footerMode inline for footer-only signup; set footerMode off for modal-only use; set both enabled for both surfaces. Auto-open never runs when the modal is disabled. The master capability/profile/protection gates and no-JavaScript Contact fallback apply equally to both surfaces.

## Newsletter request flow

POST to the existing `/api/newsletter/subscribe` contract: UUID `requestKey`, bounded `email`, explicit `consent:true`, configured `interest`, and the existing protection token contract. Do not add `sourceArticle` in the initial modal, which avoids default-locale manifest assumptions and unnecessary visit attribution.

Reuse current validation, same-origin checks, per-IP/email rate limiting, privacy-version recording, pending status, confirmation tokens, suppression and profile gating. Disable duplicate submits, retain form values and the attempt key on timeout/retry, and announce localized actionable errors without displaying raw backend internals. Do not weaken validation or bypass hosted Turnstile to make the modal work.

A 202 response is deliberately uniform and cannot disclose active/suppressed/existing addresses. Show CMS success copy acknowledging receipt and the confirmation requirement, never a client claim that the visitor is subscribed. Store only a browser UX suppression marker. Dismissal/preferences/suppression are not consent records, subscription proof or an unsubscribe mechanism.

Keep real sending disabled. Local tests use the existing local-only protection/capture flow in an isolated D1 fixture. Hosted frontend Turnstile provisioning/widget/CSP integration is not added in this slice: outside local mode the prompt must not auto-solicit submissions when a genuine supported protection adapter is unavailable; present a localized safe Contact alternative. Never ship the local token as a hosted submission path. The existing confirmation emails/token pages currently use English; their broader localization is not claimed as part of this EN/EL prompt slice.

## Browser preferences and suppression

Use one project/origin-scoped versioned localStorage record, for example `starter:<project.name>:visitor:v1`. EN/EL share the same state. Store only version, prompt preference and bounded timestamps for last auto-display, dismissal and request-accepted suppression. Never store email/name, request keys, confirmation/unsubscribe tokens, subscriber IDs or a purported server subscription status.

Default automatic eligibility requires no current dismissal/request-accepted suppression and prompts not being explicitly disabled. Record the automatic display cooldown successfully before opening, so navigation/tab closure does not immediately prompt again. Read/validate state again immediately before opening and respond to the storage event for other tabs. Concurrent cross-tab scheduling is best-effort; localStorage is not an atomic lock and cannot prove exactly-once cross-tab display.

If storage is blocked, malformed, too large, of an unknown version or cannot persist the pre-open cooldown, fail quiet: no automatic popup. Manual signup/preferences still work with in-memory state for the current page. Validate finite timestamps and cap accepted horizons; future/tampered values never grant server privileges. Recovery/reset affects only the module's own known key and is an explicit visitor action.

After an accepted request, suppress automatic prompts for acceptedDays in that browser. This is called request-accepted suppression, not subscribed status: double opt-in still belongs to the server. Errors never set accepted suppression. Clearing storage/changing browser resets these convenience choices. Manual signup remains possible.

## Preferences and cookies

Provide a footer Privacy preferences button when the visitor-preferences module has an actual choice to offer. Its initial choice is whether automatic newsletter prompts are allowed on this browser, plus a clear reset action. Explain that disabling prompts does not unsubscribe from emails; the unsubscribe link remains in each email.

No optional analytics/tracking integration, analytics cookie or external marketing script is currently configured in the starter. Therefore do not add a blanket Accept all/Reject all banner, empty analytics toggles or a false statement that tracking is active. Functional prompt/preferences storage is documented accurately in the module/privacy guidance; browser storage is not described as being outside privacy considerations simply because it is not a cookie.

Record an extension contract for future optional integrations: explicit developer-owned adapter registration, accurate categories/copy, default deny until a choice, no request/script injection before consent, and cleanup/revocation where feasible. An integration must implement that boundary before being enabled; this slice does not ship a dormant arbitrary script-loader or claim future integrations are already gated. Any future actual cookie banner, integrations and policy copy require their own reviewed implementation.

## Verification and delivery

Implementation planning must define exact files, schema/native-save interfaces and tests in four meaningful areas: configuration/content/CMS, state/scheduling, accessible UI/API integration, and acceptance/docs. Execute inline, tests and commits per step, one fresh independent final review.

- Test profile/module off/on, modal-only/footer-only/both, invalid open-modal-without-modal configuration, missing/partial legacy settings, surface-specific copy requirements, valid/invalid interest, complete EN/EL copy, privacy publication and dormant-data preservation.
- Real Tina UI saves must prove title/body/footerPrompt/timing/interest/modal/footer enablement changes, WYSIWYG AST preservation and module-disable/re-enable retention. Restore only request/schema/installed-serializer-derived owned fixture bytes; use detached fixture configuration/D1 wherever possible.
- Test expired/current/future/corrupt/oversized/blocked storage, failed writes, reload/language navigation, accepted/failed submissions and cross-tab preference changes. Make no claim of atomic cross-tab scheduling.
- Browser-check 375/768/1440 in EN/EL: eligibility/delay, Contact exclusion, no background/focused-form interruption, footer manual open and compact inline signup (prompt/input/button, no modal body, shared consent and suppression), dialog keyboard/escape/focus restore, preference reset, reduced motion and no-JavaScript alternatives. Verify no duplicate modal, hidden content, horizontal overflow or unexpected external traffic.
- Verify actual local subscription reaches pending, uniform 202 remains non-enumerating, the captured confirmation flow reaches active, and unsubscribing preserves existing suppression. Use dummy fixture addresses, isolated D1 and local requests only; do not mutate the normal example database or send mail externally.
- Run existing config/content/type/site/Worker/CMS/routing/showcase gates plus focused native/browser acceptance. Record explicit process ownership, hashes, exit codes and honest limits. Restore the normal local site/CMS after lifecycle-owning checks.

## Self-review and approval boundary

The user clarified that modal body uses a visual HTML/WYSIWYG editor and that a compact, independently selectable footer form has a short prompt rather than a full body. This revision incorporates both.

This design deliberately keeps the neutral enquiries example, backend consent/security guarantees, real sending settings and current visual system intact. The proposed timings and storage horizons are UX defaults, not legal retention advice. It distinguishes browser convenience, newsletter consent and future optional tracking, and does not promise production-provider readiness. No runtime implementation has been made. Written-design approval is required before the implementation plan; the chosen inline/final-review execution method is already preserved.
