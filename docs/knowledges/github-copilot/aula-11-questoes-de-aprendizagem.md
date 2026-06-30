---
titulo: "Aula 11 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 11: Copilot CLI, Cloud Agent e Code Review"
data: 2026-06-20
---

# Aula 11 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o **checkpoint de domínio** da Aula 11. A pergunta central é: *"eu realmente entendi o que aprendi?"*

Cada questão abaixo verifica um conceito-chave da aula. Você deve executar cada tarefa **sem consultar o conteúdo da aula** — se travar, anote onde travou e releia a seção indicada no campo **Conceito-chave** de cada questão.

**Como proceder:**

1. Crie a pasta `entregas-aula-11/` no diretório do seu Portal de Projetos Dev
2. Faça as questões em ordem (da mais simples para a mais complexa)
3. Para cada questão, copie o template de entrega e preencha com seus resultados
4. Ao final, revise o **Checklist Final** e marque apenas os itens que você consegue fazer sem consultar a aula
5. Só avance para a Aula 12 quando completar todas as 8 questões por conta própria

---

## Questão 1: CLI — Instalação e Primeiro Comando Interativo

**Conceito-chave:** CLI como interface de automação de agentes; distinção interactive vs programmatic (Aula 11, Seções 1 e 4).

**Objetivo:** Instalar o Copilot CLI e executar o primeiro comando interativo, verificando que a instalação e autenticação funcionam.

**Passos de Execução:**

1. Instale a extensão `gh-copilot` com o comando `gh extension install github/gh-copilot`
2. Autentique com `gh copilot auth` (se necessário)
3. Execute `gh copilot chat` no diretório raiz do Portal de Projetos Dev
4. Pergunte: "qual a estrutura deste projeto?"
5. Registre o output do comando e confirme que o agente identificou corretamente os arquivos do Portal

**Entrega:** crie `entregas-aula-11/01-cli-instalacao.md`:

```markdown
# Questão 1 — CLI: Instalação e Primeiro Comando Interativo

## Tabela de Verificação

| Etapa | Comando executado | Resultado (OK / Falha) | Observação |
|---|---|---|---|
| Instalação | `gh extension install github/gh-copilot` | | |
| Verificação de versão | `gh copilot --version` | | |
| Autenticação | `gh copilot auth` | | |
| Chat interativo | `gh copilot chat` | | |
| Pergunta: estrutura do projeto | "qual a estrutura deste projeto?" | | |

## Output do Primeiro Comando

```
Cole aqui o output do `gh copilot explain` ou do chat interativo
```

## Análise

O agente identificou corretamente os arquivos do Portal? [Sim / Não / Parcialmente]

Se parcialmente ou não, o que faltou?
```

---

## Questão 2: Chat Interativo com Contexto do Repositório

**Conceito-chave:** Modo interativo com estado e contexto do repositório (Aula 11, Seção 4).

**Objetivo:** Demonstrar que o Copilot CLI acessa o contexto do repositório e mantém estado entre perguntas na mesma sessão.

**Passos de Execução:**

1. Inicie `gh copilot chat` no diretório do Portal de Projetos Dev
2. Pergunte: "liste os arquivos CSS e descreva o que cada um faz"
3. Na mesma sessão, sem reiniciar, pergunte: "agora sugira uma melhoria de acessibilidade para o styles.css"
4. Verifique se a segunda resposta referencia o contexto estabelecido na primeira pergunta
5. Registre a transcrição completa da sessão

**Entrega:** crie `entregas-aula-11/02-chat-interativo.md`:

```markdown
# Questão 2 — Chat Interativo com Contexto do Repositório

## Transcrição da Sessão

```
Pergunta 1: liste os arquivos CSS e descreva o que cada um faz

Resposta:
[cole a resposta aqui]

Pergunta 2: agora sugira uma melhoria de acessibilidade para o styles.css

Resposta:
[cole a resposta aqui]
```

## Análise de Coerência

A segunda resposta referencia o contexto da primeira? [Sim / Não / Parcialmente]

Explique como essa coerência (ou falta dela) se manifesta:

[escreva 2-3 frases]

## Conclusão

O modo interativo com estado é útil quando: [complete a frase]
```

---

## Questão 3: Script Programático para Análise de Diff

**Conceito-chave:** Modo programático, `--non-interactive`, exit codes, piping (Aula 11, Seção 5).

**Objetivo:** Construir um script bash que usa o Copilot CLI em modo programático para analisar mudanças no código.

**Passos de Execução:**

1. Crie `scripts/review-changes.sh` no diretório do Portal
2. O script deve capturar o diff do último commit (`git diff HEAD~1`)
3. Envie o diff para `gh copilot explain --non-interactive`
4. Salve o output em `reviews/latest.md`
5. Verifique o exit code e trate erros (se diff vazio, se CLI falhar)
6. Teste com um commit real no Portal (faça uma alteração pequena, commit, e execute o script)

**Entrega:** crie `entregas-aula-11/03-script-programatico.md`:

```markdown
# Questão 3 — Script Programático para Análise de Diff

## Script Completo

```bash
[cole aqui o conteúdo completo de scripts/review-changes.sh]
```

## Explicação Linha a Linha

| Linha (ou bloco) | O que faz | Por que é importante |
|---|---|---|
| `#!/bin/bash` | | |
| `set -euo pipefail` | | |
| ... | | |
| `gh copilot explain --non-interactive` | | |

## Teste

**Alteração realizada:** [descreva o que foi alterado no Portal]

**Exit code:** [0 / 1 / 2]

**Output do script:**

```
[cole as primeiras 20 linhas do reviews/latest.md]
```

**Análise:** O output é coerente com a alteração realizada? [Sim / Não] — Justifique.
```

---

## Questão 4: Autopilot e /fleet — Cenário de Orquestração

**Conceito-chave:** Autopilot loop e /fleet distribuição paralela (Aula 11, Seção 6).

**Objetivo:** Planejar e documentar um cenário de uso de Autopilot e /fleet para o Portal, descrevendo como as tarefas seriam distribuídas e orquestradas.

**Passos de Execução:**

1. Identifique uma tarefa multi-arquivo no Portal (ex: "converter funções para arrow functions em todos os arquivos JS" ou "adicionar tema escuro em todos os componentes")
2. Descreva como o Autopilot executaria essa tarefa passo a passo (sequencial, iteração autônoma)
3. Descreva como o /fleet distribuiria subtarefas entre agentes paralelos
4. Compare as duas abordagens: quando usar Autopilot vs quando usar /fleet

**Entrega:** crie `entregas-aula-11/04-autopilot-fleet.md`:

```markdown
# Questão 4 — Autopilot e /fleet: Cenário de Orquestração

## Tarefa Selecionada

**Descrição:** [descreva a tarefa multi-arquivo]

**Arquivos envolvidos:** [liste]

## Abordagem 1: Autopilot (Sequencial)

**Comando CLI:** `gh copilot chat --autopilot "[descrição da tarefa]"`

**Passos que o Autopilot executaria:**

1. [passo 1]
2. [passo 2]
3. [passo 3]
...

**Vantagens:** [lista]

**Desvantagens:** [lista]

## Abordagem 2: /fleet (Paralelo)

**Comando CLI:** `/fleet "[descrição da tarefa decomposta]"`

**Decomposição em subtarefas:**

| Subtarefa | Agente responsável | Arquivo alvo |
|---|---|---|
| | Agente 1 | |
| | Agente 2 | |
| | Agente 3 | |

**Agregação de resultados:** [como os resultados parciais seriam consolidados]

**Vantagens:** [lista]

**Desvantagens:** [lista]

## Comparação Final

| Critério | Autopilot | /fleet |
|---|---|---|
| Execução | Sequencial iterativa | Paralela |
| Melhor para | [quando?] | [quando?] |
| Risco de conflito | [baixo/médio/alto] | [baixo/médio/alto] |

**Minha escolha para esta tarefa:** [Autopilot / /fleet] porque [justificativa]
```

---

## Questão 5: Cloud Agent — Workflow de Configuração

**Conceito-chave:** Agentes remotos, triggers, GITHUB_TOKEN, workflow YAML (Aula 11, Seções 2 e 7).

**Objetivo:** Escrever o arquivo YAML de configuração do Cloud Agent que responde a comentários em issues.

**Passos de Execução:**

1. Crie `.github/workflows/copilot-cloud-agent.yml` no repositório do Portal
2. Configure trigger `issue_comment` com filtro para comentários contendo `/copilot`
3. Configure permissões: `issues: write`, `contents: write`, `pull-requests: write`
4. Adicione o step que faz checkout do repositório
5. Adicione o step que invoca o Copilot Agent Action com token e instructions
6. Explique cada seção do YAML com comentários no próprio arquivo (ou na seção de análise abaixo)

**Entrega:** crie `entregas-aula-11/05-cloud-agent-workflow.md`:

```markdown
# Questão 5 — Cloud Agent: Workflow de Configuração

## Workflow YAML Completo

```yaml
[cole aqui o conteúdo completo de .github/workflows/copilot-cloud-agent.yml]
```

## Explicação de Cada Bloco

| Bloco | Propósito | Por que precisa existir |
|---|---|---|
| `name` | | |
| `on.issue_comment` | | |
| `if: contains(...)` | | |
| `permissions` | | |
| `jobs.copilot-agent` | | |
| `actions/checkout@v4` | | |
| `github/copilot-agent-action` | | |
| `GITHUB_TOKEN` | | |

## Verificação

- [ ] O arquivo YAML foi criado no caminho correto (`.github/workflows/copilot-cloud-agent.yml`)
- [ ] O trigger filtra apenas comentários com `/copilot`
- [ ] As permissões são mínimas para a tarefa
- [ ] O workflow aparece na aba Actions do GitHub (após push)
- [ ] O GitHub não aponta erro de sintaxe YAML
```

---

## Questão 6: Cloud Agent em Issues — Ciclo Completo

**Conceito-chave:** Atribuição `/copilot`, fluxo issue→branch→PR (Aula 11, Seção 8).

**Objetivo:** Documentar o ciclo completo de uma issue atribuída ao Cloud Agent, analisando cada etapa do fluxo.

**Passos de Execução:**

1. Crie uma issue real no repositório do Portal (ex: "adicionar botão de voltar ao topo")
2. Descreva o que o Cloud Agent faria em cada etapa (análise, planejamento, branch, implementação, PR)
3. Liste os artefatos gerados (branch, commits, PR)
4. Descreva como o humano revisaria o PR gerado
5. Identifique possíveis pontos de falha e como mitigá-los

**Entrega:** crie `entregas-aula-11/06-cloud-agent-issue.md`:

```markdown
# Questão 6 — Cloud Agent em Issues: Ciclo Completo

## Issue Criada

**Título:** [título da issue]

**Descrição:**

```
[cole o texto da issue]
```

**Comando de atribuição:** `/copilot`

## Fluxo Etapa por Etapa

| Etapa | O que o Cloud Agent faz | Artefato gerado |
|---|---|---|
| 1. Análise | | |
| 2. Planejamento | | |
| 3. Criação de branch | | |
| 4. Implementação | | |
| 5. Pull Request | | |

## Revisão Humana

**O que o humano deve verificar no PR gerado:**

- [ ] O código implementa o solicitado na issue?
- [ ] O código segue as convenções do projeto?
- [ ] Não há efeitos colaterais não intencionais?
- [ ] A descrição do PR é clara?

## Análise de Riscos

| Possível falha | Probabilidade (B/M/A) | Mitigação |
|---|---|---|
| Issue mal descrita | | |
| Agente não entende o contexto | | |
| Código gerado com bug | | |
| Workflow não dispara | | |
| Token sem permissão | | |

**Conclusão:** [2-3 frases sobre a efetividade do fluxo Cloud Agent]
```

---

## Questão 7: Code Review — Análise de Sugestões

**Conceito-chave:** Low vs medium effort, one-click apply, espectro de revisão (Aula 11, Seções 3 e 9).

**Objetivo:** Analisar um output simulado de Code Review e decidir quais sugestões aplicar, justificando cada decisão.

**Passos de Execução:**

1. Leia as 5 sugestões de Code Review fornecidas abaixo (simulando um PR no Portal)
2. Classifique cada sugestão: low effort ou medium effort?
3. Decida para cada uma: aplicar com 1 clique, modificar e aplicar, ou rejeitar
4. Justifique cada decisão com base nos critérios aprendidos na aula
5. Reflita: quais sugestões um revisor humano também faria? Quais são exclusivas da máquina?

**Sugestões de Code Review (simuladas):**

```
Sugestão 1: "A variável 'temp' na linha 42 de app.js não é utilizada. Considere removê-la."
Sugestão 2: "A função 'renderProjects' tem 45 linhas. Considere extrair a renderização de cards para uma função separada (princípio da responsabilidade única)."
Sugestão 3: "O arquivo styles.css usa tabulação mista (2 espaços e 4 espaços). Padronize para 2 espaços."
Sugestão 4: "O fetch em app.js linha 15 não tem tratamento de erro. Adicione um bloco catch ou use async/await com try/catch."
Sugestão 5: "Considere adicionar atributo 'loading=lazy' nas imagens do index.html para melhorar performance de carregamento."
```

**Entrega:** crie `entregas-aula-11/07-code-review-analise.md`:

```markdown
# Questão 7 — Code Review: Análise de Sugestões

## Tabela de Decisão

| Sugestão | Classificação (low/medium) | Decisão (aplicar/modificar/rejeitar) | Justificativa |
|---|---|---|---|
| 1 — Variável não usada | | | |
| 2 — Função muito longa | | | |
| 3 — Tabulação mista | | | |
| 4 — Falta tratamento de erro | | | |
| 5 — Loading lazy | | | |

## Reflexão

**Quais sugestões um revisor humano também faria?**

[liste e explique]

**Quais sugestões são exclusivas da máquina?**

[liste e explique]

**Qual sugestão tem maior impacto na qualidade do código?**

[responda e justifique]

**O one-click apply seria adequado em quais casos? Por quê?**

[responda]
```

---

## Questão 8: Projeto Progressivo — Workflow CI/CD Completo

**Conceito-chave:** Integração CI/CD, conexão harness local ↔ GitHub (Aula 11, Seções 9 e 10).

**Objetivo:** Criar e testar o workflow completo que revisa PRs do Portal automaticamente, conectando o harness local ao GitHub.

**Passos de Execução:**

1. Crie `.github/workflows/copilot-code-review.yml` com trigger `pull_request` (opened, synchronize, reopened)
2. Configure os jobs: checkout → Copilot Code Review → postar resultados como comentário no PR
3. Teste: crie um branch com mudanças no Portal, abra PR e verifique se o workflow dispara
4. Verifique os resultados do Code Review no PR (comentários inline e sumário)
5. Aplique pelo menos uma sugestão via one-click
6. Documente o ciclo completo

**Entrega:** crie `entregas-aula-11/08-workflow-cicd.md`:

```markdown
# Questão 8 — Projeto Progressivo: Workflow CI/CD Completo

## Workflow YAML

```yaml
[cole aqui o conteúdo completo de .github/workflows/copilot-code-review.yml]
```

## Teste Real

**Branch criada:** `[nome da branch]`

**Mudanças realizadas:** [descreva]

**PR criado:** [#número — título]

**Link do PR:** [URL]

## Resultado da Execução

**Workflow disparou?** [Sim / Não]

**Tempo de execução:** [X minutos / segundos]

**Número de sugestões geradas:** [X]

**Sugestões críticas:** [X]

**Sugestões aplicadas via one-click:** [X]

## Captura de Tela (descrição)

```
[Descreva o que aparece na tela do PR: comentários inline, sumário no topo, botões "Apply suggestion"]
```

## Análise do Ciclo Completo

| Etapa | Onde ocorre | Quem executa |
|---|---|---|
| 1. Desenvolvimento local | VS Code / CLI | Desenvolvedor |
| 2. Push | Terminal | Desenvolvedor |
| 3. Abertura do PR | GitHub | Desenvolvedor |
| 4. | | |
| 5. | | |
| 6. | | |
| 7. Merge | GitHub | Desenvolvedor |

## Conclusão

O workflow conecta o harness local ao GitHub porque: [complete com 3-4 frases explicando como o harness (instructions, skills, agents, MCP) influencia o resultado do Code Review remoto]

## Pontos de Melhoria

[Se você pudesse melhorar algo no workflow, o que seria?]
```

---

## Checklist Final: Pronto para a Aula 12?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Explicar** os dois modos do CLI-Based AI Agent (interativo vs programático) e quando usar cada um
- [ ] **Instalar** e **autenticar** o Copilot CLI, executando comandos no terminal do seu projeto
- [ ] **Construir** um script bash que usa o Copilot CLI em modo programático para análise de código
- [ ] **Descrever** como o Autopilot e o `/fleet` funcionam e em que cenários cada um é mais adequado
- [ ] **Configurar** um workflow de Cloud Agent no GitHub Actions com trigger, permissões e contexto
- [ ] **Atribuir** uma issue ao Cloud Agent via `/copilot` e explicar cada etapa do ciclo issue→branch→PR
- [ ] **Comparar** low effort vs medium effort no Code Review e decidir qual usar em cada cenário
- [ ] **Analisar** sugestões de code review, classificando por profundidade e decidindo se aplica, modifica ou rejeita
- [ ] **Criar** um workflow de CI/CD que dispara Code Review automaticamente em Pull Requests
- [ ] **Conectar** o harness local (instructions, skills, agents, MCP) com o GitHub via workflow Actions

> *Acertou todos? Você está pronto para a Aula 12, onde criará uma custom tool com o Copilot SDK, aplicará métricas de governança e fechará o ciclo do Continual Harness. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
