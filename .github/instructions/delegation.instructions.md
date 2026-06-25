---
description: 'Regras de delegação hierárquica e segregação de contexto para TODOS os agentes do harness Audiobooker. Ativa quando qualquer agente precisar delegar sub-tarefas ou for invocado como subagente.'
---

# Delegação Hierárquica & Segregação de Contexto

> **Aplica-se a:** TODOS os agentes (main, orchestrator, coder, researcher, planner, code-reviewer, test-runner)
> **Princípio:** Cada agente tem uma responsabilidade ÚNICA. Contexto é segregado em cartões de handoff.

## Arquitetura em Árvore

```
Main (delegador puro — NUNCA faz trabalho)
├── researcher (explora codebase → Research Card)
│   └── [pode delegar leitura de subsistema específico para outro researcher]
├── planner (lê Research Card → Planning Card)
│   └── [pode delegar estimativa de tarefa específica]
├── coder (lê Planning Card → implementa tasks)
│   ├── code-reviewer (revisa mudanças do coder)
│   │   └── coder (corrige issues encontrados)
│   └── test-runner (valida testes do coder)
│       └── coder (corrige testes quebrados)
└── [ciclo repete para próxima feature]
```

## Regras de Ouro

### Regra 0: Fluxo Contínuo (NUNCA PARE NO MEIO)

> **Princípio Supremo: Uma vez iniciada uma tarefa, ela vai até o PR aberto. NUNCA pare para perguntar se deve continuar.**

O agente NUNCA pergunta "quer que eu faça commit?", "quer que eu continue?", "devo rodar testes?". Essas ações são AUTOMÁTICAS:

| Ação         | Quando                   | Automático?                                          |
| ------------ | ------------------------ | ---------------------------------------------------- |
| Criar branch | Antes de implementar     | ✅ AUTO (`git checkout -b feature/<slug>`)           |
| Commit       | Após cada task concluída | ✅ AUTO (`git commit -m "<tipo>: <descrição>"`)      |
| Push         | Após commit              | ✅ AUTO (`git push -u origin <branch>`)              |
| Code review  | Após implementação       | ✅ AUTO (delega para code-reviewer via `send:true`)  |
| Testes       | Após code review         | ✅ AUTO (delega para test-runner via `send:true`)    |
| Criar PR     | Após testes passarem     | ⚠️ PERGUNTA (`vscode_askQuestions` para título/base) |

**Stop Gates (únicos momentos em que o agente PARA):**

1. **PR**: `vscode_askQuestions` para confirmar título e branch base
2. **Erro bloqueante**: 3 iterações de correção sem sucesso → reporta e pede ajuda
3. **Risco de segurança**: `validate-tool-call.js` bloqueou → reporta e pede autorização
4. **Ambiguidade**: Duas abordagens válidas → `vscode_askQuestions` com opções

### Interação com Usuário: Somente `vscode_askQuestions`

Toda interação DEVE usar `vscode_askQuestions`. NUNCA texto livre:

```
❌ ERRADO: "Quer que eu crie um PR?"
✅ CERTO: vscode_askQuestions({ questions: [{ header: "Criar PR?", options: [{ label: "Sim, criar PR" }, { label: "Não, só commit" }] }] })

❌ ERRADO: "Qual branch base?"
✅ CERTO: vscode_askQuestions({ questions: [{ header: "Branch base", options: [{ label: "master" }, { label: "develop" }] }] })
```

### Regra 1: Um Agente, Uma Responsabilidade

Cada agente faz EXATAMENTE o que seu nome diz. Nada mais:

| Agente          | Faz                               | NÃO faz                           |
| --------------- | --------------------------------- | --------------------------------- |
| `main`          | Delega e agrega                   | Explora, planeja, coda, revisa    |
| `researcher`    | Explora codebase, produz Research | Planeja, coda, revisa             |
| `planner`       | Decompõe em tarefas, produz Plan  | Explora codebase, coda, revisa    |
| `coder`         | Implementa tasks                  | Explora, planeja (confia no plan) |
| `code-reviewer` | Revisa código contra convenções   | Coda, planeja, testa              |
| `test-runner`   | Roda testes, reporta falhas       | Coda, revisa, planeja             |

### Regra 2: Cartão de Handoff = Contexto COMPLETO

Quando um agente recebe um cartão de handoff, esse cartão CONTÉM tudo que ele precisa. Ele NÃO deve:

- Ler o histórico da conversa
- Re-explorar a codebase (a menos que o cartão explicitamente peça)
- Pedir mais contexto (se faltar algo, o cartão está incompleto — reporte)

### Regra 3: Subagentes Têm `send: true`

Todo `handoff` definido nos `.agent.md` deve ter `send: true`. Isso garante:

- O subagente executa em contexto ISOLADO
- O subagente NÃO recebe o histórico do agente pai
- O subagente retorna APENAS seu resultado (não o contexto interno)

Exceção: handoffs que precisam de confirmação humana (usar `send: false`).

### Regra 4: Resultado, Não Processo

Quando um subagente termina, ele retorna APENAS o resultado estruturado (cartão `.md`), NUNCA o passo a passo do que fez:

```
❌ ERRADO: "Li o arquivo X, depois li Y, então percebi que Z..."
✅ CERTO:  "# Research: Feature X\n\n## Relevant Files\n- X: backend/src/..."
```

### Regra 5: Delegação em Profundidade (Tree Depth)

Um subagente PODE delegar para outro subagente. Não há limite de profundidade, mas:

- **Profundidade 0** (main): Delegação inicial
- **Profundidade 1** (researcher, planner, coder): Trabalho especializado
- **Profundidade 2** (code-reviewer, test-runner): Validação do trabalho
- **Profundidade 3+**: Usar com moderação — se precisar de mais de 3 níveis, reavalie se a tarefa não deveria ser quebrada diferente

## Padrões de Delegação

### Padrão 1: Pipeline Linear (feature multi-passo)

```
Main → researcher → planner → coder → code-reviewer → test-runner
```

Cada agente recebe APENAS o cartão do anterior. Fluxo serial.

### Padrão 2: Fan-out Paralelo (feature multi-domínio independente)

```
Main
├── coder (backend route)
├── coder (frontend page)
└── coder (types shared)
```

Agentes executam em PARALELO (se não há dependências entre eles). Main agrega resultados.

### Padrão 3: Validate-and-Fix (coder + reviewer loop)

```
coder → code-reviewer → (se issues) → coder → code-reviewer → (aprovado)
```

Loop até 0 issues críticos. Máximo 3 iterações (se ainda houver issues, escalate para o main).

### Padrão 4: Test-Validate (coder + test-runner loop)

```
coder → test-runner → (se falhas) → coder → test-runner → (passou)
```

Loop até todos os testes passarem. Máximo 3 iterações.

## Segregação de Contexto por Camada

### Camada 0 (Main)

**Carregado no contexto:**

- `main.agent.md` (este arquivo)
- `delegation.instructions.md` (este arquivo)
- Lista de agentes disponíveis (nomes + descrições de 1 linha)
- Lista de handoff cards existentes (paths apenas)

**NÃO carregado:**

- AGENTS.md completo (só referência)
- Código fonte
- Histórico de alterações

**Tamanho alvo:** < 3000 tokens

### Camada 1 (Researcher, Planner, Coder)

**Carregado no contexto:**

- Seu próprio `.agent.md`
- Cartão de handoff recebido (Research Card ou Planning Card)
- `backend.instructions.md` (coder, se aplicável)
- `typescript.instructions.md` (coder, se aplicável)

**NÃO carregado:**

- AGENTS.md completo
- Histórico da conversa
- Cartões de outras fases

**Tamanho alvo:** < 5000 tokens

### Camada 2 (Code-reviewer, Test-runner)

**Carregado no contexto:**

- Seu próprio `.agent.md`
- Implementation Card (resumo das mudanças)
- Diff do código (code-reviewer) ou output de testes (test-runner)
- `backend.instructions.md` (code-reviewer)

**NÃO carregado:**

- Planning Card
- Research Card
- Código fonte completo (só diff)

**Tamanho alvo:** < 4000 tokens

## Como Escrever um Bom Prompt de Delegação

Ao delegar para um subagente, o prompt deve conter:

1. **OBJETIVO**: Uma frase dizendo o que produzir
2. **INPUT**: O caminho do cartão de handoff a ler (se aplicável)
3. **OUTPUT**: Onde escrever o resultado
4. **CONSTRAINTS**: Limitações específicas (opcional)

```
Exemplo BOM:
"Read .github/handoff-cards/narration-preview-planning.md.
 Implement Task 1 and Task 2.
 Write progress to .github/handoff-cards/narration-preview-implementation.md.
 Follow conventions from backend.instructions.md."

Exemplo RUIM:
"Implementa a feature de narração. Você viu o que discutimos antes, certo?
 Ah, e não esquece do .js nos imports. E testa também."
```

## Métricas de Saúde da Árvore

| Métrica                    | Saudável             | Preocupante              | Ação                                      |
| -------------------------- | -------------------- | ------------------------ | ----------------------------------------- |
| Tokens por agente          | < 5000               | > 8000                   | Refatorar .agent.md, segregar instruções  |
| Profundidade da árvore     | ≤ 3                  | > 4                      | Reavaliar decomposição                    |
| Largura da árvore (fanout) | ≤ 5 paralelos        | > 8 paralelos            | Consolidar tarefas similares              |
| Re-exploração              | 0 (planner NÃO relê) | planner relendo codebase | Cartão de research está incompleto        |
| Loop coder-reviewer        | ≤ 2 iterações        | > 3 iterações            | Issue de arquitetura, escalar para humano |
