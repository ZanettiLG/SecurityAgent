---
context: fork
name: new-api-route
description: Scaffolds a new Express API route in the Audiobooker backend — Zod validation, { ok, data } envelope, SSE streaming boilerplate, and server.ts registration. Use when the user asks to create a new endpoint, add an API route, or scaffold a backend handler.
applyTo: "backend/src/api/**"
---

# New API Route — Audiobooker Backend Scaffold

## Overview

Every route in the Audiobooker backend follows the same conventions. This skill produces a complete, ready-to-mount Express Router file (and registers it in `server.ts`) following all project standards.

## Route Archetypes

The project has **4 route archetypes**. Choose the one that matches the user's intent:

| # | Archetype | When to use | Example |
|---|-----------|-------------|---------|
| 1 | **Simple GET** | Read-only, no input validation needed | `GET /api/health`, `GET /api/voices` |
| 2 | **POST with Zod** | Synchronous action — validate body, run pipeline, return result | `POST /api/correct`, `POST /api/segment` |
| 3 | **POST start + GET SSE stream** | Async/long-running action — start a job, poll via SSE | `POST /api/narrate/start` + `GET /api/narrate/stream` |
| 4 | **GET with Zod query** | Read with validated query params | `GET /api/download/:projectId?format=mp3` |

---

## Archetype 1: Simple GET

```ts
import { Router } from 'express';

export const myRouter = Router();

myRouter.get('/', async (_req, res, next) => {
  try {
    const data = await someService.getSomething();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});
```

**Rules:**
- Use `_req` (underscore-prefixed) for unused params.
- Always `try/catch` → `next(err)` (never let exceptions escape).
- Always wrap response in `{ ok: true, data }`.

---

## Archetype 2: POST with Zod Validation

```ts
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../middleware/error-handler.js';
import * as persistence from '../../services/persistence.service.js';
import { validateTransition } from '../../services/state-machine.js';

export const myRouter = Router();

const mySchema = z.object({
  projectId: z.string(),
  text: z.string().min(1, 'Text cannot be empty'),
  language: z.string().optional().default('pt-BR'),
});

myRouter.post('/', async (req, res, next) => {
  try {
    const body = mySchema.parse(req.body);

    // 1. Look up project & validate existence
    const project = await persistence.getProject(body.projectId);
    if (!project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404);

    // 2. Validate state transition (skip if route doesn't change status)
    validateTransition(project.status, 'TARGET_STATE');

    // 3. Execute business logic
    const result = await somePipeline(body);

    // 4. Persist new status & results
    await persistence.updateProject(body.projectId, { status: 'TARGET_STATE' });
    // await minio.upload(...)  // if storing artifacts

    // 5. Respond
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});
```

**Rules:**
- Zod schema is **always** a `const` at module scope (never inline in handler).
- Use `z.string().min(1, ...)` for required strings, `z.string().optional()` for optional.
- Use `z.enum([...])` for constrained values, `z.array(...)` for lists.
- **Always** check project existence after lookup.
- **Always** call `validateTransition` before mutating project status.
- `.js` extension on all relative imports (NodeNext ESM requirement).
- `AppError(code, message, statusCode)` — CODE is `SCREAMING_SNAKE_CASE`.

---

## Archetype 3: POST Start Job + GET SSE Stream

### 3a. POST — Start the background job

```ts
import { Router } from 'express';
import { z } from 'zod';
import { startMyPipeline, type MyProgressData } from '../../pipeline/my.pipeline.js';
import { AppError } from '../../middleware/error-handler.js';
import * as persistence from '../../services/persistence.service.js';
import { validateTransition } from '../../services/state-machine.js';

export const myRouter = Router();

const mySchema = z.object({
  projectId: z.string(),
  text: z.string().min(1, 'Text cannot be empty'),
  language: z.string().optional().default('pt-BR'),
});

/**
 * POST /api/my/start
 *
 * Starts the pipeline as a background job.
 * Returns { jobId } for polling via GET /api/my/stream?jobId=...
 */
myRouter.post('/start', async (req, res, next) => {
  try {
    const body = mySchema.parse(req.body);
    const project = await persistence.getProject(body.projectId);
    if (!project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404);

    validateTransition(project.status, 'my_state');

    await persistence.updateProject(body.projectId, { status: 'my_state' });

    const jobId = startMyPipeline({
      projectId: body.projectId,
      text: body.text,
      language: body.language,
    });

    res.json({ ok: true, data: { jobId } });
  } catch (err) {
    next(err);
  }
});
```

### 3b. GET — SSE progress stream

```ts
/**
 * GET /api/my/stream?jobId=...
 *
 * Server-Sent Events stream for pipeline progress.
 *
 * Events:
 * - progress: { phase, processedChunks, totalChunks }
 * - complete: { result }
 * - error: { code, message }
 */
myRouter.get('/stream', (req, res) => {
  const jobId = req.query['jobId'] as string;
  if (!jobId) {
    res.status(400).json({ ok: false, error: { code: 'MISSING_JOB_ID', message: 'jobId query param required' } });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let closed = false;
  res.on('close', () => { closed = true; });

  function sendEvent(event: string, data: unknown) {
    if (closed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const interval = setInterval(async () => {
    if (closed) { clearInterval(interval); return; }

    const job = jobQueue.getJob(jobId);

    if (!job) {
      sendEvent('error', { code: 'JOB_NOT_FOUND', message: 'Job not found' });
      clearInterval(interval);
      res.end();
      return;
    }

    if (job.status === 'failed') {
      const errorMessage = (job.data as Record<string, unknown>)?.['_error'] || 'Pipeline failed';
      sendEvent('error', { code: 'PIPELINE_FAILED', message: String(errorMessage) });
      clearInterval(interval);
      res.end();
      return;
    }

    const progress = job.data as unknown as MyProgressData;
    if (progress) {
      sendEvent('progress', progress);
    }

    if (job.status === 'completed') {
      // Update project status on completion
      if (progress?.result) {
        const projectId = (job.data as Record<string, unknown>)?.['projectId'] as string | undefined;
        if (projectId) {
          try {
            await persistence.updateProject(projectId, { status: 'completed_state' });
            await minio.upload(`markdown/${projectId}/output.md`, progress.result);
          } catch {
            // non-critical: already handled in pipeline
          }
        }
      }
      sendEvent('complete', { result: progress?.result ?? '' });
      clearInterval(interval);
      res.end();
    }
  }, 500);
});
```

**SSE Rules:**
- Poll every **500ms** with `setInterval`.
- Use `closed` flag + `res.on('close')` to stop polling.
- `sendEvent` helper writes `event: <name>\ndata: <json>\n\n`.
- **Always** handle 3 job states: `!job` (not found), `failed`, `completed`.
- On completion, update project status and upload artifacts (wrap in try/catch — non-critical).
- Import `jobQueue` from `../../services/job-queue.js`.
- Import `minio` from `../../services/minio.service.js` if uploading artifacts.

**Alternative SSE (AsyncIterable):** If the pipeline returns an `AsyncIterable<Event>` instead of using `jobQueue`, use a `for await` loop instead of `setInterval`. See `backend/src/api/generate/stream/route.ts` for the pattern.

---

## Archetype 4: GET with Zod Query Validation

```ts
import { Router } from 'express';
import { z } from 'zod';

export const myRouter = Router();

const querySchema = z.object({
  format: z.enum(['wav', 'mp3']).optional().default('mp3'),
});

myRouter.get('/:projectId', async (req, res, next) => {
  try {
    const { format } = querySchema.parse(req.query);
    // ... use format
    res.json({ ok: true, data: { format } });
  } catch (err) {
    next(err);
  }
});
```

**Rules:**
- `.parse(req.query)` for GET params; `.parse(req.body)` for POST.
- Zod enums for constrained string params.

---

## Registration in `server.ts`

After creating the route file, register it in `backend/src/server.ts`:

```ts
import { myRouter } from './api/my/route.js';

// ...

app.use('/api/my', myRouter);
```

If the route has a nested SSE stream router, register both:

```ts
import { myRouter } from './api/my/route.js';
import { myStreamRouter } from './api/my/stream/route.js';

app.use('/api/my', myRouter);
app.use('/api/my/stream', myStreamRouter);
```

---

## Global Conventions (ALL archetypes)

| Rule | Detail |
|------|--------|
| **Import extensions** | All relative imports MUST end with `.js` (NodeNext ESM) |
| **Router export** | Named export: `export const xRouter = Router()` |
| **Error handling** | `try/catch` → `next(err)`; never let exceptions escape |
| **Known errors** | `throw new AppError('CODE', 'message', httpStatus)` |
| **Success envelope** | `res.json({ ok: true, data })` |
| **Error envelope** | `{ ok: false, error: { code, message } }` (handled by `errorHandler` middleware) |
| **Zod schemas** | Module-level `const`, always before handlers |
| **Project lookup** | Always check `if (!project) throw new AppError(...)` |
| **State transitions** | `validateTransition(project.status, 'new_status')` before mutations |
| **Status update** | `await persistence.updateProject(projectId, { status: '...' })` |
| **JSDoc** | Add `/** POST /api/my */` doc comment above each handler |

---

## Step-by-Step Scaffold Checklist

When asked to create a new route, follow these steps:

1. **Determine the archetype** — is it a simple read? A sync action? An async job with SSE?
2. **Create the directory** — `backend/src/api/<domain>/` (and `<domain>/stream/` if SSE).
3. **Create `route.ts`** — use the archetype template above.
4. **Define the Zod schema** — `projectId`, `text`, `language` as needed.
5. **Wire up persistence** — `getProject()`, `updateProject()`, `validateTransition()`.
6. **Wire up the pipeline/service** — import or scaffold the business logic.
7. **Add SSE stream** (if archetype 3) — polling pattern with `jobQueue` or `for await`.
8. **Register in `server.ts`** — import + `app.use()`.
9. **Update state machine** (if new states) — add transitions to `state-machine.ts`.
10. **Update `ProjectStatus` type** (if new states) — add to `types/index.ts`.

---

## State Machine Reference

Valid transitions (from `backend/src/services/state-machine.ts`):

```
draft → correcting
correcting → corrected | correction_failed
correction_failed → correcting
corrected → narrating | segmenting | correcting
narrating → narrated | narration_failed
narration_failed → narrating
narrated → segmenting | narrating
segmenting → segmented
segmented → generating
generating → complete | generation_partial
generation_partial → generating
complete → (terminal)
```

If your route introduces a new status, you MUST add it to both `ProjectStatus` in `types/index.ts` and `VALID_TRANSITIONS` in `state-machine.ts`.
