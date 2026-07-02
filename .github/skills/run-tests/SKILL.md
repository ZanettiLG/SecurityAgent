---
name: run-tests
description: 'Runs the test suite for the Audiobooker monorepo and reports results.'
---

# run-tests

## Procedure

1. `cd backend && npx vitest run --reporter=verbose`
2. `cd frontend && npx vitest run --reporter=verbose`
3. If all pass (baseline: 330 backend, 2 frontend), report success
4. If failures exist, extract file:line and error message for each
5. Suggest which files to investigate based on failure patterns
