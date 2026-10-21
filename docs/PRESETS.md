# Business presets

The local source starter offers five reviewed compositions at `/templates`. This gallery is developer tooling: `.starter-tools.json`, local environment and the dedicated entry files must all be present before Astro registers its routes. Staging, production and initialized clients omit both the gallery routes and its dedicated browser assets.

| Preset | Starting composition | Suggested theme | Optional domain |
| --- | --- | --- | --- |
| neutral | Existing minimal neutral pages | neutral | None |
| professional-services | Services, process, people, insights, FAQ, contact CTA | neutral | None |
| trades | Services, service areas, process, FAQ, direct contact | trades | None |
| accommodation | Gallery, rooms, amenities/local information | accommodation | Rooms enabled |
| studio | Classes through Offerings, instructors through People, timetable information | wellness | None |

All themes can be selected independently. EN and EL are available in previews and initialization; a client can select either or both and its default language. Articles can be omitted by the programmatic bundle/verification API. The current public CLI keeps Articles enabled; there is no undocumented CLI flag. Bookings, payments and customer accounts are future integrations.

## Preview isolation

`/templates/PRESET/THEME/LOCALE` is Home; append a real seeded path for other pages. Theme choices live in the path, not persisted configuration. The actual Page, editorial, Rooms, Layout and section components receive an explicit RenderContext. Internal links and locale alternatives stay within the same preset/theme. External link semantics are preserved by the safe renderer; seeded business contact/social destinations are neutralized. Forms are representative disabled fields, visitor signup/preferences output is omitted, and previews expose no submission endpoint. Robots metadata is noindex and canonical/feed metadata is omitted.

The gallery displays a PowerShell-safe initializer command. Copying that command does not create files; only the terminal CLI does. Current authored `/en`, `/el`, root redirect, CMS and the separately documented design-system showcase retain their existing behavior.

## Extend a preset

1. Add reviewed metadata in `packages/presets/catalog.mjs` and a declarative seed module under `packages/presets/seeds/`. Avoid production customer copy or infrastructure.
2. Reuse registered section types and domains. A new capability needs the explicit configuration, contract, localization, CMS and renderer boundaries described in the architecture; do not inject component paths from content.
3. Supply complete EN/EL copy, stable IDs, intentional publication and safe placeholder identity/legal/contact information. Keep optional sample claims clearly illustrative.
4. Add the preset to the static preview/CLI validation and filesystem seed snapshot inventory. Keep catalog metadata browser safe. Preset bundles and media reads remain server side.
5. Expand bundle/language/theme/article tests and the independent-client rehearsal. Run `pnpm test:presets` with owned launchers stopped.

Reviewed abstract sample PNGs are ordinary reusable media, not property photographs or gallery-only fixtures. They remain in client/nonlocal output; dedicated `.preset-*` CSS and gallery copy-command JS do not. Required original media is checked through link-refusing source reads and compared against bundle bytes.

See [initialization](INITIALIZATION.md) for independent projects and [evidence](superpowers/plans/2026-10-21-starter-v2-presets-initialization-evidence.md) for actual verification and limits.
