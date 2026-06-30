---
titulo: "Questões de Aprendizagem — Pirâmide de Testes & Testes Avançados"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: "aula-17"
data: 2026-06-21
---

## Como Usar Este Arquivo

Este arquivo contém **questões de checkpoint** para você validar seu domínio da Aula 17. Cada questão testa um conceito específico da aula.

**Instruções:**

1. Crie uma pasta `entregas/aula17/` no seu repositório de estudos
2. Para cada questão, crie um arquivo separado: `Q1.md`, `Q2.md`, etc.
3. Preencha os templates abaixo com suas respostas
4. Ao final, revise o **Checklist Final** para confirmar que está pronto para a Aula 18

---

## Questão 1: Desenhe a Pirâmide de Testes

**Conceito-chave:** Aula 17, Seção 1 (Pirâmide de Testes)

**Objetivo:** Demonstrar compreensão da proporção ideal entre os níveis de teste e os anti-patterns.

**Passos de Execução:**

1. Desenhe (ou descreva textualmente) uma pirâmide de 3 níveis
2. Identifique qual nível responde a qual pergunta
3. Cite dois anti-patterns e explique por que são prejudiciais

**Entrega:**

```markdown
# Questão 1: Pirâmide de Testes

## Meu Diagrama (descrição textual)

[Nível superior: ________. Quantidade: ________. Pergunta: ________________]
[Nível médio: ________. Quantidade: ________. Pergunta: ________________]
[Nível inferior: ________. Quantidade: ________. Pergunta: ________________]

## Anti-patterns identificados

1. [Nome do anti-pattern]

   Por que é prejudicial: [explique]

2. [Nome do anti-pattern]

   Por que é prejudicial: [explique]

## Proporção sugerida (para cada E2E)

- Testes de integração: ______
- Testes unitários: ______
```

---

## Questão 2: Configure um Teste de Integração com SQLite

**Conceito-chave:** Aula 17, Seção 2.1 (Testes de Integração — Repositório + Banco em Memória)

**Objetivo:** Demonstrar capacidade de escrever um teste de integração usando banco em memória.

**Passos de Execução:**

1. Crie o arquivo `tests/integration/userRepository.test.js`
2. Use `better-sqlite3` com `:memory:`
3. Crie a tabela `users` com campos: `id TEXT PK`, `name TEXT`, `email TEXT`
4. Implemente um `UserRepository` com métodos `save` e `findByEmail`
5. Teste: salvar um usuário e recuperá-lo por e-mail

**Entrega:**

```markdown
# Questão 2: Teste de Integração com SQLite

## Código do teste

\`\`\`javascript
// Cole aqui seu código completo
\`\`\`

## O que testei

- Cenário: ________________________________
- Resultado esperado: ______________________
- Resultado obtido: ________________________

## Por que usei :memory: em vez de um banco real?

[Explique em 2-3 frases]
```

---

## Questão 3: Escreva um Teste E2E de Login

**Conceito-chave:** Aula 17, Seção 3 (Testes E2E com Playwright)

**Objetivo:** Demonstrar capacidade de estruturar um teste E2E com Page Objects.

**Passos de Execução:**

1. Crie um Page Object `LoginPage` com métodos `navigate()`, `fillCredentials(email, password)` e `submit()`
2. Escreva um teste que: acesse a página de login, preencha e-mail/senha, submeta e verifique se foi redirecionado ao dashboard
3. Use `data-testid` nos seletores

**Entrega:**

```markdown
# Questão 3: Teste E2E de Login

## Page Object (LoginPage.js)

\`\`\`javascript
// Cole aqui
\`\`\`

## Teste (login.spec.js)

\`\`\`javascript
// Cole aqui
\`\`\`

## Por que usei data-testid?

[Explique em 2-3 frases]
```

---

## Questão 4: Contrato Pact — Identifique a Falha

**Conceito-chave:** Aula 17, Seção 4 (Testes de Contrato com Pact)

**Objetivo:** Identificar um problema de contrato entre consumidor e provedor.

**Passos de Execução:**

1. Analise o cenário abaixo
2. Identifique o problema de contrato
3. Explique como o Pact detectaria esse problema

**Cenário:** O consumidor (App de Pedidos) espera que `GET /order/123` retorne `{ id, status, items[] }`. O provedor alterou a resposta para `{ orderId, state, products[] }` sem avisar.

**Entrega:**

```markdown
# Questão 4: Problema de Contrato Pact

## Diagnóstico

- O que mudou: ________________________________
- Impacto no consumidor: _______________________
- Como o Pact detectaria: ______________________

## Resolução proposta

[Descreva o processo de resolução em 3-4 passos]
```

---

## Questão 5: Analise Métricas de Performance

**Conceito-chave:** Aula 17, Seção 5 (Testes de Performance com k6)

**Objetivo:** Interpretar métricas de um teste de carga e propor melhorias.

**Passos de Execução:**

1. Analise a saída do k6 abaixo
2. Determine se os thresholds foram atingidos
3. Sugira duas ações de melhoria

**Saída do k6:**
```
http_req_duration...: avg=1200ms  p95=4800ms  p99=9200ms
http_req_failed.....: 2.5%
thresholds:
  http_req_duration: p(95)<2000 => 52% falhou
  http_req_failed: rate<0.01   => 100% falhou
```

**Entrega:**

```markdown
# Questão 5: Análise de Performance

## Diagnóstico

- p95 está ______ o threshold → [aprovado/reprovado]
- p99: ________
- Taxa de erro: ________ → [dentro/fora] do esperado

## Ações de melhoria sugeridas

1. [Ação 1]
2. [Ação 2]

## Explicação

[Explique por que essas ações resolveriam o problema]
```

---

## Questão 6: Property-Based Testing para Validação de CPF

**Conceito-chave:** Aula 17, Seção 6 (Property-Based Testing)

**Objetivo:** Aplicar property-based testing para validar uma propriedade de negócio.

**Passos de Execução:**

1. Defina uma propriedade: "para qualquer lista de compras com 1+ itens, o total é sempre >= o item mais caro"
2. Escreva o teste com fast-check
3. Execute mentalmente e explique por que a propriedade é verdadeira

**Entrega:**

```markdown
# Questão 6: Property-Based Testing

## Propriedade definida

[Descreva a propriedade em linguagem natural]

## Código do teste

\`\`\`javascript
const fc = require('fast-check');

test('total >= maior item', () => {
  fc.assert(
    fc.property(
      // gere inputs aqui
      [________________],
      (items) => {
        // implemente a verificação
        ________________
      }
    )
  );
});
\`\`\`

## Por que essa propriedade é sempre verdadeira?

[Explique]
```

---

## Questão 7: Decisão de Mock vs. Real

**Conceito-chave:** Aula 17, Seção 2.3 (Mock vs. Componente Real)

**Objetivo:** Decidir corretamente quando usar mock e quando usar componente real.

**Passos de Execução:**

1. Para cada cenário, decida: **Mock** ou **Real**
2. Justifique sua decisão

**Cenários:**

| # | Cenário | Mock ou Real? | Justificativa |
|---|---|---|---|
| A | Testar consulta SQL com filtro JOIN | | |
| B | Testar envio de e-mail de boas-vindas | | |
| C | Testar integração com API de pagamentos externa | | |
| D | Testar lógica de cálculo de imposto | | |
| E | Testar cache Redis expirado | | |

**Entrega:**

```markdown
# Questão 7: Mock vs. Real

| Cenário | Decisão | Justificativa |
|---|---|---|
| A | [Mock/Real] | [Por quê?] |
| B | [Mock/Real] | [Por quê?] |
| C | [Mock/Real] | [Por quê?] |
| D | [Mock/Real] | [Por quê?] |
| E | [Mock/Real] | [Por quê?] |
```

---

## Questão 8: Estratégia de Testes para um Microsserviço

**Conceito-chave:** Aula 17, Seções 1–7 (Visão geral da estratégia)

**Objetivo:** Projetar uma estratégia de testes completa para um microsserviço real.

**Passos de Execução:**

1. Considere um microsserviço de **Notificação** que: envia e-mails, SMS e push notifications; consulta um banco de templates; e chama APIs externas de entrega
2. Para cada nível da pirâmide, descreva um teste específico
3. Para cada teste, indique: o que testar, a ferramenta, e o que mockar

**Entrega:**

```markdown
# Questão 8: Estratégia de Testes — Microsserviço de Notificação

| Nível | O que testar | Ferramenta | Mocks |
|---|---|---|---|
| Unitário | | | |
| Integração | | | |
| Contrato | | | |
| E2E | | | |
| Performance | | | |

## Reflexão

Qual nível você acha mais crítico para este serviço? Por quê?
```
---

## Checklist Final: Pronto para a Aula 18?

Revise os itens abaixo. Marque `[x]` para cada conceito que você domina.

- [ ] Entendo a pirâmide de testes e seus três níveis
- [ ] Consigo identificar anti-patterns (pirâmide invertida, cone de sorvete, cupcake)
- [ ] Sei escrever um teste de integração com banco em memória (SQLite)
- [ ] Sei quando usar mock vs. componente real em testes de integração
- [ ] Consigo estruturar um teste E2E com Playwright e Page Objects
- [ ] Entendo o modelo Consumer-Driven Contracts com Pact
- [ ] Sei interpretar métricas p95 e p99 em testes de carga com k6
- [ ] Consigo aplicar property-based testing para validar invariantes
- [ ] Entendo a diferença entre cobertura de linhas e cobertura de branches
- [ ] Sei o que NÃO testar (getters, setters, configuração, código de terceiros)

**Teaser da Aula 18:** Na próxima aula, você vai colocar tudo isso em um pipeline CI/CD com GitHub Actions — testes automáticos em cada pull request, gates de cobertura e performance, e deploy contínuo. Prepare seus testes!
