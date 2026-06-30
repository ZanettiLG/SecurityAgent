---
titulo: "Aula 08 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 08: Custom Agents e Subagentes — Especialização e Orquestração de Agentes"
data: 2026-06-20
---

# Aula 08 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo contém as questões de checkpoint da Aula 08. A pergunta central é: **"eu realmente entendi Custom Agents, subagentes e Fleet mode?"**.

Cada questão testa um conceito-chave da aula. Leia o **Objetivo**, siga os **Passos de Execução** e complete a **Entrega** no template indicado. Crie a pasta `entregas-aula-08/` no seu projeto e salve cada entrega em um arquivo separado.

Não consulte a aula principal durante as questões — se travar, releia a seção indicada no campo **Conceito-chave** e tente novamente. O **Checklist Final** no fim do arquivo mostra se você está pronto para a Aula 09.

---

## Questão 1: Anatomia de um Custom Agent

**Conceito-chave:** Estrutura do `.agent.md` (Aula 08, Seção 5).

**Objetivo:** Demonstrar compreensão da anatomia completa de um arquivo `.agent.md`.

**Passos de Execução:**

1. Liste todos os campos do frontmatter YAML de um `.agent.md`
2. Classifique cada campo como obrigatório ou opcional
3. Explique o propósito de cada campo em uma frase
4. Descreva o que vai no corpo Markdown (system prompt) e qual o limite de caracteres

**Entrega:** crie `entregas-aula-08/08-01-anatomia-agent.md`:

```markdown
# Questão 1 — Anatomia de um Custom Agent

## Tabela de Campos do Frontmatter

| Campo | Obrigatório? | Propósito |
|---|---|---|
| `name` | | |
| `description` | | |
| `tools` | | |
| `model` | | |
| `infer` | | |
| `mcp-servers` | | |
| `target` | | |

## System Prompt

[Descreva o que vai no corpo Markdown do `.agent.md`, qual o propósito do system prompt e qual o limite de caracteres.]

## Conclusão

Em 2-3 frases: por que o campo `description` é o mais importante para a inferência automática?
```

---

## Questão 2: Restrição de Ferramentas

**Conceito-chave:** Tool set mínimo necessário (Aula 08, Seções 3 e 5).

**Objetivo:** Dado um cenário de uso, selecionar as ferramentas corretas para um agente.

**Passos de Execução:**

1. Leia os 3 cenários fornecidos no template
2. Para cada cenário, defina o conjunto mínimo de tools
3. Justifique cada escolha com base no princípio do menor privilégio

**Entrega:** crie `entregas-aula-08/08-02-restricao-ferramentas.md`:

```markdown
# Questão 2 — Restrição de Ferramentas

## Cenários e Tools

| Cenário | Tools escolhidas | Justificativa |
|---|---|---|
| **Cenário A**: Agente que apenas lê arquivos CSS e reporta inconsistências de estilo | | |
| **Cenário B**: Agente que gera boilerplate de componentes React (cria arquivos .jsx e .css) | | |
| **Cenário C**: Agente que executa testes automatizados e reporta resultados | | |

## Princípio do Menor Privilégio

[Em 3-4 frases: explique por que restringir ferramentas melhora segurança, qualidade e previsibilidade do agente.]

## Conclusão

O que acontece se um agente com `tools: [read]` tentar usar a ferramenta `edit`? Descreva o comportamento do sistema.
```

---

## Questão 3: Criação via `/create-agent`

**Conceito-chave:** Comando de criação (Aula 08, Seção 5).

**Objetivo:** Criar um agente usando o slash command `/create-agent` do Copilot.

**Passos de Execução:**

1. No Copilot Chat, execute o comando `/create-agent`
2. Quando solicitado, forneça:
   - Nome: "analisador-portal"
   - Descrição: "Analisa performance, boas práticas e acessibilidade do Portal de Projetos Dev"
   - Tools: `read` e `search`
   - Modelo: à sua escolha (justifique)
3. Escreva um system prompt que instrua o agente a analisar arquivos e gerar relatório em Markdown
4. Salve o arquivo gerado pelo Copilot em `.github/agents/analisador-portal.agent.md`

**Entrega:** crie `entregas-aula-08/08-03-analisador-portal.agent.md`:

```markdown
# Questão 3 — Analisador do Portal

## Arquivo Gerado

[Cole aqui o conteúdo completo do arquivo `.github/agents/analisador-portal.agent.md` gerado pelo `/create-agent`]

## Justificativa do Modelo

[Por que você escolheu este modelo para o agente analisador? Considere latência, qualidade e custo.]

## Reflexão

O comando `/create-agent` criou o arquivo com frontmatter completo? Se precisou ajustar algo, descreva o que e por quê.
```

---

## Questão 4: Delegação com `runSubagent`

**Conceito-chave:** Ciclo de vida do subagente (Aula 08, Seção 6).

**Objetivo:** Realizar uma delegação e documentar o ciclo de vida observado.

**Passos de Execução:**

1. Certifique-se de ter o agente `revisor-codigo.agent.md` no harness (criado na Mão na Massa 4 da aula)
2. No Copilot Chat, peça: "Revise a qualidade do código do portal usando o agente revisor"
3. Abra o painel de saída do Copilot (View → Output → GitHub Copilot)
4. Observe os eventos do ciclo de vida do subagente
5. Registre cada evento observado na timeline abaixo

**Entrega:** crie `entregas-aula-08/08-04-ciclo-subagente.md`:

```markdown
# Questão 4 — Ciclo de Vida do Subagente

## Timeline de Eventos Observados

| Evento | Horário | Descrição do que aconteceu |
|---|---|---|
| `subagent.selected` | | |
| `subagent.started` | | |
| `subagent.completed` | | (ou `subagent.failed`) |
| `subagent.deselected` | | |

## Prompt Utilizado

[Cole aqui exatamente o prompt que você usou para acionar a delegação.]

## Análise

[Em 3-5 frases: O agente correto foi selecionado? A descrição do agente influenciou a seleção? O resultado foi satisfatório?]
```

---

## Questão 5: Fleet Mode

**Conceito-chave:** Decomposição e paralelismo (Aula 08, Seção 7).

**Objetivo:** Decompor uma tarefa complexa em subtarefas paralelizáveis e planejar a execução com Fleet mode.

**Passos de Execução:**

1. Leia o cenário: "O Portal de Projetos Dev precisa de: revisão de HTML, CSS e JS + auditoria de performance + atualização do README"
2. Identifique quais tarefas são paralelizáveis e quais são sequenciais
3. Desenhe o plano de execução com Fleet mode, indicando dependências
4. Responda: quantos subagentes seriam necessários? Qual a ordem de execução?

**Entrega:** crie `entregas-aula-08/08-05-plano-fleet.md`:

```markdown
# Questão 5 — Plano de Execução com Fleet Mode

## Cenário

O Portal precisa de:
- Revisão de index.html (semântica, acessibilidade)
- Revisão de styles.css (boas práticas, consistência)
- Revisão de app.js (qualidade, segurança)
- Auditoria de performance geral (tamanho de assets, número de requisições)
- Atualização do README.md com base nos resultados das revisões

## Análise de Dependências

| Tarefa | Depende de | Pode paralelizar com |
|---|---|---|
| Revisão HTML | | |
| Revisão CSS | | |
| Revisão JS | | |
| Auditoria Performance | | |
| Atualizar README | | |

## Diagrama de Execução

[Descreva em texto ou diagrama ASCII a ordem de execução. Exemplo:]

Fase 1 (paralelo): [Revisão HTML] [Revisão CSS] [Revisão JS] [Auditoria Performance]
Fase 2 (sequencial): [Consolidar resultados] → [Atualizar README]

## Respostas

1. Quantos subagentes simultâneos na Fase 1?
2. Por que a atualização do README não pode ser paralelizada?
3. Qual o ganho esperado de tempo com Fleet mode vs execução sequencial?
```

---

## Questão 6: Padrões de Delegação

**Conceito-chave:** Decisão spawn vs inline (Aula 08, Seção 8).

**Objetivo:** Justificar a escolha entre spawnar subagente e resolver inline usando heurísticas de decisão.

**Passos de Execução:**

1. Leia os 3 cenários de decisão fornecidos no template
2. Para cada cenário, decida entre spawn (subagente), inline (agente principal) ou fleet mode
3. Justifique cada decisão com pelo menos 2 critérios da tabela de heurísticas da Seção 8

**Entrega:** crie `entregas-aula-08/08-06-decisao-delegacao.md`:

```markdown
# Questão 6 — Decisão de Delegação

## Cenários

| Cenário | Decisão | Critérios utilizados |
|---|---|---|
| **Cenário A**: Você precisa revisar a acessibilidade de 12 páginas HTML independentes. Existe um agente `revisor-acessibilidade` no harness. | | |
| **Cenário B**: Você precisa renomear uma variável em 3 arquivos JavaScript. Não existe agente especializado para isso. | | |
| **Cenário C**: Você precisa: (1) revisar o CSS, (2) gerar documentação das correções, (3) atualizar o README. A tarefa 2 depende da 1, e a 3 depende da 2. | | |

## Matriz de Decisão Pessoal

Crie uma regra prática SUA para decidir entre spawn e inline. Use o formato:

"Se [condição], então [decisão], porque [motivo]."

Exemplo: "Se a tarefa é especializada e já existe um agente para ela, então spawn, porque aproveito a especialização sem polluir o contexto do agente principal."

## Conclusão

[Em 2-3 frases: qual o principal trade-off ao decidir entre spawnar um subagente e resolver inline?]
```

---

## Questão 7: Agente Revisor do Portal (PROJETO PROGRESSIVO)

**Conceito-chave:** Construção do agente revisor de código (Aula 08, Seção 9).

**Objetivo:** Criar o agente revisor de código para o harness do Portal de Projetos Dev.

**Passos de Execução:**

1. Crie o arquivo `.github/agents/revisor-codigo.agent.md` (se ainda não existe da Mão na Massa 4)
2. Defina frontmatter com:
   - `name`: revisor-codigo
   - `description`: descrição precisa e específica (mínimo 20 palavras)
   - `tools`: apenas `read` e `search`
   - `model`: premium (justifique)
3. Escreva system prompt com:
   - Propósito e escopo: revisão de código do Portal de Projetos Dev
   - Regras de revisão: semântica HTML, acessibilidade WCAG, segurança JS
   - Formato de saída: severidade, problema, localização, sugestão
   - Skills integradas: referencie `/revisar-acessibilidade` e `/validar-html`
4. Teste: peça ao Copilot para revisar `index.html` usando o agente revisor
5. Registre o resultado da revisão

**Entrega:** crie `entregas-aula-08/08-07-revisor-codigo.agent.md`:

```markdown
# Questão 7 — Agente Revisor de Código

## Arquivo do Agente

[Cole aqui o conteúdo completo de `.github/agents/revisor-codigo.agent.md`]

## Justificativa das Tools

Por que `read` e `search` são as únicas ferramentas necessárias? O que aconteceria se o agente tivesse `edit`?

## Resultado do Teste

Cole aqui o relatório de revisão gerado pelo agente para `index.html`:

```
[Relatório gerado pelo Copilot]
```

## Reflexão

A descrição que você escreveu foi específica o suficiente? O Copilot selecionou o agente corretamente quando você pediu a revisão?
```

---

## Questão 8: Agente Documentador do Portal (PROJETO PROGRESSIVO)

**Conceito-chave:** Construção do agente gerador de documentação (Aula 08, Seção 9).

**Objetivo:** Criar o agente gerador de documentação para o harness do Portal de Projetos Dev.

**Passos de Execução:**

1. Crie o arquivo `.github/agents/gerador-docs.agent.md` (se ainda não existe da Mão na Massa 5)
2. Defina frontmatter com:
   - `name`: gerador-docs
   - `description`: descrição precisa (mínimo 20 palavras)
   - `tools`: `read`, `search` e `edit` (precisa escrever a documentação)
   - `model`: rápido e barato para tarefas textuais (justifique)
3. Escreva system prompt com:
   - Propósito: gerar documentação técnica em Markdown
   - Formato padrão: título, descrição, pré-requisitos, uso, API, exemplos
   - Regras: Markdown válido, exemplos com syntax highlighting, links para arquivos
   - Instrução: salvar como `README.md` ou `<nome>.docs.md`
4. Teste: peça ao Copilot para documentar `app.js` usando o agente documentador
5. Registre a documentação gerada

**Entrega:** crie `entregas-aula-08/08-08-gerador-docs.agent.md`:

```markdown
# Questão 8 — Agente Gerador de Documentação

## Arquivo do Agente

[Cole aqui o conteúdo completo de `.github/agents/gerador-docs.agent.md`]

## Justificativa do Modelo

Por que você escolheu um modelo rápido e barato para este agente, em vez de um modelo premium?

## Documentação Gerada

Cole aqui a documentação que o agente gerou para `app.js`:

```
[Documentação gerada pelo Copilot]
```

## Integração com o Revisor

Imagine que o agente revisor apontou 3 problemas no `app.js`. Como o agente documentador poderia incorporar essas sugestões na documentação? Explique o fluxo de orquestração.
```

---

## Checklist Final: Pronto para a Aula 09?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Sei explicar o que são Custom Agents e por que criar agentes especializados em vez de usar sempre o agente generalista
- [ ] Consigo descrever todos os campos do frontmatter de um `.agent.md` — nome, descrição, tools, modelo, infer, mcp-servers, target — classificando cada um como obrigatório ou opcional
- [ ] Sei restringir ferramentas de um agente com o campo `tools` e justificar cada escolha pelo princípio do menor privilégio
- [ ] Sei escolher o modelo adequado para cada tipo de agente com base no triângulo latência × qualidade × custo
- [ ] Sei criar agentes via `/create-agent` e manualmente em `.github/agents/*.agent.md`
- [ ] Entendo o ciclo de vida de um subagente (selected → started → completed/failed → deselected) e como delegar tarefas com `runSubagent`
- [ ] Sei identificar quando usar Fleet mode (tarefas independentes e paralelizáveis) e quando não usar (tarefas sequenciais ou encadeadas)
- [ ] Consigo decidir entre spawnar um subagente, resolver inline ou usar Fleet mode com base em heurísticas práticas
- [ ] Tenho o agente `revisor-codigo.agent.md` funcionando no meu harness, capaz de revisar código do Portal de Projetos Dev
- [ ] Tenho o agente `gerador-docs.agent.md` funcionando no meu harness, capaz de gerar documentação Markdown para componentes do portal

> *Acertou todos? Você está pronto para a Aula 09: MCP — Model Context Protocol, onde seus agentes aprenderão a se conectar com fontes externas de dados e ferramentas. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
