# Custom CMS field presentation

Custom Tina controls share presentation in `tina/fields/controls.ts`. This applies to navigation, composition, section copy/items/media, page identity and Rooms controls.

The presentation helper styles only HTML elements explicitly created by these custom controls. Tina components pass through unchanged, including native rich-text and image editors. Inline styles survive the admin application's CSS reset without a Tailwind build dependency or a browser-only stylesheet import in the schema. These admin styles are separate from public website theme tokens.

Navigation links appear in individual cards, with vertically stacked localized labels and wrapping move/remove actions. Adding a link has its own fieldset. Controls use full available width, bounded sizing, native keyboard outlines, readable disabled states and distinct error text. Section and item cards use the same spacing and borders.

This layer does not change form subscriptions, field names, callbacks, validation, save serialization, translation membership or persisted content. Keep presentation changes here; keep structural operations in the existing content helpers. Do not apply global element selectors to native Tina controls.
