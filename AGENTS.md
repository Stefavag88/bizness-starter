# Repository guidance

Use Node 22.x or 24.x and pnpm 10.13.1. Write project Markdown in English; keep public English/Greek strings localized. Read docs/QUICKSTART.md, docs/CONTENT_MODEL.md and docs/ARCHITECTURE.md before changing ownership boundaries.

Canonical content lives under content; settings own identity/contact/navigation, while Pages own page text and stable section instances. Translations supply copy by section ID and cannot independently change structure. Keep filesystem loaders out of browser/editor imports. Native validation must preserve the original editor AST and validate a detached projection.

Edit theme JSON and semantic component tokens, never generated CSS/registries, Tina output, manifests or generated Worker configuration. Use registered static section renderers and safe shared rich-text/link helpers. Protect required page regions and publication-derived locale alternatives.

Run focused regression tests for behavior changes, then pnpm check, pnpm test and appropriate build/browser checks. Native saves require the real UI and request/schema/installed-serializer-derived ownership; never restore unknown editor bytes. Stop the owned launcher before cms:local-build or test:profiles. Use configured ports and stop only processes created by your command. Do not install/build/save in either read-only source repository.

Composition A enables explicit Standard draft creation, optional section add/reorder/remove and localized navigation authoring. Preserve immutable saved identity, required regions, canonical scalar types and native typed-copy aliases. Read docs/COMPOSITION_AUTHORING.md. Composition B/C and stages 3/4, presets and destination initialization remain deferred. Sending, hosted providers, deployment and release tagging require separately authorized work.
