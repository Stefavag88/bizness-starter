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

