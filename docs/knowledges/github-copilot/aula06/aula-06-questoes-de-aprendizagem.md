---
titulo: "Aula 06 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 06: Slash Commands e Workflows de Desenvolvimento"
data: 2026-06-20
---

# Aula 06 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o seu **checkpoint de domínio**. A pergunta central é: *"eu realmente entendi a matéria?"*

Cada questão verifica um conceito-chave da Aula 06. Você deve fazer as questões **na ordem**, sem consultar a aula principal — se travar, volte e releia a seção indicada no campo **Conceito-chave**.

Cada questão tem:
- **Conceito-chave:** o que está sendo verificado e onde encontrar na aula
- **Objetivo:** o que você precisa demonstrar
- **Passos de Execução:** o que fazer, passo a passo
- **Entrega:** o que produzir e onde salvar

Crie a pasta `entregas-aula06/` na raiz do seu projeto e salve cada entrega como `06-questao-N.md`.

> ⚠️ **Importante:** não há gabarito neste arquivo. Se você conseguir fazer todas as questões sem consultar a aula, você dominou a matéria. Se travar, a seção indicada em **Conceito-chave** é exatamente onde revisar.

---

## Questão 1: Classificando os Slash Commands

**Conceito-chave:** Classificação de slash commands por categoria (Aula 06, Seções 1-2).

**Objetivo:** Demonstrar que você sabe classificar qualquer slash command nas 6 categorias e explicar o propósito de cada uma.

**Passos de Execução:**

1. Liste as 6 categorias de slash commands com uma descrição de uma frase para cada
2. Para cada categoria, dê 2 exemplos de comandos que pertencem a ela
3. Explique, em suas palavras, por que a categorização é útil mesmo que os comandos específicos mudem entre versões

**Entrega:** crie `entregas-aula06/06-questao-01-classificacao.md`:

```markdown
# Questão 1 — Classificação de Slash Commands

## As 6 Categorias

| Categoria | Descrição | Exemplos de comandos |
|---|---|---|
| [nome] | [descrição em 1 frase] | [comando1], [comando2] |
| ... | ... | ... |

## Por que categorizar?

[Explique em 3-5 frases por que aprender as categorias é mais importante que memorizar comandos individuais]

## Reflexão

Você conseguiu listar as 6 categorias sem consultar a aula?
[ ] Sim, lembrei de todas
[ ] Sim, mas precisei pensar em algumas
[ ] Não, precisei consultar
```

---

## Questão 2: /explain e /doc na Prática

**Conceito-chave:** Uso de /explain e /doc para compreensão de código (Aula 06, Seção 5).

**Objetivo:** Demonstrar que você sabe usar /explain para entender código e /doc para gerar documentação automática.

**Passos de Execução:**

1. Abra o Portal de Projetos Dev no VS Code
2. Selecione uma função de mais de 5 linhas (ex: a função de filtro ou a de carregar projetos)
3. Use `/explain` no Chat e leia a explicação gerada
4. Use `/doc` na mesma função para gerar JSDoc
5. Cole a documentação gerada no arquivo de entrega
6. Responda: a documentação gerada segue o formato definido no seu `copilot-instructions.md`?

**Entrega:** crie `entregas-aula06/06-questao-02-explain-doc.md`:

```markdown
# Questão 2 — /explain e /doc na Prática

## Função Selecionada

[Nome do arquivo e linha onde está a função]

## O que o /explain disse

[Resuma em 2-3 frases a explicação que o Copilot deu]

## Documentação Gerada (/doc)

```javascript
// Cole aqui o JSDoc (ou docstring) gerado pelo /doc
```

## A documentação segue o copilot-instructions.md?

[ ] Sim, o formato corresponde ao definido
[ ] Não, o formato é diferente — [explique a diferença]

## Reflexão

O /doc gerou documentação útil ou você precisaria ajustá-la?
[Resposta em 2-3 frases]
```

---

## Questão 3: Diagnóstico e Correção

**Conceito-chave:** Diagnóstico com /troubleshoot e correção com /fix (Aula 06, Seções 5-6).

**Objetivo:** Demonstrar que você sabe diagnosticar um problema com /troubleshoot e corrigi-lo com /fix, entendendo a diferença entre os dois comandos.

**Passos de Execução:**

1. Introduza um bug INTENCIONAL no Portal de Projetos Dev (ex: remova um `return`, inverta uma condição, use uma variável inexistente)
2. Documente qual bug você introduziu e onde
3. Use `/fix` no código com bug
4. Leia a explicação da causa raiz fornecida pelo Copilot
5. Cole a correção sugerida e a explicação no arquivo de entrega
6. Explique com suas palavras: quando você usaria /troubleshoot em vez de /fix?

**Entrega:** crie `entregas-aula06/06-questao-03-correcao.md`:

```markdown
# Questão 3 — Diagnóstico e Correção

## Bug Introduzido

- **Arquivo:** [nome do arquivo]
- **Bug:** [descrição do que você mudou]
- **Comportamento esperado:** [o que deveria acontecer]
- **Comportamento observado:** [o que acontece com o bug]

## Correção do /fix

```javascript
// Cole a correção sugerida pelo Copilot
```

## Explicação da Causa Raiz

[Resuma a explicação dada pelo Copilot]

## /troubleshoot vs /fix

Em que cenário eu usaria /troubleshoot em vez de /fix?

[Explique em 2-3 frases]
```

---

## Questão 4: Geração de Testes

**Conceito-chave:** Geração de testes com /tests e /setupTests (Aula 06, Seção 7).

**Objetivo:** Demonstrar que você sabe gerar testes unitários com /tests e entende a diferença entre /tests e /setupTests.

**Passos de Execução:**

1. Selecione uma função do Portal de Projetos Dev (ex: a função de filtro ou a de contagem)
2. Use `/tests` para gerar testes
3. Analise os testes gerados: eles cobrem caminho feliz, edge cases e erros?
4. Se o projeto não tem framework de testes, use `/setupTests` primeiro
5. Salve os testes gerados e execute-os (se possível)
6. Responda: os testes passaram? Se não, por quê?

**Entrega:** crie `entregas-aula06/06-questao-04-testes.md`:

```markdown
# Questão 4 — Geração de Testes

## Função Testada

[Nome da função e arquivo]

## Framework de Teste

[Qual framework o /tests detectou? Se usou /setupTests, qual foi configurado?]

## Testes Gerados

[Liste os casos de teste que o /tests criou]

| Caso | O que testa | Passou? |
|---|---|---|
| [nome] | [descrição] | [sim/não] |
| ... | ... | ... |

## Análise

- Caminho feliz coberto? [sim/não — justifique]
- Edge cases cobertos? [sim/não — justifique]
- Casos de erro cobertos? [sim/não — justifique]

## /tests vs /setupTests

Explique com suas palavras a diferença entre os dois comandos e quando usar cada um.
```

---

## Questão 5: Planejamento com /plan

**Conceito-chave:** Planejamento de features com /plan antes de implementar (Aula 06, Seção 8).

**Objetivo:** Demonstrar que você sabe usar /plan para estruturar uma feature antes de escrever código.

**Passos de Execução:**

1. Escolha uma feature pequena para o Portal de Projetos Dev (ex: "adicionar contagem de projetos por status" ou "adicionar busca por nome")
2. No Chat, use `/plan` com uma descrição da feature
3. Analise o plano gerado: ele cobre todos os arquivos necessários? A ordem das etapas faz sentido?
4. Copie o plano para o arquivo de entrega
5. Critique o plano: o que você adicionaria, removeria ou mudaria?

**Entrega:** crie `entregas-aula06/06-questao-05-plan.md`:

```markdown
# Questão 5 — Planejamento com /plan

## Feature Escolhida

[Descrição da feature em 1-2 frases]

## Prompt Usado

```
/plan [seu prompt completo]
```

## Plano Gerado pelo Copilot

[Copie o plano aqui]

## Análise Crítica

- O plano cobre todos os arquivos necessários? [sim/não — justifique]
- A ordem das etapas está correta? [sim/não — justifique]
- O que eu adicionaria? [descreva]
- O que eu removeria? [descreva]
- O plano está pronto para virar implementação ou precisa de mais refinamento? [explique]
```

---

## Questão 6: Gerenciamento de Sessão

**Conceito-chave:** Gerenciamento de sessão com /clear, /compact e /fork (Aula 06, Seção 8).

**Objetivo:** Demonstrar que você entende como gerenciar o contexto da conversa com o Copilot para manter sessões produtivas.

**Passos de Execução:**

1. Inicie uma conversa com o Copilot sobre uma tarefa do Portal
2. Após 5-10 trocas (perguntas e respostas), use `/compact`
3. Observe se o Copilot ainda lembra do contexto essencial após o compact
4. Em uma conversa separada, use `/clear` e verifique que o histórico foi zerado
5. Explique em que situação você usaria `/fork` em vez de `/clear` ou `/compact`

**Entrega:** crie `entregas-aula06/06-questao-06-sessao.md`:

```markdown
# Questão 6 — Gerenciamento de Sessão

## Experimento com /compact

- A conversa estava com quantas trocas antes do /compact? [número]
- Após o /compact, o Copilot ainda lembrava do contexto essencial? [sim/não/parcialmente]
- O que foi perdido (se algo foi)? [descreva]

## Experimento com /clear

- O /clear limpou todo o histórico? [sim/não]
- Como você Confirmou? [descreva o que fez]

## /fork vs /clear vs /compact

Preencha a tabela com a situação ideal para cada comando:

| Comando | Quando usar | Exemplo concreto |
|---|---|---|
| /clear | | |
| /compact | | |
| /fork | | |

## Reflexão

Qual desses comandos você usaria com mais frequência no dia a dia? Por quê?
```

---

## Questão 7: Copilot Edits com Working Set

**Conceito-chave:** Copilot Edits com working set e aprovação Keep/Undo (Aula 06, Seção 9).

**Objetivo:** Demonstrar que você sabe usar o Copilot Edits para edições multi-arquivo com working set explícito e aprovação granular.

**Passos de Execução:**

1. Abra o Copilot Edits no VS Code
2. Defina um working set com 2-3 arquivos do Portal (ex: `index.html`, `js/app.js`, `css/styles.css`)
3. Escreva um prompt que modifique múltiplos arquivos (ex: "Add a subtitle to the page header in index.html, update the title style in styles.css")
4. Após o Copilot processar, revise os inline diffs
5. Aceite uma mudança com Keep, rejeite outra com Undo
6. Documente o processo

**Entrega:** crie `entregas-aula06/06-questao-07-copilot-edits.md`:

```markdown
# Questão 7 — Copilot Edits com Working Set

## Working Set Definido

| Arquivo | Tipo (editar/referência) | Motivo |
|---|---|---|
| [arquivo] | [editar/referência] | [por que incluiu] |
| ... | ... | ... |

## Prompt Utilizado

```
[cole o prompt exato que você usou]
```

## Resultado da Revisão

| Arquivo | Mudança proposta | Decisão (Keep/Undo) | Justificativa |
|---|---|---|---|
| [arquivo] | [descrição] | [Keep/Undo] | [por que] |
| ... | ... | ... | ... |

## Reflexão

O Copilot Edits produziu o resultado esperado na primeira tentativa? Se não, o que você ajustou no prompt?

[Resposta em 3-5 frases]
```

---

## Questão 8: Workflow Integrado no Portal de Projetos Dev

**Conceito-chave:** Workflow integrado completo: /plan → implementar com Copilot Edits → /fix → /tests → /doc no Portal de Projetos Dev (Aula 06, Seções 9-11).

**Objetivo:** Demonstrar que você consegue executar o workflow canônico completo — do planejamento à documentação — em uma feature real do Portal de Projetos Dev.

**Passos de Execução:**

1. Escolha uma feature para o Portal (ex: "contador de projetos por status" ou "ordenação por nome")
2. Crie um checkpoint manual com `/session checkpoints`
3. Use `/plan` para planejar a feature
4. Implemente usando Copilot Edits com working set adequado
5. Teste a implementação manualmente e use `/fix` para corrigir problemas
6. Gere testes com `/tests`
7. Documente funções novas com `/doc`
8. Faça um Git commit

**Entrega:** crie `entregas-aula06/06-questao-08-workflow-integrado.md`:

```markdown
# Questão 8 — Workflow Integrado no Portal de Projetos Dev

## Feature Escolhida

[Descrição da feature]

## Passo 1: Checkpoint

- Comando usado: [cole o comando]
- Checkpoint criado com sucesso? [sim/não]

## Passo 2: /plan

- Prompt usado: [cole]
- Resumo do plano gerado: [2-3 frases]
- O plano foi seguido à risca ou você adaptou? [explique]

## Passo 3: Implementação com Copilot Edits

- Working set: [liste os arquivos]
- Número de iterações necessárias: [N]
- Keep/Undo usados? [sim/não — quantos de cada]

## Passo 4: /fix

- Problemas encontrados durante a implementação: [liste]
- Correções aplicadas: [descreva]

## Passo 5: /tests

- Testes gerados para: [quais funções]
- Testes passam? [sim/não — se não, por quê?]

## Passo 6: /doc

- Funções documentadas: [liste]
- Formato da documentação: [JSDoc, docstrings, etc.]

## Passo 7: Git Commit

- Mensagem do commit: [cole]
- Commit realizado? [sim/não]

## Autoavaliação

O workflow completo funcionou de forma fluida ou você encontrou gargalos?

[Resposta em 3-5 frases]

O que você faria diferente na próxima vez?

[Resposta em 2-3 frases]
```

---

## Checklist Final: Pronto para a Aula 07?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Classifico qualquer slash command nas 6 categorias (compreensão, correção, geração, planejamento, sessão, depuração)
- [ ] Explico como um slash command funciona internamente: reconhecimento → expansão → contextualização
- [ ] Uso /explain para entender código que não conheço e /doc para gerar documentação automática
- [ ] Uso /fix para corrigir bugs e entendo a causa raiz antes de aceitar a correção
- [ ] Sei quando usar /fixTestFailure em vez de /fix
- [ ] Gero testes com /tests e configuro framework com /setupTests
- [ ] Planejo features com /plan antes de implementar
- [ ] Gerencio sessões com /clear (zerar), /compact (resumir) e /fork (ramificar)
- [ ] Uso Copilot Edits com working set explícito e aprovação granular (Keep/Undo)
- [ ] Crio e restauro checkpoints como rede de segurança
- [ ] Executo o workflow canônico completo: /plan → implementar → /fix → /tests → /doc → Git commit
- [ ] Entendo que checkpoints são locais à sessão e não substituem Git commits

> *Acertou todos? Você está pronto para a Aula 07, onde vai aprender sobre Agent Skills — conhecimento injetável que só consome tokens quando ativado, levando seu harness do Copilot ao próximo nível de sofisticação. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
