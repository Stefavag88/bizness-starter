# Architecture constraints and deployment audit

Research date: 2026-10-21. Source snapshot: `e9e8e02`, branch `codex/starter-v2-presets`.

## Follow-up after local runtime budgets

This is the historical audit of `e9e8e02`; its source counts and observations describe that snapshot. Local Tasks 1–7 have since been implemented through `565c633`: invocation budgets, daily pacing, bounded candidate/index scans, telemetry and the administrator dashboard. See the [verified evidence](superpowers/plans/2026-10-21-cloudflare-free-budgets-evidence.md). A5's original full-batch behavior has been replaced locally; actual hosted CPU, row costs and Free entitlement remain unqualified. The other hosted release gates still apply.

## Assessment

The architecture remains suitable for small business, services, accommodation brochure and studio websites. The research found no reason to replace Astro, TinaCMS or Cloudflare for that scope. However, the current local foundation is not a deployable production package, and its complete backend cannot yet be advertised as verified on Cloudflare Free.

The highest priorities are the CMS security headers, a real hosted CMS build, the form protection client, deployment isolation and bounded backend work. These can be addressed without changing the public design or content ownership model.

This audit combines source inspection, current official documentation and read-only HTTP probes against the existing local Worker. It does not provision resources, enable sending, execute remote migrations or certify hosted behavior. No application/configuration changes were made. Production remains blocked under the existing [production readiness decision](PRODUCTION_READINESS.md).

## What is actually being deployed

- Astro produces static localized HTML, scripts, styles, fonts and responsive images.
- A separate Cloudflare Worker handles forms, protected CMS/operations access and email lifecycle.
- Workers Static Assets serves the public locale routes directly. Root redirects, `/api`, `/admin`, `/cms` and newsletter actions remain Worker-first.
- D1 stores enquiries, consent/subscriber data and email job state. Queues delivers job identifiers. A minute Cron dispatches jobs and performs cleanup. Nurture additionally uses Workflows.
- TinaCloud is the intended hosted editing backend, backed by GitHub. Tina's local Node backend is a development service, not part of the Worker deployment.
- SES/SNS supplies outbound email and feedback.

The generated deployment targets **Workers + Static Assets**, not a plain Cloudflare Pages upload. Uploading only the Astro `dist` directory to Pages would omit the configured backend, scheduled work and authorization. Static Astro is compatible with Cloudflare; adding an SSR adapter is unnecessary for the current output model. See [Astro deployment guidance](https://docs.astro.build/en/guides/deploy/cloudflare/) and our [routing contract](STATIC_ASSET_ROUTING.md).

## Prioritized findings

Priority definitions: **P0** blocks the corresponding first hosted release; **P1** must be resolved or explicitly bounded before production use; **P2** is a growth or future-feature constraint. A known deferred integration is distinguished from a newly identified mismatch.

### A1 — P0: CMS CSP rules do not produce the intended policy

**Confirmed mismatch, including a runtime observation.** `scripts/configure.mjs:20-28` emits a strict public CSP for `/*` and a separate CMS CSP for `/cms/*`.

Read-only probes against the existing Worker at port 8790, with redirect following disabled, returned:

| Request | Status | Location | Observed CSP |
| --- | --- | --- | --- |
| `/en` | 200 | None | Public self-only policy |
| `/cms` | 200 | None | Public self-only policy |
| `/cms/` | 307 | `/cms` | Public and CMS policies |
| `/cms/index.html` | 307 | `/cms` | Public and CMS policies |

The canonical `/cms` path misses `/cms/*`. On overlapping paths, an additional CSP does not override the public one: Cloudflare combines matching headers, and browsers enforce all CSP policies. The self-only policy therefore prevents the external Tina connections even where a second policy permits them. Local Astro CMS success does not test this boundary.

**Required outcome:** one effective, deliberately scoped policy for canonical CMS HTML and its assets, covering login, editor requests, styles and media. Retain the public site's restrictive policy. Verify redirects and actual native saves through the built Worker, followed by hosted login/save/upload tests. Do not treat disabling CSP globally as a remedy.

Sources: [Workers asset headers](https://developers.cloudflare.com/workers/static-assets/headers/), [W3C multiple-policy behavior](https://www.w3.org/TR/CSP3/#multiple-policies).

### A2 — P0: hosted CMS build and publication pipeline are missing

**Known integration gap, confirmed in scripts.** `package.json` builds the Astro site; it does not build a production Tina admin. `cms:local-build` intentionally produces local-mode output. `tina/config.ts:6` defaults to branch `main` and empty cloud credentials. The current CI runs repository checks and a Worker dry-run, not a hosted CMS build or deployment.

A local development CMS HTML file can point at localhost. Shipping that file or omitting CMS assets will not produce a working hosted editor. The intended GitHub repository, Tina project, branch, configured site URL, tokens and deployment artifact must agree.

**Required outcome:** a clean-checkout build sequence that configures/validates canonical content, builds Tina in cloud mode and then builds Astro, with an explicit branch and failure gates. Confirm an editor save reaches the intended Git branch and triggers a successful immutable deployment. Protect the selected workflow without accidentally preventing Tina's authorized writes. Worker Access and Tina membership remain separate authorization systems.

Sources: [Tina local versus production behavior](https://tina.io/docs/faq), [Tina project configuration](https://tina.io/docs/tinacloud/dashboard/projects). Local ownership: [authentication](AUTHENTICATION.md).

### A3 — P0: hosted forms need an actual Turnstile client

**Known implementation gap.** `ContactForm.astro:27` submits a hidden `local-preview` token. `worker/security.ts:66` bypasses verification only on actual loopback requests; hosted requests require a real token with the expected hostname and action.

Adding a secret alone cannot make the form work. The public CSP also currently excludes Turnstile resources.

**Required outcome:** site-key configuration, real widget/token acquisition, expiration and retry handling, server verification and the necessary scoped CSP allowances. Test contact and subscription independently, including failure paths, without enabling real email until provider readiness is complete.

Sources: [Turnstile client integration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/), [Turnstile CSP requirements](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).

### A4 — P0: environment labels do not isolate infrastructure

**Known release blocker.** `scripts/configure.mjs:31-35` derives the Worker, database name, queue and DLQ from the project name and uses one database UUID. Changing `environment` alone does not create separate staging resources. `workers_dev` and preview URLs are disabled, and no hosted domain route is generated.

**Required outcome:** explicit customer/environment deployment identities, distinct bindings and secrets, remote migration safeguards, artifact/runtime identity checks and a tested rollback procedure. Include Tina branch/media isolation in this design. A custom domain needs the applicable Cloudflare zone/routing setup; a `siteUrl` value is not a deployed route.

Source: [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). Existing requirements: [production readiness](PRODUCTION_READINESS.md).

### A5 — P1: backend batching is not bounded for the Free plan

**Confirmed source/limit mismatch at a full dispatch batch.** `worker/delivery.ts:232` performs two recovery updates, one selection and up to 50 individual state updates, with a queue send for each job. That is **53 D1 queries** in dispatch alone; the scheduled handler subsequently attempts two cleanup queries. Cloudflare Free permits 50 D1 queries per Worker invocation. Queue operations also consume runtime resources; D1 is not the only budget to consider.

Newsletter fan-out and nurture reconciliation add work to the same scheduled invocation. `worker/campaigns.ts:84` can prepare 100 jobs plus a cursor update per campaign and consider five campaigns. Exact batch/subrequest accounting and combined CPU use require hosted measurement; batching must not be assumed to remove limits.

**Required outcome:** choose a supported deployment baseline. Either implement and verify an invocation-wide Free-plan budget, or make Workers Paid an explicit backend prerequisite and still bound/measure work there. Test backlog recovery and partial progress, not only one successful enquiry. Free CPU constraints also need measurements around authentication, feedback and consumers.

Sources: [D1 invocation limits](https://developers.cloudflare.com/d1/platform/limits/), [Workers runtime limits](https://developers.cloudflare.com/workers/platform/limits/).

### A6 — P1: account-wide quotas limit multiple independent client sites

**Confirmed architectural/account constraint.** A Cron is generated even for the enquiries profile. Workers Free currently allows **5 Cron Triggers per account**; D1 Free allows **10 databases per account**. Separate staging and production deployments consume separate resources. For example, two triggers per client would fit only two complete client pairs within an otherwise unused five-trigger allowance.

A new repository or customer project does not reset account quotas. Decide who owns each customer's account/resources and whether the shared account uses a paid plan. Do not remove dispatch/cleanup schedules without replacing their responsibilities.

Sources: [Workers account limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 account limits](https://developers.cloudflare.com/d1/platform/limits/).

### A7 — P1: email readiness and recovery need hosted proof

**Known provider/operations gap.** SES starts in a regional sandbox, normally restricting sends to verified recipients and allowing 200 messages per day at one per second. Cloudflare's deployment does not remove these AWS restrictions.

Queue delivery is at least once. Current deduplication, claims, suppression and quarantine for ambiguous sends are valuable and should be retained; they are not an end-to-end exactly-once guarantee. The consumer is serialized and waits at least one second between messages; dispatch also selects at most 50 jobs per minute. Large campaigns will take time to drain.

**Required outcome:** verified sender/domain and SES access, correct region and quotas, SNS feedback proof, alerts for pending age/DLQ/unknown outcomes, and rehearsed recovery. Keep transactional notifications observable without requiring marketing to be enabled. Data retention/deletion and backup handling remain owner decisions; no retention period is assumed here.

Sources: [SES production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html), [Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/). Existing runbooks: [operations](OPERATIONS.md), [production readiness](PRODUCTION_READINESS.md).

### A8 — P1: CMS media permissions and branches need explicit rules

**Confirmed product boundary; hosted workflow unverified.** Public originals remain in the static output. Protecting `/cms` does not make `/uploads` private. This architecture is appropriate for marketing images, not private financial documents or identity uploads.

Tina repo-based media defaults to a single media branch without its editorial workflow. A staging content branch therefore does not automatically imply isolated staging media. Hosted replacement/sync behavior also differs from local filesystem updates; Tina documents using a new filename for changed assets.

The app accepts only local PNG/JPEG/WebP references, with a 20 MiB source limit. TinaCloud's documented upload ceiling is 100 MiB; Cloudflare's individual asset limit is 25 MiB. The CMS picker filters formats, but does not implement the application's complete byte/dimension limits. An upload accepted by the media library can still fail a build. All public output, including unreferenced originals and derivatives, needs a deployment inventory check.

**Required outcome:** native hosted upload/select/save/build proof; clear file limits and filename policy; validated media isolation/deletion rules. Private attachments would require a separate authenticated storage feature.

Sources: [Tina repo-based media](https://tina.io/docs/reference/media/repo-based), [Cloudflare asset limits](https://developers.cloudflare.com/workers/platform/limits/). Local policy: [media optimization](MEDIA_OPTIMIZATION.md).

## Scale and product constraints

### Public traffic versus backend capacity

The existing static-first routing is worth preserving. Direct static asset requests are free and unlimited under the current Workers asset model. Worker-first endpoints remain subject to runtime request allowances. On Free, exhausting that allowance returns 429 for those routes rather than falling back to assets; negative-pattern public routes remain asset-served. The root redirect also invokes the Worker today.

An attack reaching an API still consumes some backend capacity even if application validation rejects it. Our database rate limiter is not an edge billing shield: it runs inside the Worker and touches D1 before Turnstile verification. Apply appropriate edge controls and observe quota use; do not promise that DDoS protection makes deliberate quota consumption impossible. The recommendation is an inference from the routing and billing model, not a hosted attack test.

Sources: [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

### Operational allowances to budget

| Resource | Current documented allowance or behavior | Implication |
| --- | --- | --- |
| Worker execution | Free: 100,000 requests/day, 10 ms CPU per invocation | Measure backend paths; network waiting is distinct from CPU. |
| Static output | Free: 20,000 files; Paid: 100,000; 25 MiB/file on both | Count localized pages, CMS assets, originals and generated variants together. |
| D1 | Free: 500 MB/database; Paid: 10 GB/database | D1 is not an unbounded single database. |
| D1 daily Free usage | 5 million rows read; 100,000 rows written | Scanned rows matter, not only returned rows. |
| Queues Free | 10,000 operations/day; 24-hour retention | A normal small message uses about three operations; retries/DLQ add more. |
| Workers Builds Free | 3,000 build minutes/month; one concurrent build; 20-minute timeout | Relevant only if using Workers Builds; other CI has its own allowances. |
| Tina Free | Two users and two roles | Additional Worker admins do not create additional Tina seats. |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 usage accounting](https://developers.cloudflare.com/d1/platform/pricing/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/), [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [Tina pricing](https://tina.io/pricing).

Queues is currently available on Workers Free; its presence alone does not mandate upgrading. A rough 10,000/3 estimate is approximately 3,333 ordinary small-message deliveries per day before retries or other operations, not a delivery SLA. Workers Paid currently starts at USD 5/account/month with usage-based charges beyond included allowances; it is not a fixed unlimited bill. SES and other services remain separate. Recheck prices when choosing accounts.

### Static publication has real editorial consequences

CMS changes reach the public site after Git synchronization, validation, a successful build and deployment. There is no fixed guaranteed publication delay. `publishAt` is evaluated while building; a future date does not itself trigger publication. The Worker Cron currently processes email/cleanup, not website rebuilds.

If automatic timed publication is promised, add a separately designed scheduled rebuild mechanism, including timezone, missed-run and failed-build handling. A high-frequency news publisher may need a different publication model; brochure sites generally fit the current model well.

Source ownership: `packages/content/publication.mjs:10`, `apps/site/src/lib/content.ts:11`, `worker/index.ts:23`; see [CMS authoring](CMS_AUTHORING.md).

### Large catalogs affect authoring and build time

`tina/validation.ts:349` reads the current catalog across enabled collections in 100-record pages, including document values, before validating a save. This deliberately catches cross-document errors, but save cost grows with catalog size and rich-text volume. It is browser-side validation, not an atomic multi-editor transaction or a substitute for the canonical build gate.

Image processing runs at build time with two native-work slots. Each source can produce multiple widths in WebP plus its fallback format; originals remain public. Large galleries increase build time, repository weight and deployed file count. Preserve caching and benchmark realistic client catalogs before committing to thousands of records/images.

The installed CMS has no search configuration. Tina search needs explicit configuration and an index build. Current public pricing does not clearly establish a separate search entitlement; confirm availability for the chosen project rather than promising either free or paid access. See [Tina search](https://tina.io/docs/reference/search/overview).

### Portability and future scope

Content, themes and static Astro output remain comparatively portable. D1 bindings, Queues, Access JWT integration and Workflows are Cloudflare-specific adapters. Moving the backend to another host would require replacements; it would not require replacing the public design system.

The current contract covers public content and enquiries. Bookings, payments, customer accounts, private files, real-time availability and per-user pages need explicit domain/backend/authentication extensions. They should not be promised as configuration-only additions. Likewise, strict data-location requirements need a review across Cloudflare, AWS, GitHub and Tina; an SES EU region alone does not establish the location of the entire data flow.

Nurture is optional and remains blocked on reviewed real messages. If enabled later, verify actual Workflow limits and lifecycle behavior rather than extrapolating from the enquiries profile. See [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/).

## Recommended sequence

1. **Select the deployment contract.** Keep static Astro + Workers Static Assets. Decide whether Free is a supported backend target or Paid is the production baseline, and define account ownership and expected client counts.
2. **Fix deployable code boundaries.** Address A1/A3, make backend work fit explicit invocation budgets and add output inventory checks. Preserve the current design and CMS/content ownership.
3. **Implement isolated hosted packaging.** Address A2/A4/A8 with a real Tina cloud build, explicit branch/media strategy, environment bindings, guarded migrations and a reproducible artifact. This can be prepared before entering real resource IDs.
4. **Use one authorized disposable staging deployment as the proof.** Exercise static routing, effective CSP, signed Access/Tina login, native saves/uploads, build-to-public propagation, real Turnstile verification and deliberately full backend batches. Capture CPU, query/row usage and queue behavior. Actual provisioning still requires the missing owner inputs and separate authorization.
5. **Complete operational release gates.** Provider readiness, alerts/recovery, retention/deletion, legal/content review and rollback proof follow the existing production checklist. Do not remove its unconditional block merely because a dry-run succeeds.

No wholesale rewrite is recommended. Hosted boundary validation and a clear supported resource budget should precede further feature expansion.

## Verification scope and uncertainties

The source snapshot and live headers above were inspected on the research date. No new application test/build run was performed: this was a documentation-only audit, and the existing CMS launcher was kept running. Previous local test results are not presented as fresh hosted evidence.

No remote account, SES quota, Cloudflare bill, actual hosted CPU measurement or production Tina save was available to inspect. The full-dispatch query count is source arithmetic, not a hosted failure reproduction. Media branch semantics must be confirmed against the selected Tina plan and installed integration. Provider terms/limits can change; use the linked official pages when selecting deployment settings.
