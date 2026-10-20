# Design-system showcase

Open `/design-system` on the local site. The developer shell says Preview only and remains outside business navigation, localized alternatives, feeds and the content manifest. Staging and production builds emit no showcase route or dedicated preview script/style assets. The local-only Astro integration registers an entry outside src/pages before client-graph discovery. This is presentation reference for Business Starter v2; Example Studio remains intentional seed content.

The toolbar compares Neutral, Trades, Accommodation and Wellness, three densities and configured English/Greek samples. All use existing self-hosted Noto Sans. All ten section renderers (fourteen type/variant pairs), Button, Field, Card and RichText are real shared components with deterministic detached fixtures. Article examples link to valid Contact destinations even with articles disabled. Demo fields never submit. No unsupported section variant is promised.

A bookmark such as `/design-system?theme=trades&density=spacious&lang=el#showcase-sections` applies after JavaScript initializes. Invalid or absent preview values resolve to configured defaults. Back/Forward and reload restore the selected preview. Reset removes only theme/density/lang; unrelated parameters and the anchor stay intact. There is no storage, cookie or API persistence. Business pages ignore these preview parameters.

For permanent configuration, edit `project.json` design.theme/design.density and run `pnpm configure`. Edit source theme JSON for semantic tokens; generated CSS and the browser registry are outputs. Density multiplies shared section spacing by compact 0.75, comfortable 1 or spacious 1.25, using mobileSectionSpace at widths up to 640px. Existing Hero/editorial/page-title rules retain their component spacing. Comfortable preserves previous public spacing.

Sample language choices are the intersection of configured languages with English and Greek. Language changes update document language and visible sample groups together, recovering focus before hiding a focused group. No unsupported public language fallback is added. Without JavaScript, meaningful configured-default samples remain readable and preview selectors stay disabled.

## Verification

Stop the owned dev launcher before isolated builds:

```powershell
pnpm test:showcase-builds
pnpm check
pnpm test
pnpm worker:check
# Serve the final local dist through an owned local Worker with generated _headers.
$env:E2E_BASE_URL='http://127.0.0.1:8790'
pnpm exec playwright test e2e/design-system.spec.ts
```

The build verifier creates a separate guarded edit from exact original bytes for staging and production, changes only environment, runs configure/Astro build and checks actual HTML and dedicated JS/CSS absence plus manifest/navigation/feed isolation. Per-stage asset inventories retain paths, sizes, SHA-256 hashes and showcase fingerprints, including shared fonts, CMS assets and original PNG uploads. Detection uses dedicated compiled DOM selectors and preview entry names; the CMS validator may legitimately contain the reserved design-system path. It restores in finally and builds local last. Commands use 120000ms timeouts; SHOWCASE_BUILD_TIMEOUT_MS overrides this. Only the command's owned process tree is stopped on timeout. Original bytes, command PIDs/output and hashes are retained in unique `.generated/showcase-builds` directories. External edits or deletions remain preserved and block regeneration. Comparisons are best effort, not an atomic filesystem lock. The verifier deletes no files or backup directories itself; Astro owns its dist cleanup.

The browser suite exercises actual asset CSP, computed semantic palettes and spacing, 375/768/1440 layouts, EN/EL, focus, history, valid links and no-JS defaults. It monitors runtime/CSP errors, external fonts and mutation requests; compares canonical project/content/theme hashes and browser storage. Representative screenshots and axe scans supplement acceptance, without accessibility certification. See [acceptance evidence](superpowers/plans/2026-10-17-starter-v2-showcase-evidence.md).

Composition B includes FAQ default/expanded, steps default/cards, media-text default/reversed and gallery default/featured. Composition C, stage 3 optimized media/social/motion/visitor work and stage 4 presets/initialization remain deferred. No sending, deployment, merge, push or tagging is included.


## Original images and Composition B samples

Each EN/EL sample group includes the existing six examples plus all eight new pairs through sectionRenderer(type, variant), with unique locale/instance/control IDs. FAQ disclosures are native details/summary and work by keyboard without JavaScript; expanded FAQ is ordinary readable text. Media and gallery use the actual server metadata adapter and SectionImage, including intrinsic dimensions and fixed crops. Preview choices remain detached from canonical Home/brand.

The two [original abstract sample PNGs](STARTER_SAMPLE_ASSETS.md) are normal reusable native-picker assets under public/uploads/starter-samples. They intentionally remain available in staging/production alongside ordinary shared business assets. They are not the dedicated showcase JS/CSS, which must remain absent from those builds. The real build inventory verifier still rejects dedicated preview entries/selectors; no production post-build deletion or CSP relaxation is used.

Composition B's separate public fixture matrix covers all eight variants in EN/EL at 375/768/1440 and representative four-theme/three-density combinations without an unbounded cross-product. Representative axe scans and manually inspected screenshots are evidence, not an accessibility certification. Historical showcase acceptance remains unchanged; see [new evidence](superpowers/plans/2026-10-18-starter-v2-composition-b-evidence.md).

## Composition C renderer boundary

Rooms render through the static server domain registry and reuse shared card, prose and original-image components. These imports must not pull the dedicated showcase layout, controller or styles into public staging/production assets. `pnpm test:composition-c` owns bilingual public fixtures and five representative build/CMS/Worker modes. `pnpm test:showcase-builds` checks actual staging/production inventories after these imports; every internal configure/build command now also checks complete canonical project/content/uploads snapshots and free project ports, and source conflicts block final regeneration even after an independent project restore succeeds.

## Shared motion

See [MOTION](MOTION.md) for opt-in project settings, generated tokens, renderer markers, reduced-motion/no-JavaScript fallback and the transient local showcase control. The local example enables motion; omitted settings stay disabled.
