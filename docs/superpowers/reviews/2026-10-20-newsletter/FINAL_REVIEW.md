# Independent final newsletter review

Reviewed range: `61e52ae..9e62cc6`. Reviewer: fresh `gpt-6-astra`, medium effort, read-only. No reviewer files or running services were modified. Initial verdict: changes required; one Important, no Critical.

## Important: cached navigation left dead controls

`site-entry.ts` destroyed newsletter enhancement on pagehide without a pageshow restoration path. Teardown left forms/buttons visible and Contact fallbacks hidden. Cached Back/Forward navigation could therefore leave inert controls and permit a default GET submission with email/consent in the URL.

Accepted and fixed in one author fix pass. A small lifecycle connector handles asynchronous imports, teardown and restoration without duplicate handlers. Teardown restores hidden controls/visible fallbacks, pending responses cannot announce acceptance after destruction, and forms defensively use POST. Existing motion behavior is preserved.

The author observed RED before the correction: browser teardown left the footer form visible; the pending-response regression incorrectly returned accepted. The lifecycle module was missing before implementation. All 10 focused unit tests then passed. The root and site suite subsequently passed 967 +41 tests (1008), with one existing conditional skip, and fresh type/site checks and build passed.

A real full-Chromium Back navigation retained the original document marker and emitted persisted pageshow. The restored page made exactly one intercepted signup request, restored preferences interaction and never navigated with email in its URL. Simulated persisted events also prove the fallback reset/restoration boundary. The normal headless shell reloaded instead of caching; full Chromium's driver goBack load wait stalled, so the successful test uses actual history.back and checks the restored document rather than waiting for a fresh load event. These harness failures are retained, not presented as passing cache evidence. The successful run is archived under `runner/review-fix/browser`.

No second independent review was commissioned, as agreed. The fix is author-verified with RED/GREEN and a green suite; the initial independent verdict is not relabeled as a fresh independent approval.

## Deferred Minor

`docs/NEWSLETTER.md` displays `visitor:v 1` where the actual key is `visitor:v1`. Runtime behavior and the Preferences reset control use the correct key. This documentation typo remains deferred under the accepted executing-plans workflow, which keeps Minor findings outside the fix pass.

## Declined-to-judge rulings

- Hosted protection/provider integration, sending, deployment and legal compliance remain outside this slice. Cost: hosted signup requires separate configuration/review.
- Cross-engine focus and genuine OS-level backgrounding are not certified. Cost: current proof is Chromium and simulated document visibility.
- Backend confirmation/token presentation remains English. Cost: Greek recipients can see English backend copy.
- Fresh blank-object CMS authoring is not claimed. Cost: that specific UI initialization path remains unproven; defaults, real indexed validation and native build have coverage.
- Cross-tab suppression stays best effort. Cost: simultaneous tabs can race; localStorage is not an atomic lock.
