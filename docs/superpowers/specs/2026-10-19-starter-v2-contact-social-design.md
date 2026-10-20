# Stage 3B — Shared contact and social channels

Date: 2026-10-19. Status: Implemented and independently accepted on 2026-10-20: all four tasks, whole-branch review and final documentation scoped review complete. Verified archive/scratch cleanup and local site/CMS restoration are complete and recorded in the plan/review archive. Base: accepted media closeout 3519bcd. Repository: C:/Projects/bizness-starter-v2. Branch: codex/starter-v2-contact-social.

## Intent and success

Provide reusable, CMS-owned contact/social information for future services, trades, accommodation and studio websites. Preserve the neutral design, canonical ownership, EN/EL consistency and static architecture. One change in Settings must reach Contact and the footer, and optionally the header after local regeneration or a hosted rebuild. Empty optional channels must leave no dead links, icons, headings or gaps. Preserve access to the Contact form, which remains primary and cannot be hidden.

The user approved preparing the Stage 3B spec and implementation plan, using the existing subagent method with independent review. The subsequently approved implementation now has [local acceptance evidence](../plans/2026-10-20-starter-v2-contact-social-evidence.md); independent final reviews are accepted, with completed local archive/runtime closeout recorded separately; no production delivery is claimed. All Markdown is English.

## Alternatives and selected approach

1. **Fixed typed fields plus a shared pure projection — selected.** Three social URLs and one WhatsApp number have clear validation, labels, icons and predictable CMS forms. A new platform later extends one explicit registry/contract and its tests.
2. A free-form channel list supports arbitrary platforms immediately, but introduces editor-managed types, ordering, labels and icon selection without a present requirement.
3. Separate markup in every placement is initially smaller, but duplicates destination safety, accessible labels and rendering behavior.

Use option 1. Do not add a runtime plugin system, social SDK, icon npm dependency, analytics or embedded feeds.

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

## Verification and ownership

Four implementation/review units: pure contract/projection; CMS authoring; shared components/integration; actual native/static/browser acceptance and docs. Use fresh medium implementers and independent medium reviewers, then most-capable medium whole-branch review and one batched final fix wave if needed. Preserve the chosen method; do not spawn implementation while written artifacts await review.

Capture exact source/reference HEADs and canonical project/content/uploads snapshot. Before configure/check/build/CMS/full tests, verify and stop only the currently owned launcher tree using recorded PID, creation time and paths; do not kill by port/name. Pure temporary-root tests may run separately. Reuse existing owned cleanup/evidence primitives, not broad restoration or a new generic framework. Native saves admit only settings/site.json update operations before dispatch and derive complete expected bytes from the actual request/schema/installed serializer. Preserve unknown editor changes; independent cleanup still runs and regeneration is refused after unsafe restoration.

Cover old settings with no social object, all native clear shapes, invalid URLs/numbers/booleans, locale projection, per-placement visibility, exact link attributes and safe escaping. Actual browser checks EN/EL at 375/768/1440, keyboard focus, no overflow, no-JS rendering and representative axe. Do not click external links, open email clients or dial during automation; inspect exact destinations instead. Native UI proof sets all new fields, clears one, toggles header display, saves again, verifies public freshness and restores exact owned bytes.

Sequential checkout gates: pnpm check, pnpm test, pnpm build, pnpm worker:check, pnpm cms:local-build, pnpm test:static-routing and pnpm test:showcase-builds. Keep failed runs and explicit command exits. Required native proof is separate from any opt-in general-suite skip. Restore the original local stack after acceptance. No hosted setup, sending, deployment, merge, push, tag, legal certification or source-repository writes.

## Non-goals and self-review

Newsletter modal, cookies, visitor storage, motion, reservations/payments/accounts, presets/initializer, production forms and provider setup remain separate work. No Worker endpoint or database change is needed for static contact destinations.

Self-review: one owner per field; root social retained explicitly in both locale projections; missing/default/native-null behavior defined; phone compatibility and app-launch limits stated; all placement/empty states defined; icon provenance and token owners specified; acceptance does not trigger external actions; no placeholders or product implementation claims.
