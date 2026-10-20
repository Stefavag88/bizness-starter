# Shared motion

Motion is optional public presentation configured in `project.json`. Existing projects that omit it remain motion-disabled. The local example explicitly enables it. Functional profiles, content records and Tina fields are unchanged.

```json
{"design":{"theme":"neutral","density":"comfortable","motion":{"enabled":true,"durationMs":600,"distancePx":18,"staggerMs":70,"interactionMs":180}}}
```

| Setting | Default | Accepted values |
| --- | --- | --- |
| enabled | false | boolean |
| durationMs | 600 | integer 100–1200 |
| distancePx | 18 | integer 0–48 |
| staggerMs | 70 | integer 0–150 |
| interactionMs | 180 | integer 0–400 |

Unknown keys, nulls, numeric strings and out-of-range values fail validation. Partial motion objects receive defaults. Run `pnpm configure` after a permanent configuration change; the normal launcher watches the input. Static hosting requires rebuilding for permanent changes.

## Tokens and extension

`packages/config/project.mjs` validates values; `packages/design-system/motion.mjs` emits CSS through `scripts/design.mjs`. Edit source configuration, never `themes.generated.css`. The generated variables are `--motion-duration`, `--motion-distance`, `--motion-stagger` and `--motion-interaction-duration`. Foundation CSS owns `--motion-max-delay:300ms`, `--motion-ease:cubic-bezier(.22,1,.36,1)` and `--motion-interaction-ease:ease-out`.

Place `data-motion-reveal` on a copy wrapper or text card. Put `data-motion-group` on the nearest common group ancestor for sibling stagger. Do not nest entrance targets. Groups cap the total delay at 300 ms. Reuse the shared layout/controller; do not add a page-specific script or permanent hidden state.

`initMotion(root: Document | HTMLElement): () => void` in `apps/site/src/scripts/motion.ts` consumes a root with `data-motion="on"`. Its return value disposes owned observers, listeners and animations. Repeated initialization of an active root returns the same disposer. Completed targets do not replay within that initialization. Explicit disposal/reinitialization in the local showcase starts a new preview session.

## Behaviour and accessibility

Only offscreen eligible targets are observed at initialization. The primary hero/H1, navigation, footer/legal content, skip links and contact form/errors remain outside entrance effects. Media/text animates copy; gallery animates captions; Rooms animates card copy without moving its image. Ordinary editorial paragraphs are not automatically traversed.

Targets animate opacity and individual vertical translation once, preserving existing transforms. An existing individual translate receives fade-only enhancement. Default HTML/CSS remains visible, with no hidden/pending class or committed inline styles. During stagger delay an element can be visible before its brief entrance starts; this favours readable fallback over pre-hiding content. Initially visible content does not animate.

Focus and fragment navigation cancel relevant animations immediately. Encoded and malformed fragment IDs are handled without constructing CSS selectors. Changing the operating-system reduced-motion preference cancels active movement and blocks new decorative movement. Initial reduced motion or unavailable APIs skips enhancement. JavaScript failures leave ordinary content visible; no retry overlay or loading state is added.

Buttons, card links and social links share targeted colour transitions. Decorative hover translation applies only to fine hover pointers, with static immediate keyboard focus. Reduced motion removes transitions and movement; project off removes decorative movement while preserving colour feedback. No animation library, cookie, storage, tracking or external request is introduced. A small shared bootstrap may load on disabled pages, but their entrance-controller chunk is not requested.

## Local preview and verification

The local-only `/design-system` page has a transient Motion preview checkbox. It uses the real renderer markers and controller, observes only visible language samples and cleans up before theme/language changes. Reset returns to the configured state. It does not save settings or change published content. Existing staging/production showcase exclusion remains in force.

Run `pnpm test:motion` with the main stack stopped. It builds detached on/off fixtures with custom values, Composition B and Rooms, serves their static files on owned ephemeral loopback listeners, and runs EN/EL browser checks at 375/768/1440 px, including reduced/no-JavaScript contexts. Evidence and retained fixture inputs live under ignored `.generated/motion/`. The driver verifies a source inventory before/after; it does not overwrite canonical files or restore unknown editor bytes. Evidence reports distinguish automated coverage from manual checks and hosted verification, which remains outside this feature.
