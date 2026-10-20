# Binding task contracts

## Global Constraints

- Work only C:/Projects/bizness-starter-v2, codex/starter-v2-contact-social, from accepted media closeout 3519bcd plus planning commits. Both original reference repositories remain read-only.
- Preserve schemaVersion 2, existing Pages/editor AST/publication/profile boundaries, neutral design and required Contact form. No seed rewrite to insert optional defaults.
- settings.social defaults to {instagram:'',linkedin:'',facebook:'',whatsapp:'',showInHeader:false}; shared fields cannot appear in translations. Missing/null native clear states follow the spec exactly.
- Three platform URLs use HTTPS with exact base/subdomain platform matching, max2048 characters, no credentials/nondefault port or unsafe encoded bypass. WhatsApp matches ^\+[1-9][0-9]{7,14}$ and becomes https://wa.me/<digits>.
- Keep existing phone display compatibility; supported callable syntax and encoded email URI follow the spec. Do not guess country codes or open external apps during tests.
- Direct tel/mailto use no new tab. Social/WhatsApp HTTPS uses target=_blank and rel="noopener noreferrer", accessible localized new-tab wording, fixed channel order and no ghost groups.
- Tokens: --contact-icon-size:1.125rem; --social-icon-size:1.25rem; --contact-link-gap:.625rem; --social-link-gap:.5rem; --contact-link-target:44px; --contact-aside-width:22rem. Contact splits at56rem, form-first DOM/mobile order. Existing semantic theme colors/focus/radius remain authoritative.
- English Markdown, EN/EL public strings, current English fallback for other configured locales. No AXIA assets, source content, real social accounts or new dependencies.
- Before canonical configure/check/test/build/CMS commands, verify and stop the owned launcher tree; preserve exact inventory for final restoration. No overlapping checkout commands. Restore only owned expected bytes and refuse regeneration after conflict.
- No hosted setup, sending, deployment, merge, push, tag or release. Keep branch as-is at closeout. No animation, tracking or visitor storage.


## Canonical settings and localization

Keep schemaVersion 2 and all current fields. Add optional shared root settings.social, normalized to:

```ts
interface SocialSettings {
  instagram: string;
  linkedin: string;
  facebook: string;
  whatsapp: string;
  showInHeader: boolean;
}
```

Missing/null social object defaults to all strings empty and showInHeader=false. Each URL/number accepts missing, null, empty and whitespace-only native clear states and normalizes to ''. Supplied strings trim. showInHeader accepts missing/null as false, accepts actual booleans only, and rejects string booleans. Unknown social keys reject. Root settings.social and its fields cannot be overridden in translations.

Existing content must build unchanged with this object absent; do not rewrite the seed merely to insert defaults. SettingsCopy gains the fully normalized social object. Both default and nondefault localization explicitly retain it: localize.mjs currently reconstructs nondefault settings and would otherwise omit a new root property. Return detached values; never mutate source/native objects.

contact.email remains required. Existing phone display strings retain their max-100-character schema contract; address remains localized text. Normalize null/absent optional phone/address to '' to support native clears. Do not tighten unrelated persisted phone strings or silently invent a callable number. A recognized phone contains 3–20 ASCII digits, at most one leading +, and only spaces, hyphens, parentheses and periods as display separators; strip separators for tel:. Nonempty unsupported display strings remain visible as escaped text, without a fabricated telephone link. CMS helper text documents this limitation. Email href encodes the complete validated mailbox as a URI component after mailto: so query/fragment characters cannot become injected parameters; visible email stays unchanged.

## Destination rules and public link model

Add browser-safe packages/content/contact.mjs and matching .d.mts; no filesystem, Tina or Astro imports. Reuse isSafeLink for final destinations. Export SOCIAL_CHANNELS in fixed Instagram, LinkedIn, Facebook, WhatsApp order, socialSettingsSchema, phoneHref(value:string):string|undefined and contactChannels(settings:SettingsCopy,locale:string):ContactChannels.

ContactChannels is {direct:ContactLink[],social:ContactLink[],phoneText?:string,address?:string}. ContactLink is {id:'email'|'phone'|'instagram'|'linkedin'|'facebook'|'whatsapp';label:string;href:string;external:boolean}. Direct order is phone then email. labels are the visible phone/mailbox for direct links and platform names for socials; phoneText appears only for an unsupported nonempty phone. Address is escaped text, with line breaks preserved; no map/geolocation provider.

Social URL strings are at most 2048 characters and must pass isSafeLink, use HTTPS, have no credentials or nondefault port, and have exactly the platform base hostname or a subdomain of instagram.com, linkedin.com or facebook.com respectively. Reject suffix spoofing, protocol-relative URLs, HTTP, unsafe/encoded control or backslash bypasses, userinfo and wrong-platform URLs. Preserve valid paths, queries and fragments. This intentional platform allowlist does not accept fb.me or custom redirect domains in this slice.

WhatsApp stores an international number matching ^\+[1-9][0-9]{7,14}$, not a URL or display string. Generate https://wa.me/<digits-without-plus>. Blank means absent. No prefilled message, visitor data or country guessing.

Direct links use tel:/mailto: without target=_blank. HTTPS social/WhatsApp links use target=_blank and rel="noopener noreferrer". They provide a localized accessible new-tab indication. Standard URLs let the OS/browser offer an installed application when supported; the website cannot guarantee native-app launch and adds no custom-scheme probes or timers.

## Components and visual treatment

Create ContactIcon.astro for allowlisted inline SVGs, ContactDetails.astro for direct links/address, and SocialLinks.astro for social links. All receive explicit data/locale props; no global content loader. SVGs are decorative aria-hidden=true, focusable=false with explicit dimensions/currentColor. Anchor names remain textual, including when visually hidden in the header.

Use a small vendored subset of Bootstrap Icons (telephone, envelope, geo-alt, instagram, linkedin, facebook, whatsapp), after pinning an upstream commit and retaining source paths/checksums and the full MIT notice. No icon font, remote asset, package installation or raw CMS SVG. Upstream license: https://github.com/twbs/icons/blob/main/LICENSE (verified 2026-10-19). Logo usage is not a legal certification.

Contact: retain its required form and existing hero. Within the existing form section, use a form-first DOM and a compact details/social aside: two columns at >=56rem, stacked form-first below. Give the social group its own small localized heading only when at least one channel exists. Avoid adding a second hero, eyebrow, CTA band or a long block before the form.

Footer: retain brand/tagline, legal notice and Privacy. Group direct contact/address and socials clearly, using the same components and data as Contact. No empty columns or artificial separators. Keep the existing top separation and page wrap.

Header: render only configured social/WhatsApp icons when showInHeader=true. Default false. Use a named social navigation region distinct from main navigation and language controls. Wrap without hiding links or reducing touch targets on small screens; no new menu subsystem or altered language selector.

Contact/footer links use icon plus visible label; header uses icon plus visually hidden accessible label. New-tab wording: EN 'opens in a new tab', EL 'ανοίγει σε νέα καρτέλα'. Group headings: EN 'Contact details' / 'Follow us'; EL 'Στοιχεία επικοινωνίας' / 'Ακολουθήστε μας'. Existing configured languages beyond EL follow the existing English UI-label fallback.

New component geometry defaults live in foundations.css: --contact-icon-size:1.125rem, --social-icon-size:1.25rem, --contact-link-gap:.625rem, --social-link-gap:.5rem, --contact-link-target:44px, --contact-aside-width:22rem. Colors/focus/radius use current semantic theme tokens; no platform brand colors, AXIA-specific styling or generated CSS edits. Link wrapping, keyboard focus and contrast must remain clear. No new motion is added.

## CMS and validation

Settings gains a Social channels group containing the three labeled URL fields, international WhatsApp number with example +302101234567, and Show social icons in header boolean. The WhatsApp example is helper text, never a populated real destination. Contact fields gain clear formatting guidance. Shared data is outside translations and visible for every functional profile.

Use the shared social schema at read/build and existing detached native-save validation boundaries. Keep original rich-text ASTs and unrelated native values untouched. Invalid saves fail before persistence with a field path; valid select/edit/clear persists through Tina's actual installed serializer. Native empty fields must not leave GraphQL errors or ghost links after a subsequent save.


