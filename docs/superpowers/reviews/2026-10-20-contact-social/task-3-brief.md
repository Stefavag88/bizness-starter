### Task 3: Shared static components and placements

**Files:** Create three UI components and the icon registry/declaration listed above, tests in apps/site/tests/contact-social.test.ts and docs/THIRD_PARTY_NOTICES.md. Modify Layout.astro, ContactForm.astro, foundations.css and scoped global.css.

**Consumes:** Task1 ContactChannels/contactChannels. ContactDetails props {channels:ContactChannels;locale:string}; SocialLinks props {links:ContactLink[];locale:string;variant:'labeled'|'icons'}; ContactIcon props {name:ContactLink['id']|'address'}. No global content lookup inside these components.

**Produces:** Common data/rendering behavior in all placements, vendored static icons and semantic styles.

- [ ] Write actual Astro-container tests: exact email/tel/WhatsApp/social href and target/rel; escaped phone/address; decorative SVG attributes; icon-only links have platform/new-tab accessible text. Empty social arrays produce no social nav/heading. With showInHeader=false Contact/footer links remain but header has none; true shows only configured icons.
- [ ] Preserve footer identity/legal/privacy and required form fields/action/script. Test icon-only header vs labeled Contact/footer, both locales, empty address and unsupported phoneText. Ensure no raw URL or CMS SVG reaches set:html and no remote icon/script request is introduced.
- [ ] Run pnpm exec vitest run --config apps/site/vitest.config.ts apps/site/tests/contact-social.test.ts; retain RED. Vendor the seven SVGs from a verified pinned upstream commit, strip unrelated SVG attributes, retain source/license metadata and create allowlisted components. Do not install an icon package.
- [ ] Integrate form-first responsive aside at56rem; footer groups and optional header nav; use exact token defaults and current semantic colors. Add no extra hero/eyebrow or decorative animation. Rerun focused GREEN and the existing site component suite. Commit and obtain independent review.

