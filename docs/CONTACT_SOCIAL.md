# Contact and social channels

Settings owns contact destinations in `content/settings/site.json`. In Tina, open **Settings → site → Contact** for required email, optional phone and address, or **Social channels** for Instagram, LinkedIn, Facebook, WhatsApp and **Show social icons in header**. These shared fields are available in each functional profile. Greek address copy belongs in **Translations → Ελληνικά → Contact**. Email, phone, social destinations and the header toggle cannot be overridden in translations.

Missing/null `social` defaults to empty channels and `showInHeader: false`; existing seed content requires no migration. Individual missing/null/blank channel values clear to empty strings. Strings trim; the toggle accepts actual booleans only. Clearing a field and saving removes the corresponding link, icon and empty group on the next render.

Instagram, LinkedIn and Facebook accept HTTPS URLs, at most 2048 characters, on their respective exact platform domain or a subdomain. Credentials, nondefault ports, HTTP, suffix lookalikes, unsafe encoding and alternate redirect domains such as `fb.me` are rejected. Valid paths, queries and fragments remain intact. WhatsApp accepts `+` followed by 8–15 digits (first digit nonzero), with no spaces, separators or URL. Its helper example is illustrative; do not guess a country code. The generated destination is `https://wa.me/` followed by the digits without `+`.

Phone remains optional display text of at most 100 characters. Callable display syntax contains 3–20 ASCII digits, at most one leading `+`, and only spaces, hyphens, parentheses or periods as separators. Recognized values become `tel:` destinations without separators. Other nonempty values remain escaped text without a fabricated dial link. Email remains required and its complete validated mailbox is URI encoded after `mailto:`. Address is escaped localized text with line breaks preserved; there is no map provider.

Contact retains its required form and hero. The form comes first in the DOM and on narrow screens; at 56rem the details/social aside sits beside it. Contact and footer show labeled direct links, address and configured socials. The header shows only configured social/WhatsApp icons when explicitly enabled. Social order is Instagram, LinkedIn, Facebook, WhatsApp; direct order is phone then email. Empty groups disappear. EN/EL labels include a localized new-tab indication and distinct Contact/footer/header navigation names; other configured languages use the existing English UI-label fallback.

Direct phone/email links use the current browsing context. Social/WhatsApp links use a new tab with `rel="noopener noreferrer"`. Standard HTTPS links allow the browser/OS to offer an installed app when supported. Native-app opening cannot be guaranteed; no custom-scheme probe, tracking or visitor storage is added. No links need to be opened to verify their destinations.

Geometry defaults live in `apps/site/src/styles/foundations.css`: `--contact-icon-size: 1.125rem`, `--social-icon-size: 1.25rem`, `--contact-link-gap: .625rem`, `--social-link-gap: .5rem`, `--contact-link-target: 44px`, `--contact-aside-width: 22rem`. Existing semantic colors, focus, radius and page spacing remain authoritative. The decorative inline icon subset has pinned provenance and its full license in [third-party notices](THIRD_PARTY_NOTICES.md).

Save through Tina and reload the editor/public page to check changes. Local Astro content watching refreshes the public view; hosted static output requires a successful rebuild and publication through the separately authorized hosting workflow. Native validation preserves original rich-text ASTs while validating detached data. The installed Markdown serializer may add its normal trailing newline when saving an otherwise untouched notice; the acceptance proof compares untouched native ASTs and separately checks exact installed-serializer bytes.

## Local acceptance

Stop the owned public/CMS launcher first. The two phases run sequentially:

```powershell
pnpm test:contact-social -- --public
pnpm test:contact-social -- --native
```

The public phase builds five exact-owned Settings fixtures and serves actual static output through the existing private Worker harness: no socials, all socials/header off, all socials/header on, one social, and long contact/address with an unsupported phone. Each fixture covers EN/EL at 375/768/1440 with JavaScript on/off, exact destinations/attributes/order, 44px targets, form-first layout, focus, overflow, screenshots and representative axe checks. External navigation is intercepted; no platform, dialer or mail client is opened.

The native phase starts its own indexed Tina/Astro tree, reads the indexed original Settings values, and performs three actual UI saves: set four channels/header on; clear Instagram and WhatsApp; turn the header off. It checks bilingual public updates and reloads the editor to prove retained clears/values. A mutation is admitted only for one exact update of `settings/site.json`. Before dispatch, installed GraphQL input coercion, the active schema and installed serializer derive complete expected bytes. A single native source owner compares those exact bytes before claiming them, and compares raw legal/translation ASTs with the pre-edit indexed values. Only read-only public checks may retry through Astro HMR navigation invalidation; saves are never retried.

The driver retains source hashes, full canonical snapshots, command/PID/timing/exit records and cleanup ledgers under ignored `.generated/media-optimization/acceptance-*` directories (historical helper naming). Each phase independently stops owned runtimes and restores only exact-owned files; any source conflict or unconfirmed shutdown prevents regeneration. Preserve retained backups/conflict bytes for manual review. Neither phase starts the main launcher or migrates source D1. These are local acceptance checks, not hosted-provider or complete accessibility certification. See [acceptance evidence](superpowers/plans/2026-10-20-starter-v2-contact-social-evidence.md) for actual runs, failures and source timing.
