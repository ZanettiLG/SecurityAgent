# Copilot Instructions — SecurityAgent / Vigia

## Project Overview

**Vigia** is an ambient intelligence system for home security. It learns routines, recognizes behavioral patterns, formulates hypotheses, and dialogues with the user.

**Stack**: TypeScript 5.5+, Node 22+, ESM, Zod, Pino, OpenAI, ChromaDB, Sharp.

## Architecture

```
┌─────────────────────────────────────┐
│           ACTION LAYER               │
│  Notificações | Alarmes | IoT | API  │
├─────────────────────────────────────┤
│          DECISION LAYER              │
│   GOAP Planner | Rule Engine | LLM   │
├─────────────────────────────────────┤
│           MEMORY LAYER               │
│  Vector DB | Event Store | KG        │
├─────────────────────────────────────┤
│         PROCESSING LAYER             │
│  Face/Vehicle Detect | Audio | VAD   │
├─────────────────────────────────────┤
│         PERCEPTION LAYER             │
│     Câmeras | Microfones | Sensores  │
└─────────────────────────────────────┘
```

## Coding Conventions

### TypeScript (strict mode)

- **Strict mode**: `strict: true` in tsconfig.json
- **ESM**: `import`/`export` syntax, `"type": "module"` in package.json
- **No `I` prefix** for interfaces — structural typing
- **No `T` prefix** for types
- **Zod** for input validation
- **Pino** for logging (`import { logger } from "../../core/logger.js"`)
- Domain types in `src/core/types.ts`
- Events via `EventBus` (`src/core/bus.ts`)

### Naming

- `camelCase` for variables and methods
- `PascalCase` for classes, interfaces, types
- `UPPER_SNAKE` for constants and enums `as const`

### File Structure

- One `.ts` file per module
- Interfaces exported, implementations default or named export
- TODO markers for external integrations (hardware APIs, cloud services)

### Backend Routes

- Express + Zod validation (`validate` middleware wrapper)
- Response envelope: `{ ok: true, data }` or `{ ok: false, error }`
- Route auto-discovery via `src/api/registry.ts`
- ESM `.js` extensions in imports
- Dependency injection via `ctx` parameter
- Error hierarchy: `AppError` base → typed subclasses

### Testing (Vitest)

- `describe`/`it` blocks
- Mocks via `vi.mock()` and `vi.fn()`
- Assertions via `expect()`
- Test files alongside source: `*.test.ts`

## Agent System

7 custom agents defined in `.github/agents/*.agent.md`:

| Agent         | Role                  | Model             |
| ------------- | --------------------- | ----------------- |
| main          | Delegador puro (raiz) | OpenCode Go Pro   |
| orchestrator  | Pipeline maestro      | OpenCode Go Pro   |
| researcher    | Codebase exploration  | OpenCode Go Flash |
| planner       | Task decomposition    | OpenCode Go Pro   |
| coder         | Implementation        | mistral-nemo:12b  |
| code-reviewer | PR review             | OpenCode Go Flash |
| test-runner   | Test execution        | OpenCode Go Flash |

## Skills (`.github/skills/`)

- `new-api-route` — Scaffold Express API routes
- `new-chain` — Scaffold LangChain chains
- `new-frontend-page` — Scaffold Next.js App Router pages
- `new-pipeline` — Scaffold processing pipelines
- `run-tests` — Run test suite

## Slash Commands (`.github/prompts/`)

- `handoff` — Initiate agent handoff pipeline
- `create-route` — Create new API route
- `run-tests` — Run tests
- `fix-lint` — Fix lint issues

## LLM Architecture

All LLM calls go through a **single OpenAI-compatible API endpoint** (vLLM, OpenAI, OpenRouter, etc.).

### Configuration (`.env`)

```bash
LLM_BASE_URL=http://localhost:11434/v1   # vLLM, OpenAI, OpenRouter — any OpenAI-compatible
LLM_API_KEY=                              # not needed for local vLLM
LLM_MODEL=minicpm-v4.6                    # must match vLLM's --model
```

### Architecture

```
.env → settings.yaml → config.ts (Zod) → LlmClient (single OpenAI SDK path)
                                                  ↓
                                    new OpenAI({ baseURL, apiKey })
                                    chat.completions.create({ model, messages })
```

- **No provider enum** — `baseUrl` defines the server, not a string enum
- **Single model** — the vLLM container loads one model; code sends that exact name
- **No switch/if** — one code path for all servers (vLLM, OpenAI, OpenRouter are all the same protocol)
- **Thinking models auto-detected** — if model name contains `thinking`, `reasoning`, or `deepseek-r1`, `extra_body: { enable_thinking: true }` is sent

### Docker

```bash
# Start vLLM with GPU
docker compose --profile gpu up -d vllm

# Change model: edit LLM_MODEL in .env, recreate container
docker compose --profile gpu up -d --force-recreate vllm
```

### Provider history (for context)

Previously supported: Ollama (native fetch API), Anthropic (Claude SDK), OpenAI native.

These were removed because:

- Ollama replaced by vLLM (same port, better perf)
- Anthropic never used in practice
- All OpenAI-compatible servers use the same protocol — no need for a switch

## Key Memory Files

- `/memories/repo/vigia-debugging.md` — Known issues & fixes
- `/memories/repo/vigia-ux-redesign.md` — UX redesign notes
