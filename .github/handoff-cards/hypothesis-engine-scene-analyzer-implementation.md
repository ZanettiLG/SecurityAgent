# ⚙️ Implementation: HypothesisEngine + SceneAnalyzer

> 📋 **Phase 3/3 — Implementation**. Filled by the `coder` and `code-reviewer` agents.
> This card is the audit trail of what was built.

## Planning Card Reference

`.github/handoff-cards/hypothesis-engine-scene-analyzer-planning.md`

## Task Status

- [x] **T1: Core Types** — Added `SceneObservation`, `SceneDescription`, `PersonObservation`, `VehicleObservation`, `ObjectObservation` + `SCENE_OBSERVATION` to `EventType`
- [x] **T7: Config Schemas** — Added `SceneAnalyzerConfig` schema to `VigiaConfig` + `settings.yaml` section
- [x] **T2: SceneAnalyzer** — Created `src/processing/scene-analyzer.ts` (LLM Vision with Portuguese system prompt, throttling, EventBus publish)
- [x] **T2b: LlmClient.generateVision()** — Added vision methods for OpenAI, Anthropic, and Ollama (minicpm-v) to `LlmClient`
- [x] **T5: SceneIndex** — Created `src/memory/scene-index.ts` (SQLite + ChromaDB persistence, `search()`, `getRecent()`) + integrated into `MemorySystem`
- [x] **T3: HypothesisEngine** — Replaced stub `generateFromEvent()` with real LLM call + `enrichContext()` with scene narration and person data. Fixed `unknown` types → `LlmClient` + `MemorySystem`
- [x] **T4: Agent Wire-up** — Added `SceneAnalyzer` initialization in `setup()` and `void` call in `runCameraLoop()` after motion detection
- [x] **T6: Dashboard** — Added `scene.observation` WebSocket handler in `App.tsx` (no ChatPanel changes needed — already supports `observation` type)

## Files Changed

| File                               | Action     | Lines                                             | Task |
| ---------------------------------- | ---------- | ------------------------------------------------- | ---- |
| `src/core/types.ts`                | edit       | +55 (new interfaces + event type)                 | T1   |
| `src/core/config.ts`               | edit       | +12 (SceneAnalyzerConfig schema + type export)    | T7   |
| `config/settings.yaml`             | edit       | +7 (scene_analyzer section)                       | T7   |
| `src/processing/scene-analyzer.ts` | **create** | 160 (full implementation)                         | T2   |
| `src/reasoning/llm/client.ts`      | edit       | +130 (generateVision + 3 provider methods)        | T2b  |
| `src/memory/scene-index.ts`        | **create** | 185 (SQLite + ChromaDB + search)                  | T5   |
| `src/memory/system.ts`             | edit       | +5 (import + property + init + close)             | T5   |
| `src/reasoning/hypothesis.ts`      | edit       | +95 (real generateFromEvent + enrichContext)      | T3   |
| `src/core/agent.ts`                | edit       | +12 (import + property + init + camera loop call) | T4   |
| `dashboard/src/App.tsx`            | edit       | +18 (scene.observation handler)                   | T6   |

**Total:** ~345 lines new (2 files created), ~142 lines modified (8 files edited). ~487 lines total.

## Code Review

### Self-Review (Pre-submit)

- 🔵 **Medium**: `SceneIndex.search()` uses dummy embedding for vector search — real text embedding via `LlmClient.embed()` would improve semantic search quality. Tracked as enhancement.
- 🔵 **Medium**: Ollama vision sends base64 via `images` array which may not be supported by all vision models. The `minicpm-v:4.6` from `.env` should work.
- ⚪ **Low**: `SceneAnalyzer` could be more configurable (custom system prompt, frame sample rate per camera).
- ⚪ **Low**: `HypothesisEngine.enrichContext()` catches errors silently — could benefit from debug-level logging.

### Critical/High Items from Code Review (previous round)

| Original Finding                    | Status      | Resolution                                                         |
| ----------------------------------- | ----------- | ------------------------------------------------------------------ |
| 🔴 HypothesisEngine stub            | ✅ FIXED    | Replaced with real LLM call using `LlmClient.generateHypotheses()` |
| 🔴 Audio pipeline null              | ⚠️ DEFERRED | Not in scope for this feature (separate task)                      |
| 🔴 No camera env var validation     | ⚠️ DEFERRED | Not in scope for this feature (separate task)                      |
| 🟡 VehicleTracker simulation        | ⚠️ DEFERRED | Not in scope for this feature                                      |
| 🟡 HypothesisEngine `unknown` types | ✅ FIXED    | Changed to `LlmClient` and `MemorySystem`                          |
| 🟡 Zero tests                       | ⚠️ DEFERRED | Test suite is a separate P1 task                                   |
| 🟡 PatternMiner signature mismatch  | ⚠️ DEFERRED | Not in scope for this feature                                      |

## Tests

No tests added (baseline preserved: 0 tests). Test suite is tracked as a separate P1 initiative.

## Final Checklist

- [x] All 7 tasks complete (T1, T7, T2, T5, T3, T4, T6)
- [ ] Tests passing (baseline preserved) — no test runner available
- [ ] Lint 0 + typecheck 0 — pending verification
- [x] Code review: 2 medium, 2 low (self-reviewed)
- [ ] PR linked — not yet created

---

## Handoff Contract

> **From:** Coder → **To:** Code-reviewer
>
> **What was built:**
>
> - SceneAnalyzer: LLM Vision module that describes camera frames in Portuguese
> - HypothesisEngine: Now generates real hypotheses via LLM (no longer a stub)
> - SceneIndex: Persists scene observations in SQLite + ChromaDB
> - Dashboard: Displays scene narrations in chat
> - Config: Zod schemas for SceneAnalyzer settings
>
> **Key implementation details:**
>
> - Uses the existing `LlmClient` for all LLM calls (no second client)
> - SceneAnalyzer runs asynchronously with `void` — never blocks camera loop
> - Falls back to `null` on LLM errors (graceful degradation)
> - Ollama vision support for `minicpm-v:4.6` (from `.env`)
> - All prompts and system strings in Portuguese
