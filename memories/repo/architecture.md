# Arquitetura

> Atualizado: 2026-06-30 — Refatoração LLM provider-less + Novo direcionamento multi-sessão

## Decisão: LLM via API OpenAI-compatible (provider-less)

**Contexto**: O projeto passou por 4 iterações de configuração de LLM
(Ollama → vLLM → multi-model → single-model). Cada iteração adicionava
complexidade sem remover a anterior.

**Decisão**: Eliminar o conceito de "provider". Toda comunicação com LLM
usa exclusivamente o SDK OpenAI com `baseURL` configurável.

**Por que**:

- vLLM, OpenAI e OpenRouter expõem a mesma API (`/v1/chat/completions`)
- O `switch(provider)` com 4 branches era complexidade sem benefício real
- Anthropic SDK nunca foi usado em produção; Ollama foi substituído por vLLM

**Configuração resultante**:

```bash
# .env — 3 variáveis, zero enums
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=
LLM_MODEL=minicpm-v4.6
```

**Trade-off**: Perde-se a possibilidade de usar o SDK nativo do Anthropic
ou a API REST do Ollama. Se necessário no futuro, podem ser readicionados
como adaptadores sem quebrar o caminho principal.

## Novo Direcionamento: Memória Persistente Multi-Sessão (2026-06-30)

**Issue**: [#1 — Memória Persistente Multi-Sessão e Compreensão Contextual Instintiva](https://github.com/ZanettiLG/SecurityAgent/issues/1)

### Pilares da Evolução

| Pilar                     | Descrição                                                       | Status    |
| ------------------------- | --------------------------------------------------------------- | --------- |
| **Persistência completa** | KG, rotinas, hipóteses, conversas e cenas sobrevivem a restarts | Planejado |
| **Scene Context**         | Agente "sabe" o que cada câmera vê (modelo mental do ambiente)  | Planejado |
| **Context Compiler**      | Prompt hierárquico com token budget para LLM                    | Planejado |
| **Consolidation Loop**    | Ciclo autônomo de auto-aprendizado contínuo                     | Planejado |
| **Context Linking**       | Cruzamento automático de fatos entre entidades                  | Planejado |

### Nova Tabela de Persistência

| Componente          | Antes              | Depois                          |
| ------------------- | ------------------ | ------------------------------- |
| KnowledgeGraph      | `Map` em memória   | SQLite (`kg_nodes`, `kg_edges`) |
| RoutineProfiles     | `Map` em memória   | SQLite (`routine_profiles`)     |
| SceneContext        | Não existe         | SQLite (`scene_contexts`)       |
| ConversationHistory | `array` em memória | SQLite (`conversation_history`) |
| Hypotheses          | Em memória         | SQLite (`hypotheses`)           |
| MinedPatterns       | Em memória         | SQLite (`mined_patterns`)       |

### Novos Módulos

```
src/memory/
├── kg-store.ts            # PersistentKnowledgeGraph
├── routine-store.ts       # PersistentRoutineLearner
├── conversation-store.ts  # PersistentConversationHistory
├── hypothesis-store.ts    # PersistentHypothesisEngine
├── scene-context-store.ts # SceneContextStore (bootstrapping + persistência)
├── context-compiler.ts    # ContextCompiler (camadas hierárquicas)
└── consolidation.ts       # ConsolidationLoop (auto-aprendizado)
```

### Documentação Atualizada

- `docs/memory-system.md` — Seções 6 (Scene Context), 8.5 (Context Compiler), 12 (Consolidation Cycle)
- `docs/neighborhood-intelligence.md` — Capacidades D, E, F
- `docs/semantic-scene-index.md` — Integração com Scene Context Bootstrapping
- `handoff/index.md` — Tarefas 10, 11, 12
- `handoff/07-persistence.md` — Tarefas 7.5 a 7.9
