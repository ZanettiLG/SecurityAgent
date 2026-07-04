# 11 — Context Compiler: Montagem Hierárquica de Contexto para LLM

## Objetivo

Substituir o `getContextForLlm()` flat por um **compilador hierárquico de
contexto** que monta prompts otimizados para o LLM, respeitando token budget
e priorizando informações por relevância.

**Issue**: [#1 — Fase 3](https://github.com/ZanettiLG/SecurityAgent/issues/1)

## Dependências

- ✅ 07-persistence (EventStore, PersonRegistry)
- ✅ 09-knowledge-social (KnowledgeGraph)
- ✅ 10-scene-context (SceneContextStore)

## Arquivos

```
src/reasoning/context-compiler.ts  # NOVO — ContextCompiler + todas as layers
src/core/agent.ts                  # MODIFICAR — usar ContextCompiler no lugar de getContextForLlm()
handoff/11-context-compiler.md     # NOVO — este arquivo
```

---

## Design

### Arquitetura em 7 Camadas

```
┌─────────────────────────────────────────────────┐
│ 0. SYSTEM_PROMPT (fixo, priority=0, max 800tk)   │
│    "Você é o Vigia, um agente de segurança..."    │
├─────────────────────────────────────────────────┤
│ 1. SCENE_CONTEXT (priority=10, max 500tk)        │
│    "Câmera externa: padrão típico para 23h..."   │
├─────────────────────────────────────────────────┤
│ 2. KNOWLEDGE_GRAPH (priority=20, max 400tk)      │
│    "Pessoa X: vizinha, 23 visitas..."             │
├─────────────────────────────────────────────────┤
│ 3. ROUTINE_CONTEXT (priority=30, max 400tk)      │
│    "Neste horário: 85% entregas, 10% vizinhos"   │
├─────────────────────────────────────────────────┤
│ 4. RECENT_EVENTS (priority=40, max 600tk)        │
│    "Últimos 20 eventos..."                        │
├─────────────────────────────────────────────────┤
│ 5. ACTIVE_HYPOTHESES (priority=50, max 300tk)    │
│    "Hipóteses em aberto..."                       │
├─────────────────────────────────────────────────┤
│ 6. CONVERSATION_HISTORY (priority=60, max 300tk) │
│    "Últimas interações com o usuário..."          │
└─────────────────────────────────────────────────┘
```

### Algoritmo

```
compile(event, totalBudget=3500):
  sections = []
  remaining = totalBudget
  for layer in layers (sorted by priority):
    budget = min(layer.maxTokens, remaining)
    if budget <= 0: break
    content = layer.build(event)
    truncated = truncateToTokens(content, budget)
    sections.push(truncated)
    remaining -= estimateTokens(truncated)
  return sections.join("\n\n")
```

### Estimativa de Tokens

- Aproximação simples: `Math.ceil(chars.length / 4)`
- Truncamento inteligente: corta no último `\n` para preservar frases completas
- Nunca trunca no meio de uma palavra

### Token Budgets por Modelo

| Modelo        | Context Window | Budget para Prompt |
| ------------- | -------------- | ------------------ |
| MiniCPM-V 4.6 | 4096           | 3500               |
| GPT-4o-mini   | 8192           | 7000               |
| LLaVA 1.6     | 4096           | 3500               |
| DeepSeek-R1   | 8192           | 7000               |

---

## Interface `ContextLayer`

```typescript
interface ContextLayer {
  name: string;
  priority: number; // 0 = mais importante, vai primeiro
  maxTokens: number; // budget máximo desta camada
  build(event: SecurityEvent): Promise<string>;
}
```

---

## ✅ Acceptance Criteria

- [ ] ContextCompiler com 7 camadas implementadas
- [ ] Token budget respeitado (truncamento inteligente)
- [ ] Camadas ordenadas por prioridade
- [ ] SCENE_CONTEXT, RECENT_EVENTS e ACTIVE_HYPOTHESES funcionais
- [ ] KNOWLEDGE_GRAPH e ROUTINE_CONTEXT como stubs (dados não disponíveis ainda)
- [ ] CONVERSATION_HISTORY como stub
- [ ] Integrado no agent.ts via `this.contextCompiler.compile(event, budget)`
- [ ] Build TypeScript limpo
