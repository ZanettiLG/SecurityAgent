---
description: "Run the full test suite and report formatted results. Use when verifying changes."
agent: task-test-runner
tools: ['execute', 'read']
---

# Run Tests

Run the complete test suite for the Audiobooker monorepo.

## Execution

1. Backend tests:
```
cd backend && npx vitest run --reporter=verbose
```

2. Frontend tests:
```
cd frontend && npx vitest run --reporter=verbose
```

3. E2E tests (optional, requires Docker):
```
npx playwright test
```

## Expected Baseline

- Backend: 330/330 tests passing
- Frontend: 2/2 tests passing

Report any deviations from baseline with specific failure details (file, test name, error message).
