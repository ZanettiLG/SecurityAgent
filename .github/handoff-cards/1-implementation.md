# Implementation: Issue #1 — Memória Persistente Multi-Sessão

## Status

- [x] Stage 1: SceneContext Bootstrapping — done
- [x] Stage 2: Full Multi-Session Persistence — done
- [x] Stage 3: Context Linking Engine — done
- [x] Stage 4: Context Compiler — done
- [x] Stage 5: Consolidation Loop — done

## Files Changed

| File                                | Action      | Notes                                                                          |
| ----------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `src/core/types.ts`                 | Modified    | Added `SceneContext`, `SceneContextUpdate` interfaces                          |
| `src/memory/scene-context-store.ts` | **Created** | SQLite CRUD for scene contexts per camera                                      |
| `src/memory/system.ts`              | Modified    | Added all 6 new stores + ContextCompiler                                       |
| `src/core/agent.ts`                 | Modified    | SceneContext init, KG enrichment, ConsolidationEngine, removed old consolidate |
| `src/memory/kg-store.ts`            | **Created** | PersistentKnowledgeGraph extends KnowledgeGraph with SQLite write-through      |
| `src/memory/routine-store.ts`       | **Created** | SQLite persistence for RoutineProfile                                          |
| `src/memory/hypothesis-store.ts`    | **Created** | SQLite persistence for Hypothesis                                              |
| `src/memory/conversation-store.ts`  | **Created** | SQLite persistence for conversation history                                    |
| `db/init.sql`                       | Modified    | Added 6 new tables with indexes                                                |
| `src/memory/knowledge-graph.ts`     | Modified    | Added `findSimilarNodes()`, `mergeNodes()`, `getFullContext()`                 |
| `src/reasoning/llm/client.ts`       | Modified    | Added SceneContext + KG enrichment in prompt                                   |
| `src/memory/context-compiler.ts`    | **Created** | 6-layer hierarchical prompt assembly with token budgets                        |
| `src/memory/consolidation.ts`       | **Created** | Periodic auto-learn cycle with rule-based + LLM extraction                     |

## Architecture Delivered

```
Layer 5: Consolidation Engine (consolidation.ts)
  auto-learn loop every 5min — extracts relationships, marks old events
Layer 4: Context Compiler (context-compiler.ts)
  SceneContext → KG → Events → Hypotheses → Conversations → prompt
Layer 3: Context Linking Engine (knowledge-graph.ts)
  findSimilarNodes (Jaccard), mergeNodes, getFullContext, event enrichment
Layer 2: Full Persistence (6 SQLite stores)
  kg-store, routine-store, hypothesis-store, conversation-store,
  scene-context-store (new) + event-store, person-store (existing)
Layer 1: SceneContext types (types.ts)
  SceneContext, SceneContextUpdate
```

## DB File Layout

```
data/
├── events.db           # SqliteEventStore (existing)
├── persons.db          # SqlitePersonRegistry (existing)
├── knowledge-graph.db  # PersistentKnowledgeGraph (NEW)
├── routines.db         # RoutineStore (NEW)
├── hypotheses.db       # HypothesisStore (NEW)
├── conversations.db    # ConversationStore (NEW)
├── scene-contexts.db   # SceneContextStore (NEW)
└── vectors/            # ChromaDB (existing)
```

## Verification

- [x] `tsc --noEmit` — pass (0 errors)
- [x] `npm run lint` — 0 errors, 15 warnings (all pre-existing)
- [x] `npm test` — 29/29 pass (baseline unchanged)
- [x] All 4 commits pushed to `feature/issue-1-memoria-persistente`

## 🤖 Handoff Contract

**To:** Code Reviewer
**You receive:** Implementation Card with all files changed, architecture, verification results
**You DO NOT receive:** Planning rationale, research notes, conversation history
**Your job:** Review code changes against SecurityAgent conventions — ESM `.js` imports, strict TypeScript, SQLite WAL mode, DI via MemorySystem facade.

---

## 📋 Code Review Summary

### 🔴 Critical (must fix before merge)

**Nenhum encontrado.** Typecheck (0 errors), lint (0 errors), testes 29/29 passam.

### 🟡 High — Resolvidos ✅

| #   | Issue                                                                                                                                            | Arquivos                                             | Fix                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Duplicação**: `enrichEventWithContext()` (agent.ts) e `extractRelationships()` (consolidation.ts) criavam arestas KG com lógica quase idêntica | `agent.ts`, `consolidation.ts`, `knowledge-graph.ts` | Movido para `KnowledgeGraph.ensureEdgesForEvent()` — método único chamado pelo consolidation engine. Agent.ts mantém apenas enriquecimento de contexto (queries KG). Commit: `65c3485` |
| 2   | **Arquitetura**: `(this as unknown as { edges }).edges.push(edge)` em `kg-store.ts` quebrava encapsulamento                                      | `knowledge-graph.ts`, `kg-store.ts`                  | Adicionado `protected _pushEdge(edge)` no `KnowledgeGraph`; `PersistentKnowledgeGraph.load()` usa `super._pushEdge()`. Commit: `65c3485`                                               |

### 🔵 Medium (consider fixing)

| #   | Issue                                               | Arquivo                               | Status                                                                                                        |
| --- | --------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Parâmetro `depth` em `getFullContext()` nunca usado | `knowledge-graph.ts`                  | ✅ **Resolvido** — param removido (commit `021d3a3`)                                                          |
| 2   | `routines` budget nunca usado em `ContextCompiler`  | `context-compiler.ts`                 | ✅ **Resolvido** — budget removido do config (commit `021d3a3`)                                               |
| 3   | `import { KnowledgeGraph }` + propriedade obsoleta  | `agent.ts`                            | ✅ **Resolvido** — import removido, propriedade removida, tudo via `memory.knowledgeGraph` (commit `021d3a3`) |
| 4   | Nenhum teste unitário para os 7 novos stores        | `src/memory/__tests__/stores.test.ts` | ✅ **Resolvido** — 12 testes criados (commit `021d3a3`)                                                       |

### ⚪ Low (nice to have)

| #   | Issue                                               | Arquivo              |
| --- | --------------------------------------------------- | -------------------- |
| 1   | `routine_learner.ts` usa snake_case vs kebab-case   | `routine_learner.ts` |
| 2   | `RoutineStore` poderia ser `PersistentRoutineStore` | `routine-store.ts`   |

## Summary

🔴 0 critical, 🟡 2 resolved, 🔵 4 resolved, ⚪ 2 open.

**Overall:** Implementação sólida — todos os 🟡 resolvidos com commit `65c3485`. A maior lacuna restante são os **testes unitários** para os novos stores (🔵 #4).

---

## 🔧 Harness Fix (Loop Prevention)

**Problema:** O `code-reviewer.agent.md` tinha um handoff incondicional `Fix Issues → task-coder` que sempre enviava para o coder mesmo quando não havia issues, criando um loop infinito: _review → fix → review → fix → ..._

**Causa raiz:**

- `code-reviewer.agent.md` — handoff `Fix Issues` sem condição, enviava para `task-coder` mesmo com 0 issues
- `main.agent.md` — prompts usavam `<slug>` enquanto os arquivos seguem `<issue-number>` (ex: `1-implementation.md`)

**Fix (commit `830b6cf`):**

1. `code-reviewer.agent.md` — **removido o bloco `handoffs:` inteiro.** Code-reviewer agora é READ-ONLY: documenta findings, não delega. Quebra o loop.
2. `main.agent.md` — prompts atualizados para `<issue-number>` e adicionado handoff `Pipeline Finalizada` (send: false) para sinalizar término sem delegar.
3. Comentário `⚠️ NO handoffs block` adicionado para prevenir regressão.

---

## ✅ Integration Gaps Resolved (commit `09b7165`)

| #   | Task                                                     | Files Changed         | Status |
| --- | -------------------------------------------------------- | --------------------- | ------ |
| 1   | `sceneContext` na `CameraConnector`                      | `camera-connector.ts` | ✅     |
| 2   | `RoutineStore` → `RoutineLearner` (write-through save)   | `routine_learner.ts`  | ✅     |
| 3   | `HypothesisStore` → `HypothesisEngine` (persist + load)  | `hypothesis.ts`       | ✅     |
| 4   | `ConversationStore` → `QueryManager` (persist on answer) | `query_user.ts`       | ✅     |
| 5   | Wire all stores into `agent.ts` setup                    | `agent.ts`            | ✅     |

### Previously: 🔵 #4 "Nenhum teste unitário para os 7 novos stores" → ✅ **Resolvido** (commit `021d3a3`)

## Final Verification

- [x] `tsc --noEmit` — pass (0 errors)
- [x] `npm test` — 41/41 pass (29 orig + 12 novos)
- [x] Planning card: `.github/handoff-cards/1-planning.md`
- [x] 6 files changed, 198 insertions, 34 deletions
