---
titulo: "Aula 15 — Questões de Aprendizagem"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "Aula 15: SDD + BDD com Gherkin"
data: 2026-06-21
---

# Aula 15 — Questões de Aprendizagem

## Como Usar Este Arquivo

Este é o seu **checkpoint de aprendizagem**. A pergunta central é: *"eu realmente entendi a matéria?"*

Cada questão verifica um conceito-chave da aula. Você deve fazê-las **depois** de estudar o conteúdo principal, sem reler a aula a cada passo. Se travar, a seção indicada em **Conceito-chave** mostra onde consultar.

**Como proceder:**

1. Crie uma pasta `entregas-aula-15/` no seu diretório de estudos
2. Faça as questões em ordem — cada uma se apoia na anterior
3. Para cada questão, crie o arquivo de entrega indicado e preencha o template
4. Ao final, revise o **Checklist Final** e marque o que você consegue fazer sem consultar a aula

---

## Questão 1: SDD vs Documentação Tradicional

**Conceito-chave:** Specification-Driven Development (Aula 15, Seção 1).

**Objetivo:** Demonstrar que você compreende a diferença entre especificação executável e documentação tradicional.

**Passos de Execução:**

1. Sem consultar a aula, defina SDD com suas palavras
2. Explique por que documentação tradicional tende a ficar desatualizada
3. Dê um exemplo de especificação ambígua e reescreva-a como um par Given-When-Then concreto

**Entrega:** crie `entregas-aula-15/01-sdd-vs-documentacao.md`:

```markdown
# Questão 1 — SDD vs Documentação Tradicional

## Definição de SDD

[Escreva aqui com suas palavras]

## Por que documentação tradicional desatualiza?

[Explique o ciclo: escrita → leitura → desatualização → ignorância]

## Exemplo de especificação ambígua → concreta

**Especificação ambígua original:**
[Escreva uma frase ambígua como "O sistema deve cobrar frete"]

**Reescrita como Given-When-Then:**
[Escreva um cenário Gherkin claro e específico]

## Conclusão

Em 2-3 frases: por que uma especificação que executa vale mais que uma que apenas descreve?
```

---

## Questão 2: BDD e os Três Amigos

**Conceito-chave:** Behavior-Driven Development (Aula 15, Seção 2).

**Objetivo:** Verificar se você compreende o propósito do BDD e o papel de cada um dos Três Amigos.

**Passos de Execução:**

1. Explique o propósito do BDD em uma frase
2. Liste os Três Amigos e o que cada um contribui para a escrita de cenários
3. Dê um exemplo de pergunta que cada amigo faria sobre a feature "cancelar pedido"

**Entrega:** crie `entregas-aula-15/02-bdd-tres-amigos.md`:

```markdown
# Questão 2 — BDD e os Três Amigos

## Propósito do BDD

[Uma frase]

## Os Três Amigos

| Amigo | Contribuição | Pergunta sobre "cancelar pedido" |
|---|---|---|
| [Amigo 1] | | |
| [Amigo 2] | | |
| [Amigo 3] | | |

## Diferença entre BDD e TDD

[Explique a diferença com suas palavras — foco, público, cobertura]

## Conclusão

Em 2-3 frases: como o BDD melhora a comunicação no time?
```

---

## Questão 3: Sintaxe Gherkin

**Conceito-chave:** Gherkin — Given, When, Then (Aula 15, Seção 3).

**Objetivo:** Comprovar que você domina a sintaxe e as keywords do Gherkin.

**Passos de Execução:**

1. Liste as 5 principais keywords do Gherkin e o propósito de cada uma
2. Explique a diferença entre Scenario e Scenario Outline
3. Escreva um cenário Gherkin para a seguinte regra: "Clientes com pedido acima de R$ 400 ganham frete grátis. Abaixo disso, o frete é calculado por peso e distância."

**Entrega:** crie `entregas-aula-15/03-sintaxe-gherkin.md`:

```markdown
# Questão 3 — Sintaxe Gherkin

## Keywords Gherkin

| Keyword | Propósito | Exemplo |
|---|---|---|
| Feature | | |
| Scenario | | |
| Given | | |
| When | | |
| Then | | |
| And / But | | |
| Background | | |
| Scenario Outline | | |

## Scenario vs Scenario Outline

[Explique a diferença e quando usar cada um]

## Cenário: Regra de frete grátis

```gherkin
[Escreva o cenário completo aqui]
```

## Conclusão

Em 2-3 frases: qual aspecto do Gherkin você considera mais valioso para comunicação entre devs e não-devs?
```

---

## Questão 4: Cenários Gherkin — Aplicação de Cupom

**Conceito-chave:** Cenários Gherkin para features do e-commerce (Aula 15, Seção 4).

**Objetivo:** Verificar se você consegue escrever cenários Gherkin para uma regra de negócio completa.

**Passos de Execução:**

1. Leia a regra de negócio abaixo
2. Escreva 3 cenários Gherkin completos: fluxo feliz, fluxo de exceção e edge case
3. Use Background para contexto comum

**Regra de negócio:** "Clientes podem acumular pontos de fidelidade a cada compra. A cada R$ 10 gastos, o cliente ganha 1 ponto. Pontos podem ser trocados por descontos em compras futuras na taxa de 1 ponto = R$ 1 de desconto. O desconto máximo por pedido é de 20% do valor total. Pontos expiram em 12 meses."

**Entrega:** crie `entregas-aula-15/04-cenarios-cupom.md`:

```markdown
# Questão 4 — Cenários: Programa de Fidelidade

## Background

```gherkin
[Contexto comum aos 3 cenários]
```

## Cenário 1: Fluxo feliz — acumular pontos ao comprar

```gherkin
[Escreva o cenário]
```

## Cenário 2: Exceção — tentar usar mais pontos que o permitido

```gherkin
[Escreva o cenário]
```

## Cenário 3: Edge case — pontos expirados

```gherkin
[Escreva o cenário]
```

## Conclusão

Em 2-3 frases: quais edge cases você identificou além dos solicitados?
```

---

## Questão 5: Cucumber.js — Configuração

**Conceito-chave:** Cucumber.js com TypeScript (Aula 15, Seção 5).

**Objetivo:** Demonstrar que você sabe configurar o Cucumber.js em um projeto TypeScript.

**Passos de Execução:**

1. Liste os pacotes npm necessários para Cucumber.js com TypeScript
2. Escreva o conteúdo do arquivo `.cucumber.js` de configuração
3. Explique o propósito do World e como ele é instanciado
4. Explique a diferença entre Before e BeforeAll

**Entrega:** crie `entregas-aula-15/05-cucumber-config.md`:

```markdown
# Questão 5 — Configuração do Cucumber.js

## Pacotes necessários

```bash
[Comandos npm install]
```

## Arquivo .cucumber.js

```javascript
[Conteúdo do arquivo]
```

## Propósito do World

[Explique para que serve e como é instanciado]

## Before vs BeforeAll

| Característica | Before | BeforeAll |
|---|---|---|
| Quando executa | | |
| Escopo | | |
| Caso de uso típico | | |

## Conclusão

Em 2-3 frases: o que você aprendeu sobre a arquitetura do Cucumber.js que não sabia antes?
```

---

## Questão 6: Step Definitions

**Conceito-chave:** Step definitions (Aula 15, Seção 5).

**Objetivo:** Verificar se você consegue implementar step definitions corretas para cenários Gherkin.

**Passos de Execução:**

1. Dado o cenário abaixo, implemente a step definition para cada linha
2. Use o World com `this.api` (axios) para chamar a API
3. Use `assert.strictEqual` para validações

**Cenário:**
```gherkin
Scenario: Consultar status do pedido
  Given que o cliente "João" tem um pedido #456
  When o cliente consulta o status do pedido #456
  Then o status retornado deve ser "Pendente"
```

**Entrega:** crie `entregas-aula-15/06-step-definitions.md`:

```markdown
# Questão 6 — Step Definitions

## Step: Given

```typescript
[Implementação do Given]
```

## Step: When

```typescript
[Implementação do When]
```

## Step: Then

```typescript
[Implementação do Then]
```

## Reflexão

O que você faria diferente se o pedido #456 não existisse? [Descreva como tratar esse erro na step definition]

## Conclusão

Em 2-3 frases: qual a maior dificuldade ao traduzir Gherkin para step definitions?
```

---

## Questão 7: Living Documentation

**Conceito-chave:** Living Documentation (Aula 15, Seção 6).

**Objetivo:** Comprovar que você entende o conceito e por que ele é mais confiável que documentação tradicional.

**Passos de Execução:**

1. Defina Living Documentation com suas palavras
2. Explique por que cenários Gherkin executáveis produzem documentação viva
3. Compare o ciclo tradicional de documentação com o ciclo de Living Documentation
4. Descreva como você convenceria seu time a adotar Living Documentation

**Entrega:** crie `entregas-aula-15/07-living-documentation.md`:

```markdown
# Questão 7 — Living Documentation

## Definição

[Defina Living Documentation com suas palavras]

## Por que Gherkin produz documentação viva?

[Explique a relação: executável → sempre atualizado → confiável]

## Ciclo tradicional vs Living Documentation

| Aspecto | Documentação Tradicional | Living Documentation |
|---|---|---|
| Formato | | |
| Atualização | | |
| Confiabilidade | | |
| Quem mantém | | |

## Como convencer o time

[Descreva argumentos práticos]

## Conclusão

Em 2-3 frases: qual o maior benefício da Living Documentation para você?
```

---

## Questão 8: 🤖 Agent Perspective — Geração com Agente

**Conceito-chave:** Geração automática de step definitions com agente de IA (Aula 15, Seção 7).

**Objetivo:** Verificar se você sabe usar um agente para acelerar a escrita de step definitions e, mais importante, revisar criticamente o output do agente.

**Passos de Execução:**

1. Escolha um dos 10 cenários Gherkin da Seção 4 (ex: cenário 10 — pagamento recusado)
2. Escreva um prompt claro para o agente, especificando: framework (Cucumber.js), linguagem (TypeScript), estrutura da API (REST em localhost:3000), e que o World tem `this.api`
3. Execute o prompt em um agente de IA (ChatGPT, Claude, Gemini, etc.)
4. Copie o output do agente
5. Identifique pelo menos 3 problemas ou imprecisões no output (ex: endpoint errado, tipo incorreto, asserção faltando)
6. Corrija os problemas manualmente e apresente a versão final

**Entrega:** crie `entregas-aula-15/08-agent-perspective.md`:

```markdown
# Questão 8 — Agente + Step Definitions

## Cenário escolhido

```gherkin
[Cole o cenário Gherkin aqui]
```

## Prompt para o agente

```
[Escreva o prompt completo]
```

## Output do agente (bruto)

```typescript
[Cole o output do agente aqui]
```

## Problemas identificados

| # | Problema | Por que é um problema | Correção aplicada |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Versão final corrigida

```typescript
[Cole a versão final com as correções]
```

## Conclusão

Em 3-4 frases: como você avalia o equilíbrio entre produtividade (agente gera rápido) e qualidade (humano revisa)? Em que situações o agente mais ajuda? Em que situações ele mais atrapalha?
```

---

## Checklist Final: Pronto para a Aula 16?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] Consigo explicar a diferença entre SDD (especificação executável) e documentação tradicional
- [ ] Sei distinguir BDD (comportamento externo) de TDD (unidades internas)
- [ ] Identifico os Três Amigos e o papel de cada um na escrita de cenários BDD
- [ ] Escrevo cenários Gherkin com Given, When, Then, And, But, Background e Scenario Outline
- [ ] Sei diferenciar cenários declarativos (o quê) de imperativos (como)
- [ ] Criei e organizei 10 cenários Gherkin para o e-commerce em arquivos .feature
- [ ] Configurei Cucumber.js com TypeScript, World e Hooks
- [ ] Implementei step definitions que traduzem Gherkin para chamadas à API REST
- [ ] Entendo o conceito de Living Documentation e por que Gherkin executável é mais confiável
- [ ] Sei usar um agente de IA para gerar step definitions e, mais importante, revisar e corrigir o output gerado

> *Acertou todos? Você está pronto para a **Aula 16: TDD — Red-Green-Refactor**, onde você vai descer um nível na pirâmide de testes e executar o ciclo completo de TDD para 3 features reais do e-commerce. Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
```

