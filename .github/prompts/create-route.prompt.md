---
description: "Scaffold a new Express API route following the Controller + Validate pattern. Use when creating a new endpoint."
agent: coder
tools: ['read', 'edit', 'search']
---

# Create API Route

Create a new route at `backend/src/api/${input:domain}/route.ts`.

## Requirements

- Use `controller()` wrapper from `../../middleware/controller.js`
- Use `validate()` middleware from `../../middleware/validate.js`
- Define Zod schemas for all inputs (body, query, params)
- Access services via `req.deps` — never import directly
- Use ESM `.js` extensions on all relative imports
- Return `{ data }` or `{ status, data }` from handlers
- The route will be auto-discovered by `route-loader.ts`

## Template

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { controller } from '../../middleware/controller.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// ── Schemas ────────────────────────────────────────────

const createSchema = z.object({
  // define your fields here
});

// ── Routes ─────────────────────────────────────────────

router.get('/', controller(async (req) => {
  const items = await req.deps.repositories.${input:domain}.findAll();
  return { data: items };
}));

router.post('/', validate({ body: createSchema }), controller(async (req) => {
  const created = await req.deps.repositories.${input:domain}.create(req.body);
  return { status: 201, data: created };
}));

export default router;
```

After creating the route, add tests and verify with `cd backend && npm test`.
