# Local runtime budget implementation evidence

Status: local acceptance in progress; hosted qualification pending. This record will be finalized after profile/client lifecycle verification and the independent whole-change review.

Node 24.12.0, pnpm 10.13.1, Wrangler 4.148.0, Vitest 5.0.3 and Playwright 1.63.0. No hosted resources, real sends or account changes are authorized by these checks.

Completed so far: `pnpm check` (75 Astro files, no diagnostics), `pnpm test` (1145 main tests passed, one existing skipped; 44 site tests passed), `pnpm build`, `pnpm worker:check`, `pnpm test:runtime-budgets`, local admin Playwright (3 tests) and static routing acceptance. A missing-D1 routing regression was reproduced and fixed before acceptance. Initialized-client/profile runs and final review are pending.

The disposable native D1/Queue harness ran 16 ticks/profile across four UTC admission days. Maximum scheduled SQL: enquiries 24, newsletter 29, nurture 31, including observations. Independent D1 metadata is local runtime evidence, not billed cloud totals. Native Queue duplicate publication did not resend, synthetic preclaim exhaustion requested retry, and expired sending leases stayed unknown. Workflow reconciliation is substituted in this harness; hosted Workflow/CPU qualification remains pending. Unit fixtures additionally cover combined lane saturation, 500/5,000/50,000 audiences, atomic allowance concurrency, failures, consent/generation/approval races and unknown outcomes. Raw owned traces are regenerated under `.generated/evidence/runtime-budgets/`.
