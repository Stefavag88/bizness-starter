# Stage 3B Contact and Social Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author shared contact/social destinations once in Tina and render them consistently in Contact, footer and an optional header group.

**Architecture:** A strict optional settings object defaults on detached parsing. One browser-safe projection produces safe link data; small static Astro components render three placements. Existing native save validation and source/process ownership stay authoritative.

**Tech Stack:** Existing Astro 7.3.6, TinaCMS, Zod, TypeScript, Vitest, Playwright and Cloudflare static assets. Vendored licensed SVG subset; no dependency upgrade or runtime icon library.

**Spec:** [Contact/social design](../specs/2026-10-19-starter-v2-contact-social-design.md).

Status: Proposed implementation plan for written review. Product implementation has not started. This plan preserves the previously selected medium subagent implementation/task-review method and most-capable medium final review.

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

## Review Focus

1. Old settings omit social, and a nondefault localization reconstructs Settings: both locales must retain identical shared destinations (Task1).
2. Tina clears nested optional fields to null/omitted or leaves a null parent: saves must succeed and removed channels disappear on subsequent render (Tasks1/2/4).
3. Attacker-like URL values exploit host suffixes, credentials, encoded controls or query/fragment injection in email: reject unsafe social values and encode direct email destinations (Task1).
4. Header enabled with no channels or long contact values at375px: no empty regions, duplicate accessible names, reduced targets or overflow (Task3/4).
5. Native save targets an unowned record, or shutdown/restoration fails: reject before dispatch, preserve foreign bytes and still run independent cleanup; never regenerate unsafe state (Task4).

## File and interface map

- packages/content/contact.mjs + contact.d.mts: pure schema, fixed channel registry and destination projection; schemas.mjs/types.ts/localize.mjs wire normalized settings.
- tina/fields/contact.ts: reusable labeled contact/social field groups; tina/collections/settings.ts consumes them. Existing tina/validation.ts/document codecs remain the save boundary, amended only if needed for detached new fields.
- apps/site/src/components/ui/ContactIcon.astro, ContactDetails.astro, SocialLinks.astro: explicit-prop static rendering. packages/design-system/contact-icons.mjs + contact-icons.d.mts: pinned allowlisted SVG path data, no raw CMS markup. docs/THIRD_PARTY_NOTICES.md records source commit/files/checksums and retained license.
- apps/site/src/templates/ContactForm.astro and layouts/Layout.astro: placement integration. styles/foundations.css owns new geometry tokens; global.css owns only scoped component/layout styles.
- tests/contact-channels.test.ts, tests/cms-contact-social.test.ts, apps/site/tests/contact-social.test.ts: contract/native validation/component tests.
- e2e/contact-social.spec.ts, e2e/contact-social-cms.spec.ts, e2e/helpers/contact-social-native-admission.ts, tests/contact-social-native-admission.test.ts: public/native proof and exact pre-dispatch admission.
- scripts/verify-contact-social.mjs: narrow stopped-stack acceptance driver; package.json exposes test:contact-social. Reuse current ports, runtime, cleanup and evidence primitives rather than duplicating generic infrastructure.
- docs/CONTACT_SOCIAL.md plus updates to CONTENT_MODEL.md, ARCHITECTURE.md, QUICKSTART.md; acceptance evidence in docs/superpowers/plans/2026-10-19-starter-v2-contact-social-evidence.md.

### Task 1: Pure settings and destination contracts

**Files:** Create packages/content/contact.mjs, contact.d.mts, tests/contact-channels.test.ts. Modify schemas.mjs, types.ts and localize.mjs; update declarations/barrel only when consumed through that public API.

**Consumes:** Existing isSafeLink(value), settingsSchema, SettingsCopy, localizeContent and tests/fixtures/content/factory.ts helpers.

**Produces:** SocialSettings, ContactLink and ContactChannels exactly as specified; SOCIAL_CHANNELS; socialSettingsSchema; phoneHref(value:string):string|undefined; contactChannels(settings:SettingsCopy,locale:string):ContactChannels. SettingsCopy.social is normalized and required in parsed output.

- [ ] Write table-driven tests: absent/null parent and fields => all empty/false; actual boolean accepted, 'false' rejected; unknown keys and translated social rejected. Existing settingsDocument parses without rewriting input; both EN/EL localized settings retain equal social values and remain detached.
- [ ] Test projection assertions, including:

```ts
expect(phoneHref('+30 (210) 123-4567')).toBe('tel:+302101234567');
expect(phoneHref('Reception ext 2')).toBeUndefined();
expect(contactChannels(settings,'el').social.map(x=>x.id))
  .toEqual(['instagram','linkedin','facebook','whatsapp']);
```

Supply settings with all four valid channels; assert WhatsApp href https://wa.me/302101234567 and external=true. Direct email label remains original while href uses encodeURIComponent(mailbox). Blank phone produces neither phone link nor phoneText; unsupported phone stays in phoneText.
- [ ] Cover URL boundaries: valid provider base/www/country subdomain and path/query/fragment; reject provider.com.evil.test, evilprovider.com, HTTP, protocol-relative, userinfo, port8443, javascript:, encoded controls/backslashes and wrong-platform URLs. WhatsApp rejects local number, URL, spaces, leading zero country code and over15 digits. A mailbox with literal ?/# cannot introduce href parameters.
- [ ] Run pnpm exec vitest run tests/contact-channels.test.ts and retain meaningful RED; implement strict pure contracts and locale wiring; rerun GREEN plus tests/content-schema.test.ts and tests/content-documents.test.ts. No production singleton or filesystem import enters the pure module. Commit verified candidate; independent task review records acceptance afterward.

### Task 2: Native Settings authoring

**Files:** Create tina/fields/contact.ts, tests/cms-contact-social.test.ts. Modify tina/collections/settings.ts; amend tina/validation.ts only if shared projection needs explicit wiring.

**Consumes:** Task1 socialSettingsSchema and normalized settings contract; existing text/object field factories and installed native-save validation.

**Produces:** contactFields() and socialFields(), each returning TinaField[]. Settings exposes one shared Social channels group and the existing translated address only; no translated social URLs/toggle.

- [ ] Write failing schema/validation tests: labeled Instagram/LinkedIn/Facebook URL inputs, WhatsApp international-number helper and Show social icons in header boolean exist once; EN/EL translations contain no shared destinations. Every functional profile exposes these fields.
- [ ] Validate native rich AST objects on unrelated legal.notice remain identical after detached save checks. Verify actual-shaped null clears/parent-null/defaults and invalid social save field paths through the existing validation entry, not a newly fabricated bypass. Invalid booleans and destinations must fail before persistence.
- [ ] Run pnpm exec vitest run tests/cms-contact-social.test.ts; capture RED, implement field factories/shared validation, run GREEN plus tests/cms-save.test.ts and tests/cms-schema.test.ts. Regenerate only with the owned stack stopped. Commit and obtain independent review.

### Task 3: Shared static components and placements

**Files:** Create three UI components and the icon registry/declaration listed above, tests in apps/site/tests/contact-social.test.ts and docs/THIRD_PARTY_NOTICES.md. Modify Layout.astro, ContactForm.astro, foundations.css and scoped global.css.

**Consumes:** Task1 ContactChannels/contactChannels. ContactDetails props {channels:ContactChannels;locale:string}; SocialLinks props {links:ContactLink[];locale:string;variant:'labeled'|'icons'}; ContactIcon props {name:ContactLink['id']|'address'}. No global content lookup inside these components.

**Produces:** Common data/rendering behavior in all placements, vendored static icons and semantic styles.

- [ ] Write actual Astro-container tests: exact email/tel/WhatsApp/social href and target/rel; escaped phone/address; decorative SVG attributes; icon-only links have platform/new-tab accessible text. Empty social arrays produce no social nav/heading. With showInHeader=false Contact/footer links remain but header has none; true shows only configured icons.
- [ ] Preserve footer identity/legal/privacy and required form fields/action/script. Test icon-only header vs labeled Contact/footer, both locales, empty address and unsupported phoneText. Ensure no raw URL or CMS SVG reaches set:html and no remote icon/script request is introduced.
- [ ] Run pnpm exec vitest run --config apps/site/vitest.config.ts apps/site/tests/contact-social.test.ts; retain RED. Vendor the seven SVGs from a verified pinned upstream commit, strip unrelated SVG attributes, retain source/license metadata and create allowlisted components. Do not install an icon package.
- [ ] Integrate form-first responsive aside at56rem; footer groups and optional header nav; use exact token defaults and current semantic colors. Add no extra hero/eyebrow or decorative animation. Rerun focused GREEN and the existing site component suite. Commit and obtain independent review.

### Task 4: Actual native/static acceptance and handoff

**Files:** Create the public/native specs, narrow admission helper/test, driver and evidence/runtime guide listed above. Modify package.json script entry and existing ownership/quickstart docs; no production schema/endpoint expansion.

**Consumes:** All prior task interfaces. Existing createCmsSources(paths,backupRoot,options), createCmsEvidence(directory), native document-path/installed-serializer helpers, exact owned runtime shutdown and cleanup primitives. Do not use preexisting media acceptance claims as evidence for these new fields.

**Produces:** assertContactSettingsMutation(body:unknown,sourcePath:string):void for exactly one update/settings/site.json; test:contact-social driver with --public and --native modes, explicit logs/snapshots/exits and safe source/runtime cleanup.

- [ ] Before canonical edits, fault-test wrong target, collection, create/delete/multiple mutation refusal with zero dispatch; restoration conflict preserves foreign bytes; failed child shutdown prevents regeneration while independent restoration is attempted. Keep tests temporary-root owned; retain deliberate failure evidence. Run pnpm exec vitest run tests/contact-social-native-admission.test.ts RED/GREEN before live writes.
- [ ] Native UI: open actual Settings, set all four channels/toggle, perform a real save, clear one URL and WhatsApp, save again, turn header off, save again. Before every dispatch derive complete expected bytes from installed request/schema/serializer and admit only owned target. Assert source bytes, untouched translations/legal ASTs, public EN/EL updates and cleared-link absence. Restore only exact owned source bytes; no direct mutation API standing in for UI proof.
- [ ] Public static proof: temporary exact-owned settings fixtures for no socials/headeroff, all socials/headeroff, all socials/headeron, one remaining social, long contact/address and unsupported phone. Build and serve via existing static Worker harness; inspect EN/EL375/768/1440, JS/noJS, all three placements, 44px targets, keyboard focus, no overflow, exact href/rel/new-tab labeling and representative axe. Intercept external navigation; do not contact platforms, dial or invoke mail clients. Record screenshots and no added browser/runtime transformation dependency.
- [ ] Driver exposes pnpm test:contact-social -- --public and --native, each with stopped-stack checks and independent cleanup. Native mode owns its Tina/Astro tree and may not start the main launcher/migrate source D1. Restore canonical output after successful restoration; refuse after conflict. Retain every command executable/args/cwd/PID/start/end/exit, complete source inventory/hashes and owned-process stop proof.
- [ ] Run public/native phases sequentially, then seven gates: pnpm check, pnpm test, pnpm build, pnpm worker:check, pnpm cms:local-build, pnpm test:static-routing, pnpm test:showcase-builds. Each must have explicit exit0; retain failures/repairs/source timing honestly. Do not broadly rerun unchanged gates after documentation-only edits.
- [ ] Document CMS paths, defaults, tokens, per-placement behavior, optional clears, phone/URL restrictions, locale ownership, app-launch limits and hosted rebuild requirement. Update original spec status only after evidence. Commit verified candidate and obtain independent task review.
- [ ] Obtain most-capable medium whole-branch review; one batched fix wave and one scoped re-review if needed, adjudicating residuals explicitly. Archive complete raw reports/rulings before verified scratch removal. Restore original local site/CMS, verify actual public/CMS/Tina read-only readiness, and preserve this local branch. No remote operations.

## Plan self-review

Coverage: Task1 owns all data/default/safety/localization requirements; Task2 owns editor exposure/detached validation; Task3 owns rendering/icons/tokens/form order; Task4 owns native persistence, actual public behavior, process/source faults, final gates and documentation. Every Review Focus input class has a named owning test. Contracts use the same normalized SocialSettings, ContactLink/Channels and component props throughout. Existing settings remain valid with no data migration. No product dependency upgrade, secret, outbound action or unrelated stage is required. Written artifact review precedes implementation; the preserved execution method is subagent-driven at medium with independent gates.
