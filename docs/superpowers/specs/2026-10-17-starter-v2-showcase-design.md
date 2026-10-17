# Business Starter v2 — Design-system showcase

Date: 2026-10-17. Status: Written design approved by the user on 2026-10-17; implementation plan approved for execution on 2026-10-17. Composition A remains accepted at runtime commit d411bcad, with handoff records at d879c91.

## Purpose and delivery boundary

The user approved the sequence: showcase, Composition B, Composition C, stage 3, then business presets and fresh-project initialization. This document covers only the first increment. It restores the practical ability to compare presentation choices before expanding the section library.

The original starter has a development-only /design-system page with theme/density controls. The new starter currently has one neutral theme and a sample business named Example Studio. That content is intentional seed data, not a selected industry preset. The showcase must not replace the homepage, change the seed identity or imply that business presets already exist.

## Selected approach and alternatives

Build a development-only showcase from the v2 components, section renderers and theme JSON contracts. Restore Neutral, Trades, Accommodation and Wellness as presentation themes. Use the old starter only as a read-only source of palette/spacing/layout reference; author conforming v2 theme records and preserve its existing self-hosted Noto Sans coverage for Greek and Latin. Do not copy unavailable font stacks or install new fonts.

A separate mock component gallery would drift from real output. A full preset selector would prematurely combine presentation with content initialization and belongs to stage 4. An iframe editor or new page-builder application is unnecessary. The selected route exercises the existing design system directly and changes no CMS content contract.

## Route and presentation

Expose /design-system only when project.environment is local. Use a fixed developer-facing shell titled Business Starter v2, visibly marked Preview only. Keep it outside the business header/footer navigation, locale alternatives, feed, canonical content manifest and sitemap. The route is already reserved against content slugs. Generate no showcase output in staging/production builds, and include noindex/nofollow metadata locally.

Provide a compact responsive toolbar with labelled theme, density and sample-language controls, a reset action and a link back to the configured-language homepage. The toolbar remains usable at 375px without horizontal scrolling. Sections have anchor navigation: foundations, controls, cards, and section examples. Keep one visible H1 and unique IDs across every sample.

Show semantic color roles and their actual token names/values, typography hierarchy and rich emphasis, radius/spacing values, links, enabled/disabled buttons, labelled fields including error/help states, cards and the existing six section types. Render actual shared Button, Field, Card, RichText and registered section components rather than visual copies. Samples are honest, deterministic, isolated presentation fixtures, not new canonical Pages or editorials. Demo inputs never submit API requests; disabled state and error demonstrations are clearly labelled. Example links use valid localized destinations.

FAQ, process steps, gallery, image/text layouts and additional variants are not silently invented here. They are added to the showcase when Composition B supplies their production renderers. Display only token behavior that is actually implemented; unsupported layout metadata must not be advertised as a working variant.

## Preview state and configuration ownership

Use allowlisted query parameters theme, density and lang, for example /design-system?theme=trades&density=comfortable&lang=el. Supported themes come from the generated browser-safe theme registry. Densities are compact, comfortable and spacious. Sample languages are configured languages supported by the fixtures, initially English and Greek.

On initial load and browser Back/Forward, resolve state against those allowlists. Invalid or absent values fall back to project design defaults and its default language. Changing controls updates the URL and preview attributes, not project.json, theme JSON or canonical content. Preserve unrelated URL parameters and the section anchor. Reset restores configured defaults and removes the preview keys. Do not use localStorage, cookies, service workers or API writes. Explain that a permanent theme/density change belongs in project.json.

Keep preview scripts and styles external/bundled, compatible with the existing self-only public Content Security Policy. Never generate style/script strings from query input. Render meaningful configured-default examples without JavaScript; controls requiring JavaScript are disabled until initialized, with a short noscript explanation. Client initialization applies a bookmarked preview without claiming server rendering of static query strings.

Language selection changes visible sample copy and document language together. Hidden samples are excluded from the accessibility tree and cannot retain focused controls when switching. Match the existing font sizes across English/Greek and keep the self-hosted font contract. No machine-generated locale fallback enters public content.

## Themes and density

Add Trades, Accommodation and Wellness as validated v2 theme JSON alongside Neutral. Keep Neutral and the configured current theme unchanged. Reuse semantic mappings, existing feedback colors and the actual theme validator. Palette changes must pass its current contrast requirements; do not lower thresholds to import a reference palette. Radius and section spacing remain theme-configurable.

Make density behavior explicit through shared responsive section-spacing tokens: compact 0.75, comfortable 1, spacious 1.25 times the theme section spacing, using mobileSectionSpace at the existing mobile breakpoint. The theme validator already accepts these three densities, but the current project parser accepts only comfortable and compact. Add spacious to that enum and make all three values functional; this is an additive configuration adjustment, not a persisted content-schema change. Preserve component-specific layout rules and verify default Comfortable public output remains unchanged. The preview reuses the same shared rules; do not maintain a second density implementation in showcase CSS.

No theme implies a business content preset. No new Tina collection, persisted field or schemaVersion change is needed. Generated theme CSS/registry files remain generated by configure, never hand-edited.

## Boundaries, validation and acceptance

Keep server-only configuration/content adapters out of the browser bundle. Use a small browser-safe preview-state resolver and controller, a focused showcase fixture/view, scoped showcase styles and existing shared renderers. Only extend public layout interfaces if a concrete shared requirement warrants it; do not change the business navigation to expose a development tool.

Test state allowlisting, reset, unrelated query/hash retention and Back/Forward; validate all four themes. Browser-check theme changes using computed semantic colors and density spacing, reloadable URLs, configured defaults, English/Greek copy/lang, keyboard focus, one visible H1, unique IDs, valid links and no overflow at 375/768/1440. Assert no writes/requests to contact/newsletter/native mutation endpoints, no storage persistence and no content/config byte changes. Supplement representative screenshots and axe scans without claiming accessibility certification.

Verify local route availability and showcase absence from a production build using an owned temporary configuration fixture with exact guarded restoration. Never change source repositories. Run appropriate focused tests, strict check and static build; native save/profile suites need not be repeated because no CMS/backend contract changes. A final independent review checks the whole increment before handoff.

The current locally running stack is owned by launcher session 50604, observed children content4332/Tina19888/Worker18912/site34452. Revalidate ownership before stopping/restarting it. Stop only this launcher tree before configure/build operations that conflict with native watchers. Preserve environment port overrides; do not kill unrelated listeners. Neither reference repository may receive builds, installs, writes or process stops.

## Deferred roadmap and self-review

Composition B adds the larger section library; Composition C proves collection/route extensions and optional Rooms. Stage 3 owns media derivatives, social/motion/visitor modules and hosted verification. Stage 4 owns business presets and safe initialization. No sending, deployment, provisioning, migration CLI, merge, push or tag is included here.

Self-review: preview and persistent configuration have distinct owners; routes remain isolated from business content; all advertised controls have defined behavior; unsupported sections/variants remain deferred; Greek fonts, responsive density, query allowlists, CSP and production exclusion have explicit acceptance. No new dependencies or legacy content reader are required.
