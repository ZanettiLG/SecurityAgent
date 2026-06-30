---
description: "Use when working on backend routes, services, middleware, pipeline, or API code. Covers DI pattern, controller+validate, ESM .js, error hierarchy, and route auto-discovery."
applyTo: "backend/src/**"
---

# Backend Conventions (Audiobooker)

## Route Pattern

```typescript
import { Router } from 'express';
import { controller } from '../../middleware/controller.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const schema = z.object({ /* ... */ });

router.post('/action', validate({ body: schema }), controller(async (req) => {
  // Access services via req.deps
  const result = await req.deps.repositories.example.create(req.body);
  return { data: result };
}));

export default router;
```

## Critical Rules

1. **DI via `req.deps`**: Never import services directly. Use `req.deps.repositories.*` or `req.deps.persistence.*`.
2. **Controller wrapper**: All handlers wrapped in `controller()`. No manual try/catch.
3. **Validate middleware**: All inputs validated with Zod via `validate()`.
4. **ESM `.js` extensions**: All relative imports MUST use `.js` extension.
5. **Error hierarchy**: Use `HttpError` subclasses, never `throw new Error()`.
6. **Route auto-discovery**: Create folder + `route.ts`, don't edit `app.ts`.

## Services Access

| Need | Use |
|------|-----|
| CRUD operations | `req.deps.repositories.projects.findAll()` |
| Domain operations | `req.deps.persistence.saveCorrections()` |
| Job queue | `req.deps.jobQueue.createJob('correction')` |
| State machine | `req.deps.stateMachine.canTransition(from, to)` |
| LLM chains | `req.deps.llm.invoke(prompt)` |
| TTS | `req.deps.tts.synthesize(text)` |
| Storage | Via repositories (abstracted) |
