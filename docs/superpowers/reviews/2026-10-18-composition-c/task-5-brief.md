## Task 5: Generic enquiry contexts and Worker compatibility

**Files:** Create enquiry-contexts runtime/declarations; modify scripts/manifest runtime/declarations, templates/ContactForm.astro, worker/index.ts and actual manifest consumers/types found by rg. Add tests/enquiry-contexts.test.ts; extend tests/manifest.test.ts, tests/offering-contact.test.ts and backend tests. Add e2e/composition-c-worker.spec.ts.

**Interfaces:** Produce getEnquiryContexts, getAcceptedEnquiryContexts and manifest.enquiryContexts exactly as above. Room CTA uses the existing contact preselection query parameter and contextId request field; keep existing Offering links and D1 storage compatible. Backend acceptance is the union of publicly eligible locales, matching current Offering semantics; it does not trust a client-supplied locale.

- [ ] Write tests for Offering compatibility, Room EN-only/EL-only publication, index schedule, unknown/draft/disabled IDs and collision rejection. Assert manifest legacy arrays unchanged and contexts generated from the same localized projection. Pin form option titles and preselection to localized contexts.
- [ ] Run focused tests and verify failure on the old Offering-only validation.
- [ ] Implement the generic projection once; consume it in form and Worker allowlist. Keep arbitrary/unknown URL query values unselected; direct API unknown context fails. Preserve bounded contextId schema, idempotency, consent, origins, Turnstile, access roles and disabled sending.
- [ ] Against an owned local Worker/D1, exercise valid Offering/Room capture and invalid/draft/disabled context rejection. Assert expected stored scalar contextId, no duplicate on retry and no external send. Run relevant existing backend regression tests; no migration or unrelated newsletter replay unless changed boundaries require it.
- [ ] Commit as feat: share registered enquiry contexts across forms and worker; obtain independent review.
