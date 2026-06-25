---
titulo: "Aula 04 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 04: Contexto, @mentions e Prompt Files"
data: 2026-06-20
---

# Aula 04 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é seu **checkpoint de domínio**. A pergunta central é: *"eu realmente entendi a matéria?"*

Cada questão verifica um conceito-chave da Aula 04. Você deve:

1. Fazer as questões **na ordem** — elas seguem a progressão da aula
2. Para cada questão: leia o **Objetivo**, execute os **Passos de Execução**, e preencha o template de **Entrega**
3. Crie a pasta `entregas-aula04/` na raiz do seu projeto para salvar as entregas
4. Só consulte a aula se travar em um conceito — o ideal é fazer de memória
5. Ao final, marque os itens do **Checklist Final**

Cada questão indica a seção exata da aula que verifica. Se travar, releia aquela seção antes de avançar.

---

## Questão 1: A Equação do Contexto

**Conceito-chave:** Componentes do contexto (Aula 04, Seção 1).

**Objetivo:** Demonstrar que você entende os seis componentes da equação do contexto e o que o modelo NÃO vê.

**Passos de Execução:**

1. Desenhe (mentalmente ou num diagrama) a equação do contexto: sistema = SP + CI + T + H + CIml + CE
2. Para cada componente, dê um exemplo concreto do que ele incluiria em uma sessão do Copilot no Portal de Projetos Dev
3. Identifique 3 coisas que o modelo NÃO vê mesmo durante uma sessão ativa
4. Explique por que "arquivos fechados" não fazem parte do contexto mesmo estando no mesmo projeto

**Entrega:** crie `entregas-aula04/01-equacao-contexto.md`:

```markdown
# Questão 1 — A Equação do Contexto

## Componentes e Exemplos

| Componente | Exemplo concreto no Portal de Projetos Dev |
|---|---|
| System Prompt | (exemplo do que o Copilot tem como regra fixa) |
| Custom Instructions | (exemplo de regra do copilot-instructions.md) |
| Tools | (exemplo de ferramenta que o Copilot pode usar) |
| Histórico | (exemplo do que estaria na conversa atual) |
| Contexto Implícito | (exemplo do que o Copilot infere sozinho) |
| Referências Explícitas | (exemplo de @mention que você usaria) |

## O que o modelo NÃO vê

1. (item)
2. (item)
3. (item)

## Por que arquivos fechados não estão no contexto

(explique em 2-3 frases)

## Conclusão

Em 2-3 frases: por que entender a equação do contexto ajuda a escrever melhores prompts?
```

---

## Questão 2: Janela de Contexto e Saturação

**Conceito-chave:** Limites de tokens, saturação e estratégias de mitigação (Aula 04, Seções 2 e 3).

**Objetivo:** Diagnosticar saturação de contexto e escolher a estratégia de mitigação adequada.

**Passos de Execução:**

1. Leia o cenário abaixo e identifique se há saturação de contexto
2. Liste os sintomas que indicam saturação
3. Escolha entre /compact, /clear ou foco progressivo e justifique

**Cenário:** Você está há 2 horas trabalhando no Portal. Na mesma sessão do Copilot, você: (1) pediu para criar a estrutura HTML inicial, (2) debugou um erro de CSS por 15 interações, (3) pediu para refatorar a função de filtro em JavaScript, (4) pesquisou uma API com @web, (5) agora quer gerar um prompt file novo. O Copilot começou a sugerir código que viola as regras do `copilot-instructions.md` — usou React (projeto é vanilla) e tabs (instrução pede 2 espaços).

**Entrega:** crie `entregas-aula04/02-saturacao-contexto.md`:

```markdown
# Questão 2 — Janela de Contexto e Saturação

## Diagnóstico

- O contexto está saturado? (sim/não)
- Sintomas observados:

1. (sintoma)
2. (sintoma)
3. (sintoma)

## Causa Provável

(explique por que a saturação aconteceu neste cenário)

## Estratégia Escolhida

- Estratégia: /compact / /clear / foco progressivo (escolha uma)
- Justificativa: (por que esta estratégia é a melhor para este cenário?)
- Passos concretos: (o que você faria no VS Code agora?)

## Conclusão

Em 2-3 frases: como você evitaria chegar a este ponto novamente?
```

---

## Questão 3: Navegação com @workspace

**Conceito-chave:** Busca semântica com @workspace (Aula 04, Seção 4).

**Objetivo:** Usar @workspace para encontrar código no Portal de Projetos Dev por significado, não por palavras exatas.

**Passos de Execução:**

1. Abra o VS Code com o Portal de Projetos Dev
2. Faça 3 consultas com @workspace no Copilot Chat
3. Para cada consulta, documente: o que você perguntou, quais arquivos foram retornados, e se a resposta foi precisa
4. Identifique um caso em que @workspace seria overkill (quando @file ou #symbol seriam melhores)

**Entrega:** crie `entregas-aula04/03-workspace.md`:

```markdown
# Questão 3 — Navegação com @workspace

## Consulta 1

- Pergunta: (o que você perguntou com @workspace)
- Arquivos retornados:
- A resposta foi precisa? (sim/não/parcialmente)
- Observações:

## Consulta 2

- Pergunta:
- Arquivos retornados:
- Precisão:
- Observações:

## Consulta 3

- Pergunta:
- Arquivos retornados:
- Precisão:
- Observações:

## Quando @workspace é overkill

(Cenário em que @file ou #symbol seriam mais adequados e por quê)

## Conclusão

Em 2-3 frases: qual a maior vantagem da busca semântica sobre a busca textual?
```

---

## Questão 4: Contexto Cirúrgico com @file/@folder/#symbols

**Conceito-chave:** Precisão de contexto com @file, @folder e #symbols (Aula 04, Seção 5).

**Objetivo:** Demonstrar que você sabe escolher a menção mais precisa para cada tipo de tarefa.

**Passos de Execução:**

1. Para cada cenário abaixo, escolha a menção mais adequada (@file, @folder ou #symbol) e justifique
2. Execute cada cenário no VS Code com o Portal de Projetos Dev
3. Documente os resultados

**Cenários:**

a) Você quer entender como a função `renderizarCards` constrói o HTML dos cards
b) Você quer ver a estrutura completa da pasta `.github/instructions/` para saber quais arquivos existem
c) Você quer refatorar completamente o `styles.css` e precisa do conteúdo integral do arquivo
d) Você quer saber qual classe CSS é usada para o status "active"

**Entrega:** crie `entregas-aula04/04-contexto-cirurgico.md`:

```markdown
# Questão 4 — Contexto Cirúrgico com @mentions

## Cenário A: Entender função específica

- Menção escolhida:
- Justificativa:
- Resultado da execução:

## Cenário B: Explorar estrutura de pasta

- Menção escolhida:
- Justificativa:
- Resultado da execução:

## Cenário C: Refatorar arquivo completo

- Menção escolhida:
- Justificativa:
- Resultado da execução:

## Cenário D: Encontrar classe CSS específica

- Menção escolhida:
- Justificativa:
- Resultado da execução:

## Tabela Comparativa

| Menção | O que inclui no contexto | Quando usar |
|---|---|---|
| @file | | |
| @folder | | |
| #symbol | | |

## Conclusão

Em 2-3 frases: qual critério você usa para decidir entre @file e #symbol?
```

---

## Questão 5: Contexto Externo com @web e @terminal

**Conceito-chave:** @web para documentação, @terminal para debugging (Aula 04, Seção 6).

**Objetivo:** Usar @web para pesquisar documentação de API e @terminal para diagnosticar erros sem copiar/colar.

**Passos de Execução:**

1. Use @web para pesquisar uma API ou padrão CSS que você queira aplicar no Portal (ex: "CSS Container Queries", "CSS Grid auto-fill vs auto-fit")
2. Documente o que o @web retornou e como você aplicaria ao Portal
3. No terminal integrado do VS Code, execute um comando que gere erro (ex: `node -e "console.log(variavelInexistente)"`)
4. Use @terminal para pedir diagnóstico ao Copilot
5. Documente o que o Copilot respondeu

**Entrega:** crie `entregas-aula04/05-contexto-externo.md`:

```markdown
# Questão 5 — Contexto Externo com @web e @terminal

## Pesquisa com @web

- Consulta feita:
- Resumo do que o @web retornou:
- Como aplicaria ao Portal:

## Debugging com @terminal

- Comando executado (que gerou erro):
- O que o @terminal capturou:
- Diagnóstico do Copilot:
- A resposta foi útil? (sim/não/parcialmente)

## Limitações Identificadas

- @web não consegue:
- @terminal captura apenas:

## Conclusão

Em 2-3 frases: como @web e @terminal mudam a forma como você pesquisa e debuga?
```

---

## Questão 6: Criando Prompt Files para o Portal

**Conceito-chave:** Anatomia YAML + Markdown, variáveis `${input:}`, ciclo de vida do prompt file (Aula 04, Seção 7).

**Objetivo:** Criar dois prompt files funcionais com frontmatter YAML, corpo Markdown e variáveis.

**Passos de Execução:**

1. Confirme que `"chat.promptFiles": true` está no `.vscode/settings.json`
2. Crie o arquivo `gerar-cards.prompt.md` no diretório `.github/prompts/` (se já criou na aula, refine-o)
3. Crie um segundo prompt file: `validar-dados.prompt.md` que gere código de validação para os dados mock do Portal
4. O `validar-dados.prompt.md` deve ter:
   - Frontmatter YAML com `agent: ask` e `description` descritiva
   - Pelo menos uma variável `${input:}`
   - Referência a `#file:app.js` para a estrutura de dados
   - Regras de validação (campos obrigatórios, tipos esperados, formato de data)
5. Teste ambos os prompt files no Copilot Chat

**Entrega:** crie `entregas-aula04/06-prompt-files.md`:

```markdown
# Questão 6 — Criando Prompt Files

## Configuração

- `chat.promptFiles` está habilitado? (sim/não)
- Caminho do settings.json:
- Diretório de prompt files:

## Prompt File 1: gerar-cards.prompt.md

Cole o conteúdo completo do arquivo:

```markdown

```

## Prompt File 2: validar-dados.prompt.md

Cole o conteúdo completo do arquivo:

```markdown

```

## Teste

- `/gerar-cards` funcionou? (sim/não)
- `/validar-dados` funcionou? (sim/não)
- Ajustes necessários após o teste:

## Conclusão

Em 2-3 frases: qual a maior vantagem de usar prompt files em vez de digitar prompts repetitivos?
```

---

## Questão 7: Prompt Files — Projeto Progressivo

**Conceito-chave:** Integração de prompt files ao harness do Portal de Projetos Dev (Aula 04, Seção 7).

**Objetivo:** Construir três prompt files customizados para tarefas recorrentes do Portal, integrando-os ao harness que você vem construindo desde a Aula 02.

**Passos de Execução:**

1. Crie ou refine os três prompt files abaixo em `.github/prompts/`:

   **a) `gerar-cards.prompt.md`** — Gera cards HTML seguindo o padrão do Portal (classes CSS, estrutura de article, dados mock)
   
   **b) `estilizar-componente.prompt.md`** — Gera estilos CSS para um componente (variáveis CSS, mobile-first, classes semânticas)
   
   **c) `validar-dados.prompt.md`** — Gera código de validação para os dados mock (campos obrigatórios, tipos, sanitização)

2. Cada prompt file deve ter:
   - Frontmatter YAML com `agent` e `description`
   - Corpo Markdown com instruções detalhadas
   - Pelo menos uma variável `${input:}`
   - Referência a arquivos do projeto com `#file:`

3. Teste cada prompt file no Copilot Chat e documente os resultados
4. Faça commit dos prompt files:

```bash
git add .github/prompts/
git commit -m "feat(harness): prompt files para tarefas recorrentes do Portal"
```

**Entrega:** crie `entregas-aula04/07-projeto-progressivo.md`:

```markdown
# Questão 7 — Prompt Files: Projeto Progressivo

## Prompt File 1: gerar-cards.prompt.md

```markdown
(Conteúdo completo do arquivo)
```

- Teste: funcionou? (sim/não/parcial)
- Ajustes feitos:

## Prompt File 2: estilizar-componente.prompt.md

```markdown
(Conteúdo completo do arquivo)
```

- Teste: funcionou? (sim/não/parcial)
- Ajustes feitos:

## Prompt File 3: validar-dados.prompt.md

```markdown
(Conteúdo completo do arquivo)
```

- Teste: funcionou? (sim/não/parcial)
- Ajustes feitos:

## Integração com o Harness

- Estes prompt files respeitam as regras do `copilot-instructions.md`? (sim/não — justifique)
- Eles usam as classes CSS e a estrutura HTML definidas no Portal? (sim/não)
- Eles poderiam ser usados por outro desenvolvedor que clonar o repositório? (sim/não — por quê?)

## Commit

- Hash do commit:

## Conclusão

Em 2-3 frases: como os prompt files se encaixam no harness que você vem construindo?
```

---

## Questão 8: Diagnóstico de Contexto

**Conceito-chave:** Checklist de 5 dimensões para avaliar qualidade do contexto (Aula 04, Seção 8).

**Objetivo:** Aplicar o checklist de 5 dimensões em uma sessão real e decidir se precisa de intervenção.

**Passos de Execução:**

1. Examine sua sessão atual do Copilot Chat (ou inicie uma nova e trabalhe por alguns minutos)
2. Aplique o checklist de 5 dimensões:
   - **Foco:** Quantos arquivos estão abertos? São todos relevantes para a tarefa atual?
   - **Relevância:** As @mentions que você usou são pertinentes?
   - **Isolamento:** Esta sessão tem histórico de tarefas não relacionadas?
   - **Progressão:** Você começou pequeno e expandiu ou jogou tudo de uma vez?
   - **Renovação:** Quantas interações tem esta sessão? Precisa de /compact ou /clear?
3. Decida se a sessão precisa de /clear, /compact ou está ok
4. Identifique pelo menos 1 anti-padrão na sua própria forma de usar o Copilot

**Entrega:** crie `entregas-aula04/08-diagnostico-contexto.md`:

```markdown
# Questão 8 — Diagnóstico de Contexto

## Checklist de 5 Dimensões

| Dimensão | Nota (1-5) | Observação |
|---|---|---|
| Foco | | |
| Relevância | | |
| Isolamento | | |
| Progressão | | |
| Renovação | | |

## Decisão

- A sessão precisa de intervenção? (sim/não)
- Se sim: /clear ou /compact? Por quê?
- Se não: por que está ok?

## Anti-padrão Identificado

- Qual anti-padrão você percebeu na sua própria forma de usar o Copilot?
- Como pretende corrigi-lo?

## Plano de Ação

(3 passos concretos para melhorar a qualidade do contexto nas suas sessões)

## Conclusão

Em 2-3 frases: o que você aprendeu sobre sua própria forma de usar contexto?
```

---

## Checklist Final: Pronto para a Aula 05?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Explicar a equação do contexto** (SP + CI + T + H + CIml + CE) e dar um exemplo de cada componente
- [ ] **Descrever a janela de contexto** (~128K a ~200K tokens) e o que acontece na saturação
- [ ] **Escolher entre /compact, /clear e foco progressivo** para um cenário dado
- [ ] **Usar @workspace** para encontrar código por significado no repositório
- [ ] **Diferenciar @file, @folder e #symbols** e escolher o mais preciso para cada tarefa
- [ ] **Usar @web e @terminal** para contexto externo (API docs e debugging)
- [ ] **Criar um prompt file** com frontmatter YAML, corpo Markdown e variáveis `${input:}`
- [ ] **Avaliar a qualidade do contexto** de uma sessão usando o checklist de 5 dimensões
- [ ] **Identificar anti-padrões de contexto** (saturação, poluição, contradição)
- [ ] **Construir 3 prompt files** customizados integrados ao harness do Portal de Projetos Dev

> *Acertou todos? Você está pronto para a Aula 05: Agent Mode — onde o Copilot passa de assistente a agente autônomo, executando tarefas completas no ciclo Understand→Act→Validate. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
