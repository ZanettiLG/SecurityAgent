---
description: "Use when writing tests with Vitest. Covers test structure, mocks, assertions, and baseline expectations."
applyTo: ["**/*.test.ts", "**/__tests__/**"]
---

# Testing Conventions (Audiobooker)

## Structure

- One `describe` block per file/module under test
- `it` blocks for each test case
- Test descriptions in **Portuguese** (user-facing convention)
- Tests in `__tests__/` folders mirroring `src/` structure

## Vitest Patterns

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ServiceName', () => {
  let mockDep;

  beforeEach(() => {
    mockDep = { /* minimal mock */ };
  });

  it('deve retornar dados quando a operação é bem sucedida', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('deve lançar NotFoundError quando recurso não existe', async () => {
    expect(() => /* ... */).rejects.toThrow(NotFoundError);
  });
});
```

## Mock Strategy

- Mock external dependencies (MinIO, LLM, TTS)
- Use `vi.mock()` for module-level mocks
- Prefer dependency injection for testability
- Use `req.deps` pattern in tests (inject mock deps)

## Baseline

- Backend: 330/330 tests passing (31 test files)
- Frontend: 2/2 tests passing
- Never commit with failing tests
