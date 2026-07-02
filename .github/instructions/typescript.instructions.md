---
description: "Use when writing TypeScript code. Covers strict mode, type safety, ESM imports, and zod validation."
applyTo: "**/*.ts", "**/*.tsx"
---

# TypeScript Conventions (Audiobooker)

## Strict Mode

- `strict: true` in `tsconfig.base.json` — **never weaken types**
- No `any`. Use `unknown` + type guards instead
- Prefer inferred types when possible; explicit when public API

## ESM Module Resolution

- `moduleResolution: "NodeNext"` in tsconfig
- All relative imports MUST use `.js` extension:
  ```typescript
  // ✓ Correct
  import { foo } from './bar.js';
  import { baz } from '../../utils/helper.js';

  // ✗ Wrong — will crash at runtime
  import { foo } from './bar';
  ```

## Zod for Runtime Validation

- All external inputs validated with Zod schemas
- API request/response types inferred from Zod schemas:
  ```typescript
  const schema = z.object({ name: z.string(), age: z.number().min(0) });
  type Input = z.infer<typeof schema>;
  ```

## Barrel Exports

- `types/index.ts` re-exports all domain types
- `stores/index.ts` re-exports stores
- `services/index.ts` wires factories

## Anti-patterns

- `as any` / `as unknown as T` — use proper type guards
- `!` non-null assertions — use optional chaining
- `@ts-ignore` — fix the actual type error
