---
name: new-frontend-page
description: >
  Scaffolds a Next.js 14 App Router page in the Audiobooker frontend with the
  SSE pattern (POST → jobId → EventSource → dispatch), MUI v6 + Emotion styling,
  and useReducer context integration. Use when the user asks to create a new
  page, add a new workflow step, or implement a new pipeline-backed feature
  in the frontend.
applyTo: "frontend/app/**/page.tsx"
---

# New Frontend Page — Audiobooker Skill

## When to Use

- Creating a new `page.tsx` under `frontend/app/`
- Adding a new pipeline-backed workflow step (correction, narration, generation, etc.)
- Implementing any feature that follows the POST → jobId → SSE stream → dispatch pattern

## Prerequisites (read these files first)

Before scaffolding, read the current state of these files to ensure consistency:

| File | Purpose |
|------|---------|
| `frontend/lib/types.ts` | Type definitions — check if new types are needed |
| `frontend/lib/context.tsx` | Reducer + actions — check if new actions are needed |
| `frontend/lib/api.ts` | API client wrappers (`apiGet`, `apiPost`, `apiUpload`, `API_URL`) |
| `frontend/app/layout.tsx` | Root layout — pages are wrapped in `<ProjectProvider>` |
| `backend/src/api/<domain>/route.ts` | Backend POST route (returns `{ jobId }`) |
| `backend/src/api/<domain>/stream/route.ts` | Backend SSE stream route (emits `progress`/`complete`/`error`) |

## Step-by-Step Scaffolding Process

### Step 1: Determine the Page Route

Decide where the page lives in the App Router:

| Pattern | Example | When |
|---------|---------|------|
| `frontend/app/<name>/page.tsx` | `/projects` | Standalone list/index page |
| `frontend/app/<name>/[id]/page.tsx` | `/editor/[id]` | Project-scoped page (needs `useParams`) |

### Step 2: Check if New Types, Actions, or API Functions Are Needed

**Types** (`frontend/lib/types.ts`):
- If the backend SSE stream emits a new progress shape, add a new interface (e.g., `MyProgressData`)
- If the backend returns a new result shape, ensure it's typed

**Reducer actions** (`frontend/lib/context.tsx`):
- Add new action types to `ProjectAction` union (e.g., `MY_PROGRESS`, `MY_COMPLETE`)
- Add new state fields to `ProjectState` if needed
- Add new `case` branches in `projectReducer`

**API functions** (`frontend/lib/api.ts`):
- Existing `apiGet`, `apiPost`, `apiUpload`, `apiPostRaw`, `apiDelete` cover most cases
- Only add a new wrapper if the existing ones don't fit (e.g., PUT, PATCH)

### Step 3: Scaffold the Page File

Use this template as the starting structure:

```typescript
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, LinearProgress, Paper, Alert,
  CircularProgress,
} from '@mui/material';
import { useProject } from '<relative-path>/lib/context';
import { API_URL, apiGet, apiPost } from '<relative-path>/lib/api';
import type { Project, MyProgressData } from '<relative-path>/lib/types';

export default function MyNewPage() {
  // --- Hooks ---
  const params = useParams();        // Only if using [id] route
  const router = useRouter();
  const { state, dispatch } = useProject();

  // --- Local state ---
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // --- Refs ---
  const eventSourceRef = useRef<EventSource | null>(null);

  // --- Load project on mount ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiGet<{ project: Project; /* extra fields */ }>(
          `/api/projects/${params['id']}`  // only if [id] route
        );
        if (!cancelled && response.ok && response.data) {
          dispatch({ type: 'LOAD_PROJECT', project: response.data.project });
          // Restore any saved state...
        }
      } catch {
        // Silently handle — error display is optional
      } finally {
        if (!cancelled) setMounted(true);
      }
    }

    load();

    return () => {
      cancelled = true;
      eventSourceRef.current?.close();
    };
  }, [params, dispatch]);

  // --- SSE-backed action ---
  async function handleStartPipeline() {
    setLoading(true);
    setErrorMessage(null);
    eventSourceRef.current?.close();

    try {
      // 1. POST to start the job
      const response = await apiPost<{ jobId: string }>('/api/<domain>/start', {
        projectId: params['id'],
        // ... other payload fields
      });

      if (!response.ok || !response.data) {
        setErrorMessage(response.error?.message || 'Falha ao iniciar');
        setLoading(false);
        return;
      }

      const { jobId } = response.data;

      // 2. Open SSE stream
      const eventSource = new EventSource(
        `${API_URL}/api/<domain>/stream?jobId=${jobId}`
      );
      eventSourceRef.current = eventSource;

      // 3. Handle progress events
      eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        dispatch({ type: 'MY_PROGRESS', progress: data });
      });

      // 4. Handle completion
      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        dispatch({ type: 'MY_COMPLETE', /* result fields */ });
        eventSource.close();
        setLoading(false);
      });

      // 5. Handle errors
      eventSource.addEventListener('error', (e) => {
        eventSource.close();
        setLoading(false);
        try {
          const data = JSON.parse((e as MessageEvent).data);
          setErrorMessage(data.message || 'Erro no servidor');
        } catch {
          setErrorMessage('Conexão perdida com o servidor');
        }
      });

    } catch {
      setErrorMessage('Erro de rede');
      setLoading(false);
    }
  }

  // --- Render guard ---
  if (!mounted) return null;

  // --- Main render ---
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Título da Página
      </Typography>

      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ my: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {loading && (
        <Box sx={{ my: 2 }}>
          <LinearProgress />
        </Box>
      )}

      <Button
        variant="contained"
        onClick={handleStartPipeline}
        disabled={loading}
      >
        Iniciar
      </Button>

      {/* Page-specific content here */}
    </Box>
  );
}
```

### Step 4: Wire Up Navigation

Add a link or button to navigate to the new page from existing pages (e.g., `frontend/app/editor/[id]/page.tsx` or `frontend/app/projects/page.tsx`).

### Step 5: Add Backend Routes (If Needed)

If the backend doesn't yet have the corresponding route:

1. **POST route** (`backend/src/api/<domain>/route.ts`):
   - Zod validation via `.parse()`
   - `validateTransition(project.status, '<target_status>')`
   - `startPipeline(...)` returns a `jobId`
   - Response: `{ ok: true, data: { jobId } }`

2. **Stream route** (`backend/src/api/<domain>/stream/route.ts`):
   - Query param: `jobId`
   - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
   - Poll `jobQueue.getJob(jobId)` on interval
   - Send `event: progress\ndata: ...\n\n`, `event: complete\ndata: ...\n\n`, `event: error\ndata: ...\n\n`
   - Clean up interval on `res.on('close', ...)`

## Conventions Checklist

After scaffolding, verify:

- [ ] File starts with `'use client'`
- [ ] All labels and buttons use **Portuguese** (e.g., "Iniciar", "Carregar", "Falha ao...")
- [ ] `API_URL` from `lib/api.ts` is used for EventSource (never hardcoded `localhost:3001`)
- [ ] `eventSourceRef.current?.close()` is called in the useEffect cleanup
- [ ] The `mounted` guard (`if (!mounted) return null`) prevents hydration mismatches
- [ ] Error states show a dismissible `<Alert severity="error">`
- [ ] Loading state shows `<LinearProgress />` (determinate if progress data available, indeterminate otherwise)
- [ ] `useProject().dispatch` is used for all state changes (no local `useState` for project-scoped data)
- [ ] New types are added to `frontend/lib/types.ts`, not defined locally in the page
- [ ] New reducer actions follow the existing naming convention (`LOAD_PROJECT`, `SET_ORIGINAL_TEXT`, `CORRECTION_COMPLETE`, etc.)
- [ ] Relative imports use the correct depth (`../../lib/context` from `app/<name>/[id]/`, `../lib/context` from `app/<name>/`)

### SSE Event Name Variations

The backend uses two SSE patterns. Match your frontend listeners to the backend:

| Backend pattern | Event names | Example route |
|-----------------|-------------|---------------|
| **Polling** (job queue) | `progress`, `complete`, `error` | `/api/correct/stream`, `/api/narrate/stream` |
| **Async iterator** | Custom (e.g., `segment_start`, `segment_complete`, `batch_complete`, `error`) | `/api/generate/stream` |

Always read the backend stream route to confirm the exact event names before writing frontend listeners.

### Synchronous vs SSE-backed Handlers

Not every pipeline step needs SSE. Some are synchronous:

```typescript
// Synchronous POST (no SSE) — used for fast operations like segmentation
async function handleSync() {
  setLoading(true);
  try {
    const response = await apiPost('/api/segment', { projectId: params['id'], text, language });
    if (response.ok) {
      dispatch({ type: 'SEGMENTATION_COMPLETE', segmentation: response.data });
    } else {
      setErrorMessage(response.error?.message || 'Falha na operação');
    }
  } catch {
    setErrorMessage('Erro de rede');
  } finally {
    setLoading(false);
  }
}
```

Use synchronous POST when the operation completes in under ~2 seconds. Use SSE for anything longer.

## Common Pitfalls

1. **SSE `error` event shape**: The `MessageEvent` from SSE may or may not have `.data`. Always wrap `JSON.parse` in a try/catch and provide a fallback message.
2. **EventSource on close**: Calling `.close()` on an already-closed EventSource is safe, but always check the ref before creating a new one. Always close the previous EventSource before opening a new one: `eventSourceRef.current?.close()`.
3. **Double-mount in Strict Mode**: React 18 Strict Mode mounts effects twice in development. The `mounted` guard pattern combined with the `cancelled` flag handles this.
4. **Import extensions**: Unlike the backend, the frontend (Next.js) does NOT require `.js` extensions on relative imports.
5. **Loading state persistence**: If the user navigates away mid-stream, the SSE `close` in the cleanup function fires, but the backend job continues. This is intentional — the zombie cleanup on backend startup handles orphaned jobs.
6. **Progress data shape**: When the backend sends `progress` events, the data shape varies by pipeline. Read the backend's progress type (e.g., `CorrectionProgressData`, `NarrationProgressData`) to know which fields are available for determinate progress bars.
7. **`batch_complete` vs `complete`**: The generation pipeline uses `batch_complete` (not `complete`). Always verify the event name against the backend stream route.

## Example Prompts

- "Create a new page for the text summarization workflow"
- "Add a review step after narration before proceeding to segmentation"
- "Build a settings page that uses the project context"
- "Create a page to preview the audiobook before final generation"
