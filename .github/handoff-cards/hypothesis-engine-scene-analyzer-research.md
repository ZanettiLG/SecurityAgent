# 🔍 Research: HypothesisEngine + SceneAnalyzer

> 📋 **Phase 1/3 — Research**. Filled by the `researcher` agent.
> This card is the ONLY context the `planner` receives. Keep it self-contained.

## Parent Epic

N/A — Local mode (no GitHub issue)

## Context

O Vigia precisa de raciocínio abdutivo: ao detectar um evento anômalo, deve gerar hipóteses sobre o que está acontecendo, atribuir probabilidades, coletar evidências e perguntar ao usuário. Atualmente o `HypothesisEngine.generateFromEvent()` é um stub que retorna `[]`. Paralelamente, o sistema não tem percepção semântica das cenas — o `VisionPipeline` apenas detecta movimento (pixel-diff), sem descrever o que há na imagem. O `SceneAnalyzer` (LLM Vision) preenche essa lacuna, fornecendo descrições ricas que alimentam a geração de hipóteses.

## Scope Assessment

Full-stack: backend (`src/`) + dashboard (`dashboard/src/`).

| Camada     | Afetado                                                       |
| ---------- | ------------------------------------------------------------- |
| Core types | `src/core/types.ts` — novos tipos SceneObservation            |
| Processing | `src/processing/scene-analyzer.ts` — novo módulo              |
| Reasoning  | `src/reasoning/hypothesis.ts` — substituir stub               |
| Memory     | `src/memory/scene-index.ts` — novo módulo                     |
| Agent      | `src/core/agent.ts` — wire-up                                 |
| Dashboard  | `dashboard/src/App.tsx`, `ChatPanel.tsx` — exibir observações |

## Codebase Exploration

### Relevant Files

| File                     | Path                                | Why it matters                                                                            |
| ------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| Agent loop               | `src/core/agent.ts`                 | 600+ linhas, `handleEvent()` com 9 etapas, `runCameraLoop()`, `needsLlm()`                |
| Core types               | `src/core/types.ts`                 | `SecurityEvent`, `PersonRecord`, enums — base para novos tipos                            |
| LlmClient                | `src/reasoning/llm/client.ts`       | ✅ Já existe, suporta OpenAI/Anthropic/Ollama, system prompt em português                 |
| VisionPipeline           | `src/processing/vision-pipeline.ts` | Pixel-diff existente, `process(frame)` retorna `SecurityEvent`                            |
| HypothesisEngine         | `src/reasoning/hypothesis.ts`       | Stub — `generateFromEvent()` retorna `[]`, tipos de hipótese definidos                    |
| VehicleTracker           | `src/processing/vehicle-tracker.ts` | Padrão de classe com injeção de dependência semelhante ao que o SceneAnalyzer deve seguir |
| MemorySystem             | `src/memory/system.ts`              | `InMemoryVectorStore`, `EventStore`, `PersonRegistry` — base para SceneIndex              |
| ChromaVectorStore        | `src/memory/chroma-vector-store.ts` | Já implementado com ChromaDB — usado pelo SceneIndex para embeds                          |
| QueryManager             | `src/actions/query_user.ts`         | Templates de pergunta do Vigia — para perguntar sobre hipóteses                           |
| Dashboard App            | `dashboard/src/App.tsx`             | WebSocket listener, estados `Alert`, `MotionSummary`                                      |
| ChatPanel                | `dashboard/src/ChatPanel.tsx`       | Renderiza mensagens com `quickReplies` e tipos visuais                                    |
| Semantic Scene Index doc | `docs/semantic-scene-index.md`      | Design completo do SceneAnalyzer, SceneIndex, SemanticSearch                              |
| Concept doc              | `docs/concept.md`                   | 3 camadas de baseline, raciocínio abdutivo, hipóteses                                     |
| Product spec             | `docs/product-spec.md`              | Dashboard UI: chat, timeline, raciocínio visível                                          |
| Architecture doc         | `docs/architecture.md`              | Pipeline de visão, latency budget, integração de sistemas                                 |

### Existing Patterns to Follow

- **Pipeline class pattern** (seen in `src/processing/vision-pipeline.ts`, `src/processing/vehicle-tracker.ts`): Classes with constructor injection, async `process()` method returning events/null, integration via EventBus
- **LLM client usage** (seen in `src/reasoning/llm/client.ts`): `LlmClient.evaluate()` for security assessment, `LlmClient.generate()` for text generation. Supports `openai`, `anthropic`, `ollama` providers with deterministic fallback.
- **EventBus publish pattern** (seen in `src/core/agent.ts`): `this.bus.publish("vision.event", event)` for pipeline output, `this.bus.subscribe("behavior.match", ...)` for async handlers
- **ESM imports with `.js` extension** (seen everywhere): All relative imports use `.js` extension per `typescript.instructions.md`
- **Portuguese JSDoc + English code** (seen across `src/`): Portuguese for user-facing strings, code in English
- **Zod schemas for config validation** (seen in `src/core/config.ts`): `z.object()` for all config shapes

### Patterns to AVOID

- **Stub implementations** (seen in `src/reasoning/hypothesis.ts`): `generateFromEvent()` returning `[]` — must be replaced with real LLM call
- **`unknown` type for dependencies** (seen in `src/reasoning/hypothesis.ts:19`): `private llmClient?: unknown` — should be properly typed
- **Empty classes** (seen in `src/processing/social-investigator.ts`): Class with no methods — SceneAnalyzer must be fully implemented
- **Simulation instead of real processing** (seen in `src/processing/vehicle-tracker.ts`): 15% random detection — SceneAnalyzer must use real LLM Vision

### Constraints Discovered

- **LLM Vision dependency**: SceneAnalyzer requires an LLM provider that supports vision (GPT-4o-mini, LLaVA, Ollama with vision model). The `LlmClient` already supports this via OpenAI-compatible API. Fallback: return `null` when LLM is offline.
- **Frame sampling**: Vision pipeline processes 1 in every 3 frames by default. SceneAnalyzer should process even less frequently (e.g., 1 frame every 5 seconds when motion is detected) to avoid rate limits and cost.
- **Frame format**: `CameraFrame.data` is JPEG Buffer. SceneAnalyzer needs base64-encoded JPEG for LLM Vision API.
- **Memory bottleneck**: Current `MemorySystem` uses `InMemoryVectorStore` by default (ChromaDB fallback). SceneIndex needs to work with both.
- **No audio pipeline**: `audioPipeline: unknown = null` — not relevant for this task but means no audio context for hypotheses.
- **Config not yet extended**: `settings.yaml` has no `scene_analyzer` or `hypothesis_engine` sections. Will need Zod schema additions in `src/core/config.ts`.
- **HypothesisEngine needs context**: To generate meaningful hypotheses, it needs: `SceneObservation` (from SceneAnalyzer), routine baseline (from `RoutineLearner`), person data (from `PersonRegistry`), recent events (from `EventStore`).
- **Thread safety**: Agent runs multiple async tasks (camera loops, GOAP tick, consolidation). SceneAnalyzer calls must not block the main event pipeline.

### Data Flow

```
Frame JPEG (from camera loop)
  │
  ├─► VisionPipeline.process()  → MOTION_DETECTED event
  │
  └─► SceneAnalyzer.analyze(frame)  → SceneObservation
        │                              │
        │  LLM Vision prompt           ├─ narration (string)
        │  "Descreva esta cena..."     ├─ persons[]
        │                              ├─ vehicles[]
        │                              ├─ objects[]
        │                              └─ anomalyFlags[]
        │
        ▼
  SceneIndex.store(observation)
        │
        ├─ SQLite: metadados + narration
        └─ ChromaDB: text embedding da narration
              │
              ▼
        SemanticSearch.search(query)  → SceneObservation[]
```

### Hypothesis Generation Flow

```
SceneObservation + Event + Context
  │
  ▼
HypothesisEngine.generateFromEvent()
  │
  ├─ LLM prompt com:
  │   - Evento atual
  │   - Observação de cena (narration)
  │   - Baseline de rotina (RoutineLearner)
  │   - Pessoa envolvida (PersonRegistry)
  │
  ├─ Output: Hypothesis[] (2-5 por evento)
  │   - title, description, probability
  │   - supportingEvidence, contradictingEvidence
  │   - status: "draft" | "testing"
  │
  └─ Se confiança > 0.8 → confirmed
    Se confiança < 0.3 → descartada
    Senão → QueryManager pergunta ao usuário
```

### Files to Create

| File                               | Purpose                            | Est. Lines |
| ---------------------------------- | ---------------------------------- | ---------- |
| `src/processing/scene-analyzer.ts` | LLM Vision → SceneDescription      | ~150       |
| `src/memory/scene-index.ts`        | Persist + search SceneObservations | ~120       |

### Files to Modify

| File                          | Change                                                                | Est. Lines |
| ----------------------------- | --------------------------------------------------------------------- | ---------- |
| `src/core/types.ts`           | Add `SceneObservation`, `SceneDescription`, `PersonObservation`, etc. | +80        |
| `src/reasoning/hypothesis.ts` | Replace stub `generateFromEvent()` with real LLM call                 | ~60        |
| `src/core/agent.ts`           | Wire-up SceneAnalyzer + HypothesisEngine in pipeline                  | +30        |
| `src/memory/system.ts`        | Add `sceneIndex` property to `MemorySystem`                           | +15        |
| `src/core/config.ts`          | Add SceneAnalyzer + HypothesisEngine config schemas                   | +25        |
| `dashboard/src/App.tsx`       | Handle `scene.observation` WebSocket events                           | +20        |
| `dashboard/src/ChatPanel.tsx` | Display narration messages                                            | +15        |

### Technical Risks

1. **LLM Vision latency**: Can be 1-3s per frame. Mitigation: process asynchronously, don't block camera loop, use frame sampling (every 5s).
2. **LLM cost**: Each SceneAnalyzer call costs tokens. Mitigation: only analyze frames with significant motion (already filtered by VisionPipeline), configurable sample interval.
3. **Hypothesis quality**: Without audio + face recognition, hypotheses are limited to visual + vehicle data. Mitigation: document limitation, add audio context when pipeline exists.
4. **ChromaDB offline**: Falls back to `InMemoryVectorStore`. SceneIndex should check and fallback gracefully.

### Pre-requisites

- [x] `LlmClient` with vision capability (already supports OpenAI and Ollama)
- [x] `VisionPipeline` delivering motion events
- [x] `CameraConnector` delivering JPEG frames
- [x] `EventBus` for async communication
- [x] `MemorySystem` with VectorStore and EventStore
- [ ] Config extension for new modules (task)

---

## Handoff Contract

> **From:** Researcher → **To:** Planner
>
> **What you receive:** This Research Card ONLY. Do NOT re-explore the codebase.
>
> **Key constraints:**
>
> - `LlmClient` already exists — do NOT create a second LLM client
> - All prompts must be in Portuguese (Vigia system language)
> - Use `.js` extension for all relative imports (ESM)
> - SceneAnalyzer processes frames asynchronously — never block the camera loop
> - Fallback on LLM error: return `null`, never throw
> - Config must be extensible via Zod schema in `src/core/config.ts`
>
> **Files to create:** `src/processing/scene-analyzer.ts`, `src/memory/scene-index.ts`
> **Files to modify:** `src/core/types.ts`, `src/reasoning/hypothesis.ts`, `src/core/agent.ts`, `src/memory/system.ts`, `src/core/config.ts`, `dashboard/src/App.tsx`, `dashboard/src/ChatPanel.tsx`
