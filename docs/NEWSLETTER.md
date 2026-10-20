# Newsletter signup and visitor preferences

The newsletter module adds a native modal and an optional compact footer form. It uses the existing double-opt-in Worker flow. It does not enable a sending provider or certify a production deployment.

## Enable a project

Keep `profile: enquiries` for contact-only projects. To opt in, select `newsletter` or `nurture` and configure a developer-owned interest:

```json
{
  "profile": "newsletter",
  "modules": {"newsletterPrompt": true, "visitorPreferences": true},
  "interests": [{"id": "updates", "label": "Useful updates"}]
}
```

Merge these keys into `project.json`; retain other configuration. Stop the owned development launcher before changing module configuration, run `pnpm configure`, and restart `pnpm dev:cms`.

In CMS Settings -> Newsletter signup, select the configured interest, complete default-language and translated copy, choose the surfaces and enable signup. Every enabled locale needs its own published Privacy page. Shared settings control layout and scheduling; translations control copy only. Missing privacy/copy never falls back to another language's Privacy destination.

| Experience | modalEnabled | footerMode | autoOpen |
| --- | --- | --- | --- |
| Modal only | true | off | true |
| Footer only | false | inline | irrelevant |
| Both | true | inline | true or false |
| Footer button opens modal | true | open-modal | true or false |

`enabled` is the editorial master switch. Module flags default false; omitted newsletter settings remain disabled. Disabling the module/profile retains dormant native content and keeps it out of public signup functionality. Default example content/profile is unchanged.

## Editing content

`title` is modal-only. `body` and `successBody` use Tina's visual rich-text editor: paragraphs, H 2/H 3, lists, emphasis, safe links and quotes. The canonical representation is safe Markdown, not executable arbitrary HTML. The `footerPrompt` editor permits short inline emphasis and links; it is not a second full body.

Email/button labels, explicit-consent copy, Privacy label, close label and success title are localized. Operational validation/error/progress and preferences labels use the shared EN/EL UI messages. The footer shows only its prompt, email, button, compact consent/Privacy row and local feedback. Consent starts unchecked and is required.

The existing server-owned `settings.legal.privacyVersion` is recorded by the backend; the browser cannot supply it. Review material consent changes alongside that version. An accepted request is not proof of active subscription. Success copy should explain confirmation by email, without disclosing whether an address already exists.

## Timing and storage

Defaults are 12 visible seconds before automatic display, 30 days after automatic display/dismissal, and 180 days after request acceptance. Accepted bounds are 5–120 seconds, 1–180 dismissal days, 30–365 accepted-request days, integers only. These are UX choices, not legal-retention advice.

Automatic prompts do not run on Contact, Privacy, error/system/token/admin/CMS/showcase pages. The scheduler pauses in hidden tabs and defers to active form entry or another open dialog. Manual signup stays available despite automatic-prompt cooldown/preference. Native dialogs provide keyboard containment; Escape/close restore focus. Reduced motion removes the entrance animation.

One origin/project key, `starter:<project.name>:visitor:v 1`, is shared across languages. It stores only a version, the automatic-prompt preference and bounded display/dismissal/accepted-request timestamps. It stores no email, name, request ID, token, subscriber ID or server subscription status. Clearing storage/changing browser resets these convenience choices. Cross-tab suppression is best effort; localStorage is not an atomic lock.

Blocked storage, corrupt/oversized/unknown-version records or failed pre-open persistence prevent automatic prompts. Supported manual forms continue without persistent storage. Privacy preferences offers an explicit reset for only this known key. Disabling prompts does not unsubscribe from email; use each email's unsubscribe link.

## Fallback and current delivery boundary

Forms/buttons become interactive only after successful enhancement. Without JavaScript or required browser APIs, a localized Contact alternative remains available. The default enquiries profile loads no newsletter controller.

This slice supports local signup through the existing local-only protection and captured-mail flow. It does not provision hosted Turnstile/widget/CSP integration. Nonlocal environments without that authentic adapter present Contact alternatives and cannot solicit a broken signup. Local preview tokens never become a hosted bypass. Real sending and marketing remain disabled. Confirmation emails/token pages currently use English; EN/EL localization here covers the public widget, not that existing backend presentation.

The existing origin checks, request validation, per-IP/email limits, pending state, 48-hour confirmation token, unsubscribe and suppression semantics are preserved. Both forms share validation/submission logic and an in-flight lock. Timeout retries retain the same attempt key for an unchanged payload; no stronger backend exactly-once guarantee is claimed.

## Preferences, cookies and future integrations

No optional analytics/tracking integration is currently configured, so this module does not show a blanket Accept all/Reject all cookie banner or empty analytics choices. Functional localStorage still requires accurate privacy documentation; it is not outside privacy considerations simply because it is not a cookie.

A future optional integration needs explicit developer-owned adapter registration, accurate categories/copy and a reviewed implementation that defaults to denied, prevents requests/script injection before consent, and handles revocation/cleanup where feasible. There is no shipped arbitrary script-loader or promise that future integrations are already gated. Add a real cookie-consent interface when an actual configured integration needs it.

## Verification

Run `pnpm test:newsletter` with the normal owned launcher stopped. The runner copies source into unique ignored fixtures, starts owned local stacks, uses separate D 1 persistence and dummy addresses, and records native/browser/backend evidence under `.generated/newsletter/acceptance-*`. It refuses unexpected native mutations, derives expected file bytes through the installed GraphQL coercion/serializer, and checks the main source inventory stayed unchanged. Fixture node_modules junctions must not be recursively followed during cleanup.

The acceptance suite covers actual WYSIWYG saves and module disable/save/re-enable preservation; EN/EL responsive dialogs/footer; storage failures/preferences; and actual local pending, confirmed, unsubscribed and suppressed behavior. Supplement with the standard check/test/build/Worker/CMS/routing/showcase gates. The committed evidence report records exact runs, limitations and the independent final review.


## Subscription correctness and operational policy

Signup acquires subscriber identity inside one transactional batch; concurrent first requests do not create jobs referencing a losing identity. Request keys that already recorded consent do not rotate confirmation tokens on retry. New valid requests after cooldown can request a fresh confirmation. Contact requests with newsletter consent validate their interest before persistence and commit enquiry, notification and subscription statements together.

Permanent complaint/bounce suppression is address-level, including feedback from an older generation. It is not bypassed by a fresh public subscription. Duplicate event IDs cannot repeat suppression side effects after a later manual status change. Marketing disablement pauses eligible intents; unknown delivery remains quarantined. See [operations](OPERATIONS.md) and [production readiness](PRODUCTION_READINESS.md) for recovery and deferred hosted work.
