---
titulo: "Aula 07 — Questões de Aprendizagem"
modulo: "Harness do GitHub Copilot e Programação Agêntica com VS Code"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 07: Agent Skills — Conhecimento Sob Demanda"
data: 2026-06-20
---

# Aula 07 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este arquivo é o seu **checkpoint de domínio** da Aula 07. A pergunta central é: *"eu realmente entendi Agent Skills?"*

Cada questão a seguir testa um conceito-chave da aula. Você deve:

1. Fazer as questões **na ordem** — elas seguem a progressão dos tópicos
2. Para cada questão, leia o **Objetivo**, execute os **Passos de Execução** e preencha o template de **Entrega**
3. Crie uma pasta `entregas-aula07/` na raiz do seu projeto para salvar as entregas
4. Só consulte a aula principal se travar em um conceito — mas tente fazer primeiro de memória

Ao final, o **Checklist Final** confirma se você está pronto para a Aula 08.

---

## Questão 1: Skills vs Instructions — Análise Comparativa

**Conceito-chave:** Diferença fundamental entre conhecimento injetável e regras permanentes (Aula 07, Seções 1-2).

**Objetivo:** Demonstrar que você distingue skills de instructions e sabe aplicar cada paradigma a cenários reais.

**Passos de Execução:**

1. Crie uma tabela comparativa com as 7 dimensões listadas na Seção 2
2. Para cada dimensão, escreva uma descrição de como ela se manifesta em instructions e em skills
3. Classifique os 5 cenários abaixo como "Instruction", "Skill" ou "Prompt"
4. Justifique cada classificação em 1-2 frases

**Cenários para classificar:**

a) "Responda em português brasileiro"
b) "Para debuggar um memory leak, siga: heap snapshot → identificar retenção → vazar referência"
c) "Nunca use `var` — prefira `const` ou `let`"
d) "Gere um README.md para este componente seguindo o template em resources/template-readme.md"
e) "Use camelCase para variáveis e PascalCase para classes"

**Entrega:** crie `entregas-aula07/q01-skills-vs-instructions.md`:

```markdown
# Questão 1 — Skills vs Instructions

## Tabela Comparativa (7 Dimensões)

| Dimensão | Instructions | Skills |
|---|---|---|
| Persistência | | |
| Escopo | | |
| Gatilho | | |
| Custo de tokens | | |
| Granularidade | | |
| Versionamento | | |
| Reusabilidade | | |

## Classificação de Cenários

| Cenário | Classificação | Justificativa |
|---|---|---|
| a) "Responda em português brasileiro" | | |
| b) "Debuggar memory leak" | | |
| c) "Nunca use var" | | |
| d) "Gerar README com template" | | |
| e) "camelCase para variáveis" | | |

## Conclusão
Qual a diferença essencial que você usou para separar instructions de skills? (2-3 frases)
```

---

## Questão 2: Anatomia de uma Skill — Estrutura de Diretórios

**Conceito-chave:** Estrutura canônica: SKILL.md + scripts/ + resources/ (Aula 07, Seção 3).

**Objetivo:** Demonstrar que você conhece a estrutura de diretórios de uma skill e sabe criar o frontmatter YAML.

**Passos de Execução:**

1. Crie a estrutura de diretórios para uma skill chamada `validar-json` dentro de `.github/skills/`
2. Crie o arquivo `SKILL.md` com frontmatter YAML completo (name, description, version, tools, model)
3. Adicione um diretório `scripts/` e `resources/` vazios
4. No corpo do SKILL.md, escreva uma descrição de propósito e 3 regras de validação JSON

**Entrega:** crie `entregas-aula07/q02-anatomia-skill.md`:

```markdown
# Questão 2 — Anatomia de uma Skill

## Estrutura Criada

```
.github/skills/validar-json/
├── SKILL.md
├── scripts/
└── resources/
```

## Frontmatter YAML do SKILL.md

```yaml
---
# Preencha com os campos corretos
name: 
description: 
version: 
tools: 
model: 
---
```

## Corpo do SKILL.md

Descreva aqui o propósito da skill e pelo menos 3 regras de validação JSON que o agente deve seguir:

**Propósito:**

**Regras:**

1.
2.
3.

## Conclusão
Explique por que o frontmatter YAML é necessário em vez de apenas um README.md. (2-3 frases)
```

---

## Questão 3: Ciclo de Vida — Diagrama de Estados

**Conceito-chave:** Os 4 estágios: listada → carregada → ativa → descartada (Aula 07, Seção 4).

**Objetivo:** Demonstrar que você entende o ciclo de vida de uma skill e consegue explicar cada transição.

**Passos de Execução:**

1. Desenhe (descreva em texto ou diagrama Mermaid) os 4 estágios do ciclo de vida
2. Para cada estágio, explique o que acontece com o conteúdo da skill (tokens, scripts, resources)
3. Para cada transição, explique o gatilho que a causa
4. Responda: o que acontece com o agente quando a skill é descartada no meio de uma tarefa?

**Entrega:** crie `entregas-aula07/q03-ciclo-vida.md`:

```markdown
# Questão 3 — Ciclo de Vida

## Diagrama de Estados

```mermaid
stateDiagram-v2
    [*] --> 
     --> 
     --> 
     --> 
     --> [*]
```

## Descrição dos Estágios

| Estágio | O que acontece | Onde está o conteúdo |
|---|---|---|
| Listada | | |
| Carregada | | |
| Ativa | | |
| Descartada | | |

## Gatilhos de Transição

| Transição | Gatilho |
|---|---|
| Listada → Carregada | |
| Carregada → Ativa | |
| Ativa → Descartada | |

## Pergunta Reflexiva

O que acontece se a skill é descartada no meio de uma tarefa que depende de um script dela? (2-3 frases)

## Conclusão
Qual a principal vantagem do ciclo de vida listada → descartada em termos de economia de contexto? (2-3 frases)
```

---

## Questão 4: Economia de Tokens — Cálculo Comparativo

**Conceito-chave:** Cálculo de custo de tokens: instructions permanentes vs skills sob demanda (Aula 07, Seção 5).

**Objetivo:** Demonstrar que você sabe calcular e comparar o custo de tokens entre instructions e skills em cenários reais.

**Passos de Execução:**

1. Calcule o custo mensal (30 dias, 100 interações/dia) para cada cenário abaixo
2. Calcule a economia percentual ao usar skill em vez de instruction
3. Determine o ponto de equilíbrio — a frequência em que instruction e skill empatam

**Cenário A:** Instruction de 400 tokens para conhecimento usado em 3% das interações
**Cenário B:** Instruction de 200 tokens para conhecimento usado em 60% das interações
**Cenário C:** Instruction de 800 tokens para conhecimento usado em 1% das interações

Assuma overhead de injeção da skill = 10% do tamanho.

**Entrega:** crie `entregas-aula07/q04-economia-tokens.md`:

```markdown
# Questão 4 — Economia de Tokens

## Cálculos

### Cenário A (400 tokens, 3% frequência)

Custo como instruction:
Custo como skill:
Economia: % | tokens/mês

### Cenário B (200 tokens, 60% frequência)

Custo como instruction:
Custo como skill:
Economia: %

### Cenário C (800 tokens, 1% frequência)

Custo como instruction:
Custo como skill:
Economia: %

## Análise

Qual cenário teve maior economia absoluta? E maior economia percentual? Por quê?

## Ponto de Equilíbrio

Em que frequência de uso o custo da instruction iguala o custo da skill para o Cenário A?

## Conclusão
Qual a regra prática que você usaria para decidir o limite de frequência entre instruction e skill? (2-3 frases)
```

---

## Questão 5: Criando uma Skill Customizada — Gerar Teste (PROJETO PROGRESSIVO)

**Conceito-chave:** Estrutura completa de SKILL.md + frontmatter + corpo Markdown (Aula 07, Seções 6-7).

**Objetivo:** Demonstrar que você sabe criar uma skill customizada completa para o Portal de Projetos Dev.

**Passos de Execução:**

1. Crie ou refine a skill `gerar-teste` em `.github/skills/gerar-teste/` com:
   - `SKILL.md` com frontmatter válido (name, description, version, tools, model)
   - Corpo com propósito, procedimento e regras específicas para o Portal
   - `scripts/gerar-boilerplate.js` funcional
   - `resources/template-teste-jest.js` com placeholders
2. Documente cada arquivo criado e seu propósito
3. Teste a skill com o Copilot e documente o resultado

**Entrega:** crie `entregas-aula07/q05-gerar-teste.md`:

```markdown
# Questão 5 — Skill Gerar Teste

## Estrutura da Skill

```
.github/skills/gerar-teste/
├── SKILL.md
├── scripts/
│   └── gerar-boilerplate.js
└── resources/
    └── template-teste-jest.js
```

## Frontmatter do SKILL.md

```yaml
name: 
description: 
version: 
tools: 
model: 
```

## Documentação dos Arquivos

| Arquivo | Propósito |
|---|---|
| SKILL.md | |
| gerar-boilerplate.js | |
| template-teste-jest.js | |

## Teste com o Copilot

Prompt usado:

Resultado (funcionou? O que foi gerado?):

## Conclusão
O que você mudaria ou adicionaria nesta skill na próxima versão? (2-3 frases)
```

---

## Questão 6: Scripts em Skills — Validação Automatizada

**Conceito-chave:** Scripts executáveis dentro de skills, invocação pelo agente via `run_script` (Aula 07, Seção 7).

**Objetivo:** Demonstrar que você sabe criar um script executável para uma skill e entende os limites de segurança.

**Passos de Execução:**

1. Crie o script `validar-contraste.js` em `.github/skills/revisar-acessibilidade/scripts/`
2. O script deve ler um arquivo CSS, extrair pares de cores (foreground/background) e calcular a taxa de contraste
3. Teste o script manualmente com o `styles.css` do Portal
4. Documente o resultado da execução

**Entrega:** crie `entregas-aula07/q06-scripts-skills.md`:

```markdown
# Questão 6 — Scripts em Skills

## Script Criado

Caminho: `.github/skills/revisar-acessibilidade/scripts/validar-contraste.js`

**Como o script funciona (descrição em 3-5 frases):**

## Limites de Segurança

| Limite | Descrição | Por que existe |
|---|---|---|
| Sandbox | | |
| Timeout | | |
| Filesystem restrito | | |
| Sem rede | | |

## Teste com styles.css

Comando executado:

Output:

Pares de cores analisados:

Resultado (quantos passaram WCAG AA?):

## Conclusão
Por que uma skill de auditoria como `revisar-acessibilidade` normalmente usa `tools: [read]` em vez de `tools: [read, write]`? (2-3 frases)
```

---

## Questão 7: Resources — Templates Embutidos

**Conceito-chave:** Templates, dados e configurações no diretório `resources/` (Aula 07, Seção 8).

**Objetivo:** Demonstrar que você sabe empacotar recursos estáticos dentro de uma skill.

**Passos de Execução:**

1. Crie o arquivo `resources/wcag-checklist.md` em `.github/skills/revisar-acessibilidade/`
2. O checklist deve cobrir os 4 princípios WCAG (Perceivable, Operable, Understandable, Robust)
3. Para cada princípio, inclua pelo menos 3 itens de verificação específicos para o Portal de Projetos Dev
4. Adicione uma seção de "Como testar" para cada item (ex: "Use a extensão axe DevTools no navegador")

**Entrega:** crie `entregas-aula07/q07-resources.md`:

```markdown
# Questão 7 — Resources

## Estrutura do Resource

Caminho: `.github/skills/revisar-acessibilidade/resources/wcag-checklist.md`

## Os 4 Princípios WCAG

| Princípio | Tradução | Foco |
|---|---|---|
| Perceivable | | |
| Operable | | |
| Understandable | | |
| Robust | | |

## Itens de Verificação (mínimo 3 por princípio)

### Perceivable
- [ ]
- [ ]
- [ ]

### Operable
- [ ]
- [ ]
- [ ]

### Understandable
- [ ]
- [ ]
- [ ]

### Robust
- [ ]
- [ ]
- [ ]

## Conclusão
Como o `wcag-checklist.md` complementa o script `validar-contraste.js` na skill `revisar-acessibilidade`? (2-3 frases)
```

---

## Questão 8: awesome-copilot — Descoberta e Reutilização

**Conceito-chave:** Exploração do catálogo de 349+ skills, critérios de seleção (Aula 07, Seção 9).

**Objetivo:** Demonstrar que você sabe navegar, avaliar e selecionar skills do ecossistema awesome-copilot.

**Passos de Execução:**

1. Acesse [github.com/github/awesome-copilot](https://github.com/github/awesome-copilot)
2. Encontre 2 skills que seriam relevantes para o Portal de Projetos Dev
3. Para cada skill, avalie: qualidade do SKILL.md, data de atualização, estrelas/forks, segurança dos scripts
4. Documente sua avaliação e decida se usaria cada skill

**Entrega:** crie `entregas-aula07/q08-awesome-copilot.md`:

```markdown
# Questão 8 — awesome-copilot

## Skills Selecionadas

### Skill 1: [nome]

**Repositório:** [URL]

**Categoria:**

**Avaliação:**

| Critério | Avaliação | Comentário |
|---|---|---|
| Qualidade do SKILL.md | | |
| Data de atualização | | |
| Estrelas/Forks | | |
| Segurança dos scripts | | |

**Decisão:** Usaria? Sim/Não — Por quê?

### Skill 2: [nome]

**Repositório:** [URL]

**Categoria:**

**Avaliação:**

| Critério | Avaliação | Comentário |
|---|---|---|
| Qualidade do SKILL.md | | |
| Data de atualização | | |
| Estrelas/Forks | | |
| Segurança dos scripts | | |

**Decisão:** Usaria? Sim/Não — Por quê?

## Conclusão
Qual critério de avaliação você considera mais importante ao escolher uma skill do awesome-copilot? Por quê? (2-3 frases)
```

---

## Questão 9: Estratégia — Matriz de Decisão

**Conceito-chave:** Quando criar skill vs quando usar instructions vs prompts (Aula 07, Seção 10).

**Objetivo:** Demonstrar que você sabe aplicar a matriz de decisão de 3 fatores a cenários reais do portal.

**Passos de Execução:**

1. Analise cada cenário abaixo com a matriz de decisão (frequência, especificidade, custo)
2. Classifique como Instruction, Skill ou Prompt
3. Justifique cada classificação
4. Para os itens classificados como Skill, indique o nome da skill que você criaria

**Cenários:**

1. Regra: "Use CSS Grid para layout de página e Flexbox para componentes de linha única" (relevante em ~70% das interações de CSS)
2. Procedimento: "Como criar um novo card de projeto com animação de entrada" (feito ~2x por sprint)
3. Regra: "Nunca expor variáveis de ambiente ou secrets no código" (deve valer sempre)
4. Procedimento: "Como otimizar imagens para o portal" (feito ~1x por mês)
5. Prompt: "Explique este trecho de código" (pergunta pontual)

**Entrega:** crie `entregas-aula07/q09-estrategia.md`:

```markdown
# Questão 9 — Estratégia

## Matriz de Decisão Aplicada

| Cenário | Frequência | Especificidade | Custo (tokens) | Classificação | Nome da Skill (se aplicável) |
|---|---|---|---|---|---|
| 1. CSS Grid vs Flexbox | | | | | |
| 2. Card com animação | | | | | |
| 3. Secrets no código | | | | | N/A |
| 4. Otimizar imagens | | | | | |
| 5. Explicar código | | | | | N/A |

## Anti-padrões Identificados

Para cada cenário classificado como Skill, qual anti-padrão aconteceria se ele fosse colocado como Instruction?

## Conclusão
Qual dos 3 fatores (frequência, especificidade, custo) você considera o mais importante na decisão? Por quê? (2-3 frases)
```

---

## Questão 10: Projeto Completo — As 3 Skills do Portal (PROJETO PROGRESSIVO)

**Conceito-chave:** Integração das skills `gerar-teste`, `revisar-acessibilidade`, `validar-html` no harness do Portal (Aula 07, Seção 11).

**Objetivo:** Demonstrar que você completou as 3 skills e as integrou ao harness existente.

**Passos de Execução:**

1. Verifique se as 3 skills estão completas em `.github/skills/`
2. Para cada skill, confira: SKILL.md com frontmatter, scripts funcionais (se aplicável), resources preenchidos
3. Teste cada skill com o Copilot — use `/skill` no chat
4. Documente a estrutura final do harness
5. Adicione uma quarta skill (projetada por você) com justificativa

**Entrega:** crie `entregas-aula07/q10-projeto-completo.md`:

```markdown
# Questão 10 — Projeto Completo

## Estrutura Final do Harness

```
.github/
├── copilot-instructions.md
├── instructions/
│   ├── css.instructions.md
│   ├── js.instructions.md
│   └── html.instructions.md
├── prompts/
│   ├── gerar-cards.prompt.md
│   ├── estilizar-componentes.prompt.md
│   └── validar-dados.prompt.md
└── skills/
    ├── gerar-teste/
    │   ├── SKILL.md
    │   ├── scripts/gerar-boilerplate.js
    │   └── resources/template-teste-jest.js
    ├── revisar-acessibilidade/
    │   ├── SKILL.md
    │   ├── scripts/validar-contraste.js
    │   └── resources/wcag-checklist.md
    └── validar-html/
        ├── SKILL.md
        ├── resources/regras-html-semantico.md
        └── resources/template-pagina-acessivel.html
```

## Status de Cada Skill

| Skill | SKILL.md completo? | Scripts funcionais? | Resources preenchidos? | Testado com Copilot? |
|---|---|---|---|---|
| gerar-teste | | | | |
| revisar-acessibilidade | | | | |
| validar-html | | | | |

## Testes com o Copilot

Para cada skill, documente:

### gerar-teste
Prompt usado:
Resultado:

### revisar-acessibilidade
Prompt usado:
Resultado:

### validar-html
Prompt usado:
Resultado:

## Quarta Skill — Projetada por Você

**Nome:** 

**Propósito:**

**Justificativa** (por que ela é necessária? qual frequência de uso? por que não é instruction?):

**Estrutura proposta:**

## Conclusão
Como as 3 skills se complementam e formam um sistema coberto com o harness existente (instructions + prompts)? (3-5 frases)
```

---

## Checklist Final: Pronto para a Aula 08?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Distinguir skills de instructions** — consigo explicar a diferença para um colega em 30 segundos e dar exemplos de cada
- [ ] **Descrever a anatomia de uma skill** — listo os 3 componentes (SKILL.md, scripts, resources) e o propósito de cada um de memória
- [ ] **Explicar o ciclo de vida** — desenho os 4 estágios (listada → carregada → ativa → descartada) e os gatilhos de cada transição
- [ ] **Calcular economia de tokens** — consigo estimar o custo de uma instruction vs skill para qualquer cenário de frequência e tamanho
- [ ] **Criar uma skill customizada** — crio um SKILL.md com frontmatter e corpo sem consultar referência
- [ ] **Incorporar scripts** — crio scripts em Node.js, bash ou Python que o agente pode invocar
- [ ] **Empacotar resources** — organizo templates, checklists e dados no diretório resources/ da skill
- [ ] **Explorar o awesome-copilot** — encontro, avaliei e selecionei skills do catálogo com critérios objetivos
- [ ] **Aplicar a matriz de decisão** — classifico qualquer conhecimento novo como instruction, skill ou prompt usando os 3 fatores
- [ ] **Construir as 3 skills do portal** — `gerar-teste`, `revisar-acessibilidade` e `validar-html` estão funcionais e integradas ao harness

> *Acertou todos? 🔥 Você está pronto para a Aula 08, onde vai criar **Custom Agents e Subagentes** — agentes especializados com tools, modelo e instruções próprias, que podem usar as skills que você acabou de construir. Seu harness ganha capacidade de raciocínio distribuído.*
>
> *Travou em algum item? Releia a seção indicada na questão correspondente antes de avançar.*
