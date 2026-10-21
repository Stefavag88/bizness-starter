# Application authoring

Start `pnpm dev:cms` and open `/cms/index.html`. Local edit mode writes this application's canonical JSON files. Hosted Tina requires its own repository, project and authorized membership.

Settings owns business identity, contact channels and navigation. Add saved Pages explicitly, enter each language label, select Linked page, and reorder or remove links independently of Page publication.

Pages owns text and ordered section instances. Each instance has a stable ID, a registered type, a visibility toggle and a surface choice. Hero and required privacy regions stay enabled. The Contact form belongs to its template. Create Standard pages as drafts; publish only after entering the required metadata, hero and desired language copy. Saved IDs, slugs and templates are immutable.

Translations supply copy for the same shared structure. Missing optional translated copy hides that section in that language. Publish each language independently; links expose only available alternatives. Rich text uses Tina's visual editor and the shared safe renderer; arbitrary embedded HTML/scripts are not supported.

Offerings, People and optional Articles hold their own description/body content. Rooms appears only when its module is enabled and its localized index is published. Accommodation is informational; no reservations are included.

Themes and semantic tokens define styling; edit reviewed theme JSON/configuration rather than generated CSS. Uploaded media must be local validated originals. Replace illustrative images, contact details and legal copy before publication.

Sending is disabled in the generated local application. See [production readiness](PRODUCTION_READINESS.md) and [operations](OPERATIONS.md) before separately configuring a hosted service.
