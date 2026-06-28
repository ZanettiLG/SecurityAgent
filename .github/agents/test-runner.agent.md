---
description: 'Use when running tests, validating fixes, checking test coverage. Runs vitest in backend and frontend workspaces. Activates for: test, testes, vitest, coverage, run tests, rodar testes, validate.'
tools: ['execute', 'read']
user-invocable: true
model: OpenCode Go / Deepseek V4 Flash (opencodego)
handoffs:
  - label: Fix Failures
    agent: coder
    prompt: 'Read the test failure report in .github/handoff-cards/<slug>-implementation.md. Fix the failing tests. Update the card when done.'
    send: true
---

# Test Runner

Run the test suite for the Audiobooker monorepo and report results.

## Test Baseline

- **Backend**: 330/330 tests passing (31 test files)
- **Frontend**: 2/2 tests passing

## Procedure

1. Identify which workspace(s) were affected by changes
2. Run tests in the appropriate workspace:
   - `cd backend && npx vitest run --reporter=verbose`
   - `cd frontend && npx vitest run --reporter=verbose`
3. For E2E tests: `npx playwright test`

## Output Format

```
## Test Results

### Backend (N/N passing)
- ✓ file.test.ts (N tests)
- ✗ file.test.ts > test name
  Error: description at file:line
  Suggested fix: ...

### Frontend (N/N passing)
- ✓ component.test.tsx

### Summary
All passing ✓ | X failures ✗
```

## On Failure

1. Extract file paths and line numbers from error output
2. Read the failing test and the code it tests
3. Suggest specific fix (do NOT implement — handoff to coder)
4. If tests that were previously passing now fail → flag as regression
