---
titulo: "Aula 10 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 10: Hooks, Plugins e Extensões no Copilot"
data: 2026-06-20
---

# Aula 10 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o seu **checkpoint de domínio** da Aula 10. A pergunta central é: "eu realmente entendi hooks, plugins e extensões?"

Cada questão abaixo verifica um conceito-chave da aula. Você deve resolvê-las **sem consultar a aula** — se travar, releia a seção indicada antes de tentar novamente. Só avance para a Aula 11 quando completar todas as questões.

**Como proceder:**

1. Crie uma pasta `entregas-aula-10/` dentro do seu projeto Portal de Projetos Dev
2. Responda cada questão em ordem, criando um arquivo separado por questão
3. Cada questão fornece um template — copie, preencha e salve
4. Ao final, revise o Checklist e verifique se está pronto para a próxima aula

---

## Questão 1: Mapeando os 8 Eventos de Lifecycle

**Conceito-chave:** Os 8 eventos de lifecycle (Aula 10, Seções 1 e 2).

**Objetivo:** Demonstrar que você conhece os 8 eventos de lifecycle de um agente e consegue classificá-los por família (pre-event vs post-event).

**Passos de Execução:**

1. Liste os 8 eventos de lifecycle usando os nomes do Copilot (sessionStart, etc.)
2. Classifique cada um como pre-event ou post-event
3. Para cada evento, descreva em uma frase qual o melhor caso de uso

**Entrega:** crie `entregas-aula-10/01-mapeamento-eventos.md`:

```markdown
# Questão 1 — Mapeamento dos 8 Eventos

## Tabela de Eventos

| Evento (nome Copilot) | Família (pre/post) | Melhor caso de uso |
|---|---|---|
| sessionStart | | |
| userPromptSubmitted | | |
| preToolUse | | |
| postToolUse | | |
| agentStop | | |
| subagentStop | | |
| errorOccurred | | |
| sessionEnd | | |

## Reflexão

Por que `preToolUse` é o único hook que pode bloquear uma ação? Explique em 2-3 frases.
```

---

## Questão 2: Diferenciando Pre-Event e Post-Event

**Conceito-chave:** Famílias de hooks (Aula 10, Seção 1.2).

**Objetivo:** Verificar se você entende a diferença prática entre hooks que podem bloquear ações e hooks que apenas reagem.

**Passos de Execução:**

1. Crie um cenário onde um hook pre-event evita um desastre
2. Crie um cenário onde um hook post-event melhora a qualidade do código
3. Para cada cenário, explique POR QUE a família escolhida (pre ou post) é a correta

**Entrega:** crie `entregas-aula-10/02-pre-vs-post.md`:

```markdown
# Questão 2 — Pre-Event vs Post-Event

## Cenário 1: Prevenção (Pre-Event)

**Descrição do cenário:**

[Descreva uma situação onde um hook pre-event evita um problema]

**Por que pre-event é a escolha certa?**

[Sua explicação]

## Cenário 2: Reação (Post-Event)

**Descrição do cenário:**

[Descreva uma situação onde um hook post-event agrega valor]

**Por que post-event é a escolha certa?**

[Sua explicação]
```

---

## Questão 3: Mapeamento Genérico para Copilot

**Conceito-chave:** Mapeamento de eventos genéricos para nomes do Copilot (Aula 10, Seção 4).

**Objetivo:** Demonstrar que você entende a correspondência entre os conceitos universais da Parte 1 e a implementação específica do Copilot.

**Passos de Execução:**

1. Relembre os 8 eventos genéricos da Parte 1 (início_sessao, comando_usuario, etc.)
2. Preencha a tabela de mapeamento abaixo
3. Para cada par (genérico → Copilot), explique por que o nome do Copilot faz sentido

**Entrega:** crie `entregas-aula-10/03-mapeamento-generico-copilot.md`:

```markdown
# Questão 3 — Mapeamento Genérico → Copilot

## Tabela de Correspondência

| Evento Genérico (Parte 1) | Evento no Copilot (Parte 2) |
|---|---|
| Início de Sessão | |
| Entrada do Usuário | |
| Pré-Execução de Ferramenta | |
| Pós-Execução de Ferramenta | |
| Conclusão do Agente | |
| Conclusão do Subagente | |
| Erro | |
| Fim de Sessão | |

## Análise

Escolha um dos pares acima e explique por que o nome do Copilot é mais descritivo ou específico que o nome genérico.
```

---

## Questão 4: Anatomia de um Hook — Variáveis de Ambiente

**Conceito-chave:** Variáveis de ambiente em hooks (Aula 10, Seção 5.2).

**Objetivo:** Verificar se você conhece as variáveis de ambiente que o Copilot disponibiliza para cada evento de hook.

**Passos de Execução:**

1. Liste 5 variáveis de ambiente disponíveis nos hooks do Copilot
2. Para cada variável, indique em quais eventos ela está disponível
3. Crie um mini-exemplo de script que use pelo menos 2 dessas variáveis

**Entrega:** crie `entregas-aula-10/04-variaveis-ambiente.md`:

```markdown
# Questão 4 — Variáveis de Ambiente em Hooks

## Tabela de Variáveis

| Variável | Eventos onde está disponível | O que contém |
|---|---|---|
| COPILOT_EVENT | | |
| COPILOT_TOOL_NAME | | |
| COPILOT_TOOL_PARAMS | | |
| COPILOT_ERROR_MESSAGE | | |
| COPILOT_SESSION_ID | | |

## Script de Exemplo

```bash
#!/bin/bash
# Meu script de exemplo

```

[Explique o que seu script faz]
```

---

## Questão 5: Criando um Hook de Lint Pós-Execução

**Conceito-chave:** Hook postToolUse (Aula 10, Seção 5.1).

**Objetivo:** Demonstrar que você sabe criar um hook `postToolUse.sh` funcional que executa validação automática após cada tool use.

**Passos de Execução:**

1. Crie o script `postToolUse.sh` que executa `npx eslint . --fix --quiet` quando a tool executada for de edição de arquivo
2. O script deve logar o início e o fim da validação
3. Adicione tratamento para não quebrar o fluxo do Copilot se o linter falhar (use `|| true`)
4. Simule a execução manualmente com `export COPILOT_TOOL_NAME=write_file`

**Entrega:** crie `entregas-aula-10/05-hook-posttooluse.sh` com o script completo e os comandos de teste. Inclua comentários explicando cada seção.

---

## Questão 6: Criando um Hook de Segurança Pré-Execução

**Conceito-chave:** Hook preToolUse (Aula 10, Seção 5.1 e Exercícios - Médio).

**Objetivo:** Demonstrar que você sabe criar um hook `preToolUse.sh` que bloqueia comandos perigosos.

**Passos de Execução:**

1. Crie o script `preToolUse.sh` que detecta comandos shell perigosos
2. Inclua pelo menos 4 padrões de bloqueio (ex: `rm -rf`, `git push --force`, `DROP TABLE`, `chmod 777`)
3. O script DEVE permitir comandos normais (exit 0) e BLOQUEAR comandos perigosos (exit 1)
4. Adicione mensagens claras de log informando o bloqueio
5. Teste manualmente com `export COPILOT_TOOL_PARAMS='{"command":"rm -rf /"}'`

**Entrega:** crie `entregas-aula-10/06-hook-pretooluse.sh` com o script completo e os comandos de teste.

---

## Questão 7: Anatomia de um Agent Plugin

**Conceito-chave:** Agent Plugin (Aula 10, Seção 6).

**Objetivo:** Verificar se você entende a estrutura de um Agent Plugin e o propósito de cada componente.

**Passos de Execução:**

1. Descreva em uma frase o que é um Agent Plugin
2. Liste os 4 componentes principais que um plugin pode conter
3. Para cada componente, explique o que ele traz de valor para o plugin
4. Explique a diferença entre uma Skill isolada e um Agent Plugin

**Entrega:** crie `entregas-aula-10/07-anatomia-plugin.md`:

```markdown
# Questão 7 — Anatomia de um Agent Plugin

## Definição

[Em uma frase: o que é um Agent Plugin?]

## Componentes e Valor

| Componente | O que inclui | Valor para o usuário do plugin |
|---|---|---|
| Skills | | |
| Agents | | |
| MCP Config | | |
| Hooks | | |

## Skill vs Plugin

Qual a diferença entre uma Skill (ex: `revisar-acessibilidade/SKILL.md`) e um Agent Plugin (ex: `portal-dev-harness/`)?

[Explique em 3-4 frases]
```

---

## Questão 8: GitHub Marketplace e awesome-copilot

**Conceito-chave:** Ecossistema de extensões (Aula 10, Seção 7).

**Objetivo:** Demonstrar que você conhece o ecossistema de extensões do Copilot e sabe diferenciar Agent Apps de Agent Plugins.

**Passos de Execução:**

1. Acesse o repositório [awesome-copilot](https://github.com/github/awesome-copilot) e navegue pela categoria Plugins
2. Identifique 2 plugins que você considera interessantes e anote seus nomes e descrições
3. Explique a diferença entre Agent App e Agent Plugin em termos de complexidade e distribuição
4. Liste as 4 formas de distribuir seu próprio plugin

**Entrega:** crie `entregas-aula-10/08-ecossistema-extensoes.md`:

```markdown
# Questão 8 — Ecossistema de Extensões

## Plugins Interessantes no awesome-copilot

1. **Nome:** [nome do plugin]
   **Descrição:** [descrição]

2. **Nome:** [nome do plugin]
   **Descrição:** [descrição]

## Agent App vs Agent Plugin

| Característica | Agent App | Agent Plugin |
|---|---|---|
| Complexidade | | |
| Onde roda | | |
| Distribuição | | |
| Exemplo | | |

## Formas de Distribuição

1. [Forma 1]
2. [Forma 2]
3. [Forma 3]
4. [Forma 4]
```

---

## Questão 9: Projeto Progressivo — Hooks e Plugin no Portal

**Conceito-chave:** Projeto Progressivo da Aula 10 (Aula 10, Seção 8).

**Objetivo:** Demonstrar que você consegue integrar hooks e o empacotamento do plugin no contexto do seu Portal de Projetos Dev.

**Passos de Execução:**

1. Liste os hooks que você criou para o Portal de Projetos Dev e o propósito de cada um
2. Crie a estrutura de diretórios do plugin `portal-dev-harness/`
3. Escreva o `manifest.json` referenciando skills, agents, hooks e MCP do seu projeto
4. Execute `bash hooks/sessionStart.sh` manualmente e cole o output
5. Verifique a integridade: liste os arquivos que cada caminho do `manifest.json` referencia

**Entrega:** crie `entregas-aula-10/09-projeto-progressivo.md`:

```markdown
# Questão 9 — Projeto Progressivo: Hooks e Plugin

## Hooks do Portal

| Hook | Propósito |
|---|---|
| postToolUse.sh | |
| preToolUse.sh | |
| sessionStart.sh | |

## Estrutura do Plugin

```
[cole a saída de `tree /F` ou `ls -R` do seu diretório portal-dev-harness/]
```

## manifest.json

```json
{
  "name": "portal-dev-harness",
  "version": "1.0.0",
  "description": "Harness para desenvolvimento do Portal de Projetos Dev",
  "author": "seu-usuario",
  "license": "MIT",
  "components": {
    "skills": [...],
    "agents": [...],
    "hooks": [...],
    "mcp": [...]
  },
  "copilot": {
    "minVersion": "1.0.0"
  }
}
```

## Teste do Hook

Output de `bash hooks/sessionStart.sh`:

```
[cole o output aqui]
```

## Verificação de Integridade

| Caminho no manifest.json | Arquivo existe? (Sim/Não) |
|---|---|
| skills/... | |
| agents/... | |
| hooks/... | |
| mcp/... | |
```

---

## Questão 10: Depurando um Hook com Problema

**Conceito-chave:** Debugging de hooks (Aula 10, FAQ e Seção 5).

**Objetivo:** Demonstrar que você sabe diagnosticar e corrigir problemas em hooks.

**Passos de Execução:**

1. Leia o cenário problemático abaixo
2. Identifique a causa do problema
3. Proponha uma correção
4. Explique como você testaria a correção

**Cenário:** Um desenvolvedor criou `postToolUse.sh` que executa `npx eslint . --fix` mas o Copilot parou de responder após a execução da primeira ferramenta. O script funciona perfeitamente quando executado manualmente no terminal.

**Entrega:** crie `entregas-aula-10/10-depuracao-hook.md`:

```markdown
# Questão 10 — Depuração de Hook

## Diagnóstico

**Problema observado:**

[Descreva o sintoma]

**Causa provável:**

[Explique o que pode estar causando o problema]

## Correção Proposta

[Descreva a correção — que linha(s) adicionar/remover/modificar]

## Procedimento de Teste

[Passo a passo para testar a correção antes de colocar em produção]

## Prevenção

[Como evitar esse problema no futuro]
```

---

## Checklist Final: Pronto para a Aula 11?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Descrevo o ciclo de vida de execução de um agente e sei onde os hooks se inserem
- [ ] Identifico os 8 eventos de lifecycle pelos nomes do Copilot (sessionStart, preToolUse, etc.)
- [ ] Diferencio hooks pre-event (podem bloquear) de post-event (apenas reagem/registram)
- [ ] Crio um script de hook shell e coloco no diretório `.github/hooks/` com o nome correto
- [ ] Sei quais variáveis de ambiente cada hook recebe (COPILOT_EVENT, COPILOT_TOOL_NAME, etc.)
- [ ] Construo um hook `preToolUse.sh` que bloqueia comandos perigosos
- [ ] Construo um hook `postToolUse.sh` que executa validação automática
- [ ] Defino o que é um Agent Plugin e listo seus 4 componentes principais
- [ ] Estruturo um Agent Plugin completo com `manifest.json` referenciando skills, agents, hooks e MCP
- [ ] Conheço as opções de distribuição de plugins (Marketplace, repositório Git, awesome-copilot, compartilhamento direto)
- [ ] Empacotei o harness do Portal de Projetos Dev como um plugin distribuível

> *Acertou todos? Você está pronto para a Aula 11, onde vamos expandir o Copilot para além do VS Code com CLI, Cloud Agent e Code Review automatizado. Travou em algum? Releia a seção da aula indicada na questão correspondente antes de avançar.*
