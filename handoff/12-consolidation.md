# 12 — Consolidation Loop: Aprendizado Contínuo LLM-Driven

## Objetivo

Implementar o ciclo de auto-aprendizado que transforma o Vigia de um sistema
**reativo** ("processa evento → responde") para um sistema **reflexivo**
("observa → relaciona → aprende → pergunta → atualiza modelo mental").

**Issue**: [#1 — Fase 4](https://github.com/ZanettiLG/SecurityAgent/issues/1)

## Dependências

- ✅ 03-agent-wireup (agent loop, bus, subsystems)
- ✅ 11-context-compiler (ContextCompiler para montar prompt de consolidação)
- ✅ 07-persistence (EventStore para busca de eventos recentes)

## Arquivos

```
src/reasoning/consolidation-loop.ts  # NOVO — ConsolidationLoop class
src/core/agent.ts                    # MODIFICAR — property + init + start
handoff/12-consolidation.md          # NOVO — este arquivo
```

---

## Design

### 3 Gatilhos de Consolidação

| Gatilho            | Condição                     | Ação                       |
| ------------------ | ---------------------------- | -------------------------- |
| **Temporal**       | A cada 5 minutos             | `consolidate()`            |
| **Quantitativo**   | 50+ eventos não-consolidados | `consolidate()`            |
| **Evento Crítico** | Evento com severity >= HIGH  | `consolidate()` (imediato) |

### Prompt de Consolidação

O LLM recebe eventos recentes + contexto e responde com JSON estruturado:

```json
{
  "newFacts": [{ "type": "entity", "description": "...", "confidence": 0.65 }],
  "hypothesisUpdates": [
    { "hypothesisId": "hyp_abc", "newStatus": "confirmed", "reason": "..." }
  ],
  "questions": [{ "text": "...", "priority": "low" }],
  "summaries": [{ "compactMemory": "Carteiro visita diariamente 10h-11h" }]
}
```

### Ações de Consolidação

- **newFacts** → `KnowledgeGraph` (novas entidades + relações)
- **hypothesisUpdates** → `HypothesisEngine` (confirmar/refutar)
- **questions** → `QueryManager` (perguntar ao usuário)
- **summaries** → `EventStore` (marcar eventos como consolidados)

---

## ✅ Acceptance Criteria

- [ ] ConsolidationLoop com 3 gatilhos (temporal, quantitativo, crítico)
- [ ] Prompt de consolidação via ContextCompiler + LLM
- [ ] Parse do JSON de resposta do LLM
- [ ] Ações de consolidação aplicadas nos subsistemas
- [ ] Integrado no agent.ts (start/stop no run/shutdown)
- [ ] Build TypeScript limpo
