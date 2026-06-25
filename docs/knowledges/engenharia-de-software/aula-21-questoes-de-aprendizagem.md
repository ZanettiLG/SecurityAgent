---
titulo: "Aula 21 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 21: Qualidade, Code Review & Pipeline Agêntico"
data: 2026-06-20
---

# Aula 21 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de aprendizagem** da aula final do módulo. A pergunta central é: *"eu realmente entendi os conceitos de qualidade, code review e pipeline agêntico?"*

Cada questão verifica um conceito-chave da Aula 21. Você deve fazê-las **depois** de estudar o conteúdo principal, sem reler a aula a cada passo. Se travar, a seção indicada em **Conceito-chave** mostra onde consultar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-21/` no seu diretório de estudos
2. Faça as questões em ordem — cada uma se apoia na anterior
3. Para cada questão, crie o arquivo de entrega indicado e preencha o template
4. Ao final, revise o **Checklist Final** e marque o que você consegue fazer sem consultar a aula

---

## Questão 1: Métricas de Qualidade no seu Projeto

**Conceito-chave:** Métricas de qualidade — complexidade ciclomática, LCOM, acoplamento, churn (Aula 21, Seção 1).

**Objetivo:** Aplicar métricas de qualidade ao seu projeto progressivo e identificar hotspots reais.

**Passos de Execução:**

1. Analise o código do seu projeto progressivo usando ESLint com regras de complexidade
2. Calcule o churn dos últimos 30 commits com `git log`
3. Identifique os 3 principais hotspots (alta complexidade + alto churn)
4. Para cada hotspot, anote por que ele é problemático e o que você faria

**Entrega:** crie `entregas-aula-21/01-metricas-hotspots.md`:

```markdown
# Questão 1 — Métricas de Qualidade no meu Projeto

## Configuração ESLint usada

[Regras de complexidade que você adicionou ao .eslintrc.json]

## Comando de churn executado

[git log ... com output]

## Hotspots identificados

### Hotspot 1: [arquivo]
- Complexidade ciclomática aproximada: [N]
- Churn (commits nos últimos 30): [N]
- Por que é problemático: [explique]
- Ação sugerida: [refatoração ou reescrita]

### Hotspot 2: [arquivo]
[...]

### Hotspot 3: [arquivo]
[...]

## Conclusão

Em 2-3 frases: qual o maior aprendizado sobre métricas de qualidade aplicadas ao seu próprio código?
```

---

## Questão 2: Quality Gate Personalizado

**Conceito-chave:** Quality Gates e análise estática (Aula 21, Seção 2 e 6).

**Objetivo:** Projetar um Quality Gate personalizado para o seu projeto, com thresholds justificados.

**Passos de Execução:**

1. Defina 6 métricas que seu Quality Gate deve monitorar
2. Para cada métrica, estabeleça um threshold e justifique o valor
3. Explique o que acontece se cada threshold for violado (bloqueia o merge ou apenas alerta?)

**Entrega:** crie `entregas-aula-21/02-quality-gate.md`:

```markdown
# Questão 2 — Quality Gate Personalizado

## Minhas 6 Métricas

| Métrica | Threshold | Justificativa | Bloqueia merge? |
|---|---|---|---|
| [Métrica 1] | [threshold] | [por que este valor?] | Sim/Não |
| [Métrica 2] | [threshold] | [por que este valor?] | Sim/Não |
| [Métrica 3] | [threshold] | [por que este valor?] | Sim/Não |
| [Métrica 4] | [threshold] | [por que este valor?] | Sim/Não |
| [Métrica 5] | [threshold] | [por que este valor?] | Sim/Não |
| [Métrica 6] | [threshold] | [por que este valor?] | Sim/Não |

## Reflexão

Se todas as 6 métricas passassem, seu código seria "perfeito"? O que ainda poderia estar errado mesmo com o Quality Gate verde?
```

---

## Questão 3: Revisão de PR com Checklist

**Conceito-chave:** Code Review checklist de 6 categorias (Aula 21, Seção 3 e 7).

**Objetivo:** Aplicar o checklist de 6 categorias em um PR real (ou simulado) do seu projeto.

**Passos de Execução:**

1. Encontre um PR real no seu repositório (ou crie um branch com uma modificação)
2. Aplique as 6 categorias do checklist: correção, testes, nomes, duplicação, arquitetura, segurança
3. Para cada categoria, anote pelo menos um achado (positivo ou negativo)
4. Classifique cada achado como bloqueante ou não-bloqueante

**Entrega:** crie `entregas-aula-21/03-code-review.md`:

```markdown
# Questão 3 — Revisão de PR

## Dados do PR
- Título: [título do PR]
- Branch: [branch]
- Arquivos modificados: [lista]

## Checklist Aplicado

### 1. Correção funcional
- [Achado] — [Bloqueante/Não-bloqueante]

### 2. Testes
- [Achado] — [Bloqueante/Não-bloqueante]

### 3. Nomes e legibilidade
- [Achado] — [Bloqueante/Não-bloqueante]

### 4. Duplicação
- [Achado] — [Bloqueante/Não-bloqueante]

### 5. Arquitetura
- [Achado] — [Bloqueante/Não-bloqueante]

### 6. Segurança
- [Achado] — [Bloqueante/Não-bloqueante]

## Resumo

| Categoria | Bloqueantes | Não-bloqueantes |
|---|---|---|
| Correção | [N] | [N] |
| Testes | [N] | [N] |
| Nomes | [N] | [N] |
| Duplicação | [N] | [N] |
| Arquitetura | [N] | [N] |
| Segurança | [N] | [N] |
| **Total** | **[N]** | **[N]** |

## Decisão

[Approve / Request Changes] — justifique sua decisão final.
```

---

## Questão 4: Dívida Técnica — Inventário e Plano

**Conceito-chave:** Tipos de dívida técnica e estratégias de pagamento (Aula 21, Seção 4).

**Objetivo:** Fazer um inventário da dívida técnica do seu projeto e criar um plano de pagamento priorizado.

**Passos de Execução:**

1. Identifique 5 itens de dívida técnica no seu projeto (pelo menos 1 de cada tipo)
2. Classifique cada um como: deliberada, acidental ou bit rot
3. Estime o esforço para pagar (dias/semanas) e o impacto em produtividade
4. Priorize usando a estratégia: Quick Wins → Hotspots → Redesign

**Entrega:** crie `entregas-aula-21/04-debt-plano.md`:

```markdown
# Questão 4 — Dívida Técnica: Inventário e Plano

## Inventário

| # | Item | Tipo | Esforço | Impacto | Prioridade |
|---|---|---|---|---|---|
| 1 | [descrição] | Deliberada/Acidental/Bit Rot | [dias] | [descrição] | Quick Win / Hotspot / Redesign |
| 2 | [...] | | | | |
| 3 | [...] | | | | |
| 4 | [...] | | | | |
| 5 | [...] | | | | |

## Plano de Pagamento

**Sprint atual (Quick Wins):**
- [itens 1, 2, ...]

**Próximo sprint (Hotspots):**
- [itens 3, 4, ...]

**Próximo trimestre (Redesign):**
- [itens 5, ...]

## Reflexão

Qual item de dívida técnica você vai pagar *amanhã* (Boy Scout Rule) e como?
```

---

## Questão 5: Fitness Function no Pipeline

**Conceito-chave:** Fitness functions arquiteturais (Aula 21, Seção 5 e 8).

**Objetivo:** Implementar uma fitness function real no seu projeto e integrá-la ao pipeline.

**Passos de Execução:**

1. Escolha uma regra arquitetural para validar (ex: "domain não importa infrastructure")
2. Implemente a validação com dependency-cruiser OU com um script manual
3. Execute e verifique se há violações
4. Documente o comando que deve rodar no pipeline

**Entrega:** crie `entregas-aula-21/05-fitness-function.md`:

```markdown
# Questão 5 — Fitness Function no Pipeline

## Regra escolhida

[Descrição da regra arquitetural]

## Implementação

[Configuração do dependency-cruiser ou script de verificação]

## Resultado da execução

[Output do comando — passou ou falhou? Se falhou, quais violações?]

## Integração no pipeline

[Comando ou step do GitHub Actions que executa esta validação]

## Reflexão

Que outras fitness functions seriam úteis para o seu projeto? Liste pelo menos 2.
```

---

## Questão 6: Mapeamento do Pipeline Agêntico

**Conceito-chave:** Pipeline agêntico completo (Aula 21, Seção 9).

**Objetivo:** Descrever o fluxo completo do pipeline agêntico para uma feature real do seu projeto, especificando o papel de cada agente e do humano em cada etapa.

**Passos de Execução:**

1. Escolha uma feature real do seu backlog (ou crie uma hipotética — ex: "adicionar filtro por categoria no catálogo")
2. Escreva o card Jira com critérios de aceitação
3. Escreva o plano que o Agente Planejador geraria (arquivos, ordem, design)
4. Escreva como seria sua revisão do plano (HITL)
5. Especifique o que o Agente Implementador geraria (esboço do código)
6. Especifique o que o Agente Revisor apontaria (findings)
7. Liste os passos do CI/CD que validariam

**Entrega:** crie `entregas-aula-21/06-pipeline-agentico.md`:

```markdown
# Questão 6 — Pipeline Agêntico

## Feature escolhida

[Título e descrição da feature]

## Card Jira

\`\`\`markdown
# Título: [título]

## Descrição
[Como [ator], quero...]

## Critérios de Aceitação
- [critério 1]
- [critério 2]
- [critério 3]
\`\`\`

## Plano do Agente Planejador

**Arquivos a criar/modificar:**
1. [arquivo 1] — [motivo]
2. [arquivo 2] — [motivo]
3. [arquivo 3] — [motivo]

**Ordem de implementação:** [ordem]

**Design:** [decisões de design]

## Minha Revisão (HITL)

[O que eu aprovo, o que eu ajusto, e por quê]

## Esboço do Código (Agente Implementador)

\`\`\`typescript
// Trecho representativo do código gerado
\`\`\`

## Findings do Agente Revisor

- 🔴 [Bloqueante 1]
- 🔴 [Bloqueante 2]
- 🟡 [Não-bloqueante 1]
- 🟢 [Aprovado: item que está correto]

## CI/CD Pipeline

- [ ] Lint
- [ ] Typecheck
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] CodeQL
- [ ] SonarQube
- [ ] dependency-cruiser
- [ ] Build
```

---

## Questão 7: Reflexão Final do Módulo

**Conceito-chave:** Síntese do módulo de 21 aulas (Aula 21, Seção "Resumo do Módulo").

**Objetivo:** Reflita sobre sua jornada nas 21 aulas e avalie onde você está e para onde quer ir.

**Passos de Execução:**

1. Revise a tabela de resumo do módulo (21 aulas)
2. Identifique: qual(is) aula(s) foi(ram) mais fácil(eis)? Qual a mais desafiadora?
3. Avalie seu projeto atual contra os critérios de cada aula — o que está presente? O que falta?
4. Planeje os próximos passos

**Entrega:** crie `entregas-aula-21/07-reflexao-final.md`:

```markdown
# Questão 7 — Reflexão Final do Módulo

## Minha Jornada

**Aula mais fácil:** [Aula NN] — [por quê?]

**Aula mais desafiadora:** [Aula NN] — [por quê?]

**Maior surpresa:** [o que te surpreendeu durante o módulo?]

## Autoavaliação do Projeto

| Critério | Presente? | O que falta? |
|---|---|---|
| Clean Code (nomes, funções, SLAP, DRY) | ✅ / ⬜ | [notas] |
| SOLID (5 princípios) | ✅ / ⬜ | [notas] |
| Design Patterns (criacionais, estruturais, comportamentais) | ✅ / ⬜ | [notas] |
| DDD (bounded contexts, entities, VOs, aggregates) | ✅ / ⬜ | [notas] |
| Clean Architecture (4 camadas) | ✅ / ⬜ | [notas] |
| BDD com Gherkin | ✅ / ⬜ | [notas] |
| TDD (red-green-refactor) | ✅ / ⬜ | [notas] |
| Pirâmide de Testes (unit, integration, E2E, perf) | ✅ / ⬜ | [notas] |
| CI/CD Pipeline | ✅ / ⬜ | [notas] |
| DevSecOps (CodeQL, Dependabot) | ✅ / ⬜ | [notas] |
| Observabilidade (logs, métricas, tracing) | ✅ / ⬜ | [notas] |
| SonarQube / Quality Gates | ✅ / ⬜ | [notas] |
| Code Review Checklist | ✅ / ⬜ | [notas] |
| Fitness Functions | ✅ / ⬜ | [notas] |

## Próximos Passos

[O que você vai estudar ou construir a seguir? Seja específico: cursos, projetos, ferramentas.]

## Mensagem Final

Em 3-5 frases: o que este módulo mudou na sua forma de pensar sobre desenvolvimento de software?
```

---

## Questão 8: Plano de Ação Pós-Módulo

**Conceito-chave:** Próximos passos após o módulo (Aula 21, Seção "Próximos Passos").

**Objetivo:** Criar um plano de ação concreto para aplicar e expandir o que você aprendeu.

**Passos de Execução:**

1. Escolha 3 áreas do módulo que você quer aprofundar (ex: testes E2E, arquitetura, pipeline agêntico)
2. Para cada área, defina um objetivo específico e mensurável
3. Identifique recursos (cursos, livros, projetos) para cada objetivo
4. Defina um prazo realista

**Entrega:** crie `entregas-aula-21/08-plano-de-acao.md`:

```markdown
# Questão 8 — Plano de Ação Pós-Módulo

## Área 1: [Nome]

**Objetivo:** [O que quero alcançar — específico e mensurável]

**Recursos:**
- [Curso/livro/projeto 1]
- [Curso/livro/projeto 2]

**Prazo:** [data]

## Área 2: [Nome]

**Objetivo:** [O que quero alcançar]

**Recursos:**
- [Curso/livro/projeto 1]
- [Curso/livro/projeto 2]

**Prazo:** [data]

## Área 3: [Nome]

**Objetivo:** [O que quero alcançar]

**Recursos:**
- [Curso/livro/projeto 1]
- [Curso/livro/projeto 2]

**Prazo:** [data]

## Compromisso

Assinatura: [seu nome] | Data: [data de hoje]
```

---

## Checklist Final: Pronto para o Futuro?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Métricas**: Identifico hotspots no meu projeto usando complexidade ciclomática e churn
- [ ] **Quality Gate**: Sei configurar SonarQube e interpretar os thresholds de um Quality Gate
- [ ] **Code Review**: Aplico o checklist de 6 categorias em PRs e diferencio bloqueante de não-bloqueante
- [ ] **Dívida Técnica**: Classifico dívida em deliberada/acidental/bit rot e priorizo pagamento
- [ ] **Fitness Functions**: Implemento regras arquiteturais com dependency-cruiser no pipeline
- [ ] **Pipeline Agêntico**: Descrevo o fluxo completo card → planner → HITL → implementer → reviewer → CI/CD → merge
- [ ] **Papel do Humano**: Explico por que o humano é o ponto de decisão no pipeline agêntico
- [ ] **Síntese do Módulo**: Reconheço como cada aula contribuiu para o projeto progressivo
- [ ] **Plano de Ação**: Tenho um plano concreto para aplicar e expandir o que aprendi
- [ ] **Mentalidade de Engenheiro**: Penso em termos de sistemas que evoluem, não de código que funciona hoje

> *Parabéns — você completou as 21 aulas do módulo de Engenharia de Software! Cada conceito, cada refatoração, cada teste e cada agente que você configurou contribuiu para uma base sólida. Você não é mais o mesmo desenvolvedor que começou a Aula 01. 🎉*

> **E agora?** Seus próximos passos naturais são os módulos de Docker & Containers (aprofundamento em orquestração), LangChain & Agentes (construção de agentes sofisticados com RAG e ferramentas), ou Microsserviços (transformar os Bounded Contexts em serviços independentes). Escolha o que mais se conecta com o que você quer construir — e siga em frente com a mentalidade de engenheiro que você desenvolveu aqui.
