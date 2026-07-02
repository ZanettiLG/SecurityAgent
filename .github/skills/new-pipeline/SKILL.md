---
name: new-pipeline
description: >-
  Scaffolds a new pipeline in the Audiobooker project following the established pattern
  (correction/narration/generation style). Activates when the user asks to create a pipeline,
  add a processing step, or mentions job queue, concurrency, or SSE progress streaming.
---

# New Pipeline — Audiobooker Skill

## When to Use

- Creating a new pipeline file under `backend/src/pipeline/`
- Adding async processing step with SSE progress streaming
- User asks for: "pipeline", "job queue", "SSE", "concurrentMap", "background worker"

## Architecture

Every pipeline follows the same layered architecture:

```
API route   →  startXxxPipeline()  →  jobQueue.createJob()
                          ↓
                 runXxxInBackground()  ←  worker with concurrentMap()
                          ↓
                 jobQueue.updateProgressData()  →  SSE stream to frontend
```

Two modes: **Sync** (`POST /`) returns result directly. **Async** (`POST /start` + `GET /stream`) returns `jobId`, streams via SSE.

## Scaffolding Checklist

### Step 1: Types (`backend/src/types/index.ts`)

- Add status to `ProjectStatus` union (e.g., `'my_processing' | 'my_processing_failed' | 'my_processed'`)
- Add result interfaces

### Step 2: State Machine (`backend/src/services/project-machine.ts`)

- Add event types to `ProjectMachineEvent`
- Add states to the machine's `states` object
- Add transitions with guards

### Step 3: Pipeline (`backend/src/pipeline/my.pipeline.ts`)

```typescript
import { concurrentMap } from '../../utils/concurrent-map.js';

export interface MyPipelineOptions {
  llm: ChatOpenAI;
  jobQueue: JobQueue;
  concurrency?: number;
}

export async function runMyPipeline(items: Item[], options: MyPipelineOptions): Promise<Result[]> {
  return concurrentMap(items, options.concurrency || 4, async (item) => {
    // Process item
    return result;
  });
}
```

### Step 4: API Route (`backend/src/api/my/route.ts`)

- `POST /start` → async mode with SSE
- `GET /stream?jobId=` → SSE endpoint

### Step 5: Tests (`backend/src/__tests__/my.pipeline.test.ts`)

- Test sync and async paths
- Test concurrency behavior
- Test error handling
