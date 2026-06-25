---
titulo: "Aula 14 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 14: Engenharia de Requisitos"
data: 2026-06-21
---

# Aula 14 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o **checkpoint de aprendizagem** da Aula 14. A pergunta central é: *"eu realmente entendi engenharia de requisitos?"*.

Cada questão verifica um conceito-chave da aula. Você deve conseguir respondê-las **sem consultar o material** — se travar, releia a seção indicada e tente novamente.

**Como proceder:**

1. Crie uma pasta `entregas-aula14/` no seu diretório de trabalho
2. Faça cada questão na ordem — elas seguem a progressão da aula
3. Para cada questão, crie um arquivo separado seguindo o template de entrega
4. Ao final, use o **Checklist Final** para verificar se está pronto para a Aula 15

> *Não olhe o gabarito antes de tentar. O erro faz parte do aprendizado.*

---

## Questão 1: Classificando Requisitos do E-commerce

**Conceito-chave:** Requisitos Funcionais e Não-Funcionais (Aula 14, Seção 1).

**Objetivo:** Demonstrar que você sabe distinguir requisitos funcionais de não-funcionais aplicados ao contexto do e-commerce.

**Passos de Execução:**

1. Leia cada item da lista abaixo
2. Classifique como **RF** (requisito funcional) ou **RNF** (requisito não-funcional)
3. Para cada RNF, identifique qual ilidade ele descreve (desempenho, segurança, disponibilidade, usabilidade, etc.)

**Entrega:** crie `entregas-aula14/01-classificando-requisitos.md`:

```markdown
# Questão 1 — Classificando Requisitos

## Tabela de Classificação

| Item | Tipo (RF/RNF) | Ilidade (se RNF) |
|---|---|---|
| "O sistema deve permitir pagamento via cartão de crédito" | | |
| "O checkout deve responder em menos de 2 segundos" | | |
| "O sistema deve estar disponível 99,9% do tempo" | | |
| "O cliente pode cancelar o pedido em até 24h" | | |
| "A senha deve ser armazenada com hash bcrypt" | | |
| "O sistema deve enviar email de confirmação após o pedido" | | |
| "O sistema deve suportar 5000 usuários simultâneos" | | |

## Conclusão

Em 2-3 frases: por que é importante distinguir RF de RNF antes de começar a implementar?
```

---

## Questão 2: Planejando a Elicitação para uma Feature

**Conceito-chave:** Técnicas de Elicitação (Aula 14, Seção 2).

**Objetivo:** Demonstrar que você sabe selecionar técnicas de elicitação para um cenário real.

**Passos de Execução:**

1. Leia o cenário: o PO do e-commerce quer implementar "frete dinâmico" — o valor do frete varia por CEP, peso, dimensões e tipo de produto (eletrônicos têm regras diferentes de alimentos)
2. Escolha 3 técnicas de elicitação que você usaria para descobrir os requisitos completos desta feature
3. Para cada técnica, explique: o que você espera descobrir, quem participa e por que esta técnica é adequada

**Entrega:** crie `entregas-aula14/02-planejando-elicitacao.md`:

```markdown
# Questão 2 — Planejando a Elicitação para Frete Dinâmico

## Técnicas Selecionadas

### Técnica 1: [Nome da técnica]
- **O que espera descobrir:**
- **Quem participa:**
- **Por que esta técnica é adequada:**

### Técnica 2: [Nome da técnica]
- **O que espera descobrir:**
- **Quem participa:**
- **Por que esta técnica é adequada:**

### Técnica 3: [Nome da técnica]
- **O que espera descobrir:**
- **Quem participa:**
- **Por que esta técnica é adequada:**

## Conclusão

Em 2-3 frases: como as três técnicas se complementam e evitam que você implemente a feature errada?
```

---

## Questão 3: Escrevendo User Stories

**Conceito-chave:** User Stories (Aula 14, Seção 3).

**Objetivo:** Demonstrar que você sabe escrever User Stories no formato correto e avaliar a qualidade usando INVEST.

**Passos de Execução:**

1. Para cada item da lista abaixo, transforme em uma User Story no formato "Como [ator], quero [ação] para [benefício]"
2. Avalie se a sua story atende ao critério INVEST — se não atender, decompose em stories menores

**Itens para transformar em User Stories:**
- "Cliente quer um histórico de pedidos com opção de recompra"
- "Admin precisa gerenciar o catálogo de produtos (CRUD)"
- "Sistema de notificações push para ofertas personalizadas"

**Entrega:** crie `entregas-aula14/03-escrevendo-user-stories.md`:

```markdown
# Questão 3 — Escrevendo User Stories

## Story 1: Histórico de Pedidos

**User Story:**
Como [...], quero [...] para [...].

**Checklist INVEST:**
- [ ] Independent — pode ser desenvolvida em qualquer ordem?
- [ ] Negotiable — detalhes podem ser ajustados?
- [ ] Valuable — entrega valor real ao usuário?
- [ ] Estimable — dá para estimar esforço?
- [ ] Small — cabe em uma sprint?
- [ ] Testable — tem critérios de aceitação verificáveis?

## Story 2: Gerenciar Catálogo de Produtos

**User Story:**
Como [...], quero [...] para [...].

**Decomposição (se necessário):**
- Story 2a: ...
- Story 2b: ...

## Story 3: Notificações Push

**User Story:**
Como [...], quero [...] para [...].

**Checklist INVEST:**
- [ ] Independent | [ ] Negotiable | [ ] Valuable
- [ ] Estimable | [ ] Small | [ ] Testable
```

---

## Questão 4: Modelando um Caso de Uso

**Conceito-chave:** Casos de Uso (Aula 14, Seção 4).

**Objetivo:** Demonstrar que você sabe modelar um Caso de Uso completo com fluxos alternativos e exceções.

**Passos de Execução:**

1. Modele um Caso de Uso para a funcionalidade "Cancelar Pedido" no e-commerce
2. Inclua: nome, ator principal, pré-condições, fluxo principal, pelo menos 2 fluxos alternativos, 1 fluxo de exceção, pós-condições
3. Opcional: desenhe um diagrama de fluxo (Mermaid)

**Entrega:** crie `entregas-aula14/04-caso-de-uso-cancelar-pedido.md`:

```markdown
# Questão 4 — Caso de Uso: Cancelar Pedido

**Nome:** Cancelar Pedido

**Ator Principal:** [quem?]

**Pré-condições:**
- [ ]
- [ ]

**Fluxo Principal:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
4. [Passo 4]
5. [Passo 5]

**Pós-condições:**
- [ ]
- [ ]

**Fluxo Alternativo A — [descrever]:**
- A1. ...
- A2. ...

**Fluxo Alternativo B — [descrever]:**
- B1. ...

**Fluxo de Exceção E — [descrever]:**
- E1. ...

## Diagrama de Fluxo (opcional)

```mermaid
flowchart TD
    [seu diagrama aqui]
```
```

---

## Questão 5: Definindo Critérios de Aceitação

**Conceito-chave:** Critérios de Aceitação (Aula 14, Seção 5).

**Objetivo:** Demonstrar que você sabe transformar uma User Story em critérios verificáveis no formato Dado-Quando-Então.

**Passos de Execução:**

1. Leia a User Story: "Como cliente, quero receber recomendações de produtos baseadas no meu histórico de compras para descobrir itens relevantes."
2. Escreva **4 critérios de aceitação** no formato Dado-Quando-Então
3. Inclua: 1 cenário feliz, 1 cenário de borda (ex: sem histórico), 1 cenário de erro, 1 cenário com regra de negócio

**Entrega:** crie `entregas-aula14/05-criterios-recomendacao.md`:

```markdown
# Questão 5 — Critérios de Aceitação: Recomendação de Produtos

**User Story:**
"Como cliente, quero receber recomendações de produtos baseadas no meu histórico de compras para descobrir itens relevantes."

## Critério 1 — Cenário Feliz

**Dado** que [contexto],
**Quando** [ação],
**Então** [resultado].

## Critério 2 — Sem Histórico

**Dado** que [contexto],
**Quando** [ação],
**Então** [resultado].

## Critério 3 — [descrever cenário de erro]

**Dado** que [contexto],
**Quando** [ação],
**Então** [resultado].

## Critério 4 — [descrever regra de negócio]

**Dado** que [contexto],
**E** que [contexto adicional],
**Quando** [ação],
**Então** [resultado].
```

---

## Questão 6: Priorizando o MVP do E-commerce

**Conceito-chave:** Priorização (Aula 14, Seção 6).

**Objetivo:** Demonstrar que você sabe aplicar MoSCoW e matriz valor vs esforço para priorizar features.

**Passos de Execução:**

1. Leia a lista de features candidatas para o MVP do e-commerce
2. Classifique cada uma como M/S/C/W (MoSCoW)
3. Desenhe uma matriz valor vs esforço posicionando cada feature no quadrante correto
4. Justifique sua classificação para as 2 features mais polêmicas

**Features candidatas:**
- Checkout com pagamento
- Carrinho persistente
- Recomendação de produtos com IA
- Chat ao vivo com suporte
- Avaliação de produtos
- Programa de fidelidade com pontos
- Nota fiscal automática
- Tema escuro (dark mode)

**Entrega:** crie `entregas-aula14/06-priorizando-mvp.md`:

```markdown
# Questão 6 — Priorizando o MVP do E-commerce

## Classificação MoSCoW

| Feature | M/S/C/W | Justificativa |
|---|---|---|
| Checkout com pagamento | | |
| Carrinho persistente | | |
| Recomendação com IA | | |
| Chat ao vivo | | |
| Avaliação de produtos | | |
| Programa de fidelidade | | |
| Nota fiscal automática | | |
| Tema escuro | | |

## Matriz Valor vs Esforço

```mermaid
quadrantChart
    title Matriz Valor vs Esforço — MVP E-commerce
    x-axis "Baixo Esforço" --> "Alto Esforço"
    y-axis "Baixo Valor" --> "Alto Valor"
    quadrant-1 "Faça Primeiro"
    quadrant-2 "Faça Depois"
    quadrant-3 "Evite"
    quadrant-4 "Invista com Cuidado"
    [Posicione cada feature com coordenadas aproximadas]
```

## Justificativa para Features Polêmicas

**Feature 1: [nome] — Classificação [M/S/C/W]**
[Por que esta classificação faz sentido]

**Feature 2: [nome] — Classificação [M/S/C/W]**
[Por que esta classificação faz sentido]
```

---

## Questão 7: Agente Extrator de Requisitos 🤖

**Conceito-chave:** Agent Perspective — Pipeline Agêntico (Aula 14, Seção 7).

**Objetivo:** Demonstrar que você sabe atuar como o HITL (Human-in-the-Loop) no pipeline agêntico, revisando e criticando o output de um agente extrator de requisitos.

**Passos de Execução:**

1. Leia a transcrição abaixo (simulando uma conversa com o PO)
2. Leia o output que um agente gerou para esta conversa
3. Identifique **3 problemas** no output do agente (story mal escrita, critério faltante, regra não capturada, pergunta pendente não identificada)
4. Reescreva o output corrigido com as melhorias que você faria

**Transcrição da conversa:**
```
PO: "Precisamos de um sistema de lista de desejos. O cliente salva 
produtos que ele quer comprar depois."

DEV: "Essa lista é pública? Dá para compartilhar?"
PO: "Não, é privada. Só o cliente vê. Mas ele pode criar múltiplas 
listas — tipo 'Presentes', 'Ferramentas', 'Livros'."

DEV: "Dá para adicionar produto de qualquer lugar?"
PO: "Sim. Na página do produto tem um botão 'Adicionar à lista' e 
ele escolhe qual lista. E dá pra enviar a lista por email."

DEV: "Notifica quando o produto entra em promoção?"
PO: "Boa ideia! Mas não pra agora. V1 é só salvar e organizar."
```

**Output do agente (com problemas propositais):**

```
US-01: "Como usuário, quero adicionar produtos a uma lista de desejos 
para comprar depois."

Critérios:
C1 — Dado que o cliente está na página do produto, Quando clica em 
"Adicionar à lista", Então o produto é adicionado à lista padrão.

US-02: "Como cliente, quero gerenciar listas de desejos."
(Nota: story genérica — "gerenciar" é vago, sem critérios definidos)
```

**Entrega:** crie `entregas-aula14/07-revisando-agente.md`:

```markdown
# Questão 7 — Revisando o Output do Agente Extrator

## Problemas Identificados

**Problema 1:**
[Descreva o problema e por que é crítico]

**Problema 2:**
[Descreva o problema e por que é crítico]

**Problema 3:**
[Descreva o problema e por que é crítico]

## Output Corrigido

**US-01 revisada:**
[Story reformulada com os problemas corrigidos]

**Critérios revisados:**
[C1, C2, C3... com as correções aplicadas]

**US-02 revisada:**
[Story decompondo "gerenciar" em histórias específicas]

## Perguntas Pendentes para o PO

1. [Pergunta que o agente deveria ter feito]
2. [Outra pergunta relevante]

## Conclusão

Em 2-3 frases: o que você aprendeu sobre a importância de revisar o output do agente?
```

---

## Questão 8: Síntese — Documentando 3 User Stories para o E-commerce

**Conceito-chave:** Síntese de toda a aula (Aulas 14, Seções 1-7).

**Objetivo:** Demonstrar domínio completo do ciclo de engenharia de requisitos, da elicitação à especificação final.

**Passos de Execução:**

1. Escolha uma feature do e-commerce que NÃO foi coberta nas questões anteriores (ex: "devolução de produtos", "agendamento de entrega", "vale-presente", "assinatura recorrente")
2. Documente-a com:
   - **Técnica de elicitação:** qual técnica você usaria para descobrir os requisitos e por quê
   - **User Story:** no formato correto
   - **Caso de Uso:** fluxo principal + 2 alternativos (pode ser resumido)
   - **Critérios de Aceitação:** pelo menos 3 no formato Dado-Quando-Então
   - **Priorização:** classifique como M/S/C/W para o MVP e justifique

**Entrega:** crie `entregas-aula14/08-sintese-feature.md`:

```markdown
# Questão 8 — Especificação Completa de Feature

## Feature Escolhida

[Nome da feature]

## Técnica de Elicitação

**Técnica escolhida:** [nome]
**Por que:** [justificativa]

## User Story

Como [ator], quero [ação] para [benefício].

## Caso de Uso (Resumido)

**Nome:** [nome do caso de uso]

**Fluxo Principal:**
1. ...
2. ...
3. ...

**Fluxo Alternativo A — [descrição]:**
- A1. ...

**Fluxo Alternativo B — [descrição]:**
- B1. ...

## Critérios de Aceitação

**C1 — [título]:**
- Dado que ...
- Quando ...
- Então ...

**C2 — [título]:**
- Dado que ...
- Quando ...
- Então ...

**C3 — [título]:**
- Dado que ...
- Quando ...
- Então ...

## Priorização

**Classificação MoSCoW:** [M/S/C/W]
**Justificativa:** [por que esta classificação]
```

---

## Checklist Final: Pronto para a Aula 15?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Distinguir RF de RNF**: consigo classificar qualquer requisito do e-commerce em funcional ou não-funcional e identificar a ilidade correspondente
- [ ] **Escolher técnica de elicitação**: dado um cenário, consigo selecionar a técnica adequada e justificar a escolha
- [ ] **Escrever User Stories**: consigo transformar uma ideia vaga em uma story no formato "Como..., quero..., para..." que atende INVEST
- [ ] **Modelar Caso de Uso**: consigo documentar fluxo principal, alternativos e exceções para uma feature complexa
- [ ] **Definir critérios de aceitação**: consigo escrever cenários Dado-Quando-Então que cobrem caminho feliz, bordas e erros
- [ ] **Priorizar com MoSCoW**: consigo classificar features do e-commerce usando critérios objetivos
- [ ] **Analisar output de agente**: consigo identificar problemas no output de um agente extrator de requisitos e corrigi-los
- [ ] **Documentar feature completa**: consigo produzir uma especificação coesa combinando todas as técnicas da aula
- [ ] **Explicar o pipeline agêntico**: consigo descrever o fluxo transcrição → agente → HITL e o papel de cada etapa
- [ ] **Conectar com a próxima aula**: entendo que os critérios de aceitação que escrevi aqui são a matéria-prima dos cenários Gherkin que vou automatizar na Aula 15 com BDD e Cucumber.js

> *Acertou todos? Você está pronto para a Aula 15, onde vai transformar esses critérios de aceitação em cenários Gherkin executáveis com Cucumber.js — e ver o BDD em ação no e-commerce. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
