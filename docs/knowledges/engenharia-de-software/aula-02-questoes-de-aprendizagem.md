---
titulo: "Exercícios de Aprendizagem — Clean Code"
modulo: "Engenharia de Software"
tipo: "checkpoint-pratico"
aula_referencia: 2
data: 2026-06-21
---

# Questões de Aprendizagem — Clean Code

## Como Usar Este Arquivo

Este arquivo é um **checkpoint prático** para você verificar se dominou os conceitos da Aula 02. Diferente dos exercícios com gabarito da aula principal, aqui você não tem respostas prontas — é você contra o código.

A pergunta central é: *"eu realmente entendi a matéria?"*

**Instruções:**

1. Leia a questão e entenda o **objetivo** (o que precisa demonstrar)
2. Siga os **passos de execução** na ordem — eles são o seu roteiro
3. Produza a **entrega** descrita em cada questão
4. Crie a pasta `entregas-aula-02/` na raiz do projeto e salve cada entrega como `q<N>-<nome>.md`
5. Só avance para a próxima questão quando concluir a atual

Cada questão referencia a seção exata da Aula 02 — se travar, releia a seção indicada. Se ainda assim travar, isso é um sinal de que precisa revisar o conceito antes de seguir.

---

## Questão 1: Análise de Nomes — O que Cada Nome Revela?

**Conceito-chave:** Nomenclatura — Nomes que Revelam Intenção (Aula 02, Seção 2).

**Objetivo:** Demonstrar que você identifica nomes que não revelam intenção e sabe renomeá-los seguindo boas práticas.

**Passos de Execução:**

1. Leia o código e identifique pelo menos 5 nomes ruins (variáveis, funções, parâmetros)
2. Para cada nome, explique POR QUE ele é problemático usando um dos critérios da Seção 2 (buscável, pronunciável, abreviação, encoding de tipo, comment test)
3. Renomeie cada um aplicando os princípios de nomes reveladores de intenção

**Entrega:** crie `entregas-aula-02/q01-analise-nomes.md`:

```markdown
# Questão 1 — Análise de Nomes

## Código analisado

```typescript
function calc(a: number, b: number, c: string) {
  const d = a * 0.15;
  const e = c.toLowerCase();
  return { val: d, str: e, flag: a > 100 };
}
```

## Tabela de nomes problemáticos

| Nome Original | Problema | Renomeado para | Justificativa |
|---|---|---|---|
| `calc` | | | |
| `a` | | | |
| `b` | | | |
| `c` | | | |
| `d` | | | |
| `e` | | | |
| `val` | | | |
| `str` | | | |
| `flag` | | | |

## Código refatorado (completo)

```typescript
// Cole aqui o código com todos os nomes corrigidos
```

## Conclusão

Em 2-3 frases: qual princípio de nomenclatura foi mais útil para identificar os problemas? Por quê?
```

---

## Questão 2: Extrair Função — Decompondo um Bloco Coeso

**Conceito-chave:** Funções — Extract Method e SLAP (Aula 02, Seção 3).

**Objetivo:** Demonstrar que você sabe identificar um bloco coeso dentro de uma função e extraí-lo como uma função separada com nome revelador.

**Passos de Execução:**

1. Identifique no código abaixo qual bloco pode ser extraído como função separada
2. Extraia o bloco para uma nova função com nome que revela intenção
3. A nova função deve ter ≤ 10 linhas e um único nível de abstração
4. Substitua o bloco original pela chamada da nova função

```typescript
function createOrder(req: any, res: any) {
  const { items, customerId } = req.body;
  if (!items || items.length === 0) {
    res.status(400).json({ error: 'Pedido sem itens' });
    return;
  }
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  if (total > 500) {
    total = total * 0.95;
  }
  const shipping = total > 300 ? 0 : 15;
  const finalTotal = total + shipping;
  res.status(201).json({ customerId, items, total: finalTotal });
}
```

**Entrega:** crie `entregas-aula-02/q02-extrair-funcao.md`:

```markdown
# Questão 2 — Extrair Função

## Bloco identificado para extração

Descreva qual bloco você escolheu e por que ele é coeso:

## Função extraída

```typescript
// Sua função extraída aqui
```

## Código refatorado completo

```typescript
// O código completo com a chamada à nova função
```

## Reflexão

Quantas linhas a função principal perdeu? O que melhorou na legibilidade?
```

---

## Questão 3: SLAP — Reorganizando Abstraction Levels

**Conceito-chave:** Funções — SLAP (Single Level of Abstraction Principle) (Aula 02, Seção 3).

**Objetivo:** Demonstrar que você identifica níveis de abstração misturados e sabe reorganizar o código para que cada função tenha um único nível.

**Passos de Execução:**

1. Identifique os 3 níveis de abstração misturados na função abaixo
2. Extraia cada nível para uma função separada
3. A função principal deve conter apenas chamadas de alto nível (orquestração)

```typescript
async function handlePayment(paymentData: any) {
  const errors: string[] = [];
  if (!paymentData.amount || paymentData.amount <= 0) errors.push('Valor inválido');
  if (!paymentData.method) errors.push('Método de pagamento não informado');
  if (errors.length > 0) throw new Error(errors.join(', '));
  const processed = {
    id: Math.random().toString(36).substring(2),
    amount: paymentData.amount,
    method: paymentData.method,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await db.query('INSERT INTO payments SET ?', [processed]);
  const formatted = 'R$ ' + processed.amount.toFixed(2).replace('.', ',');
  return { ...processed, formattedAmount: formatted };
}
```

**Entrega:** crie `entregas-aula-02/q03-slap.md`:

```markdown
# Questão 3 — Reorganizando Abstraction Levels

## Níveis de abstração identificados

| Nível | O que faz | Linhas |
|---|---|---|
| Alto | | |
| Médio | | |
| Baixo | | |

## Funções extraídas

```typescript
// validatePaymentData
// processPayment
// savePayment
// formatPaymentAmount
```

## Código refatorado completo

```typescript
// Código completo com SLAP aplicado
```

## Conclusão

Como a separação por níveis de abstração melhora a legibilidade e a manutenibilidade?
```

---

## Questão 4: DRY e a Regra dos Três

**Conceito-chave:** Estrutura — DRY e Regra dos Três (Aula 02, Seção 4).

**Objetivo:** Demonstrar que você identifica duplicação de conhecimento (não apenas código idêntico) e sabe quando aplicar a Regra dos Três.

**Passos de Execução:**

1. Analise o código abaixo e identifique duplicações (de código e de conhecimento)
2. Classifique cada duplicação como "código" ou "conhecimento"
3. Extraia o conhecimento duplicado para uma função compartilhada
4. Explique por que a Regra dos Três se aplica (ou não) a cada caso

```typescript
function validateCustomer(body: any): string[] {
  const errors: string[] = [];
  if (!body.cpf || body.cpf.replace(/\D/g, '').length < 11) {
    errors.push('CPF inválido');
  }
  return errors;
}

function formatCustomer(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function sanitizeDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  return digits;
}

function validateOrderCpf(body: any): string[] {
  const errors: string[] = [];
  const doc = body.customerCpf;
  if (!doc || doc.replace(/\D/g, '').length < 11) {
    errors.push('CPF do cliente inválido');
  }
  return errors;
}
```

**Entrega:** crie `entregas-aula-02/q04-dry-regra-tres.md`:

```markdown
# Questão 4 — DRY e a Regra dos Três

## Duplicações identificadas

| Código duplicado | Tipo (código/conhecimento) | Quantas vezes repete | Aplica Regra dos Três? |
|---|---|---|---|
| | | | |
| | | | |

## Conhecimento que pode ser extraído

Descreva qual regra de negócio está duplicada:

## Função extraída

```typescript
// Função que centraliza o conhecimento duplicado
```

## Código refatorado

```typescript
// Código completo usando a função extraída
```

## Reflexão

Esta duplicação é de código ou de conhecimento? Qual a consequência de NÃO extrair?
```

---

## Questão 5: YAGNI vs DRY — Decidindo Quando Aplicar Cada Um

**Conceito-chave:** Estrutura — YAGNI e conflito com DRY (Aula 02, Seção 4).

**Objetivo:** Demonstrar que você sabe analisar uma situação e decidir qual princípio prevalece — YAGNI ou DRY.

**Passos de Execução:**

1. Analise cada cenário abaixo
2. Decida se YAGNI ou DRY deve prevalecer
3. Justifique sua decisão com base no contexto
4. Para os casos onde YAGNI vence, explique qual abstração especulativa está sendo evitada

**Cenário A:** Você está criando um endpoint de cadastro de cliente. Pensa em criar uma interface `CustomerRepository` com 8 métodos (`findById`, `findByEmail`, `findByDocument`, `findAll`, `findPaginated`, `save`, `update`, `delete`). Hoje você só precisa de `save` e `findByEmail`.

**Cenário B:** Você tem a validação de CPF (`isCpfValid`) em 3 controllers diferentes, cada um implementando a mesma lógica de dígitos verificadores com pequenas variações.

**Cenário C:** Você está criando uma função `calculateShipping` que hoje só tem um método de cálculo (sedex). Você pensa em criar um `ShippingStrategy` com interface e implementações para cada transportadora futura.

**Entrega:** crie `entregas-aula-02/q05-yagni-vs-dry.md`:

```markdown
# Questão 5 — YAGNI vs DRY

## Análise dos cenários

### Cenário A: CustomerRepository com 8 métodos

- Princípio que prevalece: YAGNI / DRY (circule um)
- Justificativa:
- Abstração especulativa (se YAGNI vencer):

### Cenário B: Validação de CPF em 3 lugares

- Princípio que prevalece: YAGNI / DRY (circule um)
- Justificativa:
- Abstração especulativa (se YAGNI vencer):

### Cenário C: ShippingStrategy

- Princípio que prevalece: YAGNI / DRY (circule um)
- Justificativa:
- Abstração especulativa (se YAGNI vencer):

## Conclusão

Em 2-3 frases: qual critério você usou para decidir quando YAGNI deve prevalecer sobre DRY?
```

---

## Questão 6: Lei de Demeter — Caça às Violações

**Conceito-chave:** Estrutura — Lei de Demeter (Aula 02, Seção 4).

**Objetivo:** Demonstrar que você identifica violações da Lei de Demeter em encadeamentos de método e sabe como corrigi-las.

**Passos de Execução:**

1. Identifique 3 violações da Lei de Demeter no código abaixo
2. Para cada violação, descreva quantos objetos estão sendo atravessados
3. Corrija cada violação expondo métodos nos objetos intermediários ou desestruturando

```typescript
function sendOrderConfirmation(order: any) {
  const email = order.customer.contact.email.address;
  const name = order.customer.personal.name;
  const city = order.shipping.address.city.toUpperCase();
  const discount = order.pricing.details.discount.percentage;

  sendEmail({
    to: email,
    subject: `Pedido confirmado para ${name}`,
    body: `Seu pedido será entregue em ${city}`,
  });
}
```

**Entrega:** crie `entregas-aula-02/q06-lei-demeter.md`:

```markdown
# Questão 6 — Lei de Demeter

## Violações identificadas

| Expressão | Objetos atravessados | Quantos níveis | Correção |
|---|---|---|---|
| `order.customer.contact.email.address` | | | |
| | | | |
| | | | |

## Código corrigido

```typescript
// Código completo respeitando a Lei de Demeter
```

## Reflexão

Qual o principal problema de manutenção causado por violações da Lei de Demeter? Como a correção melhora a capacidade de evoluir o código?
```

---

## Questão 7: Refatoração Completa — Aplicando Tudo

**Conceito-chave:** Integração de Nomes, Funções e Estrutura (Aula 02, Seções 2, 3, 4 e 5).

**Objetivo:** Demonstrar que você consegue refatorar um controller real aplicando TODOS os princípios da aula simultaneamente: nomenclatura, funções pequenas com SLAP, DRY, CQS e Lei de Demeter.

**Passos de Execução:**

1. Leia o código abaixo e identifique todos os problemas (nomes, tamanho, SLAP, DRY, side effects, Demeter)
2. Crie um plano de refatoração listando cada problema e a solução proposta
3. Refatore o código completamente — cada função deve ter ≤ 15 linhas
4. O handler principal deve ser uma orquestração de alto nível com no máximo 15 linhas
5. Valide que o código refatorado não tem violações de CQS (comandos não retornam valor)

```typescript
import { db } from '../database';

export function del(x: any, y: any) {
  const id = x.params.id;
  if (!id) { y.status(400).json({ error: 'ID é obrigatório' }); return; }
  const existing = db.query('SELECT * FROM categories WHERE id = ?', [id]);
  if (existing.length === 0) { y.status(404).json({ error: 'Categoria não encontrada' }); return; }
  const cat = existing[0];
  const children = db.query('SELECT id FROM categories WHERE parent_id = ?', [id]);
  if (children.length > 0) {
    y.status(409).json({ error: 'Categoria possui subcategorias', count: children.length });
    return;
  }
  const products = db.query('SELECT id FROM products WHERE category_id = ?', [id]);
  if (products.length > 0) {
    y.status(409).json({ error: 'Categoria possui produtos associados', count: products.length });
    return;
  }
  const deleted = db.query('DELETE FROM categories WHERE id = ?', [id]);
  if (deleted.affectedRows === 0) { y.status(500).json({ error: 'Erro ao excluir' }); return; }
  const result = { id: cat.id, name: cat.name, deleted: true, deletedAt: new Date().toISOString() };
  y.status(200).json(result);
}
```

**Entrega:** crie `entregas-aula-02/q07-refatoracao-completa.md`:

```markdown
# Questão 7 — Refatoração Completa

## Plano de refatoração

| Problema | Onde está | Solução proposta |
|---|---|---|
| Nome genérico | `del` | Renomear para `deleteCategory` |
| | | |
| | | |
| | | |

## Código refatorado

```typescript
// Código completo refatorado
```

## Checklist de princípios aplicados

- [ ] Nomes revelam intenção em todas as funções e variáveis
- [ ] Cada função tem ≤ 15 linhas
- [ ] SLAP aplicado — um nível de abstração por função
- [ ] DRY aplicado — sem duplicação de conhecimento
- [ ] CQS respeitado — comandos não retornam valor
- [ ] Lei de Demeter respeitada
- [ ] Handler principal com no máximo 15 linhas

## Reflexão final

Em 3-5 frases: o que mudou da versão original para a refatorada? Como você validaria que o comportamento não mudou?
```

---

## Checklist Final: Pronto para a Aula 03?

Marque cada item só quando conseguir fazê-lo **sem consultar a aula**:

- [ ] **Identificar nomes ruins**: consigo apontar nomes genéricos, abreviações e nomes não buscáveis em qualquer código
- [ ] **Renomear para revelar intenção**: consigo renomear variáveis, funções e classes seguindo boas práticas
- [ ] **Aplicar SLAP**: consigo reorganizar uma função que mistura níveis de abstração
- [ ] **Extrair método**: consigo identificar blocos coesos e extraí-los como funções nomeadas
- [ ] **Aplicar DRY**: consigo diferenciar duplicação de código de duplicação de conhecimento
- [ ] **Decidir entre YAGNI e DRY**: consigo analisar um cenário e decidir qual princípio aplicar
- [ ] **Identificar Lei de Demeter**: consigo encontrar violações de acoplamento em encadeamentos
- [ ] **Refatorar um controller**: consigo transformar um controller Express de 50+ linhas em funções coesas
- [ ] **Usar ESLint para clean code**: consigo configurar regras de max-lines, max-params e complexity
- [ ] **Usar git diff para validar**: consigo fazer commits atômicos de cada extração

> *Acertou todos? Você está pronto para a Aula 03: Refactoring — Catálogo e Prática, onde vai organizar code smells em 4 famílias e aplicar o catálogo completo de refatorações do Fowler com segurança usando testes e ESLint.*
>
> *Travou em algum? Releia a seção indicada na questão correspondente antes de avançar.*
