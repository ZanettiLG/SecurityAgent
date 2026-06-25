---
titulo: "Aula 05 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 05: Agent Mode — O Copilot como Agente Autônomo"
data: 2026-06-20
---

# Aula 05 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o seu **checkpoint de aprendizagem**. A pergunta central é: "eu realmente entendi o Agent Mode?"

Cada questão abaixo verifica um conceito-chave da Aula 05. Resolva **na ordem**, sem consultar a aula principal. Cada questão tem um **Objetivo** (o que você deve demonstrar), **Passos de Execução** (como fazer) e uma **Entrega** (template para preencher).

Crie uma pasta `entregas-aula05/` e salve cada entrega como um arquivo Markdown separado.

Só avance para a Aula 06 quando conseguir completar todas as questões por conta própria.

---

## Questão 1: Descrevendo o Ciclo Understand→Act→Validate

**Conceito-chave:** Ciclo Understand→Act→Validate (Aula 05, Seção 2).

**Objetivo:** Demonstrar que você identifica cada fase do ciclo autônomo em uma execução real do Agent Mode.

**Passos de Execução:**

1. Abra o Portal de Projetos Dev no VS Code com o Agent Mode ativo
2. Execute o prompt: "Explique como os cards de projeto são renderizados no dashboard"
3. Observe atentamente cada ação do Copilot — leitura de arquivos, busca de referências, formatação da resposta
4. Preencha o template abaixo documentando o que aconteceu em cada fase

**Entrega:** crie `entregas-aula05/01-ciclo-uav.md`:

```markdown
# Questão 1 — Ciclo Understand→Act→Validate

## Prompt executado
[cole o prompt exato]

## Fase Understand (o que o Copilot leu/buscou)
- [ ] Leu index.html
- [ ] Leu app.js
- [ ] Leu styles.css
- [ ] Outro: [qual?]

> **Evidência:** cite uma linha da resposta do Copilot que prova que ele leu os arquivos.

## Fase Act (o que o Copilot fez)
- [ ] Respondeu em texto (sem edições)
- [ ] Criou arquivo(s)
- [ ] Executou comando
- [ ] Outro: [qual?]

## Fase Validate (como o Copilot verificou)
- [ ] Não validou (só respondeu)
- [ ] Verificou sintaxe
- [ ] Executou comando de verificação
- [ ] Mostrou diff para aprovação

## Conclusão
Em 2-3 frases: o ciclo foi completo? O Copilot passou por todas as três fases? Se não, por que?
```

---

## Questão 2: Comparando Agent Mode e Chat Mode

**Conceito-chave:** Agent Mode vs. Chat Mode (Aula 05, Seção 6).

**Objetivo:** Demonstrar que você distingue os dois modos por autonomia, escopo, iteração e ferramentas disponíveis.

**Passos de Execução:**

1. Mude o Copilot para Chat Mode
2. Execute o mesmo prompt da Questão 1: "Explique como os cards de projeto são renderizados"
3. Compare a resposta e o comportamento com o que observou no Agent Mode
4. Preencha a tabela comparativa abaixo

**Entrega:** crie `entregas-aula05/02-agent-vs-chat.md`:

```markdown
# Questão 2 — Agent Mode vs. Chat Mode

## Prompt executado (idêntico ao da Questão 1)
[cole o prompt]

## Tabela comparativa

| Característica | Chat Mode | Agent Mode |
|---|---|---|
| Leu arquivos automaticamente? | | |
| Iterou sem comando adicional? | | |
| Ofereceu editar código? | | |
| Executou terminal? | | |
| Tempo de resposta (segundos) | | |
| Qualidade da resposta (1-5) | | |

## Análise
Em 3-4 frases: qual modo deu a melhor resposta para este tipo de pergunta? Em que cenário você usaria cada um?

## Critérios de decisão
Complete: "Eu uso Chat Mode quando... Eu uso Agent Mode quando..."
```

---

## Questão 3: Escolhendo o Nível de Permissão Adequado

**Conceito-chave:** Níveis de permissão (Aula 05, Seções 3 e 8).

**Objetivo:** Demonstrar que você sabe comparar os três níveis de permissão e identificar o cenário adequado para cada um.

**Passos de Execução:**

1. Analise cada cenário abaixo
2. Para cada cenário, escolha o nível de permissão mais adequado
3. Justifique sua escolha

**Entrega:** crie `entregas-aula05/03-niveis-permissao.md`:

```markdown
# Questão 3 — Níveis de Permissão

## Cenário 1: Explorar um repositório desconhecido
**Nível escolhido:** [Default Approvals / Bypass Approvals / Autopilot]
**Justificativa:** [2-3 frases explicando por que]

## Cenário 2: Refatorar uma função bem conhecida em um arquivo específico
**Nível escolhido:** [Default Approvals / Bypass Approvals / Autopilot]
**Justificativa:** [2-3 frases]

## Cenário 3: Executar npm install seguido de npm test (comandos previsíveis)
**Nível escolhido:** [Default Approvals / Bypass Approvals / Autopilot]
**Justificativa:** [2-3 frases]

## Cenário 4: CI/CD pipeline automatizada sem supervisão humana
**Nível escolhido:** [Default Approvals / Bypass Approvals / Autopilot]
**Justificativa:** [2-3 frases]

## Reflexão
Em 2-3 frases: qual o trade-off entre segurança e produtividade em cada nível?
```

---

## Questão 4: Mapeando Tool Sets para Cenários

**Conceito-chave:** Tool sets built-in (Aula 05, Seções 4 e 7).

**Objetivo:** Demonstrar que você sabe classificar os 9 tool sets por categoria funcional e identificar qual tool set é acionado em cada cenário.

**Passos de Execução:**

1. Revise os cenários abaixo
2. Para cada cenário, identifique qual tool set o Copilot usaria PRIMEIRO
3. Explique por que

**Entrega:** crie `entregas-aula05/04-tool-sets.md`:

```markdown
# Questão 4 — Mapeando Tool Sets

## Cenário 1: "Encontre onde a função renderCard é definida"
**Tool set:** [ ]
**Ferramenta específica:** [ ]
**Por que:** [1-2 frases]

## Cenário 2: "Crie um novo arquivo de componente"
**Tool set:** [ ]
**Ferramenta específica:** [ ]
**Por que:** [1-2 frases]

## Cenário 3: "Execute os testes e me mostre o resultado"
**Tool set:** [ ]
**Ferramenta específica:** [ ]
**Por que:** [1-2 frases]

## Cenário 4: "Busque a documentação da API de fetch"
**Tool set:** [ ]
**Ferramenta específica:** [ ]
**Por que:** [1-2 frases]

## Cenário 5: "Liste os arquivos da pasta src/components"
**Tool set:** [ ]
**Ferramenta específica:** [ ]
**Por que:** [1-2 frases]

## Resposta completa
Preencha a tabela com os **9 tool sets** e a **categoria funcional** de cada um (Seção 4):

| Tool Set | Categoria funcional |
|---|---|
| #edit | |
| #read | |
| #search | |
| #execute | |
| #terminal | |
| #web | |
| #vscode | |
| #todos | |
| #browser | |
```

---

## Questão 5: Analisando Output de Terminal

**Conceito-chave:** Terminal commands e validação (Aula 05, Seções 5 e 9).

**Objetivo:** Demonstrar que você sabe interpretar o fluxo de terminal commands e identificar erros no output.

**Passos de Execução:**

1. No Agent Mode, execute um comando que você sabe que vai falhar (ex: `node arquivo-inexistente.js`)
2. Observe como o Copilot reage ao erro
3. Preencha o template de análise

**Entrega:** crie `entregas-aula05/05-terminal-output.md`:

```markdown
# Questão 5 — Análise de Output de Terminal

## Comando executado
[cole o comando]

## Preview (o que o Copilot mostrou antes de executar)
[descreva o preview]

## Output do terminal
```
[cole o output aqui]
```

## Código de saída
[0 ou não-zero?]

## Reação do Copilot
- [ ] Detectou o erro automaticamente
- [ ] Ignorou o erro e continuou
- [ ] Tentou corrigir
- [ ] Pediu instruções

## Se o Copilot tentou corrigir:
- Qual foi a estratégia? [re-ler contexto / ajustar abordagem / consultar logs]
- A correção funcionou? [sim / não]

## Conclusão
Em 2-3 frases: o ciclo Validate funcionou como esperado? O Copilot agiu como um agente autônomo ou apenas reportou o erro?
```

---

## Questão 6: Documentando um Ciclo de Edição→Erro→Correção

**Conceito-chave:** Edição multi-arquivo e error recovery (Aula 05, Seções 10 e 11).

**Objetivo:** Demonstrar que você sabe aplicar o workflow de edição multi-arquivo e diagnosticar o ciclo de error recovery.

**Passos de Execução:**

1. No Agent Mode, peça uma tarefa que envolva HTML + CSS + JS (ex: "adicione um tooltip aos cards de projeto")
2. Durante a execução, introduza um erro — espere o Copilot editar, depois manualmente quebre o código (ex: remova uma vírgula no JS)
3. Peça: "execute os testes agora" — observe o Copilot detectar o erro introduzido
4. Documente o ciclo completo

**Entrega:** crie `entregas-aula05/06-edicao-erro-correcao.md`:

```markdown
# Questão 6 — Edição → Erro → Correção

## Tarefa solicitada
[cole o prompt]

## Working set observado
| Arquivo | Ação (criado/editado) | Diff aceito? |
|---|---|---|
| | | |
| | | |
| | | |

## Erro introduzido manualmente
[descreva o que você quebrou e em qual arquivo]

## Ciclo de error recovery observado
- [ ] O Copilot detectou o erro?
- [ ] Diagnosticou a causa?
- [ ] Tentou corrigir?
- [ ] Re-validou?
- [ ] Quantas iterações? [N]

## Estratégia usada pelo Copilot
[relê contexto / ajusta abordagem / consulta logs]

## Resultado final
- [ ] Erro corrigido automaticamente
- [ ] Copilot desistiu e reportou
- [ ] Precisei intervir manualmente

## Reflexão
Em 3-4 frases: o que você aprendeu sobre a capacidade de error recovery do Agent Mode? Em que situações você confiaria nele para corrigir erros sozinho?
```

---

## Questão 7: Configurando Limites e Segurança

**Conceito-chave:** Limites e segurança (Aula 05, Seção 12).

**Objetivo:** Demonstrar que você reconhece os limites de segurança do Agent Mode e sabe configurar proteções.

**Passos de Execução:**

1. Identifique quais configurações de segurança estão ativas no seu VS Code para o Agent Mode
2. Configure o sandbox e o network filter
3. Analise um cenário de risco e proponha mitigação

**Entrega:** crie `entregas-aula05/07-limites-seguranca.md`:

```markdown
# Questão 7 — Limites e Segurança

## Configurações atuais
### Sandbox
- Ativo? [sim / não]
- Configuração: [cole o trecho do settings.json]

### Network Filter
- Configurado? [sim / não]
- Se sim, quais domínios?
  - Permitidos: [lista]
  - Bloqueados: [lista]

### Content Exclusion
- Pastas/arquivos excluídos: [lista]
- Você confia no content exclusion? [sim / não] Por que?

## Cenário de risco
**Situação:** Um desenvolvedor júnior vai usar Agent Mode pela primeira vez em um projeto que contém dados sensíveis em uma pasta `config/secrets/`.

**Riscos identificados:** [liste 2-3 riscos]

**Mitigação proposta:** [2-3 ações de configuração que o líder técnico deveria implementar]

## Configuração recomendada
Escreva o trecho de `settings.json` que você usaria para proteger o projeto:
```json
{
  // sua configuração aqui
}
```

## Conclusão
Em 2-3 frases: qual o maior risco de segurança do Agent Mode e como você o mitigaria?
```

---

## Questão 8: Executando a Tarefa Autônoma do Projeto Progressivo

**Conceito-chave:** Projeto Portal — tarefa autônoma completa (Aula 05, Seção 14).

**Objetivo:** Demonstrar que você consegue executar uma tarefa autônoma completa no Portal de Projetos Dev e documentar cada fase do ciclo Understand→Act→Validate.

**Passos de Execução:**

1. Certifique-se de que o Portal de Projetos Dev está aberto no VS Code
2. Ative o Agent Mode (não use /yolo — queremos observar as confirmações)
3. Execute o prompt do filtro por status (conforme Seção 14 da aula)
4. Documente cada fase do ciclo com o máximo de detalhes possível
5. Teste o componente no browser

**Entrega:** crie `entregas-aula05/08-tarefa-autonoma.md`:

```markdown
# Questão 8 — Tarefa Autônoma: Componente de Filtro por Status

## Prompt utilizado
[cole o prompt exato]

## Fase Understand
**Arquivos lidos pelo Copilot:**
- [ ] index.html
- [ ] app.js
- [ ] styles.css
- [ ] Outros: [lista]

**Evidência de leitura:** [cite linhas da resposta do Copilot]

## Fase Act
**Arquivos criados:**
| Arquivo | Conteúdo resumido |
|---|---|
| | |

**Arquivos editados:**
| Arquivo | O que mudou |
|---|---|
| | |

**Comandos executados no terminal:**
| Comando | Aprovado? | Resultado |
|---|---|---|
| | sim/não | sucesso/erro |

**Diffs revisados:**
- [ ] Aceitei todos os diffs
- [ ] Rejeitei algum diff (qual? por que?)
- [ ] Editei manualmente algum diff (qual? por que?)

## Fase Validate
- [ ] Copilot executou comando de verificação
- [ ] Copilot verificou sintaxe
- [ ] Copilot detectou erro
- [ ] Copilot corrigiu erro automaticamente

**Erros encontrados e correções:**
| Erro | Como o Copilot corrigiu |
|---|---|
| | |

## Tool sets utilizados
Marque todos os que você observou:
- [ ] #edit
- [ ] #read
- [ ] #search
- [ ] #execute
- [ ] #terminal
- [ ] #web
- [ ] #vscode
- [ ] #todos
- [ ] #browser

## Teste no browser
O componente de filtro funciona?
- [ ] Sim — o dropdown aparece e filtra corretamente
- [ ] Parcialmente — [descreva o que não funciona]
- [ ] Não — [descreva o erro]

## Reflexão final
Em 4-5 frases, responda:
1. Quantos arquivos o Copilot editou? Quantos você esperava?
2. Houve erro? O Copilot corrigiu sozinho?
3. O resultado final corresponde ao que você pediu?
4. O que você faria diferente no prompt para melhorar o resultado?
5. Você confiaria no Agent Mode para uma tarefa similar sem supervisão?
```

---

## Checklist Final: Pronto para a Aula 06?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Explico** o ciclo Understand→Act→Validate com minhas próprias palavras e dou um exemplo concreto
- [ ] **Diferencio** Agent Mode de Chat Mode em pelo menos 3 aspectos (autonomia, escopo, iteração)
- [ ] **Escolho** o nível de permissão adequado (Default, Bypass, Autopilot) para cada cenário
- [ ] **Classifico** os 9 tool sets e sei qual ferramenta específica de cada um é acionada em cada cenário
- [ ] **Descrevo** o fluxo de terminal commands: preview → accept → execute → validate → correct
- [ ] **Explico** o funcionamento do working set e a diferença entre Keep e Undo nos diffs
- [ ] **Diagnostico** o ciclo de error recovery: gatilhos, estratégias e limites do Agent Mode
- [ ] **Identifico** os limites de segurança (content exclusion gap, sandbox, network filter, operações bloqueadas)
- [ ] **Formulo** prompts eficazes usando as 5 diretrizes de boas práticas
- [ ] **Executo** uma tarefa autônoma completa e documento cada fase do ciclo U-A-V

> *Acertou todos? Você está pronto para a Aula 06: Slash Commands e Workflows de Desenvolvimento, onde você vai dominar /plan, /fix, /tests e os workflows de iteração produtiva. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*