# Starter v2 — Shared motion system design

Date: 2026-10-20
Status: Written design approved by the user on 2026-10-20; implementation plan awaits review.
Baseline: `c8be98c` on `codex/starter-v2-contact-social`.

## Intent and scope

Add reusable, adjustable public-site motion without changing page composition, typography, colours, content ownership or routing. This is Stage 3's motion slice, following responsive media and contact/social. The CMS styling checkpoint is already committed separately.

The approved direction is scroll fades with bounded stagger, consistent interaction transitions, configurable timing/intensity, reduced-motion support and readable content without JavaScript. Newsletter, visitor persistence, cookie controls, hosted integrations and deployment remain separate work.

## Approaches and decision

1. Native IntersectionObserver plus the Web Animations API for entrance effects, and semantic CSS tokens for interaction transitions. Recommended: small, dependency-free and compatible with the static Astro architecture. More lifecycle/failure handling must be maintained locally.
2. CSS-only entrance effects. Simple packaging, but a consistent viewport-triggered lifecycle, immediate focus revelation and robust unsupported-browser fallback would require additional mechanisms.
3. An animation library. Useful for complex timelines, but the current fade/translate requirements do not justify another runtime dependency.

Use approach 1. Register explicit presentation targets in existing renderers; do not traverse arbitrary rich-text HTML and animate every paragraph.

## Configuration ownership

Extend the existing strict `project.design` contract with an optional `motion` object. It is developer configuration, not editorial content and not a new functional profile or section template. Existing documents require no migration.

Proposed validated values:

| Setting | Default | Allowed values | Meaning |
| --- | --- | --- | --- |
| enabled | false | boolean | Enables entrance effects and decorative interaction movement |
| durationMs | 600 | integer, 100–1200 | Entrance duration |
| distancePx | 18 | integer, 0–48 | Vertical entrance translation |
| staggerMs | 70 | integer, 0–150 | Delay between siblings in an explicit group |
| interactionMs | 180 | integer, 0–400 | Shared interaction transition duration |

The local example will explicitly enable motion to demonstrate the delivered feature; missing configuration stays opt-in for other projects. Zero distance permits fades without translation. Stagger is capped at 300 ms total per group to avoid slow long lists. Easing is a developer-controlled semantic CSS token, not arbitrary editor-provided executable/style text.

`pnpm configure` remains the sole generator. It emits validated configuration into external generated CSS and the existing safe public configuration path as needed. No inline script/style attributes are required for configuration. Generated outputs are never manually edited. The Worker and CMS gain no new settings, routes or credentials.

Foundation tokens provide the shared vocabulary: entrance duration, distance, stagger, maximum group delay, interaction duration and entrance/interaction easing. Runtime values come from the configured tokens rather than duplicating numeric defaults in the controller. Reduced motion and disabled configuration override decorative movement consistently.

## Public rendering and behaviour

- Add explicit, reusable motion markers to section heading/copy groups and repeated cards/items in registered section renderers, including the Rooms renderer when enabled.
- Exclude the primary hero/H1 from entrance animation to preserve initial readability and avoid delaying the likely largest contentful paint. Do not animate entire section backgrounds or large media surfaces.
- Do not animate header navigation, footer legal content, contact fields, validation feedback, skip links or CMS controls.
- Each eligible target animates once per page load; scrolling back does not replay it. Only opacity and a small vertical translation animate. No parallax, scroll hijacking or continuously running effects.
- Default HTML and CSS leave every target visible. IntersectionObserver schedules an entrance animation on intersecting targets; there is no persistent hidden/pending state in CSS. A missing API, script failure or interrupted animation leaves content readable.
- The controller skips initially visible targets, targets containing focus, and the current fragment target or any animated ancestor of it. Direct anchor navigation remains immediate.
- On focus entering an animated target, fragment changes or a switch to reduced motion, cancel the relevant animations and immediately return to the final visible state. Dispose observers/listeners on teardown. Initialization is idempotent.
- Prefer initial visibility and reliability over animating every possible entrance. The bounded effect may begin when an eligible offscreen item first enters the viewport; no critical content waits for an observer callback to become readable.

## Interaction polish

Use targeted transitions on shared buttons, card links and social links. Keep hover-only movement behind hover/fine-pointer media queries; avoid sticky touch hover and layout-changing font-size/weight animation. Keyboard focus retains a clear static outline with an immediate visible state. Colour/border feedback remains usable with motion disabled. Avoid `transition: all` and do not overwrite an element's existing transform to implement entrance animation.

## Reduced motion, fallback and performance

`prefers-reduced-motion: reduce` takes precedence over project configuration. It removes entrance animation, stagger and decorative hover translation, including when the preference changes while the page is open. No browser storage, cookies, external requests or analytics are introduced.

Use one shared controller with bounded groups and a shared observer, unobserve completed targets and release completed animation handles. Feature detection covers both APIs. An enabled setting must not hide content when animation is unavailable. Disabled projects should load no entrance-controller JavaScript; normal visible HTML remains identical in meaning.

## Showcase and extension points

Add a motion example to the local-only design-system showcase using the actual shared markers/controller and tokens. Preview on/off is transient, clearly labelled and never writes configuration or content. Keep the existing staging/production showcase exclusion intact. New registered renderers opt in through the documented motion marker convention; no page-specific script copy is needed.

## Verification and acceptance

Implementation planning must assign concrete tasks and separate implementation/review checkpoints using the previously requested subagent workflow.

- Validate defaults, boundaries, unknown keys and configured token emission. Prove configured numbers reach the actual computed runtime values.
- Verify initialization, once-only lifecycle, bounded stagger, unsupported APIs, cancellation, focus, initial/deep-linked targets and dynamic reduced motion.
- Exercise representative EN/EL pages, contact, listings/detail pages, Composition B fixtures and enabled Rooms at 375, 768 and 1440 px. Include JavaScript disabled and motion disabled/reduced contexts.
- Verify no layout shifts/overflow caused by effects, no hidden or delayed form/error/legal content, and no conflict with existing hover/focus presentation. Capture representative visual evidence.
- Run project checks, tests, site build, CMS build where configuration descriptors are affected, static routing checks and showcase exclusion checks. Stop the owned stack before lifecycle-owning commands and restore it afterwards.
- Canonical content and unrelated local data remain unchanged. Detached fixtures or known-byte-owned restoration are required for any temporary configuration/content changes.

## Self-review and handoff

This design extends project configuration and public presentation only. It deliberately does not add per-section CMS animation controls or a motion library. There are no unresolved product choices required for the proposed implementation plan; the numeric defaults and explicit local opt-in are proposals for the user's written-design review. This document records intended behaviour, not completed implementation or verified browser support.
