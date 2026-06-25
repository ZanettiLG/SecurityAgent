---
titulo: "Aula 01 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 01: Ecossistema GitHub Copilot e o Paradigma Agêntico"
data: 2026-06-18
---

# Aula 01 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de aprendizagem** — o momento "será que eu realmente entendi isso?". Cada questão verifica um conceito fundamental da Aula 01. Você deve resolvê-las em ordem, consultando apenas a aula referenciada se travar.

Cada questão traz um **Conceito-chave**, um **Objetivo**, **Passos de Execução** e um formato de **Entrega**. Crie a pasta `entregas-aula-01/` na raiz deste módulo e salve cada entrega no arquivo indicado.

Só avance para a Aula 02 quando conseguir completar todas as questões sem consultar a aula. Se travar, releia a seção indicada no Conceito-chave.

---

## Questão 1: Defina Coding Agent na Prática

**Conceito-chave:** Coding Agent vs Autocomplete (Aula 01, Seção 1).

**Objetivo:** Classificar 5 cenários de interação como autocomplete, copiloto ou agente, justificando cada classificação.

**Passos de Execução:**

1. Leia cada cenário abaixo.
2. Classifique como **autocomplete**, **copiloto** ou **agente**.
3. Escreva uma justificativa de 1-2 frases baseada nos critérios da Seção 1.

**Cenários:**

- **A:** Você digita `function calc` e o editor sugere `function calculateTotal(items) { return items.reduce(...`.
- **B:** Você seleciona 3 funções no código, abre o Copilot Chat e pergunta "extraia essas funções para um módulo separado".
- **C:** Você abre o arquivo `tests/` no Copilot Chat e pede "crie testes unitários para todos os métodos públicos dessa classe". O Copilot gera os arquivos e faz edições em cascade.
- **D:** Você pressiona Tab para aceitar uma sugestão cinza inline enquanto digita um `for` loop.
- **E:** Você ativa o Copilot Edits, descreve "adicione paginação ao endpoint GET /orders", e o Copilot modifica 4 arquivos, depois pede confirmação antes de aplicar.

**Entrega:** crie `entregas-aula-01/01-classificacao.md`:

```markdown
# Questão 1 — Classificação de Cenários

| Cenário | Classificação | Justificativa |
|---------|--------------|---------------|
| A |  |  |
| B |  |  |
| C |  |  |
| D |  |  |
| E |  |  |
```

---

## Questão 2: As 8 Dimensões em um Cenário Real

**Conceito-chave:** 8 dimensões da agencialidade (Aula 01, Seção 3).

**Objetivo:** Descrever como um copiloto vs um agente trataria "implementar uma nova rota de API", dimensão por dimensão.

**Passos de Execução:**

1. Revise as 8 dimensões da agencialidade na Seção 3.
2. Imagine o cenário: *"Implementar uma nova rota de API GET /projects/:id que retorna os dados de um projeto do banco."*
3. Para cada dimensão, descreva em 1-2 frases como um copiloto típico agiria vs como um agente agiria.

**Entrega:** crie `entregas-aula-01/02-dimensoes-api.md`:

```markdown
# Questão 2 — 8 Dimensões: Rota de API

| Dimensão | Copiloto | Agente |
|----------|----------|--------|
| Iniciativa |  |  |
| Escopo |  |  |
| Persistência |  |  |
| Ferramentas |  |  |
| Aprovação |  |  |
| Memória |  |  |
| Planejamento |  |  |
| Execução |  |  |
```

---

## Questão 3: Trace o Ciclo de Decisão

**Conceito-chave:** Ciclo de decisão do coding agent (Aula 01, Seção 4).

**Objetivo:** Dado o cenário "adicionar validação de e-mail no formulário de contato", traçar o ciclo completo de decisão que um coding agent executaria.

**Passos de Execução:**

1. Identifique o *primeiro ciclo*: o que o system prompt contém, quais tools estão disponíveis, qual contexto é carregado.
2. Simule 3-4 iterações do ciclo (system prompt → tools → contexto → histórico → decisão).
3. Para cada iteração, indique o tipo de decisão tomada (Texto, Tool Call, Question).

**Entrega:** crie `entregas-aula-01/03-ciclo-decisao.md`:

```markdown
# Questão 3 — Ciclo de Decisão: Validação de E-mail

## Iteração 1
- **System Prompt:** ...
- **Tools disponíveis:** ...
- **Contexto carregado:** ...
- **Histórico:** ...
- **Decisão:** ...
- **Tipo:** [Texto | Tool Call | Question]

## Iteração 2
...
```

---

## Questão 4: Mapeie o Ecossistema

**Conceito-chave:** Ecossistema GitHub Copilot (Aula 01, Seção 5).

**Objetivo:** Criar uma tabela com os 12 produtos do ecossistema GitHub Copilot em GA, sua função e nível de agencialidade

**Passos de Execução:**

1. Liste os 12 produtos do ecossistema GitHub Copilot em GA (Code Completion, Next Edit Suggestions, Chat, Agent Mode, Cloud Agent, CLI, Code Review, PR Summaries, Custom Agents, Agent Skills, MCP, SDK).
2. Para cada um, descreva a função principal em 1 frase.
3. Classifique o nível de agencialidade como **baixo**, **médio** ou **alto**.

**Entrega:** crie `entregas-aula-01/04-ecossistema.md`:

```markdown
# Questão 4 — Ecossistema GitHub Copilot

| Produto / Plano | Função | Nível de Agencialidade |
|-----------------|--------|------------------------|
|  |  |  |
```

---

## Questão 5: Posicione o Copilot nas 8 Dimensões

**Conceito-chave:** Posicionamento do Copilot (Aula 01, Seção 6).

**Objetivo:** Atribuir uma nota de 1 a 5 para o GitHub Copilot em cada dimensão da agencialidade, justificando com um exemplo concreto de funcionalidade.

**Passos de Execução:**

1. Reveja o posicionamento discutido na Seção 6.
2. Para cada dimensão, dê uma nota de 1 (mínimo) a 5 (máximo).
3. Justifique cada nota citando uma funcionalidade real do produto.

**Entrega:** crie `entregas-aula-01/05-posicionamento.md`:

```markdown
# Questão 5 — Posicionamento do Copilot nas 8 Dimensões

| Dimensão | Nota (1-5) | Justificativa |
|----------|-----------|---------------|
| Iniciativa |  |  |
| Escopo |  |  |
| Persistência |  |  |
| Ferramentas |  |  |
| Aprovação |  |  |
| Memória |  |  |
| Planejamento |  |  |
| Execução |  |  |
```

---

## Questão 6: Desenhe a Anatomia do Harness

**Conceito-chave:** Conceito de Harness (Aula 01, Seção 7).

**Objetivo:** Listar cada componente do harness e explicar seu papel em 1-2 frases, incluindo o arquivo associado.

**Passos de Execução:**

1. Reveja a definição de harness na Seção 7.
2. Identifique 6 ou mais componentes que formam o harness: Custom Instructions, Conditional Instructions, Custom Agents, Skills, Prompts, MCP Servers, Hooks, Config.
3. Para cada componente, indique um arquivo típico e descreva sua função.

**Entrega:** crie `entregas-aula-01/06-anatomia-harness.md`:

```markdown
# Questão 6 — Anatomia do Harness

| Componente | Arquivo Típico | Função |
|------------|----------------|--------|
|  |  |  |
```

---

## Questão 7: Projete o Harness Inicial do Portal (Projeto Progressivo)

**Conceito-chave:** Harness + Projeto Progressivo (Aula 01, Seção 7).

**Objetivo:** Para o *Portal de Projetos Dev* (dashboard em HTML+CSS+JS vanilla), esboçar 5 regras de projeto para `copilot-instructions.md`, 3 ferramentas que o agente precisa e os níveis de autonomia por tipo de tarefa.

**Passos de Execução:**

1. Reveja o conceito de Projeto Progressivo e como ele se aplica ao Portal.
2. Escreva 5 regras que iriam no `copilot-instructions.md` para guiar o agente no estilo, arquitetura e convenções do projeto.
3. Defina 3 ferramentas (tools) essenciais que o agente precisaria ter disponíveis.
4. Para cada tipo de tarefa (css, js, html, assets), defina o nível de autonomia do agente (automática, supervisionada, manual).

**Entrega:** crie `entregas-aula-01/07-harness-portal.md`:

```markdown
# Questão 7 — Harness Inicial do Portal de Projetos Dev

## 1 — Regras para copilot-instructions.md

1. ...
2. ...
3. ...
4. ...
5. ...

## 2 — Ferramentas Essenciais

- **Tool 1:** ...
- **Tool 2:** ...
- **Tool 3:** ...

## 3 — Níveis de Autonomia

| Tipo de Tarefa | Autonomia | Justificativa |
|----------------|-----------|---------------|
| CSS |  |  |
| JavaScript |  |  |
| HTML |  |  |
| Assets |  |  |
```

---

## Checklist Final: Pronto para a Aula 02?

- [ ] Sei explicar a diferença entre autocomplete, copiloto e agente para um colega
- [ ] Consigo listar as 8 dimensões da agencialidade e descrever o que cada uma mede
- [ ] Entendo o ciclo de decisão de um coding agent (system prompt → tools → contexto → histórico → decisão)
- [ ] Conheço os principais produtos do ecossistema GitHub Copilot e suas funções
- [ ] Sei comparar os planos (Free, Pro, Pro+, Max) e entendo a relação entre plano e acesso a modelos
- [ ] Consigo posicionar o Copilot nas 8 dimensões e justificar cada posição
- [ ] Entendo o que é um harness e quais são seus componentes
- [ ] Tenho uma visão clara do que vou construir nas próximas 11 aulas

> *Acertou todos? Você está pronto para a Aula 02 — Setup, Instalação e Primeiros Passos no VS Code. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
