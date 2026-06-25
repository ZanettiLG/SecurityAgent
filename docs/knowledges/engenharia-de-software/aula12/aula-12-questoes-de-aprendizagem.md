---
titulo: "Aula 12 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 12: Arquitetura de Software — Estilos, Padrões e Decisões"
data: 2026-06-21
---

# Aula 12 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de aprendizagem** da Aula 12. A pergunta central é: *"eu realmente entendi arquitetura de software?"*

Cada questão verifica um conceito-chave da aula. Você deve fazê-las **depois** de estudar o conteúdo principal, sem reler a aula a cada passo. Se travar, a seção indicada em **Conceito-chave** mostra onde consultar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-12/` no seu diretório de estudos
2. Faça as questões em ordem — cada uma se apoia na anterior
3. Para cada questão, crie o arquivo de entrega indicado e preencha o template
4. Ao final, revise o **Checklist Final** e marque o que você consegue fazer sem consultar a aula

---

## Questão 1: O que é arquitetura de software?

**Conceito-chave:** Definição de arquitetura e a diferença para design de baixo nível (Aula 12, Seção 1).

**Objetivo:** Verificar se você compreende o que define uma decisão como "arquitetural" e por que o custo da mudança é o critério central.

**Passos de Execução:**

1. Defina arquitetura de software com suas palavras
2. Explique por que o custo da mudança diferencia arquitetura de design de baixo nível
3. Dê um exemplo concreto de uma decisão arquitetural e uma de design, justificando a classificação

**Entrega:** crie `entregas-aula-12/01-o-que-e-arquitetura.md`:

```markdown
# Questão 1 — O que é arquitetura de software?

## Minha definição de arquitetura

[Escreva aqui com suas palavras]

## O custo da mudança como critério

[Explique a diferença]

## Exemplo concreto

- Decisão arquitetural: [descreva]
- Decisão de design: [descreva]
- Por que uma é arquitetural e a outra não: [justifique]
```

---

## Questão 2: Comparando estilos arquiteturais

**Conceito-chave:** Os 5 estilos arquiteturais e seus trade-offs (Aula 12, Seção 2).

**Objetivo:** Demonstrar que você consegue comparar estilos arquiteturais e identificar qual se aplica a cada contexto.

**Passos de Execução:**

1. Sem consultar a aula, liste os 5 estilos arquiteturais estudados
2. Para cada estilo, escreva UMA frase que capture sua essência
3. Preencha a tabela com "✅ Sim" ou "❌ Não" para cada par estilo-ilidade

**Entrega:** crie `entregas-aula-12/02-comparando-estilos.md`:

```markdown
# Questão 2 — Comparando Estilos Arquiteturais

## Os 5 estilos

1. [Nome]: [frase de essência]
2. [Nome]: [frase de essência]
3. [Nome]: [frase de essência]
4. [Nome]: [frase de essência]
5. [Nome]: [frase de essência]

## Matriz Estilo vs Ilidade

| Estilo | Testabilidade | Deployabilidade | Simplicidade | Isolamento de Domínio |
|---|---|---|---|---|
| Layered | | | | |
| Hexagonal | | | | |
| Clean Architecture | | | | |
| Vertical Slices | | | | |
| Microservices | | | | |

## Pergunta de reflexão

Qual estilo você escolheria para um sistema de processamento de transações financeiras? Por quê?

[Responda em 3-5 frases]
```

---

## Questão 3: Trade-offs de ilidades

**Conceito-chave:** Características arquiteturais e seus trade-offs (Aula 12, Seção 3).

**Objetivo:** Verificar se você entende que ilidades competem entre si e como priorizá-las.

**Passos de Execução:**

1. Escolha 3 pares de ilidades que competem entre si
2. Para cada par, descreva o trade-off e dê um exemplo concreto
3. Atribua pesos para as ilidades de um sistema de **streaming de vídeo** (como Netflix) e justifique

**Entrega:** crie `entregas-aula-12/03-trade-offs-ilidades.md`:

```markdown
# Questão 3 — Trade-offs de Ilidades

## Par 1: [Ilidade A] vs [Ilidade B]

Trade-off: [descrição]
Exemplo: [caso concreto]

## Par 2: [Ilidade C] vs [Ilidade D]

Trade-off: [descrição]
Exemplo: [caso concreto]

## Par 3: [Ilidade E] vs [Ilidade F]

Trade-off: [descrição]
Exemplo: [caso concreto]

## Priorização para um sistema de streaming de vídeo

| Ilidade | Peso (1-5) | Justificativa |
|---|---|---|
| Desempenho | | |
| Disponibilidade | | |
| Segurança | | |
| Escalabilidade | | |
| Testabilidade | | |
| Modificabilidade | | |
| Deployabilidade | | |

**Conclusão:** Qual estilo arquitetural você recomenda para este sistema?
```

---

## Questão 4: C4 Model — Nível 1 e 2

**Conceito-chave:** C4 Model níveis 1 (Contexto) e 2 (Container) (Aula 12, Seção 4).

**Objetivo:** Verificar se você consegue criar diagramas C4 de contexto e container para um sistema diferente do e-commerce.

**Passos de Execução:**

1. Escolha um sistema que você conhece (pode ser um projeto pessoal, um sistema do trabalho ou um serviço conhecido como Uber, Airbnb, etc.)
2. Descreva o diagrama de Contexto (nível 1): atores e sistemas externos
3. Descreva o diagrama de Container (nível 2): aplicações, bancos, filas
4. Explique como esses diagramas ajudariam um novo desenvolvedor a entender o sistema

**Entrega:** crie `entregas-aula-12/04-c4-model.md`:

```markdown
# Questão 4 — C4 Model

## Sistema escolhido

[Nome e descrição do sistema]

## Nível 1: Diagrama de Contexto

**Atores:**
- [Ator 1]: [descrição]
- [Ator 2]: [descrição]

**Sistemas externos:**
- [Sistema 1]: [descrição]
- [Sistema 2]: [descrição]

**Relacionamentos:** [descreva quem se comunica com quem e como]

## Nível 2: Diagrama de Container

**Containers:**
- [Container 1]: [tecnologia + função]
- [Container 2]: [tecnologia + função]
- [Container 3]: [tecnologia + função]

**Comunicação entre containers:** [descreva]

## Por que isso ajuda?

[Explique o valor de ter esses diagramas para um novo desenvolvedor]
```

---

## Questão 5: Criando um ADR

**Conceito-chave:** Architecture Decision Records — estrutura e propósito (Aula 12, Seção 5).

**Objetivo:** Demonstrar que você sabe escrever um ADR completo com contexto, alternativas, decisão e consequências.

**Passos de Execução:**

1. Imagine que você precisa decidir entre **Redis** e **banco relacional** para o cache de catálogo de produtos do e-commerce
2. Defina o contexto: por que precisa de cache? quais os requisitos?
3. Liste pelo menos 2 alternativas consideradas
4. Tome uma decisão e justifique
5. Liste consequências positivas e negativas

**Entrega:** crie `entregas-aula-12/05-adr-cache.md` com o ADR completo no formato markdown:

```markdown
# ADR-005: Cache de Catálogo com [Redis / PostgreSQL / outra]

**Status:** Proposto

**Data:** [data de hoje]

## Contexto

[Descreva o problema, as forças em jogo, o que foi considerado]

## Decisão

[Qual a escolha e por que esta em vez das alternativas]

## Consequências

- Positivas: [lista]
- Negativas: [lista]
- Riscos: [lista com mitigações]
```

---

## Questão 6: Decisão consciente de estilo

**Conceito-chave:** Critérios de escolha entre estilos arquiteturais (Aula 12, Seções 2 e 3).

**Objetivo:** Verificar se você consegue aplicar o modelo de forças para tomar uma decisão arquitetural consciente.

**Passos de Execução:**

1. Leia o cenário abaixo
2. Atribua pesos às ilidades
3. Avalie quais estilos se encaixam melhor
4. Recomende um estilo e justifique

**Cenário:** Um sistema de **telemedicina** onde médicos fazem consultas por vídeo, prescrevem receitas e acessam histórico de pacientes. Requisitos críticos: disponibilidade (consulta não pode cair), segurança (dados sensíveis LGPD), baixa latência (vídeo em tempo real). Time: 6 desenvolvedores.

**Entrega:** crie `entregas-aula-12/06-decisao-telemedicina.md`:

```markdown
# Questão 6 — Decisão de Estilo para Telemedicina

## Análise de Ilidades

| Ilidade | Peso (1-5) | Justificativa |
|---|---|---|
| Disponibilidade | | |
| Segurança | | |
| Desempenho | | |
| Testabilidade | | |
| Modificabilidade | | |
| Deployabilidade | | |

## Estilos candidatos

- [Estilo 1]: [por que se encaixa ou não]
- [Estilo 2]: [por que se encaixa ou não]
- [Estilo 3]: [por que se encaixa ou não]

## Recomendação

**Estilo recomendado:** [nome]

**Justificativa:** [3-5 frases explicando por que este estilo equilibra melhor as ilidades priorizadas]
```

---

## Questão 7: Documentando uma decisão do seu projeto

**Conceito-chave:** Todo o processo de documentação arquitetural — C4 + ADRs (Aula 12, Seções 4 e 5).

**Objetivo:** Verificar se você consegue aplicar C4 e ADRs para documentar uma decisão real do seu projeto de e-commerce.

**Passos de Execução:**

1. Identifique uma decisão arquitetural que você tomou (ou precisa tomar) no seu projeto de e-commerce
2. Crie um ADR para ela seguindo o template: Contexto, Decisão, Consequências
3. Identifique em qual nível do C4 Model essa decisão se manifesta (nível 2? nível 3?)
4. Explique como essa decisão impacta as ilidades do sistema

**Entrega:** crie `entregas-aula-12/07-minha-decisao.md`:

```markdown
# Questão 7 — Documentando uma Decisão do Meu Projeto

## Decisão escolhida

[Título breve]

## ADR correspondente

```markdown
# ADR-NNN: [Título]

**Status:** [Proposto | Aceito]
**Data:** [data]

## Contexto
[O problema e as forças]

## Decisão
[A escolha e justificativa]

## Consequências
[Ganhos, perdas e riscos]
```

## Impacto no C4 Model

**Nível do C4:** [1/2/3/4]
**Explicação:** [como essa decisão aparece no diagrama de contexto, container, componente ou código]

## Impacto nas ilidades

| Ilidade | Impacto | Justificativa |
|---|---|---|
| [Ilidade] | [Melhora/Piora] | [explicação] |
```

---

## Questão 8: Revisão crítica de ADRs existentes

**Conceito-chave:** Avaliação e evolução de decisões arquiteturais (Aula 12, Seção 5).

**Objetivo:** Verificar se você consegue criticar e evoluir ADRs existentes — habilidade essencial em times que praticam arquitetura evolutiva.

**Passos de Execução:**

1. Leia o ADR-001 da aula (Clean Architecture em vez de Layered)
2. Identifique uma consequência negativa que não foi listada
3. Proponha uma mitigação para essa consequência
4. Reflita: em que cenário você recomendaria substituir essa decisão? (crie um ADR de substituição hipotético)

**Entrega:** crie `entregas-aula-12/08-revisao-adr.md`:

```markdown
# Questão 8 — Revisão Crítica de ADRs

## ADR analisado

ADR-001: Adotar Clean Architecture como estilo arquitetural

## Consequência negativa não listada

[Descreva um impacto negativo que não foi mencionado no ADR original]

## Mitigação proposta

[Como você reduziria ou eliminaria essa consequência?]

## Cenário de substituição

**Em que contexto esta decisão deveria ser revista?**

[Descreva um cenário hipotético onde você recomendaria substituir Clean Architecture por outro estilo]

## ADR de substituição (hipotético)

```markdown
# ADR-006: Substituir Clean Architecture por [estilo alternativo]

**Status:** Proposto
**Data:** [data futura hipotética]
**Substitui:** ADR-001

## Contexto
[Por que a decisão anterior não é mais adequada]

## Decisão
[Nova escolha]

## Consequências
[Ganhos, perdas e riscos da mudança]
```
```

---

## Checklist Final: Pronto para a Aula 13?

Antes de avançar para a Aula 13 (Clean Architecture na Prática), verifique se você consegue fazer cada item abaixo **sem consultar a aula**:

- [ ] **Definir** o que é arquitetura de software e qual o critério para distinguir decisões arquiteturais de decisões de design
- [ ] **Listar** os 5 estilos arquiteturais estudados e a essência de cada um
- [ ] **Comparar** Layered vs Hexagonal em termos de dependência entre domínio e infraestrutura
- [ ] **Explicar** por que ilidades competem entre si e dar um exemplo concreto
- [ ] **Descrever** os 4 níveis do C4 Model e o público-alvo de cada um
- [ ] **Criar** um diagrama de Contexto (nível 1) para um sistema qualquer
- [ ] **Criar** um diagrama de Container (nível 2) identificando tecnologias e comunicação
- [ ] **Escrever** um ADR completo com as 4 seções (Contexto, Decisão, Consequências, Status)
- [ ] **Avaliar** qual estilo arquitetural se aplica melhor a um contexto dado, justificando com ilidades
- [ ] **Criticar** um ADR existente, identificando consequências não listadas e propondo mitigações

**Teaser da Aula 13:** Você documentou a arquitetura e registrou as decisões. Agora vai implementar. Na Aula 13, você vai refatorar o controller Express monolítico para Clean Architecture — uma camada por vez, com código real e testes passando em cada etapa. A teoria vira prática.
