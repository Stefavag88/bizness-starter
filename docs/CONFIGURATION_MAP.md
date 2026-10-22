# Prompt-to-configuration map

Run pnpm site:inspect from this app to discover its validated current profile/modules, active theme file, Page/section IDs, enabled states, surfaces, variants and scripts. This command is read-only and does not need generated output. It refuses invalid canonical content instead of guessing or rewriting it. Use current schemas and consumers as the authority; the map below explains ownership, not an additional configuration API.

| Request | Canonical owner | Follow-up |
| --- | --- | --- |
| Business name, contact phone/email, social links | content/settings/site.json: brand/contact/social | Shared public renderers derive links; inspect explicit prose/tel duplicates for everywhere claims. Shared destinations are not translated. |
| Page heading, body, section copy | content/pages/FILE.json: copy.sections and locale translations | Persisted copy is a typed list keyed by stable IDs; preserve original rich ASTs in native forms. |
| Hide, reorder, recolour one section | That Page's shared sections reference by ID: enabled/appearance.surface; reorder the sections array while preserving IDs | Choices are default/muted/accent; inspect actual theme values before interpreting brightness. Do not delete editorial records to hide a section. |
| Global colours and reusable presentation | packages/design-system/themes/THEME.json and semantic consumers | Use active theme source, not generated CSS. A scoped surface choice should precede a broad palette change. |
| Navigation destination/order/label | Settings navigation and localized labels | Select saved Page IDs, not arbitrary URLs. Keep translations, existing labels and shared membership consistent. |
| Service/team/article text | content/offerings, content/people, content/articles | Descriptions use safe inline Markdown; bodies permit supported H2/H3/list/quote rich text. Preserve slugs/relationships/publication. |
| Background/gallery/media | Registered shared section media and localized alt/caption | Original local PNG/JPEG/WebP in apps/site/public/uploads, using existing validators and responsive optimization. Unsupported backgrounds need a typed shared extension. |
| Newsletter modal/footer copy and policy | Settings newsletterPrompt and translations | Inspect project prerequisites first; keep existing modal policy unless requested otherwise. |
| Feature/profile/languages/motion | project.json | Developer-owned structural change; stop owned launcher, configure, verify, restart. |
| Hosted accounts/resources/roles/protection | Strict non-secret production target and separately configured secret bindings | Follow deployment/release/readiness guides; never put tokens in project.json or CMS. |

## Newsletter prerequisites

Signup requires newsletter/nurture profile, modules.newsletterPrompt, a valid project.interests entry selected by newsletterPrompt.interestId, enabled policy and published Privacy routes. Footer modes are off, open-modal and inline. Inline needs localized footerPrompt plus email/submit/consent/privacy/success copy. Modal requirements are separate; adding inline signup does not remove an existing modal. Delay/dismiss/accepted settings remain shared policy. Optional browser preferences use modules.visitorPreferences. Protection mode, capture vs real delivery and operator readiness are distinct from these presentation controls. Keep sending/marketing disabled until separately qualified and authorized.

## Extending safely

If no existing setting expresses the outcome, trace packages/config/project.mjs, packages/content/section-registry.mjs, schemas/document codecs, Tina fields/collections and apps/site/src/templates before changing their shared contract. Expose a deliberate registered variant/typed field and update all consumers together. Do not infer support from arbitrary legacy JSON keys. Current surfaces do not accept raw classes/hex colours. Stable section IDs do not become generated field names. Preserve required capabilities and independently published EN/EL content; no fallback silently publishes missing translations.

## Checks and lifecycle

Use package.json for available commands. Routine content/presentation work needs relevant validation, rendering and browser checks; structural/CMS/runtime changes need focused regression plus check/test/build and worker:check as applicable. Read-only inspection does not regenerate output. Full suites and configuration changes require stopping the exact owned launcher; no process-name killing. Run installs/heavy isolated builds and full suites sequentially when resources are constrained. Native CMS saves use the installed schema/serializer boundary and exact ownership; preserve unknown bytes after conflicts. Independent client updates are reviewed patches, never an automatic source overwrite.

## Runtime input inventories

scripts/deployment/release-files.json is a hand-maintained source list, not a generated manifest. New components, scripts, fonts and other runtime files outside automatically collected content, uploads and theme directories must be listed there so frozen release builds include them. Independent clients own only that list. When changing the source starter, also maintain scripts/initialize/export-manifest.json for future clients; that source-only inventory is deliberately absent from generated apps. site:inspect reports both actual inventory paths, with initializer null in clients. Keep the source lists synchronized where both exist. Do not confuse them with generated .generated/manifest.json or native CMS outputs.

Use normal prompts to describe the intended outcome; the maintenance skill should find the owner, verify its actual settings, make the smallest shared change and report evidence. Instructions improve consistency, but schema validation and tests remain necessary. Creation guidance is source-only; every generated app carries this map and its own maintenance skill/AGENTS.md.
