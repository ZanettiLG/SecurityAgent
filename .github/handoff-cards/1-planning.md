# Plan: Issue #1 — Integration Gaps (Wire Stores into Live Classes)

## Objective

Fechar as 5 lacunas de integração da Issue #1: conectar os stores persistentes
(`RoutineStore`, `HypothesisStore`, `ConversationStore`) às classes que ainda
usam estado in-memory (`RoutineLearner`, `HypothesisEngine`, `QueryManager`,
`PatternMiner`), e adicionar `sceneContext` ao `CameraConnector`.

## Tasks (ordered by dependency)

### Task 1: Add sceneContext to CameraConnector interface (complexity: low)

- **Files to edit**:
  - `src/perception/camera-connector.ts` — add `sceneContext?: SceneContext` to `CameraConnector` interface
- **Dependencies**: None
- **Conventions**: ESM `.js` imports, optional property, backward compatible
- **Test strategy**: `tsc --noEmit`

### Task 2: Wire RoutineStore into RoutineLearner (complexity: medium)

- **Files to edit**:
  - `src/memory/routine_learner.ts` — add optional `routineStore?: RoutineStore` param
  - `updateProfile()`: write-through `routineStore.save(profile)` after each mutation
- **Conventions**: Optional param (backward compat), Map cache + SQLite write-through
- **Test strategy**: Manual — RoutineLearner persists profiles between restarts

### Task 3: Wire HypothesisStore into HypothesisEngine (complexity: medium)

- **Files to edit**:
  - `src/reasoning/hypothesis.ts` — add optional `hypothesisStore?: HypothesisStore`
  - `generateFromEvent()`: persist new hypotheses to store
  - `getActiveHypotheses()`: read from `hypothesisStore.getActive()`
- **Conventions**: Optional param, backward compatible
- **Test strategy**: Unit — save hypothesis, restart engine, verify loaded

### Task 4: Wire ConversationStore into QueryManager (complexity: medium)

- **Files to edit**:
  - `src/actions/query_user.ts` — add optional `conversationStore?: ConversationStore`
  - `processAnswer()`: persist conversation to store
  - `getConversationSummary()`: read from store
- **Conventions**: Optional param, Map cache for pending, SQLite for history
- **Test strategy**: Unit — ask, answer, restart, verify history loaded

### Task 5: Persist PatternMiner results (complexity: low)

- **Files to edit**:
  - `src/memory/pattern_miner.ts` — no store needed; results are in-memory only
  - Add option to persist via MemorySystem if needed
- **Conventions**: Use existing MemorySystem facade
- **Test strategy**: Manual

## Acceptance Criteria

- [ ] `CameraConnector` exposes `sceneContext?: SceneContext`
- [ ] `RoutineLearner.loadProfiles()` loads from SQLite on init
- [ ] `HypothesisEngine` hypotheses survive agent restart
- [ ] `QueryManager` conversation history survives agent restart
- [ ] TypeScript compiles with `tsc --noEmit`
- [ ] Existing 29 tests still pass

## 🤖 Handoff Contract

**To:** Coder
**You receive:** 5 tasks above with file paths and conventions
**You DO NOT receive:** Research notes, conversation history, planning rationale
**Your job:** Implement tasks 1–5 in order, one commit per task. Do NOT re-plan.
