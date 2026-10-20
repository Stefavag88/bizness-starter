# Starter v2 Newsletter and Visitor Preferences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CMS-edited newsletter modal and compact footer signup, sharing safe browser preferences and the existing double-opt-in backend.

**Architecture:** Extend the existing settings/localization and native Tina boundaries. Use one browser state store, one submission controller and native dialogs. Keep enquiries disabled; prove newsletter/nurture behavior in detached fixtures with isolated D1.

**Tech Stack:** Existing Astro 7.3.6, TinaCMS 3.14.3 / CLI 4.0.1, Zod, Cloudflare Worker/D1, Vitest and Playwright. No new dependency.

**Spec:** [Approved newsletter/preferences design](../specs/2026-10-20-starter-v2-newsletter-preferences-design.md)

## Global Constraints

- Repository: `C:\Projects\bizness-starter-v2`; branch: `codex/starter-v2-newsletter-preferences`; feature baseline `61e52ae`.
- Execute inline, with tests and a commit per task, then one independent final review. No per-task agents or approval pauses.
- Preserve existing design tokens, public routes, profile meanings, consent/security guarantees and real-sending settings. Default project remains enquiries.
- All Markdown documentation is English. Public controls/messages support EN/EL. Existing confirmation emails/token pages remain English.
- Canonical rich content is safe Markdown; Tina supplies visual WYSIWYG editing. Do not introduce arbitrary HTML execution.
- Module flags default false. Settings default disabled. Shared behavior is not translated; copy is.
- No hosted Turnstile provisioning, provider setup, analytics, generic script loader, blanket cookie banner, deployment or external sending.
- Nonlocal environments without an authentic protection adapter show Contact alternatives and cannot auto-solicit broken signup submissions. Never enable a local dummy token for hosted submissions.
- Use detached fixture sources and D1. Do not mutate the normal database, financial example or old starter. Never restore unknown canonical bytes.
- Record process ownership and stop only exact owned trees. Restore normal site/CMS after lifecycle-owning verification.

## Review Focus

1. Disabled module saves can silently erase dormant native rich content: Task 1 projection tests and Task 4 real disable/save/re-enable proof.
2. Footer-only configurations can accidentally require/render modal copy: Task 1 surface-specific validation and Task 3 renderer tests.
3. Storage rejection, corrupt records or cross-tab updates can repeatedly interrupt a visitor: Task 2 state tests and Task 4 browser cases.
4. Timeout retries and uniform 202 responses can falsely imply subscription or duplicate attempts: Task 3 controller tests and Task 4 real pending/confirm/unsubscribe flow.
5. Production builds or JavaScript failure can expose unusable controls/local protection: Task 3 rendering gates and Task 4 built-output/no-JavaScript/network checks.

## File responsibilities

Paths below are relative to the repository root.

| Files | Responsibility |
| --- | --- |
| `packages/config/project.mjs`, `project.d.mts` | Defaulted module capability flags |
| `packages/content/newsletter.mjs`, `newsletter.d.mts` (new) | Settings/copy schemas, surface validation and localized eligibility |
| `packages/content/schemas.mjs`, `types.ts`, `localize.mjs`, `catalog.mjs` | Canonical settings integration, localized projection, project interest validation |
| `tina/fields/newsletter.ts` (new), `tina/collections/settings.ts`, `tina/validation.ts` | Native fields, help, hidden dormant fields and detached rich projections |
| `apps/site/src/scripts/visitor-state.mjs`, `visitor-state.d.mts` (new) | Pure bounded storage codec and suppression policy |
| `apps/site/src/scripts/newsletter-scheduler.ts` (new) | Visible-time scheduling, deferred eligibility and teardown |
| `apps/site/src/scripts/newsletter-form.ts` (new) | Shared form validation, request/retry and generic receipt state |
| `apps/site/src/scripts/visitor-experience.ts` (new) | Dialogs, preferences and state/form/scheduler integration |
| `apps/site/src/scripts/site-entry.ts` (rename `motion-entry.ts`) | Existing motion bootstrap plus conditional visitor-controller import |
| `apps/site/src/components/newsletter/{NewsletterForm,NewsletterFooter,VisitorDialogs}.astro` (new) | Shared accessible markup and localized fallback |
| `apps/site/src/layouts/Layout.astro`, `apps/site/src/styles/newsletter.css` (new) | Shared integration and responsive token-based styling |
| `apps/site/src/scripts/newsletter-messages.ts` (new) | EN/EL operational labels and feedback |
| Tests named in each task, `apps/site/vitest.config.ts` | Policy, rendering and browser verification |
| `scripts/verify-newsletter.mjs`, `e2e/newsletter.spec.ts`, `e2e/newsletter-cms.spec.ts` (new) | Owned detached fixture acceptance and evidence |
| `docs/NEWSLETTER.md` (new), relevant existing CMS/design/module guides | Opt-in instructions, limitations and extension contract |

No Worker subscription/schema migration is planned: reuse its existing endpoint and privacy version ownership. If verification reveals a necessary backend correction, record the evidence and add a focused failing regression before making the smallest correction.

## Task 1: Canonical settings and native CMS editing

**Files:** Config/content/Tina files above; new `tests/newsletter-settings.test.ts`, `tests/cms-newsletter.test.ts`; existing content fixture factory where necessary.

**Interfaces:**
- Export `newsletterCopySchema`, `newsletterSettingsSchema` from `packages/content/newsletter.mjs`.
- Export `validateNewsletterSettings(settings, project): void` for active project-interest and surface-copy validation.
- Export `resolveNewsletterExperience(settings, project, context): NewsletterExperience | null`. Context is `{locale, privacyHref: string | null, pageKind, localProtectionAvailable:boolean}`; result contains validated policy, surface flags, localized copy, interest and privacyHref. No unavailable privacy-language fallback.
- `NewsletterPolicy`: `{modalEnabled, autoOpen, footerMode, delaySeconds, dismissDays, acceptedDays}` with the spec's exact defaults/bounds. Settings also own `enabled`, `interestId` and copy.
- `newsletterFields(project, {translated:boolean}): TinaField[]` declares the same native field shapes even when hidden by unavailable capability. Translations contain copy only.

- [ ] Write failing tests: omitted modules become false; absent newsletter settings stay disabled without requiring a seed rewrite. Assert defaults 12/30/180 and bounds 5–120 / 1–180 / 30–365, integer-only. Reject unknown keys and unknown active interest.
- [ ] Add surface matrix tests: modal-only requires modal title/body; footer-only inline requires footerPrompt but no modal title/body; both require both; open-modal plus modalEnabled=false fails. All enabled forms require labels/consent/Privacy/success feedback. Dormant values survive profile/module off.
- [ ] Add EN/EL localization and privacy tests: shared policy is identical, copy is locale-specific, missing/draft Privacy yields no experience, enquiries yields none. No fallback to another language's Privacy URL. Nonlocal protection unavailable yields fallback-only surfaces and no auto eligibility.
- [ ] Add native tests using actual rich ASTs: body/successBody become safe full Markdown; footerPrompt becomes inline Markdown. Reject image/raw HTML/unsafe links and non-inline footer structures. Validate a detached clone and assert the submitted AST/unrelated values remain byte-equivalent.
- [ ] Run `pnpm exec vitest run tests/newsletter-settings.test.ts tests/cms-newsletter.test.ts`; confirm RED from missing feature behavior.
- [ ] Implement schema, types and settings localization. Keep canonical root shared policy + default-locale copy; translations carry only newsletter copy. Integrate catalog validation and native save validation, not only field-level UI checks. Use existing text/rich-text bounds and helpers.
- [ ] Implement native CMS group and help. Full visual editors for body/successBody, inline editor for footerPrompt, configured interest select, shared timing/surface controls. When capability is off, hide fields without removing native schema/serialization ownership. Add nested newsletter rich conversion explicitly in `nativeProjection`.
- [ ] Run the two focused suites plus existing CMS save/rich-boundary/localization tests. Confirm GREEN, no discarded dormant data, no generated descriptor leaks.
- [ ] Commit: `feat: add configurable newsletter content and CMS fields`.

## Task 2: Browser suppression and visible-time scheduling

**Files:** `visitor-state.mjs`, declaration, `newsletter-scheduler.ts`; new `tests/visitor-state.test.ts`, `tests/newsletter-scheduler.test.ts`.

**Interfaces:**
- `visitorStorageKey(projectName:string): string` returns `starter:<projectName>:visitor:v1`.
- `readVisitorState(storage, key, now): VisitorSnapshot` returns `{status:'empty'|'valid'|'invalid'|'blocked', state}`.
- State shape: `{version:1, promptsAllowed:boolean, lastAutoShownAt:number, dismissedUntil:number, acceptedUntil:number}`. No other fields.
- `canAutoPrompt(snapshot, policy, now):boolean`; `updateVisitorState(storage,key,change,policy,now):VisitorSnapshot`; `resetVisitorState(storage,key,now):VisitorSnapshot`. Change is `autoShown|dismissed|accepted|{promptsAllowed:boolean}`. Each update rereads latest persistent state before merging.
- `createNewsletterScheduler({delaySeconds, document, canOpen, open, clock}): {start():void, reconsider():void, stop():void}`. Injectable clock supplies now/setTimeout/clearTimeout. `open():boolean` records persistent cooldown before opening and reports actual success.

- [ ] Write failing state tests for absent/current/expired records; shared EN/EL key; preference false; accepted180-day and dismissed30-day defaults; no personal/attempt data serialized. Assert resetting removes only the known key.
- [ ] Pin defensive codec policy: max1024 UTF-8 bytes, exact known fields/version, finite safe-integer nonnegative timestamps; lastAutoShownAt cannot exceed now; dismissedUntil cannot exceed now+180days; acceptedUntil cannot exceed now+365days. Reject malformed/unknown/oversized/future records quietly. A backward clock can suppress automation until reset; it cannot grant server privileges.
- [ ] Test denied reads, failed writes and persistence failure before auto-open: auto stays off; manual actions retain in-memory convenience state. On invalid storage, only explicit reset recovers automatic eligibility. Merge a fresh cross-tab accepted/preference update before attempting display.
- [ ] Write scheduler tests: 12 visible eligible seconds, pause while hidden, defer for active foreign form/open dialog, recheck before opening, one opening per cooldown, no opening after teardown. Excluded page kinds never schedule. Reconsider after focus/dialog/storage changes without busy polling.
- [ ] Run `pnpm exec vitest run tests/visitor-state.test.ts tests/newsletter-scheduler.test.ts`; confirm RED.
- [ ] Implement pure state policy and scheduler with injected dependencies. Count visible page time, defer at the due point until safe, and preserve delay across temporary visibility changes. Subscribe/unsubscribe listeners through the owning controller; no background timer loop.
- [ ] Repeat the focused command; confirm GREEN, including write-before-open and cross-tab best-effort behavior. Do not claim an atomic cross-tab lock.
- [ ] Commit: `feat: add defensive newsletter prompt preferences`.

## Task 3: Accessible modal, compact footer and shared submission

**Files:** Components/scripts/styles/layout above, `apps/site/vitest.config.ts`; new `tests/newsletter-form.test.ts`, `apps/site/tests/newsletter.test.ts`.

**Interfaces:**
- `initNewsletterForm(form:HTMLFormElement, options): {showReceipt():void, destroy():void}`. Options provide validated interest, protection token adapter, localized messages, a shared in-flight coordinator and `onAccepted():void`.
- `initVisitorExperience(root:HTMLElement):()=>void` owns both forms, scheduler, storage listeners, native dialogs and preferences; repeated initialization cannot attach duplicate handlers.
- Components consume the Task 1 resolved model. Unique IDs per modal/footer instance. Markup exposes bounded policy data only, no secrets or arbitrary inline script/config execution.
- `site-entry.ts` preserves the existing motion import condition and dynamically imports visitor-experience only when its eligible root exists. Common bootstrap is allowed; enquiries requests no newsletter controller and exposes no signup UI/API calls.

- [ ] Write form tests: invalid email/unchecked consent do not send; valid submit sends only UUID requestKey/email/consent:true/interest/turnstileToken. Do not send sourceArticle or client privacyVersion. Duplicate submits lock both surfaces. Timeout/retry preserves values and requestKey for the same semantic payload; editing email/consent/interest starts a new attempt.
- [ ] Test uniform202 as generic receipt requiring confirmation, with accepted suppression; errors never set accepted suppression. Never infer subscribed status or expose raw server internals. Modal success notifies the footer without storing identity. Both surfaces share one coordinator/controller implementation.
- [ ] Write actual Astro renderer tests for modal-only/footer-only/both/off/enquiries, EN/EL, unavailable Privacy and nonlocal protection. Footer contains short prompt/input/button + compact unchecked consent/Privacy row, never modal body. Contact remains an immediate fallback if JS enhancement fails. Preferences control appears only with an actual automatic-prompt choice.
- [ ] Run root form tests and `pnpm exec vitest run --config apps/site/vitest.config.ts`; confirm feature tests RED.
- [ ] Implement shared form handling using existing contract validation and POST endpoint. Gate the local preview token by real local environment; no hosted dummy fallback. Keep static localized Contact alternatives visible until successful enhancement and retain them if support/import fails. Unsupported dialog disables popup controls, not the contact alternative.
- [ ] Implement native dialogs and preferences. Escape/close, labelled title, announced form feedback, focus restoration, no nested modal stack. Automatic display persists cooldown before showModal; dismissed/accepted storage events recheck pending timers. Manual signup remains available despite automatic preference/cooldown.
- [ ] Add token-based dialog entrance, reduced-motion immediate operation and responsive footer row-to-stack layout. No primary-content animations or reveal markers. Use current field/button styling, typography, radius and icons. Preferences explain browser prompt choice versus unsubscribe; reset affects only module state.
- [ ] Integrate the generic bootstrap without breaking motion behavior or CSP. Ensure unsupported fetch/storage/UUID paths fail safely with manual Contact fallback; storage alone must not block otherwise supported manual signup.
- [ ] Repeat focused tests, existing motion/contact/footer tests and site checks; confirm GREEN. Check generated script URLs use compiled assets, not raw TypeScript URL imports.
- [ ] Commit: `feat: add newsletter modal and compact footer signup`.

## Task 4: Real CMS/browser/backend acceptance and documentation

**Files:** New verifier/e2e files above; reusable existing owned-process, native-document and CMS-source-ownership helpers; `package.json`; `docs/NEWSLETTER.md`; relevant existing guides; `docs/superpowers/reviews/2026-10-20-newsletter/` evidence.

**Interfaces:**
- `pnpm test:newsletter` runs `node scripts/verify-newsletter.mjs`, owns detached fixture runtimes and exits nonzero on acceptance/cleanup failure.
- Detached newsletter and nurture fixtures use copied source manifests, node_modules junctions, generated config, local-only sending/capture and isolated Wrangler persistence. Original content/config/D1 stay untouched.
- Reuse installed GraphQL variable coercion + installed Tina serializer to derive expected save bytes before admitting mutations. Record source/schema/request/expected/result hashes, process IDs and exits.

- [ ] Write acceptance cases before running implementation verification: actual Tina edits rich body/successBody/footerPrompt, title, interest, timings and flags; saves enabled and disabled; re-enable restores dormant AST/content. Capture source/schema before request, admit only owned Settings mutations, verify exact serializer-derived bytes before build/restore claims. Never regenerate unknown bytes to manufacture a match.
- [ ] Add browser matrix EN/EL at375/768/1440: modal delay and manual entry, footer-only and both, focus exclusion, background pause, Contact/privacy/system exclusions, Escape/focus return, preferences/reset, reduced motion, no JS/import failure, no overflow and no unexpected external requests. Exercise actual active dialogs/form focus, not only capability media queries.
- [ ] Add state browser cases: reload and language navigation share suppression; second tab changes preferences/accepted state; corrupt/blocked storage and failed pre-open persistence never auto-open; manual signup remains usable. Assert modal and footer success share suppression without personal data in storage.
- [ ] Add real local Worker flow in isolated D1: dummy address POST gives202 and pending; follow captured confirmation token to active; unsubscribe through existing route; verify suppression and uniform202 for existing/suppressed addresses. Keep actual API origin/rate/protection behavior; intercepted-only responses do not prove this flow.
- [ ] Run `pnpm test:newsletter`; record first failures and fix only with focused regressions, then rerun the affected acceptance cases. Assert no normal DB/canonical changes and no external mail; retain raw evidence hashes and all cleanup failures.
- [ ] Document configuration examples for modal-only, footer-only and both; exact project flags/profile/interest/Privacy requirements; WYSIWYG safe Markdown semantics; browser key/reset and no-PII policy; accepted request versus active subscription; real sending/hosted protection and English token-page limits. Document future optional-integration registration/default-deny/revocation contract without claiming a shipped cookie-consent platform.
- [ ] Stop exact normal owned runtime before lifecycle-owning gates. Run sequentially: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm worker:check`, `pnpm cms:local-build`, `pnpm test:static-routing`, `pnpm test:showcase-builds`, `pnpm test:newsletter`. Confirm exit0 for each, record counts/skips and failures honestly. Rerun only newly affected gates after fixes.
- [ ] Restore `pnpm dev:cms`; record owned processes and confirm HTTP200 site EN/EL, Contact, CMS, Worker health plus real indexed Settings/PageHome queries. Preserve default enquiries with no newsletter controller request.
- [ ] Commit: `test: verify newsletter CMS and local signup lifecycle` (include documentation and evidence).

## Final independent review and completion

- [ ] Prepare one review package covering all feature commits against `61e52ae`, requirements, test evidence and honest limitations. Use the preserved inline execution ledger and requesting-code-review skill. No task-level reviewers.
- [ ] Request one fresh independent final reviewer on the skill-prescribed most capable model. Apply Critical/Important fixes with focused RED/GREEN proof and one fix pass; disclose deferred Minor findings. Do not silently expand into deployment/provider work.
- [ ] Verify final diff/status and any affected checks, commit review fixes/evidence separately, then report what is available, how to opt in, and the remaining hosted protection/sending work. Do not push/deploy without authorization.

## Plan self-review

The four tasks cover settings/native serialization, browser state/scheduling, both UI surfaces/API integration, and real acceptance/docs. Review Focus cases map to explicit tests. Interfaces above are shared across tasks; defaults and bounds match the approved spec. This plan does not change the default functional profile or add a generic consent/script platform. A tiny shared bootstrap remains present while newsletter controller loading stays capability-gated.

Execution method is already chosen. Written plan review is the remaining Superpowers handoff gate before runtime changes; no additional method selection is needed.
